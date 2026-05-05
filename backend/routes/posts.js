const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { validatePost } = require('../middleware/validation');

// Import only new modular analysis services
const TextAnalysisService = require('../utils/textAnalysisService');
const ImageAnalysisService = require('../utils/imageAnalysisService');
const VideoAnalysisService = require('../utils/videoAnalysisService');
const AudioAnalysisService = require('../utils/audioAnalysisService');
const HFModerationService = require('../utils/hfModerationService');
const decisionEngine = require('../utils/decisionEngine');
const ContentIntegrationService = require('../utils/contentIntegrationService');

// 🤖 AI MODERATION ENGINE - Integrated Backend Moderation Service (HuggingFace-Only)
const ModerationIntegrationService = require('../utils/moderationIntegrationService');

// Initialize services
const textAnalysis = new TextAnalysisService(process.env.AI_API_KEY);
const imageAnalysis = new ImageAnalysisService(process.env.AI_API_KEY, process.env.openrouter_API_KEY);
const videoAnalysis = new VideoAnalysisService(process.env.AI_API_KEY, process.env.openrouter_API_KEY);
const audioAnalysis = new AudioAnalysisService(process.env.AI_API_KEY);
const hfModeration = new HFModerationService(process.env.AI_API_KEY);
const contentIntegration = new ContentIntegrationService(
  process.env.AI_API_KEY,
  process.env.openrouter_API_KEY
);

// 🤖 Initialize the AI Moderation Engine (HuggingFace-Only)
const moderationEngine = new ModerationIntegrationService(
  process.env.AI_API_KEY,
  process.env.openrouter_API_KEY
);

const router = express.Router();

