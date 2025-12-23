'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Filter, 
  Calendar,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import Link from 'next/link';
import { 
  ActionItem, 
  ActionPriority, 
  ActionStatus,
  PRIORITY_CONFIG 
} from '@/lib/types/acgme';

const STATUS_STYLES: Record<ActionStatus, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  pending: { 
    label: 'Pending', 
    icon: <Clock size={16} />, 
    color: '#6B7280', 
    bgColor: '#F3F4F6' 
  },
  in_progress: { 
    label: 'In Progress', 
    icon: <AlertCircle size={16} />, 
    color: '#2563EB', 
    bgColor: '#DBEAFE' 
  },
  completed: { 
    label: 'Completed', 
    icon: <CheckCircle2 size={16} />, 
    color: '#059669', 
    bgColor: '#D1FAE5' 
  },
  cancelled: { 
    label: 'Cancelled', 
    icon: <Clock size={16} />, 
    color: '#9CA3AF', 
    bgColor: '#F9FAFB' 
  },
};

export default function ActionItemsPage() {
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>('active'); // 'active' = pending + in_progress
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  useEffect(() => {
    fetchActionItems();
  }, []);

  const fetchActionItems = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/expectations/action-items');
      if (!response.ok) {
        throw new Error('Failed to fetch action items');
      }

      const data = await response.json();
      setActionItems(data.actionItems || []);
    } catch (err) {
      console.error('Action items fetch error:', err);
      setError('Failed to load action items');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter action items
  const filteredItems = actionItems.filter(item => {
    // Status filter
    if (selectedStatus === 'active') {
      if (!['pending', 'in_progress'].includes(item.status)) return false;
    } else if (selectedStatus !== 'all' && item.status !== selectedStatus) {
      return false;
    }

    // Priority filter
    if (selectedPriority !== 'all' && item.priority !== selectedPriority) {
      return false;
    }

    return true;
  });

  // Sort by priority and due date
  const sortedItems = [...filteredItems].sort((a, b) => {
    const priorityOrder = ['urgent', 'high', 'medium', 'low'];
    const aPriority = priorityOrder.indexOf(a.priority);
    const bPriority = priorityOrder.indexOf(b.priority);
    if (aPriority !== bPriority) return aPriority - bPriority;
    
    // Then by due date
    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    return 0;
  });

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7EC8E3]"></div>
            <p className="mt-4 text-neutral-600">Loading action items...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-2">
            <Link href="/expectations" className="hover:text-[#7EC8E3]">Expectations</Link>
            <ChevronRight size={14} />
            <span>Action Items</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Action Items</h1>
              <p className="text-neutral-600">
                Track and manage remediation tasks for compliance gaps.
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#7EC8E3] text-white rounded-lg hover:bg-[#6BB8D3] transition-colors font-medium">
              <Plus size={18} />
              New Action Item
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg border border-neutral-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-500">Status:</span>
              <div className="flex gap-1">
                {['active', 'all', 'completed', 'cancelled'].map(status => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      selectedStatus === status
                        ? 'bg-[#7EC8E3] text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {status === 'active' ? 'Active' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-6 w-px bg-neutral-200" />

            {/* Priority Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-500">Priority:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setSelectedPriority('all')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    selectedPriority === 'all'
                      ? 'bg-[#7EC8E3] text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  All
                </button>
                {Object.entries(PRIORITY_CONFIG).map(([priority, config]) => (
                  <button
                    key={priority}
                    onClick={() => setSelectedPriority(priority)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors`}
                    style={{
                      backgroundColor: selectedPriority === priority ? config.color : config.bgColor,
                      color: selectedPriority === priority ? 'white' : config.color,
                    }}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-neutral-500">
          Showing {sortedItems.length} action items
        </div>

        {/* Action Items List */}
        {sortedItems.length === 0 ? (
          <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
            <CheckCircle2 size={48} className="mx-auto text-emerald-300 mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              {selectedStatus === 'active' ? 'No active action items' : 'No action items found'}
            </h3>
            <p className="text-neutral-600">
              {selectedStatus === 'active'
                ? 'Great job! All compliance tasks are up to date.'
                : 'Try adjusting your filters.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedItems.map((item) => {
              const statusStyle = STATUS_STYLES[item.status];
              const priorityConfig = PRIORITY_CONFIG[item.priority];
              const daysUntilDue = item.due_date ? getDaysUntilDue(item.due_date) : null;
              const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
              const isDueSoon = daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 7;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-lg border border-neutral-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Priority Indicator */}
                    <div
                      className="w-1 h-16 rounded-full"
                      style={{ backgroundColor: priorityConfig.color }}
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-medium text-neutral-900 mb-1">
                            {item.title}
                          </h3>
                          {item.description && (
                            <p className="text-sm text-neutral-600 line-clamp-2 mb-2">
                              {item.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            {/* Status */}
                            <span
                              className="flex items-center gap-1 px-2 py-1 rounded-full font-medium"
                              style={{
                                backgroundColor: statusStyle.bgColor,
                                color: statusStyle.color,
                              }}
                            >
                              {statusStyle.icon}
                              {statusStyle.label}
                            </span>

                            {/* Priority */}
                            <span
                              className="px-2 py-1 rounded-full font-medium"
                              style={{
                                backgroundColor: priorityConfig.bgColor,
                                color: priorityConfig.color,
                              }}
                            >
                              {priorityConfig.label}
                            </span>

                            {/* Due Date */}
                            {item.due_date && (
                              <span
                                className={`flex items-center gap-1 ${
                                  isOverdue
                                    ? 'text-red-600'
                                    : isDueSoon
                                    ? 'text-amber-600'
                                    : 'text-neutral-500'
                                }`}
                              >
                                <Calendar size={12} />
                                {isOverdue
                                  ? `${Math.abs(daysUntilDue!)} days overdue`
                                  : isDueSoon
                                  ? `Due in ${daysUntilDue} days`
                                  : new Date(item.due_date).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                              </span>
                            )}

                            {/* Assigned To */}
                            {item.assigned_user && (
                              <span className="flex items-center gap-1 text-neutral-500">
                                <User size={12} />
                                {item.assigned_user.full_name}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                          <MoreVertical size={18} className="text-neutral-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


