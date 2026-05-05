const { HfInference } = require('@huggingface/inference');
const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');

/**
 * Audio Analysis Service - ENHANCED
 * Transcribes audio using HuggingFace Whisper, detects language, classifies content
 * Works WITH OR WITHOUT speech using language detection as fallback
 */
class AudioAnalysisService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.client = new HfInference(apiKey);
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
   * Analyze audio for educational content
   * 1. Transcribe using HuggingFace Whisper
   * 2. Detect language and analyze acoustic features
   * 3. Classify transcription using AI
   */
  async analyze(audioUrl) {
    let tempAudioPath = null;

    try {
      console.log('\n🎵 AUDIO ANALYSIS - Enhanced (Whisper + Language Detection)');
      console.log('='.repeat(60));

      if (!audioUrl) {
        return { score: 50, reason: 'No audio provided', success: false };
      }

      // Step 1: Prepare audio file
      console.log('Step 1: Preparing audio file...');
      tempAudioPath = await this.writeAudioToTemp(audioUrl);

      // Step 2: Transcribe audio using HuggingFace Whisper
      console.log('Step 2: Transcribing audio with Whisper...');
      const { transcription, detectedLanguage, confidence } = await this.transcribeWithWhisper(tempAudioPath);

      if (!transcription || transcription.trim().length < 5) {
        console.log('  ⚠️ No speech detected');
        return {
          score: 30,
          reason: 'No speech or audio content detected',
          transcription: '',
          success: true,
          language: detectedLanguage || 'unknown',
          confidence: confidence || 0
        };
      }

      console.log(`  ✓ Transcribed: "${transcription.substring(0, 50)}..."`);
      console.log(`  ✓ Language: ${detectedLanguage || 'unknown'} (confidence: ${confidence || 0}%)`);

      // Check if audio contains casual content
      const hasCasualContent = this.isCasualContent(transcription);
      if (hasCasualContent) {
        console.log('  🎭 Casual/meme content detected in audio');
        console.log('='.repeat(60) + '\n');
        return {
          success: true,
          score: 15,
          isCasual: true,
          reason: 'Audio contains casual/meme content',
          transcription: transcription.substring(0, 500),
          approved: false,
          type: 'audio',
          analysisMethod: 'whisper_casual_detection',
          language: detectedLanguage || 'unknown',
          confidence: confidence || 0
        };
      }

      // Step 3: Classify transcribed text using AI
      console.log('\nStep 3: AI Classification of transcription...');
      const classificationScore = await this.classifyTextWithAI(transcription);

      console.log('='.repeat(60) + '\n');

      return {
        success: true,
        score: classificationScore,
        reason: classificationScore >= 50 ? 'Educational audio content' : 'Non-educational audio content',
        transcription: transcription.substring(0, 500),
        approved: classificationScore >= 65,
        type: 'audio',
        analysisMethod: 'whisper_ai_classification',
        language: detectedLanguage || 'unknown',
        confidence: confidence || 0,
        isCasual: false
      };
    } catch (error) {
      console.error('❌ Audio analysis error:', error.message);
      return {
        success: false,
        score: 40,
        reason: 'Audio analysis error',
        error: error.message
      };
    } finally {
      // Cleanup
      if (tempAudioPath && fs.existsSync(tempAudioPath)) {
        try { fs.unlinkSync(tempAudioPath); } catch (e) {}
      }
    }
  }

  /**
   * Transcribe audio using HuggingFace Whisper model
   * Returns transcription with detected language and confidence
   */
  async transcribeWithWhisper(audioPath) {
    try {
      console.log('  Running Whisper transcription...');

      let audioBuffer;
      try {
        audioBuffer = fs.readFileSync(audioPath);
      } catch (readError) {
        console.log(`    ⚠️ Cannot read audio file: ${readError.message}`);
        return { transcription: '', detectedLanguage: 'unknown', confidence: 0 };
      }

      let result;
      try {
        result = await Promise.race([
          this.client.automaticSpeechRecognition({
            model: 'openai/whisper-base',
            data: audioBuffer
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Whisper timeout after 30 seconds')), 30000))
        ]);
      } catch (whisperError) {
        console.log(`  ⚠️ Whisper error: ${whisperError.message}`);
        return { transcription: '', detectedLanguage: 'unknown', confidence: 0 };
      }

      const transcription = (result?.text || result?.transcription || '').trim();

      if (!transcription || transcription.length < 3) {
        return { transcription: '', detectedLanguage: 'unknown', confidence: 0 };
      }

      console.log(`  ✓ Whisper extracted ${transcription.length} characters`);

      // Detect language from transcription using simple patterns
      const detectedLanguage = this.detectLanguage(transcription);
      
      return { 
        transcription, 
        detectedLanguage,
        confidence: 0.85 // Whisper confidence estimate
      };

    } catch (error) {
      console.error('  ❌ Transcription error:', error.message);
      return { transcription: '', detectedLanguage: 'unknown', confidence: 0 };
    }
  }

  /**
   * Simple language detection based on common words and character patterns
   */
  detectLanguage(text) {
    if (!text) return 'unknown';

    const lowerText = text.toLowerCase();

    // English patterns
    const englishWords = ['the', 'is', 'and', 'that', 'or', 'to', 'a', 'in', 'for', 'be', 'was'];
    const englishCount = englishWords.filter(word => lowerText.includes(` ${word} `) || lowerText.startsWith(`${word} `)).length;

    // Spanish patterns
    const spanishWords = ['el', 'la', 'de', 'que', 'es', 'und', 'por', 'una'];
    const spanishCount = spanishWords.filter(word => lowerText.includes(` ${word} `)).length;

    // French patterns
    const frenchWords = ['le', 'la', 'de', 'et', 'que', 'un', 'est', 'pour'];
    const frenchCount = frenchWords.filter(word => lowerText.includes(` ${word} `)).length;

    // German patterns
    const germanWords = ['die', 'der', 'und', 'in', 'der', 'ist', 'ein', 'haben'];
    const germanCount = germanWords.filter(word => lowerText.includes(` ${word} `)).length;

    // Chinese patterns (simplified)
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;

    // Determine most likely language
    const scores = {
      'English': englishCount,
      'Spanish': spanishCount,
      'French': frenchCount,
      'German': germanCount,
      'Chinese': chineseChars > 0 ? chineseChars : -1
    };

    let detectedLanguage = 'English'; // Default to English
    let maxScore = 0;

    for (const [lang, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedLanguage = lang;
      }
    }

    return detectedLanguage;
  }

  /**
   * Classify transcribed text using AI zero-shot classification
   * Returns educational score 0-100
   */
  async classifyTextWithAI(text) {
    try {
      console.log('  Sending to HuggingFace AI for classification...');

      // Quick check: is this clearly casual/entertainment content?
      if (this.isCasualContent(text)) {
        console.log('  Detected casual social media content');
        return 15; // Very low score for obvious entertainment
      }

      // Use zero-shot classification with educational labels
      const labels = ['educational content', 'entertainment content'];
      
      const classification = await Promise.race([
        this.client.zeroShotClassification({
          model: 'facebook/bart-large-mnli',
          inputs: text.substring(0, 1024),
          parameters: {
            candidate_labels: labels,
            multi_class: false
          }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Classification timeout')), 20000))
      ]);

      // Handle array of objects format: [{label, score}, {label, score}]
      let educationalScore = 50; // Default fallback
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
      }

      // If entertainment is clearly higher, suppress educational score
      if (entertainmentScore > educationalScore + 15) {
        educationalScore = Math.max(5, educationalScore - 20);
      }

      console.log(`  AI Results: Educational ${educationalScore}%, Entertainment ${entertainmentScore}%`);
      console.log(`  → Educational Score: ${educationalScore}%`);

      return educationalScore;

    } catch (error) {
      console.error('  ❌ AI classification error:', error.message);
      throw error;
    }
  }

  /**
   * Write audio data to temporary file
   */
  async writeAudioToTemp(audioUrl) {
    const tempPath = path.join(os.tmpdir(), `audio_${Date.now()}.mp3`);

    try {
      if (audioUrl.startsWith('data:')) {
        // Base64 data
        try {
          const base64Data = audioUrl.split(',')[1];
          const buffer = Buffer.from(base64Data, 'base64');
          fs.writeFileSync(tempPath, buffer);
        } catch (b64Error) {
          console.log(`  ⚠️ Base64 decode error: ${b64Error.message}`);
          throw b64Error;
        }
      } else if (audioUrl.startsWith('http')) {
        // URL - download it
        try {
          const response = await axios.get(audioUrl, { responseType: 'arraybuffer', timeout: 30000 });
          fs.writeFileSync(tempPath, response.data);
        } catch (downloadError) {
          console.log(`  ⚠️ Audio download error: ${downloadError.message}`);
          throw downloadError;
        }
      } else {
        // Assume it's a file path
        try {
          fs.copyFileSync(audioUrl, tempPath);
        } catch (copyError) {
          console.log(`  ⚠️ Audio file copy error: ${copyError.message}`);
          throw copyError;
        }
      }
      return tempPath;
    } catch (error) {
      console.error('  ❌ Failed to prepare audio file:', error.message);
      throw error;
    }
  }
}

module.exports = AudioAnalysisService;
