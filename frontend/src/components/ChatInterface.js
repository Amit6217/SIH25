import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Paperclip, Mic, MicOff, X, FileText, Image, Volume2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

const ChatInterface = () => {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const audioFile = new File([audioBlob], 'voice-message.wav', { type: 'audio/wav' });
          
          const voiceAttachment = {
            id: Date.now(),
            file: audioFile,
            name: 'Voice Message',
            type: 'audio',
            size: audioFile.size
          };
          
          setAttachments(prev => [...prev, voiceAttachment]);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
      })
      .catch(error => {
        console.error('Error accessing microphone:', error);
      });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && attachments.length === 0) return;

    const newMessage = {
      id: Date.now(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date().toISOString(),
      attachments: [...attachments]
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setAttachments([]);
    setIsLoading(true);

    try {
      // Simulate AI response
      setTimeout(() => {
        const aiResponse = {
          id: Date.now() + 1,
          content: "I received your message. This is a simulated response from the AI assistant.",
          role: 'assistant',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiResponse]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error sending message:', error);
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
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <h1 className="text-lg font-semibold text-gray-900">ChatGPT Clone</h1>
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
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md ${message.role === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-800'} rounded-lg px-4 py-2`}>
                <p className="text-sm">{message.content}</p>
                
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center gap-2 text-xs opacity-80">
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

          {/* Voice Recording */}
          <button
            type="button"
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            className={`p-2 rounded-lg transition-colors ${
              isRecording
                ? 'text-red-600 bg-red-100 hover:bg-red-200'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          {/* Text Input */}
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows="1"
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
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
