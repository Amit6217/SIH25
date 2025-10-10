import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Mic, MicOff, X, FileText, Upload } from 'lucide-react';
import api from '../utils/api';
import PDFUpload from './PDFUpload';

const ChatInterface = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatTitle, setChatTitle] = useState('New Chat');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [showPDFUpload, setShowPDFUpload] = useState(false);
  const [latestPDF, setLatestPDF] = useState(null);
  const messagesEndRef = useRef(null);
  const speechRecognitionRef = useRef(null);

  // Load chat data when chatId changes
  useEffect(() => {
    if (chatId) {
      loadChat();
    } else {
      // Reset for new chat
      setMessages([]);
      setChatTitle('New Chat');
    }
  }, [chatId]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setSpeechSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      speechRecognitionRef.current = new SpeechRecognition();
      
      speechRecognitionRef.current.continuous = false;
      speechRecognitionRef.current.interimResults = true;
      speechRecognitionRef.current.lang = 'en-US';
      speechRecognitionRef.current.maxAlternatives = 1;

      speechRecognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      speechRecognitionRef.current.onresult = (event) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }

        // Only add final results to avoid duplicate text
        if (finalTranscript) {
          setInputMessage(prev => {
            // Add space if there's existing text
            return prev + (prev ? ' ' : '') + finalTranscript;
          });
        }
      };

      speechRecognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        // Show user-friendly error messages
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone access to use voice input.');
        } else if (event.error === 'no-speech') {
          console.log('No speech detected');
        } else if (event.error === 'network') {
          alert('Network error occurred during speech recognition. Please check your internet connection.');
        }
      };

      speechRecognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      setSpeechSupported(false);
      console.warn('Speech recognition not supported in this browser');
    }

    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
    };
  }, []);

  const loadChat = async () => {
    try {
      const response = await api.get(`/chats/${chatId}`);
      const chat = response.data;
      setMessages(chat.messages || []);
      setChatTitle(chat.title || 'New Chat');
    } catch (error) {
      console.error('Error loading chat:', error);
      navigate('/');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  const startVoiceInput = () => {
    if (speechRecognitionRef.current && !isListening) {
      try {
        speechRecognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsListening(false);
      }
    }
  };

  const stopVoiceInput = () => {
    if (speechRecognitionRef.current && isListening) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const messageContent = inputMessage;
    
    // Clear input immediately for better UX
    setInputMessage('');
    setIsLoading(true);

    try {
      // Check if this is a PDF question and we have a PDF uploaded
      if (latestPDF && messageContent.trim()) {
        // This is a PDF question - use RAG
        const response = await api.post('/rag/query-latest', {
          question: messageContent.trim(),
          sessionId: `session_${Date.now()}`
        });

        // Add user message
        const userMessage = {
          _id: `user_${Date.now()}`,
          content: messageContent,
          role: 'user',
          timestamp: new Date(),
          attachments: [{
            _id: `att_${Date.now()}`,
            name: response.data.pdfInfo.originalName,
            type: 'document',
            size: 0 // Size not available in response
          }]
        };

        // Add AI response
        const aiMessage = {
          _id: `ai_${Date.now()}`,
          content: response.data.answer,
          role: 'assistant',
          timestamp: new Date(),
          metadata: {
            source: 'RAG',
            pdfId: response.data.pdfInfo.pdfId,
            pdfName: response.data.pdfInfo.originalName,
            sessionId: response.data.sessionId
          }
        };

        // Add messages to the current chat
        setMessages(prev => [...prev, userMessage, aiMessage]);

        // Save to backend if in a chat
        if (chatId) {
          try {
            await api.post(`/chats/${chatId}/messages`, {
              content: userMessage.content,
              attachments: userMessage.attachments
            });
            await api.post(`/chats/${chatId}/messages`, {
              content: aiMessage.content,
              role: 'assistant',
              metadata: aiMessage.metadata
            });
          } catch (error) {
            console.error('Error saving RAG messages to chat:', error);
          }
        } else {
          // Create new chat for RAG conversation
          try {
            const chatResponse = await api.post('/chats', {
              title: `PDF Query: ${response.data.pdfInfo.originalName}`,
              messages: [userMessage, aiMessage]
            });
            
            const newChat = chatResponse.data;
            navigate(`/chat/${newChat._id}`);
            setMessages(newChat.messages);
            setChatTitle(newChat.title);
          } catch (error) {
            console.error('Error creating new chat for RAG result:', error);
          }
        }
      } else {
        // Regular chat message
        if (chatId) {
          // Send message to existing chat
          const response = await api.post(`/chats/${chatId}/messages`, {
            content: messageContent
          });
          
          // Update messages with the response from server
          setMessages(response.data.chat.messages);
          
          // Update chat title if it's empty and this is the first user message
          const updatedChat = response.data.chat;
          if (!updatedChat.title && updatedChat.messages.length > 0) {
            const firstUserMessage = updatedChat.messages.find(msg => msg.role === 'user');
            if (firstUserMessage) {
              const newTitle = firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '');
              // Update chat title
              await api.put(`/chats/${chatId}`, { title: newTitle });
              setChatTitle(newTitle);
            }
          }
        } else {
          // Create new chat with first message
          const response = await api.post('/chats', {
            title: messageContent.substring(0, 50) + (messageContent.length > 50 ? '...' : ''),
            messages: [{
              content: messageContent,
              role: 'user',
              timestamp: new Date()
            }]
          });
          
          const newChat = response.data;
          navigate(`/chat/${newChat._id}`);
          setMessages(newChat.messages);
          setChatTitle(newChat.title);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore the input on error
      setInputMessage(messageContent);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };


  // RAG-related handlers
  const handlePDFUploadSuccess = (pdfData) => {
    console.log('PDF uploaded successfully:', pdfData);
    setLatestPDF(pdfData);
    // Show success message
    const successMessage = {
      _id: `success_${Date.now()}`,
      content: `PDF "${pdfData.originalName}" uploaded successfully! You can now ask questions about it.`,
      role: 'assistant',
      timestamp: new Date(),
      metadata: {
        type: 'upload_success',
        pdfId: pdfData.pdfId,
        pdfName: pdfData.originalName
      }
    };
    setMessages(prev => [...prev, successMessage]);
  };


  return (
    <div className="flex flex-col h-full bg-gray-800 relative">
      {/* Header - Hidden on mobile, shown on desktop */}
      <div className="hidden lg:block border-b border-gray-700 p-4 bg-gray-800">
        <h1 className="text-lg font-semibold text-white">{chatTitle}</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 lg:p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8 lg:py-12">
            <h2 className="text-xl font-medium mb-2 text-white">Welcome to LegalEase</h2>
            <p className="text-gray-500">Start a conversation by typing a message below</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message._id || index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div className={`max-w-xs lg:max-w-md ${message.role === 'user' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-100 border border-gray-700'} rounded-lg px-4 py-3 transition-all duration-300`}>
                <p className="text-sm">{message.content}</p>
                
                {/* RAG Source Indicator */}
                {message.metadata && message.metadata.source === 'RAG' && (
                  <div className="mt-2 px-2 py-1 bg-gray-700 rounded-lg border border-gray-600">
                    <div className="flex items-center gap-2 text-xs text-gray-300">
                      <FileText className="h-3 w-3" />
                      <span>Answer from: {message.metadata.pdfName}</span>
                    </div>
                  </div>
                )}
                
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.attachments.map((attachment, attIndex) => (
                      <div key={attachment._id || attIndex} className="flex items-center gap-2 text-xs opacity-80">
                        <FileText className="h-4 w-4" />
                        <span className="truncate">{attachment.name}</span>
                        <span>({formatFileSize(attachment.size)})</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <p className="text-xs opacity-70 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-gray-800 text-gray-100 rounded-lg px-4 py-3 border border-gray-700">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                <span className="text-sm">AI is typing...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>


      {/* PDF Status Indicator */}
      {latestPDF && (
        <div className="border-t border-gray-700 p-2 lg:p-4 bg-gray-800">
          <div className="flex items-center gap-2 text-sm text-green-400">
            <FileText className="h-4 w-4" />
            <span>Ready to answer questions about: <strong>{latestPDF.originalName}</strong></span>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-700 p-2 lg:p-4 bg-gray-800">
        <div className="flex items-center gap-1 lg:gap-2"> {/* Reduced gap on mobile */}

           {/* PDF Upload for RAG */}
           <button
             type="button"
             onClick={() => setShowPDFUpload(true)}
             className="flex items-center justify-center w-10 h-10 text-gray-400 hover:text-green-400 hover:bg-gray-700 rounded-lg transition-all duration-300 touch-manipulation hover:scale-110 active:scale-95 border border-gray-600 hover:border-green-500"
             title="Upload PDF for RAG"
           >
             <Upload className="h-5 w-5" />
           </button>

          {/* Voice Input */}
          <button
            type="button"
            onClick={isListening ? stopVoiceInput : startVoiceInput}
            disabled={!speechSupported}
            className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 touch-manipulation hover:scale-110 active:scale-95 border ${
              !speechSupported
                ? 'text-gray-500 cursor-not-allowed border-gray-600'
                : isListening
                ? 'text-red-400 bg-red-900/50 border-red-600 hover:bg-red-800/50'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700 border-gray-600 hover:border-gray-500'
            }`}
            title={
              !speechSupported 
                ? 'Voice input not supported in this browser' 
                : isListening 
                ? 'Stop voice input' 
                : 'Start voice input'
            }
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={latestPDF ? `Ask a question about ${latestPDF.originalName}...` : "Type here..."}
              className={`w-full px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none transition-all duration-300 ${
                isListening 
                  ? 'border-red-500 bg-red-900/20' 
                  : 'bg-gray-700 hover:bg-gray-600 hover:border-gray-500 text-white placeholder-gray-400'
              }`}
              rows="1"
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
            {isListening && (
              <div className="absolute top-3 right-3 flex items-center gap-1">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-red-400 font-medium">Listening</span>
              </div>
            )}
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="flex items-center justify-center w-10 h-10 bg-gray-600 text-white rounded-lg hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 touch-manipulation hover:scale-110 active:scale-95"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>

      </div>

      {/* PDF Upload Modal */}
      {showPDFUpload && (
        <PDFUpload
          onUploadSuccess={handlePDFUploadSuccess}
          onClose={() => setShowPDFUpload(false)}
        />
      )}
    </div>
  );
};

export default ChatInterface;
