'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';
import { 
  Users,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  UserPlus,
  CheckCircle,
  XCircle,
  X,
  Pencil,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ALL_MODULE_SLUGS, ROLE_DEFAULT_MODULES, type ModuleSlug } from '@/lib/permissions/checkAccess';

interface UserProfile {
  id: string;
  email: string;
  personal_email: string | null;
  institutional_email: string | null;
  full_name: string;
  display_name: string | null;
  phone: string | null;
  role: string;
  faculty_type: 'core' | 'teaching' | null;
  specialty: string | null;
  account_status: string;
  is_active: boolean;
  allowed_modules: string[] | null;
  created_at: string;
  institution: { id: string; name: string } | null;
}

interface CreateUserForm {
  full_name: string;
  personal_email: string;
  institutional_email: string;
  phone: string;
  role: string;
  faculty_type?: 'core' | 'teaching';
  send_invite: boolean;
}

interface EditUserForm {
  full_name: string;
  display_name: string;
  personal_email: string;
  institutional_email: string;
  phone: string;
  role: string;
  specialty: string;
  account_status: string;
  allowed_modules: ModuleSlug[];
}

type RoleFilter = 'all' | 'resident' | 'core_faculty' | 'teaching_faculty' | 'program_director' | 'assistant_program_director' | 'clerkship_director' | 'super_admin';
type StatusFilter = 'all' | 'active' | 'suspended' | 'pending';

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

