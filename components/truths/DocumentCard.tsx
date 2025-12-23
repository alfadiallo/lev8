'use client';

import { TruthDocument } from '@/lib/types/truths';
import { getCategoryLabel, getCategoryStyle, formatFileSize } from '@/lib/truths/storage';
import { Download, Trash2, Bot, BarChart3, Hospital, Clipboard, FileText } from 'lucide-react';
import { useState } from 'react';

interface DocumentCardProps {
  document: TruthDocument;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}

export default function DocumentCard({ document, onDelete, canDelete = false }: DocumentCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const categoryStyle = getCategoryStyle(document.category);
  const categoryLabel = getCategoryLabel(document.category);
  
  // Map categories to Lucide icons
  const getCategoryIcon = () => {
    const iconProps = { size: 24, className: 'text-neutral-600' };
    switch (document.category) {
      case 'ai_protocols':
        return <Bot {...iconProps} />;
      case 'evaluation_rubrics':
        return <BarChart3 {...iconProps} />;
      case 'simulation_guidelines':
        return <Hospital {...iconProps} />;
      case 'policies':
        return <Clipboard {...iconProps} />;
      default:
        return <FileText {...iconProps} />;
    }
  };
  
  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      
      const response = await fetch(`/api/truths/${document.id}/download`);
      if (!response.ok) {
        throw new Error('Failed to download document');
      }
      
      const data = await response.json();
      
      // Open the signed URL in a new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download document');
    } finally {
      setIsDownloading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${document.title}"?`)) {
      return;
    }
    
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/truths/${document.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete document');
      }
      
      if (onDelete) {
        onDelete(document.id);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete document');
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Title and Icon */}
          <div className="flex items-center gap-2 mb-2">
            {getCategoryIcon()}
            <h3 className="text-lg font-semibold text-neutral-900 truncate">
              {document.title}
            </h3>
          </div>
          
          {/* Description */}
          {document.description && (
            <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
              {document.description}
            </p>
          )}
          
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
            <span
              className="px-2 py-1 rounded font-medium"
              style={{
                backgroundColor: `${categoryStyle.color}20`,
                color: categoryStyle.color
              }}
            >
              {categoryLabel}
            </span>
            <span className="uppercase">
              {document.file_type}
            </span>
            <span>{formatFileSize(document.file_size_bytes)}</span>
            <span>
              {new Date(document.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
          
          {/* Tags */}
          {document.tags && document.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {document.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 text-xs bg-neutral-100 text-neutral-600 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2 bg-[#7EC8E3] text-white rounded-lg hover:bg-[#6BB8D3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            <Download size={16} />
            {isDownloading ? 'Downloading...' : 'Download'}
          </button>
          
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              <Trash2 size={16} />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

