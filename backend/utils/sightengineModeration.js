const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

/**
 * Sightengine Moderation Service
 * Checks for NSFW, violence, and offensive content
 */
class SightengineModeration {
  constructor(userId, userSecret) {
    this.userId = userId;
    this.userSecret = userSecret;
    this.baseUrl = 'https://api.sightengine.com/1.0';
  }

  /**
   * Check image for inappropriate content
   * @param {string|Buffer} imageData - Image URL, file path, or buffer
   * @returns {Promise<object>} Moderation scores
   */
  async checkImage(imageData) {
    try {
      console.log('🔍 Running Sightengine image moderation...');

      const formData = new FormData();
      formData.append('models', 'nudity,violence,offensive');
      formData.append('api_user', this.userId);
      formData.append('api_secret', this.userSecret);

      // Handle different input types
      if (typeof imageData === 'string') {
        if (imageData.startsWith('http')) {
          // URL
          formData.append('url', imageData);
        } else if (imageData.startsWith('data:')) {
          // Base64
          const base64Data = imageData.split(',')[1];
          const buffer = Buffer.from(base64Data, 'base64');
          formData.append('media', buffer, 'image.jpg');
        } else {
          // File path
          const buffer = fs.readFileSync(imageData);
          formData.append('media', buffer, 'image.jpg');
        }
      } else if (Buffer.isBuffer(imageData)) {
        formData.append('media', imageData, 'image.jpg');
      }

      const response = await axios.post(`${this.baseUrl}/check.json`, formData, {
        headers: formData.getHeaders(),
        timeout: 30000
      });

      return this.parseResponse(response.data);
    } catch (error) {
      console.error('❌ Sightengine image check error:', error.message);
      // Return neutral scores on error
      return {
        success: false,
        nsfw: 0,
        violence: 0,
        offensive: 0,
        error: error.message
      };
    }
  }

  /**
   * Check video for inappropriate content
   * @param {string} videoUrl - Video URL
   * @returns {Promise<object>} Moderation scores
   */
  async checkVideo(videoUrl) {
    try {
      console.log('🔍 Running Sightengine video moderation...');

      const formData = new FormData();
      formData.append('models', 'nudity,violence,offensive');
      formData.append('api_user', this.userId);
      formData.append('api_secret', this.userSecret);
      formData.append('url', videoUrl);

      const response = await axios.post(`${this.baseUrl}/video/check.json`, formData, {
        headers: formData.getHeaders(),
        timeout: 60000
      });

      return this.parseResponse(response.data);
    } catch (error) {
      console.error('❌ Sightengine video check error:', error.message);
      return {
        success: false,
        nsfw: 0,
        violence: 0,
        offensive: 0,
        error: error.message
      };
    }
  }

  /**
   * Check text for offensive content
   * @param {string} text - Text to check
   * @returns {Promise<object>} Moderation scores
   */
  async checkText(text) {
    try {
      console.log('🔍 Running Sightengine text moderation...');

      if (!text || text.trim().length === 0) {
        return {
          success: true,
          nsfw: 0,
          violence: 0,
          offensive: 0
        };
      }

      const params = new URLSearchParams({
        models: 'offensive',
        api_user: this.userId,
        api_secret: this.userSecret,
        text: text.substring(0, 1000) // Limit to 1000 chars
      });

      const response = await axios.get(`${this.baseUrl}/text/check.json?${params}`, {
        timeout: 15000
      });

      return {
        success: true,
        nsfw: 0, // Text doesn't have NSFW in this context
        violence: response.data.violence?.score || 0,
        offensive: response.data.offensive?.score || 0
      };
    } catch (error) {
      console.error('❌ Sightengine text check error:', error.message);
      return {
        success: false,
        nsfw: 0,
        violence: 0,
        offensive: 0,
        error: error.message
      };
    }
  }

  /**
   * Parse Sightengine response
   */
  parseResponse(data) {
    try {
      const nudity = data.nudity?.score || 0;
      const violence = data.violence?.score || 0;
      const offensive = data.offensive?.score || 0;

      console.log(`  • NSFW: ${(nudity * 100).toFixed(1)}% | Violence: ${(violence * 100).toFixed(1)}% | Offensive: ${(offensive * 100).toFixed(1)}%`);

      return {
        success: true,
        nsfw: nudity,
        violence,
        offensive,
        nuditySummary: data.nudity?.summary || 'none',
        violenceSummary: data.violence?.summary || 'none'
      };
    } catch (error) {
      console.error('  ◦ Response parsing error:', error.message);
      return {
        success: false,
        nsfw: 0,
        violence: 0,
        offensive: 0
      };
    }
  }

  /**
   * Check if content passes moderation (all scores < 0.5)
   */
  isModerated(scores) {
    const THRESHOLD = 0.5;
    return scores.nsfw < THRESHOLD && scores.violence < THRESHOLD && scores.offensive < THRESHOLD;
  }
}

module.exports = SightengineModeration;
