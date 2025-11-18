'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp: number;
}

interface Citation {
  document_id: string;
  document_name: string;
  chunk_index: number;
  content: string;
  page?: number;
}

interface ChatHistory {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedCitations, setExpandedCitations] = useState<number | null>(null);
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load chat histories from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('chatHistories');
    if (saved) {
      const histories = JSON.parse(saved);
      setChatHistories(histories);

      // Load last active chat
      const lastChatId = localStorage.getItem('currentChatId');
      if (lastChatId) {
        const lastChat = histories.find((h: ChatHistory) => h.id === lastChatId);
        if (lastChat) {
          setCurrentChatId(lastChatId);
          setMessages(lastChat.messages);
        }
      } else if (histories.length > 0) {
        // If no active chat but have histories, load the most recent one
        const mostRecent = histories[0];
        setCurrentChatId(mostRecent.id);
        setMessages(mostRecent.messages);
        localStorage.setItem('currentChatId', mostRecent.id);
      }
    } else {
      // No saved histories - create first chat automatically
      const newChatId = `chat_${Date.now()}`;
      const newChat: ChatHistory = {
        id: newChatId,
        title: 'New Chat',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      setChatHistories([newChat]);
      setCurrentChatId(newChatId);
      localStorage.setItem('chatHistories', JSON.stringify([newChat]));
      localStorage.setItem('currentChatId', newChatId);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Save current chat to history
  useEffect(() => {
    if (messages.length > 0 && currentChatId) {
      // Generate title from first user message
      const firstUserMessage = messages.find(m => m.role === 'user');
      const title = firstUserMessage?.content.substring(0, 50) || 'New Chat';

      const updatedHistories = chatHistories.map(h =>
        h.id === currentChatId
          ? { ...h, title, messages, updatedAt: Date.now() }
          : h
      );
      setChatHistories(updatedHistories);
      localStorage.setItem('chatHistories', JSON.stringify(updatedHistories));
    }
  }, [messages]);

  const startNewChat = () => {
    if (messages.length > 0 && currentChatId) {
      // Save current chat if it has messages
      saveCurrentChat();
    }

    // Create new chat
    const newChatId = `chat_${Date.now()}`;
    const newChat: ChatHistory = {
      id: newChatId,
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const updatedHistories = [newChat, ...chatHistories];
    setChatHistories(updatedHistories);
    setCurrentChatId(newChatId);
    setMessages([]);
    localStorage.setItem('chatHistories', JSON.stringify(updatedHistories));
    localStorage.setItem('currentChatId', newChatId);
  };

  const saveCurrentChat = () => {
    if (!currentChatId || messages.length === 0) return;

    const title = messages[0]?.content.substring(0, 50) || 'New Chat';
    const existingIndex = chatHistories.findIndex(h => h.id === currentChatId);

    if (existingIndex >= 0) {
      const updated = [...chatHistories];
      updated[existingIndex] = {
        ...updated[existingIndex],
        title,
        messages,
        updatedAt: Date.now()
      };
      setChatHistories(updated);
      localStorage.setItem('chatHistories', JSON.stringify(updated));
    } else {
      const newChat: ChatHistory = {
        id: currentChatId,
        title,
        messages,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      const updated = [newChat, ...chatHistories];
      setChatHistories(updated);
      localStorage.setItem('chatHistories', JSON.stringify(updated));
    }
  };

  const loadChat = (chatId: string) => {
    const chat = chatHistories.find(h => h.id === chatId);
    if (chat) {
      setCurrentChatId(chatId);
      setMessages(chat.messages);
      localStorage.setItem('currentChatId', chatId);
    }
  };

  const deleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = chatHistories.filter(h => h.id !== chatId);
    setChatHistories(updated);
    localStorage.setItem('chatHistories', JSON.stringify(updated));

    if (currentChatId === chatId) {
      setCurrentChatId(null);
      setMessages([]);
      localStorage.removeItem('currentChatId');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || loading) return;

    // Create new chat if this is the first message
    if (messages.length === 0 && !currentChatId) {
      const newChatId = `chat_${Date.now()}`;
      const newChat: ChatHistory = {
        id: newChatId,
        title: input.substring(0, 50), // Use the first message as title
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const updatedHistories = [newChat, ...chatHistories];
      setChatHistories(updatedHistories);
      setCurrentChatId(newChatId);
      localStorage.setItem('chatHistories', JSON.stringify(updatedHistories));
      localStorage.setItem('currentChatId', newChatId);
    }

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input, k: 5 }),
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.answer,
          citations: data.citations || [],
          timestamp: Date.now()
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          role: 'assistant',
          content: `Error: ${data.error || 'Failed to get response'}`,
          timestamp: Date.now()
        };

        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Error: Failed to connect to the server',
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const toggleCitations = (index: number) => {
    setExpandedCitations(expandedCitations === index ? null : index);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderContentWithCitations = (content: string, messageIndex: number) => {
    // Split content by citation pattern [N]
    const parts = content.split(/(\[\d+\])/g);

    return parts.map((part, partIndex) => {
      // Check if this part is a citation [N]
      const citationMatch = part.match(/^\[(\d+)\]$/);

      if (citationMatch) {
        const citationNumber = parseInt(citationMatch[1]);
        return (
          <button
            key={partIndex}
            onClick={() => toggleCitations(messageIndex)}
            className="inline-flex items-center justify-center w-5 h-5 mx-0.5 bg-gray-200 hover:bg-gray-300 rounded text-[10px] font-bold text-gray-700 transition-colors align-super cursor-pointer"
            style={{ verticalAlign: 'super', fontSize: '0.7em' }}
          >
            {citationNumber}
          </button>
        );
      }

      // Regular text
      return <span key={partIndex}>{part}</span>;
    });
  };

  // Group citations by document
  const groupCitationsByDocument = (citations: Citation[]) => {
    const grouped = new Map<string, { citation: Citation; pages: number[]; chunks: string[] }>();

    citations.forEach((citation) => {
      const existing = grouped.get(citation.document_id);
      if (existing) {
        if (citation.page && !existing.pages.includes(citation.page)) {
          existing.pages.push(citation.page);
        }
        existing.chunks.push(citation.content);
      } else {
        grouped.set(citation.document_id, {
          citation,
          pages: citation.page ? [citation.page] : [],
          chunks: [citation.content]
        });
      }
    });

    return Array.from(grouped.values());
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-gray-900 text-white flex-shrink-0 overflow-hidden`}>
        <div className="flex flex-col h-full">
          {/* New Chat Button */}
          <div className="p-3 border-b border-gray-700">
            <button
              onClick={startNewChat}
              className="w-full bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Chat
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-1">
              {chatHistories.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => loadChat(chat.id)}
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition ${
                    currentChatId === chat.id
                      ? 'bg-gray-800'
                      : 'hover:bg-gray-800'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{chat.title}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(chat.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => deleteChat(chat.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Bajaringan Chatbot</h1>
                <p className="text-sm text-gray-600">Ask questions about your knowledge base</p>
              </div>
            </div>
            <Link
              href="/admin/upload"
              className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition font-medium text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Admin Panel
            </Link>
          </div>
        </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-8 px-4">
              <div className="text-gray-400 mb-4">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Selamat datang di Bajaringan Chatbot
              </h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Tanyakan apa saja tentang baja ringan, konstruksi, spesifikasi teknis, dan dokumen lainnya yang telah diupload ke knowledge base
              </p>

              {/* Example Questions */}
              <div className="max-w-3xl mx-auto mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-4 text-left">Contoh pertanyaan yang bisa Anda tanyakan:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => setInput('Apa itu baja ringan?')}
                    className="text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-blue-600 group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 mb-1">Apa itu baja ringan?</p>
                        <p className="text-xs text-gray-500">Penjelasan dasar tentang baja ringan</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setInput('Apa saja aplikasi atau penggunaan baja ringan?')}
                    className="text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-green-600 group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 mb-1">Apa saja aplikasi baja ringan?</p>
                        <p className="text-xs text-gray-500">Penggunaan dalam konstruksi</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setInput('Apa keunggulan baja ringan dibanding material lain?')}
                    className="text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-purple-600 group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 mb-1">Apa keunggulan baja ringan?</p>
                        <p className="text-xs text-gray-500">Perbandingan dengan material lain</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setInput('Bagaimana cara pemasangan baja ringan?')}
                    className="text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-orange-600 group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 mb-1">Bagaimana cara pemasangan?</p>
                        <p className="text-xs text-gray-500">Proses instalasi baja ringan</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <Link
                  href="/admin/upload"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload dokumen baru ke knowledge base
                </Link>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                } rounded-lg px-5 py-4 shadow-sm`}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
                    {message.role === 'user' ? 'You' : 'Assistant'}
                  </span>
                  <span className="text-xs opacity-60 ml-4">
                    {formatTime(message.timestamp)}
                  </span>
                </div>

                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">
                    {message.role === 'assistant' && message.citations && message.citations.length > 0
                      ? renderContentWithCitations(message.content, index)
                      : message.content
                    }
                  </p>
                </div>

                {/* Citations - ChatGPT Style */}
                {message.role === 'assistant' && message.citations && message.citations.length > 0 && (() => {
                  const groupedCitations = groupCitationsByDocument(message.citations);
                  return (
                    <div className="mt-4">
                      {/* Source Chips */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {groupedCitations.map((group, groupIndex) => (
                          <button
                            key={groupIndex}
                            onClick={() => toggleCitations(index)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-medium text-gray-700 transition-colors border border-gray-300"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            <span>{groupIndex + 1}</span>
                          </button>
                        ))}
                      </div>

                      {/* Expandable Source Details */}
                      {expandedCitations === index && (
                        <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                            Sources
                          </p>
                          {groupedCitations.map((group, groupIndex) => (
                            <div
                              key={groupIndex}
                              className="bg-gray-50 rounded-lg p-3 text-xs border border-gray-200 hover:border-gray-300 transition-colors"
                            >
                              <div className="flex items-start gap-2">
                                <span className="flex-shrink-0 w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-700">
                                  {groupIndex + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-gray-900 mb-1 flex items-center gap-1">
                                    <span className="truncate">{group.citation.document_name}</span>
                                    {group.pages.length > 0 && (
                                      <span className="text-gray-500 flex-shrink-0">
                                        • Page{group.pages.length > 1 ? 's' : ''} {group.pages.sort((a, b) => a - b).join(', ')}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-gray-600 leading-relaxed space-y-2">
                                    {group.chunks.map((chunk, chunkIdx) => (
                                      <div key={chunkIdx} className="text-xs line-clamp-2">
                                        {chunk}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg px-5 py-4 shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

        {/* Input Form */}
        <div className="bg-white border-t px-4 py-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex space-x-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-medium"
              >
                {loading ? 'Sending...' : 'Send'}
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-2 text-center">
              Ask questions based on your uploaded documents
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
