import React from 'react';

const VoiceVisualizer = ({ isListening, isSpeaking, micStatus }) => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center p-3">
      <div className="mic-pulse-container mb-3">
        {(isListening || isSpeaking) && (
          <div className={`pulse-ring ${isListening ? 'active-listening' : 'active-speaking'}`} />
        )}
        <div className={`mic-btn-main ${isListening ? 'listening' : isSpeaking ? 'speaking' : ''}`}>
          <i
            className={`bi ${
              isListening ? 'bi-mic-fill' : isSpeaking ? 'bi-volume-up-fill' : 'bi-mic'
            }`}
          />
        </div>
      </div>

      {/* Audio Wave Bars */}
      {(isListening || isSpeaking) && (
        <div className="audio-waves mb-2">
          <div className="audio-bar" />
          <div className="audio-bar" />
          <div className="audio-bar" />
          <div className="audio-bar" />
          <div className="audio-bar" />
          <div className="audio-bar" />
        </div>
      )}

      {/* Status indicator */}
      <div className="text-center">
        <span
          className={`badge rounded-pill ${
            isListening
              ? 'bg-danger'
              : isSpeaking
              ? 'bg-success'
              : 'bg-light text-secondary border'
          }`}
          style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}
        >
          <i
            className={`bi me-1 ${
              isListening
                ? 'bi-record-fill'
                : isSpeaking
                ? 'bi-soundwave'
                : 'bi-info-circle'
            }`}
          />
          {micStatus || (isListening ? 'Listening to speech...' : isSpeaking ? 'Assistant speaking...' : 'Ready')}
        </span>
      </div>
    </div>
  );
};

export default VoiceVisualizer;
