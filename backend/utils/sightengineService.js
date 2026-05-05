/**
 * Comprehensive Sightengine Moderation Service
 * Handles: NSFW, Violence, Offensive content detection
 * Works with: Images, Videos, Audio (transcribed text), and Text
 */

const axios = require('axios');

class SightengineService {
  constructor(userId, apiSecret) {
    this.userId = userId;
    this.apiSecret = apiSecret;
    this.baseUrl = 'https://api.sightengine.com/1.0';
    this.timeout = 10000;
    
    if (!userId || !apiSecret) {
      console.warn('⚠️  Sightengine credentials not configured. Update .env file.');
    }
  }

  /**
   * Check image for NSFW, violence, offensive content
   * @param {string} imageUrl - URL or file path to image
   * @returns {object} - Moderation scores { nsfw, violence, offensive }
   */
  async checkImage(imageUrl) {
    try {
      if (!imageUrl) throw new Error('Image URL required');

      console.log('🔍 Sightengine: Checking image...');

      const response = await axios.get(`${this.baseUrl}/check.json`, {
        params: {
          url: imageUrl,
          apis: 'nudity,offensive,violence,weapons',
          user_id: this.userId,
          api_secret: this.apiSecret
        },
        timeout: this.timeout
      });

      if (response.data.status === 'failure') {
        console.error('❌ Sightengine error:', response.data.error?.message);
        return this.getDefaultScores();
      }

      const scores = {
        nsfw: response.data.nudity?.raw || 0,
        violence: response.data.violence?.raw || 0,
        offensive: response.data.offensive?.raw || 0,
        weapons: response.data.weapons?.raw || 0,
        status: 'success'
      };

      console.log('   ✅ Image checked:', scores);
      return scores;
    } catch (error) {
      console.error('❌ Sightengine image check error:', error.message);
      return this.getDefaultScores('error');
    }
  }

  /**
   * Check video frames for moderation
   * @param {string} videoUrl - URL to video file
   * @returns {object} - Moderation scores across frames
   */
  async checkVideo(videoUrl) {
    try {
      if (!videoUrl) throw new Error('Video URL required');

      console.log('🔍 Sightengine: Checking video...');

      const response = await axios.get(`${this.baseUrl}/video/check-sync.json`, {
        params: {
          video_url: videoUrl,
          apis: 'nudity,offensive,violence,weapons',
          user_id: this.userId,
          api_secret: this.apiSecret
        },
        timeout: 30000 // Longer timeout for video
      });

      if (response.data.status === 'failure') {
        console.error('❌ Sightengine error:', response.data.error?.message);
        return this.getDefaultScores();
      }

      // Aggregate frame data
      const frames = response.data.data || [];
      const scores = {
        nsfw: this.averageMetric(frames, 'nudity'),
        violence: this.averageMetric(frames, 'violence'),
        offensive: this.averageMetric(frames, 'offensive'),
        weapons: this.averageMetric(frames, 'weapons'),
        frameCount: frames.length,
        status: 'success'
      };

      console.log('   ✅ Video checked:', scores);
      return scores;
    } catch (error) {
      console.error('❌ Sightengine video check error:', error.message);
      return this.getDefaultScores('error');
    }
  }

  /**
   * Check text for offensive language
   * @param {string} text - Text content to check
   * @returns {object} - Offensive score
   */
  async checkText(text) {
    try {
      if (!text || text.trim().length === 0) {
        return { offensive: 0, status: 'success' };
      }

      console.log('🔍 Sightengine: Checking text...');

      // Use keyword-based detection for text since Sightengine API primarily handles images/videos
      const offensive = this.scoreText(text);

      console.log('   ✅ Text checked: offensive =', offensive);
      return { offensive, status: 'success' };
    } catch (error) {
      console.error('❌ Sightengine text check error:', error.message);
      return { offensive: 0, status: 'error' };
    }
  }

