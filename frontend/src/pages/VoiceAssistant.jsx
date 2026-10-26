import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import VoiceVisualizer from '../components/VoiceVisualizer';

const VoiceAssistant = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const targetInternId = searchParams.get('internId') || user?.id;

  const [intern, setIntern] = useState(null);
  const [task, setTask] = useState(null);
  const [meeting, setMeeting] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [micStatus, setMicStatus] = useState('Ready');
  const [loading, setLoading] = useState(true);
  const [sessionSaved, setSessionSaved] = useState(false);

  const recognitionRef = useRef(null);
  const chatBottomRef = useRef(null);

  const activeSessionId = useRef(
    `session-${targetInternId || 'intern'}-${new Date().toISOString().slice(0, 10)}`
  ).current;

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize Speech Recognition & Synthesis
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setMicStatus('Listening to your question...');
      };

      recognition.onresult = (event) => {
        const spokenText = event.results[0][0].transcript;
        setMicStatus('Processing speech...');
        handleSendMessage(spokenText);
      };

      recognition.onerror = (event) => {
        console.warn('[SpeechRecognition Error]', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setMicStatus('Microphone permission denied. You can type questions below.');
        } else {
          setMicStatus(`Recognition paused (${event.error}). Ready.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setMicStatus('Ready');
      };

      recognitionRef.current = recognition;
    } else {
      setMicStatus('Speech Recognition not supported in this browser. Please use text chat.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Fetch Intern, Task, Meeting, and Conversation History from MongoDB
  useEffect(() => {
    const loadSessionData = async () => {
      try {
        setLoading(true);
        const [meRes, meetingsRes, historyRes] = await Promise.all([
          api.get(targetInternId ? `/interns/${targetInternId}` : '/auth/me'),
          api.get(`/meetings?internId=${targetInternId}&meetingType=explanation`),
          api.get(`/assistant/history/${activeSessionId}?internId=${targetInternId}`).catch(() => ({ data: { messages: [] } })),
        ]);

        const loadedIntern = meRes.data.user || meRes.data.data;
        setIntern(loadedIntern);
        const loadedTask = loadedIntern?.currentTaskId;
        setTask(loadedTask);

        if (meetingsRes.data.success && meetingsRes.data.data.length > 0) {
          setMeeting(meetingsRes.data.data[0]);
        }

        // If previous conversation history exists in MongoDB, restore it
        if (historyRes.data?.messages && historyRes.data.messages.length > 0) {
          const restoredMessages = historyRes.data.messages.map((m) => ({
            sender: m.role === 'user' ? 'user' : 'assistant',
            text: m.content,
            timestamp: m.timestamp || new Date(),
          }));
          setMessages(restoredMessages);
        } else {
          // Initial greeting for a fresh session
          const welcomeText = `Hello ${loadedIntern?.fullName || 'there'}! I am your AI Training Assistant. Please note: I am an automated AI assistant designed to guide you through your technical curriculum, not a human HR employee.\n\nToday, I'm here to explain your assigned task: **${loadedTask?.taskTitle || 'Project Implementation'}**.\n\nFeel free to ask any question about the requirements, architecture, or technical concepts!`;
          const welcomeSpoken = `Hello ${loadedIntern?.fullName || 'there'}. I am your AI Training Assistant. Today, I am here to help you with your assigned task: ${loadedTask?.taskTitle || 'Project Implementation'}. Feel free to ask any question!`;

          setMessages([
            {
              sender: 'assistant',
              text: welcomeText,
              timestamp: new Date(),
            },
          ]);
          speakText(welcomeSpoken);
        }
      } catch (err) {
        console.error('Session load error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (targetInternId) {
      loadSessionData();
    }
  }, [targetInternId, activeSessionId]);

  // Text to Speech
  const speakText = (text) => {
    if (isMuted || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setMicStatus('Assistant speaking...');
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
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Edge.');
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
        console.warn('Recognition start error:', err);
      }
    }
  };

  const toggleMute = () => {
    if (!isMuted) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const repeatLastMessage = () => {
    const lastAssistantMsg = [...messages].reverse().find((m) => m.sender === 'assistant');
    if (lastAssistantMsg) {
      speakText(lastAssistantMsg.text);
    }
  };

  const pauseSpeech = () => {
    if ('speechSynthesis' in window) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    }
  };

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    // Add user message to state immediately
    const userMsg = {
      sender: 'user',
      text: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    try {
      const res = await api.post('/assistant/chat', {
        sessionId: activeSessionId,
        message: query,
        internId: targetInternId,
        meetingId: meeting?._id,
      });

      if (res.data.success) {
        const replyText = res.data.reply || res.data.data?.answerText;
        const spoken = res.data.data?.spokenText || replyText;

        const assistantMsg = {
          sender: 'assistant',
          text: replyText,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
        speakText(spoken);
      }
    } catch (err) {
      const errorDetail = err.response?.data?.message || err.message || 'Error communicating with AI service.';
      const errMsg = {
        sender: 'assistant',
        text: `⚠️ ${errorDetail}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    }
  };

  const handleFinishSession = async () => {
    if (!meeting?._id) {
      alert('No meeting record associated with this explanation session.');
      return;
    }

    try {
      const summaryNotes = messages
        .map((m) => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.sender.toUpperCase()}: ${m.text}`)
        .join('\n');

      const res = await api.post('/assistant/session-summary', {
        meetingId: meeting._id,
        notes: summaryNotes,
        summary: `AI task explanation completed for ${intern?.fullName}. Walked through ${task?.taskTitle} requirements and deliverables.`,
      });

      if (res.data.success) {
        setSessionSaved(true);
      }
    } catch (err) {
      alert('Failed to save session summary.');
    }
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Header & Disclosure */}
      <div className="card card-custom p-4 mb-4 border-0 shadow-sm">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1 rounded-pill">
                <i className="bi bi-robot me-1"></i> Interactive Voice Session
              </span>
              <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1 rounded-pill small">
                AI Assistant (Not Human HR)
              </span>
            </div>
            <h3 className="fw-bold mb-0">AI Task Explanation Assistant</h3>
            <p className="text-muted small mb-0">
              Assisting: <strong>{intern?.fullName}</strong> ({intern?.internId}) • Task: <strong>{task?.taskTitle}</strong>
            </p>
          </div>

          <div className="d-flex gap-2">
            <button
              onClick={handleFinishSession}
              className={`btn btn-sm rounded-pill px-3 fw-semibold ${sessionSaved ? 'btn-success' : 'btn-outline-primary'}`}
              disabled={sessionSaved}
            >
              <i className={`bi ${sessionSaved ? 'bi-check-all' : 'bi-check-circle'} me-1`}></i>
              {sessionSaved ? 'Session Summary Saved' : 'Complete & Save Summary'}
            </button>
            <Link to="/intern/portal" className="btn btn-outline-secondary btn-sm rounded-pill px-3">
              Return to Portal
            </Link>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Voice Visualizer & Audio Controls */}
        <div className="col-12 col-lg-5">
          <div className="card card-custom p-4 text-center h-100 d-flex flex-column justify-content-between">
            <div>
              <h5 className="fw-bold mb-1">Voice Interaction Hub</h5>
              <p className="text-muted small mb-4">Click microphone to speak or listen to answers</p>

              {/* Animated Visualizer */}
              <VoiceVisualizer
                isListening={isListening}
                isSpeaking={isSpeaking}
                micStatus={micStatus}
              />

              {/* Push to talk / Mic button */}
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
                  {isListening ? 'Stop Listening' : 'Speak to AI Assistant'}
                </button>
              </div>

              {/* Audio Controls */}
              <div className="d-flex justify-content-center gap-2 mb-4">
                <button
                  onClick={toggleMute}
                  className={`btn btn-sm rounded-pill px-3 ${isMuted ? 'btn-danger' : 'btn-light border'}`}
                  title={isMuted ? 'Unmute Speech' : 'Mute Speech'}
                >
                  <i className={`bi ${isMuted ? 'bi-volume-mute-fill' : 'bi-volume-up'} me-1`}></i>
                  {isMuted ? 'Muted' : 'Mute'}
                </button>

                <button
                  onClick={repeatLastMessage}
                  className="btn btn-sm btn-light border rounded-pill px-3"
                  title="Repeat Last Response"
                >
                  <i className="bi bi-arrow-repeat me-1"></i> Repeat
                </button>

                <button
                  onClick={pauseSpeech}
                  className="btn btn-sm btn-light border rounded-pill px-3"
                  title="Stop Speaking"
                >
                  <i className="bi bi-pause-fill me-1"></i> Pause
                </button>
              </div>
            </div>

            {/* Task Quick Reference card */}
            <div className="text-start p-3 bg-light rounded-3 border small">
              <strong className="text-dark d-block mb-1">Task Acceptance Deliverables:</strong>
              <ul className="text-secondary ps-3 mb-0">
                {task?.acceptanceCriteria?.slice(0, 3).map((crit, i) => (
                  <li key={i} className="mb-1 text-success">✓ {crit}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Chat Dialogue Fallback */}
        <div className="col-12 col-lg-7">
          <div className="card card-custom p-4 h-100 d-flex flex-column" style={{ minHeight: '520px' }}>
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-chat-dots-fill text-primary"></i> Real-time Conversation Transcript
            </h5>

            {/* Chat Messages Log */}
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
                      {msg.sender === 'user' ? 'You (Intern)' : 'AI Training Assistant'}
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

            {/* Text Input Fallback */}
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
                placeholder="Type your question or clarification here..."
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

export default VoiceAssistant;
