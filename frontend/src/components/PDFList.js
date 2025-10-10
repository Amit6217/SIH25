import React, { useState, useEffect } from 'react';
import { FileText, Trash2, Search, RefreshCw, AlertCircle, CheckCircle, X } from 'lucide-react';
import { ragAPI } from '../utils/api';

const PDFList = ({ onClose, onSelectPDF }) => {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadPDFs();
  }, []);

  const loadPDFs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ragAPI.getUserPDFs();
      setPdfs(response.data.pdfs || []);
    } catch (error) {
      console.error('Error loading PDFs:', error);
      setError('Failed to load PDFs');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePDF = async (pdfId) => {
    if (!window.confirm('Are you sure you want to delete this PDF?')) {
      return;
    }

    try {
      setDeletingId(pdfId);
      await ragAPI.deletePDF(pdfId);
      
      // Remove from local state
      setPdfs(prev => prev.filter(pdf => pdf.pdfId !== pdfId));
    } catch (error) {
      console.error('Error deleting PDF:', error);
      alert('Failed to delete PDF');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelectPDF = (pdf) => {
    if (onSelectPDF) {
      onSelectPDF(pdf);
    }
    if (onClose) {
      onClose();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredPDFs = pdfs.filter(pdf =>
    pdf.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pdf.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-xl font-semibold text-gray-800 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Your PDF Documents
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={loadPDFs}
              disabled={loading}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-2 transition-all duration-300 disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-2 transition-all duration-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-white/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search PDFs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
                <span className="text-gray-600">Loading PDFs...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 font-medium mb-2">Error loading PDFs</p>
                <p className="text-gray-600 text-sm">{error}</p>
                <button
                  onClick={loadPDFs}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : filteredPDFs.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium mb-2">
                  {searchTerm ? 'No PDFs found' : 'No PDFs uploaded yet'}
                </p>
                <p className="text-gray-500 text-sm">
                  {searchTerm ? 'Try a different search term' : 'Upload your first PDF to get started'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredPDFs.map((pdf) => (
                <div
                  key={pdf.pdfId}
                  className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="flex items-center gap-4">
                    <FileText className="h-10 w-10 text-red-500 flex-shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-800 truncate">
                        {pdf.originalName}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span>{formatFileSize(pdf.fileSize)}</span>
                        <span>•</span>
                        <span>{formatDate(pdf.indexedAt)}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-green-600 capitalize">{pdf.status}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {onSelectPDF && (
                        <button
                          onClick={() => handleSelectPDF(pdf)}
                          className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 text-sm font-medium"
                        >
                          Select
                        </button>
                      )}
                      <button
                        onClick={() => handleDeletePDF(pdf.pdfId)}
                        disabled={deletingId === pdf.pdfId}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300 disabled:opacity-50"
                        title="Delete PDF"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/20 bg-white/40 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {filteredPDFs.length} PDF{filteredPDFs.length !== 1 ? 's' : ''} found
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

export default PDFList;
