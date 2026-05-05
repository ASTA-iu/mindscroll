const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Import analysis services
const TextAnalysisService = require('../utils/textAnalysisService');
const ImageAnalysisService = require('../utils/imageAnalysisService');
const VideoAnalysisService = require('../utils/videoAnalysisService');
const AudioAnalysisService = require('../utils/audioAnalysisService');
const HFModerationService = require('../utils/hfModerationService');
const decisionEngine = require('../utils/decisionEngine');

// Initialize services
const textAnalysis = new TextAnalysisService(process.env.AI_API_KEY);
const imageAnalysis = new ImageAnalysisService(process.env.AI_API_KEY, process.env.openrouter_API_KEY);
const videoAnalysis = new VideoAnalysisService(process.env.AI_API_KEY, process.env.openrouter_API_KEY);
const audioAnalysis = new AudioAnalysisService(process.env.AI_API_KEY);
const hfModeration = new HFModerationService(process.env.AI_API_KEY);

/**
 * POST /api/upload
 * 
 * Comprehensive upload and analysis endpoint
 * Accepts: text, image, video, audio
 * 
 * Request body:
 * {
 *   "content": "text content",
 *   "image": "base64 or URL",
 *   "video": "base64 or URL",
 *   "audio": "base64 or URL"
 * }
 * 
 * Response:
 * {
 *   "allowed": true/false,
 *   "recommendation": "APPROVE" | "REJECT" | "REVIEW",
 *   "reason": "explanation",
 *   "analysis": { detailed AI results }
 * }
 */
router.post('/', protect, async (req, res) => {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('📤 NEW UPLOAD REQUEST');
    console.log('='.repeat(60));

    const { content, image, video, audio } = req.body;

    // Validate that at least one media type is provided
    if (!content && !image && !video && !audio) {
      return res.status(400).json({
        success: false,
        error: 'Please provide content (text, image, video, or audio)'
      });
    }

    // Validate file sizes
    const validateSize = (data, type, limit) => {
      if (!data) return true;
      const sizeInMB = Buffer.byteLength(data) / (1024 * 1024);
      if (sizeInMB > limit) {
        throw new Error(`${type} exceeds ${limit}MB limit (${sizeInMB.toFixed(2)}MB)`);
      }
      return true;
    };

    try {
      validateSize(content, 'Text', 1);
      validateSize(image, 'Image', 50);
      validateSize(video, 'Video', 200);  // Increased from 50MB to 200MB for longer educational videos
      validateSize(audio, 'Audio', 50);   // Increased from 10MB to 50MB
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Run all analyses in parallel
    console.log('\n🔍 Running AI Analysis Pipeline...\n');

    const results = {
      text: null,
      image: null,
      video: null,
      audio: null
    };

    const analysisPromises = [];

    // Text analysis
    if (content) {
      console.log('1️⃣  Analyzing text...');
      analysisPromises.push(
        textAnalysis.analyze(content)
          .then(res => { results.text = res; })
          .catch(err => { 
            console.error('Text analysis error:', err);
            results.text = null;
          })
      );
    }

    // Image analysis
    if (image) {
      console.log('2️⃣  Analyzing image...');
      analysisPromises.push(
        imageAnalysis.analyze(image)
          .then(res => { results.image = res; })
          .catch(err => {
            console.error('Image analysis error:', err);
            results.image = null;
          })
      );
    }

    // Video analysis
    if (video) {
      console.log('3️⃣  Analyzing video...');
      analysisPromises.push(
        videoAnalysis.analyze(video)
          .then(res => { results.video = res; })
          .catch(err => {
            console.error('Video analysis error:', err);
            results.video = null;
          })
      );
    }

    // Audio analysis
    if (audio) {
      console.log('4️⃣  Analyzing audio...');
      analysisPromises.push(
        audioAnalysis.analyze(audio)
          .then(res => { results.audio = res; })
          .catch(err => {
            console.error('Audio analysis error:', err);
            results.audio = null;
          })
      );
    }

    // Wait for all analyses to complete
    await Promise.all(analysisPromises);

    // Clean up null values for cleaner output
    Object.keys(results).forEach(key => {
      if (results[key] === null) delete results[key];
    });

    console.log('\n✅ All analyses complete\n');

    // Merge moderation results into main results for decision engine
    if (results.sightengine) {
      if (results.sightengine.image) {
        results.sightengine = { ...results.sightengine.image };
      } else if (results.sightengine.audio) {
        results.sightengine = { ...results.sightengine.audio };
      }
    }

    // Make final decision
    const decision = await decisionEngine.make(results);

    // Return response
    const response = {
      success: true,
      allowed: decision.allowed,
      recommendation: decision.recommendation,
      reason: decision.reason,
      scores: decision.scores,
      explanation: decisionEngine.getExplanation(decision),
      analysis: {
        text: results.text,
        image: results.image,
        video: results.video,
        audio: results.audio,
        moderation: results.sightengine
      }
    };

    res.json(response);

  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'An error occurred during content analysis'
    });
  }
});

/**
 * GET /api/upload/health
 * Check if upload service is ready
 */
router.get('/health', (req, res) => {
  const ready = {
    success: true,
    status: 'Upload service is operational',
    services: {
      huggingface: !!process.env.AI_API_KEY,
      ffmpeg: true
    }
  };

  if (!process.env.AI_API_KEY) {
    ready.services.huggingface = false;
    ready.warning = 'AI_API_KEY not configured';
  }

  res.json(ready);
});

module.exports = router;
