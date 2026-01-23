/**
 * File Upload Primitives
 * 
 * Components for file upload with progress tracking.
 * Uses SDK client for file uploads.
 */

import React, { memo, useCallback, useState, useEffect, useContext } from 'react';
import { cn } from '@/lib/utils';
import { X, FileIcon, Check, AlertCircle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { AgentContext } from '@/components/agent/context';
import type { File as FileDTO } from '@inferencesh/sdk';

// =============================================================================
// Types
// =============================================================================

export type UploadStatus = 'pending' | 'uploading' | 'completed' | 'failed' | 'cancelled';

export interface FileUpload {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  uploadedFile?: FileDTO;
  error?: string;
  abortController?: AbortController;
}

export interface FileUploadManagerState {
  uploads: FileUpload[];
  addFiles: (files: File[]) => void;
  removeUpload: (id: string) => void;
  cancelUpload: (id: string) => void;
  clearCompleted: () => void;
  getCompletedFiles: () => FileDTO[];
}

// =============================================================================
// Hook: useFileUploadManager
// =============================================================================

export function useFileUploadManager(): FileUploadManagerState {
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const context = useContext(AgentContext);

  const uploadFile = useCallback(async (upload: FileUpload) => {
    const abortController = new AbortController();

    setUploads(prev => prev.map(u =>
      u.id === upload.id ? { ...u, status: 'uploading' as const, abortController } : u
    ));

    try {
      // Get client from context and upload file
      if (!context) {
        throw new Error('No AgentContext available for file uploads');
      }

      const { client } = context;
      if (!client?.uploadFile) {
        throw new Error('Client does not support file uploads');
      }

      const result = await client.uploadFile(upload.file);

      if (abortController.signal.aborted) {
        return;
      }

      setUploads(prev => prev.map(u =>
        u.id === upload.id ? { ...u, status: 'completed' as const, progress: 100, uploadedFile: result } : u
      ));
    } catch (error) {
      if (abortController.signal.aborted) {
        return;
      }
      setUploads(prev => prev.map(u =>
        u.id === upload.id ? {
          ...u,
          status: 'failed' as const,
          error: error instanceof Error ? error.message : 'Upload failed',
          progress: 0
        } : u
      ));
    }
  }, [context]);

  const addFiles = useCallback((files: File[]) => {
    const newUploads: FileUpload[] = files.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      status: 'pending' as const,
      progress: 0,
    }));

    setUploads(prev => [...prev, ...newUploads]);

    newUploads.forEach(upload => {
      uploadFile(upload);
    });
  }, [uploadFile]);

  const removeUpload = useCallback((id: string) => {
    setUploads(prev => {
      const upload = prev.find(u => u.id === id);
      if (upload?.abortController) {
        upload.abortController.abort();
      }
      return prev.filter(u => u.id !== id);
    });
  }, []);

  const cancelUpload = useCallback((id: string) => {
    setUploads(prev => prev.map(u => {
      if (u.id === id && u.status === 'uploading') {
        u.abortController?.abort();
        return { ...u, status: 'cancelled' as const, progress: 0 };
      }
      return u;
    }));
  }, []);

  const clearCompleted = useCallback(() => {
    setUploads(prev => prev.filter(u => u.status !== 'completed' && u.status !== 'failed' && u.status !== 'cancelled'));
  }, []);

  const getCompletedFiles = useCallback(() => {
    return uploads
      .filter(u => u.status === 'completed' && u.uploadedFile)
      .map(u => u.uploadedFile!);
  }, [uploads]);

  return {
    uploads,
    addFiles,
    removeUpload,
    cancelUpload,
    clearCompleted,
    getCompletedFiles,
  };
}

// =============================================================================
// File Type Helpers
// =============================================================================

function getFileType(file: File): 'image' | 'video' | 'text' | 'generic' {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (
    file.type.startsWith('text/') ||
    file.name.endsWith('.txt') ||
    file.name.endsWith('.md') ||
    file.name.endsWith('.csv') ||
    file.name.endsWith('.json') ||
    file.name.endsWith('.xml') ||
    file.name.endsWith('.yaml') ||
    file.name.endsWith('.yml')
  ) {
    return 'text';
  }
  return 'generic';
}

function getFileExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toUpperCase() || '';
  return ext.length <= 4 ? ext : ext.slice(0, 4);
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// =============================================================================
// FileUploadPreview Component
// =============================================================================

interface FileUploadPreviewProps {
  upload: FileUpload;
  onRemove: () => void;
  onCancel?: () => void;
  className?: string;
}

