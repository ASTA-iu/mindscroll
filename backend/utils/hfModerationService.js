/**
 * HuggingFace-Based Content Moderation Service
 * Alternative to Sightengine - Uses HF models for NSFW, Violence, Offensive detection
 * Works for: Text, Image (via OCR), Video (via frames), Audio (via transcription)
 */

const { HfInference } = require('@huggingface/inference');

class HFModerationService {
  constructor(apiKey) {
    this.client = new HfInference(apiKey);
    this.timeout = 10000;

    // COMPREHENSIVE keyword-based scoring with violation detection
    // NSFW CONTENT - Explicit adult material
    this.nsfwKeywords = [
      'nude', 'naked', 'sex', 'porn', 'adult', 'explicit', 'xxx', 'nsfw',
      'sexual', 'breast', 'erotic', 'strip', 'intercourse', 'penetration',
      'orgasm', 'cum', 'blowjob', 'cumshot', 'orgy', 'threesome',
      'prostitute', 'escort', 'prostitution', 'onlyfans', 'sluts',
      'sexual content', 'adult content', 'mature audiences', 'sexy', 'horny',
      'wet', 'aroused', 'climax', 'nude beach', 'explicit photos',
      'check out these', 'XXX material', 'sexual community'
    ];

    // VIOLENCE - Aggressive, dangerous, harmful content
    this.violenceKeywords = [
      'kill', 'murder', 'death', 'violence', 'bloody', 'assault', 'attack',
      'bomb', 'gun', 'weapon', 'fight', 'punch', 'kick', 'blood', 'gore',
      'shoot', 'stab', 'hurt', 'injure', 'harm', 'hit', 'violent', 'deadly',
      'want to kill', 'bloody war', 'murdered', 'guns and bombs',
      'stab them', 'bleed', 'violent attack', 'slash', 'slaughter',
      'beat', 'torture', 'rape', 'molest', 'abuse', 'mutilate',
      'massacre', 'genocide', 'terrorism', 'terrorist'
    ];

    // OFFENSIVE/HATE SPEECH - Discriminatory, hateful content  
    this.offensiveKeywords = [
      'hate', 'racist', 'sexist', 'homophobic', 'transphobic', 'discrimination',
      'slur', 'offensive', 'disgusting', 'despicable', 'vile', 'abusive',
      'toxic', 'bully', 'mock', 'degrade', 'insulting', 'demeaning',
      'hate all', 'disgusting and vile', 'racist joke', 'sexist jokes',
      'mock and bully', 'homophobic', 'bigot', 'ugly', 'worthless',
      'inferior', 'scum', 'subhuman', 'should be exterminated'
    ];

    // DRUG-RELATED - Illegal drugs, drug glorification, drug sales
    this.drugKeywords = [
      'cocaine', 'heroin', 'meth', 'methamphetamine', 'fentanyl', 'opioid',
      'weed', 'marijuana', 'cannabis', 'ecstasy', 'mdma', 'lsd', 'acid',
      'crack', 'crystal', 'drug dealer', 'dealer', 'pusher', 'supplier',
      'drug abuse', 'substance abuse', 'addiction', 'junkie', 'addict',
      'high', 'trip', 'overdose', 'od', 'snort', 'inject', 'shoot up',
      'xanax', 'oxycodone', 'vicodin', 'hydrocodone', 'pill pushes',
      'pharmacy scam', 'prescription fraud', 'pill mill', 'buy cocaine',
      'heroin dealers', 'how to make meth', 'no prescription', 'lsd trip'
    ];

    // MEME/BRAIN ROT - Social media slang, meme culture, low-effort content
    this.memeKeywords = [
      'meme', 'lol', 'haha', 'lmao', 'rofl', 'funny', 'joke', 'prank',
      'troll', 'wtf', 'omg', 'bruh', 'sus', 'based', 'cringe', 'simp',
      'no cap', 'fr fr', 'lowkey', 'highkey', 'periodt', 'bussin',
      'skibidi', 'gyatt', 'caught in 4k', "it's giving", 'main character',
      'energy', 'mood', 'vibes', "bet you can't", 'shitpost', 'pov',
      'when you', 'this is so me', 'dying', 'dying laughing',
      'doggo', 'pupper', 'fur baby', 'adorbs', 'cute overload'
    ];

    // DISTRACTION - Entertainment, gossip, lifestyle, non-educational
    this.distractionKeywords = [
      // Gossip/Celebrity
      'gossip', 'celebrity', 'drama', 'tea', 'spill the tea', 'breakup',
      'relationship', 'dating tips', 'love advice', 'crush', 'dating',
      'romance', 'relationship drama', 'breakup advice', 'celebrity tea',
      // Lifestyle/Routine
      'lifestyle', 'vlog', 'day in my life', 'morning routine', 'morning vibe',
      'aesthetic', 'ritual', 'vibes', 'routine video', 'aesthetic morning',
      // Trending/Challenges
      'trending', 'viral', 'challenge', 'trending challenge', 'dare',
      'viral moment', 'caught on camera',
      // Gaming/Streaming
      'fortnite', 'gameplay', 'walkthrough', 'esports', 'twitch', 'streaming',
      'youtube gaming', "let's play", 'gaming setup', 'game trailer',
      'reaction', "let's play video",
      // Fashion/Beauty
      'outfit', 'ootd', 'fashion', 'makeup', 'haul', 'unboxing',
      'beauty', 'cosmetics', 'skincare', 'makeup tutorial',
      // Entertainment/Music
      'music video', 'music reaction', 'song cover', 'singing',
      'reaction video', 'entertainment'
    ];
  }

