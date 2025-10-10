import React, { useState } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { ragAPI } from '../utils/api';

const PDFUpload = ({ onUploadSuccess, onClose }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      setSelectedFile(pdfFile);
    } else {
      setUploadStatus({
        type: 'error',
        message: 'Please select a PDF file'
      });
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setUploadStatus(null);
    } else {
      setUploadStatus({
        type: 'error',
        message: 'Please select a PDF file'
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadStatus(null);

    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);

      const response = await ragAPI.uploadPDF(formData);
      
      setUploadStatus({
        type: 'success',
        message: 'PDF uploaded and indexed successfully!',
        data: response.data
      });

      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }

      // Reset after successful upload
      setTimeout(() => {
        setSelectedFile(null);
        setUploadStatus(null);
        if (onClose) onClose();
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({
        type: 'error',
        message: error.response?.data?.message || 'Failed to upload PDF'
      });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-xl font-semibold text-gray-800 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Upload PDF for RAG
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-2 transition-all duration-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
              isDragging
                ? 'border-indigo-400 bg-indigo-50/50'
                : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              Drag and drop your PDF here, or
            </p>
            <label className="cursor-pointer">
              <span className="text-indigo-600 hover:text-indigo-700 font-medium">
                browse files
              </span>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            <p className="text-sm text-gray-500 mt-2">
              Only PDF files are supported
            </p>
          </div>

          {/* Selected File */}
          {selectedFile && (
            <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-red-500" />
                <div className="flex-1">
                  <p className="font-medium text-gray-800 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Upload Status */}
          {uploadStatus && (
            <div className={`rounded-xl p-4 border ${
              uploadStatus.type === 'success'
                ? 'bg-green-50/80 border-green-200'
                : 'bg-red-50/80 border-red-200'
            }`}>
              <div className="flex items-center gap-3">
                {uploadStatus.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <p className={`font-medium ${
                  uploadStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {uploadStatus.message}
                </p>
              </div>
              {uploadStatus.data && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>PDF ID: {uploadStatus.data.pdfId}</p>
                  <p>Status: Indexed</p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-300 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFUpload;
