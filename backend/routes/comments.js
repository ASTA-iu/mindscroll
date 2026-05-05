const express = require('express');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { protect } = require('../middleware/auth');
const HFModerationService = require('../utils/hfModerationService');

// Initialize moderation service
const hfModeration = new HFModerationService(process.env.AI_API_KEY);

const router = express.Router();

// Create comment
router.post('/', protect, async (req, res) => {
  try {
    const { postId, content } = req.body;

    if (!content || !postId) {
      return res.status(400).json({ success: false, message: 'Post ID and content are required' });
    }

    // ===== NEW: COMMENT MODERATION CHECK =====
    console.log('🛡️  Running comment moderation...');
    try {
      const moderationResult = await hfModeration.moderateComment(content);

      if (!moderationResult.allowed) {
        console.log(`❌ Comment rejected: ${moderationResult.reason}`);
        return res.status(403).json({
          success: false,
          message: `Comment rejected: ${moderationResult.reason}`,
          violations: moderationResult.violations,
          scores: moderationResult.scores,
          rejected: true
        });
      }

      console.log('✅ Comment passed moderation');
    } catch (moderationError) {
      console.warn('⚠️  Moderation check failed:', moderationError.message);
      // Don't block on moderation errors
    }
    // ===== END: COMMENT MODERATION CHECK =====

    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comment = new Comment({
      post: postId,
      author: req.user.id,
      content
    });

    await comment.save();
    await comment.populate('author', ['username', 'profileImage']);

    // Add comment to post's comments array and update comment count
    post.comments.push(comment._id);
    post.commentCount++;
    await post.save();

    res.status(201).json({ success: true, comment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get comments for post
router.get('/post/:postId', protect, async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('author', ['username', 'profileImage'])
      .sort({ createdAt: -1 });

    res.json({ success: true, comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete comment
router.delete('/:id', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (comment.author.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const postId = comment.post;
    await Comment.findByIdAndDelete(req.params.id);

    // Remove comment from post's comments array and update comment count
    const post = await Post.findById(postId);
    if (post) {
      post.comments = post.comments.filter(id => id.toString() !== req.params.id);
      post.commentCount--;
      await post.save();
    }

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Like comment
router.post('/:id/like', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (comment.likes.some(id => id.toString() === req.user.id.toString())) {
      comment.likes = comment.likes.filter(id => id.toString() !== req.user.id.toString());
      comment.likeCount--;
    } else {
      comment.likes.push(req.user.id);
      comment.likeCount++;
    }

    await comment.save();
    res.json({ success: true, comment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
