import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import VoiceVisualizer from '../components/VoiceVisualizer';
import StatusBadge from '../components/StatusBadge';

const VoiceReview = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const reviewId = searchParams.get('reviewId');

  const [review, setReview] = useState(null);
  const [intern, setIntern] = useState(null);
  const [task, setTask] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [micStatus, setMicStatus] = useState('Ready');
  const [loading, setLoading] = useState(true);

  const recognitionRef = useRef(null);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Speech Recognition setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setMicStatus('Listening to your follow-up question...');
      };

      recognition.onresult = (event) => {
        const spoken = event.results[0][0].transcript;
        setMicStatus('Processing question...');
        handleSendMessage(spoken);
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        setMicStatus(`Recognition paused. Ready.`);
      };

      recognition.onend = () => {
        setIsListening(false);
        setMicStatus('Ready');
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  // Fetch Review & Task details
  useEffect(() => {
    const loadReview = async () => {
      try {
        setLoading(true);
        let res;
        if (reviewId) {
          res = await api.get(`/reviews/${reviewId}`);
        } else {
          const listRes = await api.get(`/reviews/intern/${user?.id}`);
          if (listRes.data.success && listRes.data.data.length > 0) {
            res = { data: { success: true, data: listRes.data.data[0] } };
          }
        }

        if (res?.data?.success) {
          const rev = res.data.data;
          setReview(rev);
          setIntern(rev.internId);
          setTask(rev.taskId);

          const script = rev.spokenFeedbackSummary || rev.analysis?.summary || 'I have completed the code review of your submission.';

          setMessages([
            {
              sender: 'assistant',
              text: script,
              timestamp: new Date(),
            },
          ]);

          speakText(script);
        }
      } catch (err) {
        console.error('Failed to load review:', err);
      } finally {
        setLoading(false);
      }
    };

    loadReview();
  }, [reviewId, user?.id]);

  const speakText = (text) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setMicStatus('Assistant speaking feedback...');
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setMicStatus('Ready');
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setMicStatus('Ready');
    };

    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const handleSendMessage = async (customText) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim()) return;

    setMessages((prev) => [...prev, { sender: 'user', text: textToSend, timestamp: new Date() }]);
    setInputText('');

    try {
      const activeSession = `session-review-${review?._id || user?.id}-${new Date().toISOString().slice(0, 10)}`;
      const res = await api.post('/assistant/chat', {
        sessionId: activeSession,
        message: textToSend,
        internId: intern?._id || user?.id,
      });

      if (res.data.success) {
        const reply = res.data.reply || res.data.data?.answerText;
        setMessages((prev) => [...prev, { sender: 'assistant', text: reply, timestamp: new Date() }]);
        speakText(res.data.data?.spokenText || reply);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Error communicating with AI assistant. Please try again.';
      setMessages((prev) => [
        ...prev,
        { sender: 'assistant', text: errMsg, timestamp: new Date() },
      ]);
    }
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary"></div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="card card-custom p-4 mb-4 border-0 shadow-sm">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 rounded-pill">
                <i className="bi bi-mic me-1"></i> Interactive Voice Review Session
              </span>
              <StatusBadge status={review?.analysis?.reviewStatus || review?.status} />
            </div>
            <h3 className="fw-bold mb-0">Project Review Walkthrough & Q&A</h3>
            <p className="text-muted small mb-0">
              Task: <strong>{task?.taskTitle}</strong> • Cycle #{review?.cycleNumber} • Commit: <code>{review?.commitSha?.substring(0, 7) || 'latest'}</code>
            </p>
          </div>

          <div className="d-flex gap-2">
            <Link to="/intern/portal" className="btn btn-outline-secondary btn-sm rounded-pill px-3">
              Back to Portal
            </Link>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Voice Visualizer Hub */}
        <div className="col-12 col-lg-5">
          <div className="card card-custom p-4 text-center h-100 d-flex flex-column justify-content-between">
            <div>
              <h5 className="fw-bold mb-1">AI Evaluator Voice Hub</h5>
              <p className="text-muted small mb-3">Ask questions about required fixes or mentor approvals</p>

              <VoiceVisualizer
                isListening={isListening}
                isSpeaking={isSpeaking}
                micStatus={micStatus}
              />

              <div className="my-4">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`btn px-4 py-2 rounded-pill fw-bold ${
                    isListening ? 'btn-danger shadow-lg' : 'btn-primary-custom'
                  }`}
                  style={{ minWidth: '220px' }}
                >
                  <i className={`bi ${isListening ? 'bi-stop-fill' : 'bi-mic-fill'} me-2`}></i>
                  {isListening ? 'Stop Listening' : 'Ask Follow-up Question'}
                </button>
              </div>

              <div className="d-flex justify-content-center gap-2 mb-4">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`btn btn-sm rounded-pill px-3 ${isMuted ? 'btn-danger' : 'btn-light border'}`}
                >
                  <i className={`bi ${isMuted ? 'bi-volume-mute-fill' : 'bi-volume-up'} me-1`}></i>
                  {isMuted ? 'Muted' : 'Mute'}
                </button>

                <button
                  onClick={() => {
                    if (review?.spokenFeedbackSummary) speakText(review.spokenFeedbackSummary);
                  }}
                  className="btn btn-sm btn-light border rounded-pill px-3"
                >
                  <i className="bi bi-arrow-repeat me-1"></i> Replay Feedback
                </button>
              </div>
            </div>

            {/* Quick action items */}
            {review?.analysis?.problemsAndFixes && review.analysis.problemsAndFixes.length > 0 && (
              <div className="text-start p-3 bg-light rounded-3 border small">
                <strong className="text-danger d-block mb-1">Key Action Required:</strong>
                <span className="text-secondary">{review.analysis.problemsAndFixes[0].suggestedFix}</span>
              </div>
            )}
          </div>
        </div>

        {/* Conversation Transcript */}
        <div className="col-12 col-lg-7">
          <div className="card card-custom p-4 h-100 d-flex flex-column" style={{ minHeight: '520px' }}>
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-chat-quote-fill text-success"></i> Review Discussion Transcript
            </h5>

            <div
              className="flex-grow-1 overflow-auto p-3 bg-light rounded-3 border mb-3"
              style={{ maxHeight: '380px', minHeight: '280px' }}
            >
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`chat-bubble ${msg.sender === 'user' ? 'user' : 'assistant'}`}
                >
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <strong style={{ fontSize: '0.78rem' }}>
                      {msg.sender === 'user' ? 'You (Intern)' : 'AI Evaluator'}
                    </strong>
                    <small className="opacity-75" style={{ fontSize: '0.68rem' }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </small>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            {/* Text Chat Fallback */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="d-flex gap-2"
            >
              <input
                type="text"
                className="form-control"
                placeholder="Ask about validation, error handling, or test requirements..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button type="submit" className="btn btn-primary-custom px-4 rounded-pill">
                <i className="bi bi-send-fill"></i>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceReview;
