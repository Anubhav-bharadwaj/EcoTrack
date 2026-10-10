// ═══════════════════════════════════════════════════
// ECOTRACK AI — AI CHATBOT PANEL COMPONENT
// ═══════════════════════════════════════════════════

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { sendChatMessage } from '../utils/agentBot';
import { useApp } from '../store/AppContext';

const QUICK_REPLIES = [
  '💡 How to reduce my footprint?',
  '📊 Analyze my week',
  '🏆 Give me a challenge',
];

/**
 * Simple markdown-ish renderer for AI responses.
 * Handles **bold**, *italic*, - lists, and line breaks.
 */
function renderMarkdown(text) {
  if (!text) return '';
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^[-•]\s+(.+)/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n/g, '<br />');
  return html;
}

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localMessages, setLocalMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { state, dispatch } = useApp();

  // Sync with context chat history on mount
  useEffect(() => {
    if (state.chatHistory && state.chatHistory.length > 0) {
      setLocalMessages(state.chatHistory);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages, isLoading]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = async (text = message) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg = {
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...localMessages, userMsg];
    setLocalMessages(updatedMessages);
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: userMsg });
    setMessage('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(
        trimmed,
        updatedMessages,
        state.activities
      );

      const aiMsg = {
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };

      setLocalMessages((prev) => [...prev, aiMsg]);
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: aiMsg });
    } catch (error) {
      const errorMsg = {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again! 🌐',
        timestamp: new Date().toISOString(),
      };
      setLocalMessages((prev) => [...prev, errorMsg]);
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickReply = (reply) => {
    // Strip emoji prefix for the actual message
    const cleanText = reply.replace(/^[^\w]+/, '').trim();
    handleSend(cleanText);
  };

  return (
    <>
      {/* ─── Floating Button ─── */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-20 lg:bottom-6 right-6 z-50 w-14 h-14 rounded-2xl 
          gradient-green text-white shadow-lg shadow-primary-500/30
          hover:shadow-xl hover:shadow-primary-500/40 hover:scale-105
          active:scale-95 transition-all duration-300
          flex items-center justify-center
          ${isOpen ? 'opacity-0 pointer-events-none scale-75' : 'opacity-100'}
        `}
        aria-label="Open AI Chat"
      >
        <MessageCircle className="w-6 h-6" />
        {/* Pulsing green dot */}
        <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-green-400 animate-pulse-green" />
      </button>

      {/* ─── Chat Panel ─── */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] flex flex-col
          bg-white dark:bg-dark-bg
          border-l border-primary-100 dark:border-dark-border
          shadow-2xl transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-primary-100 dark:border-dark-border bg-primary-50/50 dark:bg-dark-card/50">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl gradient-green">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold font-display text-gray-800 dark:text-white">
              EcoBot
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Carbon Coach — Always here to help
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-xl hover:bg-primary-100 dark:hover:bg-dark-surface transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Welcome message if empty */}
          {localMessages.length === 0 && (
            <div className="text-center py-8 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl gradient-green mx-auto mb-4 flex items-center justify-center shadow-lg shadow-primary-500/20">
                <span className="text-2xl">🤖</span>
              </div>
              <h4 className="text-lg font-bold font-display text-gray-800 dark:text-white mb-2">
                Hi! I'm EcoBot
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                Your personal carbon footprint coach. Ask me anything about reducing your environmental impact!
              </p>
            </div>
          )}

          {/* Chat messages */}
          {localMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed
                  ${
                    msg.role === 'user'
                      ? 'gradient-green text-white rounded-br-md'
                      : 'bg-gray-100 dark:bg-dark-card text-gray-700 dark:text-gray-200 rounded-bl-md border border-gray-200 dark:border-dark-border'
                  }
                `}
              >
                {msg.role === 'assistant' ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                    className="prose-sm"
                  />
                ) : (
                  msg.content
                )}
                <div
                  className={`text-[10px] mt-1.5 ${
                    msg.role === 'user'
                      ? 'text-white/60 text-right'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))}

          {/* Loading animation */}
          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-gray-100 dark:bg-dark-card rounded-2xl rounded-bl-md px-5 py-4 border border-gray-200 dark:border-dark-border">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick replies */}
        {localMessages.length === 0 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {QUICK_REPLIES.map((reply) => (
              <button
                key={reply}
                onClick={() => handleQuickReply(reply)}
                className="px-3 py-1.5 text-xs font-medium rounded-full
                  bg-primary-50 dark:bg-dark-surface 
                  text-primary-700 dark:text-primary-400
                  border border-primary-200 dark:border-dark-border
                  hover:bg-primary-100 dark:hover:bg-dark-card
                  hover:scale-105 active:scale-95
                  transition-all duration-200"
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-3 border-t border-primary-100 dark:border-dark-border bg-white dark:bg-dark-bg">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask EcoBot anything..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 text-sm rounded-xl
                bg-primary-50 dark:bg-dark-surface 
                border border-primary-100 dark:border-dark-border
                text-gray-700 dark:text-gray-200
                placeholder-gray-400 dark:placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-primary-400/30
                disabled:opacity-50 transition-all duration-200"
            />
            <button
              onClick={() => handleSend()}
              disabled={!message.trim() || isLoading}
              className="flex items-center justify-center w-11 h-11 rounded-xl
                gradient-green text-white shadow-md shadow-primary-500/20
                hover:shadow-lg hover:scale-105 active:scale-95
                disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed
                transition-all duration-200"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Background overlay on mobile when chat is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
