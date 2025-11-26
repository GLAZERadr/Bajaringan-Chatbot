'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CitationModal } from '@/components/CitationModal';

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
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedCitation, setSelectedCitation] = useState<{
    citation: Citation;
    index: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Close image menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showImageMenu && !(event.target as Element).closest('.relative')) {
        setShowImageMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showImageMenu]);

  // Save current chat to history
  useEffect(() => {
    if (messages.length > 0 && currentChatId) {
      // Generate title from first user message
      const firstUserMessage = messages.find(m => m.role === 'user');
      const title = firstUserMessage?.content.substring(0, 50) || 'Percakapan Baru';

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
      title: 'Percakapan Baru',
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      setSelectedImages(prev => [...prev, ...imageFiles]);
      setShowImageMenu(false);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length > 0) {
      setSelectedImages(prev => [...prev, ...imageFiles]);
    }
  };

  const handleStreamingResponse = async (response: Response) => {
    console.log('🎯 Starting streaming response handler');

    // Create placeholder message
    const tempMessage: Message = {
      role: 'assistant',
      content: '',
      citations: [],
      timestamp: Date.now()
    };

    // Get the index where this message will be inserted
    let messageIndex = 0;
    setMessages(prev => {
      messageIndex = prev.length; // The index will be the current length
      console.log('📍 Message will be inserted at index:', messageIndex);
      return [...prev, tempMessage];
    });

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let fullContent = '';
    let citations: Citation[] = [];

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('✅ Stream completed');
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        console.log('📦 Received chunk:', chunk.substring(0, 100));
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6).trim();
            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);
              console.log('📨 Parsed SSE event:', data.type);

              if (data.type === 'citations') {
                // Store citations
                citations = data.citations;
                console.log('📚 Received citations:', citations.length);
                setMessages(prev => prev.map((msg, idx) =>
                  idx === messageIndex
                    ? { ...msg, citations }
                    : msg
                ));
              } else if (data.type === 'chunk') {
                // Append content chunk
                fullContent += data.content;
                console.log('✍️ Content length now:', fullContent.length);
                setMessages(prev => prev.map((msg, idx) =>
                  idx === messageIndex
                    ? { ...msg, content: fullContent, citations }
                    : msg
                ));
              } else if (data.type === 'done') {
                // Finalize message
                console.log('🏁 Stream done, final content length:', fullContent.length);
                setMessages(prev => prev.map((msg, idx) =>
                  idx === messageIndex
                    ? { ...msg, content: fullContent, citations }
                    : msg
                ));
              } else if (data.type === 'error') {
                // Handle error
                console.error('❌ Stream error:', data.error);
                setMessages(prev => prev.map((msg, idx) =>
                  idx === messageIndex
                    ? { ...msg, content: `Error: ${data.error}` }
                    : msg
                ));
              }
            } catch (e) {
              // Skip invalid JSON lines
              console.error('Failed to parse SSE data:', e, 'Line:', line);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      setMessages(prev => prev.map((msg, idx) =>
        idx === messageIndex
          ? { ...msg, content: fullContent || 'Error: Connection interrupted' }
          : msg
      ));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((!input.trim() && selectedImages.length === 0) || loading) return;

    // Create new chat if this is the first message
    if (messages.length === 0 && !currentChatId) {
      const newChatId = `chat_${Date.now()}`;
      const newChat: ChatHistory = {
        id: newChatId,
        title: input.substring(0, 50) || '🖼️ Image query', // Use the first message as title
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
      content: input || (selectedImages.length > 0 ? `🖼️ [${selectedImages.length} gambar]` : ''),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      let response;

      // Check if we have images
      if (selectedImages.length > 0) {
        // Use multimodal API
        const formData = new FormData();
        selectedImages.forEach(img => formData.append('images', img));
        formData.append('query', input || 'Apa yang Anda lihat di gambar ini? Ada masalah apa?');
        formData.append('k', '5');

        response = await fetch('/api/analyze-image', {
          method: 'POST',
          body: formData,
        });

        // Clear images after sending
        setSelectedImages([]);
      } else {
        // Regular text query with streaming
        response = await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: input, k: 5, stream: true }),
        });
      }

      // Handle streaming response
      const contentType = response.headers.get('content-type');
      console.log('Response content-type:', contentType);
      console.log('Response status:', response.status);

      if (response.ok && contentType?.includes('text/event-stream')) {
        console.log('Using streaming response handler');
        await handleStreamingResponse(response);
      } else {
        console.log('Using non-streaming response handler');
        // Handle non-streaming response
        const data = await response.json();
        console.log('Received data:', data);

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
            content: `Maaf, terjadi kesalahan: ${data.error || 'Tidak dapat memproses permintaan'}`,
            timestamp: Date.now()
          };

          setMessages(prev => [...prev, errorMessage]);
        }
      }
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Maaf, koneksi ke server terputus. Silakan coba lagi.',
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

  const renderContentWithCitations = (content: string, citations: Citation[], messageIndex: number) => {
    // Custom component for rendering citations within markdown
    const components = {
      // Override text nodes to handle citations
      p: ({ children, ...props }: any) => {
        // Convert children to string and check for citations
        const text = React.Children.toArray(children).join('');

        if (typeof text === 'string' && /\[\d+\]/.test(text)) {
          const parts = text.split(/(\[\d+\])/g);

          const rendered = parts.map((part, partIndex) => {
            const citationMatch = part.match(/^\[(\d+)\]$/);

            if (citationMatch) {
              const citationNumber = parseInt(citationMatch[1]);
              const citation = citations[citationNumber - 1];

              return (
                <button
                  key={partIndex}
                  onClick={() => citation && setSelectedCitation({ citation, index: citationNumber - 1 })}
                  className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 mx-0.5 bg-blue-100 hover:bg-blue-200 rounded text-[10px] font-bold text-blue-700 transition-colors cursor-pointer"
                  style={{
                    verticalAlign: 'super',
                    fontSize: '0.7em',
                    lineHeight: '1.2'
                  }}
                  title={citation ? `Klik untuk melihat sumber: ${citation.document_name}` : ''}
                >
                  {citationNumber}
                </button>
              );
            }

            return <span key={partIndex}>{part}</span>;
          });

          return <p {...props}>{rendered}</p>;
        }

        return <p {...props}>{children}</p>;
      },
      // Style other markdown elements
      strong: ({ children, ...props }: any) => (
        <strong className="font-bold text-gray-900" {...props}>{children}</strong>
      ),
      em: ({ children, ...props }: any) => (
        <em className="italic text-gray-800" {...props}>{children}</em>
      ),
      ul: ({ children, ...props }: any) => (
        <ul className="list-disc list-inside space-y-1 my-2" {...props}>{children}</ul>
      ),
      ol: ({ children, ...props }: any) => (
        <ol className="list-decimal list-inside space-y-1 my-2" {...props}>{children}</ol>
      ),
      li: ({ children, ...props }: any) => (
        <li className="text-gray-800" {...props}>{children}</li>
      ),
      h1: ({ children, ...props }: any) => (
        <h1 className="text-2xl font-bold mt-4 mb-2" {...props}>{children}</h1>
      ),
      h2: ({ children, ...props }: any) => (
        <h2 className="text-xl font-bold mt-3 mb-2" {...props}>{children}</h2>
      ),
      h3: ({ children, ...props }: any) => (
        <h3 className="text-lg font-bold mt-2 mb-1" {...props}>{children}</h3>
      ),
      code: ({ children, inline, ...props }: any) =>
        inline ? (
          <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-red-600" {...props}>
            {children}
          </code>
        ) : (
          <code className="block bg-gray-100 p-3 rounded text-sm font-mono overflow-x-auto" {...props}>
            {children}
          </code>
        ),
      blockquote: ({ children, ...props }: any) => (
        <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-700 my-2" {...props}>
          {children}
        </blockquote>
      ),
    };

    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    );
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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        fixed lg:static inset-y-0 left-0 z-50
        w-64 lg:w-64
        transition-transform duration-300 ease-in-out
        bg-gray-900 text-white flex-shrink-0
      `}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header with Close Button (Mobile) */}
          <div className="p-3 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Riwayat Percakapan</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-800 rounded-lg transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-3 border-b border-gray-700">
            <button
              onClick={startNewChat}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition text-sm font-medium shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Percakapan Baru
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-2">
              {chatHistories.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => {
                    loadChat(chat.id);
                    setSidebarOpen(false); // Close sidebar on mobile after selection
                  }}
                  className={`group flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer transition ${
                    currentChatId === chat.id
                      ? 'bg-blue-600 shadow-md'
                      : 'bg-gray-800 hover:bg-gray-750'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{chat.title}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(chat.updatedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => deleteChat(chat.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-gray-700 rounded transition ml-2"
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
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <div className="bg-white border-b px-4 md:px-6 py-3 md:py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
                aria-label="Toggle sidebar"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="min-w-0">
                <h1 className="text-lg md:text-2xl font-bold text-gray-900 truncate">Bajaringan Chatbot</h1>
                <p className="text-xs md:text-sm text-gray-600 hidden sm:block">Ask questions about your knowledge base</p>
              </div>
            </div>
            <Link
              href="/admin/upload"
              className="bg-gray-900 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-gray-800 transition font-medium text-xs md:text-sm flex items-center gap-2 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Admin Panel</span>
              <span className="sm:hidden">Admin</span>
            </Link>
          </div>
        </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-3 md:px-4 py-4 md:py-6">
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-6 md:py-8 px-4">
              <div className="text-gray-400 mb-4">
                <svg
                  className="w-12 h-12 md:w-16 md:h-16 mx-auto"
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
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                Selamat datang di Bajaringan Chatbot
              </h2>
              <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8 max-w-2xl mx-auto">
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
                  {message.role === 'assistant' && message.citations && message.citations.length > 0
                    ? renderContentWithCitations(message.content, message.citations, index)
                    : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )
                  }
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
        <div
          className="bg-white border-t px-4 py-4"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            {/* Drag and Drop Overlay */}
            {isDragging && (
              <div className="fixed inset-0 bg-blue-500 bg-opacity-20 z-50 flex items-center justify-center pointer-events-none">
                <div className="bg-white rounded-lg p-8 shadow-2xl">
                  <svg className="w-16 h-16 text-blue-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-lg font-semibold text-gray-900">Drop images here</p>
                </div>
              </div>
            )}

            {/* Image Previews */}
            {selectedImages.length > 0 && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-700">
                    {selectedImages.length} gambar dipilih
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedImages([])}
                    className="text-xs text-red-600 hover:text-red-800 font-medium"
                  >
                    Hapus semua
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {selectedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-20 object-cover rounded border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold hover:bg-red-600"
                      >
                        ×
                      </button>
                      <p className="text-xs text-gray-600 truncate mt-1">
                        {image.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex space-x-4">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />

              {/* Image upload button with dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowImageMenu(!showImageMenu)}
                  disabled={loading}
                  className="flex-shrink-0 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
                  title="Upload gambar"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>

                {/* Dropdown menu */}
                {showImageMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      Choose from files
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <div className="px-4 py-2 text-xs text-gray-500">
                      Or drag & drop images anywhere
                    </div>
                  </div>
                )}
              </div>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={selectedImages.length > 0 ? "Tanyakan tentang gambar ini..." : "Ask a question..."}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={(!input.trim() && selectedImages.length === 0) || loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-medium"
              >
                {loading ? 'Sending...' : 'Send'}
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-2 text-center">
              {selectedImages.length > 0
                ? `Upload ${selectedImages.length} gambar dengan pertanyaan Anda`
                : 'Ask questions, upload images, or drag & drop files'
              }
            </p>
          </form>
        </div>

        {/* Citation Modal */}
        {selectedCitation && (
          <CitationModal
            citation={selectedCitation.citation}
            index={selectedCitation.index}
            onClose={() => setSelectedCitation(null)}
          />
        )}
      </div>
    </div>
  );
}
