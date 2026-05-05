const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const HFModerationService = require('../utils/hfModerationService');

// Initialize moderation service
const hfModeration = new HFModerationService(process.env.AI_API_KEY);

const router = express.Router();

// Get user profile
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('followers', ['username', 'profileImage'])
      .populate('following', ['username', 'profileImage']);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user profile
router.put('/:id', protect, async (req, res) => {
  try {
    console.log('PUT /api/users/:id called');
    console.log('req.params.id:', req.params.id);
    console.log('req.user.id:', req.user.id);
    console.log('req.user.id.toString():', req.user.id.toString());
    
    if (req.params.id !== req.user.id.toString()) {
      console.log('Authorization failed: IDs do not match');
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { name, firstName, lastName, bio, profileImage, bannerImage } = req.body;
    console.log('Update request body:', { name, firstName, lastName, bio, profileImage: profileImage ? 'base64 data' : 'none', bannerImage: bannerImage ? 'base64 data' : 'none' });

    // ===== NEW: BIO MODERATION CHECK =====
    if (bio && bio.trim().length > 0) {
      console.log('🛡️  Running bio moderation...');
      try {
        const bioModerationResult = await hfModeration.moderateBio(bio);

        if (!bioModerationResult.allowed) {
          console.log(`❌ Bio rejected: ${bioModerationResult.reason}`);
          return res.status(403).json({
            success: false,
            message: `Bio rejected: ${bioModerationResult.reason}`,
            violations: bioModerationResult.violations,
            scores: bioModerationResult.scores,
            rejected: true
          });
        }

        console.log('✅ Bio passed moderation');
      } catch (moderationError) {
        console.warn('⚠️  Bio moderation check failed:', moderationError.message);
        // Don't block on moderation errors
      }
    }
    // ===== END: BIO MODERATION CHECK =====

    const updateData = {};
    if (name) updateData.name = name;
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (bio) updateData.bio = bio;
    if (profileImage) updateData.profileImage = profileImage;
    if (bannerImage) updateData.bannerImage = bannerImage;

    console.log('updateData keys:', Object.keys(updateData));

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    console.log('User updated successfully:', user._id);
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error updating user:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Follow user
router.post('/:id/follow', protect, async (req, res) => {
  try {
    if (req.params.id === req.user.id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot follow yourself' });
    }

    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!currentUser.following.some(id => id.toString() === req.params.id)) {
      currentUser.following.push(req.params.id);
      userToFollow.followers.push(req.user.id);
    }

    await currentUser.save();
    await userToFollow.save();

    res.json({ success: true, message: 'User followed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Unfollow user
router.post('/:id/unfollow', protect, async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToUnfollow) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    currentUser.following = currentUser.following.filter(id => id.toString() !== req.params.id);
    userToUnfollow.followers = userToUnfollow.followers.filter(id => id.toString() !== req.user.id);

    await currentUser.save();
    await userToUnfollow.save();

    res.json({ success: true, message: 'User unfollowed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Search users
router.get('/search/:query', protect, async (req, res) => {
  try {
    const users = await User.find({
      $or: [
        { username: { $regex: req.params.query, $options: 'i' } },
        { email: { $regex: req.params.query, $options: 'i' } },
        { firstName: { $regex: req.params.query, $options: 'i' } },
        { lastName: { $regex: req.params.query, $options: 'i' } }
      ]
    }).select('-password').limit(20);

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
