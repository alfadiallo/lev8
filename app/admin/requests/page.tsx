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
  ChevronUp,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { ALL_MODULE_SLUGS, ROLE_DEFAULT_MODULES, type ModuleSlug } from '@/lib/permissions/checkAccess';

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
  created_user_id: string | null;
  program: { id: string; name: string; specialty: string } | null;
  reviewer: { id: string; full_name: string } | null;
}

type StatusFilter = 'pending' | 'approved' | 'rejected' | 'all';

const ROLE_OPTIONS = [
  { value: 'resident', label: 'Resident' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'program_director', label: 'Program Director' },
  { value: 'assistant_program_director', label: 'Assistant Program Director' },
  { value: 'clerkship_director', label: 'Clerkship Director' },
  { value: 'studio_creator', label: 'Studio Creator' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
];

const MODULE_LABELS: Record<ModuleSlug, string> = {
  learn: 'Learn',
  reflect: 'Reflect',
  understand: 'Understand',
  studio: 'Studio',
  truths: 'Truths',
  expectations: 'Expectations',
};

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  // Role + module overrides per request (keyed by request.id)
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});
  const [selectedModules, setSelectedModules] = useState<Record<string, ModuleSlug[]>>({});

  // Resend invite loading state
  const [resendingId, setResendingId] = useState<string | null>(null);

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

  // Initialize role/modules when expanding a pending request
  function handleExpand(request: AccessRequest) {
    const newId = expandedId === request.id ? null : request.id;
    setExpandedId(newId);

    if (newId && request.status === 'pending') {
      // Set default role from request if not already set
      if (!selectedRoles[request.id]) {
        const defaultRole = request.requested_role || 'resident';
        setSelectedRoles(prev => ({ ...prev, [request.id]: defaultRole }));
        // Pre-fill modules based on role
        const defaults = ROLE_DEFAULT_MODULES[defaultRole] || [];
        setSelectedModules(prev => ({ ...prev, [request.id]: [...defaults] }));
      }
    }
  }

  // When role changes, pre-fill module checkboxes from ROLE_DEFAULT_MODULES
  function handleRoleChange(requestId: string, newRole: string) {
    setSelectedRoles(prev => ({ ...prev, [requestId]: newRole }));
    const defaults = ROLE_DEFAULT_MODULES[newRole] || [];
    setSelectedModules(prev => ({ ...prev, [requestId]: [...defaults] }));
  }

  function toggleModule(requestId: string, slug: ModuleSlug) {
    setSelectedModules(prev => {
      const current = prev[requestId] || [];
      if (current.includes(slug)) {
        return { ...prev, [requestId]: current.filter(s => s !== slug) };
      } else {
        return { ...prev, [requestId]: [...current, slug] };
      }
    });
  }

  async function handleApprove(request: AccessRequest) {
    const role = selectedRoles[request.id] || request.requested_role;
    const modules = selectedModules[request.id] || [];

    if (!confirm(`Approve access for ${request.full_name} as ${role}?`)) return;
    
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
          role,
          allowed_modules: modules.length > 0 ? modules : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to approve request');
      }

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
    if (reason === null) return;
    
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

      await fetchRequests();
    } catch (error) {
      console.error('[Requests] Reject error:', error);
      alert(error instanceof Error ? error.message : 'Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleResendInvite(request: AccessRequest) {
    if (!confirm(`Re-send invite email to ${request.personal_email}?`)) return;

    setResendingId(request.id);
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(`/api/admin/requests/${request.id}/resend-invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to resend invite');
      }

      alert(`Invite re-sent to ${request.personal_email}.`);
    } catch (error) {
      console.error('[Requests] Resend invite error:', error);
      alert(error instanceof Error ? error.message : 'Failed to resend invite');
    } finally {
      setResendingId(null);
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
            const isResending = resendingId === request.id;
            
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
                  onClick={() => handleExpand(request)}
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

                    {/* --- Role & Module Selection (pending only) --- */}
                    {request.status === 'pending' && (
                      <div
                        className="p-4 rounded-xl space-y-4"
                        style={{ background: 'var(--theme-surface-hover)' }}
                      >
                        {/* Role dropdown */}
                        <div>
                          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--theme-text)' }}>
                            Role
                          </label>
                          <select
                            value={selectedRoles[request.id] || request.requested_role}
                            onChange={(e) => handleRoleChange(request.id, e.target.value)}
                            className="w-full sm:w-72 px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                            style={{
                              background: 'var(--theme-surface-solid)',
                              borderColor: 'var(--theme-border-solid)',
                              color: 'var(--theme-text)',
                            }}
                          >
                            {ROLE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                            Requested: {request.requested_role?.replace(/_/g, ' ') || '—'}
                          </p>
                        </div>

                        {/* Module checkboxes */}
                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-text)' }}>
                            Module Access
                          </label>
                          <div className="flex flex-wrap gap-3">
                            {ALL_MODULE_SLUGS.map((slug) => {
                              const checked = (selectedModules[request.id] || []).includes(slug);
                              return (
                                <label
                                  key={slug}
                                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm cursor-pointer border transition-colors"
                                  style={{
                                    background: checked ? 'var(--theme-primary-soft)' : 'var(--theme-surface-solid)',
                                    borderColor: checked ? 'var(--theme-primary)' : 'var(--theme-border-solid)',
                                    color: checked ? 'var(--theme-primary)' : 'var(--theme-text-muted)',
                                    fontWeight: checked ? 600 : 400,
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleModule(request.id, slug)}
                                    className="accent-[#0EA5E9] rounded"
                                  />
                                  {MODULE_LABELS[slug]}
                                </label>
                              );
                            })}
                          </div>
                          <p className="text-xs mt-1.5" style={{ color: 'var(--theme-text-muted)' }}>
                            Leave all unchecked to use default role-based access.
                          </p>
                        </div>
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

                    {/* Re-send invite (for approved requests) */}
                    {request.status === 'approved' && request.created_user_id && (
                      <div className="flex justify-end pt-4 border-t" style={{ borderColor: 'var(--theme-border-solid)' }}>
                        <Button
                          variant="secondary"
                          onClick={() => handleResendInvite(request)}
                          disabled={isResending}
                        >
                          {isResending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4 mr-2" />
                          )}
                          Re-send Invite
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
