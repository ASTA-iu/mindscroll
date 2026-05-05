import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DefaultAvatar from '../components/DefaultAvatar';
import api from '../services/api';
import '../styles/ProfileSetup.css';

const ProfileSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    profileImage: null
  });
  const [imagePreview, setImagePreview] = useState(user?.profileImage || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData((prev) => ({
          ...prev,
          profileImage: reader.result
        }));
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Please enter your name');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Split name into firstName and lastName
      const nameParts = formData.name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      const updateData = {
        firstName,
        lastName,
        bio: formData.bio
      };

      if (formData.profileImage && formData.profileImage.startsWith('data:')) {
        updateData.profileImage = formData.profileImage;
      }

      console.log('Sending profile update to:', `/users/${user._id}`);
      console.log('User object:', user);
      console.log('Update data:', updateData);
      await api.put(`/users/${user._id}`, updateData);
      setSuccess('Profile setup complete! 🎉');
      setTimeout(() => {
        navigate('/feed');
      }, 2000);
    } catch (err) {
      console.error('Profile update error:', err);
      console.error('Response status:', err.response?.status);
      console.error('Response data:', err.response?.data);
      setError(
        err.response?.data?.message || 
        `Failed to update profile (Status: ${err.response?.status || 'Unknown'})`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/feed');
  };

  return (
    <div className="profile-setup-container">
      <div className="profile-setup-modal">
        <div className="setup-header">
          <h2>Welcome to MindScroll! 👋</h2>
          <p>Let's set up your profile</p>
        </div>

        {error && <div className="setup-error">{error}</div>}
        {success && <div className="setup-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          {/* Profile Picture */}
          <div className="setup-section">
            <label className="section-label">Profile Picture (Optional)</label>
            <div className="image-upload-area">
              {imagePreview ? (
                <div className="image-preview">
                  <img src={imagePreview} alt="Profile" />
                  <button
                    type="button"
                    className="btn-change-image"
                    onClick={() => document.getElementById('imageInput').click()}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="image-placeholder" onClick={() => document.getElementById('imageInput').click()}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <DefaultAvatar user={{ name: formData.name || 'User' }} size="lg" />
                  </div>
                  <p>Click to upload profile picture</p>
                </div>
              )}
              <input
                id="imageInput"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="imageInput" className="image-input-label">
                Choose Image
              </label>
            </div>
          </div>

          {/* Name */}
          <div className="setup-section">
            <label className="section-label">Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your name"
              required
            />
          </div>

          {/* Bio */}
          <div className="setup-section">
            <label className="section-label">Bio (Optional)</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Tell us about yourself... (e.g., Student | Python Developer | Science Enthusiast)"
              maxLength={150}
              rows={3}
            />
            <small>{formData.bio.length}/150</small>
          </div>

          {/* Buttons */}
          <div className="setup-buttons">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Complete Setup'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleSkip}
              disabled={loading}
            >
              Skip for Now
            </button>
          </div>
        </form>

        <p className="setup-info">
          ℹ️ You can edit this anytime from your profile page
        </p>
      </div>
    </div>
  );
};

export default ProfileSetup;
