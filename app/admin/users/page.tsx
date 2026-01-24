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
  X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

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

type RoleFilter = 'all' | 'resident' | 'core_faculty' | 'teaching_faculty' | 'program_director' | 'assistant_program_director' | 'clerkship_director' | 'super_admin';
type StatusFilter = 'all' | 'active' | 'suspended' | 'pending';

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

  // Check for action=create in URL (one-time on mount)
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setShowCreateModal(true);
      // Clear the URL param after opening
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
        // Handle faculty type filtering
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

  function getRoleBadge(role: string, facultyType?: 'core' | 'teaching' | null) {
    const colors: Record<string, { bg: string; text: string }> = {
      resident: { bg: 'bg-blue-100', text: 'text-blue-800' },
      core_faculty: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
      teaching_faculty: { bg: 'bg-teal-100', text: 'text-teal-800' },
      faculty: { bg: 'bg-green-100', text: 'text-green-800' },
      program_director: { bg: 'bg-purple-500', text: 'text-white' },
      assistant_program_director: { bg: 'bg-violet-100', text: 'text-violet-800' },
      clerkship_director: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
      super_admin: { bg: 'bg-red-100', text: 'text-red-800' },
    };
    
    const roleLabels: Record<string, string> = {
      resident: 'Resident',
      faculty: 'Faculty',
      core_faculty: 'Core Faculty',
      teaching_faculty: 'Teaching Faculty',
      program_director: 'Program Director',
      assistant_program_director: 'Asst. Program Director',
      clerkship_director: 'Clerkship Director',
      super_admin: 'Super Admin',
    };
    
    // Determine display role
    let displayRole = roleLabels[role] || role.replace(/_/g, ' ');
    let colorKey = role;
    
    // Handle faculty types
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
        {/* Search */}
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

        {/* Role Filter */}
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

        {/* Status Filter */}
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
                  <th className="text-left p-4 font-medium" style={{ color: 'var(--theme-text-muted)' }}>
                    User
                  </th>
                  <th className="text-left p-4 font-medium" style={{ color: 'var(--theme-text-muted)' }}>
                    Email
                  </th>
                  <th className="text-left p-4 font-medium" style={{ color: 'var(--theme-text-muted)' }}>
                    Specialty
                  </th>
                  <th className="text-left p-4 font-medium" style={{ color: 'var(--theme-text-muted)' }}>
                    Role
                  </th>
                  <th className="text-left p-4 font-medium" style={{ color: 'var(--theme-text-muted)' }}>
                    Status
                  </th>
                  <th className="text-right p-4 font-medium" style={{ color: 'var(--theme-text-muted)' }}>
                    Actions
                  </th>
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
                          <p 
                            className="font-medium"
                            style={{ color: 'var(--theme-text)' }}
                          >
                            {user.full_name || 'Unnamed'}
                          </p>
                          {user.institution && (
                            <p 
                              className="text-xs"
                              style={{ color: 'var(--theme-text-muted)' }}
                            >
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
                      {user.institutional_email && (
                        <p 
                          className="text-xs"
                          style={{ color: 'var(--theme-text-muted)' }}
                        >
                          {user.institutional_email}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <p style={{ color: 'var(--theme-text)' }}>
                        {user.specialty || '—'}
                      </p>
                    </td>
                    <td className="p-4">
                      {getRoleBadge(user.role, user.faculty_type)}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(user.account_status || 'active')}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
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

      {/* Create User Modal */}
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
              <h2 
                className="text-xl font-bold"
                style={{ color: 'var(--theme-text)' }}
              >
                Create New User
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-lg transition-colors hover:bg-gray-100"
              >
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
                <label 
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: 'var(--theme-text)' }}
                >
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
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              {createForm.role === 'faculty' && (
                <div className="w-full">
                  <label 
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: 'var(--theme-text)' }}
                  >
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
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={creating}
                >
                  {creating ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