export default function AdminUsersPage() {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    full_name: '',
    personal_email: '',
    institutional_email: '',
    phone: '',
    role: 'resident',
    faculty_type: 'core',
    send_invite: true,
  });
  const [creating, setCreating] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Edit modal state
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState<EditUserForm | null>(null);
  const [saving, setSaving] = useState(false);

  // Resend invite state
  const [resendingId, setResendingId] = useState<string | null>(null);

  // Check for action=create in URL (one-time on mount)
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setShowCreateModal(true);
      window.history.replaceState({}, '', '/admin/users');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabaseClient
        .from('user_profiles')
        .select(`
          *,
          institution:health_systems(id, name)
        `)
        .order('created_at', { ascending: false });

      if (roleFilter !== 'all') {
        if (roleFilter === 'core_faculty') {
          query = query.eq('role', 'faculty').eq('faculty_type', 'core');
        } else if (roleFilter === 'teaching_faculty') {
          query = query.eq('role', 'faculty').eq('faculty_type', 'teaching');
        } else {
          query = query.eq('role', roleFilter);
        }
      }

      if (statusFilter !== 'all') {
        query = query.eq('account_status', statusFilter);
      }

      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,personal_email.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[Users] Fetch error:', error);
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('[Users] Error:', error);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // --- Create User ---
  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(createForm),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create user');
      }

      await res.json();
      alert(`User created successfully! ${createForm.send_invite ? 'Invite email sent.' : ''}`);
      setShowCreateModal(false);
      setCreateForm({
        full_name: '',
        personal_email: '',
        institutional_email: '',
        phone: '',
        role: 'resident',
        send_invite: true,
      });
      fetchUsers();
    } catch (error) {
      console.error('[Users] Create error:', error);
      alert(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setCreating(false);
    }
  }

  // --- Suspend / Reactivate ---
  async function handleSuspendUser(user: UserProfile) {
    const action = user.account_status === 'suspended' ? 'reactivate' : 'suspend';
    if (!confirm(`Are you sure you want to ${action} ${user.full_name}?`)) return;

    setProcessingId(user.id);
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(`/api/admin/users/${user.id}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${action} user`);
      }

      fetchUsers();
    } catch (error) {
      console.error(`[Users] ${action} error:`, error);
      alert(error instanceof Error ? error.message : `Failed to ${action} user`);
    } finally {
      setProcessingId(null);
    }
  }

  // --- Edit User ---
  function openEditModal(user: UserProfile) {
    setEditingUser(user);
    const currentModules = (user.allowed_modules || []) as ModuleSlug[];
    setEditForm({
      full_name: user.full_name || '',
      display_name: user.display_name || '',
      personal_email: user.personal_email || user.email || '',
      institutional_email: user.institutional_email || '',
      phone: user.phone || '',
      role: user.role || 'resident',
      specialty: user.specialty || '',
      account_status: user.account_status || 'active',
      allowed_modules: currentModules.length > 0 ? currentModules : [],
    });
  }

  function handleEditRoleChange(newRole: string) {
    if (!editForm) return;
    const defaults = (ROLE_DEFAULT_MODULES[newRole] || []) as ModuleSlug[];
    setEditForm({ ...editForm, role: newRole, allowed_modules: [...defaults] });
  }

  function toggleEditModule(slug: ModuleSlug) {
    if (!editForm) return;
    const current = editForm.allowed_modules;
    if (current.includes(slug)) {
      setEditForm({ ...editForm, allowed_modules: current.filter(s => s !== slug) });
    } else {
      setEditForm({ ...editForm, allowed_modules: [...current, slug] });
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser || !editForm) return;
    setSaving(true);

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          full_name: editForm.full_name,
          display_name: editForm.display_name || null,
          personal_email: editForm.personal_email,
          institutional_email: editForm.institutional_email || null,
          phone: editForm.phone || null,
          role: editForm.role,
          specialty: editForm.specialty || null,
          account_status: editForm.account_status,
          allowed_modules: editForm.allowed_modules.length > 0 ? editForm.allowed_modules : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update user');
      }

      alert(`Profile updated for ${editForm.full_name}.`);
      setEditingUser(null);
      setEditForm(null);
      fetchUsers();
    } catch (error) {
      console.error('[Users] Edit error:', error);
      alert(error instanceof Error ? error.message : 'Failed to update user');
    } finally {
      setSaving(false);
    }
  }

  // --- Resend Invite / Password Reset ---
  async function handleResendInvite(user: UserProfile) {
    if (!confirm(`Send password reset email to ${user.personal_email || user.email}?`)) return;

    setResendingId(user.id);
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(`/api/admin/users/${user.id}/resend-invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send password reset email');
      }

      alert(`Password reset email sent to ${user.personal_email || user.email}.`);
    } catch (error) {
      console.error('[Users] Resend invite error:', error);
      alert(error instanceof Error ? error.message : 'Failed to send email');
    } finally {
      setResendingId(null);
    }
  }

  // --- UI Helpers ---
  function getRoleBadge(role: string, facultyType?: 'core' | 'teaching' | null) {
    const colors: Record<string, { bg: string; text: string }> = {
      resident: { bg: 'bg-blue-100', text: 'text-blue-800' },
      core_faculty: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
      teaching_faculty: { bg: 'bg-teal-100', text: 'text-teal-800' },
      faculty: { bg: 'bg-green-100', text: 'text-green-800' },
      program_director: { bg: 'bg-purple-500', text: 'text-white' },
      assistant_program_director: { bg: 'bg-violet-100', text: 'text-violet-800' },
      clerkship_director: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
      studio_creator: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
      super_admin: { bg: 'bg-red-100', text: 'text-red-800' },
      admin: { bg: 'bg-orange-100', text: 'text-orange-800' },
    };
    
    const roleLabels: Record<string, string> = {
      resident: 'Resident',
      faculty: 'Faculty',
      core_faculty: 'Core Faculty',
      teaching_faculty: 'Teaching Faculty',
      program_director: 'Program Director',
      assistant_program_director: 'Asst. Program Director',
      clerkship_director: 'Clerkship Director',
      studio_creator: 'Studio Creator',
      super_admin: 'Super Admin',
      admin: 'Admin',
    };
    
    let displayRole = roleLabels[role] || role.replace(/_/g, ' ');
    let colorKey = role;
    
    if (role === 'faculty') {
      if (facultyType === 'core') {
        displayRole = 'Core Faculty';
        colorKey = 'core_faculty';
      } else if (facultyType === 'teaching') {
        displayRole = 'Teaching Faculty';
        colorKey = 'teaching_faculty';
      } else {
        displayRole = 'Core Faculty';
        colorKey = 'core_faculty';
      }
    }
    
    const color = colors[colorKey] || { bg: 'bg-gray-100', text: 'text-gray-800' };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${color.bg} ${color.text}`}>
        {displayRole}
      </span>
    );
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" /> Active
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" /> Suspended
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
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
            User Management
          </h1>
          <p style={{ color: 'var(--theme-text-muted)' }}>
            Manage user accounts and permissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            onClick={fetchUsers}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="primary"
            onClick={() => setShowCreateModal(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Create User
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div 
        className="flex flex-wrap items-center gap-4 p-4 rounded-xl border"
        style={{
          background: 'var(--theme-surface-solid)',
          borderColor: 'var(--theme-border-solid)',
        }}
      >
        <div className="relative flex-1 min-w-[200px]">
          <Search 
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" 
            style={{ color: 'var(--theme-text-muted)' }} 
          />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2"
            style={{
              borderColor: 'var(--theme-border-solid)',
              background: 'var(--theme-surface-solid)',
              color: 'var(--theme-text)',
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" style={{ color: 'var(--theme-text-muted)' }} />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
            className="px-3 py-2 rounded-lg border text-sm"
            style={{
              borderColor: 'var(--theme-border-solid)',
              background: 'var(--theme-surface-solid)',
              color: 'var(--theme-text)',
            }}
          >
            <option value="all">All Roles</option>
            <option value="resident">Residents</option>
            <option value="core_faculty">Core Faculty</option>
            <option value="teaching_faculty">Teaching Faculty</option>
            <option value="program_director">Program Director</option>
            <option value="assistant_program_director">Assistant Program Director</option>
            <option value="clerkship_director">Clerkship Director</option>
            <option value="super_admin">Super Admins</option>
          </select>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="px-3 py-2 rounded-lg border text-sm"
          style={{
            borderColor: 'var(--theme-border-solid)',
            background: 'var(--theme-surface-solid)',
            color: 'var(--theme-text)',
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="pending">Pending</option>
        </select>

        <span 
          className="text-sm"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          {users.length} user{users.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* User Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--theme-primary)' }} />
        </div>
      ) : users.length === 0 ? (
        <div 
          className="text-center py-12 rounded-2xl border"
          style={{
            background: 'var(--theme-surface-solid)',
            borderColor: 'var(--theme-border-solid)',
            color: 'var(--theme-text-muted)',
          }}
        >
          <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No users found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div 
          className="rounded-2xl border overflow-hidden"
          style={{
            background: 'var(--theme-surface-solid)',
            borderColor: 'var(--theme-border-solid)',
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr 
                  className="border-b"
                  style={{ borderColor: 'var(--theme-border-solid)' }}
                >
                  <th className="text-left p-4 font-medium" style={{ color: 'var(--theme-text-muted)' }}>User</th>
                  <th className="text-left p-4 font-medium" style={{ color: 'var(--theme-text-muted)' }}>Email</th>
                  <th className="text-left p-4 font-medium" style={{ color: 'var(--theme-text-muted)' }}>Role</th>
                  <th className="text-left p-4 font-medium" style={{ color: 'var(--theme-text-muted)' }}>Modules</th>
                  <th className="text-left p-4 font-medium" style={{ color: 'var(--theme-text-muted)' }}>Status</th>
                  <th className="text-right p-4 font-medium" style={{ color: 'var(--theme-text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr 
                    key={user.id}
                    className="border-b transition-colors"
                    style={{ borderColor: 'var(--theme-border-solid)' }}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                          style={{ 
                            background: 'var(--theme-primary-soft)',
                            color: 'var(--theme-primary)'
                          }}
                        >
                          {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: 'var(--theme-text)' }}>
                            {user.full_name || 'Unnamed'}
                          </p>
                          {user.institution && (
                            <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                              {user.institution.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p style={{ color: 'var(--theme-text)' }}>
                        {user.personal_email || user.email}
                      </p>
                    </td>
                    <td className="p-4">
                      {getRoleBadge(user.role, user.faculty_type)}
                    </td>
                    <td className="p-4">
                      {user.allowed_modules && user.allowed_modules.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.allowed_modules.map(slug => (
                            <span
                              key={slug}
                              className="text-xs px-1.5 py-0.5 rounded bg-sky-50 text-sky-700"
                            >
                              {MODULE_LABELS[slug as ModuleSlug] || slug}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                          Role default
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(user.account_status || 'active')}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit */}
                        <button
                          title="Edit user"
                          onClick={() => openEditModal(user)}
                          className="p-2 rounded-lg transition-colors hover:bg-gray-100"
                        >
                          <Pencil className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                        </button>

                        {/* Resend invite / password reset */}
                        <button
                          title="Send password reset email"
                          onClick={() => handleResendInvite(user)}
                          disabled={resendingId === user.id}
                          className="p-2 rounded-lg transition-colors hover:bg-gray-100 disabled:opacity-50"
                        >
                          {resendingId === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--theme-text-muted)' }} />
                          ) : (
                            <Send className="w-4 h-4" style={{ color: 'var(--theme-text-muted)' }} />
                          )}
                        </button>

                        {/* Suspend / Reactivate */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSuspendUser(user)}
                          disabled={processingId === user.id}
                        >
                          {processingId === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : user.account_status === 'suspended' ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== Create User Modal ==================== */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            className="w-full max-w-lg mx-4 rounded-2xl p-6 shadow-xl"
            style={{ background: 'var(--theme-surface-solid)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: 'var(--theme-text)' }}>
                Create New User
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-lg transition-colors hover:bg-gray-100">
                <X className="w-5 h-5" style={{ color: 'var(--theme-text-muted)' }} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <Input
                label="Full Name *"
                type="text"
                value={createForm.full_name}
                onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                placeholder="Dr. Jane Smith"
                required
              />
              <Input
                label="Personal Email *"
                type="email"
                value={createForm.personal_email}
                onChange={(e) => setCreateForm({ ...createForm, personal_email: e.target.value })}
                placeholder="jane.smith@gmail.com"
                required
              />
              <Input
                label="Institutional Email"
                type="email"
                value={createForm.institutional_email}
                onChange={(e) => setCreateForm({ ...createForm, institutional_email: e.target.value })}
                placeholder="jsmith@hospital.org"
              />
              <Input
                label="Phone"
                type="tel"
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />

              <div className="w-full">
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--theme-text)' }}>
                  Role *
                </label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  required
                  className="w-full rounded-xl border px-4 py-2.5"
                  style={{
                    borderColor: 'var(--theme-border-solid)',
                    background: 'var(--theme-surface-solid)',
                    color: 'var(--theme-text)',
                  }}
                >
                  <option value="resident">Resident</option>
                  <option value="faculty">Faculty</option>
                  <option value="program_director">Program Director</option>
                  <option value="assistant_program_director">Assistant Program Director</option>
                  <option value="clerkship_director">Clerkship Director</option>
                  <option value="studio_creator">Studio Creator</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              {createForm.role === 'faculty' && (
                <div className="w-full">
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--theme-text)' }}>
                    Faculty Type *
                  </label>
                  <select
                    value={createForm.faculty_type || 'core'}
                    onChange={(e) => setCreateForm({ ...createForm, faculty_type: e.target.value as 'core' | 'teaching' })}
                    required
                    className="w-full rounded-xl border px-4 py-2.5"
                    style={{
                      borderColor: 'var(--theme-border-solid)',
                      background: 'var(--theme-surface-solid)',
                      color: 'var(--theme-text)',
                    }}
                  >
                    <option value="core">Core Faculty</option>
                    <option value="teaching">Teaching Faculty</option>
                  </select>
                </div>
              )}

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createForm.send_invite}
                  onChange={(e) => setCreateForm({ ...createForm, send_invite: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span style={{ color: 'var(--theme-text)' }}>
                  Send invite email with password setup link
                </span>
              </label>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={creating}>
                  {creating ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== Edit User Modal ==================== */}
      {editingUser && editForm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => { setEditingUser(null); setEditForm(null); }}
        >
          <div 
            className="w-full max-w-lg mx-4 rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            style={{ background: 'var(--theme-surface-solid)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: 'var(--theme-text)' }}>
                Edit User
              </h2>
              <button onClick={() => { setEditingUser(null); setEditForm(null); }} className="p-2 rounded-lg transition-colors hover:bg-gray-100">
                <X className="w-5 h-5" style={{ color: 'var(--theme-text-muted)' }} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                required
              />
              <Input
                label="Display Name"
                type="text"
                value={editForm.display_name}
                onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                placeholder="Nickname or first name"
              />
              <Input
                label="Personal Email"
                type="email"
                value={editForm.personal_email}
                onChange={(e) => setEditForm({ ...editForm, personal_email: e.target.value })}
                required
              />
              <Input
                label="Institutional Email"
                type="email"
                value={editForm.institutional_email}
                onChange={(e) => setEditForm({ ...editForm, institutional_email: e.target.value })}
              />
              <Input
                label="Phone"
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
              <Input
                label="Specialty"
                type="text"
                value={editForm.specialty}
                onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })}
                placeholder="e.g. Emergency Medicine"
              />

              {/* Role */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--theme-text)' }}>
                  Role
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => handleEditRoleChange(e.target.value)}
                  className="w-full rounded-xl border px-4 py-2.5"
                  style={{
                    borderColor: 'var(--theme-border-solid)',
                    background: 'var(--theme-surface-solid)',
                    color: 'var(--theme-text)',
                  }}
                >
                  {ROLE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Module access checkboxes */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-text)' }}>
                  Module Access
                </label>
                <div className="flex flex-wrap gap-3">
                  {ALL_MODULE_SLUGS.map(slug => {
                    const checked = editForm.allowed_modules.includes(slug);
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
                          onChange={() => toggleEditModule(slug)}
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

              {/* Account status */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--theme-text)' }}>
                  Account Status
                </label>
                <select
                  value={editForm.account_status}
                  onChange={(e) => setEditForm({ ...editForm, account_status: e.target.value })}
                  className="w-full rounded-xl border px-4 py-2.5"
                  style={{
                    borderColor: 'var(--theme-border-solid)',
                    background: 'var(--theme-surface-solid)',
                    color: 'var(--theme-text)',
                  }}
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* Read-only info */}
              <div className="pt-2 space-y-1 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                <p>User ID: {editingUser.id}</p>
                <p>Auth email: {editingUser.email}</p>
                <p>Created: {new Date(editingUser.created_at).toLocaleDateString()}</p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={() => { setEditingUser(null); setEditForm(null); }}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
