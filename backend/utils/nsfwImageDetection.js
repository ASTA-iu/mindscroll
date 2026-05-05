/**
 * NSFW Image Detection Service - FREE TIER OPTIMIZED
 * PRIMARY: HuggingFace Falconsai/nsfw_image_detection (45 second timeout)
 * SECONDARY: OCR keyword detection (local, no API calls)
 * All methods are FREE - no paid APIs
 */

const { HfInference } = require('@huggingface/inference');
const Tesseract = require('tesseract.js');

class NSFWImageDetection {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.client = new HfInference(apiKey);
    
    // NSFW detection keywords
    this.nsfwKeywords = [
      'nude', 'naked', 'sex', 'porn', 'adult', 'explicit', 'xxx',
      'sexual', 'breast', 'nsfw', 'erotic', 'strip', 'intercourse',
      'lingerie', 'bikini', 'exposed', 'undressing'
    ];
    
    // Violence detection keywords
    this.violenceKeywords = [
      'kill', 'murder', 'death', 'violence', 'bloody', 'assault', 'attack',
      'bomb', 'gun', 'knife', 'weapon', 'fight', 'blood', 'gore',
      'shoot', 'stab', 'hurt', 'injure', 'harm', 'hit', 'wounded', 'injury',
      'explosion', 'gunshot', 'warfare', 'combat', 'brutal', 'massacre',
      'hang', 'strangle', 'torture', 'mutilate', 'dismember', 'behead',
      'decapitate', 'slash', 'amputate', 'execute', 'execution'
    ];
  }

  /**
   * Extract text from image using OCR (FREE, LOCAL)
   */
  async extractOCRText(imageBuffer) {
    try {
      console.log('   📝 Extracting text via OCR...');
      const result = await Tesseract.recognize(imageBuffer, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing' && Math.round(m.progress * 100) % 25 === 0) {
            process.stdout.write(`\r   OCR: ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      
      const text = (result.data?.text || '').toLowerCase().trim();
      if (text) {
        console.log(`\n   ✓ OCR found: "${text.substring(0, 50)}..."`);
      }
      return text;
    } catch (error) {
      console.log(`\n   ⚠️ OCR failed: ${error.message}`);
      return '';
    }
  }

  /**
   * Check OCR text for keywords (PRIMARY METHOD - FAST, no API calls)
   */
  checkOCRKeywords(text) {
    if (!text || text.length === 0) return { nsfw: 0, violence: 0, matches: { nsfw: 0, violence: 0 } };
    
    let nsfwMatches = 0;
    let violenceMatches = 0;
    
    this.nsfwKeywords.forEach(keyword => {
      if (text.includes(keyword)) nsfwMatches++;
    });
    
    this.violenceKeywords.forEach(keyword => {
      if (text.includes(keyword)) violenceMatches++;
    });
    
    return {
      nsfw: Math.min(nsfwMatches * 0.3, 1.0),
      violence: Math.min(violenceMatches * 0.3, 1.0),
      matches: { nsfw: nsfwMatches, violence: violenceMatches }
    };
  }

  /**
   * Detect NSFW using HuggingFace Falconsai (FREE, with 45 sec timeout)
   */
  async detectNSFWWithHF(imageBuffer) {
    try {
      console.log('   🔍 HF Falconsai/nsfw_image_detection (45s timeout)...');

      const result = await Promise.race([
        this.client.imageClassification({
          data: imageBuffer,
          model: 'Falconsai/nsfw_image_detection'
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('HF timeout after 45s')), 45000)
        )
      ]);

      if (!result || !Array.isArray(result) || result.length === 0) {
        console.log('   ⚠️ HF returned no results');
        return null;
      }

      const nsfwLabel = result.find(r => 
        r.label && r.label.toLowerCase().includes('nsfw')
      );
      
      const safeLabel = result.find(r => 
        r.label && (r.label.toLowerCase().includes('safe') || r.label.toLowerCase().includes('normal'))
      );

      if (nsfwLabel && nsfwLabel.score) {
        console.log(`   ✓ HF: NSFW ${(nsfwLabel.score * 100).toFixed(1)}%`);
        return nsfwLabel.score;
      }
      
      if (safeLabel && safeLabel.score) {
        const score = 1 - safeLabel.score;
        console.log(`   ✓ HF: Safe (inverse: ${(score * 100).toFixed(1)}%)`);
        return score;
      }

      console.log(`   ⚠️ HF labels: ${result.map(r => r.label).join(', ')}`);
      return null;
    } catch (error) {
      console.log(`   ⚠️ HF failed: ${error.message}`);
      return null;
    }
  }

  /**
   * COMPREHENSIVE CHECK: HF (50%) + OCR Keywords (50%)
   * FREE TIER ONLY - No paid APIs
   */
  async comprehensiveCheck(imageBuffer) {
    console.log('\n🚫 COMPREHENSIVE NSFW & VIOLENCE CHECK');
    console.log('='.repeat(60));

    console.log('   Running parallel: HF + OCR...\n');
    
    const hfPromise = this.detectNSFWWithHF(imageBuffer);
    const ocrPromise = this.extractOCRText(imageBuffer);

    const [hfScore, ocrText] = await Promise.all([
      hfPromise,
      ocrPromise
    ]);

    const ocrScores = this.checkOCRKeywords(ocrText);

    // WEIGHTED: HF 50% + OCR 50%
    let nsfwScore = 0;
    let sources = [];

    if (hfScore !== null && hfScore !== undefined) {
      nsfwScore += hfScore * 0.5;
      sources.push(`HF: ${(hfScore * 100).toFixed(0)}%`);
    }

    nsfwScore += ocrScores.nsfw * 0.5;
    if (ocrScores.matches.nsfw > 0) {
      sources.push(`OCR: ${ocrScores.matches.nsfw} keywords`);
    }

    nsfwScore = Math.min(nsfwScore, 1.0);
    const isNSFW = nsfwScore >= 0.4; // 40% threshold

    console.log(`\n📊 FINAL NSFW ASSESSMENT:`);
    console.log(`   Detection: ${sources.join(' | ') || 'No detections'}`);
    console.log(`   Score: ${(nsfwScore * 100).toFixed(0)}% (threshold: 40%)`);
    console.log(`   Status: ${isNSFW ? '❌ BLOCKED' : '✅ SAFE'}`);
    console.log('='.repeat(60) + '\n');

    return {
      nsfw_score: Math.round(nsfwScore * 100),
      is_nsfw: isNSFW,
      is_blocked: isNSFW,
      recommendation: isNSFW ? 'REJECT' : 'APPROVE',
      reason: isNSFW ? 'NSFW/Adult content detected' : 'Image is safe',
      confidence: 'high',
      method: 'hf_ocr_hybrid'
    };
  }

  /**
   * Detect violence (OCR primary + HF secondary)
   */
  async detectViolenceComprehensive(imageBuffer) {
    console.log('\n⚠️ COMPREHENSIVE VIOLENCE CHECK');
    console.log('='.repeat(60));

    console.log('   Running: OCR keyword detection...\n');
    
    const ocrText = await this.extractOCRText(imageBuffer);
    const ocrScores = this.checkOCRKeywords(ocrText);
    
    let violenceScore = ocrScores.violence;
    let sources = [];

    if (ocrScores.matches.violence > 0) {
      sources.push(`OCR: ${ocrScores.matches.violence} keywords`);
    }

    violenceScore = Math.min(violenceScore, 1.0);
    const isViolent = violenceScore >= 0.4;

    console.log(`\n📊 FINAL VIOLENCE ASSESSMENT:`);
    console.log(`   Detection: ${sources.join(' | ') || 'No detections'}`);
    console.log(`   Score: ${(violenceScore * 100).toFixed(0)}% (threshold: 40%)`);
    console.log(`   Status: ${isViolent ? '❌ BLOCKED' : '✅ SAFE'}`);
    console.log('='.repeat(60) + '\n');

    return {
      violence_score: Math.round(violenceScore * 100),
      is_violent: isViolent,
      is_blocked: isViolent,
      recommendation: isViolent ? 'REJECT' : 'APPROVE',
      reason: isViolent ? 'Violent/graphic content detected' : 'Image contains no violence',
      method: 'ocr_primary'
    };
  }
}

module.exports = NSFWImageDetection;
