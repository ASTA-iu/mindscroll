const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');
const Tesseract = require('tesseract.js');
const { HfInference } = require('@huggingface/inference');
const VisualRecognitionService = require('./visualRecognitionService');
const NSFWImageDetection = require('./nsfwImageDetection');
const OpenRouterVisionService = require('./openRouterVisionService');
const HFModerationService = require('./hfModerationService');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

/**
 * Video Analysis Service - ENHANCED
 * Extracts frames using FFmpeg, analyzes with OpenRouter Vision + OCR + Visual Recognition
 * Uses OpenRouter free vision models for video frame classification
 * Runs OCR text through HuggingFace BART model for comprehensive moderation
 * Works WITH OR WITHOUT text by using visual features as fallback
 * NOW INCLUDES: NSFW detection per frame + OpenRouter analysis + HF moderation
 */
class VideoAnalysisService {
  constructor(apiKey, openRouterKey) {
    this.apiKey = apiKey;
    this.openRouterKey = openRouterKey;
    this.client = new HfInference(apiKey);
    this.visualService = new VisualRecognitionService(apiKey);
    this.nsfwDetector = new NSFWImageDetection(apiKey);
    this.hfModeration = new HFModerationService(apiKey);
    // Initialize OpenRouter service if API key is provided
    this.openRouterService = openRouterKey ? new OpenRouterVisionService(openRouterKey) : null;
    this.frameInterval = 5; // Extract frame every 5 seconds
  }

