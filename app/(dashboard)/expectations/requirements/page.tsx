'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  ChevronDown, 
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { 
  ACGMERequirement, 
  ProgramComplianceStatus,
  ComplianceStatus,
  RiskLevel,
  STATUS_CONFIG,
  RISK_CONFIG,
  CATEGORY_ORDER
} from '@/lib/types/acgme';
import RequirementDetailModal from '@/components/expectations/RequirementDetailModal';

export default function RequirementsPage() {
  const [requirements, setRequirements] = useState<ACGMERequirement[]>([]);
  const [complianceMap, setComplianceMap] = useState<Record<string, ProgramComplianceStatus>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [selectedRequirement, setSelectedRequirement] = useState<ACGMERequirement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchRequirements();
  }, []);

  const fetchRequirements = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/expectations/requirements');
      if (!response.ok) {
        throw new Error('Failed to fetch requirements');
      }

      const data = await response.json();
      setRequirements(data.requirements || []);
      
      // Build compliance map
      const map: Record<string, ProgramComplianceStatus> = {};
      (data.compliance || []).forEach((c: ProgramComplianceStatus) => {
        map[c.requirement_id] = c;
      });
      setComplianceMap(map);

      // Expand first section by default
      if (data.requirements?.length > 0) {
        const firstSection = data.requirements[0].section;
        setExpandedSections(new Set([firstSection]));
      }
    } catch (err) {
      console.error('Requirements fetch error:', err);
      setError('Failed to load requirements');
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(requirements.map(r => r.category));
    return Array.from(cats).sort((a, b) => {
      const aIdx = CATEGORY_ORDER.indexOf(a);
      const bIdx = CATEGORY_ORDER.indexOf(b);
      if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    });
  }, [requirements]);

  // Filter requirements
  const filteredRequirements = useMemo(() => {
    return requirements.filter(req => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !req.id.toLowerCase().includes(query) &&
          !req.title.toLowerCase().includes(query) &&
          !req.text.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'all' && req.category !== selectedCategory) {
        return false;
      }

      // Risk filter
      if (selectedRisk !== 'all' && req.risk_level !== selectedRisk) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all') {
        const status = complianceMap[req.id]?.status || 'not_assessed';
        if (status !== selectedStatus) {
          return false;
        }
      }

      return true;
    });
  }, [requirements, searchQuery, selectedCategory, selectedRisk, selectedStatus, complianceMap]);

  // Group by section
  const groupedRequirements = useMemo(() => {
    const groups: Record<string, ACGMERequirement[]> = {};
    filteredRequirements.forEach(req => {
      if (!groups[req.section]) {
        groups[req.section] = [];
      }
      groups[req.section].push(req);
    });
    return groups;
  }, [filteredRequirements]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const getStatusIcon = (status: ComplianceStatus | undefined) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle2 className="text-emerald-600" size={18} />;
      case 'at_risk':
        return <AlertTriangle className="text-amber-500" size={18} />;
      case 'non_compliant':
        return <XCircle className="text-red-500" size={18} />;
      default:
        return <HelpCircle className="text-gray-400" size={18} />;
    }
  };

  const getSectionTitle = (section: string) => {
    const titles: Record<string, string> = {
      '1': 'Oversight',
      '2': 'Personnel',
      '3': 'Recruitment, Eligibility, and Selection',
      '4': 'Educational Program',
      '5': 'Evaluation',
      '6': 'Learning and Working Environment',
    };
    return titles[section] || `Section ${section}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7EC8E3]"></div>
            <p className="mt-4 text-neutral-600">Loading requirements...</p>
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
            <span>Requirements</span>
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">ACGME Requirements</h1>
          <p className="text-neutral-600">
            Browse and manage compliance status for all Common Program Requirements.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID, title, or text..."
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7EC8E3]"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7EC8E3]"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Risk Level Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Risk Level
              </label>
              <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7EC8E3]"
              >
                <option value="all">All Levels</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-neutral-100">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                selectedStatus === 'all'
                  ? 'bg-[#7EC8E3] text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              All Status
            </button>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                  selectedStatus === status
                    ? 'text-white'
                    : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: selectedStatus === status ? config.color : config.bgColor,
                  color: selectedStatus === status ? 'white' : config.color,
                }}
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-neutral-500">
          Showing {filteredRequirements.length} of {requirements.length} requirements
        </div>

        {/* Requirements List */}
        {filteredRequirements.length === 0 ? (
          <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
            <FileText size={48} className="mx-auto text-neutral-300 mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No requirements found</h3>
            <p className="text-neutral-600">
              {requirements.length === 0
                ? 'Run the import script to load ACGME requirements.'
                : 'Try adjusting your filters.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedRequirements)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([section, reqs]) => (
                <div key={section} className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(section)}
                    className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {expandedSections.has(section) ? (
                        <ChevronDown size={20} className="text-neutral-400" />
                      ) : (
                        <ChevronRight size={20} className="text-neutral-400" />
                      )}
                      <span className="font-semibold text-neutral-900">
                        Section {section}: {getSectionTitle(section)}
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-neutral-100 text-neutral-600 rounded-full">
                        {reqs.length} requirements
                      </span>
                    </div>
                  </button>

                  {/* Section Content */}
                  {expandedSections.has(section) && (
                    <div className="border-t border-neutral-100">
                      {reqs.map((req) => {
                        const compliance = complianceMap[req.id];
                        const status = compliance?.status || 'not_assessed';
                        const statusConfig = STATUS_CONFIG[status as ComplianceStatus];

                        return (
                          <div
                            key={req.id}
                            className="p-4 border-b border-neutral-50 last:border-b-0 hover:bg-neutral-50 transition-colors"
                          >
                            <div className="flex items-start gap-4">
                              {/* Status Icon */}
                              <div className="mt-1">
                                {getStatusIcon(status as ComplianceStatus)}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-mono text-sm text-[#7EC8E3]">
                                        {req.id}
                                      </span>
                                      <span
                                        className="px-2 py-0.5 text-xs rounded font-medium"
                                        style={{
                                          backgroundColor: RISK_CONFIG[req.risk_level as RiskLevel].bgColor,
                                          color: RISK_CONFIG[req.risk_level as RiskLevel].color,
                                        }}
                                      >
                                        {req.risk_level}
                                      </span>
                                      <span className="text-xs text-neutral-400">
                                        Owner: {req.owner}
                                      </span>
                                    </div>
                                    <h3 className="font-medium text-neutral-900 mb-1">
                                      {req.title}
                                    </h3>
                                    <p className="text-sm text-neutral-600 line-clamp-2">
                                      {req.text}
                                    </p>
                                  </div>

                                  {/* Status Badge */}
                                  <span
                                    className="px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap"
                                    style={{
                                      backgroundColor: statusConfig.bgColor,
                                      color: statusConfig.color,
                                    }}
                                  >
                                    {statusConfig.label}
                                  </span>
                                </div>

                                {/* Quick Actions */}
                                <div className="flex items-center gap-4 mt-3">
                                  <button
                                    onClick={() => {
                                      setSelectedRequirement(req);
                                      setIsModalOpen(true);
                                    }}
                                    className="text-xs text-[#7EC8E3] hover:text-[#5BA8C4] font-medium"
                                  >
                                    View Details
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
              ))}
          </div>
        )}
      </div>

      {/* Requirement Detail Modal */}
      <RequirementDetailModal
        requirement={selectedRequirement}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRequirement(null);
        }}
        onStatusUpdate={(requirementId, newStatus, notes) => {
          // Update local compliance map
          setComplianceMap(prev => ({
            ...prev,
            [requirementId]: {
              ...prev[requirementId],
              requirement_id: requirementId,
              status: newStatus,
              notes: notes,
            } as ProgramComplianceStatus
          }));
        }}
      />
    </div>
  );
}

