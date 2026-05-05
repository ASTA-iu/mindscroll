/**
 * MODERATION INTEGRATION SERVICE
 * Acts as the AI moderation engine for MindScroll
 * Analyzes text, images, and videos for educational content
 * 
 * Rules:
 * - Memes, distracting content, NSFW, violence, drugs = 0% educational = REJECTED
 * - Educational content = APPROVED with score ≥ 50%
 */

const TextAnalysisService = require('./textAnalysisService');
const ImageAnalysisService = require('./imageAnalysisService');
const VideoAnalysisService = require('./videoAnalysisService');
const HFModerationService = require('./hfModerationService');
const ContentIntegrationService = require('./contentIntegrationService');

class ModerationIntegrationService {
  constructor(apiKey, openrouterKey) {
    this.textAnalysis = new TextAnalysisService(apiKey);
    this.imageAnalysis = new ImageAnalysisService(apiKey, openrouterKey);
    this.videoAnalysis = new VideoAnalysisService(apiKey, openrouterKey);
    this.hfModeration = new HFModerationService(apiKey);
    this.contentIntegration = new ContentIntegrationService(apiKey, openrouterKey);
  }

  /**
   * MAIN MODERATION FUNCTION
   * Analyzes incoming content and makes approval/rejection decision
   * 
   * @param {Object} content - { text, image, videoUrl, videoFileName }
   * @returns {Object} - { approved: bool, score: number, reason: string, details: {}, violations: [] }
   */
  async moderateContent(content) {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║     🤖 AI MODERATION ENGINE - ANALYZING SUBMISSION        ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const { text, image, videoUrl } = content;
    const violations = [];
    const details = {
      textAnalysis: null,
      imageAnalysis: null,
      videoAnalysis: null,
      integratedAnalysis: null
    };

    // ═════════════════════════════════════════════════════════════
    // STEP 1: CONTENT PRESENCE CHECK
    // ═════════════════════════════════════════════════════════════
    if (!text && !image && !videoUrl) {
      return {
        approved: false,
        score: 0,
        reason: 'No content provided',
        violations: ['empty_submission'],
        details
      };
    }

    console.log('📋 CONTENT SUBMISSION DETECTED:');
    if (text) console.log(`   📝 Text: "${text.substring(0, 60)}${text.length > 60 ? '...' : ''}"`);
    if (image) console.log(`   🖼️  Image: Present (${(image.length / 1024).toFixed(1)}KB)`);
    if (videoUrl) console.log(`   🎬 Video: ${videoUrl.substring(0, 50)}...`);

    // ═════════════════════════════════════════════════════════════
    // STEP 2: INDEPENDENT VIOLATION DETECTION
    // ═════════════════════════════════════════════════════════════
    // CRITICAL: Each content type is checked INDEPENDENTLY
    // If ANY type contains violations, the entire post is rejected
    // Educational text does NOT excuse inappropriate images/videos
    // ═════════════════════════════════════════════════════════════
    console.log('\n🚨 VIOLATION SCANNING (INDEPENDENT CHECKS)...\n');
    console.log('   ⚠️  Note: Violations are checked INDEPENDENTLY');
    console.log('   📌 Educational text ≠ Educational image\n');

    // 2A: TEXT ANALYSIS FOR VIOLATIONS (INDEPENDENT)
    if (text) {
      console.log('📝 TEXT VIOLATION CHECK (Independent):');
      try {
        const textMod = await this.hfModeration.moderatePost(text, '');
        details.textAnalysis = textMod;

        if (textMod && !textMod.allowed) {
          console.log(`   ❌ TEXT VIOLATIONS FOUND: ${textMod.violations.join(', ')}`);
          violations.push(...textMod.violations.map(v => `text_${v}`));
        } else {
          console.log('   ✅ Text: No violations detected');
        }
      } catch (e) {
        console.warn(`   ⚠️  Text moderation error: ${e.message}`);
      }
    }

    // 2B: IMAGE ANALYSIS FOR VIOLATIONS (INDEPENDENT)
    if (image) {
      console.log('🖼️  IMAGE VIOLATION CHECK (Independent):');
      try {
        const imgAnalysis = await this.imageAnalysis.analyze(image);
        details.imageAnalysis = imgAnalysis;

        // Check NSFW/Explicit content
        if (imgAnalysis?.nsfw || imgAnalysis?.blocked) {
          console.log(`   ❌ IMAGE: NSFW/EXPLICIT CONTENT DETECTED (score: ${imgAnalysis.nsfwScore || 'high'})`);
          violations.push('image_nsfw');
        }
        // Check violence
        if (imgAnalysis?.violence || imgAnalysis?.violenceScore > 0.5) {
          console.log(`   ❌ IMAGE: VIOLENCE DETECTED (score: ${imgAnalysis.violenceScore || 'high'})`);
          violations.push('image_violence');
        }
        
        if (!imgAnalysis?.nsfw && !imgAnalysis?.violence && !imgAnalysis?.blocked) {
          console.log('   ✅ Image: No violations detected');
        }
      } catch (e) {
        console.warn(`   ⚠️  Image analysis error: ${e.message}`);
      }
    }

    // 2C: VIDEO ANALYSIS FOR VIOLATIONS (INDEPENDENT)
    if (videoUrl) {
      console.log('🎬 VIDEO VIOLATION CHECK (Independent):');
      try {
        const vidAnalysis = await this.videoAnalysis.analyze(videoUrl);
        details.videoAnalysis = vidAnalysis;

        // Check NSFW/Explicit content
        if (vidAnalysis?.nsfw || vidAnalysis?.blocked) {
          console.log(`   ❌ VIDEO: NSFW/EXPLICIT CONTENT DETECTED`);
          violations.push('video_nsfw');
        }
        // Check violence
        if (vidAnalysis?.violence) {
          console.log(`   ❌ VIDEO: VIOLENCE DETECTED`);
          violations.push('video_violence');
        }
        
        if (!vidAnalysis?.nsfw && !vidAnalysis?.violence && !vidAnalysis?.blocked) {
          console.log('   ✅ Video: No violations detected');
        }
      } catch (e) {
        console.warn(`   ⚠️  Video analysis error: ${e.message}`);
      }
    }

    // 2D: TEXT MEME/DISTRACTING CONTENT CHECK (INDEPENDENT)
    if (text) {
      console.log('🎭 TEXT MEME/DISTRACTION CHECK (Independent):');
      const memeIndicators = /\b(meme|lol|lmao|haha|rofl|joke|funny|when you|it's giving|caught in 4k|mood|vibes?|slay|bussin|no cap|fr fr|bestie|sis|periodt)\b/gi;
      if (memeIndicators.test(text)) {
        console.log(`   ❌ TEXT: MEME/DISTRACTING CONTENT DETECTED`);
        violations.push('text_meme_content');
      } else {
        console.log('   ✅ Text: No meme/distraction indicators');
      }
    }

    // If violations found, REJECT IMMEDIATELY
    // CRITICAL: Violation in ANY content type = automatic rejection
    // This is true even if other content types are educational
    if (violations.length > 0) {
      console.log('\n' + '═'.repeat(60));
      console.log('❌ REJECTION: CONTENT VIOLATES PLATFORM GUIDELINES');
      console.log('═'.repeat(60));
      console.log('\n📋 VIOLATIONS DETECTED (Independent Check):');
      
      // Categorize violations by content type for clarity
      const textViolations = violations.filter(v => v.startsWith('text_'));
      const imageViolations = violations.filter(v => v.startsWith('image_'));
      const videoViolations = violations.filter(v => v.startsWith('video_'));
      
      if (textViolations.length > 0) {
        console.log(`   📝 Text: ${textViolations.join(', ')}`);
      }
      if (imageViolations.length > 0) {
        console.log(`   🖼️  Image: ${imageViolations.join(', ')}`);
      }
      if (videoViolations.length > 0) {
        console.log(`   🎬 Video: ${videoViolations.join(', ')}`);
      }
      
      console.log('\n⚠️  NOTE: Violations are checked independently.');
      console.log('   Educational content in one type does NOT excuse');
      console.log('   violations in another type.\n');
      console.log('═'.repeat(60) + '\n');
      
      return {
        approved: false,
        score: 0,
        reason: 'This content goes against platform guidelines',
        violations,
        details,
        educationalScore: 0,
        category: 'VIOLATION_DETECTED',
        message: '❌ Content rejected: Independent violation check detected prohibited content in one or more content types.'
      };
    }

    console.log('✅ No violations detected - proceeding to educational analysis\n');

    // ═════════════════════════════════════════════════════════════
    // STEP 3: EDUCATIONAL CONTENT ANALYSIS
    // ═════════════════════════════════════════════════════════════
    console.log('📚 EDUCATIONAL VALUE ANALYSIS\n');

    let educationalScore = 0;
    let textScore = 50;
    let imageScore = 50;
    let videoScore = 50;

    // Multi-signal analysis based on what we have
    if (text && image && !videoUrl) {
      // Caption + Image
      console.log('🔗 MODE: Caption + Image Analysis');
      try {
        const integrated = await this.contentIntegration.analyzeFullContent({
          caption: text,
          imageData: image,
          includeVisualFeatures: true
        });
        details.integratedAnalysis = integrated;
        textScore = integrated.textScore || 50;
        imageScore = integrated.imageScore || 50;
        educationalScore = integrated.educationalScore || 50;
        console.log(`   📝 Text Score: ${textScore}%`);
        console.log(`   🖼️  Image Score: ${imageScore}%`);
        console.log(`   🎯 Combined Score: ${educationalScore}%`);
      } catch (e) {
        console.warn(`⚠️  Integrated analysis failed: ${e.message}`);
        educationalScore = this._calculateScore(textScore, imageScore, videoScore);
      }
    } else if (image && !text && !videoUrl) {
      // Image only
      console.log('🔗 MODE: Image-Only Analysis');
      try {
        const integrated = await this.contentIntegration.analyzeFullContent({
          caption: '',
          imageData: image,
          includeVisualFeatures: true
        });
        details.integratedAnalysis = integrated;
        imageScore = integrated.imageScore || 50;
        educationalScore = integrated.educationalScore || 50;
        console.log(`   🖼️  Image Score: ${imageScore}%`);
        console.log(`   🎯 Education Score: ${educationalScore}%`);
      } catch (e) {
        console.warn(`⚠️  Image analysis failed: ${e.message}`);
        educationalScore = imageScore;
      }
    } else {
      // Text only, video, or other combinations
      console.log('📊 MODE: Parallel Analysis');
      const analysisResults = await Promise.allSettled([
        text ? this.textAnalysis.analyze(text) : Promise.resolve(null),
        image ? this.imageAnalysis.analyze(image) : Promise.resolve(null),
        videoUrl ? this.videoAnalysis.analyze(videoUrl) : Promise.resolve(null)
      ]);

      textScore = analysisResults[0]?.value?.score ?? null;
      imageScore = analysisResults[1]?.value?.score ?? null;
      videoScore = analysisResults[2]?.value?.score ?? null;

      details.textAnalysis = analysisResults[0]?.value;
      details.imageAnalysis = analysisResults[1]?.value;
      details.videoAnalysis = analysisResults[2]?.value;

      if (text) console.log(`   📝 Text Score: ${textScore}%`);
      if (image) console.log(`   🖼️  Image Score: ${imageScore}%`);
      if (videoUrl) console.log(`   🎬 Video Score: ${videoScore}%`);

      educationalScore = this._calculateScore(textScore, imageScore, videoScore);
      console.log(`   🎯 Combined Score: ${educationalScore}%`);
    }

    // ═════════════════════════════════════════════════════════════
    // STEP 4: FINAL DECISION
    // ═════════════════════════════════════════════════════════════
    console.log('\n' + '═'.repeat(60));
    console.log('🔐 INDEPENDENT VALIDATION COMPLETE');
    console.log('   ✅ No violations detected in any content type');
    console.log('   ✅ Each content type validated independently');
    console.log('═'.repeat(60));

    const isApproved = educationalScore >= 50;
    const reason = isApproved
      ? `Educational content approved (${educationalScore}% educational value)`
      : 'This content goes against platform guidelines';

    if (isApproved) {
      console.log(`\n✅ APPROVED: Content meets educational standards`);
      console.log(`   📊 Educational Score: ${educationalScore}%`);
      console.log('   ✅ Passed independent violation check on all content types');
      console.log('═'.repeat(60) + '\n');
      return {
        approved: true,
        score: educationalScore,
        reason,
        violations: [],
        details,
        educationalScore,
        category: 'EDUCATIONAL',
        message: '✅ Content approved! This post is educational and meets our platform guidelines.'
      };
    } else {
      console.log(`❌ REJECTED: Does not meet educational standards`);
      console.log(`   📊 Educational Score: ${educationalScore}% (minimum: 50%)`);
      console.log('   ✅ Passed independent violation check on all content types');
      console.log('   ❌ Failed educational value threshold');
      console.log('═'.repeat(60) + '\n');
      return {
        approved: false,
        score: educationalScore,
        reason: 'This content goes against platform guidelines',
        violations: ['insufficient_educational_value'],
        details,
        educationalScore,
        category: 'NON_EDUCATIONAL',
        suggestion: 'Add educational context, factual information, or learning materials to meet our platform standards.'
      };
    }
  }

  /**
   * Calculate combined educational score from individual analyses
   * Only includes scores for content that was actually analyzed (non-null)
   */
  _calculateScore(textScore = null, imageScore = null, videoScore = null) {
    const scores = [textScore, imageScore, videoScore].filter(s => s !== null && s > 0);
    if (scores.length === 0) return 50;
    return Math.round(scores.reduce((a, b) => a + b) / scores.length);
  }

  /**
   * Get detailed analysis report for frontend display
   */
  async getAnalysisReport(content) {
    const result = await this.moderateContent(content);
    return {
      contentAnalysis: {
        submitted: {
          hasText: !!content.text,
          hasImage: !!content.image,
          hasVideo: !!content.videoUrl
        },
        verdict: result.approved ? 'APPROVED' : 'REJECTED',
        educationalScore: result.educationalScore,
        reason: result.reason,
        violations: result.violations,
        message: result.message || result.reason
      },
      details: result.details,
      approved: result.approved
    };
  }
}

module.exports = ModerationIntegrationService;
