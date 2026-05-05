import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Auth.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-hero">
        <h1>Welcome to MindScroll</h1>
        <p className="subtitle">The Educational Social Platform</p>
        <p className="description">
          Share knowledge, learn from others, and build an educational community.
          AI review helps keep the feed focused on quality learning content.
        </p>

        <div className="features">
          <div className="feature">
            <h3>Share Knowledge</h3>
            <p>Post educational insights, media, and resources</p>
          </div>
          <div className="feature">
            <h3>AI Filtering</h3>
            <p>Automatic review keeps content topic-focused</p>
          </div>
          <div className="feature">
            <h3>Connect</h3>
            <p>Follow educators and learners in your field</p>
          </div>
          <div className="feature">
            <h3>Engage</h3>
            <p>Discuss ideas through comments and reactions</p>
          </div>
        </div>

        <div className="cta-buttons">
          <button onClick={() => navigate('/register')} className="btn-primary">
            Get Started
          </button>
          <button onClick={() => navigate('/login')} className="btn-secondary">
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
