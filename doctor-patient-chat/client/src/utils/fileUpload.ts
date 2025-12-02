import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface UploadedFile {
  fileName: string;
  fileUrl: string;
  fileType: 'image' | 'document' | 'other';
  fileSize: number;
}

export const uploadFile = async (
  file: File,
  senderId: string,
  receiverId: string,
  content: string = '',
  token: string
): Promise<UploadedFile> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('senderId', senderId);
  formData.append('receiverId', receiverId);
  formData.append('content', content);

  const response = await axios.post(`${API_BASE_URL}/chat/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'x-auth-token': token,
    },
  });

  return response.data.attachment;
};

export const getFileUrl = (path: string): string => {
  // If the path already contains the full URL, return it as is
  if (path.startsWith('http')) return path;
  
  // Remove any leading slashes to prevent double slashes
  let cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Remove /api/ prefix if it exists to prevent double /api
  if (cleanPath.startsWith('api/')) {
    cleanPath = cleanPath.substring(4);
  }
  
  // Return the full URL
  return `${API_BASE_URL}/${cleanPath}`;
};

export const getFileIcon = (fileType: string): string => {
  const iconMap: { [key: string]: string } = {
    'application/pdf': 'picture_as_pdf',
    'application/msword': 'description',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'description',
    'application/vnd.ms-excel': 'table_chart',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'table_chart',
    'text/plain': 'insert_drive_file',
  };

  return iconMap[fileType] || 'insert_drive_file';
};

export const isImage = (fileType: string): boolean => {
  return fileType.startsWith('image/');
};
