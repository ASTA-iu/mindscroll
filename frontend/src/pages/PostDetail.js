import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import DefaultAvatar from '../components/DefaultAvatar';
import CommentSection from '../components/CommentSection';
import '../styles/PostDetail.css';
import { useAuth } from '../contexts/AuthContext';

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const fetchPost = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/posts/${postId}`);
      const postData = response.data.post || response.data;
      setPost(postData);
      setLiked(postData.likes?.includes(user?._id) || false);
      setLikeCount(postData.likes?.length || 0);
      setError('');
    } catch (err) {
      console.error('Error fetching post:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load post';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [postId, user]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleLike = async () => {
    try {
      await api.post(`/posts/${post._id}/like`);
      setLiked(!liked);
      setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await api.delete(`/posts/${post._id}`);
        alert('Post deleted successfully');
        navigate('/feed');
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
        navigate('/feed');
      } catch (error) {
        console.error('Error reporting post:', error);
        const errorMsg = error.response?.data?.thankyou || error.response?.data?.message || 'Failed to report post. Please try again.';
        alert(errorMsg);
      }
    }
  };

  const handleUninterested = async () => {
    try {
      await api.post(`/posts/${post._id}/uninterested`);
      alert('Post hidden from your feed.');
      navigate('/feed');
    } catch (error) {
      console.error('Error marking post as uninterested:', error);
      alert('Failed to hide post. Please try again.');
    }
  };

  const handleAuthorClick = () => {
    if (post?.author?._id) {
      navigate(`/profile/${post.author._id}`);
    }
  };

  if (loading) {
    return (
      <div className="post-detail-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading post...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="post-detail-container">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/feed')} className="btn-back">
            ← Back to Feed
          </button>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="post-detail-container">
        <div className="error-container">
          <h2>Post not found</h2>
          <button onClick={() => navigate('/feed')} className="btn-back">
            ← Back to Feed
          </button>
        </div>
      </div>
    );
  }

  const isOwner = user?._id === post?.author?._id;
  const createdAt = new Date(post.createdAt);
  const timeAgo = `${Math.round((Date.now() - createdAt) / 60000)} min ago`;

  return (
    <div className="post-detail-container">
      <button onClick={() => navigate('/feed')} className="btn-back">
        ← Back to Feed
      </button>

      <div className="post-detail-card">
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
              ✕
            </button>
          )}
        </div>

        {post?.isEducational ? (
          <div className="post-education-badge">
            <span className="badge">✓ Educational</span>
            <span className="score">{post.educationalScore?.toFixed(0)}%</span>
          </div>
        ) : (
          <div className="post-education-badge rejected">
            <span className="badge">✘ Not educational</span>
            <span className="score">{post.educationalScore?.toFixed(0) ?? 0}%</span>
          </div>
        )}

        {post?.content && (
          <div className="post-content">
            <p>{post.content}</p>
          </div>
        )}

        {(post?.image || post?.imageUrl) && (
          <div className="post-image">
            <img src={post.image || post.imageUrl} alt="Post content" />
          </div>
        )}

        {(post?.videoUrl || post?.video) && (
          <div className="post-video">
            <video 
              src={post.videoUrl || post.video} 
              controls 
              style={{ width: '100%', maxHeight: '600px', borderRadius: '8px' }}
              title="Educational video"
            />
          </div>
        )}

        {post?.tags && post.tags.length > 0 && (
          <div className="post-tags">
            {post.tags.map((tag) => (
              <span key={tag} className="tag">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="post-stats">
          <span className="stat">
            <span className="icon">❤️</span>
            <span className="count">{likeCount}</span>
          </span>
          <span className="stat">
            <span className="icon">💬</span>
            <span className="count">{post?.comments?.length || 0}</span>
          </span>
        </div>

        <div className="post-actions">
          <button
            onClick={handleLike}
            className={`action-btn ${liked ? 'liked' : ''}`}
            title="Like this post"
          >
            {liked ? '❤️' : '🤍'}
            <span>Like</span>
          </button>
          <button className="action-btn" title="Comment on this post">
            💬
            <span>Comment</span>
          </button>
          <button className="action-btn" title="Share this post">
            🔗
            <span>Share</span>
          </button>
          {!isOwner && (
            <>
              <button
                onClick={handleUninterested}
                className="action-btn"
                title="Not interested - hide from feed"
              >
                👎
                <span>Not Interested</span>
              </button>
              <button
                onClick={handleReport}
                className="action-btn report-btn"
                title="Report as non-educational"
              >
                🚩
                <span>Report</span>
              </button>
            </>
          )}
        </div>

        <div className="comments-section-wrapper">
          <h3>Comments</h3>
          <CommentSection postId={post._id} />
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