// IMPORTANT: Specific routes must come BEFORE generic routes
// Analyze content and generate tags (must be FIRST before POST /)
router.post('/analyze-tags', protect, async (req, res) => {
  try {
    const { content, hasMedia, mediaType, image, videoUrl, videoFileName } = req.body;

    if (!content && !image && !videoUrl) {
      return res.status(400).json({ success: false, message: 'Please provide content for tag analysis' });
    }

    console.log('\n🏷️  TAG ANALYSIS - Text + Video + Image Analysis');
    
    let combinedContent = content || '';
    
    // ANALYZE VIDEO if provided - extract text from frames for better tags
    if (videoUrl) {
      try {
        console.log('  🎬 Analyzing video frames for text content...');
        const videoResult = await videoAnalysis.analyze(videoUrl);
        if (videoResult && videoResult.extractedText) {
          combinedContent += ' ' + videoResult.extractedText;
          console.log(`  ✓ Video contains: "${videoResult.extractedText.substring(0, 60)}..."`);
        }
      } catch (e) {
        console.log(`  ⚠️ Video analysis skipped`);
      }
    }
    
    // ANALYZE IMAGE if provided and no video
    if (image && !videoUrl) {
      try {
        const imgResult = await imageAnalysis.analyze(image);
        if (imgResult && imgResult.extractedText) {
          combinedContent += ' ' + imgResult.extractedText;
        }
      } catch (e) {}
    }

    // Smart semantic tag generation - analyzes FULL content (text + video + image)
    const tags = extractSemanticTags(combinedContent);

    res.json({
      success: true,
      tags: tags.slice(0, 5)
    });
  } catch (error) {
    console.error('Tag analysis error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Extract meaningful semantic tags from content by analyzing full topic
 * Broader tag generation with specific keywords and casual content markers
 */
function extractSemanticTags(content) {
  if (!content || content.length === 0) {
    return ['educational', 'content'];
  }

  const contentLower = content.toLowerCase();
  const tags = new Set(); // Use set to avoid duplicates
  
  // Check if this is casual/meme content
  const isCasual = /\b(meme|funny|lol|haha|joke|rofl|lmao|when you|it's giving|caught in 4k|mood|vibe|slay|bussin)\b/i.test(contentLower);
  if (isCasual) {
    tags.add('meme');
  }

  // BROAD topic category detection with SPECIFIC keywords
  const topicPatterns = [
    {
      pattern: /(malaria|disease|virus|bacteria|infection|immune|vaccine|treatment|symptom|disorder|syndrome|antibody|pathogen|cancer|diabetes|asthma|covid|coronav|flu|cold)/gi,
      mainTag: 'health',
      specificKeywords: ['malaria', 'virus', 'bacteria', 'vaccine', 'disease', 'infection', 'treatment', 'cancer', 'covid', 'diabetes']
    },
    {
      pattern: /(physics|motion|force|energy|gravity|quantum|relativity|particle|atom|molecule|optics|mechanics|thermodynamics|electro)/gi,
      mainTag: 'physics',
      specificKeywords: ['gravity', 'quantum', 'force', 'energy', 'particle', 'relativity', 'mechanics', 'thermodynamics']
    },
    {
      pattern: /(biology|cell|organism|evolution|genetics|dna|protein|photosynthesis|ecosystem|species|mutation|natural selection|enzyme)/gi,
      mainTag: 'biology',
      specificKeywords: ['dna', 'evolution', 'genetics', 'photosynthesis', 'enzyme', 'cell', 'ecosystem']
    },
    {
      pattern: /(chemistry|element|compound|reaction|carbon|hydrogen|periodic|bond|solution|acid|base|catalyst|oxidation)/gi,
      mainTag: 'chemistry',
      specificKeywords: ['acid', 'base', 'compound', 'reaction', 'catalyst', 'periodic', 'element']
    },
    {
      pattern: /(math|algebra|geometry|calculus|equation|function|number|theorem|proof|polynomial|matrix|derivative|integral)/gi,
      mainTag: 'mathematics',
      specificKeywords: ['algebra', 'calculus', 'geometry', 'theorem', 'equation', 'derivative', 'integral']
    },
    {
      pattern: /(history|war|civilization|ancient|medieval|revolution|empire|culture|era|century|dynasty|colonial|historical)/gi,
      mainTag: 'history',
      specificKeywords: ['ancient', 'medieval', 'revolution', 'war', 'empire', 'dynasty', 'civilization']
    },
    {
      pattern: /(geography|country|continent|climate|map|border|ocean|mountain|region|territory|continent|latitude|longitude)/gi,
      mainTag: 'geography',
      specificKeywords: ['geography', 'climate', 'continent', 'mountain', 'ocean', 'region']
    },
    {
      pattern: /(literature|book|author|poetry|novel|story|character|narrative|fiction|prose|plot|theme)/gi,
      mainTag: 'literature',
      specificKeywords: ['poetry', 'novel', 'author', 'narrative', 'fiction', 'literature']
    },
    {
      pattern: /(art|painting|sculpture|artist|color|canvas|design|creative|aesthetic|gallery|exhibition|style)/gi,
      mainTag: 'art',
      specificKeywords: ['painting', 'sculpture', 'artist', 'design', 'aesthetic', 'art']
    },
    {
      pattern: /(music|song|instrument|melody|rhythm|composer|opera|classical|sound|genre|harmony|acoustic)/gi,
      mainTag: 'music',
      specificKeywords: ['music', 'melody', 'rhythm', 'composer', 'instrument', 'classical']
    },
    {
      pattern: /(technology|computer|software|network|code|program|digital|algorithm|data|artificial intelligence|machine learning|ai)/gi,
      mainTag: 'technology',
      specificKeywords: ['algorithm', 'code', 'artificial intelligence', 'ai', 'network', 'software', 'technology']
    },
    {
      pattern: /(psychology|behavior|mind|emotion|cognition|learning|memory|consciousness|brain|mental|cognitive)/gi,
      mainTag: 'psychology',
      specificKeywords: ['psychology', 'behavior', 'cognition', 'memory', 'emotion', 'brain']
    },
    {
      pattern: /(economics|trade|market|business|profit|investment|currency|finance|supply|demand|inflation)/gi,
      mainTag: 'economics',
      specificKeywords: ['economics', 'market', 'finance', 'investment', 'business', 'trade']
    },
    {
      pattern: /(environment|climate|pollution|renewable|sustainability|nature|ecosystem|green|carbon|emission)/gi,
      mainTag: 'environment',
      specificKeywords: ['environment', 'climate', 'renewable', 'sustainability', 'pollution', 'green']
    },
    {
      pattern: /(tutorial|guide|how.?to|learn|teach|lesson|instruction|steps|process|method|technique|skill)/gi,
      mainTag: 'tutorial',
      specificKeywords: ['tutorial', 'guide', 'learn', 'teach', 'method', 'skill']
    }
  ];

  // Score each topic and collect specific keywords
  let topicScores = {};
  let mentionedSpecific = [];

  topicPatterns.forEach(({ pattern, mainTag, specificKeywords }) => {
    const matches = contentLower.match(pattern);
    if (matches) {
      topicScores[mainTag] = (topicScores[mainTag] || 0) + matches.length;
      
      // Collect specific keyword mentions
      specificKeywords.forEach(keyword => {
        if (contentLower.includes(keyword.toLowerCase())) {
          mentionedSpecific.push(keyword);
        }
      });
    }
  });

  // Add top topics as tags
  const sortedTopics = Object.entries(topicScores)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag)
    .slice(0, 3);
  
  sortedTopics.forEach(t => tags.add(t));

  // Add specific keywords as tags (most specific, up to 2)
  const uniqueSpecific = [...new Set(mentionedSpecific)].slice(0, 2);
  uniqueSpecific.forEach(t => tags.add(t.toLowerCase()));

  // Add quality indicators
  if (/what|how|why|explain|understand|learn/i.test(contentLower)) {
    tags.add('educational');
  }
  if (/step|guide|process|tutorial|instruction/i.test(contentLower)) {
    tags.add('practical');
  }
  if (/research|study|analysis|evidence|data|findings/i.test(contentLower)) {
    tags.add('research');
  }

  // Return array, ensure we have at least 2 tags
  const result = Array.from(tags);
  if (result.length === 0) {
    result.push('educational', 'learning');
  }

  return result;
}

// Analyze Content WITHOUT Creating Post (NEW)
// 🔍 ANALYZE ENDPOINT - Robust preview analysis with fallback scoring
router.post('/analyze', protect, async (req, res) => {
  try {
    const { content, image, videoUrl } = req.body;

    // Validate content
    if (!content && !image && !videoUrl) {
      return res.status(400).json({ success: false, message: 'Post must contain content, image, or video' });
    }

    console.log('\n' + '╔' + '═'.repeat(58) + '╗');
    console.log('║ 🔍 PREVIEW ANALYSIS - Educational Value Scoring       ║');
    console.log('╚' + '═'.repeat(58) + '╝\n');

    let combinedScore = 0;
    let isEducational = false;
    let details = {};

    // TIMEOUT PROTECTION: Set 15 second timeout for all analysis
    const analysisPromise = (async () => {
      try {
        // Caption + Image analysis
        if (content && image && !videoUrl) {
          console.log('🔗 CAPTION + IMAGE MODE');
          try {
            const result = await Promise.race([
              contentIntegration.analyzeFullContent({
                caption: content,
                imageData: image,
                includeVisualFeatures: true
              }),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Analysis timeout')), 15000))
            ]);
            
            combinedScore = result.educationalScore || 0;
            console.log(`   📝 Text: ${result.textScore || 0}%`);
            console.log(`   🖼️  Image: ${result.imageScore || 0}%`);
            console.log(`   📊 Combined: ${combinedScore}%`);
            details = {
              textScore: result.textScore,
              imageScore: result.imageScore
            };
          } catch (e) {
            console.warn(`⚠️ Integrated analysis failed: ${e.message}`);
            // Fallback: Simple keyword-based scoring
            combinedScore = simpleScoringFallback(content, image);
            console.log(`   📊 Fallback Score: ${combinedScore}%`);
          }
        } 
        // Image only
        else if (image && !content && !videoUrl) {
          console.log('🔗 IMAGE ONLY MODE');
          try {
            const result = await Promise.race([
              contentIntegration.analyzeFullContent({
                caption: '',
                imageData: image,
                includeVisualFeatures: true
              }),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Analysis timeout')), 15000))
            ]);
            
            combinedScore = result.educationalScore || 0;
            console.log(`   🖼️  Image: ${combinedScore}%`);
            details = { imageScore: combinedScore };
          } catch (e) {
            console.warn(`⚠️ Image analysis failed: ${e.message}`);
            combinedScore = 50; // Neutral fallback for images
          }
        }
        // Text only or video
        else {
          console.log('📊 TEXT/VIDEO MODE');
          try {
            // Run analyses with timeout
            const textResult = content ? await Promise.race([
              textAnalysis.analyze(content),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Text analysis timeout')), 15000))
            ]) : null;

            const videoResult = videoUrl ? await Promise.race([
              videoAnalysis.analyze(videoUrl),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Video analysis timeout')), 15000))
            ]) : null;

            const scores = [];
            if (textResult?.score !== undefined && textResult?.score !== null) {
              scores.push(textResult.score);
              console.log(`   📝 Text: ${textResult.score}%`);
              details.textScore = textResult.score;
            }
            if (videoResult?.score !== undefined && videoResult?.score !== null) {
              scores.push(videoResult.score);
              console.log(`   🎬 Video: ${videoResult.score}%`);
              details.videoScore = videoResult.score;
            }

            if (scores.length > 0) {
              combinedScore = Math.round(scores.reduce((a, b) => a + b) / scores.length);
            } else if (content) {
              // Fallback: Simple keyword analysis
              combinedScore = simpleScoringFallback(content);
            }
            console.log(`   📊 Combined: ${combinedScore}%`);
          } catch (e) {
            console.warn(`⚠️ Analysis failed: ${e.message}`);
            // Fallback: Simple keyword-based scoring
            combinedScore = content ? simpleScoringFallback(content) : 50;
            console.log(`   📊 Fallback Score: ${combinedScore}%`);
          }
        }
      } catch (e) {
        console.error('Unexpected analysis error:', e.message);
        combinedScore = content ? simpleScoringFallback(content) : 50;
      }
    })();

    await analysisPromise;

    isEducational = combinedScore >= 50;

    console.log(`\n✅ Analysis Result: ${isEducational ? 'APPROVED' : 'NEEDS REVIEW'} (${combinedScore}%)\n`);

    // Return analysis results
    res.json({
      success: true,
      analysis: {
        score: combinedScore,
        educationalScore: combinedScore,
        category: isEducational ? 'EDUCATIONAL' : 'NON_EDUCATIONAL',
        confidence: combinedScore,
        recommendation: isEducational ? 'APPROVE' : 'REJECT',
        reason: isEducational 
          ? `Educational content approved (${combinedScore}% match)`
          : `Content needs review (${combinedScore}%)`,
        isApproved: isEducational,
        details: {
          textScore: details.textScore || null,
          imageScore: details.imageScore || null,
          videoScore: details.videoScore || null,
          combinedScore: combinedScore,
          analysisMethod: 'multi_signal_integration'
        },
        signals: {
          caption: {
            score: details.textScore || combinedScore,
            weight: 0.3,
            available: !!content
          },
          image: {
            score: details.imageScore || null,
            weight: image ? 0.4 : 0,
            available: !!image
          },
          video: {
            score: details.videoScore || null,
            weight: videoUrl ? 0.3 : 0,
            available: !!videoUrl
          }
        }
      },
      message: isEducational 
        ? '✅ Content approved! Click "Post" to publish.' 
        : `⚠️ Content review needed`
    });
  } catch (error) {
    console.error('Content analysis error:', error);
    res.status(500).json({ success: false, message: 'Analysis service error. Please try again.' });
  }
});

/**
 * Simple keyword-based fallback scoring when AI services fail
 */
function simpleScoringFallback(text, image = null) {
  if (!text && !image) return 50;

  let score = 30; // Base score

  // Educational keywords
  const educationalKeywords = [
    'science', 'research', 'study', 'learn', 'teach', 'education', 'explain',
    'how to', 'tutorial', 'guide', 'analysis', 'theory', 'evidence', 'proof',
    'algorithm', 'code', 'programming', 'math', 'physics', 'chemistry', 'biology',
    'history', 'culture', 'health', 'medicine', 'technology', 'engineering',
    'economics', 'business', 'philosophy', 'art', 'design', 'literature',
    'infected', 'disease', 'treatment', 'diagnosis', 'virus', 'bacteria'
  ];

  if (text) {
    const textLower = text.toLowerCase();
    
    // Check for educational keywords
    const keywordMatches = educationalKeywords.filter(kw => 
      textLower.includes(kw)
    ).length;

    if (keywordMatches >= 3) {
      score = 75; // Strong educational content
    } else if (keywordMatches === 2) {
      score = 65; // Good educational content
    } else if (keywordMatches === 1) {
      score = 55; // Some educational content
    }

    // Length bonus (longer = more likely educational)
    const wordCount = text.split(/\s+/).length;
    if (wordCount >= 100) {
      score = Math.min(score + 10, 95);
    } else if (wordCount >= 50) {
      score = Math.min(score + 5, 95);
    }

    // Penalize meme/casual indicators
    const casualIndicators = ['lol', 'lmao', 'haha', 'rofl', 'meme', 'selfie'];
    const hasCasual = casualIndicators.some(ind => textLower.includes(ind));
    if (hasCasual) {
      score = Math.max(score - 20, 15);
    }
  } else if (image) {
    // Image without text - use moderate score
    score = 60;
  }

  return Math.round(Math.max(0, Math.min(100, score)));
}

// Create Post (MUST come after /analyze-tags)
// 🤖 Uses same educational value analysis as preview (/analyze endpoint)
router.post('/', protect, validatePost, async (req, res) => {
  try {
    const { content, image, videoUrl, videoFileName, tags } = req.body;

    // Validate content
    if (!content && !image && !videoUrl) {
      return res.status(400).json({ success: false, message: 'Post must contain content, image, or video' });
    }

    console.log('\n' + '╔' + '═'.repeat(58) + '╗');
    console.log('║ 🤖 POST SUBMISSION - Educational Value Analysis      ║');
    console.log('╚' + '═'.repeat(58) + '╝\n');

    let combinedScore = 0;
    let isEducational = false;
    let details = {};

    // Use same analysis logic as /analyze endpoint for consistency
    try {
      // Caption + Image analysis
      if (content && image && !videoUrl) {
        console.log('🔗 CAPTION + IMAGE MODE');
        try {
          const result = await Promise.race([
            contentIntegration.analyzeFullContent({
              caption: content,
              imageData: image,
              includeVisualFeatures: true
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Analysis timeout')), 15000))
          ]);
          
          combinedScore = result.educationalScore || 0;
          console.log(`   📝 Text: ${result.textScore || 0}%`);
          console.log(`   🖼️  Image: ${result.imageScore || 0}%`);
          console.log(`   📊 Combined: ${combinedScore}%`);
          details = {
            textScore: result.textScore,
            imageScore: result.imageScore
          };
        } catch (e) {
          console.warn(`⚠️ Integrated analysis failed: ${e.message}`);
          combinedScore = simpleScoringFallback(content, image);
          console.log(`   📊 Fallback Score: ${combinedScore}%`);
        }
      } 
      // Image only
      else if (image && !content && !videoUrl) {
        console.log('🔗 IMAGE ONLY MODE');
        try {
          const result = await Promise.race([
            contentIntegration.analyzeFullContent({
              caption: '',
              imageData: image,
              includeVisualFeatures: true
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Analysis timeout')), 15000))
          ]);
          
          combinedScore = result.educationalScore || 0;
          console.log(`   🖼️  Image: ${combinedScore}%`);
          details = { imageScore: combinedScore };
        } catch (e) {
          console.warn(`⚠️ Image analysis failed: ${e.message}`);
          combinedScore = 50; // Neutral fallback for images
        }
      }
      // Text only or video
      else {
        console.log('📊 TEXT/VIDEO MODE');
        try {
          // Run analyses with timeout
          const textResult = content ? await Promise.race([
            textAnalysis.analyze(content),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Text analysis timeout')), 15000))
          ]) : null;

          const videoResult = videoUrl ? await Promise.race([
            videoAnalysis.analyze(videoUrl),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Video analysis timeout')), 15000))
          ]) : null;

          const scores = [];
          if (textResult?.score !== undefined && textResult?.score !== null) {
            scores.push(textResult.score);
            console.log(`   📝 Text: ${textResult.score}%`);
            details.textScore = textResult.score;
          }
          if (videoResult?.score !== undefined && videoResult?.score !== null) {
            scores.push(videoResult.score);
            console.log(`   🎬 Video: ${videoResult.score}%`);
            details.videoScore = videoResult.score;
          }

          if (scores.length > 0) {
            combinedScore = Math.round(scores.reduce((a, b) => a + b) / scores.length);
          } else if (content) {
            combinedScore = simpleScoringFallback(content);
          }
          console.log(`   📊 Combined: ${combinedScore}%`);
        } catch (e) {
          console.warn(`⚠️ Analysis failed: ${e.message}`);
          combinedScore = content ? simpleScoringFallback(content) : 50;
          console.log(`   📊 Fallback Score: ${combinedScore}%`);
        }
      }
    } catch (e) {
      console.error('Unexpected analysis error:', e.message);
      combinedScore = content ? simpleScoringFallback(content) : 50;
    }

    isEducational = combinedScore >= 50;

    console.log(`\n✅ Analysis Result: ${isEducational ? 'APPROVED' : 'NEEDS REVIEW'} (${combinedScore}%)\n`);

    // If not approved, return rejection
    if (!isEducational) {
      console.log('❌ CONTENT NOT APPROVED - Below 50% threshold\n');
      return res.status(400).json({
        success: false,
        rejected: true,
        message: 'This content does not meet educational standards',
        reason: `Content scored ${combinedScore}% - requires minimum 50% educational value`,
        analysis: {
          score: combinedScore,
          educationalScore: combinedScore,
          recommendation: 'REJECT',
          isApproved: false,
          details: {
            textScore: details.textScore || null,
            imageScore: details.imageScore || null,
            videoScore: details.videoScore || null,
            combinedScore: combinedScore
          },
          signals: {
            caption: {
              score: details.textScore || combinedScore,
              weight: 0.3,
              available: !!content
            },
            image: {
              score: details.imageScore || null,
              weight: image ? 0.4 : 0,
              available: !!image
            },
            video: {
              score: details.videoScore || null,
              weight: videoUrl ? 0.3 : 0,
              available: !!videoUrl
            }
          }
        },
        details
      });
    }
    
    // ✅ APPROVAL: Content passed analysis - proceed to post creation
    console.log('✅ CONTENT APPROVED - Creating post...\n');

    // Generate AI tags if not provided
    let finalTags = tags || [];
    if (finalTags.length === 0) {
      console.log('🔖 Generating tags...');
      const keywords = (content || '').toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
      finalTags = [...new Set(keywords)].slice(0, 5);
      if (finalTags.length < 3) {
        finalTags.push('educational', 'learning', 'content');
      }
    }

    // Create the post
    const post = new Post({
      author: req.user.id,
      content,
      image: image,
      imageUrl: image,
      videoUrl: videoUrl,
      isEducational: isEducational,
      educationalScore: combinedScore,
      aiAnalysisResult: JSON.stringify({ score: combinedScore, details }),
      tags: finalTags,
      flagged: false
    });

    await post.save();
    await post.populate('author', ['username', 'profileImage', 'name']);

    console.log('✅ Post created successfully and published to feed\n');

    res.status(201).json({
      success: true,
      post,
      aiAnalysis: {
        score: combinedScore,
        educationalScore: combinedScore,
        confidence: combinedScore,
        educationalValue: combinedScore,
        recommendation: 'APPROVE',
        reason: `Educational content approved (${combinedScore}% match)`,
        isApproved: true,
        message: '✅ Content approved! This post is educational and meets our platform guidelines.',
        // DETAILED ANALYSIS BREAKDOWN
        details: {
          textScore: details.textScore || null,
          imageScore: details.imageScore || null,
          videoScore: details.videoScore || null,
          combinedScore: combinedScore,
          analysisMethod: 'multi_signal_integration'
        },
        signals: {
          caption: {
            score: details.textScore || combinedScore,
            weight: 0.3,
            available: !!content
          },
          image: {
            score: details.imageScore || null,
            weight: image ? 0.4 : 0,
            available: !!image
          },
          video: {
            score: details.videoScore || null,
            weight: videoUrl ? 0.3 : 0,
            available: !!videoUrl
          }
        }
      },
      message: 'Post published successfully'
    });
  } catch (error) {
    console.error('Create post error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message,
        details: error.errors
      });
    }

    res.status(500).json({ success: false, message: error.message });
  }
});

// TEMPORARY PLACEHOLDER - DELETE OLD CODE SECTION BELOW
// This is a placeholder that should be deleted
// When we have caption + image
// REMOVED_OLD_CODE

// Get all posts (Feed)
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const userId = req.query.userId;
    const tags = req.query.tags ? req.query.tags.split(',') : [];
    const search = req.query.search || '';

    // Build query
    // Only show posts that were verified as educational
    const query = { flagged: false, isEducational: true };
    
    if (userId) {
      query.author = userId;
    }

    // Filter by tags (any of the selected tags)
    if (tags.length > 0) {
      query.tags = { $in: tags };
    }

    // Search by content or author name
    if (search) {
      const searchQuery = {
        $or: [
          { content: { $regex: search, $options: 'i' } }
        ]
      };
      // Combine with existing query
      query.$and = [searchQuery, { flagged: false, isEducational: true }];
      if (userId) query.$and.push({ author: userId });
      if (tags.length > 0) query.$and.push({ tags: { $in: tags } });
      delete query.flagged;
      delete query.isEducational;
      if (userId) delete query.author;
      if (tags.length > 0) delete query.tags;
    }

    // Only show educational posts (not flagged)
    const posts = await Post.find(query)
      .populate('author', ['username', 'profileImage', 'firstName', 'lastName', 'name'])
      .populate('likes', ['username'])
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: ['username', 'profileImage', 'name']
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      posts,
      totalPages: Math.ceil(total / limit),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user's posts (MUST come BEFORE /:id route)
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId, flagged: false })
      .populate('author', ['username', 'profileImage', 'name'])
      .sort({ createdAt: -1 });

    res.json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single post
router.get('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', ['username', 'profileImage', 'firstName', 'lastName'])
      .populate('likes', ['username']);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    res.json({ success: true, post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update post
router.put('/:id', protect, async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Check ownership
    if (post.author.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this post' });
    }

    const { content, tags } = req.body;
    
    // Update tags if provided
    if (tags && Array.isArray(tags)) {
      post.tags = tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
    }

    // If content is provided, re-analyze it
    if (content) {
      const textResult = await textAnalysis.analyze(content).catch(e => ({ score: 50 }));
      const imageResult = post.imageUrl ? await imageAnalysis.analyze(post.imageUrl).catch(e => ({ score: 50 })) : null;
      
      const scores = [textResult.score || 50];
      if (imageResult) scores.push(imageResult.score || 50);
      const avgScore = Math.round(scores.reduce((a, b) => a + b) / scores.length);
      
      post.content = content;
      post.educationalScore = avgScore;
      post.isEducational = avgScore >= 50;
      post.flagged = !post.isEducational;
      post.aiAnalysisResult = JSON.stringify({ text: textResult, image: imageResult });
    }

    await post.save();
    await post.populate('author', ['username', 'profileImage']);

    res.json({ success: true, post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete post
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Check ownership
    if (post.author.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
    }

    // Also delete all associated comments
    const Comment = require('../models/Comment');
    await Comment.deleteMany({ post: req.params.id });
    
    await Post.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Like/Unlike post
router.post('/:id/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const userIndex = post.likes.indexOf(req.user.id);
    
    if (userIndex > -1) {
      // User already liked - remove like
      post.likes.splice(userIndex, 1);
      post.likeCount = Math.max(0, post.likeCount - 1);
    } else {
      // User hasn't liked - add like
      post.likes.push(req.user.id);
      post.likeCount += 1;
    }

    await post.save();
    const updatedPost = await post.populate('author', ['username', 'profileImage', 'name']);

    res.json({ 
      success: true, 
      message: userIndex > -1 ? 'Like removed' : 'Post liked',
      liked: userIndex === -1,
      likeCount: post.likeCount,
      post: updatedPost
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Report post as non-educational
router.post('/:id/report', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Check if user already reported this post
    const alreadyReported = post.reportedBy.some(userId => userId.toString() === req.user.id.toString());
    
    if (alreadyReported) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already reported this post',
        thankyou: 'Thank you for your previous report!'
      });
    }

    // Add user to reportedBy array
    post.reportedBy.push(req.user.id);
    post.reportCount += 1;
    
    // Always flag the post for review
    post.flagged = true;
    post.flagReason = `Reported by users (${post.reportCount} report${post.reportCount > 1 ? 's' : ''})`;

    // If 10+ reports, delete the post
    if (post.reportCount >= 10) {
      const Comment = require('../models/Comment');
      await Comment.deleteMany({ post: req.params.id });
      await Post.findByIdAndDelete(req.params.id);
      
      return res.json({ 
        success: true, 
        message: 'Post removed from platform after 10+ reports',
        postDeleted: true,
        thankyou: 'Thank you! This post has been removed from our platform for violating community standards.'
      });
    }

    await post.save();

    res.json({ 
      success: true, 
      message: 'Post reported for review. It will be hidden from your feed.',
      thankyou: 'Thank you for helping keep MindScroll educational!',
      postHidden: true,
      reportCount: post.reportCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark post as uninterested (hide from user's feed)
router.post('/:id/uninterested', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // For now, we'll just mark it as flagged for the user
    // In a real implementation, you'd have a user-specific uninterested list
    // But for simplicity, we'll hide flagged posts from the feed
    post.flagged = true;
    post.flagReason = `Marked as uninterested by user ${req.user.id}`;
    await post.save();

    res.json({ success: true, message: 'Post hidden from your feed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
