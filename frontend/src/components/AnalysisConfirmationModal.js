import React from 'react';
import '../styles/AnalysisConfirmationModal.css';

const AnalysisConfirmationModal = ({ analysis, onConfirm, onCancel, isLoading, isOpen }) => {
  if (!isOpen || !analysis) return null;

  const {
    educationalValue = analysis?.educationalScore || 0,
    score = analysis?.score || 0,
    reason = '',
    textScore = null,
    imageScore = null,
    videoScore = null,
    detectionReasons = [],
    isCasual = false,
    isSelfie = false,
    whatIsWrong = [],
    // Detailed analysis fields
    details = {},
    signals = {},
    violations = [],
    violationDetails = {}
  } = analysis;

  // Use any available score field (educationalScore, score, educationalValue)
  const finalScore = educationalValue || score || analysis?.educationalScore || analysis?.score || 0;
  const isApproved = finalScore >= 50; // Match backend threshold of 50%
  
  // Check if there are any violations
  const hasViolations = violations && violations.length > 0;

  // Extract component scores from various possible locations
  const componentScores = {
    text: textScore || details?.textScore || signals?.caption?.score || null,
    image: imageScore || details?.imageScore || signals?.visual?.score || null,
    video: videoScore || details?.videoScore || signals?.video?.score || null
  };

  // Build detailed analysis notes
  const getAnalysisNotes = () => {
    const notes = [];
    
    if (componentScores.text) {
      notes.push(`📝 Text analysis: ${componentScores.text}%`);
    }
    if (componentScores.image) {
      notes.push(`🖼️ Image analysis: ${componentScores.image}%`);
    }
    if (componentScores.video) {
      notes.push(`🎬 Video analysis: ${componentScores.video}%`);
    }
    
    if (isSelfie) {
      notes.push('⚠️ Selfie/Portrait - Not educational');
    } else if (isCasual) {
      notes.push('⚠️ Meme/Casual content detected');
    }
    
    return notes;
  };

  // Parse violation details for display
  const getViolationDetails = () => {
    if (!hasViolations) return [];
    
    const details = [];
    
    if (violationDetails && typeof violationDetails === 'object') {
      Object.entries(violationDetails).forEach(([key, violation]) => {
        details.push({
          icon: key === 'nsfw' ? '🔞' : key === 'violence' ? '⚔️' : key === 'offensive' ? '😤' : '💊',
          type: violation.type || key,
          score: Math.round(violation.score * 100),
          reason: violation.reason,
          matches: violation.matches || []
        });
      });
    } else if (Array.isArray(violations)) {
      // Fallback: parse violations array
      violations.forEach(v => {
        const match = v.match(/([^(]+)\s*\(([^)]+)%\)/);
        if (match) {
          details.push({
            type: match[1].trim(),
            score: parseInt(match[2]),
            reason: 'Prohibited content detected'
          });
        }
      });
    }
    
    return details;
  };

  // Guidelines for improvement
  const getImprovementGuidelines = () => {
    const guidelines = [];
    
    if (hasViolations) {
      violationDetails && Object.entries(violationDetails).forEach(([key, violation]) => {
        if (key === 'nsfw') {
          guidelines.push('❌ NSFW/Adult content is not allowed on MindScroll');
          guidelines.push('✅ Share educational and learning-related content only');
        } else if (key === 'violence') {
          guidelines.push('❌ Violent, aggressive, or harmful content is prohibited');
          guidelines.push('✅ Focus on constructive, educational discussions');
        } else if (key === 'offensive') {
          guidelines.push('❌ Hate speech, discrimination, and offensive content violate community standards');
          guidelines.push('✅ Treat all groups with respect and dignity');
        } else if (key === 'drugs') {
          guidelines.push('❌ Drug-related content, sales, or glorification are prohibited');
          guidelines.push('✅ Share harm-reduction or educational health content only');
        }
      });
    } else if (isSelfie) {
      guidelines.push('❌ Selfies are for personal social media, not educational content');
      guidelines.push('✅ Instead: Share educational content like tutorials, diagrams, explanations');
      guidelines.push('✅ Try: Photos of textbooks, whiteboards, scientific diagrams');
      guidelines.push('✅ Include: Context text explaining what viewers can learn');
    } else if (finalScore < 50 && finalScore >= 25) {
      guidelines.push('⚠️ Your content is partially educational but needs improvement');
      guidelines.push('✅ Add more educational text explaining the topic');
      guidelines.push('✅ Include relevant keywords: study, learn, explain, teach, tutorial');
      guidelines.push('✅ Focus on learning outcome: What will viewers learn?');
    } else if (finalScore < 25) {
      guidelines.push('❌ This content is primarily entertainment/casual');
      guidelines.push('✅ Refocus on educational topics: science, history, learning');
      guidelines.push('✅ Add explanatory text about what users can learn');
      guidelines.push('✅ Share educational resources or learning materials');
    }
    
    return guidelines;
  };

  const analysisNotes = getAnalysisNotes();
  const improvementGuidelines = getImprovementGuidelines();
  const violationInfo = getViolationDetails();

  return (
    <div className="analysis-overlay" onClick={onCancel}>
      <div className="analysis-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="analysis-header">
          <h2>AI Educational Content Analysis</h2>
          <button
            onClick={onCancel}
            className="analysis-close-btn"
            title="Close"
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="analysis-content">
          {/* Score Card */}
          <div className={`analysis-score-card ${isApproved ? 'approved' : 'rejected'}`}>
            <div className="score-display">
              <span className="score-emoji">{isApproved ? '✅' : '⚠️'}</span>
              <div className="score-text">
                <p className="score-label">Educational Value Score</p>
                <p className={`score-value ${isApproved ? 'approved-text' : 'rejected-text'}`}>
                  {finalScore}%
                </p>
              </div>
            </div>
            <p className={`score-status ${isApproved ? 'approved-status' : 'rejected-status'}`}>
              {isApproved ? '✓ Approved - Ready to Post!' : '⚠️ Review Needed'}
            </p>
          </div>

          {/* Breakdown */}
          <div className="score-breakdown">
            <h4>Analysis Breakdown</h4>
            <div className="breakdown-items">
              {componentScores.text != null && componentScores.text > 0 && (
                <div className="breakdown-item">
                  <span className="breakdown-label">📝 Text Content</span>
                  <span className={`breakdown-value ${componentScores.text >= 65 ? 'strong' : componentScores.text >= 50 ? 'moderate' : 'weak'}`}>
                    {componentScores.text}%
                  </span>
                </div>
              )}
              {componentScores.image != null && componentScores.image > 0 && (
                <div className="breakdown-item">
                  <span className="breakdown-label">🖼️ Image Analysis</span>
                  <span className={`breakdown-value ${componentScores.image >= 65 ? 'strong' : componentScores.image >= 50 ? 'moderate' : 'weak'}`}>
                    {componentScores.image}%
                  </span>
                </div>
              )}
              {componentScores.video != null && componentScores.video > 0 && (
                <div className="breakdown-item">
                  <span className="breakdown-label">🎬 Video Analysis</span>
                  <span className={`breakdown-value ${componentScores.video >= 65 ? 'strong' : componentScores.video >= 50 ? 'moderate' : 'weak'}`}>
                    {componentScores.video}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Analysis Notes */}
          {analysisNotes.length > 0 && (
            <div className="detailed-analysis">
              <h4>📊 Detailed Analysis</h4>
              <div className="analysis-notes-list">
                {analysisNotes.map((note, idx) => (
                  <div key={idx} className="analysis-note-item">
                    <span className="note-bullet">•</span>
                    <span className="note-text">{note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Violations Detected */}
          {violationInfo.length > 0 && (
            <div className="violations-detected">
              <h4>❌ Violations Detected</h4>
              <div className="violations-list">
                {violationInfo.map((violation, idx) => (
                  <div key={idx} className="violation-item">
                    <div className="violation-header">
                      <span className="violation-icon">{violation.icon}</span>
                      <span className="violation-type">{violation.type}</span>
                      <span className="violation-score">{violation.score}%</span>
                    </div>
                    <p className="violation-reason">{violation.reason}</p>
                    {violation.matches && violation.matches.length > 0 && (
                      <div className="violation-matches">
                        <span className="matches-label">Detected:</span>
                        <div className="matches-tags">
                          {violation.matches.map((match, mIdx) => (
                            <span key={mIdx} className="match-tag">"{match}"</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reason */}
          {reason && (
            <div className={`analysis-reason ${isApproved ? 'approved-reason' : 'rejected-reason'}`}>
              <p className="reason-label">
                {isApproved ? '✓ Why This Works' : '❌ Analysis Notes'}
              </p>
              <p className="reason-text">{reason}</p>
            </div>
          )}

          {/* Detection Reasons */}
          {detectionReasons && detectionReasons.length > 0 && (
            <div className="detection-reasons">
              <p className="detection-label">📋 Detection Details:</p>
              <ul className="detection-list">
                {detectionReasons.map((detectionReason, idx) => (
                  <li key={idx} className="detection-item">
                    {detectionReason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Approval Message */}
          {isApproved && (
            <div className="approval-message">
              <p>✓ Your post meets MindScroll educational standards!</p>
            </div>
          )}

          {/* Alert if Not Approved */}
          {!isApproved && (
            <div className="alert-message">
              <p>❌ Your content scored {finalScore}% - MindScroll requires minimum 50% educational value. Please revise your content and try again.</p>
            </div>
          )}

          {/* What's Wrong Section - For Rejected Content */}
          {!isApproved && (whatIsWrong.length > 0 || isSelfie) && (
            <div className="whats-wrong-section">
              <h4>❌ What's Wrong With This Post</h4>
              <div className="wrong-items">
                {whatIsWrong.length > 0 ? (
                  whatIsWrong.map((issue, idx) => (
                    <div key={idx} className="wrong-item">
                      <span className="wrong-icon">⚠️</span>
                      <span className="wrong-text">{issue}</span>
                    </div>
                  ))
                ) : isSelfie ? (
                  <>
                    <div className="wrong-item">
                      <span className="wrong-icon">⚠️</span>
                      <span className="wrong-text">Selfie/Portrait detected - This is not educational content</span>
                    </div>
                    <div className="wrong-item">
                      <span className="wrong-icon">⚠️</span>
                      <span className="wrong-text">MindScroll is designed for learning and educational content</span>
                    </div>
                    <div className="wrong-item">
                      <span className="wrong-icon">⚠️</span>
                      <span className="wrong-text">Personal photos belong on general social media platforms</span>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          )}

          {/* Improvement Guidelines */}
          {!isApproved && improvementGuidelines.length > 0 && (
            <div className="improvement-guidelines">
              <h4>✅ How to Improve Your Post</h4>
              <div className="guidelines-list">
                {improvementGuidelines.map((guideline, idx) => (
                  <div key={idx} className="guideline-item">
                    <span className="guideline-text">{guideline}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Buttons */}
        <div className="analysis-footer">
          <button
            className="btn-cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            {isLoading ? '...' : 'Cancel'}
          </button>
          <button
            className="btn-confirm"
            onClick={onConfirm}
            disabled={isLoading || !isApproved}
            title={!isApproved ? "Content must be 50%+ educational to post" : ""}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Posting...
              </>
            ) : (
              isApproved ? '✓ Post Content' : '❌ Cannot Post - Below 50%'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisConfirmationModal;
