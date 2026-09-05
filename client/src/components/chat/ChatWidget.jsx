import React, { useState, useEffect, useRef } from 'react';
import { sendChatMessageApi } from '../../services/api.js';
import {
  MessageSquare,
  Bot,
  User,
  Send,
  X,
  Minus,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Zap,
  Activity,
  AlertTriangle,
  Layers,
  Database,
  Radio,
  ChevronDown,
  KeyRound,
  Settings,
  ShieldCheck,
  Cpu,
  Trash2
} from 'lucide-react';
import clsx from 'clsx';

export default function ChatWidget({
  activeFacilityId = 'nmdc-kirandul-cv101',
  currentUser
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [savedGeminiKey, setSavedGeminiKey] = useState('');
  const [keySavedToast, setKeySavedToast] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello ${currentUser?.displayName ? currentUser.displayName.split(' ')[0] : 'Engineer'}! 👷‍♂️ I am your **SmartConveyor AI Assistant**.\n\nI can answer **ANYTHING** you ask — from live 20Hz transducer telemetry and failure root causes to ISO 10816 standards, mechanical physics, coding, and general engineering calculations!`,
      sources: ['MERN Express API', 'Firebase Live IoT Stream'],
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load saved Gemini API Key from localStorage
  useEffect(() => {
    try {
      const storedKey = localStorage.getItem('smartconveyor_gemini_api_key') || '';
      setSavedGeminiKey(storedKey);
      setGeminiKeyInput(storedKey);
    } catch {
      // ignore
    }
  }, []);

  const handleSaveApiKey = (e) => {
    e?.preventDefault();
    const cleanKey = geminiKeyInput.trim();
    try {
      if (cleanKey) {
        localStorage.setItem('smartconveyor_gemini_api_key', cleanKey);
        setSavedGeminiKey(cleanKey);
      } else {
        localStorage.removeItem('smartconveyor_gemini_api_key');
        setSavedGeminiKey('');
      }
      setKeySavedToast(true);
      setTimeout(() => setKeySavedToast(false), 2500);
      setShowKeyModal(false);
    } catch {
      // ignore
    }
  };

  const handleClearApiKey = () => {
    try {
      localStorage.removeItem('smartconveyor_gemini_api_key');
      setSavedGeminiKey('');
      setGeminiKeyInput('');
      setKeySavedToast(true);
      setTimeout(() => setKeySavedToast(false), 2500);
      setShowKeyModal(false);
    } catch {
      // ignore
    }
  };

  const starterPrompts = [
    {
      icon: '📡',
      text: "What's the live vibration on Joint 5?",
      label: "Live Joint 5 Vibration"
    },
    {
      icon: '🚨',
      text: "Explain the current critical alert",
      label: "Critical Alert Analysis"
    },
    {
      icon: '📊',
      text: "What's our fleet health & RUL?",
      label: "Fleet Health & RUL"
    },
    {
      icon: '🔬',
      text: "Explain ISO 10816-3 vibration severity limits for mining conveyors",
      label: "ISO 10816 Standards"
    }
  ];

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen && !isMinimized && !showKeyModal) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, showKeyModal]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized && !showKeyModal) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, isMinimized, showKeyModal]);

  const handleSendMessage = async (customText = null) => {
    const textToSend = typeof customText === 'string' ? customText : inputQuery;
    if (!textToSend || !textToSend.trim() || isLoading) return;

    const userMsgId = `usr-${Date.now()}`;
    const userMsg = {
      id: userMsgId,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toISOString()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputQuery('');
    setIsLoading(true);

    try {
      // Prepare recent conversation history for multi-turn reasoning
      const historyContext = newMessages.slice(-8).map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const result = await sendChatMessageApi(
        textToSend.trim(),
        activeFacilityId,
        currentUser || { displayName: 'Shift Operator', role: 'OPERATOR' },
        null,
        savedGeminiKey,
        historyContext
      );

      const aiResponse = result.response || "I have received your query, but could not retrieve data.";
      const sources = result.sources || ['MongoDB (Collections)', 'Firebase Live Telemetry'];

      setMessages([
        ...newMessages,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: aiResponse,
          sources,
          timestamp: new Date().toISOString()
        }
      ]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `⚠️ **Connection Error**: Unable to reach backend assistant (${err.message}). Please ensure the Express server is active on port 5000.`,
          sources: ['Offline Error Handler'],
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'ai',
        text: `Chat session refreshed. How can I assist you with your conveyor belt diagnostics or technical queries today?`,
        sources: ['SmartConveyor AI Engine'],
        timestamp: new Date().toISOString()
      }
    ]);
  };

  // Helper to format basic markdown (bold, code blocks, bullet points)
  const formatMarkdown = (content) => {
    return content.split('\n').map((line, idx) => {
      // Bullet points
      if (line.trim().startsWith('• ') || line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const bulletText = line.trim().replace(/^[-*•]\s+/, '');
        return (
          <div key={idx} className="flex items-start gap-1.5 my-1 text-slate-200">
            <span className="text-cyan-400 font-bold">•</span>
            <span>{renderFormattedInline(bulletText)}</span>
          </div>
        );
      }
      // Section Headers
      if (line.startsWith('### ') || line.startsWith('## ') || line.startsWith('# ')) {
        const heading = line.replace(/^#+\s*/, '');
        return (
          <div key={idx} className="font-bold text-white text-xs mt-2 mb-1 tracking-tight flex items-center gap-1.5">
            {renderFormattedInline(heading)}
          </div>
        );
      }
      // Empty line
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      // Standard line
      return (
        <p key={idx} className="my-0.5 leading-relaxed">
          {renderFormattedInline(line)}
        </p>
      );
    });
  };

  const renderFormattedInline = (text) => {
    // Parse `code` and **bold**
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-[#0a0d14] text-cyan-300 border border-cyan-500/30 text-[11px] font-mono mx-0.5">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <>
      {/* 1. FLOATING CHAT BUTTON (Fixed bottom-right on all screens) */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="fixed bottom-6 right-6 z-50 p-3.5 bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold rounded-full shadow-2xl shadow-cyan-500/40 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center group border border-cyan-400/50 cursor-pointer"
          aria-label="Open SmartConveyor AI Assistant"
          title="Open AI Assistant (Grounded on Firebase Live Telemetry, MongoDB Data & Gemini AI)"
        >
          {/* Pulsing ring indicator */}
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#0a0d14] animate-pulse" />
          
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-slate-950" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 text-xs font-bold text-slate-950 pr-1">
              Ask Conveyor AI
            </span>
          </div>
        </button>
      )}

      {/* 2. SLIDE-IN CHAT PANEL */}
      {isOpen && (
        <div
          className={clsx(
            'fixed right-4 sm:right-6 bottom-4 sm:bottom-6 z-50 w-[calc(100vw-2rem)] sm:w-[460px] bg-[#0c101a]/95 backdrop-blur-2xl border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 animate-slide-in-right',
            isMinimized ? 'h-14' : 'h-[85vh] sm:h-[640px] max-h-[740px]'
          )}
        >
          {/* Panel Header */}
          <div className="bg-[#111726]/90 border-b border-[#1f293d] px-4 py-3 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative p-1.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl text-slate-950 shadow-md">
                <Bot className="w-5 h-5 text-slate-950" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-slate-950 animate-pulse" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white tracking-tight">
                    SmartConveyor AI Assistant
                  </h3>
                  {savedGeminiKey ? (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-950/80 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> Gemini AI
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 uppercase">
                      Domain Engine
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  Live IoT Grounded • {activeFacilityId.split('-')[1]?.toUpperCase() || 'CV-101'}
                </p>
              </div>
            </div>

            {/* Header controls */}
            <div className="flex items-center gap-1">
              {/* Gemini Key Settings Button */}
              <button
                onClick={() => setShowKeyModal(!showKeyModal)}
                className={clsx(
                  'p-1.5 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-mono',
                  savedGeminiKey
                    ? 'text-purple-300 bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/30'
                    : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
                )}
                title={savedGeminiKey ? "Gemini Key Configured (Click to edit)" : "Set Google Gemini API Key"}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span className="text-[10px] hidden sm:inline">
                  {savedGeminiKey ? 'Gemini Key' : 'API Key'}
                </span>
              </button>

              <button
                onClick={handleClearChat}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Clear Chat Session"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title={isMinimized ? "Expand Chat" : "Minimize Chat"}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                title="Close Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Key Saved Toast */}
          {keySavedToast && (
            <div className="bg-emerald-950/90 border-b border-emerald-500/40 text-emerald-200 text-xs px-4 py-1.5 flex items-center gap-2 animate-fade-in font-mono">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gemini API Key saved successfully!</span>
            </div>
          )}

          {/* 3. GEMINI API KEY MODAL / PANEL */}
          {showKeyModal && !isMinimized && (
            <div className="bg-[#090d16] border-b border-purple-500/30 p-4 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Google Gemini API Key Configuration</span>
                </div>
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Paste your <strong className="text-purple-300">Gemini Free API Key</strong> from{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 underline hover:text-cyan-300"
                >
                  Google AI Studio
                </a>{' '}
                to unlock full generative intelligence. The AI can answer ANY question with live telemetry grounding!
              </p>

              <form onSubmit={handleSaveApiKey} className="space-y-2.5">
                <input
                  type="password"
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-[#05080e] border border-purple-500/40 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-purple-400 focus:outline-none font-mono"
                />

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Stored securely in your local browser</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {savedGeminiKey && (
                      <button
                        type="button"
                        onClick={handleClearApiKey}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-mono text-rose-400 hover:bg-rose-950/40 border border-rose-500/30 transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Clear
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 rounded-lg text-[11px] font-bold bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white shadow-md shadow-purple-500/20 transition-all cursor-pointer"
                    >
                      Save Key
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Panel Body (If not minimized) */}
          {!isMinimized && (
            <>
              {/* Message Feed */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs font-sans">
                
                {messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  const isCopied = copiedId === msg.id;

                  return (
                    <div
                      key={msg.id}
                      className={clsx(
                        'flex gap-2.5 items-start animate-fade-in group',
                        isUser ? 'flex-row-reverse' : 'flex-row'
                      )}
                    >
                      {/* Avatar */}
                      <div className={clsx(
                        'w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs shadow-md',
                        isUser
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 font-black'
                      )}>
                        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>

                      {/* Message Bubble */}
                      <div className={clsx(
                        'max-w-[85%] rounded-2xl p-3 shadow-lg relative',
                        isUser
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-tr-none'
                          : 'bg-[#111726] border border-[#1f293d] text-slate-200 rounded-tl-none'
                      )}>
                        {/* Message content */}
                        <div className="text-xs leading-relaxed">
                          {formatMarkdown(msg.text)}
                        </div>

                        {/* Data sources pill (for AI answers) */}
                        {!isUser && msg.sources && msg.sources.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-[#1f293d] flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-slate-400">
                            <span className="text-cyan-400 font-bold">Sources:</span>
                            {msg.sources.map((src, idx) => (
                              <span
                                key={idx}
                                className={clsx(
                                  'px-1.5 py-0.5 rounded text-[9px] border',
                                  src.includes('Gemini')
                                    ? 'bg-purple-950/70 text-purple-300 border-purple-500/40 font-semibold'
                                    : src.includes('Firebase')
                                    ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                                    : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                                )}
                              >
                                {src.includes('Gemini') ? '✨ Google Gemini' : src.includes('Firebase') ? '🔥 Live Firebase' : '🍃 MongoDB'}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Copy button & Timestamp */}
                        <div className="flex items-center justify-between gap-2 mt-1.5 text-[10px] font-mono text-slate-400">
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>

                          {!isUser && (
                            <button
                              onClick={() => handleCopy(msg.id, msg.text)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-cyan-300 rounded hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
                              title="Copy Answer"
                            >
                              {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{isCopied ? 'Copied' : 'Copy'}</span>
                            </button>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}

                {/* Loading / Thinking Indicator */}
                {isLoading && (
                  <div className="flex gap-2.5 items-start animate-fade-in">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                      <Bot className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="bg-[#111726] border border-cyan-500/30 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-300 space-y-1.5 shadow-lg max-w-[85%]">
                      <div className="flex items-center gap-2 font-mono text-cyan-400 text-[11px] font-bold">
                        <Sparkles className="w-3.5 h-3.5 animate-bounce" />
                        <span>{savedGeminiKey ? 'Gemini 1.5 Flash Reasoning...' : 'Synthesizing Live Telemetry & Records...'}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        Analyzing sub-second transducer readings, joint RUL curves, and plant knowledge.
                      </p>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Starter Prompts Strip (Visible when few messages) */}
              {messages.length <= 2 && !isLoading && (
                <div className="px-4 py-2 border-t border-[#1f293d] bg-[#090d14]/70">
                  <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      Suggested Queries (Ask Anything):
                    </span>
                    {!savedGeminiKey && (
                      <button
                        onClick={() => setShowKeyModal(true)}
                        className="text-[9px] text-purple-400 hover:underline cursor-pointer"
                      >
                        + Add Gemini Key
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {starterPrompts.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(p.text)}
                        className="p-2 rounded-xl bg-[#111726] hover:bg-slate-800 border border-[#1f293d] hover:border-cyan-500/50 text-left text-[11px] text-slate-300 hover:text-white transition-all duration-200 flex items-center gap-1.5 group shadow-sm cursor-pointer"
                      >
                        <span className="text-sm shrink-0">{p.icon}</span>
                        <span className="font-medium truncate group-hover:text-cyan-300">
                          {p.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Box */}
              <div className="p-3 bg-[#111726]/90 border-t border-[#1f293d] shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-end gap-2"
                >
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      rows={1}
                      value={inputQuery}
                      onChange={(e) => setInputQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={savedGeminiKey ? "Ask Gemini anything (conveyor, physics, math, code...)" : "Ask about live vibration, joint RUL, alerts, or anything..."}
                      className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-none font-mono max-h-24"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !inputQuery.trim()}
                    className={clsx(
                      'p-2.5 rounded-xl font-bold text-xs flex items-center justify-center transition-all shadow-md',
                      inputQuery.trim() && !isLoading
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/25 cursor-pointer scale-100'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    )}
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                <div className="flex items-center justify-between mt-2 px-1 text-[9px] font-mono text-slate-500">
                  <span>Press <kbd className="text-slate-400">Enter</kbd> to send</span>
                  <span className="flex items-center gap-1 text-cyan-400/80">
                    {savedGeminiKey ? '✨ Gemini Generative AI Active' : '⚡ Grounded Domain Engine Active'}
                  </span>
                </div>
              </div>

            </>
          )}

        </div>
      )}
    </>
  );
}
