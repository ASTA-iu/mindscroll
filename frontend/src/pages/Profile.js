import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DefaultAvatar from '../components/DefaultAvatar';
import api from '../services/api';
import '../styles/Profile.css';

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', bio: '' });
  const [profileImage, setProfileImage] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');
  const [initialBanner, setInitialBanner] = useState('');
  const [bannerCropPercent, setBannerCropPercent] = useState(50);
  const [bannerCropActive, setBannerCropActive] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/${userId}`);
      setProfile(response.data.user);
      setEditForm({ name: response.data.user.name, bio: response.data.user.bio || '' });
      setImagePreview(response.data.user.profileImage || '');
      setBannerPreview(response.data.user.bannerImage || '');
      
      // Check if current user is following this profile
      if (currentUser && currentUser._id !== userId) {
        setIsFollowing(response.data.user.followers?.some(f => f._id === currentUser._id) || false);
      }
      
      // Fetch user's posts
      const postsResponse = await api.get(`/posts?userId=${userId}&page=1&limit=9`);
      setPosts(postsResponse.data.posts);
      setTotalPages(postsResponse.data.totalPages);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile');
      console.error('Profile error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, currentUser]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      setImagePreview(base64);
      setProfileImage(base64);

      // If not in edit mode, immediately save the new profile photo
      if (!isEditing) {
        try {
          await api.put(`/users/${userId}`, { profileImage: base64 });
          setProfile((prev) => ({ ...prev, profileImage: base64 }));
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to update profile picture');
          console.error('Error saving profile picture:', err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result);
        setBannerImage(reader.result);
        setBannerCropPercent(50);
        setBannerCropActive(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const applyBannerCrop = async () => {
    if (!bannerPreview) return;

    const cropped = await getCroppedBanner(bannerPreview, bannerCropPercent);
    setBannerPreview(cropped);
    setBannerImage(cropped);
    setBannerCropActive(false);
  };

  const resetBannerCrop = () => {
    setBannerPreview(initialBanner || profile?.bannerImage || '');
    setBannerImage('');
    setBannerCropPercent(50);
    setBannerCropActive(false);
  };

  // Track the initial banner so a crop reset can revert to the previous saved value
  React.useEffect(() => {
    if (isEditing) {
      setInitialBanner(bannerPreview || profile?.bannerImage || '');
    }
  }, [isEditing, bannerPreview, profile]);

  // Ensure crop UI is hidden whenever edit mode closes
  React.useEffect(() => {
    if (!isEditing) {
      setBannerCropActive(false);
    }
  }, [isEditing]);

  const getCroppedBanner = async (base64Image, cropPercent) => {
    // Crop vertically based on cropPercent (0-100) and resize to fixed dimensions
    const targetWidth = 1200;
    const targetHeight = 260;

    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const scale = targetWidth / image.width;
        const scaledHeight = image.height * scale;
        const maxOffset = Math.max(0, scaledHeight - targetHeight);
        const offsetY = (cropPercent / 100) * maxOffset;

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(
          image,
          0,
          -offsetY,
          targetWidth,
          scaledHeight
        );

        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      image.onerror = reject;
      image.src = base64Image;
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        name: editForm.name,
        bio: editForm.bio,
      };
      
      if (profileImage) {
        updateData.profileImage = profileImage;
      }

      if (bannerImage) {
        // Crop/resize banner before uploading
        const croppedBanner = await getCroppedBanner(bannerImage, bannerCropPercent);
        updateData.bannerImage = croppedBanner;
      }

      await api.put(`/users/${userId}`, updateData);
      setProfile({ ...profile, ...updateData });
      setIsEditing(false);
      setProfileImage('');
      setBannerImage('');
      setBannerCropActive(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await api.post(`/users/${userId}/unfollow`);
        setIsFollowing(false);
      } else {
        await api.post(`/users/${userId}/follow`);
        setIsFollowing(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to follow user');
    }
  };

  const handleLoadMore = async () => {
    try {
      const response = await api.get(`/posts?userId=${userId}&page=${page + 1}&limit=9`);
      setPosts([...posts, ...response.data.posts]);
      setPage(page + 1);
    } catch (err) {
      setError('Failed to load more posts');
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="profile-container">
        <div className="profile-error">
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser._id === userId;

  return (
    <div className="profile-container">
      {error && <div className="error-banner">{error}</div>}

      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-cover">
          {bannerPreview && bannerPreview !== 'https://via.placeholder.com/800x200/4A90E2/FFFFFF?text=MindScroll' ? (
            <div className="banner-preview">
              <img
                src={bannerPreview}
                alt="Profile banner"
                className="profile-banner-image"
                style={{ objectPosition: `50% ${bannerCropPercent}%` }}
              />
              {bannerCropActive && (
                <div className="banner-crop-controls">
                  <label>
                    Adjust crop:
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={bannerCropPercent}
                      onChange={(e) => setBannerCropPercent(Number(e.target.value))}
                    />
                  </label>

                  <div className="banner-crop-actions">
                    <button type="button" className="btn-sm" onClick={applyBannerCrop}>
                      Apply
                    </button>
                    <button type="button" className="btn-sm btn-secondary" onClick={resetBannerCrop}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="profile-banner-placeholder">
              <span>MindScroll</span>
            </div>
          )}
          {isOwnProfile && !isEditing && (
            <label className="banner-edit-label">
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                style={{ display: 'none' }}
              />
              <span className="camera-icon">📷</span>
            </label>
          )}
        </div>
        
        <div className="profile-info">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {imagePreview ? (
                <img src={imagePreview} alt={profile?.name} />
              ) : (
                <DefaultAvatar user={profile} size="xl" />
              )}
              {isOwnProfile && !isEditing && (
                <label className="avatar-edit-label">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                  <span className="camera-icon">📷</span>
                </label>
              )}
            </div>

            <div className="profile-details">
              <h1 className="profile-name">{profile?.name || 'User'}</h1>
              <p className={`profile-bio ${!profile?.bio ? 'placeholder' : ''}`}>
                {profile?.bio || (isOwnProfile ? 'Add a bio to tell others about yourself' : 'No bio yet')}
              </p>

              <div className="profile-stats">
                <div className="stat">
                  <span className="stat-number">{posts.length}</span>
                  <span className="stat-label">Posts</span>
                </div>
                <div className="stat">
                  <span className="stat-number">{profile?.followers?.length || 0}</span>
                  <span className="stat-label">Followers</span>
                </div>
                <div className="stat">
                  <span className="stat-number">{profile?.following?.length || 0}</span>
                  <span className="stat-label">Following</span>
                </div>
              </div>

              {isOwnProfile ? (
                <button
                  className="btn-primary"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </button>
              ) : (
                <button
                  className={`btn-follow ${isFollowing ? 'following' : ''}`}
                  onClick={handleFollow}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && isOwnProfile && (
        <div className="modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Profile</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Tell us about yourself"
                  maxLength={150}
                  rows={3}
                />
                <small>{editForm.bio.length}/150</small>
              </div>

              <div className="form-group">
                <label>Profile Picture</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <div className="image-preview-box">
                    <img src={imagePreview} alt="Preview" />
                  </div>
                )}
              </div>

              <div className="modal-buttons">
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Posts Grid */}
      <div className="profile-posts">
        <h2>Posts</h2>
        {posts.length === 0 ? (
          <div className="empty-posts">
            <p>No posts yet</p>
          </div>
        ) : (
          <>
            <div className="posts-grid">
              {posts.map((post) => (
                <div
                  key={post._id}
                  className="post-grid-item"
                  onClick={() => navigate(`/post/${post._id}`)}
                >
                  {post.image || post.imageUrl ? (
                    <img src={post.image || post.imageUrl} alt="Post" />
                  ) : post.video || post.videoUrl ? (
                    <div className="post-grid-video">
                      <video src={post.video || post.videoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div className="play-icon">▶</div>
                    </div>
                  ) : (
                    <div className="post-grid-placeholder">{post.content ? post.content.substring(0, 30) : 'Post'}</div>
                  )}
                  <div className="post-grid-overlay">
                    <span className="like-count">❤️ {post.likes?.length || 0}</span>
                    <span className="comment-count">💬 {post.comments?.length || 0}</span>
                  </div>
                </div>
              ))}
            </div>

            {page < totalPages && (
              <button className="btn-load-more" onClick={handleLoadMore}>
                Load More Posts
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
