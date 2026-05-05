import React, { useState, useEffect, useCallback } from 'react';
import { commentsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import '../styles/CommentSection.css';

const CommentSection = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchComments = useCallback(async () => {
    try {
      const response = await commentsAPI.getComments(postId);
      setComments(response.data.comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [postId, fetchComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const response = await commentsAPI.createComment({
        postId,
        content: newComment,
      });
      setComments([response.data.comment, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await commentsAPI.deleteComment(commentId);
      setComments(comments.filter((c) => c._id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  return (
    <div className="comment-section">
      <form onSubmit={handleSubmit} className="comment-form">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          maxLength="500"
        />
        <button type="submit" disabled={loading || !newComment.trim()}>
          {loading ? '...' : 'Reply'}
        </button>
      </form>

      <div className="comments-list">
        {comments.map((comment) => (
          <div key={comment._id} className="comment">
            <img src={comment.author.profileImage} alt={comment.author.username} />
            <div className="comment-content">
              <p className="comment-username">{comment.author.username}</p>
              <p className="comment-text">{comment.content}</p>
              <small>{comment.likeCount} likes</small>
            </div>
            {user?._id === comment.author._id && (
              <button onClick={() => handleDeleteComment(comment._id)} className="btn-delete-comment">
                x
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentSection;
