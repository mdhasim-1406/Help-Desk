import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, FileText, Image, FileArchive, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Button from './Button';
import { useUIStore } from '@/store/uiStore';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  'application/zip': ['.zip'],
  'application/x-rar-compressed': ['.rar'],
};

const getFileIcon = (file) => {
  const type = file.type;
  if (type.startsWith('image/')) return Image;
  if (type.includes('pdf')) return FileText;
  if (type.includes('zip') || type.includes('rar')) return FileArchive;
  return File;
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const FileUpload = ({ 
  files = [], 
  onChange, 
  maxFiles = 5,
  disabled = false,
  showPreview = true,
  className = ''
}) => {
  const { addToast } = useUIStore();
  const [uploadProgress, setUploadProgress] = useState({});

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    rejectedFiles.forEach(({ file, errors }) => {
      errors.forEach(error => {
        if (error.code === 'file-too-large') {
          addToast(`${file.name} is too large. Max size is 10MB.`, 'error');
        } else if (error.code === 'file-invalid-type') {
          addToast(`${file.name} type is not supported.`, 'error');
        } else if (error.code === 'too-many-files') {
          addToast(`Maximum ${maxFiles} files allowed.`, 'error');
        }
      });
    });

    // Handle accepted files
    if (acceptedFiles.length > 0) {
      const newFiles = acceptedFiles.map(file => ({
        file,
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        uploading: false,
        uploaded: false,
        error: null,
      }));

      const totalFiles = files.length + newFiles.length;
      if (totalFiles > maxFiles) {
        addToast(`Maximum ${maxFiles} files allowed. Only adding first ${maxFiles - files.length} files.`, 'warning');
        onChange([...files, ...newFiles.slice(0, maxFiles - files.length)]);
      } else {
        onChange([...files, ...newFiles]);
        addToast(`${newFiles.length} file${newFiles.length > 1 ? 's' : ''} added`, 'success');
      }
    }
  }, [files, onChange, maxFiles, addToast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: maxFiles - files.length,
    disabled,
  });

  const removeFile = (fileId) => {
    const fileToRemove = files.find(f => f.id === fileId);
    if (fileToRemove?.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    onChange(files.filter(f => f.id !== fileId));
  };

  const simulateUpload = (fileId) => {
    // Simulate upload progress for demo purposes
    // In production, this would be replaced with actual upload logic
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    const updatedFiles = files.map(f => 
      f.id === fileId ? { ...f, uploading: true } : f
    );
    onChange(updatedFiles);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(prev => ({ ...prev, [fileId]: progress }));

      if (progress >= 100) {
        clearInterval(interval);
        const finalFiles = files.map(f =>
          f.id === fileId ? { ...f, uploading: false, uploaded: true } : f
        );
        onChange(finalFiles);
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });
      }
    }, 200);
  };

  return (
    <div className={className}>
      {/* Dropzone */}
      {files.length < maxFiles && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
            ${isDragActive 
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
              : 'border-slate-300 dark:border-slate-600 hover:border-primary-400 dark:hover:border-primary-500'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <Upload 
            size={48} 
            className={`mx-auto mb-4 ${
              isDragActive 
                ? 'text-primary-500' 
                : 'text-slate-400 dark:text-slate-500'
            }`}
          />
          {isDragActive ? (
            <p className="text-primary-600 dark:text-primary-400 font-medium">
              Drop the files here...
            </p>
          ) : (
            <div>
              <p className="text-slate-600 dark:text-slate-400 mb-2">
                <span className="text-primary-600 dark:text-primary-400 font-medium">
                  Click to upload
                </span>
                {' '}or drag and drop
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                PDF, DOC, DOCX, XLS, XLSX, TXT, CSV, ZIP, or Images (max 10MB each)
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-600 mt-2">
                Maximum {maxFiles} files ({files.length}/{maxFiles} uploaded)
              </p>
            </div>
          )}
        </div>
      )}

      {/* File List */}
      {showPreview && files.length > 0 && (
        <div className="mt-4 space-y-3">
          {files.map((fileData) => {
            const FileIcon = getFileIcon(fileData);
            const progress = uploadProgress[fileData.id] || 0;

            return (
              <div
                key={fileData.id}
                className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                {/* Preview or Icon */}
                {fileData.preview ? (
                  <img
                    src={fileData.preview}
                    alt={fileData.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center bg-slate-200 dark:bg-slate-700 rounded">
                    <FileIcon size={24} className="text-slate-500 dark:text-slate-400" />
                  </div>
                )}

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {fileData.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatFileSize(fileData.size)}
                  </p>

                  {/* Progress Bar */}
                  {fileData.uploading && (
                    <div className="mt-2">
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                        <div
                          className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Uploading... {progress}%
                      </p>
                    </div>
                  )}

                  {/* Error */}
                  {fileData.error && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {fileData.error}
                    </p>
                  )}
                </div>

                {/* Status Icon */}
                <div className="flex items-center gap-2">
                  {fileData.uploading && (
                    <Loader2 size={20} className="text-primary-600 animate-spin" />
                  )}
                  {fileData.uploaded && (
                    <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                  )}
                  {!fileData.uploading && !fileData.uploaded && !disabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => simulateUpload(fileData.id)}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      Upload
                    </Button>
                  )}
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => removeFile(fileData.id)}
                    disabled={disabled || fileData.uploading}
                    className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {files.length > 0 && (
        <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          {files.length} file{files.length !== 1 ? 's' : ''} selected
          {files.filter(f => f.uploaded).length > 0 && (
            <span className="text-green-600 dark:text-green-400 ml-2">
              ({files.filter(f => f.uploaded).length} uploaded)
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