  /**
   * Detect if text is casual social media content (not educational)
   */
  isCasualContent(text) {
    if (!text || text.length === 0) return false;
    
    // Very specific brain rot and casual patterns
    const brainRotPatterns = [
      /^(my face|my picture|my selfie|just me|look at me|here's me|me myself)/i,
      /(my face|selfie|mirror pic) (is|are)/i,
      /^(dull|ugly|pretty|cute|hot|sexy|gorgeous|handsome|beautiful|gorgeous)\s+(today|moment|rn|now|lately)/i,
      /\b(mood|feeling|vibe|aesthetic|energy|main character)\b/i,
      /\b(no cap|fr fr|lowkey|highkey|periodt|bestie|slay|bussin|skibidi|gyatt)\b/i,
      /^(just|so|yo|hey|sup|lol|haha|omg|wow|ugh|ew|bruh|fam)[\s:!.]/i,
      /\b(ngl|tbh|smh|imo)\b\s+(the|i|this|that|these|those)/i,
      /^i\s+(literally|swear|deadass|lowkey|highkey)\s+(losing|dying|screaming|can't|cannot)/i,
      /\b(fr|facts)\b\s*(tho|though|for real|no lie|fr fr)/i,
      /\bgonna\s+(cry|scream|die|lose it)\b/i,
      /\b(stan|bestie|queen|king)\b/i,
      /\b(meme|funny|lol|haha|joke|rofl|lmao)\b/i,
      /^(this|that|right|so)\s+(be|is|aint|ain't)\s+(hitting|slapping|different|wild|crazy|insane)/i,
      /\bwhen\s+you\b/i,
      /\b(peak|it's giving|main character|caught in 4k|ratio|no )\b/i
    ];

    // Check for clear meme/brain rot patterns
    for (const pattern of brainRotPatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }

    // More aggressive detection: short posts are more likely to be casual
    const wordCount = text.split(/\s+/).length;
    const hasEducationalKeywords = /explain|how to|why|learn|teach|definition|meaning|concept|guide|tutorial|research|study|analysis|example|method|formula|theory|principle|law|physics|chemistry|biology|math|history|culture|art|science|prove|demonstrate|evidence|data|found|discover|fact|information|knowledge|education|resistance|conductor|equation|function|code|program|algorithm|process|system|structure|mechanism|analysis|conclusion|result|study\s+shows|research|academic|scholarly/i.test(text);
    
    if (hasEducationalKeywords) {
      return false; // Has clear educational content
    }

    // Flag short posts without substance as casual (casual chatter detection)
    if (wordCount <= 6) {
      const hasCasualStarters = /^(my|i'?m|just|so|like|omg|lol|haha|yo|hey|wow|ugh)/i.test(text);
      const hasQuestion = /\?/.test(text);
      const hasExclamation = /!{2,}/.test(text); // Multiple exclamation marks
      
      // Short post with casual starter and no substance = casual
      if (hasCasualStarters && !hasQuestion) {
        return true;
      }
      
      // Very short posts with typical social media punctuation
      if (wordCount <= 4 && (hasExclamation || /^[a-z\s!?]*$/.test(text))) {
        return true;
      }
    }

    // Flag posts that are ONLY appearance/vibe comments
    if (wordCount <= 8) {
      const appearanceKeywords = /^(i'm|i am|looks|look|feeling|feel|dull|ugly|pretty|cute|hot|tired|sad|happy|vibe|aesthetic|mood|energy)\b/i.test(text);
      const noSubstance = !/[.;:]/.test(text) && text.length < 40;
      
      if (appearanceKeywords && noSubstance) {
        return true;
      }
    }

    return false;
  }

  /**
   * Analyze video for educational content
   */
  async analyze(videoUrl) {
    let tempVideoPath = null;
    let framesDir = null;
    let extractedTexts = []; // Track all extracted texts for casual detection

    try {
      console.log('\n🎬 VIDEO ANALYSIS - Frame Extraction + OpenRouter Classification');
      console.log('='.repeat(60));

      if (!videoUrl) {
        return { score: 50, reason: 'No video provided', success: false };
      }

      // Step 1: Write video to temp file
      console.log('Step 1: Preparing video file...');
      tempVideoPath = await this.writeVideoToTemp(videoUrl);

      // Step 2: Extract frames
      console.log('Step 2: Extracting frames from video...');
      framesDir = path.join(os.tmpdir(), `frames_${Date.now()}`);
      const frameCount = await this.extractFrames(tempVideoPath, framesDir);

      if (frameCount === 0) {
        console.log('  ⚠️ No frames extracted');
        return {
          score: 50,
          reason: 'Could not extract frames from video',
          success: true
        };
      }

      // Step 3: Analyze frames with OpenRouter + casual content tracking
      console.log(`\nStep 3: Analyzing ${frameCount} frames...`);
      const frameScores = await this.analyzeFramesWithOpenRouter(framesDir, Math.min(5, frameCount), extractedTexts);

      // CRITICAL: Check if any frame was flagged as NSFW (score = 0)
      const hasNSFWFrame = frameScores.some(score => score === 0);
      if (hasNSFWFrame) {
        console.log('❌ NSFW CONTENT DETECTED IN VIDEO - BLOCKING');
        console.log('='.repeat(60) + '\n');
        return {
          success: true,
          score: 0,
          reason: 'NSFW/Adult content detected in video frames - Post rejected',
          nsfw: true,
          blocked: true,
          recommendation: 'REJECT',
          frameCount: frameCount
        };
      }

      const averageScore = frameScores.length > 0
        ? Math.round(frameScores.reduce((a, b) => a + b) / frameScores.length)
        : 50;

      // Check if video contains casual content
      const hasCasualContent = extractedTexts.some(text => this.isCasualContent(text));
      
      let finalScore = averageScore;
      let scoreReason = 'video frame analysis';

      // If casual content detected, force score to 15% max (same as backend logic)
      if (hasCasualContent && finalScore > 15) {
        console.log('  🎭 Casual/meme content detected in video - forcing score to 15%');
        finalScore = 15;
        scoreReason = 'casual/meme content in video';
      }

      console.log('\n' + '='.repeat(60) + '\n');

      return {
        success: true,
        score: finalScore,
        reason: finalScore >= 50 ? 'Video contains educational content' : 'Non-educational video content',
        frameCount: frameCount,
        analyzedFrames: frameScores.length,
        averageScore: averageScore,
        isCasual: hasCasualContent,
        approved: finalScore >= 65,
        type: 'video',
        analysisMethod: 'openrouter_frame_analysis',
        scoreReason: scoreReason,
        extractedText: extractedTexts.join(' ')  // Return extracted text from all frames for tagging
      };

    } catch (error) {
      console.error('❌ Video analysis error:', error.message);
      return {
        success: false,
        score: 50,
        reason: 'Video analysis error',
        error: error.message
      };
    } finally {
      // Cleanup temp files
      if (tempVideoPath && fs.existsSync(tempVideoPath)) {
        try { fs.unlinkSync(tempVideoPath); } catch (e) {}
      }
      if (framesDir && fs.existsSync(framesDir)) {
        try {
          const files = fs.readdirSync(framesDir);
          files.forEach(f => {
            try { fs.unlinkSync(path.join(framesDir, f)); } catch (e) {}
          });
          fs.rmdirSync(framesDir);
        } catch (e) {}
      }
    }
  }

  /**
   * Analyze frames with OpenRouter Vision API
   * Uses free tier vision models for educational classification
   * Falls back to OCR + HF if OpenRouter unavailable
   */
  async analyzeFramesWithOpenRouter(framesDir, maxFrames, extractedTexts = []) {
    if (!this.openRouterService) {
      console.log('  ⚠️ OpenRouter not configured, using OCR fallback');
      return this.analyzeFrames(framesDir, maxFrames, extractedTexts);
    }

    try {
      const files = fs.readdirSync(framesDir).filter(f => f.endsWith('.jpg')).sort();
      const framesToAnalyze = files.slice(0, maxFrames);
      
      console.log(`  Processing ${framesToAnalyze.length} frames with OpenRouter Vision...`);
      const frameScores = [];

      for (let i = 0; i < framesToAnalyze.length; i++) {
        const file = framesToAnalyze[i];
        const framePath = path.join(framesDir, file);

        try {
          console.log(`  Frame ${i + 1}/${framesToAnalyze.length}: Analyzing...`);

          // Read frame
          let frameBuffer;
          try {
            frameBuffer = fs.readFileSync(framePath);
          } catch (readError) {
            console.log(`    ⚠️ Cannot read frame file: ${readError.message}`);
            frameScores.push(40);
            continue;
          }

          // CRITICAL: Check for NSFW content in frame
          try {
            const nsfwResult = await this.nsfwDetector.detectNSFW(frameBuffer);
            if (nsfwResult.is_nsfw) {
              console.log(`    ❌ NSFW DETECTED IN FRAME - Score: 0%`);
              frameScores.push(0); // 0% = block this frame
              continue;
            }
          } catch (nsfwError) {
            console.log(`    ⚠️ NSFW check error: ${nsfwError.message}`);
          }

          // Convert frame to base64 for OpenRouter
          const frameBase64 = frameBuffer.toString('base64');

          let score = 40; // Default fallback

          // Try OpenRouter classification
          try {
            const openRouterResult = await this.openRouterService.classifyImageEducational(frameBase64);
            
            if (openRouterResult) {
              const confidence = openRouterResult.confidence || 0.5;
              score = this.openRouterService.classificationToScore(
                openRouterResult.classification,
                confidence
              );
              
              // TEACHING DETECTION: Boost score if teaching/instruction detected
              const contentDesc = `${openRouterResult.content_type || ''} ${openRouterResult.reason || ''}`.toLowerCase();
              const teachingKeywords = /teach|explain|demonstrate|instruct|lecture|lesson|how to|tutorial|learning|education|presentation|expert/i;
              if (teachingKeywords.test(contentDesc)) {
                console.log(`    🎓 TEACHING/INSTRUCTION DETECTED - Boosting score from ${score}% to 75%`);
                score = Math.max(score, 75); // Ensure score is at least 75% for teaching
              }
              
              console.log(`    ✓ Score: ${score}% (OpenRouter: ${openRouterResult.classification})`);
              
              // Track extracted text if available
              if (openRouterResult.content_type) {
                extractedTexts.push(openRouterResult.content_type);
              }
            } else {
              console.log(`    ⚠️ OpenRouter returned empty result, using fallback...`);
              // Fall back to OCR analysis
              score = await this.analyzeFrameFallback(frameBuffer, extractedTexts);
            }
          } catch (orError) {
            console.log(`    ⚠️ OpenRouter error: ${orError.message}, using fallback...`);
            // Fall back to OCR analysis
            score = await this.analyzeFrameFallback(frameBuffer, extractedTexts);
          }

          frameScores.push(score);

        } catch (frameError) {
          console.log(`    ⚠️ Unexpected frame error: ${frameError.message}`);
          frameScores.push(40);
        }
      }

      return frameScores;

    } catch (error) {
      console.error('  ❌ OpenRouter frame analysis error:', error.message);
      console.log('  Falling back to OCR analysis...');
      return this.analyzeFrames(framesDir, maxFrames, extractedTexts);
    }
  }

  /**
   * Fallback frame analysis using OCR + HF Classification
   * Used when OpenRouter is unavailable
   */
  async analyzeFrameFallback(frameBuffer, extractedTexts = []) {
    let score = 40;

    try {
      // Try OCR
      let frameText = '';
      try {
        const ocrResult = await Tesseract.recognize(frameBuffer, 'eng');
        frameText = (ocrResult.data?.text || ocrResult.text || '').trim();
      } catch (ocrError) {
        // OCR failed, use visual analysis
      }

      // If we found text, run through HF moderation first
      if (frameText && frameText.length > 5) {
        console.log(`    📝 OCR Extracted: "${frameText.substring(0, 40)}..."`);
        
        // TEACHING DETECTION: Check for instructional/teaching keywords
        const teachingKeywords = /teach|explain|demonstrate|instruction|lecture|lesson|how to|step-by-step|guide|tutorial|learn|understand|concept|definition|formula|equation|theorem|proof|method|technique|principle|analysis|research|study|solution|example|exercise|problem|answer|conclude|therefore|evidence|theory|background|explanation|description|introduction/i;
        if (teachingKeywords.test(frameText)) {
          console.log(`    🎓 TEACHING/INSTRUCTION DETECTED IN TEXT - Boosting score`);
          score = 75; // Teaching content deserves high score
          extractedTexts.push(frameText);
          return score;
        }
        
        // Run through HuggingFace BART moderation
        console.log(`    🔍 Running HuggingFace BART moderation checks...`);
        const hfModerationResult = await this.hfModeration.comprehensiveCheck(frameText);
        
        // Check for violations - 10% threshold
        if (hfModerationResult.nsfw > 0.1 || hfModerationResult.violence > 0.1 || 
            hfModerationResult.drugs > 0.1 || hfModerationResult.offensive > 0.1) {
          console.log(`    ❌ VIOLATION DETECTED: ${hfModerationResult.violations.join(', ')}`);
          score = 0; // Block this frame
          extractedTexts.push(frameText);
          return score;
        }

        // Check for meme/distraction - 10% threshold
        if (hfModerationResult.isMeme || hfModerationResult.isDistraction) {
          console.log(`    🎭 Detected: ${hfModerationResult.isMeme ? 'Meme' : 'Distraction'} content`);
          if (hfModerationResult.memeScore > 0.1 || hfModerationResult.distractionScore > 0.1) {
            score = 15; // Low score for meme/distraction
            extractedTexts.push(frameText);
            return score;
          }
        }

        console.log(`    ✅ Passed HF moderation checks`);

        // Use text-based analysis
        if (this.isCasualContent(frameText)) {
          score = 15;
        } else {
          try {
            const labels = ['educational content', 'entertainment content'];
            const classification = await Promise.race([
              this.client.zeroShotClassification({
                model: 'facebook/bart-large-mnli',
                inputs: frameText.substring(0, 1024),
                parameters: {
                  candidate_labels: labels,
                  multi_class: false
                }
              }),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 30000))
            ]);

            if (classification && Array.isArray(classification) && classification.length > 0) {
              const educationalObj = classification.find(item => item.label === 'educational content');
              score = educationalObj ? Math.round(educationalObj.score * 100) : 50;
            }
          } catch (e) {
            // Classification failed
          }
        }
        extractedTexts.push(frameText);
      } else {
        // No text - use visual analysis
        try {
          const visualAnalysis = await this.visualService.analyzeVisualFeatures(frameBuffer);
          score = visualAnalysis.score;
        } catch (e) {
          // Visual analysis failed
        }
      }
    } catch (error) {
      // Any error, use default score
    }

    return score;
  }

  /**
   * Analyze frames individually using BOTH OCR and Visual Recognition
   * Uses visual analysis as fallback when no text is detected
   */
  async analyzeFrames(framesDir, maxFrames, extractedTexts = []) {
    try {
      const files = fs.readdirSync(framesDir).filter(f => f.endsWith('.jpg')).sort();
      const framesToAnalyze = files.slice(0, maxFrames);
      
      console.log(`  Processing ${framesToAnalyze.length} frames (OCR + Visual)...`);
      const frameScores = [];

      for (let i = 0; i < framesToAnalyze.length; i++) {
        const file = framesToAnalyze[i];
        const framePath = path.join(framesDir, file);

        try {
          console.log(`  Frame ${i + 1}/${framesToAnalyze.length}: Analyzing...`);

          // Read frame
          let frameBuffer;
          try {
            frameBuffer = fs.readFileSync(framePath);
          } catch (readError) {
            console.log(`    ⚠️ Cannot read frame file: ${readError.message}`);
            frameScores.push(40);
            continue;
          }

          // CRITICAL: Check for NSFW content in frame
          try {
            const nsfwResult = await this.nsfwDetector.detectNSFW(frameBuffer);
            if (nsfwResult.is_nsfw) {
              console.log(`    ❌ NSFW DETECTED IN FRAME - Score: 0%`);
              frameScores.push(0); // 0% = block this frame
              continue; // Skip to next frame, video will be rejected if any frame has NSFW
            }
          } catch (nsfwError) {
            console.log(`    ⚠️ NSFW check error: ${nsfwError.message}`);
            // Continue analysis if NSFW check fails
          }

          // Step 1: Try OCR
          let frameText = '';
          try {
            const ocrResult = await Tesseract.recognize(frameBuffer, 'eng');
            frameText = (ocrResult.data?.text || ocrResult.text || '').trim();
          } catch (ocrError) {
            console.log(`    ⚠️ OCR error: ${ocrError.message}`);
          }

          let score = 40; // Default fallback

          // If we found text, use text-based analysis
          if (frameText && frameText.length > 5) {
            try {
              // Check if text is casual content
              if (this.isCasualContent(frameText)) {
                score = 15; // Low score for casual/entertainment
                console.log(`    ✓ Score: ${score}% (Casual text)`);
              } else {
                // Use AI classification for frame text
                const labels = ['educational content', 'entertainment content'];
                
                const classification = await Promise.race([
                  this.client.zeroShotClassification({
                    model: 'facebook/bart-large-mnli',
                    inputs: frameText.substring(0, 1024),
                    parameters: {
                      candidate_labels: labels,
                      multi_class: false
                    }
                  }),
                  new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 30000))
                ]);

                // Handle classification results
                let frameScore = 50;
                let educationalScore = 50;
                let entertainmentScore = 50;
                
                if (classification && Array.isArray(classification) && classification.length > 0) {
                  const educationalObj = classification.find(item => item.label === 'educational content');
                  const entertainmentObj = classification.find(item => item.label === 'entertainment content');
                  
                  if (educationalObj && educationalObj.score !== undefined) {
                    educationalScore = Math.round(educationalObj.score * 100);
                  }
                  if (entertainmentObj && entertainmentObj.score !== undefined) {
                    entertainmentScore = Math.round(entertainmentObj.score * 100);
                  }
                  
                  frameScore = educationalScore;
                }

                // If entertainment is clearly higher, suppress
                if (entertainmentScore > educationalScore + 15) {
                  frameScore = Math.max(5, educationalScore - 20);
                }

                score = frameScore;
                console.log(`    ✓ Score: ${score}% (Text analysis)`);
              }
              
              extractedTexts.push(frameText);

            } catch (hfError) {
              console.log(`    ⚠️ Classification error: ${hfError.message}, using visual analysis`);
              // Fall back to visual analysis
              try {
                const visualAnalysis = await this.visualService.analyzeVisualFeatures(frameBuffer);
                score = visualAnalysis.score;
                console.log(`    ✓ Score: ${score}% (Visual analysis)`);
              } catch (e) {
                score = 40;
              }
            }
          } else {
            // NO TEXT - Use visual recognition as primary method
            console.log(`    No text in frame, using visual analysis...`);
            try {
              const visualAnalysis = await this.visualService.analyzeVisualFeatures(frameBuffer);
              score = visualAnalysis.score;
              console.log(`    ✓ Score: ${score}% (Visual: ${visualAnalysis.reason})`);
            } catch (visualError) {
              console.log(`    ⚠️ Visual analysis error: ${visualError.message}`);
              score = 40;
            }
          }

          frameScores.push(score);

        } catch (frameError) {
          console.log(`    ⚠️ Unexpected frame error: ${frameError.message}`);
          frameScores.push(40);
        }
      }

      return frameScores;

    } catch (error) {
      console.error('  ❌ Frame analysis error:', error.message);
      return [];
    }
  }

  /**
   * Write video data to temporary file
   */
  async writeVideoToTemp(videoUrl) {
    const tempPath = path.join(os.tmpdir(), `video_${Date.now()}.mp4`);

    if (videoUrl.startsWith('data:')) {
      const base64Data = videoUrl.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(tempPath, buffer);
    } else if (videoUrl.startsWith('http')) {
      const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(tempPath, response.data);
    } else {
      fs.copyFileSync(videoUrl, tempPath);
    }

    return tempPath;
  }

  /**
   * Extract frames from video using FFmpeg
   */
  async extractFrames(videoPath, outputDir) {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      console.log(`  Extracting frames every ${this.frameInterval} seconds...`);

      ffmpeg(videoPath)
        .outputOptions(`-vf fps=1/${this.frameInterval}`)
        .output(path.join(outputDir, 'frame_%04d.jpg'))
        .on('end', () => {
          const frameCount = fs.readdirSync(outputDir).length;
          console.log(`  ✓ Extracted ${frameCount} frames`);
          resolve(frameCount);
        })
        .on('error', (error) => {
          reject(new Error(`FFmpeg error: ${error.message}`));
        })
        .run();
    });
  }
}

module.exports = VideoAnalysisService;
