'use client';

import { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { TruthCategory, CATEGORY_LABELS } from '@/lib/types/truths';
import { isValidFileType } from '@/lib/truths/storage';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadDocumentModal({ isOpen, onClose, onSuccess }: UploadDocumentModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TruthCategory>('policies');
  const [tags, setTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  
  if (!isOpen) return null;
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!isValidFileType(selectedFile)) {
        setError('Invalid file type. Please upload a PDF or Markdown file.');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError('');
      
      // Auto-populate title from filename if empty
      if (!title) {
        const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
        setTitle(nameWithoutExt.replace(/[-_]/g, ' '));
      }
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !title || !category) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setIsUploading(true);
      setError('');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('tags', tags);
      
      const response = await fetch('/api/truths', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload document');
      }
      
      // Reset form
      setFile(null);
      setTitle('');
      setDescription('');
      setCategory('policies');
      setTags('');
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900">Upload Document</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              File <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-[#7EC8E3] transition-colors">
              <input
                type="file"
                accept=".pdf,.md"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload size={32} className="text-neutral-400" />
                <span className="text-sm text-neutral-600">
                  {file ? file.name : 'Click to upload PDF or Markdown file'}
                </span>
                <span className="text-xs text-neutral-400">
                  Max file size: 50MB
                </span>
              </label>
            </div>
          </div>
          
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7EC8E3]"
              placeholder="e.g., ACGME Common Program Requirements"
            />
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7EC8E3]"
              placeholder="Brief description of the document..."
            />
          </div>
          
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TruthCategory)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7EC8E3]"
            >
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7EC8E3]"
              placeholder="e.g., acgme, residency, requirements (comma-separated)"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Separate multiple tags with commas
            </p>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !file || !title}
              className="px-6 py-2 bg-[#7EC8E3] text-white rounded-lg hover:bg-[#6BB8D3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


