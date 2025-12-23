'use client';

import { useState, useEffect } from 'react';
import { Search, Upload, FileText } from 'lucide-react';
import { TruthDocument, TruthCategory, CATEGORY_LABELS } from '@/lib/types/truths';
import DocumentCard from '@/components/truths/DocumentCard';
import UploadDocumentModal from '@/components/truths/UploadDocumentModal';
import { useAuth } from '@/context/AuthContext';

export default function TruthsPage() {
  const { user, role } = useAuth();
  const [documents, setDocuments] = useState<TruthDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<TruthDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  const canUpload = role === 'super_admin';
  
  // Fetch documents
  useEffect(() => {
    fetchDocuments();
  }, []);
  
  // Filter documents when category or search changes
  useEffect(() => {
    filterDocuments();
  }, [documents, selectedCategory, searchQuery]);
  
  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch('/api/truths');
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };
  
  const filterDocuments = () => {
    let filtered = documents;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(query) ||
        doc.description?.toLowerCase().includes(query) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    setFilteredDocuments(filtered);
  };
  
  const handleDocumentDeleted = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };
  
  const handleUploadSuccess = () => {
    fetchDocuments();
  };
  
  return (
    <div>
        {/* Filters and Actions */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Category Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7EC8E3]"
              >
                <option value="all">All Categories</option>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7EC8E3]"
              />
            </div>
            
            {/* Upload Button */}
            {canUpload && (
              <div className="flex items-end">
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-2 bg-[#7EC8E3] text-white rounded-lg hover:bg-[#6BB8D3] transition-colors font-medium"
                >
                  <Upload size={20} />
                  Upload Document
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Document List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7EC8E3]"></div>
            <p className="mt-4 text-neutral-600">Loading documents...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700">{error}</p>
            <button
              onClick={fetchDocuments}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
            <FileText size={48} className="mx-auto text-neutral-300 mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              {searchQuery || selectedCategory !== 'all' ? 'No documents found' : 'No documents yet'}
            </h3>
            <p className="text-neutral-600">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Documents will appear here once they are uploaded'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDocuments.map((document) => (
              <DocumentCard
                key={document.id}
                document={document}
                onDelete={handleDocumentDeleted}
                canDelete={canUpload}
              />
            ))}
          </div>
        )}
        
        {/* Results Count */}
        {!isLoading && !error && filteredDocuments.length > 0 && (
          <div className="mt-6 text-center text-sm text-neutral-500">
            Showing {filteredDocuments.length} of {documents.length} document{documents.length !== 1 ? 's' : ''}
          </div>
        )}
      
      {/* Upload Modal */}
      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}

