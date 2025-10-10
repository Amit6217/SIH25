import React, { useState } from 'react';
import { Send, FileText, Loader, AlertCircle, CheckCircle, X } from 'lucide-react';
import { ragAPI } from '../utils/api';

const RAGQuery = ({ selectedPDF, onClose, onQueryResult }) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [sessionId] = useState(`session_${Date.now()}`);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || !selectedPDF) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await ragAPI.queryPDF(
        selectedPDF.pdfId,
        question.trim(),
        sessionId
      );

      setResult(response.data);
      
      if (onQueryResult) {
        onQueryResult({
          question: question.trim(),
          answer: response.data.answer,
          pdf: selectedPDF,
          sessionId: response.data.sessionId
        });
        
        // Auto-close after successful query
        setTimeout(() => {
          onClose();
        }, 2000);
      }

    } catch (error) {
      console.error('RAG query error:', error);
      setError(error.response?.data?.message || 'Failed to query PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const resetQuery = () => {
    setQuestion('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-red-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-800 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Query PDF
              </h2>
              {selectedPDF && (
                <p className="text-sm text-gray-600 truncate max-w-md">
                  {selectedPDF.originalName}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-2 transition-all duration-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Query Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ask a question about the PDF:
              </label>
              <div className="relative">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g., What is the main topic of this document? Summarize the key points..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-white/80 backdrop-blur-sm"
                  rows="3"
                  disabled={loading}
                />
                {loading && (
                  <div className="absolute top-3 right-3">
                    <Loader className="h-5 w-5 animate-spin text-indigo-600" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={resetQuery}
                disabled={loading}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-300 font-medium disabled:opacity-50"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={!question.trim() || loading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Ask Question
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error Display */}
          {error && (
            <div className="mt-6 bg-red-50/80 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-800">Error</p>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className="mt-6 space-y-4">
              <div className="bg-green-50/80 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="font-medium text-green-800">Answer</p>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <p className="text-gray-800 whitespace-pre-wrap">{result.answer}</p>
                </div>
                <div className="mt-3 p-2 bg-blue-50/80 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Result added to chat! This window will close automatically.
                  </p>
                </div>
              </div>

              {result.metadata && (
                <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Metadata</h4>
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(result.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/20 bg-white/40 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Session ID: {sessionId}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RAGQuery;
