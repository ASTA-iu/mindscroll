import React from 'react';
import '../styles/RejectionModal.css';

const RejectionModal = ({ analysis, onClose }) => {
  if (!analysis) return null;

  const {
    educationalValue = 0,
    reason = '',
    whyCantPost = '',
    improvements = [],
    detailedAnalysis = '',
  } = analysis;

  const isApproved = educationalValue >= 65;

  return (
    <div className="rejection-overlay" onClick={onClose}>
      <div className="rejection-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-color)',
            background: isApproved
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))'
              : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-primary)' }}>
            AI Educational Content Analysis
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              color: '#666',
              padding: '0',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.target.style.background = 'rgba(0,0,0,0.1)')}
            onMouseLeave={(e) => (e.target.style.background = 'none')}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="rejection-content" style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Score Card */}
          <div
            style={{
              backgroundColor: isApproved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `2px solid ${isApproved ? '#10b981' : '#ef4444'}`,
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '12px' }}>
              <span style={{ fontSize: '3rem' }}>{isApproved ? '✅' : '❌'}</span>
              <div style={{ textAlign: 'left' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Educational Value Score
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '2.2rem', fontWeight: 'bold', color: isApproved ? '#10b981' : '#ef4444' }}>
                  {educationalValue}%
                </p>
              </div>
            </div>
            <p style={{ margin: '8px 0 0 0', color: isApproved ? '#059669' : '#dc2626', fontSize: '1rem', fontWeight: '600' }}>
              {isApproved ? '✓ Approved - Post your content!' : '✗ Not approved - Needs improvement'}
            </p>
          </div>

          {/* Main Reason */}
          {reason && (
            <div
              style={{
                backgroundColor: isApproved ? 'rgba(34, 197, 94, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                border: `1px solid ${isApproved ? '#22c55e' : '#f87171'}`,
                borderLeft: `4px solid ${isApproved ? '#22c55e' : '#f87171'}`,
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px',
              }}
            >
              <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                {isApproved ? '✓ Why This Post Works' : '❌ Why This Was Rejected'}
              </p>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                {reason}
              </p>
            </div>
          )}

          {/* Why Can't Post - Detailed Explanation */}
          {whyCantPost && !isApproved && (
            <div
              style={{
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px',
              }}
            >
              <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#b45309', fontSize: '0.95rem' }}>
                🔍 What's the Problem?
              </p>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                {whyCantPost}
              </p>
            </div>
          )}

          {/* Detailed Analysis - Formatted */}
          {detailedAnalysis && (
            <div
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderLeft: '4px solid #3b82f6',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '20px',
                fontSize: '0.9rem',
                lineHeight: '1.7',
                color: 'var(--text-secondary)',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {detailedAnalysis}
            </div>
          )}

          {/* Improvements / How to Fix */}
          {improvements && improvements.length > 0 && !isApproved && (
            <div
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px',
              }}
            >
              <p style={{ margin: '0 0 12px 0', fontWeight: '600', color: '#166534', fontSize: '0.95rem' }}>
                💡 How to Improve Your Post
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {improvements.map((improvement, idx) => (
                  <li
                    key={idx}
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.9rem',
                      marginBottom: '8px',
                      lineHeight: '1.5',
                    }}
                  >
                    {improvement}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Success Message for Approved */}
          {isApproved && (
            <div
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center',
              }}
            >
              <p style={{ margin: 0, color: '#166534', fontSize: '0.95rem', fontWeight: '600' }}>
                ✓ Your post meets our educational standards and can be published!
              </p>
            </div>
          )}

          {/* Educational Guidelines */}
          {!isApproved && (
            <div
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '8px',
                padding: '16px',
                marginTop: '20px',
              }}
            >
              <p style={{ margin: '0 0 12px 0', fontWeight: '600', color: '#92400e', fontSize: '0.95rem' }}>
                📚 What Makes Content Educational?
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '6px' }}>
                  Teaches a skill or concept
                </li>
                <li style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '6px' }}>
                  Explains academic or factual information
                </li>
                <li style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '6px' }}>
                  Provides learning resources or study materials
                </li>
                <li style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Shows clear intent to educate others
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            gap: '12px',
            background: 'var(--bg-secondary)',
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: isApproved ? '#10b981' : 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '600',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.target.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.target.style.opacity = '1')}
          >
            {isApproved ? '✓ Post This Content' : '← Go Back & Edit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectionModal;