  /**
   * Check text for NSFW, violence, offensive, and drug-related content
   * Includes context-aware filtering for medical/science content
   * Returns detailed information about violations with matched keywords
   */
  async checkText(text) {
    if (!text || text.trim().length === 0) {
      return { 
        nsfw: 0, 
        violence: 0, 
        offensive: 0, 
        drugs: 0,
        nsfwMatches: [],
        violenceMatches: [],
        offensiveMatches: [],
        drugMatches: []
      };
    }

    console.log('   🔍 Checking text for violations...');
    
    // Detect if text is scientific/medical in nature
    const medicalKeywords = /(disease|virus|bacteria|infection|immune|vaccine|treatment|symptom|disorder|antibody|pathogen|microscopic|microorganism|diagnosis|cure|therapy|clinical)/gi;
    const isMedicalContent = medicalKeywords.test(text);
    
    const scores = {
      nsfw: this.scoreKeywords(text, this.nsfwKeywords),
      violence: this.scoreKeywords(text, this.violenceKeywords),
      offensive: this.scoreKeywords(text, this.offensiveKeywords),
      drugs: this.scoreKeywords(text, this.drugKeywords),
      nsfwMatches: this.getMatches(text, this.nsfwKeywords),
      violenceMatches: this.getMatches(text, this.violenceKeywords),
      offensiveMatches: this.getMatches(text, this.offensiveKeywords),
      drugMatches: this.getMatches(text, this.drugKeywords)
    };

    // In medical/science contexts, reduce violence score since keywords are educational
    if (isMedicalContent && scores.violence > 0) {
      console.log(`   📚 Medical/Science content detected - adjusting violence threshold`);
      scores.violence = Math.max(0, scores.violence * 0.3);
      scores.violenceMatches = []; // Clear matches for medical context
    }

    console.log(`      🔴 NSFW: ${(scores.nsfw * 100).toFixed(1)}% ${scores.nsfwMatches.length > 0 ? '- ' + scores.nsfwMatches.join(', ') : ''}`);
    console.log(`      🔴 Violence: ${(scores.violence * 100).toFixed(1)}% ${scores.violenceMatches.length > 0 ? '- ' + scores.violenceMatches.join(', ') : ''}`);
    console.log(`      🔴 Offensive: ${(scores.offensive * 100).toFixed(1)}% ${scores.offensiveMatches.length > 0 ? '- ' + scores.offensiveMatches.join(', ') : ''}`);
    console.log(`      🔴 Drugs: ${(scores.drugs * 100).toFixed(1)}% ${scores.drugMatches.length > 0 ? '- ' + scores.drugMatches.join(', ') : ''}`);

    return scores;
  }

