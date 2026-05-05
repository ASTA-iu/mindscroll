const { HfInference } = require('@huggingface/inference');

/**
 * Visual Recognition Service
 * Analyzes images using computer vision to detect content type WITHOUT requiring text
 * Detects: selfies, charts, diagrams, screenshots, meme templates, presentation slides, etc.
 */
class VisualRecognitionService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.client = new HfInference(apiKey);
  }

  /**
   * Classifies image content using HuggingFace ImageClassification model
   * Returns confidence scores for different content types
   */
  async classifyImageContent(imageBuffer) {
    try {
      console.log('  Running visual content classification...');
      
      // Use image classification to detect content type
      const result = await Promise.race([
        this.client.imageClassification({
          data: imageBuffer,
          model: 'google/vit-base-patch16-224'
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Image classification timeout')), 20000)
        )
      ]);

      console.log(`  ✓ Detected ${result.length} content categories`);
      return result; // Returns array of {label, score}

    } catch (error) {
      console.log(`  ⚠️ Visual classification error: ${error.message}`);
      return [];
    }
  }

  /**
   * Analyze visual features and return educational scoring
   * HIGH SCORE (educational): diagrams, whiteboard, presentation, textbook, educational charts
   * LOW SCORE (casual): selfie, portrait, social-media-like content, meme
   */
  async analyzeVisualFeatures(imageBuffer) {
    try {
      const categories = await this.classifyImageContent(imageBuffer);
      
      if (categories.length === 0) {
        return {
          score: 40, // Neutral if can't detect
          confidence: 0.3,
          detected: [],
          reason: 'Could not classify image content'
        };
      }

      // Score based on detected categories
      const result = this.scoreByContentType(categories);
      
      console.log(`  Visual Analysis: Score ${result.score}% - ${result.reason}`);
      
      return result;

    } catch (error) {
      console.error('  ❌ Visual feature analysis error:', error.message);
      return {
        score: 50,
        confidence: 0,
        detected: [],
        reason: 'Error analyzing visual features'
      };
    }
  }

  /**
   * Score image based on detected content types
   */
  scoreByContentType(categories) {
    // Educational content indicators
    const educationalKeywords = [
      'whiteboard', 'chalkboard', 'presentation', 'slide', 'diagram', 'chart',
      'graph', 'equation', 'formula', 'writing', 'blackboard', 'poster',
      'textbook', 'book', 'document', 'screenshot', 'computer screen', 'display',
      'lecture', 'classroom', 'desk', 'study', 'learning', 'education',
      'scientific', 'biology', 'chemistry', 'physics', 'mathematics', 'math',
      'microscope', 'laboratory', 'research', 'data', 'infographic', 'illustration',
      'medical', 'health', 'anatomy', 'disease', 'virus', 'bacterial', 'parasite',
      'cell', 'organ', 'tissue', 'system', 'cycle', 'process', 'mechanism',
      'flowchart', 'mindmap', 'concept', 'structure', 'model', 'schematic',
      'anatomy', 'physiology', 'pathology', 'embryology', 'histology'
    ];

    // Casual/non-educational content indicators
    const casualKeywords = [
      'selfie', 'portrait', 'face', 'person', 'people', 'human', 'girl', 'boy', 'woman', 'man',
      'mirror', 'reflection', 'fashion', 'clothing', 'outfit', 'cosmetics', 'makeup',
      'bedroom', 'bathroom', 'selfie stick', 'phone', 'camera phone', 'mobile phone',
      'meme', 'comic', 'toy', 'doll', 'game', 'entertainment',
      'party', 'celebration', 'event', 'performance', 'show', 'concert',
      'food', 'drink', 'meal', 'restaurant', 'café', 'coffee'
    ];

    const detected = [];
    let educationalScore = 0;
    let casualScore = 0;

    // Analyze each detected category
    categories.forEach(category => {
      const label = category.label.toLowerCase();
      const confidence = category.score || 0;

      detected.push({ label: category.label, score: Math.round(confidence * 100) });

      // Check if educational
      if (educationalKeywords.some(keyword => label.includes(keyword))) {
        educationalScore += confidence * 100;
      }

      // Check if casual
      if (casualKeywords.some(keyword => label.includes(keyword))) {
        casualScore += confidence * 100;
      }
    });

    // Determine final score
    let finalScore = 50; // Default neutral
    let reason = 'Neutral image content';
    let typeDetected = 'mixed';

    if (educationalScore > casualScore) {
      // Educational content detected - boost the score for diagrams and infographics
      const categoryLabels = detected.map(d => d.label.toLowerCase()).join(' ');
      const hasInfographic = categoryLabels.includes('infographic') || categoryLabels.includes('illustration') || categoryLabels.includes('diagram');
      
      let baseScore = 60 + (educationalScore / categories.length);
      if (hasInfographic) {
        baseScore = Math.max(baseScore, 70); // Diagrams/infographics get at least 70%
      }
      
      finalScore = Math.round(Math.min(95, baseScore));
      reason = 'Educational visual content detected';
      typeDetected = 'educational';
    } else if (casualScore > educationalScore) {
      // Casual content detected
      const maxCasual = Math.max(5, Math.min(30, casualScore / categories.length));
      finalScore = Math.round(maxCasual);
      reason = 'Casual social media content detected';
      typeDetected = 'casual';
    } else if (detected.length > 0) {
      // Equal or mixed - look at primary detection
      const primary = detected[0];
      const categoryLabels = detected.map(d => d.label.toLowerCase()).join(' ');
      
      // Selfie/portrait is a red flag for casual
      if (primary.label.toLowerCase().includes('portrait') ||
          primary.label.toLowerCase().includes('face') ||
          primary.label.toLowerCase().includes('selfie')) {
        finalScore = 25;
        reason = 'Selfie/portrait detected - likely casual content';
        typeDetected = 'casual';
      }
      // Diagrams/illustrations are educational even if mixed signals
      else if (categoryLabels.includes('diagram') || categoryLabels.includes('infographic') || categoryLabels.includes('illustration')) {
        finalScore = 65; // Default high score for diagrams
        reason = 'Diagram/infographic detected - educational content';
        typeDetected = 'educational';
      }
    }

    return {
      score: finalScore,
      confidence: Math.max(...categories.map(c => c.score || 0)),
      detected: detected,
      reason: reason,
      type: typeDetected,
      analysisMethod: 'visual_classification'
    };
  }

  /**
   * Detect if image appears to be a meme based on visual features
   */
  async isSuspectedMeme(categories) {
    if (!categories || categories.length === 0) return false;

    const memeIndicators = [
      'comic', 'cartoon', 'meme', 'text overlay', 'screenshot',
      'social media', 'notification', 'status'
    ];

    // If screenshot or has text overlay + casual content, likely meme
    const hasScreenshot = categories.some(c => 
      c.label.toLowerCase().includes('screenshot') && (c.score || 0) > 0.3
    );

    const hasMemeIndicators = categories.some(c =>
      memeIndicators.some(ind => c.label.toLowerCase().includes(ind)) &&
      (c.score || 0) > 0.2
    );

    const hasFaceDetection = categories.some(c =>
      (c.label.toLowerCase().includes('face') || c.label.toLowerCase().includes('person')) &&
      (c.score || 0) > 0.4
    );

    // Screenshot + detected objects = likely meme/comic
    return (hasScreenshot && hasMemeIndicators) || (hasFaceDetection && hasMemeIndicators);
  }

  /**
   * Analyze image for educational value using BOTH visual and text features
   * This combines visual classification with any OCR text
   */
  async analyzeWithContext(imageBuffer, ocrText = null) {
    try {
      const visualAnalysis = await this.analyzeVisualFeatures(imageBuffer);

      // If we have OCR text, we can blend scores intelligently
      if (ocrText && ocrText.trim().length > 0) {
        console.log('  Combining visual and text analysis...');
        
        // Check if OCR text is educational
        const textIsEducational = /explain|how to|why|learn|teach|definition|meaning|concept|guide|tutorial|research|study|analysis|example|method|formula|theory|principle|law|physics|chemistry|biology|math|history|culture|art|science|prove|demonstrate|evidence|data|found|discover|fact|information|knowledge|education|disease|virus|parasite|transmission|infection|symptom|treatment|diagnosis|medical|health|anatomy|organ|cell|tissue|system|cycle|process|mechanism|cause|effect/i.test(ocrText);
        
        let combinedScore = visualAnalysis.score;
        
        // If visual says it's a diagram/infographic AND text is educational, trust the combination heavily
        if ((visualAnalysis.type === 'educational' || visualAnalysis.score >= 65) && textIsEducational) {
          // Both agree it's educational - boost to 75-85%
          combinedScore = Math.max(75, visualAnalysis.score);
          console.log(`  ✓ Visual and text both confirm educational - boosting to ${combinedScore}%`);
        } 
        // If visual is neutral/low but text is clearly educational, boost it
        else if (textIsEducational && visualAnalysis.score < 60) {
          combinedScore = Math.min(85, Math.max(visualAnalysis.score, 60) + 20);
          console.log(`  ✓ Text is educational, boosting visual score to ${combinedScore}%`);
        } 
        // If visual says casual but text says educational, trust text more (text doesn't lie about content)
        else if (!textIsEducational && visualAnalysis.score > 50) {
          combinedScore = Math.max(25, visualAnalysis.score - 30);
          console.log(`  Text indicates casual content, reducing visual score to ${combinedScore}%`);
        }

        return {
          ...visualAnalysis,
          score: combinedScore,
          analysisMethod: 'visual_text_combined',
          textPresent: true
        };
      }

      // No text - use visual analysis as primary
      return {
        ...visualAnalysis,
        textPresent: false
      };

    } catch (error) {
      console.error('  ❌ Combined analysis error:', error.message);
      return {
        score: 50,
        confidence: 0,
        detected: [],
        reason: 'Error in combined visual-text analysis'
      };
    }
  }
}

module.exports = VisualRecognitionService;
