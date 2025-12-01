// API client for web version - replaces Electron IPC
const API_BASE = process.env.IS_WEB ? '' : 'http://localhost:8080';

export interface Video {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  duration: number;
  width: number;
  height: number;
  codec: string;
  format: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  video_id: string;
  segments: Segment[];
  created_at: string;
  updated_at: string;
}

export interface Segment {
  id: string;
  name: string;
  start: number;
  end?: number;
  tags?: Record<string, string>;
  color?: number;
  selected?: boolean;
}

export interface Download {
  id: string;
  url: string;
  title?: string;
  duration?: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  file_path?: string;
  video_id?: string;
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface Operation {
  id: string;
  type: string;
  project_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  output_files?: string[];
  error?: string;
  created_at: string;
  completed_at?: string;
}

class ApiClient {
  async uploadVideo(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/videos/upload', {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Upload failed');
    return response.json();
  }

  async startDownload(url: string, format = 'best'): Promise<Download> {
    const response = await fetch('/api/downloads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, format }),
    });
    if (!response.ok) throw new Error('Download start failed');
    return response.json();
  }

  async getDownload(id: string): Promise<Download> {
    const response = await fetch(`/api/downloads/${id}`);
    if (!response.ok) throw new Error('Failed to get download');
    return response.json();
  }

  async listDownloads() {
    const response = await fetch('/api/downloads');
    if (!response.ok) throw new Error('Failed to list downloads');
    return response.json();
  }

  async clearAllDownloads() {
    const response = await fetch('/api/downloads', {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to clear downloads');
    return response.json();
  }

  async createProject(name: string, videoId: string) {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, video_id: videoId }),
    });
    if (!response.ok) throw new Error('Create project failed');
    return response.json();
  }

  async updateProject(id: string, project: Project) {
    const response = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    if (!response.ok) throw new Error('Update failed');
    return response.json();
  }

  async exportProject(projectId: string, options: any): Promise<Operation> {
    const response = await fetch(`/api/projects/${projectId}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    if (!response.ok) throw new Error('Export failed');
    return response.json();
  }

  async getOperation(operationId: string): Promise<Operation> {
    const response = await fetch(`/api/operations/${operationId}`);
    if (!response.ok) throw new Error('Failed to get operation status');
    return response.json();
  }

  getVideoStreamUrl(videoId: string): string {
    return `/api/videos/${videoId}/stream`;
  }

  async captureScreenshot(videoId: string, timestamp: number, quality = 2): Promise<{ filename: string; url: string }> {
    const response = await fetch(`/api/videos/${videoId}/screenshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timestamp, quality }),
    });
    if (!response.ok) throw new Error('Screenshot capture failed');
    return response.json();
  }
}

export const apiClient = new ApiClient();
