import React, { useState, useEffect, useRef } from 'react';
import { sendChatMessageApi } from '../../services/api.js';
import {
  Bot,
  User,
  Send,
  X,
  Minus,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Activity,
  Radio,
  Zap,
  Cpu,
  Maximize2,
  Minimize2,
  Code,
  Table
} from 'lucide-react';
import clsx from 'clsx';

export default function ChatWidget({
  activeFacilityId = 'nmdc-kirandul-cv101',
  currentUser,
  telemetry = null,
  joints = [],
  alerts = [],
  emergencyStatus = null,
  reliabilityScores = null
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // Short vs Large Screen toggle

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello ${currentUser?.displayName ? currentUser.displayName.split(' ')[0] : 'Engineer'}! 👷‍♂️ I am your **SmartConveyor Real-Time AI Copilot**.\n\nI am grounded directly with your live conveyor sensor telemetry, 3D Digital Twin, line-scan vision defect models, and operational database. Ask me anything — from real-time vibration and thermal metrics to splice RUL, alarms, ISO 10816 standards, and engineering calculations!`,
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const starterPrompts = [
    {
      icon: '📡',
      text: "What's the live vibration and temperature on Joint 5 right now?",
      label: "Live Joint 5 State"
    },
    {
      icon: '🚨',
      text: "Explain the current critical alert and recommended action plan",
      label: "Critical Alert Analysis"
    },
    {
      icon: '📊',
      text: "What's our plant fleet splice health and lowest RUL?",
      label: "Fleet Health & RUL"
    },
    {
      icon: '🧊',
      text: "Explain how the 3D Digital Twin and Historical Playback work",
      label: "Digital Twin & Replay"
    },
    {
      icon: '🔬',
      text: "Explain ISO 10816-3 vibration severity limits for mining belt drives",
      label: "ISO 10816 Standards"
    },
    {
      icon: '📷',
      text: "How does the Vision Monitoring system classify belt surface defects?",
      label: "Vision AI Defect Model"
    }
  ];

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isExpanded]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, isMinimized]);

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
      // Package live conveyor snapshot for real-time grounding
      const liveContext = {
        telemetry: telemetry || {},
        sensors: telemetry?.sensors || {},
        activeJointId: telemetry?.activeJointId || 'Joint-05',
        isDumping: telemetry?.isDumping || false,
        joints: Array.isArray(joints) ? joints.slice(0, 10) : [],
        alerts: Array.isArray(alerts) ? alerts.filter(a => a.status === 'ACTIVE').slice(0, 5) : [],
        emergencyStatus: emergencyStatus || null,
        reliabilityScores: reliabilityScores || null
      };

      // Prepare recent conversation history for multi-turn reasoning
      const historyContext = newMessages.slice(-8).map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const result = await sendChatMessageApi(
        textToSend.trim(),
        activeFacilityId,
        currentUser || { displayName: 'Shift Operator', role: 'OPERATOR' },
        liveContext,
        historyContext
      );

      const aiResponse = result.response || "I have received your query, but could not retrieve data.";
      const cleanSources = (result.sources || []).filter(
        s => !s.toLowerCase().includes('mongodb') && !s.toLowerCase().includes('firebase')
      );

      setMessages([
        ...newMessages,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: aiResponse,
          sources: cleanSources,
          timestamp: new Date().toISOString()
        }
      ]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `⚠️ **Connection Error**: Unable to reach backend assistant (${err.message}). Please ensure the server is active.`,
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
        text: `Chat session refreshed. How can I assist you with conveyor belt diagnostics, telemetry, or technical calculations?`,
        timestamp: new Date().toISOString()
      }
    ]);
  };

  // Helper to format clean markdown (tables, code blocks, bold, headers, lists)
  const formatMarkdown = (content) => {
    if (!content) return null;

    // Check for fenced code blocks
    const blocks = content.split(/(```[\s\S]*?```)/g);

    return blocks.map((block, bIdx) => {
      if (block.startsWith('```') && block.endsWith('```')) {
        const lines = block.slice(3, -3).trim().split('\n');
        const lang = lines[0].trim() || 'code';
        const codeText = (lines.length > 1 ? lines.slice(1).join('\n') : lines[0]).trim();

        return (
          <div key={bIdx} className="my-2.5 rounded-xl bg-[#070a10] border border-[#1f293d] overflow-hidden shadow-inner font-mono text-[11px]">
            <div className="bg-[#0e1320] px-3 py-1.5 border-b border-[#1f293d] flex items-center justify-between text-slate-400 text-[10px]">
              <span className="flex items-center gap-1 font-bold uppercase text-cyan-400">
                <Code className="w-3 h-3 text-cyan-400" />
                {lang}
              </span>
              <button
                onClick={() => handleCopy(`code-${bIdx}`, codeText)}
                className="hover:text-cyan-300 text-slate-400 flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedId === `code-${bIdx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId === `code-${bIdx}` ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="p-3 overflow-x-auto text-cyan-200 leading-relaxed">
              <code>{codeText}</code>
            </pre>
          </div>
        );
      }

      // Check for Table formatting
      const lines = block.split('\n');
      const renderedLines = [];
      let tableBuffer = [];
      let inTable = false;

      const flushTable = () => {
        if (tableBuffer.length >= 2) {
          const headerRow = tableBuffer[0].split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1).map(c => c.trim());
          const bodyRows = tableBuffer.slice(2).map(row => row.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1).map(c => c.trim()));

          renderedLines.push(
            <div key={`tbl-${renderedLines.length}`} className="my-2.5 overflow-x-auto rounded-xl border border-[#1f293d] bg-[#090d16]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#111726] border-b border-[#1f293d] text-cyan-400 font-mono text-[11px]">
                    {headerRow.map((h, hi) => (
                      <th key={hi} className="px-3 py-2 font-bold">{renderFormattedInline(h)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f293d]/60 text-slate-300">
                  {bodyRows.map((row, ri) => (
                    <tr key={ri} className="hover:bg-[#111726]/50 transition-colors">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 py-1.5">{renderFormattedInline(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        tableBuffer = [];
        inTable = false;
      };

      for (let lIdx = 0; lIdx < lines.length; lIdx++) {
        const line = lines[lIdx];
        const isTableLine = line.trim().startsWith('|') && line.trim().endsWith('|');

        if (isTableLine) {
          inTable = true;
          tableBuffer.push(line.trim());
          continue;
        } else if (inTable) {
          flushTable();
        }

        // Bullet points
        if (line.trim().startsWith('• ') || line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          const bulletText = line.trim().replace(/^[-*•]\s+/, '');
          renderedLines.push(
            <div key={`${bIdx}-${lIdx}`} className="flex items-start gap-1.5 my-1 text-slate-200">
              <span className="text-cyan-400 font-bold leading-tight">•</span>
              <span className="flex-1">{renderFormattedInline(bulletText)}</span>
            </div>
          );
          continue;
        }

        // Numbered items
        if (/^\d+\.\s+/.test(line.trim())) {
          const num = line.trim().match(/^\d+\./)[0];
          const numText = line.trim().replace(/^\d+\.\s+/, '');
          renderedLines.push(
            <div key={`${bIdx}-${lIdx}`} className="flex items-start gap-1.5 my-1 text-slate-200">
              <span className="text-cyan-400 font-bold font-mono text-[11px]">{num}</span>
              <span className="flex-1">{renderFormattedInline(numText)}</span>
            </div>
          );
          continue;
        }

        // Section Headers
        if (line.startsWith('### ') || line.startsWith('## ') || line.startsWith('# ')) {
          const heading = line.replace(/^#+\s*/, '');
          renderedLines.push(
            <div key={`${bIdx}-${lIdx}`} className="font-bold text-white text-xs mt-3 mb-1 tracking-tight flex items-center gap-1.5 border-b border-[#1f293d] pb-0.5">
              {renderFormattedInline(heading)}
            </div>
          );
          continue;
        }

        // Blockquotes
        if (line.startsWith('> ')) {
          const quoteText = line.slice(2);
          renderedLines.push(
            <div key={`${bIdx}-${lIdx}`} className="border-l-2 border-cyan-500 pl-3 my-1.5 text-cyan-200/90 italic text-[11px] bg-cyan-950/20 py-1 rounded-r-lg">
              {renderFormattedInline(quoteText)}
            </div>
          );
          continue;
        }

        // Empty line
        if (!line.trim()) {
          renderedLines.push(<div key={`${bIdx}-${lIdx}`} className="h-1.5" />);
          continue;
        }

        // Standard line
        renderedLines.push(
          <p key={`${bIdx}-${lIdx}`} className="my-0.5 leading-relaxed">
            {renderFormattedInline(line)}
          </p>
        );
      }

      if (inTable) flushTable();

      return <React.Fragment key={bIdx}>{renderedLines}</React.Fragment>;
    });
  };

  const renderFormattedInline = (text) => {
    if (!text) return '';
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
      {/* 1. FLOATING CHAT BUTTON (Fixed bottom-right) */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="fixed bottom-6 right-6 z-50 p-3.5 bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold rounded-full shadow-2xl shadow-cyan-500/40 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center group border border-cyan-400/50 cursor-pointer"
          aria-label="Open SmartConveyor AI Assistant"
          title="Open Real-Time Conveyor AI Assistant"
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

      {/* 2. SLIDE-IN / EXPANDABLE CHAT PANEL */}
      {isOpen && (
        <div
          className={clsx(
            'fixed z-50 bg-[#0c101a]/95 backdrop-blur-2xl border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 animate-slide-in-right',
            isMinimized
              ? 'h-14 w-[calc(100vw-2rem)] sm:w-[420px] right-4 sm:right-6 bottom-4 sm:bottom-6'
              : isExpanded
                ? 'w-[calc(100vw-2rem)] sm:w-[860px] md:w-[980px] h-[92vh] sm:h-[840px] max-h-[92vh] right-2 sm:right-6 bottom-2 sm:bottom-6'
                : 'w-[calc(100vw-2rem)] sm:w-[480px] h-[85vh] sm:h-[640px] max-h-[740px] right-4 sm:right-6 bottom-4 sm:bottom-6'
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
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 font-semibold">
                    <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                    {isExpanded ? 'Expanded Workspace' : 'Real-Time Copilot'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  Live Grounded • {activeFacilityId.split('-')[1]?.toUpperCase() || 'CV-101'}
                </p>
              </div>
            </div>

            {/* Header controls (Size toggle, Clear, Minimize, Close) */}
            <div className="flex items-center gap-1">
              
              {/* Screen Size Toggle (Short vs Large Workspace) */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-slate-400 hover:text-cyan-300 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title={isExpanded ? "Collapse to Standard Window" : "Expand to Large Workspace"}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleClearChat}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Clear Chat Session"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title={isMinimized ? "Expand Chat" : "Minimize Chat"}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

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
                        'rounded-2xl p-3.5 shadow-lg relative',
                        isExpanded ? 'max-w-[90%]' : 'max-w-[85%]',
                        isUser
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-tr-none'
                          : 'bg-[#111726] border border-[#1f293d] text-slate-200 rounded-tl-none'
                      )}>
                        {/* Message content */}
                        <div className="text-xs leading-relaxed">
                          {formatMarkdown(msg.text)}
                        </div>

                        {/* Telemetry Grounding badge if AI used live stream */}
                        {!isUser && msg.sources && msg.sources.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-[#1f293d] flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-slate-400">
                            {msg.sources.map((src, idx) => (
                              <span
                                key={idx}
                                className={clsx(
                                  'px-1.5 py-0.5 rounded text-[9px] border font-medium flex items-center gap-1',
                                  src.includes('Gemini')
                                    ? 'bg-purple-950/70 text-purple-300 border-purple-500/40'
                                    : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
                                )}
                              >
                                {src.includes('Gemini') ? (
                                  <>
                                    <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                                    <span>Gemini AI</span>
                                  </>
                                ) : (
                                  <>
                                    <Radio className="w-2.5 h-2.5 text-cyan-400" />
                                    <span>Real-Time Telemetry</span>
                                  </>
                                )}
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

                {/* Loading / Reasoning Indicator */}
                {isLoading && (
                  <div className="flex gap-2.5 items-start animate-fade-in">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                      <Bot className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="bg-[#111726] border border-cyan-500/30 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-300 space-y-1.5 shadow-lg max-w-[85%]">
                      <div className="flex items-center gap-2 font-mono text-cyan-400 text-[11px] font-bold">
                        <Sparkles className="w-3.5 h-3.5 animate-bounce" />
                        <span>Real-Time AI Copilot Reasoning...</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        Formulating complete engineering analysis with 20Hz sensor metrics, splice RUL curves, and plant models.
                      </p>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Starter Prompts Strip (Visible when few messages) */}
              {messages.length <= 2 && !isLoading && (
                <div className="px-4 py-2.5 border-t border-[#1f293d] bg-[#090d14]/70">
                  <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>Suggested Engineering Queries:</span>
                  </div>
                  <div className={clsx('grid gap-1.5', isExpanded ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2')}>
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
              <div className="p-3.5 bg-[#111726]/90 border-t border-[#1f293d] shrink-0">
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
                      rows={isExpanded ? 2 : 1}
                      value={inputQuery}
                      onChange={(e) => setInputQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask anything about conveyor diagnostics, 3D Digital Twin, vision, RUL, or engineering..."
                      className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-none font-mono max-h-32"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !inputQuery.trim()}
                    className={clsx(
                      'p-2.5 rounded-xl font-bold text-xs flex items-center justify-center transition-all shadow-md cursor-pointer',
                      inputQuery.trim() && !isLoading
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/25 scale-100'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    )}
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                <div className="flex items-center justify-between mt-2 px-1 text-[9px] font-mono text-slate-500">
                  <span>Press <kbd className="text-slate-400">Enter</kbd> to send</span>
                  <span className="flex items-center gap-1 text-cyan-400/90">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live 20Hz Telemetry Grounded
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
