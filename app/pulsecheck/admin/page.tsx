'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Building2, 
  Briefcase, 
  Users, 
  UserCog,
  Plus,
  Upload,
  Download,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  X,
  Settings,
  Save
} from 'lucide-react';
import { usePulseCheckUserContext } from '@/context/PulseCheckUserContext';

// Purple color palette
const COLORS = {
  lightest: '#EDE9FE',
  light: '#DDD6FE',
  mediumLight: '#C4B5FD',
  medium: '#A78BFA',
  mediumDark: '#8B5CF6',
  dark: '#7C3AED',
  darker: '#6D28D9',
  veryDark: '#5B21B6',
  darkest: '#4C1D95',
};

type TabType = 'sites' | 'departments' | 'directors' | 'providers' | 'settings';

interface Site {
  id: string;
  name: string;
  region: string | null;
  is_active: boolean;
}

interface Department {
  id: string;
  site_id: string;
  name: string;
  specialty: string | null;
  is_active: boolean;
}

interface Director {
  id: string;
  department_id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

interface Provider {
  id: string;
  name: string;
  email: string;
  provider_type: string;
  credential: string | null;
  primary_department_id: string;
  primary_director_id: string | null;
  is_active: boolean;
}

interface Healthsystem {
  id: string;
  name: string;
  default_frequency: 'quarterly' | 'biannually' | 'annually';
  default_cycle_start_month: number;
}

interface SiteWithSettings extends Site {
  frequency_override: 'quarterly' | 'biannually' | 'annually' | null;
  cycle_start_month_override: number | null;
  healthsystem_id: string | null;
}

export default function PulseCheckAdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: isUserLoading, isAuthenticated, login, isAdminAssistant } = usePulseCheckUserContext();

  const [activeTab, setActiveTab] = useState<TabType>('sites');
  const [sites, setSites] = useState<SiteWithSettings[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [directors, setDirectors] = useState<Director[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [healthsystem, setHealthsystem] = useState<Healthsystem | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [editingItem, setEditingItem] = useState<unknown>(null);

  // Auto-login if email in URL
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam && !isAuthenticated && !isUserLoading) {
      login(emailParam);
    }
  }, [searchParams, isAuthenticated, isUserLoading, login]);

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sitesRes, deptsRes, directorsRes, providersRes, settingsRes] = await Promise.all([
          fetch('/api/pulsecheck/admin/sites'),
          fetch('/api/pulsecheck/admin/departments'),
          fetch('/api/pulsecheck/admin/directors'),
          fetch('/api/pulsecheck/providers'),
          fetch('/api/pulsecheck/admin/settings'),
        ]);

        const sitesData = await sitesRes.json();
        const deptsData = await deptsRes.json();
        const directorsData = await directorsRes.json();
        const providersData = await providersRes.json();
        const settingsData = await settingsRes.json();

        setSites(sitesData.sites || []);
        setDepartments(deptsData.departments || []);
        setDirectors(directorsData.directors || []);
        setProviders(providersData.providers || []);
        if (settingsData.healthsystem) {
          setHealthsystem(settingsData.healthsystem);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const emailParam = user?.email ? `?email=${encodeURIComponent(user.email)}` : '';

  const tabs = [
    { id: 'sites' as TabType, label: 'Sites', icon: Building2, count: sites.length },
    { id: 'departments' as TabType, label: 'Departments', icon: Briefcase, count: departments.length },
    { id: 'directors' as TabType, label: 'Directors', icon: UserCog, count: directors.length },
    { id: 'providers' as TabType, label: 'Providers', icon: Users, count: providers.length },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings, count: null },
  ];

  const handleDownloadTemplate = () => {
    const csvContent = "Name,Email,Provider Type (physician/apc),Credential,Site,Department\n";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pulsecheck_provider_template.csv';
    a.click();
  };

  if (isLoading || isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div 
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: COLORS.dark }}
        />
      </div>
    );
  }

  if (!isAdminAssistant) {
    return (
      <div className="max-w-xl mx-auto text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-600 mb-6">
          You do not have permission to access the admin area.
        </p>
        <button
          onClick={() => router.push(`/pulsecheck/dashboard${emailParam}`)}
          className="text-white px-6 py-2 rounded-lg font-medium"
          style={{ backgroundColor: COLORS.dark }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push(`/pulsecheck/dashboard${emailParam}`)}
          className="text-sm text-slate-500 hover:text-slate-700 mb-2 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
        <p className="text-slate-600">Manage sites, departments, directors, and providers</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="p-4 rounded-lg flex items-center gap-3 bg-green-50 text-green-700">
          <CheckCircle className="w-5 h-5" />
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-lg flex items-center gap-3 bg-red-50 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b" style={{ borderColor: COLORS.light }}>
        <div className="flex gap-1 -mb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-current'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
                style={activeTab === tab.id ? { color: COLORS.dark } : {}}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== null && (
                  <span 
                    className="px-2 py-0.5 rounded-full text-xs"
                    style={{ backgroundColor: COLORS.lightest, color: COLORS.darker }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions Bar - Hide for settings tab */}
      {activeTab !== 'settings' && (
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
              style={{ borderColor: COLORS.light }}
            />
          </div>
          <div className="flex gap-2">
            {activeTab === 'providers' && (
              <>
                <button
                  onClick={handleDownloadTemplate}
                  className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                  style={{ backgroundColor: COLORS.lightest, color: COLORS.darker }}
                >
                  <Download className="w-4 h-4" />
                  Template
                </button>
                <button
                  onClick={() => router.push(`/pulsecheck/admin/import${emailParam}`)}
                  className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                  style={{ backgroundColor: COLORS.lightest, color: COLORS.darker }}
                >
                  <Upload className="w-4 h-4" />
                  Import
                </button>
              </>
            )}
            <button
              onClick={() => {
                setModalType('add');
                setEditingItem(null);
                setShowModal(true);
              }}
              className="px-4 py-2 text-white rounded-lg text-sm font-medium flex items-center gap-2"
              style={{ backgroundColor: COLORS.dark }}
            >
              <Plus className="w-4 h-4" />
              Add {activeTab.slice(0, -1)}
            </button>
          </div>
        </div>
      )}

      {/* Content Tables */}
      <div 
        className="bg-white rounded-xl border overflow-hidden"
        style={{ borderColor: COLORS.light }}
      >
        {activeTab === 'sites' && (
          <SitesTable 
            sites={sites.filter(s => 
              s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              s.region?.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            onEdit={(site) => {
              setEditingItem(site);
              setModalType('edit');
              setShowModal(true);
            }}
          />
        )}
        
        {activeTab === 'departments' && (
          <DepartmentsTable 
            departments={departments.filter(d => 
              d.name.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            sites={sites}
            onEdit={(dept) => {
              setEditingItem(dept);
              setModalType('edit');
              setShowModal(true);
            }}
          />
        )}
        
        {activeTab === 'directors' && (
          <DirectorsTable 
            directors={directors.filter(d => 
              d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              d.email.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            departments={departments}
            onEdit={(dir) => {
              setEditingItem(dir);
              setModalType('edit');
              setShowModal(true);
            }}
          />
        )}
        
        {activeTab === 'providers' && (
          <ProvidersTable 
            providers={providers.filter(p => 
              p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.email.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            departments={departments}
            directors={directors}
            onEdit={(prov) => {
              setEditingItem(prov);
              setModalType('edit');
              setShowModal(true);
            }}
          />
        )}
      </div>

      {/* Settings Tab Content */}
      {activeTab === 'settings' && (
        <SettingsPanel
          healthsystem={healthsystem}
          sites={sites}
          isSaving={isSaving}
          onSave={async (updates) => {
            setIsSaving(true);
            setError('');
            try {
              const res = await fetch('/api/pulsecheck/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
              });
              if (!res.ok) throw new Error('Failed to save settings');
              const data = await res.json();
              if (data.healthsystem) setHealthsystem(data.healthsystem);
              if (data.sites) setSites(prev => {
                const updatedSites = [...prev];
                data.sites.forEach((updated: SiteWithSettings) => {
                  const idx = updatedSites.findIndex(s => s.id === updated.id);
                  if (idx !== -1) updatedSites[idx] = { ...updatedSites[idx], ...updated };
                });
                return updatedSites;
              });
              setSuccess('Settings saved successfully');
              setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to save settings');
            } finally {
              setIsSaving(false);
            }
          }}
        />
      )}
    </div>
  );
}

// Sub-components for tables
function SitesTable({ sites, onEdit }: { sites: Site[], onEdit: (site: Site) => void }) {
  if (sites.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        No sites found
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="bg-slate-50 text-left text-sm text-slate-600">
          <th className="px-6 py-3 font-medium">Name</th>
          <th className="px-6 py-3 font-medium">Region</th>
          <th className="px-6 py-3 font-medium">Status</th>
          <th className="px-6 py-3 font-medium text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y" style={{ borderColor: '#F1F5F9' }}>
        {sites.map((site) => (
          <tr key={site.id} className="hover:bg-slate-50">
            <td className="px-6 py-4 font-medium text-slate-900">{site.name}</td>
            <td className="px-6 py-4 text-slate-600">{site.region || '-'}</td>
            <td className="px-6 py-4">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                site.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {site.is_active ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td className="px-6 py-4 text-right">
              <button
                onClick={() => onEdit(site)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <Edit className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DepartmentsTable({ 
  departments, 
  sites, 
  onEdit 
}: { 
  departments: Department[], 
  sites: Site[],
  onEdit: (dept: Department) => void 
}) {
  if (departments.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        No departments found
      </div>
    );
  }

  const getSiteName = (siteId: string) => 
    sites.find(s => s.id === siteId)?.name || 'Unknown';

  return (
    <table className="w-full">
      <thead>
        <tr className="bg-slate-50 text-left text-sm text-slate-600">
          <th className="px-6 py-3 font-medium">Name</th>
          <th className="px-6 py-3 font-medium">Site</th>
          <th className="px-6 py-3 font-medium">Specialty</th>
          <th className="px-6 py-3 font-medium">Status</th>
          <th className="px-6 py-3 font-medium text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y" style={{ borderColor: '#F1F5F9' }}>
        {departments.map((dept) => (
          <tr key={dept.id} className="hover:bg-slate-50">
            <td className="px-6 py-4 font-medium text-slate-900">{dept.name}</td>
            <td className="px-6 py-4 text-slate-600">{getSiteName(dept.site_id)}</td>
            <td className="px-6 py-4 text-slate-600">{dept.specialty || '-'}</td>
            <td className="px-6 py-4">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                dept.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {dept.is_active ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td className="px-6 py-4 text-right">
              <button
                onClick={() => onEdit(dept)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <Edit className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DirectorsTable({ 
  directors, 
  departments, 
  onEdit 
}: { 
  directors: Director[], 
  departments: Department[],
  onEdit: (dir: Director) => void 
}) {
  if (directors.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        No directors found
      </div>
    );
  }

  const getDeptName = (deptId: string) => 
    departments.find(d => d.id === deptId)?.name || 'Unknown';

  const ROLE_LABELS: Record<string, string> = {
    regional_director: 'Regional Director',
    medical_director: 'Medical Director',
    associate_medical_director: 'Associate Medical Director',
    assistant_medical_director: 'Assistant Medical Director',
    admin_assistant: 'Admin Assistant',
  };

  return (
    <table className="w-full">
      <thead>
        <tr className="bg-slate-50 text-left text-sm text-slate-600">
          <th className="px-6 py-3 font-medium">Name</th>
          <th className="px-6 py-3 font-medium">Email</th>
          <th className="px-6 py-3 font-medium">Role</th>
          <th className="px-6 py-3 font-medium">Department</th>
          <th className="px-6 py-3 font-medium">Status</th>
          <th className="px-6 py-3 font-medium text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y" style={{ borderColor: '#F1F5F9' }}>
        {directors.map((dir) => (
          <tr key={dir.id} className="hover:bg-slate-50">
            <td className="px-6 py-4 font-medium text-slate-900">{dir.name}</td>
            <td className="px-6 py-4 text-slate-600">{dir.email}</td>
            <td className="px-6 py-4 text-slate-600">{ROLE_LABELS[dir.role] || dir.role}</td>
            <td className="px-6 py-4 text-slate-600">{getDeptName(dir.department_id)}</td>
            <td className="px-6 py-4">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                dir.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {dir.is_active ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td className="px-6 py-4 text-right">
              <button
                onClick={() => onEdit(dir)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <Edit className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ProvidersTable({ 
  providers, 
  departments, 
  directors,
  onEdit 
}: { 
  providers: Provider[], 
  departments: Department[],
  directors: Director[],
  onEdit: (prov: Provider) => void 
}) {
  if (providers.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        No providers found
      </div>
    );
  }

  const getDeptName = (deptId: string) => 
    departments.find(d => d.id === deptId)?.name || 'Unknown';

  const getDirectorName = (dirId: string | null) => 
    dirId ? directors.find(d => d.id === dirId)?.name || 'Unknown' : '-';

  return (
    <table className="w-full">
      <thead>
        <tr className="bg-slate-50 text-left text-sm text-slate-600">
          <th className="px-6 py-3 font-medium">Name</th>
          <th className="px-6 py-3 font-medium">Email</th>
          <th className="px-6 py-3 font-medium">Type</th>
          <th className="px-6 py-3 font-medium">Department</th>
          <th className="px-6 py-3 font-medium">Primary Director</th>
          <th className="px-6 py-3 font-medium">Status</th>
          <th className="px-6 py-3 font-medium text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y" style={{ borderColor: '#F1F5F9' }}>
        {providers.map((prov) => (
          <tr key={prov.id} className="hover:bg-slate-50">
            <td className="px-6 py-4 font-medium text-slate-900">
              {prov.name}
              {prov.credential && (
                <span className="text-slate-500 font-normal">, {prov.credential}</span>
              )}
            </td>
            <td className="px-6 py-4 text-slate-600">{prov.email}</td>
            <td className="px-6 py-4">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                prov.provider_type === 'physician' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-purple-100 text-purple-700'
              }`}>
                {prov.provider_type === 'physician' ? 'Physician' : 'APC'}
              </span>
            </td>
            <td className="px-6 py-4 text-slate-600">{getDeptName(prov.primary_department_id)}</td>
            <td className="px-6 py-4 text-slate-600">{getDirectorName(prov.primary_director_id)}</td>
            <td className="px-6 py-4">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                prov.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {prov.is_active ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td className="px-6 py-4 text-right">
              <button
                onClick={() => onEdit(prov)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <Edit className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Settings Panel Component
function SettingsPanel({
  healthsystem,
  sites,
  isSaving,
  onSave,
}: {
  healthsystem: Healthsystem | null;
  sites: SiteWithSettings[];
  isSaving: boolean;
  onSave: (updates: { healthsystem?: Partial<Healthsystem>; sites?: Partial<SiteWithSettings>[] }) => void;
}) {
  const [frequency, setFrequency] = useState(healthsystem?.default_frequency || 'quarterly');
  const [startMonth, setStartMonth] = useState(healthsystem?.default_cycle_start_month || 1);
  const [siteOverrides, setSiteOverrides] = useState<Record<string, { frequency: string | null; startMonth: number | null }>>({});

  // Initialize site overrides from props
  useEffect(() => {
    const overrides: Record<string, { frequency: string | null; startMonth: number | null }> = {};
    sites.forEach(site => {
      overrides[site.id] = {
        frequency: site.frequency_override,
        startMonth: site.cycle_start_month_override,
      };
    });
    setSiteOverrides(overrides);
  }, [sites]);

  const handleSave = () => {
    const updates: { healthsystem?: Partial<Healthsystem>; sites?: Partial<SiteWithSettings>[] } = {};
    
    if (healthsystem?.id) {
      updates.healthsystem = {
        id: healthsystem.id,
        default_frequency: frequency as 'quarterly' | 'biannually' | 'annually',
        default_cycle_start_month: startMonth,
      };
    }

    const siteUpdates = Object.entries(siteOverrides)
      .filter(([id, override]) => {
        const original = sites.find(s => s.id === id);
        return original && (
          override.frequency !== original.frequency_override ||
          override.startMonth !== original.cycle_start_month_override
        );
      })
      .map(([id, override]) => ({
        id,
        frequency_override: override.frequency as 'quarterly' | 'biannually' | 'annually' | null,
        cycle_start_month_override: override.startMonth,
      }));

    if (siteUpdates.length > 0) {
      updates.sites = siteUpdates;
    }

    onSave(updates);
  };

  const FREQUENCY_OPTIONS = [
    { value: 'quarterly', label: 'Quarterly (every 3 months)' },
    { value: 'biannually', label: 'Biannually (every 6 months)' },
    { value: 'annually', label: 'Annually (once per year)' },
  ];

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      {/* Healthsystem Default Settings */}
      <div 
        className="bg-white rounded-xl border p-6"
        style={{ borderColor: COLORS.light }}
      >
        <h3 className="text-lg font-semibold text-slate-900 mb-1">
          Healthsystem Default Settings
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          {healthsystem?.name || 'Metro Healthsystem'} - Default settings apply to all sites unless overridden
        </p>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Default Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              style={{ borderColor: COLORS.light }}
            >
              {FREQUENCY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Cycle Start Month
            </label>
            <select
              value={startMonth}
              onChange={(e) => setStartMonth(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              style={{ borderColor: COLORS.light }}
            >
              {MONTHS.map((month, idx) => (
                <option key={idx + 1} value={idx + 1}>{month}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Site Overrides */}
      <div 
        className="bg-white rounded-xl border overflow-hidden"
        style={{ borderColor: COLORS.light }}
      >
        <div className="px-6 py-4 border-b" style={{ borderColor: COLORS.lightest }}>
          <h3 className="font-semibold text-slate-900">Site-Level Overrides</h3>
          <p className="text-sm text-slate-500">
            Override default settings for specific sites. Leave blank to inherit from healthsystem.
          </p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 text-left text-sm text-slate-600">
              <th className="px-6 py-3 font-medium">Site</th>
              <th className="px-6 py-3 font-medium">Region</th>
              <th className="px-6 py-3 font-medium">Frequency Override</th>
              <th className="px-6 py-3 font-medium">Start Month Override</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: '#F1F5F9' }}>
            {sites.map((site) => (
              <tr key={site.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{site.name}</td>
                <td className="px-6 py-4 text-slate-600">{site.region || '-'}</td>
                <td className="px-6 py-4">
                  <select
                    value={siteOverrides[site.id]?.frequency || ''}
                    onChange={(e) => setSiteOverrides(prev => ({
                      ...prev,
                      [site.id]: { ...prev[site.id], frequency: e.target.value || null }
                    }))}
                    className="w-full px-2 py-1 border rounded text-sm"
                    style={{ borderColor: COLORS.light }}
                  >
                    <option value="">Inherit ({frequency})</option>
                    {FREQUENCY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={siteOverrides[site.id]?.startMonth || ''}
                    onChange={(e) => setSiteOverrides(prev => ({
                      ...prev,
                      [site.id]: { ...prev[site.id], startMonth: e.target.value ? parseInt(e.target.value) : null }
                    }))}
                    className="w-full px-2 py-1 border rounded text-sm"
                    style={{ borderColor: COLORS.light }}
                  >
                    <option value="">Inherit ({MONTHS[startMonth - 1]})</option>
                    {MONTHS.map((month, idx) => (
                      <option key={idx + 1} value={idx + 1}>{month}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: COLORS.dark }}
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
