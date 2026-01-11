import React from 'react';
import { Download, Trash2, File, FileText, Image, FileArchive, ExternalLink } from 'lucide-react';
import Button from './Button';
import { Card } from './Card';

const getFileIcon = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return Image;
  if (['pdf'].includes(ext)) return FileText;
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return FileArchive;
  if (['doc', 'docx', 'txt', 'csv', 'xls', 'xlsx'].includes(ext)) return FileText;
  return File;
};

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const TicketAttachments = ({ 
  attachments = [], 
  onDownload, 
  onDelete,
  canDelete = false,
  showUploader = true,
  className = ''
}) => {
  if (!attachments || attachments.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <File size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          No attachments yet
        </p>
      </div>
    );
  }

  const handleDownload = async (attachment) => {
    if (onDownload) {
      onDownload(attachment);
    } else {
      // Default download behavior
      try {
        const link = document.createElement('a');
        link.href = attachment.url || attachment.path;
        link.download = attachment.filename || attachment.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Download failed:', error);
      }
    }
  };

  const handleDelete = (attachment) => {
    if (onDelete) {
      onDelete(attachment);
    }
  };

  // Separate images from other files
  const images = attachments.filter(att => {
    const filename = att.filename || att.name || '';
    const ext = filename.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  });

  const otherFiles = attachments.filter(att => {
    const filename = att.filename || att.name || '';
    const ext = filename.split('.').pop()?.toLowerCase();
    return !['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  });

  return (
    <div className={className}>
      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <Image size={16} />
            Images ({images.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((attachment, index) => (
              <div 
                key={attachment.id || index}
                className="group relative aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <img
                  src={attachment.url || attachment.path}
                  alt={attachment.filename || attachment.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(attachment.url || attachment.path, '_blank')}
                    className="bg-white/90 hover:bg-white text-slate-900"
                  >
                    <ExternalLink size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(attachment)}
                    className="bg-white/90 hover:bg-white text-slate-900"
                  >
                    <Download size={16} />
                  </Button>
                  {canDelete && onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(attachment)}
                      className="bg-red-500/90 hover:bg-red-500 text-white"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>

                {/* File info */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                  <p className="text-xs text-white truncate">
                    {attachment.filename || attachment.name}
                  </p>
                  <p className="text-xs text-slate-300">
                    {formatFileSize(attachment.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Files */}
      {otherFiles.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <FileText size={16} />
            Files ({otherFiles.length})
          </h4>
          <div className="space-y-2">
            {otherFiles.map((attachment, index) => {
              const FileIcon = getFileIcon(attachment.filename || attachment.name || '');
              
              return (
                <div
                  key={attachment.id || index}
                  className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors group"
                >
                  {/* Icon */}
                  <div className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded">
                    <FileIcon size={20} className="text-slate-500 dark:text-slate-400" />
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {attachment.filename || attachment.name}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>{formatFileSize(attachment.size)}</span>
                      {attachment.uploadedAt && (
                        <>
                          <span>•</span>
                          <span>{formatDate(attachment.uploadedAt)}</span>
                        </>
                      )}
                      {attachment.uploadedBy && (
                        <>
                          <span>•</span>
                          <span className="truncate">by {attachment.uploadedBy}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(attachment)}
                      className="text-slate-600 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400"
                    >
                      <Download size={18} />
                    </Button>
                    {canDelete && onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(attachment)}
                        className="text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                      >
                        <Trash2 size={18} />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Total: {attachments.length} attachment{attachments.length !== 1 ? 's' : ''} 
          <span className="ml-2">
            ({formatFileSize(attachments.reduce((sum, att) => sum + (att.size || 0), 0))})
          </span>
        </p>
      </div>
    </div>
  );
};

export default TicketAttachments;
