import React, { useState, useRef, useEffect } from 'react';
import { DonorProfile, ChatMessage, BloodGroup, UserRole } from '../types';
import { INITIAL_CHAT_MESSAGES, DR_CLARA_KNOWLEDGE_BASE } from '../data/mockData';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Shield,
  Minimize2,
  Maximize2,
  ChevronDown,
  Info,
  Droplet,
} from 'lucide-react';
import { apiFetch } from '../lib/api';

interface DrClaraChatProps {
  donor?: DonorProfile;
  userRole?: UserRole;
  userBloodGroup?: BloodGroup;
  onOpenAskBlood?: () => void;
  onOpenCompatibility?: () => void;
}

export const DrClaraChat: React.FC<DrClaraChatProps> = ({
  donor,
  userRole: _userRole,
  userBloodGroup: _userBloodGroup,
  onOpenAskBlood: _onOpenAskBlood,
  onOpenCompatibility,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsTyping(true);

    try {
      const token = localStorage.getItem('redgrid_token');
      const recentHistory = messages.slice(-4).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await apiFetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: query,
          history: recentHistory,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: data.message || 'I am Dr. Clara. How can I assist you with your blood donation questions today?',
          timestamp: 'Just now',
          quickReplies: data.quickReplies,
        };
        setMessages((prev) => [...prev, botMsg]);
      } else if (res.status === 401) {
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: '🔒 **Authentication Required**\n\nPlease log in to your REDGRID account to receive personalized transfusion and donation guidance from Dr. Clara.',
          timestamp: 'Just now',
          quickReplies: ['What is REDGRID?', 'General donation guidelines'],
        };
        setMessages((prev) => [...prev, botMsg]);
      } else if (res.status === 429) {
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: '⏳ **Rate Limit Exceeded**\n\nDr. Clara allows up to 15 questions per minute. Please pause for a moment before submitting another inquiry.',
          timestamp: 'Just now',
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        const data = await res.json().catch(() => ({}));
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: data.message || 'Dr. Clara is temporarily unavailable. Please try again shortly. For medical concerns, please contact a qualified healthcare professional.',
          timestamp: 'Just now',
          quickReplies: [
            'What should I eat before donating?',
            'How much water should I drink?',
            'Check blood compatibility',
          ],
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch {
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: 'Dr. Clara is temporarily offline. Please check your network connection or try again shortly. For acute health concerns, contact a qualified healthcare provider.',
        timestamp: 'Just now',
        quickReplies: [
          'What should I eat before donating?',
          'How much water should I drink?',
          'Check blood compatibility',
        ],
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40 animate-in fade-in slide-in-from-bottom-3">
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-3 bg-[#111827] hover:bg-[#182235] text-white p-2.5 sm:px-4 sm:py-3 rounded-full border-2 border-rose-500/70 shadow-2xl shadow-rose-950/80 transition-all hover:scale-105 cursor-pointer"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F20A46] to-[#9F1239] flex items-center justify-center text-white shadow-md">
                <Bot className="w-5 h-5" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#111827] flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
              </span>
            </div>

            <div className="hidden sm:flex flex-col text-left pr-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white leading-none">
                  Dr. Clara
                </span>
                <span className="text-[9px] font-bold text-rose-300 bg-rose-950 px-1 rounded">
                  AI Triage
                </span>
              </div>
              <span className="text-[11px] text-[#94A3B8] font-medium mt-0.5">
                Ask Transfusion Doctor
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Expanded Dark Chat Box Modal / Drawer */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[390px] h-[520px] max-h-[85vh] bg-[#0F172A] border-2 border-[#263247] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="bg-[#111827] p-3.5 border-b border-[#263247] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F20A46] to-[#9F1239] flex items-center justify-center text-white shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#111827]"></span>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white">Dr. Clara</h3>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800">
                    Online
                  </span>
                </div>
                <p className="text-[10px] text-[#94A3B8]">
                  AI Transfusion Doctor · 90-Day Clinical Protocol
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#94A3B8] hover:text-white p-1 rounded-lg hover:bg-[#182235] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#080D18] bg-tactical-dots">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-lg bg-[#182235] border border-[#263247] flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
                    <Droplet className="w-3.5 h-3.5 fill-[#F20A46]" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-[#F20A46] to-[#E11D48] text-white rounded-tr-none shadow-md'
                      : 'bg-[#111827] text-[#F8FAFC] border border-[#263247] rounded-tl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Quick Replies */}
                  {msg.quickReplies && msg.quickReplies.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-[#263247] flex flex-wrap gap-1.5">
                      {msg.quickReplies.map((qr, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(qr)}
                          className="text-[10px] font-semibold bg-[#182235] hover:bg-[#202e48] text-rose-300 hover:text-white px-2 py-1 rounded-lg border border-rose-900/40 transition-all text-left cursor-pointer"
                        >
                          {qr}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 items-center text-xs text-[#94A3B8] italic p-1">
                <Bot className="w-4 h-4 text-rose-400 animate-pulse" />
                <span>Dr. Clara is typing clinical guidance...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 bg-[#111827] border-t border-[#263247]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask Dr. Clara..."
                className="flex-1 bg-[#0B1220] border border-[#263247] rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#F20A46]"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F20A46] to-[#9F1239] hover:from-[#e10940] hover:to-[#881337] text-white flex items-center justify-center shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 transition-all"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      )}
    </>
  );
};
