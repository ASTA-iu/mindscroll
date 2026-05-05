/**
 * Text Moderation Service for Posts, Comments, Bio, Captions
 * Checks for: NSFW language, Violence, Offensive content
 * Uses: Sightengine API + keyword filtering
 */

const SightengineService = require('./sightengineService');

class TextModerationService {
  constructor(userId, apiSecret) {
    this.sightengine = new SightengineService(userId, apiSecret);
  }

  /**
   * Moderate post text + caption
   */
  async moderatePost(postText, caption = '', imageUrl = null, videoUrl = null) {
    console.log('\n📝 MODERATING POST TEXT');
    console.log('='.repeat(60));

    const fullText = `${postText} ${caption}`.trim();
    
    const results = await this.sightengine.checkPost({
      text: fullText,
      imageUrl: imageUrl,
      videoUrl: videoUrl
    });

    const textScore = results.text?.offensive || 0;
    const decision = this.sightengine.makeModerationDecision({
      nsfw: 0,
      violence: 0,
      offensive: textScore,
      weapons: 0
    });

    return {
      type: 'post',
      allowed: decision.allowed,
      reason: decision.reason,
      violations: decision.violations,
      scores: {
        text: textScore,
        image: results.image,
        video: results.video
      }
    };
  }

  /**
   * Moderate comment text
   */
  async moderateComment(commentText) {
    console.log('\n💬 MODERATING COMMENT');
    console.log('='.repeat(60));

    const result = await this.sightengine.checkText(commentText);
    const decision = this.sightengine.makeModerationDecision({
      nsfw: 0,
      violence: 0,
      offensive: result.offensive,
      weapons: 0
    });

    return {
      type: 'comment',
      allowed: decision.allowed,
      reason: decision.reason,
      violations: decision.violations,
      offensiveScore: result.offensive
    };
  }

  /**
   * Moderate user bio
   */
  async moderateBio(bioText) {
    console.log('\n👤 MODERATING USER BIO');
    console.log('='.repeat(60));

    const result = await this.sightengine.checkText(bioText);
    const decision = this.sightengine.makeModerationDecision({
      nsfw: 0,
      violence: 0,
      offensive: result.offensive,
      weapons: 0
    });

    return {
      type: 'bio',
      allowed: decision.allowed,
      reason: decision.reason,
      violations: decision.violations,
      offensiveScore: result.offensive
    };
  }

  /**
   * Moderate image caption
   */
  async moderateCaption(captionText, imageUrl = null) {
    console.log('\n📸 MODERATING IMAGE CAPTION');
    console.log('='.repeat(60));

    const results = await this.sightengine.checkPost({
      text: captionText,
      imageUrl: imageUrl
    });

    const textScore = results.text?.offensive || 0;
    const imageScores = results.image || {};

    const decision = this.sightengine.makeModerationDecision({
      nsfw: imageScores.nsfw || 0,
      violence: imageScores.violence || 0,
      offensive: textScore,
      weapons: imageScores.weapons || 0
    });

    return {
      type: 'caption',
      allowed: decision.allowed,
      reason: decision.reason,
      violations: decision.violations,
      scores: {
        text: textScore,
        image: imageScores
      }
    };
  }

  /**
   * Bulk moderation check for entire profile
   */
  async moderateProfile(bioText, posts = [], comments = []) {
    console.log('\n👥 MODERATING ENTIRE PROFILE');
    console.log('='.repeat(60));

    const results = {
      bio: null,
      posts: [],
      comments: [],
      violations: [],
      allowed: true
    };

    // Check bio
    if (bioText) {
      console.log('\nChecking bio...');
      results.bio = await this.moderateBio(bioText);
      if (!results.bio.allowed) {
        results.allowed = false;
        results.violations.push({ source: 'bio', ...results.bio });
      }
    }

    // Check posts
    if (posts.length > 0) {
      console.log(`\nChecking ${posts.length} posts...`);
      for (const post of posts) {
        const postResult = await this.moderatePost(
          post.text,
          post.caption,
          post.imageUrl,
          post.videoUrl
        );
        results.posts.push(postResult);
        if (!postResult.allowed) {
          results.allowed = false;
          results.violations.push({ source: 'post', ...postResult });
        }
      }
    }

    // Check comments
    if (comments.length > 0) {
      console.log(`\nChecking ${comments.length} comments...`);
      for (const comment of comments) {
        const commentResult = await this.moderateComment(comment.text);
        results.comments.push(commentResult);
        if (!commentResult.allowed) {
          results.allowed = false;
          results.violations.push({ source: 'comment', ...commentResult });
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ MODERATION SUMMARY');
    console.log(`  Bio: ${results.bio?.allowed ? '✅' : '❌'}`);
    console.log(`  Posts: ${results.posts.filter(p => p.allowed).length}/${results.posts.length} ✅`);
    console.log(`  Comments: ${results.comments.filter(c => c.allowed).length}/${results.comments.length} ✅`);
    console.log(`  Profile Status: ${results.allowed ? '✅ APPROVED' : '❌ BLOCKED'}`);

    return results;
  }
}

module.exports = TextModerationService;
