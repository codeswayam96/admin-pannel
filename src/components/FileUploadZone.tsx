'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  X,
  FileImage,
  FileVideo,
  FileText,
  File,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface UploadedFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  url?: string;
}

interface FileUploadZoneProps {
  onUpload: (files: File[]) => Promise<string[]>;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;
  className?: string;
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return FileImage;
  if (type.startsWith('video/')) return FileVideo;
  if (type.startsWith('text/') || type.includes('pdf')) return FileText;
  return File;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function FileUploadZone({
  onUpload,
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
    'video/*': ['.mp4', '.webm', '.mov'],
    'application/pdf': ['.pdf'],
  },
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  className = '',
}: FileUploadZoneProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      // Handle rejected files
      rejectedFiles.forEach((rejection) => {
        const error = rejection.errors[0]?.message || 'File rejected';
        setUploadedFiles((prev) => [
          ...prev,
          {
            file: rejection.file,
            id: Math.random().toString(36).substr(2, 9),
            progress: 0,
            status: 'error',
            error,
          },
        ]);
      });

      // Add accepted files to the list
      const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        progress: 0,
        status: 'pending' as const,
      }));

      setUploadedFiles((prev) => [...prev, ...newFiles]);

      // Start upload
      setIsUploading(true);

      try {
        // Simulate progress for each file
        for (const uploadFile of newFiles) {
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id ? { ...f, status: 'uploading' as const } : f
            )
          );

          // Simulate upload progress
          for (let progress = 0; progress <= 100; progress += 20) {
            await new Promise((resolve) => setTimeout(resolve, 200));
            setUploadedFiles((prev) =>
              prev.map((f) => (f.id === uploadFile.id ? { ...f, progress } : f))
            );
          }
        }

        // Actual upload
        const urls = await onUpload(acceptedFiles);

        // Update file statuses
        newFiles.forEach((uploadFile, index) => {
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? { ...f, status: 'success' as const, progress: 100, url: urls[index] }
                : f
            )
          );
        });
      } catch (error) {
        // Mark all as error
        newFiles.forEach((uploadFile) => {
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? { ...f, status: 'error' as const, error: 'Upload failed' }
                : f
            )
          );
        });
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } =
    useDropzone({
      onDrop,
      accept,
      maxFiles,
      maxSize,
    });

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearAll = () => {
    setUploadedFiles([]);
  };

  return (
    <div className={className}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-300 ease-in-out
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${isDragAccept ? 'border-green-500 bg-green-500/5' : ''}
          ${isDragReject ? 'border-red-500 bg-red-500/5' : ''}
          hover:border-primary hover:bg-primary/5
        `}
      >
        <input {...getInputProps()} />

        <motion.div
          initial={false}
          animate={{ scale: isDragActive ? 1.05 : 1 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center gap-4"
        >
          <div
            className={`
              w-16 h-16 rounded-full flex items-center justify-center
              ${isDragAccept ? 'bg-green-500/10 text-green-500' : ''}
              ${isDragReject ? 'bg-red-500/10 text-red-500' : ''}
              ${!isDragActive ? 'bg-muted text-muted-foreground' : ''}
            `}
          >
            <Upload className="h-8 w-8" />
          </div>

          <div>
            <p className="text-lg font-medium">
              {isDragActive
                ? isDragAccept
                  ? 'Drop files here'
                  : 'Some files will be rejected'
                : 'Drag & drop files here'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            Max {maxFiles} files, up to {formatFileSize(maxSize)} each
          </p>
        </motion.div>
      </div>

      {/* File List */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {uploadedFiles.length} file(s)
              </p>
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Clear all
              </Button>
            </div>

            {uploadedFiles.map((uploadFile) => {
              const FileIcon = getFileIcon(uploadFile.file.type);

              return (
                <motion.div
                  key={uploadFile.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border"
                >
                  {/* File Icon */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-background flex items-center justify-center">
                    <FileIcon className="h-5 w-5 text-muted-foreground" />
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {uploadFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploadFile.file.size)}
                    </p>

                    {/* Progress bar */}
                    {uploadFile.status === 'uploading' && (
                      <Progress value={uploadFile.progress} className="h-1 mt-2" />
                    )}

                    {/* Error message */}
                    {uploadFile.status === 'error' && uploadFile.error && (
                      <p className="text-xs text-red-500 mt-1">{uploadFile.error}</p>
                    )}
                  </div>

                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {uploadFile.status === 'uploading' && (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    )}
                    {uploadFile.status === 'success' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {uploadFile.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    {uploadFile.status === 'pending' && (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/25" />
                    )}
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() => removeFile(uploadFile.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