export const FileUploadPreview = memo(function FileUploadPreview({
  upload,
  onRemove,
  onCancel,
  className,
}: FileUploadPreviewProps) {
  const { file, status, progress, error, uploadedFile } = upload;
  const fileType = getFileType(file);
  const previewUrl = (fileType === 'image' || fileType === 'video')
    ? URL.createObjectURL(file)
    : null;
  const [textPreview, setTextPreview] = useState<string>('');

  useEffect(() => {
    if (fileType === 'text') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setTextPreview(text.slice(0, 100));
      };
      reader.readAsText(file.slice(0, 200));
    }
  }, [file, fileType]);

  const handleRemoveOrCancel = () => {
    if (status === 'uploading' && onCancel) {
      onCancel();
    } else {
      onRemove();
    }
  };

  const handlePreviewClick = () => {
    if (status === 'completed' && uploadedFile?.uri) {
      window.open(uploadedFile.uri, '_blank');
    } else if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  const isClickable = status === 'completed' || previewUrl;

  return (
    <div
      className={cn(
        'relative flex items-center gap-2.5 rounded-lg border bg-muted/30 p-1.5 pr-8',
        'max-w-[220px] animate-in fade-in slide-in-from-bottom-2 duration-150',
        status === 'failed' && 'border-destructive/50 bg-destructive/10',
        status === 'completed' && 'border-border',
        className
      )}
    >
      {/* Thumbnail */}
      <div
        className={cn(
          'relative h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted',
          isClickable && 'cursor-pointer hover:opacity-80 transition-opacity'
        )}
        onClick={isClickable ? handlePreviewClick : undefined}
      >
        {fileType === 'image' && previewUrl && (
          <img src={previewUrl} alt={file.name} className="h-full w-full object-cover" />
        )}

        {fileType === 'video' && previewUrl && (
          <div className="relative h-full w-full">
            <video src={previewUrl} className="h-full w-full object-cover" muted />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="rounded-full bg-white/90 p-1">
                <svg className="h-3 w-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {fileType === 'text' && (
          <div className="flex h-full w-full flex-col items-center justify-center p-0.5">
            <div className="h-full w-full overflow-hidden rounded-sm bg-background/50 p-0.5">
              <div className="text-[5px] leading-tight text-muted-foreground/70 line-clamp-4">
                {textPreview || '...'}
              </div>
            </div>
          </div>
        )}

        {fileType === 'generic' && (
          <div className="flex h-full w-full flex-col items-center justify-center">
            <FileIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-[7px] font-medium text-muted-foreground mt-0.5">
              {getFileExtension(file.name)}
            </span>
          </div>
        )}

        {status === 'uploading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <Spinner className="size-4 text-primary" />
          </div>
        )}

        {status === 'completed' && (
          <div className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 p-0.5 shadow-sm">
            <Check className="h-2 w-2 text-white" />
          </div>
        )}
        {status === 'failed' && (
          <div className="absolute -bottom-1 -right-1 rounded-full bg-destructive p-0.5 shadow-sm">
            <AlertCircle className="h-2 w-2 text-white" />
          </div>
        )}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'truncate text-xs font-medium',
            isClickable && 'cursor-pointer hover:underline'
          )}
          onClick={isClickable ? handlePreviewClick : undefined}
        >
          {file.name}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {status === 'uploading' && 'uploading...'}
          {status === 'completed' && formatFileSize(file.size)}
          {status === 'failed' && (error || 'upload failed')}
          {status === 'cancelled' && 'cancelled'}
          {status === 'pending' && 'waiting...'}
        </p>
      </div>

      {/* Remove/Cancel button */}
      <button
        type="button"
        onClick={handleRemoveOrCancel}
        className={cn(
          'absolute right-1 top-1 rounded-full p-1 transition-colors cursor-pointer',
          'hover:bg-muted-foreground/20',
          status === 'uploading' && 'hover:bg-destructive/20 hover:text-destructive'
        )}
        aria-label={status === 'uploading' ? 'Cancel upload' : 'Remove file'}
      >
        <X className="h-3 w-3" />
      </button>

      {/* Progress bar */}
      {status === 'uploading' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden rounded-b-lg bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
});

// =============================================================================
// FileUploadList Component
// =============================================================================

interface FileUploadListProps {
  uploads: FileUpload[];
  onRemove: (id: string) => void;
  onCancel: (id: string) => void;
  className?: string;
}

export const FileUploadList = memo(function FileUploadList({
  uploads,
  onRemove,
  onCancel,
  className,
}: FileUploadListProps) {
  if (uploads.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {uploads.map(upload => (
        <FileUploadPreview
          key={upload.id}
          upload={upload}
          onRemove={() => onRemove(upload.id)}
          onCancel={() => onCancel(upload.id)}
        />
      ))}
    </div>
  );
});

// =============================================================================
// Utility Functions
// =============================================================================

export function showFileUploadDialog(accept: string = '*/*'): Promise<File[] | null> {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.accept = accept;
  input.click();

  return new Promise((resolve) => {
    input.onchange = (e) => {
      const files = (e.currentTarget as HTMLInputElement).files;
      if (files) {
        resolve(Array.from(files));
        return;
      }
      resolve(null);
    };
  });
}
