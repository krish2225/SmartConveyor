import React, { useState, useEffect, useRef } from 'react';
import { sendChatMessageApi } from '../../services/api.js';
import { Button } from '../ui/button.jsx';
import { Badge } from '../ui/badge.jsx';
import { Card } from '../ui/card.jsx';
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
  Radio,
  Maximize2,
  Minimize2,
  Code
} from 'lucide-react';
import { cn } from '../../lib/utils.js';

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
  const [isExpanded, setIsExpanded] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello ${currentUser?.displayName ? currentUser.displayName.split(' ')[0] : 'Engineer'}! 👷‍♂️ I am your **SmartConveyor AI Operations Assistant**.\n\nI am grounded directly with your live conveyor sensor telemetry, 3D Digital Twin, line-scan vision defect models, and operational database. Ask me anything — from real-time vibration and thermal metrics to splice RUL, alarms, ISO 10816 standards, and engineering calculations!`,
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
      icon: '🚨',
      text: "Analyze current alerts and explain root cause",
      label: "Analyze current alerts"
    },
    {
      icon: '📊',
      text: "Explain machine health and lowest RUL joint",
      label: "Explain machine health"
    },
    {
      icon: '🔍',
      text: "Check conveyor joints status and splice wear",
      label: "Check conveyor joints"
    },
    {
      icon: '🛠️',
      text: "Recommend maintenance action plan for Joint 5",
      label: "Recommend maintenance"
    },
    {
      icon: '📡',
      text: "What's the live vibration and temperature on Joint 5 right now?",
      label: "Live Joint 5 State"
    },
    {
      icon: '🔬',
      text: "Explain ISO 10816-3 vibration severity limits for mining belt drives",
      label: "ISO 10816 Standards"
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
      setTimeout(() => inputRef.current?.focus(), 150);
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

    const blocks = content.split(/(```[\s\S]*?```)/g);

    return blocks.map((block, bIdx) => {
      if (block.startsWith('```') && block.endsWith('```')) {
        const lines = block.slice(3, -3).trim().split('\n');
        const lang = lines[0].trim() || 'code';
        const codeText = (lines.length > 1 ? lines.slice(1).join('\n') : lines[0]).trim();

        return (
          <div key={bIdx} className="my-2 rounded-md bg-surface-sunken border border-border overflow-hidden font-mono text-[11px]">
            <div className="bg-surface px-3 py-1 border-b border-border flex items-center justify-between text-muted-foreground text-[10px]">
              <span className="flex items-center gap-1 font-bold uppercase text-primary">
                <Code className="w-3 h-3 text-primary" />
                {lang}
              </span>
              <button
                onClick={() => handleCopy(`code-${bIdx}`, codeText)}
                className="hover:text-primary text-muted-foreground flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedId === `code-${bIdx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId === `code-${bIdx}` ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="p-2.5 overflow-x-auto text-cyan-200 leading-relaxed">
              <code>{codeText}</code>
            </pre>
          </div>
        );
      }

      const lines = block.split('\n');
      const renderedLines = [];
      let tableBuffer = [];
      let inTable = false;

      const flushTable = () => {
        if (tableBuffer.length >= 2) {
          const headerRow = tableBuffer[0].split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1).map(c => c.trim());
          const bodyRows = tableBuffer.slice(2).map(row => row.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1).map(c => c.trim()));

          renderedLines.push(
            <div key={`tbl-${renderedLines.length}`} className="my-2 overflow-x-auto rounded-md border border-border bg-surface-sunken">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface border-b border-border text-primary font-mono text-[10px]">
                    {headerRow.map((h, hi) => (
                      <th key={hi} className="px-2.5 py-1.5 font-bold">{renderFormattedInline(h)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-foreground font-mono text-[11px]">
                  {bodyRows.map((row, ri) => (
                    <tr key={ri} className="hover:bg-muted/30 transition-colors">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-2.5 py-1">{renderFormattedInline(cell)}</td>
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
            <div key={`${bIdx}-${lIdx}`} className="flex items-start gap-1.5 my-0.5 text-foreground">
              <span className="text-primary font-bold leading-tight">•</span>
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
            <div key={`${bIdx}-${lIdx}`} className="flex items-start gap-1.5 my-0.5 text-foreground">
              <span className="text-primary font-bold font-mono text-[11px]">{num}</span>
              <span className="flex-1">{renderFormattedInline(numText)}</span>
            </div>
          );
          continue;
        }

        // Section Headers
        if (line.startsWith('### ') || line.startsWith('## ') || line.startsWith('# ')) {
          const heading = line.replace(/^#+\s*/, '');
          renderedLines.push(
            <div key={`${bIdx}-${lIdx}`} className="font-bold text-foreground text-xs mt-2.5 mb-1 tracking-tight flex items-center gap-1.5 border-b border-border pb-0.5">
              {renderFormattedInline(heading)}
            </div>
          );
          continue;
        }

        // Blockquotes
        if (line.startsWith('> ')) {
          const quoteText = line.slice(2);
          renderedLines.push(
            <div key={`${bIdx}-${lIdx}`} className="border-l-2 border-primary pl-2.5 my-1 text-cyan-200 italic text-[11px] bg-primary/10 py-0.5 rounded-r">
              {renderFormattedInline(quoteText)}
            </div>
          );
          continue;
        }

        // Empty line
        if (!line.trim()) {
          renderedLines.push(<div key={`${bIdx}-${lIdx}`} className="h-1" />);
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
          <code key={i} className="px-1 py-0.2 rounded bg-surface-sunken text-cyan-300 border border-primary/30 text-[10px] font-mono mx-0.5">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-foreground font-bold">{part.slice(2, -2)}</strong>;
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
          className="fixed bottom-5 right-5 z-50 p-3 bg-primary text-primary-foreground font-extrabold rounded-full shadow-2xl shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center group border border-cyan-300/50 cursor-pointer"
          aria-label="Open SmartConveyor AI Assistant"
          title="Open SmartConveyor AI Assistant"
        >
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-background animate-pulse" />

          <div className="flex items-center gap-1.5">
            <Bot className="w-5 h-5 text-primary-foreground" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 text-xs font-bold pr-1">
              Ask Conveyor AI
            </span>
          </div>
        </button>
      )}

      {/* 2. SLIDE-IN / EXPANDABLE CHAT PANEL */}
      {isOpen && (
        <div
          className={cn(
            'fixed z-50 bg-surface/95 backdrop-blur-xl border border-border rounded-md shadow-2xl flex flex-col overflow-hidden transition-all duration-200 animate-slide-in-right',
            isMinimized
              ? 'h-12 w-[calc(100vw-2rem)] sm:w-[400px] right-4 bottom-4'
              : isExpanded
                ? 'w-[calc(100vw-2rem)] sm:w-[840px] md:w-[940px] h-[90vh] sm:h-[800px] max-h-[90vh] right-2 sm:right-5 bottom-2 sm:bottom-5'
                : 'w-[calc(100vw-2rem)] sm:w-[460px] h-[82vh] sm:h-[600px] max-h-[700px] right-4 sm:right-5 bottom-4 sm:bottom-5'
          )}
        >
          {/* Panel Header */}
          <div className="bg-surface-elevated border-b border-border px-3.5 py-2.5 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative p-1.5 bg-primary/20 border border-primary/40 rounded text-primary">
                <Bot className="w-4 h-4 text-primary" />
                <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full border border-surface animate-pulse" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-foreground tracking-tight font-mono">
                    SMARTCONVEYOR AI
                  </h3>
                  <Badge variant="cyan" size="sm" className="font-mono text-[9px] py-0 px-1">
                    AI OPERATIONS ASSISTANT
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground font-mono flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  Live Grounded • {activeFacilityId.split('-')[1]?.toUpperCase() || 'CV-101'}
                </p>
              </div>
            </div>

            {/* Header controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-muted-foreground hover:text-foreground"
                title={isExpanded ? "Collapse to Standard Window" : "Expand to Large Workspace"}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </Button>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleClearChat}
                className="text-muted-foreground hover:text-foreground"
                title="Clear Chat Session"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-muted-foreground hover:text-foreground"
                title={isMinimized ? "Expand Chat" : "Minimize Chat"}
              >
                <Minus className="w-3.5 h-3.5" />
              </Button>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-red-400"
                title="Close Chat"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Panel Body */}
          {!isMinimized && (
            <>
              {/* Message Feed */}
              <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs font-sans">
                {messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  const isCopied = copiedId === msg.id;

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex gap-2.5 items-start animate-fade-in group',
                        isUser ? 'flex-row-reverse' : 'flex-row'
                      )}
                    >
                      {/* Avatar */}
                      <div className={cn(
                        'w-6 h-6 rounded flex items-center justify-center shrink-0 text-xs shadow-sm',
                        isUser
                          ? 'bg-sky-600 text-white font-bold'
                          : 'bg-primary/20 border border-primary/40 text-primary font-bold'
                      )}>
                        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      </div>

                      {/* Message Bubble */}
                      <div className={cn(
                        'rounded-md p-3 shadow-md relative',
                        isExpanded ? 'max-w-[88%]' : 'max-w-[84%]',
                        isUser
                          ? 'bg-sky-700 text-white rounded-tr-none'
                          : 'bg-surface-sunken border border-border text-foreground rounded-tl-none'
                      )}>
                        {/* Message content */}
                        <div className="text-xs leading-relaxed">
                          {formatMarkdown(msg.text)}
                        </div>

                        {/* Grounding badge */}
                        {!isUser && msg.sources && msg.sources.length > 0 && (
                          <div className="mt-2 pt-1.5 border-t border-border flex flex-wrap items-center gap-1 text-[9px] font-mono text-muted-foreground">
                            {msg.sources.map((src, idx) => (
                              <Badge
                                key={idx}
                                variant={src.includes('Gemini') ? 'cyan' : 'default'}
                                size="sm"
                                className="px-1 py-0 text-[8px]"
                              >
                                {src.includes('Gemini') ? 'Gemini AI' : 'Live Telemetry'}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Timestamp & Copy */}
                        <div className="flex items-center justify-between gap-2 mt-1 text-[9px] font-mono text-muted-foreground">
                          <span className="tabular-nums">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>

                          {!isUser && (
                            <button
                              onClick={() => handleCopy(msg.id, msg.text)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-muted-foreground hover:text-primary flex items-center gap-1 cursor-pointer"
                              title="Copy Answer"
                            >
                              {isCopied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                              <span>{isCopied ? 'Copied' : 'Copy'}</span>
                            </button>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}

                {/* Loading Indicator */}
                {isLoading && (
                  <div className="flex gap-2.5 items-start animate-fade-in">
                    <div className="w-6 h-6 rounded bg-primary/20 border border-primary/40 text-primary flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 animate-spin" />
                    </div>
                    <div className="bg-surface-sunken border border-primary/30 rounded-md rounded-tl-none p-3 text-xs text-muted-foreground space-y-1 shadow-sm max-w-[85%]">
                      <div className="flex items-center gap-1.5 font-mono text-primary text-[10px] font-bold">
                        <Sparkles className="w-3 h-3 animate-bounce" />
                        <span>AI Assistant Reasoning...</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-tight font-mono">
                        Analyzing 20Hz sensor streams, splice degradation curves, and plant models.
                      </p>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Starter Prompts Strip */}
              {messages.length <= 2 && !isLoading && (
                <div className="px-3 py-2 border-t border-border bg-surface-elevated/60">
                  <div className="text-[9px] font-mono text-muted-foreground uppercase font-bold mb-1 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-primary" />
                    <span>Suggested Operations Actions:</span>
                  </div>
                  <div className={cn('grid gap-1', isExpanded ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2')}>
                    {starterPrompts.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(p.text)}
                        className="p-1.5 rounded bg-surface-sunken hover:bg-muted border border-border hover:border-primary/40 text-left text-[10px] text-slate-300 hover:text-foreground transition-all flex items-center gap-1.5 group cursor-pointer"
                      >
                        <span className="text-xs shrink-0">{p.icon}</span>
                        <span className="font-medium truncate group-hover:text-primary">
                          {p.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Box */}
              <div className="p-3 bg-surface-elevated border-t border-border shrink-0">
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
                      placeholder="Ask SmartConveyor AI about splice health, telemetry, RUL, or alarms..."
                      className="w-full bg-surface-sunken border border-border rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none font-mono max-h-28"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="default"
                    size="sm"
                    disabled={isLoading || !inputQuery.trim()}
                    className="h-8 w-8 p-0 font-bold"
                    aria-label="Send message"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </form>

                <div className="flex items-center justify-between mt-1.5 px-0.5 text-[9px] font-mono text-muted-foreground">
                  <span>Press <kbd className="text-slate-400 font-semibold">Enter</kbd> to send</span>
                  <span className="flex items-center gap-1 text-primary">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    20Hz Telemetry Grounded
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
