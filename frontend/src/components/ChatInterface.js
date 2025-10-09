import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Paperclip, Mic, MicOff, X, FileText, Image, Volume2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import api from '../utils/api';

const ChatInterface = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatTitle, setChatTitle] = useState('New Chat');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
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

  const onDrop = (acceptedFiles) => {
    const newAttachments = acceptedFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' : 'document',
      size: file.size
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'text/*': ['.txt', '.md'],
      'audio/*': ['.mp3', '.wav', '.m4a']
    },
    multiple: true
  });

  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

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
    if (!inputMessage.trim() && attachments.length === 0) return;

    const messageContent = inputMessage;
    const messageAttachments = [...attachments];
    
    // Clear input immediately for better UX
    setInputMessage('');
    setAttachments([]);
    setIsLoading(true);

    try {
      if (chatId) {
        // Send message to existing chat
        const response = await api.post(`/chats/${chatId}/messages`, {
          content: messageContent,
          attachments: messageAttachments.map(att => ({
            name: att.name,
            type: att.type,
            size: att.size
          }))
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
            timestamp: new Date(),
            attachments: messageAttachments.map(att => ({
              name: att.name,
              type: att.type,
              size: att.size
            }))
          }]
        });
        
        const newChat = response.data;
        navigate(`/chat/${newChat._id}`);
        setMessages(newChat.messages);
        setChatTitle(newChat.title);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore the input on error
      setInputMessage(messageContent);
      setAttachments(messageAttachments);
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

  const getFileIcon = (type) => {
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'audio':
        return <Volume2 className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header - Hidden on mobile, shown on desktop */}
      <div className="hidden lg:block border-b border-gray-200 p-4">
        <h1 className="text-lg font-semibold text-gray-900">{chatTitle}</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <div className="text-6xl mb-4">🤖</div>
            <h2 className="text-xl font-medium mb-2">Welcome to ChatGPT Clone</h2>
            <p className="text-gray-400">Start a conversation by typing a message below</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message._id || index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md ${message.role === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-800'} rounded-lg px-4 py-2`}>
                <p className="text-sm">{message.content}</p>
                
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.attachments.map((attachment, attIndex) => (
                      <div key={attachment._id || attIndex} className="flex items-center gap-2 text-xs opacity-80">
                        {getFileIcon(attachment.type)}
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
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-800 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span className="text-sm">AI is typing...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 text-sm"
              >
                {getFileIcon(attachment.type)}
                <span className="truncate max-w-32">{attachment.name}</span>
                <span className="text-gray-500">({formatFileSize(attachment.size)})</span>
                <button
                  onClick={() => removeAttachment(attachment.id)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-end gap-2">
          {/* File Upload */}
          <div {...getRootProps()} className="cursor-pointer">
            <input {...getInputProps()} />
            <button
              type="button"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Paperclip className="h-5 w-5" />
            </button>
          </div>

          {/* Voice Input */}
          <button
            type="button"
            onClick={isListening ? stopVoiceInput : startVoiceInput}
            disabled={!speechSupported}
            className={`p-2 rounded-lg transition-colors ${
              !speechSupported
                ? 'text-gray-300 cursor-not-allowed'
                : isListening
                ? 'text-red-600 bg-red-100 hover:bg-red-200'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
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
              placeholder={isListening ? "Listening... Speak now" : "Type your message..."}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${
                isListening 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-300'
              }`}
              rows="1"
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
            {isListening && (
              <div className="absolute top-2 right-2 flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-red-600 font-medium">Listening</span>
              </div>
            )}
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={(!inputMessage.trim() && attachments.length === 0) || isLoading}
            className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>

        {isDragActive && (
          <div className="absolute inset-0 bg-primary-50 bg-opacity-50 flex items-center justify-center border-2 border-dashed border-primary-300 rounded-lg">
            <p className="text-primary-600 font-medium">Drop files here to upload</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