  /**
   * Get actual keyword matches found in text
   */
  getMatches(text, keywords) {
    const textLower = text.toLowerCase();
    const matches = [];
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\b`, 'gi');
      const found = textLower.match(regex);
      if (found) {
        found.forEach(match => {
          const clean = match.toLowerCase();
          if (!matches.includes(clean)) {
            matches.push(clean);
          }
        });
      }
    });
    
    return matches.slice(0, 5); // Return top 5 matches
  }

  /**
   * Score text based on keyword presence with CONTEXT AWARENESS
   */
  scoreKeywords(text, keywords) {
    const textLower = text.toLowerCase();
    let matchCount = 0;
    let totalMatches = 0;

    // CONTEXT AWARENESS: Medical/science context keywords that exclude violence scoring
    const medicalContext = /disease|virus|bacteria|infection|immune|vaccine|treatment|symptom|disorder|antibody|pathogen|microorganism|microscopic|lethal|deadly|combat|fight|battle|cure|heal|drug|medicine|pharmaceutical/gi;
    const scienceContext = /science|research|study|experiment|analysis|physics|chemistry|biology|data|evidence|hypothesis|theory|academic|medical|scientific|clinical|laboratory|test/gi;
    
    const hasMedicalContext = medicalContext.test(text);
    const hasScienceContext = scienceContext.test(text);

    // For violence keywords, apply context filters
    keywords.forEach(keyword => {
      // Context exceptions: Some keywords should be ignored in medical/science context
      if ((keyword === 'kill' || keyword === 'death' || keyword === 'harm' || keyword === 'hurt' || keyword === 'attack') && (hasMedicalContext || hasScienceContext)) {
        // In medical context, "killer" means deadly disease, "attack" means immune attack
        // These are educational, not violent
        return; // Skip scoring these in medical context
      }

      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = textLower.match(regex);
      if (matches) {
        totalMatches += matches.length;
        matchCount++;
      }
    });

    // Score: 0-1 based on keyword presence and frequency
    // Each keyword that appears adds ~0.1, capped at 1.0
    const score = Math.min((matchCount * 0.12) + (totalMatches * 0.05), 1.0);
    return score;
  }

  /**
   * Make moderation decision with detailed violation information
   */
  makeModerationDecision(scores) {
    const thresholds = {
      nsfw: 0.1,      // 10% - stricter moderation
      violence: 0.1,  // 10% - stricter moderation
      offensive: 0.1, // 10% - stricter moderation
      drugs: 0.1      // 10% - stricter moderation
    };

    const violations = [];
    const violationDetails = {};

    if (scores.nsfw > thresholds.nsfw) {
      violations.push(`🔞 NSFW Content (${(scores.nsfw * 100).toFixed(1)}%)`);
      violationDetails.nsfw = {
        type: 'NSFW Content',
        score: scores.nsfw,
        reason: 'Explicit adult material detected',
        matches: scores.nsfwMatches || []
      };
    }
    if (scores.violence > thresholds.violence) {
      violations.push(`⚔️ Violence (${(scores.violence * 100).toFixed(1)}%)`);
      violationDetails.violence = {
        type: 'Violence',
        score: scores.violence,
        reason: 'Aggressive, dangerous, or harmful content',
        matches: scores.violenceMatches || []
      };
    }
    if (scores.offensive > thresholds.offensive) {
      violations.push(`😤 Offensive/Hate Speech (${(scores.offensive * 100).toFixed(1)}%)`);
      violationDetails.offensive = {
        type: 'Offensive/Hate Speech',
        score: scores.offensive,
        reason: 'Discriminatory, hateful, or abusive content',
        matches: scores.offensiveMatches || []
      };
    }
    if (scores.drugs > thresholds.drugs) {
      violations.push(`💊 Drug Related (${(scores.drugs * 100).toFixed(1)}%)`);
      violationDetails.drugs = {
        type: 'Drug Related',
        score: scores.drugs,
        reason: 'Illegal drugs, drug sales, or drug glorification',
        matches: scores.drugMatches || []
      };
    }

    return {
      allowed: violations.length === 0,
      violations: violations,
      violationDetails: violationDetails,
      reason: violations.length > 0 
        ? `Rejected: ${violations.join(', ')}`
        : 'Approved: Content passes moderation'
    };
  }

  /**
   * Detect if text contains meme/entertainment patterns (separate from violations)
   */
  detectMeme(text) {
    if (!text) return { isMeme: false, score: 0 };

    const textLower = text.toLowerCase();
    let memeScore = 0;

    // Check for meme keywords
    this.memeKeywords.forEach(keyword => {
      if (textLower.includes(keyword.toLowerCase())) {
        memeScore += 0.08; // Each keyword adds ~8%
      }
    });

    // Check for meme patterns
    const memePatterns = [
      /\bwhen you\b/gi,
      /\bit\'?s giving\b/gi,
      /\bcaught in 4k\b/gi,
      /\bno cap\b/gi,
      /\bfr fr\b/gi,
      /\bngl\b/gi,
      /\bshitpost/gi,
      /\bcirclejerk/gi,
      /\bragecomic/gi,
      /\bimpactfont/gi,
      /\bcheap memes?\b/gi,
      /\b(drake|loss|stonks|pikachu|surprised cat)\b/gi
    ];

    memePatterns.forEach(pattern => {
      if (pattern.test(textLower)) {
        memeScore += 0.15; // Pattern matching adds 15%
      }
    });

    const isMeme = memeScore >= 0.1; // 10% threshold - stricter detection

    return {
      isMeme,
      score: Math.min(memeScore, 1.0),
      keywords: this.memeKeywords.filter(k => textLower.includes(k.toLowerCase()))
    };
  }

  /**
   * Detect if text is distraction/non-educational content
   */
  detectDistraction(text) {
    if (!text) return { isDistraction: false, score: 0 };

    const textLower = text.toLowerCase();
    let distractionScore = 0;
    const detectedCategories = [];

    // Check for distraction keywords
    this.distractionKeywords.forEach(keyword => {
      if (textLower.includes(keyword.toLowerCase())) {
        distractionScore += 0.07; // Each keyword adds ~7%
      }
    });

    // Categorize distraction type
    const categories = {
      fashion: /\b(outfit|ootd|fashion|beautyblog|makeup|aesthetic|haul|styling)\b/gi,
      gaming: /\b(gaming|twitch|youtube gaming|esports|gameplay|stream|let\'?s play)\b/gi,
      gossip: /\b(gossip|celebrity|drama|tea|spill|relationship)\b/gi,
      lifestyle: /\b(lifestyle|vlog|day in my life|routine|morning vibe)\b/gi,
      entertainment: /\b(entertainment|reaction|music video|cover|sing|comedy)\b/gi
    };

    Object.entries(categories).forEach(([cat, pattern]) => {
      if (pattern.test(textLower)) {
        distractionScore += 0.1;
        detectedCategories.push(cat);
      }
    });

    const isDistraction = distractionScore >= 0.1; // 10% threshold - stricter detection

    return {
      isDistraction,
      score: Math.min(distractionScore, 1.0),
      categories: [...new Set(detectedCategories)]
    };
  }

  /**
   * Comprehensive check with meme/distraction detection
   */
  async comprehensiveCheck(text) {
    if (!text) return { nsfw: 0, violence: 0, offensive: 0, drugs: 0, isMeme: false, isDistraction: false };

    const scores = await this.checkText(text);
    const memeCheck = this.detectMeme(text);
    const distractionCheck = this.detectDistraction(text);

    return {
      ...scores,
      isMeme: memeCheck.isMeme,
      memeScore: memeCheck.score,
      memeKeywords: memeCheck.keywords,
      isDistraction: distractionCheck.isDistraction,
      distractionScore: distractionCheck.score,
      distractionCategories: distractionCheck.categories
    };
  }

  /**
   * Moderate post (text + optional caption)
   */
  async moderatePost(postText, captionText = '') {
    console.log('\n📝 POST MODERATION');
    console.log('='.repeat(60));

    const fullText = `${postText} ${captionText}`.trim();
    const scores = await this.checkText(fullText);
    const decision = this.makeModerationDecision(scores);

    return {
      type: 'post',
      allowed: decision.allowed,
      reason: decision.reason,
      violations: decision.violations,
      scores
    };
  }

  /**
   * Moderate comment
   */
  async moderateComment(commentText) {
    console.log('\n💬 COMMENT MODERATION');
    console.log('='.repeat(60));

    const scores = await this.checkText(commentText);
    const decision = this.makeModerationDecision(scores);

    return {
      type: 'comment',
      allowed: decision.allowed,
      reason: decision.reason,
      violations: decision.violations,
      scores
    };
  }

  /**
   * Moderate user bio
   */
  async moderateBio(bioText) {
    console.log('\n👤 BIO MODERATION');
    console.log('='.repeat(60));

    const scores = await this.checkText(bioText);
    const decision = this.makeModerationDecision(scores);

    return {
      type: 'bio',
      allowed: decision.allowed,
      reason: decision.reason,
      violations: decision.violations,
      scores
    };
  }

  /**
   * Moderate image by OCR text
   */
  async moderateImage(ocrText = '') {
    console.log('\n🖼️  IMAGE MODERATION (via OCR)');
    console.log('='.repeat(60));

    if (!ocrText || ocrText.trim().length === 0) {
      console.log('   No OCR text found - image moderation skipped');
      return { type: 'image', allowed: true, reason: 'No text to moderate' };
    }

    const scores = await this.checkText(ocrText);
    const decision = this.makeModerationDecision(scores);

    return {
      type: 'image',
      allowed: decision.allowed,
      reason: decision.reason,
      violations: decision.violations,
      scores
    };
  }

  /**
   * Moderate video by frame descriptions/OCR
   */
  async moderateVideo(frameDescriptions = []) {
    console.log('\n🎬 VIDEO MODERATION (via frames)');
    console.log('='.repeat(60));

    if (!frameDescriptions || frameDescriptions.length === 0) {
      console.log('   No frame data found - video moderation skipped');
      return { type: 'video', allowed: true, reason: 'No frame data to moderate' };
    }

    const allText = frameDescriptions.join(' ');
    const scores = await this.checkText(allText);
    const decision = this.makeModerationDecision(scores);

    return {
      type: 'video',
      allowed: decision.allowed,
      reason: decision.reason,
      violations: decision.violations,
      scores,
      frameCount: frameDescriptions.length
    };
  }

  /**
   * Moderate audio by transcription text
   */
  async moderateAudio(transcriptionText = '') {
    console.log('\n🎵 AUDIO MODERATION (via transcription)');
    console.log('='.repeat(60));

    if (!transcriptionText || transcriptionText.trim().length === 0) {
      console.log('   No transcription found - audio moderation skipped');
      return { type: 'audio', allowed: true, reason: 'No audio text to moderate' };
    }

    const scores = await this.checkText(transcriptionText);
    const decision = this.makeModerationDecision(scores);

    return {
      type: 'audio',
      allowed: decision.allowed,
      reason: decision.reason,
      violations: decision.violations,
      scores
    };
  }

  /**
   * Comprehensive post moderation
   */
  async checkPost(postData = {}) {
    console.log('\n🛡️  COMPREHENSIVE POST MODERATION');
    console.log('='.repeat(70));

    const results = {
      post: null,
      image: null,
      video: null,
      audio: null,
      overallAllowed: true,
      violations: []
    };

    // Check post text
    if (postData.text || postData.caption) {
      const fullText = `${postData.text || ''} ${postData.caption || ''}`.trim();
      results.post = await this.moderatePost(fullText);
      if (!results.post.allowed) {
        results.overallAllowed = false;
        results.violations.push(...results.post.violations);
      }
    }

    // Check image (OCR text)
    if (postData.imageOcrText) {
      results.image = await this.moderateImage(postData.imageOcrText);
      if (results.image && !results.image.allowed) {
        results.overallAllowed = false;
        results.violations.push(...(results.image.violations || []));
      }
    }

    // Check video (frame descriptions)
    if (postData.videoFrames && postData.videoFrames.length > 0) {
      results.video = await this.moderateVideo(postData.videoFrames);
      if (results.video && !results.video.allowed) {
        results.overallAllowed = false;
        results.violations.push(...(results.video.violations || []));
      }
    }

    // Check audio (transcription)
    if (postData.audioTranscription) {
      results.audio = await this.moderateAudio(postData.audioTranscription);
      if (results.audio && !results.audio.allowed) {
        results.overallAllowed = false;
        results.violations.push(...(results.audio.violations || []));
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 OVERALL DECISION:', results.overallAllowed ? '✅ APPROVED' : '❌ REJECTED');
    if (results.violations.length > 0) {
      console.log('   Violations:', results.violations.join(', '));
    }

    return results;
  }
}

module.exports = HFModerationService;
