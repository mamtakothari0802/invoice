
import React, { useState, useCallback } from 'react';
import { UploadIcon, FileIcon, CheckCircleIcon, ExclamationCircleIcon, HourglassIcon } from './Icons';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
  files: { file: File; status: 'pending' | 'processing' | 'success' | 'error'; message?: string; }[];
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFilesSelected, isProcessing, files }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Fix: Explicitly type 'file' as File to access its properties, resolving 'Object is of type 'unknown'' error.
      const pdfFiles = Array.from(e.dataTransfer.files).filter((file: File) => file.type === 'application/pdf');
      onFilesSelected(pdfFiles);
    }
  }, [onFilesSelected]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Fix: Explicitly type 'file' as File to access its properties, resolving 'Object is of type 'unknown'' error.
      const pdfFiles = Array.from(e.target.files).filter((file: File) => file.type === 'application/pdf');
      onFilesSelected(pdfFiles);
    }
  };

  const StatusIcon = ({ status }: { status: 'pending' | 'processing' | 'success' | 'error' }) => {
    switch (status) {
        case 'processing': return <HourglassIcon className="w-5 h-5 text-yellow-500 animate-spin" />;
        case 'success': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
        case 'error': return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
        default: return <FileIcon className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-slate-50 hover:border-slate-400'}`}
      >
        <input
          type="file"
          id="file-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileChange}
          accept="application/pdf"
          multiple
          disabled={isProcessing}
        />
        <div className="flex flex-col items-center justify-center space-y-3 text-slate-600">
          <UploadIcon className="w-12 h-12 text-slate-400" />
          <p className="font-semibold">
            <label htmlFor="file-upload" className="text-indigo-600 hover:text-indigo-800 cursor-pointer">Click to upload</label> or drag and drop
          </p>
          <p className="text-sm text-slate-500">PDF files only</p>
        </div>
      </div>
      {files.length > 0 && (
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <h3 className="font-semibold mb-3 text-slate-700">Selected Files:</h3>
          <ul className="space-y-2">
            {files.map((fileStatus, index) => (
              <li key={index} className="flex items-center justify-between p-2 rounded-md bg-slate-50">
                <div className="flex items-center gap-3 truncate">
                  <StatusIcon status={fileStatus.status} />
                  <span className="text-sm text-slate-800 truncate" title={fileStatus.file.name}>{fileStatus.file.name}</span>
                </div>
                {fileStatus.status === 'error' && <p className="text-xs text-red-600 truncate ml-2" title={fileStatus.message}>{fileStatus.message}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
