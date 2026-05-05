import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import DefaultAvatar from './DefaultAvatar';
import CommentSection from './CommentSection';
import '../styles/PostCard.css';

const PostCard = ({ post, onPostDeleted, onTagsUpdated }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(post?.likes?.includes(user?._id) || false);
  const [likeCount, setLikeCount] = useState(post?.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');
  const [postTags, setPostTags] = useState(post?.tags || []);

  const handleLike = useCallback(async () => {
    try {
      setLoading(true);
      await api.post(`/posts/${post._id}/like`);
      setLiked(!liked);
      setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setLoading(false);
    }
  }, [post._id, liked, likeCount]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await api.delete(`/posts/${post._id}`);
        if (onPostDeleted) onPostDeleted(post._id);
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post. Please try again.');
      }
    }
  };

  const handleReport = async () => {
    if (window.confirm('Are you sure this post is not educational? It will be reviewed by our team.')) {
      try {
        const response = await api.post(`/posts/${post._id}/report`);
        const thankYouMsg = response.data.thankyou || response.data.message;
        alert(thankYouMsg);
        if (onPostDeleted) onPostDeleted(post._id);
      } catch (error) {
        console.error('Error reporting post:', error);
        const errorMsg =
          error.response?.data?.thankyou ||
          error.response?.data?.message ||
          'Failed to report post. Please try again.';
        alert(errorMsg);
      }
    }
  };

  const handleUninterested = async () => {
    try {
      await api.post(`/posts/${post._id}/uninterested`);
      alert('Post hidden from your feed.');
      if (onPostDeleted) onPostDeleted(post._id);
    } catch (error) {
      console.error('Error marking post as uninterested:', error);
      alert('Failed to hide post. Please try again.');
    }
  };

  const handleAddCustomTag = async () => {
    if (!customTagInput.trim()) {
      alert('Please enter a tag');
      return;
    }

    if (postTags.includes(customTagInput.trim())) {
      alert('This tag already exists on the post');
      setCustomTagInput('');
      return;
    }

    try {
      setLoading(true);
      const newTags = [...postTags, customTagInput.trim()];
      await api.put(`/posts/${post._id}`, { tags: newTags });
      setPostTags(newTags);
      setCustomTagInput('');
      setShowTagInput(false);
      if (onTagsUpdated) onTagsUpdated();
      alert('Tag added successfully.');
    } catch (error) {
      console.error('Error adding tag:', error);
      alert('Failed to add tag. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTag = async (tagToRemove) => {
    try {
      setLoading(true);
      const newTags = postTags.filter((tag) => tag !== tagToRemove);
      await api.put(`/posts/${post._id}`, { tags: newTags });
      setPostTags(newTags);
      if (onTagsUpdated) onTagsUpdated();
    } catch (error) {
      console.error('Error removing tag:', error);
      alert('Failed to remove tag. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isOwner = user?._id === post?.author?._id;
  const createdAt = new Date(post.createdAt);
  const minutesAgo = Math.round((Date.now() - createdAt) / 60000);
  const timeAgo = minutesAgo < 60 ? `${minutesAgo} min ago` : `${Math.round(minutesAgo / 60)} h ago`;

  const handleAuthorClick = () => {
    if (post?.author?._id) {
      navigate(`/profile/${post.author._id}`);
    }
  };

  const handlePostClick = () => {
    if (post?._id) {
      navigate(`/post/${post._id}`);
    }
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <div className="post-user-info" onClick={handleAuthorClick} style={{ cursor: 'pointer' }}>
          <div className="post-avatar">
            {post?.author?.profileImage ? (
              <img src={post.author.profileImage} alt={post?.author?.name} />
            ) : (
              <DefaultAvatar user={post?.author} size="md" />
            )}
          </div>
          <div className="user-info-text">
            <p className="post-username">{post?.author?.name || post?.author?.username}</p>
            <small className="post-time">{timeAgo}</small>
          </div>
        </div>

        {isOwner && (
          <button onClick={handleDelete} className="btn-delete" title="Delete post">
            x
          </button>
        )}
      </div>

      {post?.isEducational ? (
        <div className="post-education-badge">
          <span className="badge">Educational</span>
          <span className="score">{post.educationalScore?.toFixed(0)}%</span>
        </div>
      ) : (
        <div className="post-education-badge rejected">
          <span className="badge">Not educational</span>
          <span className="score">{post.educationalScore?.toFixed(0) ?? 0}%</span>
        </div>
      )}

      {post?.content && (
        <div className="post-content" onClick={handlePostClick} style={{ cursor: 'pointer' }}>
          <p>{expanded || post.content.length <= 500 ? post.content : `${post.content.substring(0, 500)}...`}</p>
          {post.content.length > 500 && (
            <button
              className="read-more-btn"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? 'Read less' : 'Read more'}
            </button>
          )}
        </div>
      )}

      {(post?.image || post?.imageUrl) && (
        <div className="post-image" onClick={handlePostClick} style={{ cursor: 'pointer' }}>
          <img src={post.image || post.imageUrl} alt="Post content" />
        </div>
      )}

      {(post?.videoUrl || post?.video) && (
        <div className="post-video" onClick={handlePostClick} style={{ cursor: 'pointer' }}>
          <video
            src={post.videoUrl || post.video}
            controls
            style={{ width: '100%', maxHeight: '500px', borderRadius: '8px' }}
            title="Educational video"
          />
        </div>
      )}

      {postTags && postTags.length > 0 && (
        <div className="post-tags">
          {postTags.map((tag) => (
            <div key={tag} className="tag-wrapper">
              <span
                className="tag clickable"
                title="Click to filter by this tag"
                onClick={() => navigate(`/feed?tags=${encodeURIComponent(tag)}`)}
              >
                #{tag}
              </span>
              {isOwner && (
                <button
                  className="remove-tag-btn"
                  onClick={() => handleRemoveTag(tag)}
                  title="Remove this tag"
                  disabled={loading}
                >
                  x
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {isOwner && (
        <div className="post-tag-management">
          {!showTagInput ? (
            <button
              onClick={() => setShowTagInput(true)}
              className="add-custom-tag-btn"
              title="Add a custom tag to your post"
            >
              Add Tag
            </button>
          ) : (
            <div className="custom-tag-input-section">
              <input
                type="text"
                placeholder="Enter custom tag..."
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCustomTag();
                  }
                }}
                className="custom-tag-input"
                disabled={loading}
              />
              <button
                onClick={handleAddCustomTag}
                className="confirm-tag-btn"
                disabled={!customTagInput || loading}
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowTagInput(false);
                  setCustomTagInput('');
                }}
                className="cancel-tag-btn"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      <div className="post-stats">
        <span className="stat">
          <span className="count">{likeCount}</span>
          <span>Likes</span>
        </span>
        <span className="stat">
          <span className="count">{post?.comments?.length || 0}</span>
          <span>Comments</span>
        </span>
      </div>

      <div className="post-actions">
        <button
          onClick={handleLike}
          className={`action-btn ${liked ? 'liked' : ''}`}
          disabled={loading}
          title="Like this post"
        >
          <span>Like</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className={`action-btn ${showComments ? 'active' : ''}`}
          title="Comment on this post"
        >
          <span>Comment</span>
        </button>
        <button className="action-btn" title="Share this post">
          <span>Share</span>
        </button>
        {!isOwner && (
          <>
            <button onClick={handleUninterested} className="action-btn" title="Not interested - hide from feed">
              <span>Not Interested</span>
            </button>
            <button onClick={handleReport} className="action-btn report-btn" title="Report as non-educational">
              <span>Report</span>
            </button>
          </>
        )}
      </div>

      {showComments && <CommentSection postId={post._id} />}
    </div>
  );
};

export default PostCard;