  /**
   * Comprehensive check for post (text + image + video + audio transcription)
   * @param {object} postData - { text, imageUrl, videoUrl, audioTranscription }
   * @returns {object} - Combined moderation results
   */
  async checkPost(postData = {}) {
    console.log('\n🔎 SIGHTENGINE: Comprehensive Post Moderation');
    console.log('='.repeat(60));

    const results = {
      text: { offensive: 0, status: 'not_checked' },
      image: null,
      video: null,
      audio: { offensive: 0, status: 'not_checked' },
      timestamp: new Date().toISOString()
    };

    // Check text content
    if (postData.text) {
      console.log('\n📝 Checking text...');
      results.text = await this.checkText(postData.text);
    }

    // Check image
    if (postData.imageUrl) {
      console.log('\n🖼️  Checking image...');
      results.image = await this.checkImage(postData.imageUrl);
    }

    // Check video
    if (postData.videoUrl) {
      console.log('\n🎬 Checking video...');
      results.video = await this.checkVideo(postData.videoUrl);
    }

    // Check audio transcription
    if (postData.audioTranscription) {
      console.log('\n🎵 Checking audio transcription...');
      results.audio = await this.checkText(postData.audioTranscription);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 MODERATION RESULTS:');
    console.log(JSON.stringify(results, null, 2));

    return results;
  }

  /**
   * Score text for offensive language using keyword analysis
   * Returns score from 0-1
   */
  scoreText(text) {
    const textLower = text.toLowerCase();
    
    // Offensive/toxic keywords
    const offensiveKeywords = [
      'hate', 'kill', 'die', 'stupid', 'idiot', 'dumb', 'retard',
      'shit', 'fuck', 'bitch', 'asshole', 'bastard', 'whore',
      'racial slur', 'racist', 'sexist', 'homophobic', 'transphobic',
      'discrimination', 'racist jokes', 'offensive jokes', 'hateful'
    ];

    let offensiveCount = 0;
    offensiveKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = textLower.match(regex);
      if (matches) {
        offensiveCount += matches.length;
      }
    });

    // Return score 0-1 (capped at 1.0)
    const score = Math.min(offensiveCount * 0.15, 1.0);
    return score;
  }

  /**
   * Average a metric across video frames
   */
  averageMetric(frames, metric) {
    if (!frames || frames.length === 0) return 0;

    const values = frames
      .map(frame => {
        const section = frame[metric];
        return section?.raw || 0;
      })
      .filter(v => v !== undefined);

    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Get default scores for error cases
   */
  getDefaultScores(status = 'not_checked') {
    return {
      nsfw: 0,
      violence: 0,
      offensive: 0,
      weapons: 0,
      status: status
    };
  }

  /**
   * Make moderation decision based on scores
   * @param {object} scores - Moderation scores
   * @returns {object} - Decision with reason
   */
  makeModerationDecision(scores) {
    const thresholds = {
      nsfw: 0.3,
      violence: 0.3,
      offensive: 0.35,
      weapons: 0.25
    };

    const violations = [];

    if (scores.nsfw > thresholds.nsfw) {
      violations.push(`NSFW content (${(scores.nsfw * 100).toFixed(1)}%)`);
    }
    if (scores.violence > thresholds.violence) {
      violations.push(`Violence (${(scores.violence * 100).toFixed(1)}%)`);
    }
    if (scores.offensive > thresholds.offensive) {
      violations.push(`Offensive content (${(scores.offensive * 100).toFixed(1)}%)`);
    }
    if (scores.weapons > thresholds.weapons) {
      violations.push(`Weapons detected (${(scores.weapons * 100).toFixed(1)}%)`);
    }

    return {
      allowed: violations.length === 0,
      violations: violations,
      reason: violations.length > 0 
        ? `Rejected: ${violations.join(', ')}`
        : 'Approved: Content passes moderation'
    };
  }
}

module.exports = SightengineService;
