import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import '../styles/Feed.css';

const Feed = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState(() => {
    const urlTags = searchParams.get('tags');
    return urlTags ? [urlTags] : [];
  });
  const [allAvailableTags, setAllAvailableTags] = useState([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);

      let url = `/posts?page=${page}&limit=10`;
      if (selectedTags.length > 0) {
        url += `&tags=${selectedTags.join(',')}`;
      }
      if (searchInput) {
        url += `&search=${encodeURIComponent(searchInput)}`;
      }

      const response = await api.get(url);

      if (page === 1) {
        setPosts(response.data.posts || []);
      } else {
        setPosts((prevPosts) => [...prevPosts, ...(response.data.posts || [])]);
      }

      setTotalPages(response.data.totalPages || 1);
      setError('');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load posts';
      setError(errorMessage);
      console.error('Error message:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [page, selectedTags, searchInput]);

  const fetchAvailableTags = useCallback(async () => {
    try {
      const response = await api.get('/posts?limit=1000');
      const tags = new Set();
      (response.data.posts || []).forEach((post) => {
        if (post.tags && Array.isArray(post.tags)) {
          post.tags.forEach((tag) => tags.add(tag));
        }
      });
      setAllAvailableTags(Array.from(tags).sort());
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  }, []);

  useEffect(() => {
    fetchAvailableTags();
  }, [fetchAvailableTags]);

  useEffect(() => {
    fetchPosts();
  }, [page, fetchPosts]);

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handleLoadMore = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter((post) => post._id !== postId));
  };

  const handleAddTag = (tag) => {
    if (tag && !selectedTags.includes(tag)) {
      const newTags = [...selectedTags, tag];
      setSelectedTags(newTags);
      setSearchParams({ tags: newTags.join(',') });
      setTagInput('');
      setShowTagSuggestions(false);
      setPage(1);
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    const newTags = selectedTags.filter((tag) => tag !== tagToRemove);
    setSelectedTags(newTags);
    if (newTags.length > 0) {
      setSearchParams({ tags: newTags.join(',') });
    } else {
      setSearchParams({});
    }
    setPage(1);
  };

  const handleClearAllTags = () => {
    setSelectedTags([]);
    setSearchParams({});
    setPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setPage(1);
  };

  const filteredTagSuggestions = allAvailableTags.filter(
    (tag) => tag.toLowerCase().includes(tagInput.toLowerCase()) && !selectedTags.includes(tag)
  );

  return (
    <div className="feed-container">
      <div className="feed-header">
        <h1>MindScroll Feed</h1>
        <p>Discover educational content</p>
      </div>

      <div className="feed-search-section">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search posts..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="search-input"
            />
            {searchInput && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={handleClearSearch}
                title="Clear search"
              >
                x
              </button>
            )}
            <button type="submit" className="search-btn">
              Search
            </button>
          </div>
        </form>

        <div className="tag-input-wrapper">
          <div className="tag-input-container">
            <input
              type="text"
              placeholder="Add tags to filter..."
              value={tagInput}
              onChange={(e) => {
                setTagInput(e.target.value);
                setShowTagSuggestions(true);
              }}
              onFocus={() => setShowTagSuggestions(true)}
              className="tag-input"
            />
            <button
              onClick={() => handleAddTag(tagInput)}
              className="add-tag-btn"
              disabled={!tagInput}
              title="Add tag"
            >
              Add Tag
            </button>
          </div>

          {showTagSuggestions && tagInput && filteredTagSuggestions.length > 0 && (
            <div className="tag-suggestions">
              {filteredTagSuggestions.slice(0, 10).map((tag) => (
                <div key={tag} className="tag-suggestion-item" onClick={() => handleAddTag(tag)}>
                  #{tag}
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedTags.length > 0 && (
          <div className="selected-tags-section">
            <div className="selected-tags-label">Active filters</div>
            <div className="selected-tags">
              {selectedTags.map((tag) => (
                <div key={tag} className="selected-tag">
                  <span className="tag-name">#{tag}</span>
                  <button
                    className="remove-tag-btn"
                    onClick={() => handleRemoveTag(tag)}
                    title="Remove tag filter"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
            {selectedTags.length > 1 && (
              <button className="clear-all-tags-btn" onClick={handleClearAllTags}>
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>

      {error && <div className="feed-error">{error}</div>}

      <CreatePost onPostCreated={handlePostCreated} />

      <div className="posts-list">
        {posts.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-icon">No posts</div>
            <h2>{selectedTags.length > 0 || searchInput ? 'No posts found' : 'No posts yet'}</h2>
            <p>
              {selectedTags.length > 0 || searchInput
                ? 'Try adjusting your filters or search terms.'
                : 'Be the first to share educational content with the community.'}
            </p>
          </div>
        )}

        {posts
          .filter((post) => post && post._id)
          .map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onPostDeleted={handlePostDeleted}
              onTagsUpdated={() => {
                fetchAvailableTags();
              }}
            />
          ))}
      </div>

      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading posts...</p>
        </div>
      )}

      {page < totalPages && !loading && posts.length > 0 && (
        <button onClick={handleLoadMore} className="btn-load-more">
          Load More Posts
        </button>
      )}
    </div>
  );
};

export default Feed;
