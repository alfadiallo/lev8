'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabaseClient } from '@/lib/supabase-client';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Mail,
  Phone,
  Building,
  GraduationCap,
  MessageSquare,
  Loader2,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';

interface AccessRequest {
  id: string;
  personal_email: string;
  institutional_email: string | null;
  full_name: string;
  phone: string | null;
  requested_role: string;
  program_id: string | null;
  medical_school: string | null;
  specialty: string | null;
  reason: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  admin_notes: string | null;
  program: { id: string; name: string; specialty: string } | null;
  reviewer: { id: string; full_name: string } | null;
}

type StatusFilter = 'pending' | 'approved' | 'rejected' | 'all';

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabaseClient
        .from('access_requests')
        .select(`
          *,
          program:programs(id, name, specialty),
          reviewer:user_profiles!access_requests_reviewed_by_fkey(id, full_name)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[Requests] Fetch error:', error);
        return;
      }

      setRequests(data || []);
    } catch (error) {
      console.error('[Requests] Error:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function handleApprove(request: AccessRequest) {
    if (!confirm(`Approve access for ${request.full_name}?`)) return;
    
    setProcessingId(request.id);
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(`/api/admin/requests/${request.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          admin_notes: adminNotes[request.id] || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to approve request');
      }

      // Refresh the list
      await fetchRequests();
      alert(`Account created for ${request.full_name}. Welcome email will be sent.`);
    } catch (error) {
      console.error('[Requests] Approve error:', error);
      alert(error instanceof Error ? error.message : 'Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(request: AccessRequest) {
    const reason = prompt('Reason for rejection (optional):');
    if (reason === null) return; // User cancelled
    
    setProcessingId(request.id);
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(`/api/admin/requests/${request.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          admin_notes: reason || adminNotes[request.id] || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reject request');
      }

      // Refresh the list
      await fetchRequests();
    } catch (error) {
      console.error('[Requests] Reject error:', error);
      alert(error instanceof Error ? error.message : 'Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return null;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 
            className="text-3xl font-bold"
            style={{ color: 'var(--theme-text)' }}
          >
            Access Requests
          </h1>
          <p style={{ color: 'var(--theme-text-muted)' }}>
            Review and manage user access requests
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            onClick={fetchRequests}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div 
        className="flex items-center gap-4 p-4 rounded-xl border"
        style={{
          background: 'var(--theme-surface-solid)',
          borderColor: 'var(--theme-border-solid)',
        }}
      >
        <Filter className="w-5 h-5" style={{ color: 'var(--theme-text-muted)' }} />
        <div className="flex gap-2">
          {(['pending', 'approved', 'rejected', 'all'] as StatusFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                background: statusFilter === status 
                  ? 'var(--theme-primary)' 
                  : 'transparent',
                color: statusFilter === status 
                  ? 'white' 
                  : 'var(--theme-text-muted)',
              }}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        <span 
          className="ml-auto text-sm"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          {requests.length} request{requests.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Request List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--theme-primary)' }} />
        </div>
      ) : requests.length === 0 ? (
        <div 
          className="text-center py-12 rounded-2xl border"
          style={{
            background: 'var(--theme-surface-solid)',
            borderColor: 'var(--theme-border-solid)',
            color: 'var(--theme-text-muted)',
          }}
        >
          <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No {statusFilter !== 'all' ? statusFilter : ''} requests</p>
          <p className="text-sm">
            {statusFilter === 'pending' 
              ? 'All caught up! No pending requests to review.'
              : 'No requests found with this filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const isExpanded = expandedId === request.id;
            const isProcessing = processingId === request.id;
            
            return (
              <div
                key={request.id}
                className="rounded-2xl border overflow-hidden transition-all duration-200"
                style={{
                  background: 'var(--theme-surface-solid)',
                  borderColor: isExpanded 
                    ? 'var(--theme-primary)' 
                    : 'var(--theme-border-solid)',
                }}
              >
                {/* Request Header */}
                <div 
                  className="flex items-center gap-4 p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : request.id)}
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
                    style={{ 
                      background: 'var(--theme-primary-soft)',
                      color: 'var(--theme-primary)'
                    }}
                  >
                    {request.full_name.charAt(0)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 
                        className="font-bold"
                        style={{ color: 'var(--theme-text)' }}
                      >
                        {request.full_name}
                      </h3>
                      {getStatusBadge(request.status)}
                    </div>
                    <p 
                      className="text-sm truncate"
                      style={{ color: 'var(--theme-text-muted)' }}
                    >
                      {request.personal_email}
                      {request.requested_role && ` · ${request.requested_role}`}
                    </p>
                  </div>

                  <div className="text-right">
                    <p 
                      className="text-sm"
                      style={{ color: 'var(--theme-text-muted)' }}
                    >
                      {formatDate(request.created_at)}
                    </p>
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5" style={{ color: 'var(--theme-text-muted)' }} />
                  ) : (
                    <ChevronDown className="w-5 h-5" style={{ color: 'var(--theme-text-muted)' }} />
                  )}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div 
                    className="border-t p-4 space-y-4"
                    style={{ borderColor: 'var(--theme-border-solid)' }}
                  >
                    {/* Contact Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4" style={{ color: 'var(--theme-text-muted)' }} />
                        <div>
                          <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                            Personal Email
                          </p>
                          <p style={{ color: 'var(--theme-text)' }}>
                            {request.personal_email}
                          </p>
                        </div>
                      </div>
                      
                      {request.institutional_email && (
                        <div className="flex items-center gap-3">
                          <Building className="w-4 h-4" style={{ color: 'var(--theme-text-muted)' }} />
                          <div>
                            <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                              Institutional Email
                            </p>
                            <p style={{ color: 'var(--theme-text)' }}>
                              {request.institutional_email}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {request.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4" style={{ color: 'var(--theme-text-muted)' }} />
                          <div>
                            <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                              Phone
                            </p>
                            <p style={{ color: 'var(--theme-text)' }}>
                              {request.phone}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {request.medical_school && (
                        <div className="flex items-center gap-3">
                          <GraduationCap className="w-4 h-4" style={{ color: 'var(--theme-text-muted)' }} />
                          <div>
                            <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                              Medical School
                            </p>
                            <p style={{ color: 'var(--theme-text)' }}>
                              {request.medical_school}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Reason */}
                    {request.reason && (
                      <div 
                        className="p-4 rounded-xl"
                        style={{ background: 'var(--theme-surface-hover)' }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="w-4 h-4" style={{ color: 'var(--theme-text-muted)' }} />
                          <p className="text-sm font-medium" style={{ color: 'var(--theme-text-muted)' }}>
                            Reason for Access
                          </p>
                        </div>
                        <p style={{ color: 'var(--theme-text)' }}>
                          {request.reason}
                        </p>
                      </div>
                    )}

                    {/* Admin Notes Input (for pending) */}
                    {request.status === 'pending' && (
                      <div>
                        <Textarea
                          label="Admin Notes (optional)"
                          placeholder="Add notes about this request..."
                          value={adminNotes[request.id] || ''}
                          onChange={(e) => setAdminNotes({
                            ...adminNotes,
                            [request.id]: e.target.value
                          })}
                          rows={2}
                        />
                      </div>
                    )}

                    {/* Review Info (for processed) */}
                    {request.status !== 'pending' && request.reviewer && (
                      <div 
                        className="p-4 rounded-xl"
                        style={{ background: 'var(--theme-surface-hover)' }}
                      >
                        <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                          {request.status === 'approved' ? 'Approved' : 'Rejected'} by{' '}
                          <span style={{ color: 'var(--theme-text)' }}>
                            {request.reviewer.full_name}
                          </span>
                          {' '}on {formatDate(request.reviewed_at!)}
                        </p>
                        {request.admin_notes && (
                          <p className="mt-2" style={{ color: 'var(--theme-text)' }}>
                            Notes: {request.admin_notes}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    {request.status === 'pending' && (
                      <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--theme-border-solid)' }}>
                        <Button
                          variant="danger"
                          onClick={() => handleReject(request)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4 mr-2" />
                          )}
                          Reject
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => handleApprove(request)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          Approve & Create Account
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

