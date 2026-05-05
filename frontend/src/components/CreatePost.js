import React, { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import RejectionModal from './RejectionModal';
import AnalysisConfirmationModal from './AnalysisConfirmationModal';
import DefaultAvatar from './DefaultAvatar';
import api from '../services/api';
import '../styles/CreatePost.css';

const CreatePost = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [mediaType, setMediaType] = useState(null);
  const [mediaFileName, setMediaFileName] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rejectionAnalysis, setRejectionAnalysis] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [isConfirmingPost, setIsConfirmingPost] = useState(false);

  const handleFileSelect = (file, isVideo = false) => {
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setMedia(reader.result);
      setMediaPreview(reader.result);
      setMediaType(isVideo ? 'video' : 'image');
      setMediaFileName(file.name);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file, false);
    } else {
      setError('Please upload an image file');
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      handleFileSelect(file, true);
    } else {
      setError('Please upload a video file');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleFileSelect(file, false);
      } else if (file.type.startsWith('video/')) {
        handleFileSelect(file, true);
      } else {
        setError('Please drop an image or video file');
      }
    }
  };

  const analyzeTags = useCallback(async () => {
    if (!content?.trim() && !media) {
      setError('Please add text content or an image/video to analyze');
      return;
    }

    try {
      setAnalyzing(true);
      const response = await api.post('/posts/analyze-tags', {
        content: content || '',
        hasMedia: Boolean(media),
        mediaType,
        image: mediaType === 'image' ? media : null,
        videoUrl: mediaType === 'video' ? media : null,
        videoFileName: mediaType === 'video' ? mediaFileName : null,
      });
      setSuggestedTags(response.data.tags || []);
      setError('');
    } catch (err) {
      console.error('Tag analysis error:', err);
      setSuggestedTags([]);
      setError(err.response?.data?.message || 'Failed to analyze tags');
    } finally {
      setAnalyzing(false);
    }
  }, [content, media, mediaType, mediaFileName]);

  const handleTagToggle = (tag) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleAnalyzeBeforePost = async () => {
    if (!content?.trim() && !media) {
      setError('Please add text content or an image/video to analyze');
      return;
    }

    try {
      setAnalyzing(true);
      setError('');

      const analyzeData = {
        content: content || '',
        image: mediaType === 'image' ? media : null,
        videoUrl: mediaType === 'video' ? media : null,
        videoFileName: mediaType === 'video' ? mediaFileName : null,
      };

      const response = await api.post('/posts/analyze', analyzeData);
      const result = response.data.analysis;
      setAnalysisResult(result);
      setShowAnalysisModal(true);
    } catch (err) {
      console.error('Analysis error:', err);

      if (err.response?.status === 403) {
        const violations = err.response?.data?.violations || [];
        const reason = err.response?.data?.reason || err.response?.data?.message;
        setError(`Post blocked: ${reason}\n\nViolations: ${violations.join(', ') || 'Harmful content detected'}`);
      } else {
        setError(err.response?.data?.message || 'Failed to analyze content');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirmPost = async () => {
    if (!analysisResult) {
      setError('No analysis result available');
      return;
    }

    try {
      setIsConfirmingPost(true);
      setError('');

      const postData = {
        content,
        tags: selectedTags,
      };

      if (media) {
        if (mediaType === 'video') {
          postData.videoUrl = media;
          postData.videoFileName = mediaFileName;
        } else {
          postData.image = media;
        }
      }

      const response = await api.post('/posts', postData);
      const newPost = response.data.post;

      setContent('');
      setMedia(null);
      setMediaPreview('');
      setMediaType(null);
      setMediaFileName(null);
      setSelectedTags([]);
      setSuggestedTags([]);
      setAnalysisResult(null);
      setShowAnalysisModal(false);

      setSuccess('Post created successfully.');
      setTimeout(() => setSuccess(''), 3000);

      if (onPostCreated) {
        onPostCreated(newPost);
      }
    } catch (err) {
      console.error('Post creation error:', err);

      if (err.response?.status === 403) {
        const violations = err.response?.data?.violations || [];
        const reason = err.response?.data?.reason || err.response?.data?.message;
        setError(`Post blocked: ${reason}\n\nViolations: ${violations.join(', ') || 'Harmful content detected'}`);
        setRejectionAnalysis(null);
      } else if (err.response?.status === 400 && err.response?.data?.rejected) {
        setRejectionAnalysis(err.response.data.analysis);
        setError('');
      } else {
        setError(err.response?.data?.message || 'Failed to create post');
        setRejectionAnalysis(null);
      }
    } finally {
      setIsConfirmingPost(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (media && !content?.trim()) {
      setError('Please add a caption when posting an image or video');
      return;
    }

    if (!content?.trim() && !media) {
      setError('Please enter content or add an image/video to post');
      return;
    }

    await handleAnalyzeBeforePost();
  };

  const isRejected = rejectionAnalysis && rejectionAnalysis.recommendation === 'REJECT';

  return (
    <div className="create-post">
      <div
        className={`create-post-header ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="user-avatar">
          {user?.profileImage ? (
            <img src={user.profileImage} alt={user.name} />
          ) : (
            <DefaultAvatar user={user} size="md" />
          )}
        </div>
        <div className="create-post-input-wrapper">
          <textarea
            name="content"
            className="create-post-input"
            placeholder={`Share your educational insights, ${user?.name}...`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
          />
          {isDragging && (
            <div className="drag-overlay">
              <div className="drag-message">
                <span className="drag-icon">Drop File</span>
                <p>Drop your image or video here</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {mediaPreview && (
        <div className="media-preview-container">
          {mediaType === 'video' ? (
            <div className="video-preview">
              <video src={mediaPreview} controls style={{ width: '100%', maxHeight: '300px', borderRadius: '8px' }} />
            </div>
          ) : (
            <div className="image-preview">
              <img src={mediaPreview} alt="Preview" />
            </div>
          )}
          <button
            type="button"
            className="remove-media"
            onClick={() => {
              setMedia(null);
              setMediaPreview('');
              setMediaType(null);
              setMediaFileName(null);
              setRejectionAnalysis(null);
            }}
            title="Remove media"
          >
            x
          </button>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <AnalysisConfirmationModal
        analysis={analysisResult}
        onConfirm={handleConfirmPost}
        onCancel={() => setShowAnalysisModal(false)}
        isLoading={isConfirmingPost}
        isOpen={showAnalysisModal}
      />

      {rejectionAnalysis && <RejectionModal analysis={rejectionAnalysis} onClose={() => setRejectionAnalysis(null)} />}

      {suggestedTags.length > 0 && (
        <div className="suggested-tags-section">
          <div className="tags-header">
            <h4>Suggested Tags</h4>
            <p>Click to add tags that describe your content</p>
          </div>
          <div className="suggested-tags">
            {suggestedTags.map((tagObj) => {
              const tagName = typeof tagObj === 'string' ? tagObj : tagObj.name;
              const confidence = typeof tagObj === 'string' ? undefined : tagObj.confidence;
              const isSelected = selectedTags.includes(tagName);

              return (
                <button
                  key={tagName}
                  type="button"
                  className={`tag-chip ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleTagToggle(tagName)}
                  title={`Click to ${isSelected ? 'remove' : 'add'} this tag ${
                    confidence ? `(${confidence}% confidence)` : ''
                  }`}
                >
                  <span className="tag-label">{tagName}</span>
                  {confidence && <span className="tag-confidence">{Math.round(confidence)}%</span>}
                  {isSelected && <span className="checkmark">OK</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedTags.length > 0 && (
        <div className="selected-tags-display">
          <span className="tags-label">Selected Tags:</span>
          {selectedTags.map((tag) => (
            <span key={tag} className="selected-tag">
              {tag}
              <button type="button" onClick={() => handleTagToggle(tag)} className="remove-tag">
                x
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="create-post-footer">
        <div className="footer-actions">
          <label className="upload-btn" title="Upload image">
            <input
              name="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={analyzing || isConfirmingPost}
            />
            <span>Image</span>
          </label>

          <label className="upload-btn" title="Upload video">
            <input
              name="video"
              type="file"
              accept="video/*"
              onChange={handleVideoChange}
              disabled={analyzing || isConfirmingPost}
            />
            <span>Video</span>
          </label>

          <button
            type="button"
            className="analyze-btn"
            onClick={analyzeTags}
            disabled={analyzing || isConfirmingPost || (!content?.trim() && !media)}
            title="AI will analyze your post and suggest tags"
          >
            {analyzing ? 'Analyzing...' : 'Analyze Tags'}
          </button>
        </div>

        <button
          type="submit"
          className={`btn-post ${isRejected ? 'rejected' : ''}`}
          onClick={handleSubmit}
          disabled={analyzing || isConfirmingPost || (!content?.trim() && !media) || isRejected}
          title={isRejected ? 'Cannot post: Content not educational' : 'Post to feed'}
        >
          {isRejected ? (
            <span>Cannot Post</span>
          ) : analyzing ? (
            <>
              <span className="spinner-small"></span>
              Analyzing...
            </>
          ) : (
            'Post'
          )}
        </button>
      </div>

      <style>{`
        .spinner-small {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-right: 6px;
        }

        .drag-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(14, 165, 164, 0.08);
          border: 2px dashed var(--primary-color);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        .drag-message {
          text-align: center;
          color: var(--primary-color);
        }

        .drag-icon {
          font-size: 1rem;
          display: block;
          margin-bottom: 8px;
          font-weight: 700;
        }

        .btn-post.rejected {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
          cursor: not-allowed;
          opacity: 1;
        }

        .btn-post.rejected:hover {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
        }
      `}</style>
    </div>
  );
};

export default CreatePost;
