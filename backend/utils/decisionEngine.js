/**
 * Decision Engine
 * Combines AI analysis results and applies business logic for final decision
 */
class DecisionEngine {
  constructor() {
    // Decision thresholds
    this.EDUCATIONAL_THRESHOLD = 0.50; // >= 50% educational score required for media posts
    this.TEXT_ONLY_EDUCATIONAL_THRESHOLD = 0.20; // >= 20% educational score required for text-only posts (MUCH LOWER)
    this.NSFW_THRESHOLD = 0.1; // NSFW must be < 10% - stricter
    this.VIOLENCE_THRESHOLD = 0.1; // Violence must be < 10% - stricter
    this.MEME_THRESHOLD = 0.1; // Meme probability must be < 10% - stricter
  }

  /**
   * Make final decision on post based on all AI analysis
   * @param {object} analysis - Combined analysis from all services
   * @returns {object} Final decision
   */
  async make(analysis) {
    console.log('\n📊 Decision Engine: Analyzing combined results...\n');

    // Extract scores
    const textScore = analysis.text?.score || 50;
    const imageScore = analysis.image?.score || null;
    const videoScore = analysis.video?.score || null;
    const audioScore = analysis.audio?.score || null;

    // Detect if post is text-only (no image/video)
    const isTextOnly = imageScore === null && videoScore === null;

    const nsfw = Math.max(
      analysis.image?.nsfw || 0,
      analysis.image?.nsfwScore || 0,
      analysis.video?.nsfw || 0
    );
    const violence = Math.max(
      analysis.image?.violenceScore || 0,
      analysis.video?.violence || 0
    );
    const drugs = Math.max(
      analysis.text?.drugs || 0,
      analysis.image?.drugs || 0,
      analysis.video?.drugs || 0
    );

    const isMeme = analysis.image?.isMeme || analysis.video?.isMeme || analysis.text?.isMeme || false;
    const memeScore = Math.max(
      analysis.image?.memeScore || 0,
      analysis.video?.memeScore || 0,
      analysis.text?.memeScore || 0
    );

    // Calculate combined educational score
    const scores = [textScore / 100];
    if (imageScore !== null) scores.push(imageScore / 100);
    if (videoScore !== null) scores.push(videoScore / 100);
    if (audioScore !== null) scores.push(audioScore / 100);

    const combinedEducationalScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    console.log(`📝 Text Score: ${textScore}%`);
    console.log(`🖼️  Image Score: ${imageScore}%`);
    console.log(`🎬 Video Score: ${videoScore}%`);
    console.log(`🎵 Audio Score: ${audioScore}%`);
    console.log(`📋 Post Type: ${isTextOnly ? 'TEXT-ONLY' : 'WITH MEDIA'}`);
    console.log(`\n🎯 Combined Educational Score: ${Math.round(combinedEducationalScore * 100)}%`);
    console.log(`🚨 NSFW: ${(nsfw * 100).toFixed(1)}% | Violence: ${(violence * 100).toFixed(1)}% | Drugs: ${(drugs * 100).toFixed(1)}%`);
    console.log(`😂 Meme Score: ${(memeScore * 100).toFixed(1)}% | Is Meme: ${isMeme}`);

    // Apply decision rules
    const decision = {
      allowed: false,
      recommendation: 'REJECT',
      reasons: [],
      scores: {
        educational: Math.round(combinedEducationalScore * 100),
        nsfw: Math.round(nsfw * 100),
        violence: Math.round(violence * 100),
        drugs: Math.round(drugs * 100),
        meme: Math.round(memeScore * 100)
      },
      details: analysis
    };

    // Rule 1: Check if content is meme/entertainment
    if (isMeme || memeScore >= this.MEME_THRESHOLD) {
      decision.reasons.push(`Meme/entertainment/distraction content detected (score: ${(memeScore * 100).toFixed(1)}%)`);
    }

    // Rule 2: Check NSFW content
    if (nsfw >= this.NSFW_THRESHOLD) {
      decision.reasons.push(`NSFW/Adult content detected (${(nsfw * 100).toFixed(1)}%)`);
    }

    // Rule 3: Check violence content
    if (violence >= this.VIOLENCE_THRESHOLD) {
      decision.reasons.push(`Violence content detected (${(violence * 100).toFixed(1)}%)`);
    }

    // Rule 4: Check drug-related content
    if (drugs >= this.NSFW_THRESHOLD) {
      decision.reasons.push(`Drug-related content detected (${(drugs * 100).toFixed(1)}%)`);
    }

    // Rule 5: Check educational content threshold (different for text-only vs media)
    const requiredEducationalThreshold = isTextOnly ? this.TEXT_ONLY_EDUCATIONAL_THRESHOLD : this.EDUCATIONAL_THRESHOLD;
    if (combinedEducationalScore < requiredEducationalThreshold) {
      decision.reasons.push(`Insufficient educational content (${Math.round(combinedEducationalScore * 100)}% < ${Math.round(requiredEducationalThreshold * 100)}%)`);
    }

    // Final decision
    const passesTests = 
      !isMeme &&
      memeScore < this.MEME_THRESHOLD &&
      nsfw < this.NSFW_THRESHOLD &&
      violence < this.VIOLENCE_THRESHOLD &&
      drugs < this.NSFW_THRESHOLD &&
      combinedEducationalScore >= requiredEducationalThreshold;

    if (passesTests) {
      decision.allowed = true;
      decision.recommendation = 'APPROVE ✅';
      if (isTextOnly) {
        decision.reason = `Text-only educational content approved (Score: ${Math.round(combinedEducationalScore * 100)}%)`;
      } else {
        decision.reason = `Educational content with media approved (Score: ${Math.round(combinedEducationalScore * 100)}%)`;
      }
    } else {
      decision.allowed = false;
      decision.recommendation = 'REJECT ❌';
      decision.reason = decision.reasons.length > 0 
        ? decision.reasons.join(' | ')
        : 'Content does not meet standards';
    }

    console.log(`\n✅ DECISION: ${decision.recommendation}`);
    console.log(`📌 Reason: ${decision.reason}\n`);

    return decision;
  }

  /**
   * Get decision explanation for user
   */
  getExplanation(decision) {
    const parts = [];

    parts.push(`**Educational Value: ${decision.scores.educational}%**`);
    
    if (decision.scores.nsfw > 0) {
      parts.push(`NSFW: ${decision.scores.nsfw}%`);
    }
    if (decision.scores.violence > 0) {
      parts.push(`Violence: ${decision.scores.violence}%`);
    }
    if (decision.scores.meme > 0) {
      parts.push(`Entertainment/Meme: ${decision.scores.meme}%`);
    }

    const explanation = {
      allowed: decision.allowed,
      reason: decision.reason,
      details: parts.join('\n'),
      thresholds: {
        educational: `Required: ≥${Math.round(this.EDUCATIONAL_THRESHOLD * 100)}% (media posts) or ≥${Math.round(this.TEXT_ONLY_EDUCATIONAL_THRESHOLD * 100)}% (text-only posts)`,
        nsfw: `Allowed: <${Math.round(this.NSFW_THRESHOLD * 100)}%`,
        violence: `Allowed: <${Math.round(this.VIOLENCE_THRESHOLD * 100)}%`,
        meme: `Allowed: <${Math.round(this.MEME_THRESHOLD * 100)}%`
      }
    };

    return explanation;
  }
}

module.exports = new DecisionEngine();
