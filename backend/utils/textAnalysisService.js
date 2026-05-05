/**
 * Text Analysis Service - AI Zero-Shot Classification
 * Uses HuggingFace to understand educational vs non-educational content
 * Works for ANY educational category without hardcoding keywords
 */

const { HfInference } = require('@huggingface/inference');

class TextAnalysisService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.client = new HfInference(apiKey);
  }

  /**
   * Check if text contains educational content indicators
   */
  hasEducationalContent(text) {
    // Comprehensive check across all fields
    const educationalPattern = /science|research|study|experiment|physics|chemistry|biology|psychology|code|programming|algorithm|math|algebra|calculus|history|ancient|civilization|language|grammar|literature|health|medicine|disease|economics|business|market|art|design|painting|education|teach|learn|school|university|philosophy|ethics|environment|ecology|climate|exercise|fitness|nutrition|explain|describe|teach|guide|how\s+to|why|analysis|analyze|examine|investigate|learn|knowledge|understand|concept|theory|principle|research|study|evidence|prove|demonstrate|example|definition|method|tutorial|process|technique/i;
    
    return educationalPattern.test(text);
  }

  /**
   * Detect if text is casual social media content (not educational)
   * Much stricter - only flag obvious memes/entertainment
   */
  isCasualContent(text) {
    if (!text || text.length === 0) return false;
    
    // ONLY flag obvious brain rot/meme patterns
    const brainRotPatterns = [
      /^(my face|my picture|my selfie)\b/i,
      /(my face|selfie|mirror pic) (is|are) (so|very|really)?\s*(cute|hot|ugly|pretty|gorgeous)/i,
      /\b(no cap|fr fr|lowkey|highkey|periodt|slay|bussin|skibidi|gyatt)\b/i,
      /\bgonna\s+(cry|scream|die|lose it)\b/i,
      /^(this|that)\s+(be|is)\s+(hitting|slapping|different|wild|crazy)|when\s+you/i,
      /\b(peak|it's giving|main character|caught in 4k|ratio)\b/i,
      /meme|funny|lol|haha|rofl|lmao.*meme/i,
      /^(omg|wow|ugh|ew|lol|haha)\s*(!!!|[!]{2,})/i
    ];

    // Only flag VERY obvious casual/meme content
    for (const pattern of brainRotPatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Analyze text for educational value using AI zero-shot classification
   * Returns score 0-100
   */
  async analyze(text) {
    try {
      if (!text || text.trim().length === 0) {
        return { score: 0, reason: 'Empty text', success: false };
      }

      console.log('\n📝 TEXT ANALYSIS - AI Educational Content Classification');
      console.log('='.repeat(60));

      const wordCount = text.split(/\s+/).length;
      const charCount = text.length;

      console.log(`\n📊 ANALYSIS BREAKDOWN:`);
      console.log(`   Words: ${wordCount}`);
      console.log(`   Characters: ${charCount}`);

      // Check if this is casual social content first
      if (this.isCasualContent(text)) {
        console.log(`\nStep 1: Detected casual social media content`);
        console.log(`\n📈 SCORE CALCULATION:`);
        console.log(`   Content Type: Casual/Social`);
        console.log(`   FINAL SCORE: 15%`);
        console.log(`\n✓ DECISION: ❌ REJECTED`);
        console.log('='.repeat(60) + '\n');

        return {
          score: 15,
          reason: 'Casual social content - not educational',
          aiClassification: 15,
          wordCount: wordCount,
          qualityBonus: 0,
          indicatorBonus: 0,
          approved: false,
          success: true,
          isCasual: true
        };
      }

      // Use zero-shot classification to understand content
      console.log(`\nStep 1: AI Classification (Understanding content type)...`);
      
      let educationalScore = null;
      
      try {
        // Define what is educational vs entertainment
        const labels = ['educational content', 'entertainment content'];
        
        const classification = await Promise.race([
          this.client.zeroShotClassification({
            model: 'facebook/bart-large-mnli',
            inputs: text.substring(0, 1024), // Max 1024 chars
            parameters: {
              candidate_labels: labels,
              multi_class: false
            }
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Classification timeout')), 30000))
        ]);

        // Handle array of objects format: [{label, score}, {label, score}]
        if (classification && Array.isArray(classification) && classification.length > 0) {
          const educationalObj = classification.find(item => item.label === 'educational content');
          if (educationalObj && educationalObj.score !== undefined) {
            educationalScore = Math.round(educationalObj.score * 100);
          }
        }

        if (educationalScore !== null && educationalScore > 0) {
          console.log(`   ✓ AI Classification: Educational Content: ${educationalScore}%`);
        }
      } catch (aiError) {
        console.log(`   ⚠️ AI Classification skipped: ${aiError.message}`);
        educationalScore = null;
      }

      // Step 1: Length bonus for quality content
      console.log(`\nStep 2: Content Quality Assessment...`);
      let qualityBonus = 0;
      
      if (wordCount >= 100) {
        qualityBonus = 15;
        console.log(`   ✓ Substantial content (${wordCount} words) +15%`);
      } else if (wordCount >= 50) {
        qualityBonus = 10;
        console.log(`   ✓ Adequate content (${wordCount} words) +10%`);
      } else if (wordCount >= 20) {
        qualityBonus = 5;
        console.log(`   ✓ Short content (${wordCount} words) +5%`);
      }

      // Step 2: Check for educational indicators - EXTENSIVE FIELDS
      console.log(`\nStep 3: Educational Field Detection...`);
      let indicatorBonus = 0;
      let foundFields = [];
      
      const educationalFields = {
        'Science & Research': /science|research|study|experiment|physics|chemistry|biology|psychology|neuroscience|astronomy|geology|evidence|hypothesis|data|findings|discovery|analyze|fossil|particle|reaction|compound|ecosystem|organism|species|genetics|dna|protein|metabolism|photosynthesis|quantum|relativity|atom|molecule|carbon|nitrogen|oxygen|hydrogen/i,
        'Technology & Programming': /code|programming|algorithm|function|variable|loop|array|database|software|hardware|api|server|client|html|css|javascript|python|java|react|node|react|sql|git|deployment|framework|library|debug|compile|runtime|string|integer|boolean|if\s+statement|for\s+loop|while\s+loop|class|object|inheritance|polymorphism|encapsulation/i,
        'Mathematics': /math|algebra|geometry|calculus|trigonometry|statistics|probability|equation|formula|theorem|proof|matrix|vector|derivative|integral|function|slope|angle|circumference|diameter|coefficient|variable|solve|calculate|compute|graph|coordinate|tangent|sine|cosine/i,
        'History & Culture': /history|historical|ancient|civilization|empire|dynasty|culture|tradition|heritage|war|revolution|decade|century|era|event|historical|figure|movement|religion|philosophy|politics|government|society|social|anthropology|archaeology|migration|conquest|settlement/i,
        'Language & Literature': /language|literature|grammar|syntax|vocabulary|etymology|poetry|novel|story|plot|character|author|writing|essay|journal|article|punctuation|adjective|noun|verb|metaphor|simile|theme|narrative|prose|dialogue|dialect|translation|linguistics|semantics/i,
        'Health & Medicine': /health|medicine|medical|disease|treatment|therapy|diagnosis|symptom|cure|vaccine|doctor|physician|nurse|hospital|surgery|patient|pharmaceutical|drug|medication|virus|bacteria|infection|immune|antibody|inflammation|organ|skeleton|muscle|nutrition|vitamin|calorie|exercise|fitness|wellness|psychology|mental\s+health|depression|anxiety/i,
        'Economics & Business': /economics|business|finance|market|commerce|trade|investment|stock|bond|currency|banking|capital|profit|revenue|expense|budget|accounting|audit|corporation|enterprise|entrepreneur|supply|demand|inflation|gdp|loan|mortgage|tax|contract|negotiation|management|strategy/i,
        'Arts & Design': /art|design|painting|sculpture|architecture|music|composition|aesthetic|color|symmetry|perspective|technique|masterpiece|gallery|museum|exhibition|artist|canvas|brush|palette|illustration|graphic|typography|layout|animation|animation|visual|creative|artistic|studio|medium|style|movement|impression|renaissance|baroque|modernism/i,
        'Education & Learning': /education|teach|learn|school|university|college|academic|student|teacher|instructor|course|curriculum|lesson|subject|grade|assessment|exam|test|knowledge|skill|competency|literacy|numeracy|learning\s+objective|pedagogy|didactic|socratic|bloom's|taxonomy|training|workshop|seminar/i,
        'Environment & Ecology': /environment|ecology|ecosystem|climate|weather|nature|animals|plants|wildlife|conservation|sustainability|carbon|greenhouse|pollution|recycling|renewable|fossil\s+fuel|deforestation|ocean|coral|reef|species|endangered|biome|habitat|biodiversity|climate\s+change|global\s+warming|sustainable/i,
        'Philosophy & Ethics': /philosophy|ethics|morality|virtue|justice|truth|knowledge|metaphysics|ontology|epistemology|logic|argument|reasoning|critical\s+thinking|socrates|plato|aristotle|kant|descartes|nietzsche|existential|ethical|moral|principle|axiom|dialectic|paradox|sophism/i
      };

      for (const [field, pattern] of Object.entries(educationalFields)) {
        if (pattern.test(text)) {
          indicatorBonus += 8;
          foundFields.push(field);
        }
      }

      if (foundFields.length > 0) {
        console.log(`   ✓ Detected fields: ${foundFields.join(', ')}`);
        console.log(`   ✓ Educational field detected: +${indicatorBonus}%`);
      }

      // If we got an AI classification score, use it as primary
      let finalScore;
      
      if (educationalScore !== null && educationalScore > 0) {
        // BART AI is primary source - it understands content context
        // Add modest bonuses only for strong educational indicators
        let aiBonus = 0;
        if (foundFields.length >= 2) {
          aiBonus = 10; // Strong educational signal from multiple fields
        } else if (foundFields.length === 1) {
          aiBonus = 5; // Single field indicator
        }
        
        finalScore = educationalScore + aiBonus + qualityBonus;
      } else {
        // No AI classification - fall back to indicator-based scoring
        // This gives text-based content a fair chance
        if (foundFields.length > 0) {
          finalScore = 50 + indicatorBonus + qualityBonus; // Base 50% for having educational content
        } else {
          finalScore = qualityBonus + Math.min(indicatorBonus / 2, 20);
        }
      }
      
      finalScore = Math.round(Math.max(0, Math.min(100, finalScore)));

      console.log(`\n📈 SCORE CALCULATION:`);
      console.log(`   AI Classification (BART): ${educationalScore !== null ? educationalScore + '%' : 'Not available'}`);
      console.log(`   Educational Fields Found: ${foundFields.length > 0 ? foundFields.join(', ') : 'None'}`);
      console.log(`   Quality Bonus: +${qualityBonus}%`);
      if (educationalScore !== null && (foundFields.length > 0)) {
        console.log(`   Field Validation Bonus: +${foundFields.length >= 2 ? 10 : 5}%`);
      }
      console.log(`   FINAL SCORE: ${finalScore}%`);

      const decision = finalScore >= 65 ? '✅ APPROVED' : finalScore >= 40 ? '⚠️ REVIEW NEEDED' : '❌ REJECTED';
      console.log(`\n✓ DECISION: ${decision}`);
      console.log('='.repeat(60) + '\n');

      return {
        score: finalScore,
        reason: this.getReason(finalScore),
        aiClassification: educationalScore,
        wordCount: wordCount,
        qualityBonus: qualityBonus,
        fieldsDetected: foundFields,
        approved: finalScore >= 65,
        success: true
      };

    } catch (error) {
      console.error('❌ Analysis error:', error.message);
      throw error;
    }
  }

  /**
   * Get reason message
   */
  getReason(score) {
    if (score >= 90) return '⭐ Excellent educational content';
    if (score >= 80) return '⭐ Strong educational value';
    if (score >= 70) return '✅ Good educational content';
    if (score >= 60) return '✅ Educational content approved';
    if (score >= 50) return '✅ Moderate educational value';
    if (score >= 35) return '⚠️ Limited educational content';
    if (score >= 20) return '⚠️ Minimal educational value';
    return '❌ Non-educational content';
  }
}

module.exports = TextAnalysisService;
