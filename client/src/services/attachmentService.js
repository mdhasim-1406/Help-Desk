import api from './api';

/**
 * Upload file attachment
 */
export async function uploadFile(ticketId, file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('ticketId', ticketId);
  
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };
  
  if (onProgress) {
    config.onUploadProgress = (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      onProgress(percentCompleted);
    };
  }
  
  const response = await api.post('/attachments', formData, config);
  return response.data;
}

/**
 * Download file attachment
 */
export async function downloadFile(id) {
  const response = await api.get(`/attachments/${id}`, {
    responseType: 'blob',
  });
  return response.data;
}

/**
 * Delete file attachment
 */
export async function deleteFile(id) {
  const response = await api.delete(`/attachments/${id}`);
  return response.data;
}

/**
 * Get file URL for download
 */
export function getFileUrl(id) {
  const baseURL = api.defaults.baseURL || '';
  return `${baseURL}/attachments/${id}`;
}

const attachmentService = {
  uploadFile,
  downloadFile,
  deleteFile,
  getFileUrl,
};

export default attachmentService;
