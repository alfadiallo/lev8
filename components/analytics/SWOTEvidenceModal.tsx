// SWOT Evidence Modal - Display all supporting comments for a SWOT element
'use client';

import { useState, useEffect } from 'react';
import { X, Search, User, Calendar, FileText } from 'lucide-react';

interface Comment {
  id: string;
  comment_text: string;
  resident_name: string;
  faculty_name: string | null;
  date_completed: string;
  rotation_type: string | null;
  pgy_level: string | null;
  relevance_score?: number;
}

interface SWOTEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  swotElement: {
    theme?: string;
    description: string;
  };
  classYear?: number;
  periodLabel: string;
}

export default function SWOTEvidenceModal({
  isOpen,
  onClose,
  swotElement,
  classYear,
  periodLabel,
}: SWOTEvidenceModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [filteredComments, setFilteredComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const commentsPerPage = 50;

  // Fetch comments when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, classYear, periodLabel, swotElement.description]);

  // Filter comments based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredComments(comments);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = comments.filter(
        c =>
          c.comment_text.toLowerCase().includes(query) ||
          c.resident_name.toLowerCase().includes(query) ||
          (c.faculty_name && c.faculty_name.toLowerCase().includes(query))
      );
      setFilteredComments(filtered);
    }
    setCurrentPage(1); // Reset to first page when searching
  }, [searchQuery, comments]);

  const fetchComments = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        period_label: periodLabel,
        theme: swotElement.description,
      });

      if (classYear) {
        params.append('class_year', classYear.toString());
      }

      const response = await fetch(`/api/analytics/swot/evidence?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch supporting comments');
      }

      const data = await response.json();
      setComments(data.comments || []);
      setFilteredComments(data.comments || []);
    } catch (err: any) {
      console.error('Error fetching comments:', err);
      setError(err.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredComments.length / commentsPerPage);
  const startIndex = (currentPage - 1) * commentsPerPage;
  const endIndex = startIndex + commentsPerPage;
  const currentComments = filteredComments.slice(startIndex, endIndex);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex-1 pr-4">
            <h2 className="text-2xl font-bold text-neutral-800 mb-2">
              Supporting Evidence
            </h2>
            <p className="text-neutral-600 text-sm mb-1">
              {swotElement.theme || swotElement.description}
            </p>
            <p className="text-neutral-500 text-xs">
              {filteredComments.length} comment{filteredComments.length !== 1 ? 's' : ''} • {periodLabel}
              {classYear && ` • Class of ${classYear}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors p-2 -mr-2"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search comments, residents, or faculty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7EC8E3] focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#7EC8E3] border-t-transparent"></div>
              <p className="text-neutral-600 mt-4">Loading comments...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-2">Error loading comments</p>
              <p className="text-neutral-500 text-sm">{error}</p>
              <button
                onClick={fetchComments}
                className="mt-4 px-4 py-2 bg-[#7EC8E3] text-white rounded-lg hover:bg-[#6BB7D0] transition-colors"
              >
                Retry
              </button>
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-600">
                {searchQuery ? 'No comments match your search' : 'No comments found'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentComments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  {/* Comment Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <User size={16} className="text-[#7EC8E3]" />
                        <span className="font-semibold text-neutral-800">
                          {comment.resident_name}
                        </span>
                        {comment.pgy_level && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                            {comment.pgy_level}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-neutral-600">
                        {comment.faculty_name && (
                          <span className="flex items-center gap-1">
                            <FileText size={14} />
                            Evaluated by: {comment.faculty_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(comment.date_completed).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        {comment.rotation_type && (
                          <span className="text-xs text-neutral-500">
                            {comment.rotation_type}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Comment Text */}
                  <div className="pl-6 border-l-2 border-gray-300">
                    <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap">
                      {comment.comment_text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {!loading && !error && filteredComments.length > commentsPerPage && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-neutral-600">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredComments.length)} of{' '}
              {filteredComments.length}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


