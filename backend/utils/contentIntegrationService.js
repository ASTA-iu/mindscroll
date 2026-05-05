const Tesseract = require('tesseract.js');
const VisualRecognitionService = require('./visualRecognitionService');
const ImageAnalysisService = require('./imageAnalysisService');
const { HfInference } = require('@huggingface/inference');

/**
 * Content Integration Service
 * Performs HOLISTIC analysis of posts by combining:
 * 1. Caption text context
 * 2. Image text (OCR)
 * 3. Visual features + Enhanced Image Analysis (Medical/Educational diagrams)
 * Analyzes the POST AS A WHOLE, not individual signals
 */
class ContentIntegrationService {
  constructor(apiKey, openrouterKey) {
    this.apiKey = apiKey;
    this.openrouterKey = openrouterKey;
    this.client = new HfInference(apiKey);
    this.visualService = new VisualRecognitionService(apiKey);
    // NEW: Use enhanced image analysis for better diagram detection
    this.imageAnalysis = new ImageAnalysisService(apiKey, openrouterKey);
  }

  /**
   * Comprehensive post analysis combining all signals
   * Returns: { score, reason, signals, recommendation }
   */
  async analyzePost(captionText, imageBuffer = null, confidence = true) {
    try {
      console.log('\n📊 MULTI-SIGNAL POST ANALYSIS');
      console.log('='.repeat(60));

      const signals = {
        caption: { text: '', score: 50, weight: 0.3 },
        ocrText: { text: '', score: 50, weight: 0.3 },
        visual: { category: '', score: 50, weight: 0.4 }
      };

      // Run caption and visual analysis IN PARALLEL (they don't depend on image buffer content)
      const captionPromise = (async () => {
        console.log('Step 1: Analyzing caption text...');
        if (captionText && captionText.trim().length > 0) {
          signals.caption.text = captionText.substring(0, 500);
          signals.caption.score = await this.analyzeTextSignal(captionText);
          console.log(`  ✓ Caption Score: ${signals.caption.score}%`);
          
          if (this.isCasualContent(captionText)) {
            console.log('  🔴 CASUAL CAPTION PATTERN DETECTED');
          }
        }
      })();

      const visualPromise = (async () => {
        if (imageBuffer) {
          console.log('Step 3: Analyzing visual content using Enhanced Image Analysis...');
          try {
            // Use enhanced image analysis service with medical/educational diagram detection
            const fullImageAnalysis = await Promise.race([
              this.imageAnalysis.analyze(imageBuffer),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Image analysis timeout')), 25000)
              )
            ]);
            
            signals.visual.score = fullImageAnalysis.score || 50;
            signals.visual.category = fullImageAnalysis.method || 'enhanced_visual';
            console.log(`  ✓ Image Analysis Score: ${signals.visual.score}% (Method: ${fullImageAnalysis.method})`);
            console.log(`    Reason: ${fullImageAnalysis.reason}`);
            
            // Store full analysis details for debugging
            signals.visual.details = fullImageAnalysis;
          } catch (e) {
            console.log(`  ⚠️ Enhanced image analysis error: ${e.message}, falling back to visual service...`);
            try {
              const visualAnalysis = await this.visualService.analyzeVisualFeatures(imageBuffer);
              signals.visual.score = visualAnalysis.score;
              signals.visual.category = visualAnalysis.type;
            } catch (e2) {
              signals.visual.score = 50;
              signals.visual.category = 'unknown';
            }
          }
        }
      })();

      // Wait for caption analysis to complete
      await captionPromise;

      // Signal 2: Extract and Analyze OCR Text (SEQUENTIAL - depends on visual)
      if (imageBuffer) {
        console.log('Step 2: Extracting text from image (OCR)...');
        signals.ocrText.text = await this.extractImageText(imageBuffer);
        
        if (signals.ocrText.text && signals.ocrText.text.length > 0) {
          signals.ocrText.score = await this.analyzeTextSignal(signals.ocrText.text);
          console.log(`  ✓ OCR Score: ${signals.ocrText.score}% - "${signals.ocrText.text.substring(0, 40)}..."`);
        } else {
          console.log('  ℹ️ No text detected in image');
        }
      }

      // Wait for visual analysis to complete
      await visualPromise;

      // INTEGRATED DECISION LOGIC
      console.log('\nStep 4: Integrating signals for holistic decision...');
      const result = this.integrateSignals(signals, captionText, imageBuffer);

      console.log('='.repeat(60) + '\n');
      return result;

    } catch (error) {
      console.error('❌ Integration analysis error:', error.message);
      return {
        score: 50,
        reason: 'Analysis error',
        signals: {},
        recommendation: 'REVIEW',
        error: error.message
      };
    }
  }

  /**
   * Analyze a text signal for educational value
   */
  async analyzeTextSignal(text) {
    if (!text || text.trim().length === 0) return 50;

    // STEP 1: Check for obvious casual patterns ONLY (not false positives)
    if (this.isCasualContent(text)) {
      console.log(`    🔴 CASUAL PATTERN DETECTED: "${text.substring(0, 50)}..."`);
      return 15; // Force low score for obvious casual patterns
    }

    // STEP 2: AI classification for non-casual content
    try {
      const labels = ['educational content', 'entertainment content'];
      let retries = 0;
      let maxRetries = 1; // Only one attempt - faster failure
      let lastError = null;

      while (retries < maxRetries) {
        try {
          console.log(`  🔄 AI classification attempt ${retries + 1}/${maxRetries}...`);
          
          const classification = await Promise.race([
            this.client.zeroShotClassification({
              model: 'facebook/bart-large-mnli',
              inputs: text.substring(0, 1024),
              parameters: {
                candidate_labels: labels,
                multi_class: false
              }
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('AI Timeout')), 12000))
          ]);

          let educationalScore = 50;
          if (classification && Array.isArray(classification) && classification.length > 0) {
            const eduObj = classification.find(item => item.label === 'educational content');
            if (eduObj && eduObj.score !== undefined) {
              educationalScore = Math.round(eduObj.score * 100);
            }
          }

          console.log(`  ✓ AI succeeded: ${educationalScore}%`);
          return Math.max(5, Math.min(95, educationalScore));
        } catch (error) {
          lastError = error;
          retries++;
          if (retries < maxRetries) {
            console.log(`  ⚠️ Attempt ${retries} failed: ${error.message}. Retrying...`);
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }

      // All retries failed - return fallback score instead of throwing
      console.log(`  ℹ️ AI analysis skipped, using keyword-based fallback`);
      return 50; // Neutral fallback score
    } catch (error) {
      console.log(`  ℹ️ Text analysis using fallback scoring`);
      return 50; // Fallback for unexpected errors
    }
  }

  /**
   * Extract text from image using OCR
   */
  async extractImageText(imageBuffer) {
    try {
      const result = await Tesseract.recognize(imageBuffer, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing') {
            process.stdout.write(`\r    OCR: ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      console.log('');
      return (result.data?.text || result.text || '').trim();
    } catch (error) {
      console.log(`  ⚠️ OCR error: ${error.message}`);
      return '';
    }
  }

  /**
   * CORE DECISION LOGIC: Integrate all signals
   * This is where the POST AS A WHOLE is evaluated
   */
  integrateSignals(signals, captionText, imageBuffer) {
    const cap = signals.caption;
    const ocr = signals.ocrText;
    const vis = signals.visual;

    // Signal strength evaluation
    const captionPresent = captionText && captionText.trim().length > 5;
    const imagePresent = imageBuffer !== null;
    const ocrTextExtracted = ocr.text && ocr.text.length > 10;

    console.log('Signal Strengths:');
    console.log(`  Caption: ${captionPresent ? `Present (${cap.score}%)` : 'Absent'}`);
    console.log(`  OCR Text: ${ocrTextExtracted ? `Extracted (${ocr.score}%)` : 'None'}`);
    console.log(`  Visual: ${imagePresent ? `Detected (${vis.score}% - ${vis.category})` : 'None'}`);

    // DECISION SCENARIOS

    // Scenario 1: Casual content detected in ANY signal
    const captionIsCasual = captionPresent && cap.score < 25;
    const ocrIsCasual = ocrTextExtracted && ocr.score < 25;
    const visualIsCasual = imagePresent && vis.category === 'casual' && vis.score < 30;

    if (captionIsCasual || ocrIsCasual || visualIsCasual) {
      console.log('⚠️  CASUAL CONTENT DETECTED');
      return {
        score: 15,
        reason: 'Post contains casual/meme content',
        signals: {
          caption: cap,
          ocr: ocr,
          visual: vis
        },
        recommendation: 'REJECT',
        isCasual: true,
        analysisMethod: 'multi_signal_integrated'
      };
    }

    // Scenario 2: Image is a meme template (visual) with casual caption
    if (imagePresent && vis.category === 'casual' && captionIsCasual) {
      console.log('🎭 MEME DETECTED (visual + casual caption)');
      return {
        score: 10,
        reason: 'Meme format detected (casual visual + casual caption)',
        signals: {
          caption: cap,
          ocr: ocr,
          visual: vis
        },
        recommendation: 'REJECT',
        isCasual: true,
        analysisMethod: 'meme_pattern_detected'
      };
    }

    // Scenario 3: Selfie with motivational text (high signal conflict)
    if (imagePresent && vis.category === 'casual' && vis.score < 40 && 
        captionPresent && /studying|learning|working|day|love|blessed|grateful|proud|support/i.test(captionText)) {
      console.log('🤳 SELFIE + MOTIVATIONAL TEXT (lowering score)');
      // Selfie + casual caption about personal life = not educational
      const blendedScore = Math.max(15, (cap.score * 0.4) + (vis.score * 0.6));
      return {
        score: Math.round(blendedScore),
        reason: 'Selfie with personal motivational text - casual social media format',
        signals: {
          caption: cap,
          ocr: ocr,
          visual: vis
        },
        recommendation: blendedScore < 40 ? 'REJECT' : 'QUESTIONABLE',
        isCasual: true,
        analysisMethod: 'selfie_casual_detection'
      };
    }

    // Scenario 4: Screenshot of meme + caption
    if (imagePresent && vis.category === 'casual' && /screenshot/i.test(ocr.text + captionText)) {
      console.log('🖼️  SCREENSHOT MEME DETECTED');
      return {
        score: 12,
        reason: 'Screenshot of meme or casual content detected',
        signals: {
          caption: cap,
          ocr: ocr,
          visual: vis
        },
        recommendation: 'REJECT',
        isCasual: true,
        analysisMethod: 'meme_screenshot_detected'
      };
    }

    // Scenario 5: Educational image (diagram/whiteboard) with good caption
    if (imagePresent && vis.category === 'educational' && vis.score > 50 && captionPresent && cap.score > 50) {
      console.log('✅ EDUCATIONAL CONTENT CONFIRMED (visual + caption agreement)');
      const blendedScore = Math.round((cap.score * 0.3) + (ocr.score * 0.3) + (vis.score * 0.4));
      return {
        score: Math.min(95, blendedScore),
        reason: 'Educational content confirmed - visual + caption agreement',
        signals: {
          caption: cap,
          ocr: ocr,
          visual: vis
        },
        recommendation: 'APPROVE',
        isCasual: false,
        analysisMethod: 'educational_multi_signal_confirmed'
      };
    }

    // Scenario 6: Conflict between signals (e.g., casual visual, educational caption)
    const visualEducational = imagePresent && vis.score > 50;
    const captionEducational = captionPresent && cap.score > 50;
    const ocrEducational = ocrTextExtracted && ocr.score > 50;

    if (!visualEducational && captionEducational && ocrEducational) {
      console.log('⚡ SIGNAL CONFLICT: Casual visual but educational text');
      // Trust image visual over text - images don't lie
      const blendedScore = Math.round((cap.score * 0.2) + (ocr.score * 0.2) + (vis.score * 0.6));
      return {
        score: Math.max(15, blendedScore),
        reason: 'Casual visual content detected despite educational caption text',
        signals: {
          caption: cap,
          ocr: ocr,
          visual: vis
        },
        recommendation: blendedScore < 40 ? 'REJECT' : 'REVIEW',
        isCasual: !visualEducational,
        analysisMethod: 'signal_conflict_resolved'
      };
    }

    // Scenario 7: No image, just caption
    if (!imagePresent && captionPresent) {
      console.log(`📝 TEXT-ONLY POST: ${cap.score > 50 ? 'EDUCATIONAL' : 'CASUAL'}`);
      return {
        score: cap.score,
        reason: captionPresent ? 'Based on caption analysis only' : 'No content to analyze',
        signals: {
          caption: cap,
          ocr: ocr,
          visual: vis
        },
        recommendation: cap.score >= 50 ? 'APPROVE' : cap.score >= 30 ? 'REVIEW' : 'REJECT',
        isCasual: cap.score < 30,
        analysisMethod: 'text_only_analysis'
      };
    }

    // Scenario 8: Default weighted average
    console.log('📊 WEIGHTED AVERAGE OF ALL SIGNALS');
    const signals_array = [];
    let weight_sum = 0;
    let score_sum = 0;

    if (captionPresent) {
      signals_array.push(cap.score * cap.weight);
      weight_sum += cap.weight;
      score_sum += cap.score * cap.weight;
    }
    if (ocrTextExtracted) {
      signals_array.push(ocr.score * ocr.weight);
      weight_sum += ocr.weight;
      score_sum += ocr.score * ocr.weight;
    }
    if (imagePresent) {
      signals_array.push(vis.score * vis.weight);
      weight_sum += vis.weight;
      score_sum += vis.score * vis.weight;
    }

    const finalScore = weight_sum > 0 ? Math.round(score_sum / weight_sum) : 50;

    return {
      score: Math.max(5, Math.min(95, finalScore)),
      reason: 'Integrated multi-signal analysis',
      signals: {
        caption: cap,
        ocr: ocr,
        visual: vis
      },
      recommendation: finalScore >= 50 ? 'APPROVE' : finalScore >= 30 ? 'REVIEW' : 'REJECT',
      isCasual: finalScore < 30,
      analysisMethod: 'multi_signal_weighted_average'
    };
  }

  /**
   * Full content analysis wrapper - Main entry point for posts.js
   * Converts data formats and calls analyzePost
   */
  async analyzeFullContent({ caption, imageData, videoUrl, extractedOCR, visualFeatures, includeVisualFeatures }) {
    try {
      console.log('\n🔗 Content Integration: Starting full analysis...');
      
      // Convert image data if needed
      let imageBuffer = null;
      if (imageData) {
        if (typeof imageData === 'string' && imageData.startsWith('data:')) {
          // Base64 string - convert to buffer
          const base64Data = imageData.split(',')[1];
          imageBuffer = Buffer.from(base64Data, 'base64');
        } else if (Buffer.isBuffer(imageData)) {
          imageBuffer = imageData;
        } else if (typeof imageData === 'string') {
          // Try parsing as base64
          try {
            imageBuffer = Buffer.from(imageData, 'base64');
          } catch (e) {
            console.log('  ⚠️ Could not parse image data');
          }
        }
      }

      // Call the main analysis
      const result = await this.analyzePost(caption, imageBuffer);
      
      // Map the response to match what posts.js expects
      return {
        educationalScore: result.score,
        recommendation: result.recommendation,
        reason: result.reason,
        detectedPatterns: result.isCasual ? ['casual content detected'] : [],
        recommendReason: result.reason,
        textScore: result.signals?.caption?.score || 50,
        imageScore: result.signals?.visual?.score || 50,
        signals: result.signals
      };
    } catch (error) {
      console.error('❌ Full content analysis error:', error.message);
      return {
        educationalScore: 50,
        recommendation: 'REVIEW',
        reason: 'Analysis error: ' + error.message,
        detectedPatterns: [],
        textScore: 50,
        imageScore: 50
      };
    }
  }

  /**
   * Detect if text is casual social media content
   * SMARTER detection - avoid false positives on educational content
   */
  isCasualContent(text) {
    if (!text || text.length === 0) return false;

    const lowerText = text.toLowerCase();

    // Educational keywords that override any casual patterns
    const educationalKeywords = [
      'explain', 'learn', 'teach', 'understand', 'theory', 'concept', 'principle',
      'research', 'study', 'analysis', 'definition', 'method', 'procedure',
      'tutorial', 'guide', 'how to', 'science', 'math', 'history', 'language',
      'educational', 'academic', 'scholarly', 'technical', 'instruction',
      'lesson', 'course', 'chapter', 'section', 'equation', 'formula',
      'biology', 'chemistry', 'physics', 'literature', 'art', 'music',
      'algorithm', 'programming', 'code', 'development', 'system'
    ];

    // If text contains multiple educational keywords, it's NOT casual
    const educationalMatches = educationalKeywords.filter(kw => lowerText.includes(kw)).length;
    if (educationalMatches >= 2) {
      return false;
    }

    // Only detect OBVIOUS casual patterns (not false positives)
    const obviousCasualPatterns = [
      // Pure meme/joke indicators only
      /\bmeme\b|\bmemes\b/i,
      /\bjoke\b|\bjokes\b/i,
      /\blmao\b|\brofl\b/i,
      /caught in 4k/i,
      
      // Gen-Z brain rot slang (obviously not educational)
      /\bskibidi\b|\bgyatt\b|\bsigma\b/i,
      /\bno cap\b|\bfr fr\b/i,
      /\bno shot\b/i,
      
      // Personal selfie intro patterns
      /^me\s*:/i,
      /\bjust me\b|\b(my|your) selfie\b/i,
    ];

    for (const pattern of obviousCasualPatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }

    return false;
  }
}

module.exports = ContentIntegrationService;
