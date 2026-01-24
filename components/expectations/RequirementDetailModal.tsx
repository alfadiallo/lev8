'use client';

import { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Save,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText,
  Loader2
} from 'lucide-react';
import {
  ACGMERequirement,
  ComplianceStatus,
  STATUS_CONFIG,
  RISK_CONFIG,
  OWNER_LABELS,
  RiskLevel
} from '@/lib/types/acgme';

interface RequirementDetailModalProps {
  requirement: ACGMERequirement | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate?: (requirementId: string, status: ComplianceStatus, notes: string) => void;
}

interface ComplianceData {
  status: ComplianceStatus;
  notes: string;
  assessment_date?: string;
}

export default function RequirementDetailModal({
  requirement,
  isOpen,
  onClose,
  onStatusUpdate
}: RequirementDetailModalProps) {
  const [complianceData, setComplianceData] = useState<ComplianceData>({
    status: 'not_assessed',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [truthsDocId, setTruthsDocId] = useState<string | null>(null);

  // Fetch compliance data when modal opens
  useEffect(() => {
    if (isOpen && requirement) {
      fetchComplianceData();
      fetchTruthsDocument();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, requirement]);

  const fetchComplianceData = async () => {
    if (!requirement) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/expectations/requirements/${encodeURIComponent(requirement.id)}`);
      if (response.ok) {
        const data = await response.json();
        setComplianceData({
          status: data.compliance?.status || 'not_assessed',
          notes: data.compliance?.notes || '',
          assessment_date: data.compliance?.assessment_date
        });
      }
    } catch (error) {
      console.error('Error fetching compliance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTruthsDocument = async () => {
    // Find the ACGME CPR guide in Truths
    try {
      const response = await fetch('/api/truths');
      if (response.ok) {
        const data = await response.json();
        const cprDoc = data.documents?.find((doc: { title?: string; id: string }) => 
          doc.title?.toLowerCase().includes('common program requirements') ||
          doc.title?.toLowerCase().includes('acgme') ||
          doc.title?.toLowerCase().includes('cpr')
        );
        if (cprDoc) {
          setTruthsDocId(cprDoc.id);
        }
      }
    } catch (error) {
      console.error('Error fetching Truths documents:', error);
    }
  };

  const handleSave = async () => {
    if (!requirement) return;
    
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      const response = await fetch(`/api/expectations/requirements/${encodeURIComponent(requirement.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: complianceData.status,
          notes: complianceData.notes
        })
      });

      if (response.ok) {
        setSaveMessage({ type: 'success', text: 'Saved successfully' });
        if (onStatusUpdate) {
          onStatusUpdate(requirement.id, complianceData.status, complianceData.notes);
        }
        // Clear message after 2 seconds
        setTimeout(() => setSaveMessage(null), 2000);
      } else {
        const error = await response.json();
        setSaveMessage({ type: 'error', text: error.message || 'Failed to save' });
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to save changes' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewSourcePDF = () => {
    if (truthsDocId) {
      // Open Truths page with document download
      window.open(`/api/truths/${truthsDocId}/download`, '_blank');
    } else {
      // Fallback - open Truths page
      window.open('/truths', '_blank');
    }
  };

  const _getStatusIcon = (status: ComplianceStatus) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle2 className="text-emerald-600" size={20} />;
      case 'at_risk':
        return <AlertTriangle className="text-amber-500" size={20} />;
      case 'non_compliant':
        return <XCircle className="text-red-500" size={20} />;
      default:
        return <HelpCircle className="text-gray-400" size={20} />;
    }
  };

  if (!isOpen || !requirement) return null;

  const riskConfig = RISK_CONFIG[requirement.risk_level as RiskLevel];
  const _statusConfig = STATUS_CONFIG[complianceData.status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-neutral-200">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-lg text-[#7EC8E3] font-semibold">
                {requirement.id}
              </span>
              <span
                className="px-2 py-0.5 text-xs rounded font-medium"
                style={{
                  backgroundColor: riskConfig.bgColor,
                  color: riskConfig.color,
                }}
              >
                {requirement.risk_level}
              </span>
            </div>
            <h2 className="text-xl font-bold text-neutral-900">
              {requirement.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-neutral-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-[#7EC8E3]" size={32} />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Metadata */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-neutral-500">Category:</span>{' '}
                  <span className="text-neutral-700 font-medium">{requirement.category}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Section:</span>{' '}
                  <span className="text-neutral-700 font-medium">{requirement.section}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Owner:</span>{' '}
                  <span className="text-neutral-700 font-medium">
                    {OWNER_LABELS[requirement.owner as keyof typeof OWNER_LABELS] || requirement.owner}
                  </span>
                </div>
              </div>

              {/* Full Requirement Text */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-700 mb-2">
                  Requirement Text
                </h3>
                <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                  <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap">
                    {requirement.text}
                  </p>
                </div>
              </div>

              {/* Source Document Link */}
              <div>
                <button
                  onClick={handleViewSourcePDF}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition-colors"
                >
                  <FileText size={16} />
                  View Source PDF in Truths
                  <ExternalLink size={14} className="text-neutral-400" />
                </button>
                <p className="text-xs text-neutral-500 mt-1">
                  Opens ACGME Common Program Requirements document in a new tab
                </p>
              </div>

              {/* Compliance Status */}
              <div className="border-t border-neutral-200 pt-6">
                <h3 className="text-sm font-semibold text-neutral-700 mb-3">
                  Compliance Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-neutral-600 mb-1">
                      Current Status
                    </label>
                    <select
                      value={complianceData.status}
                      onChange={(e) => setComplianceData(prev => ({
                        ...prev,
                        status: e.target.value as ComplianceStatus
                      }))}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7EC8E3]"
                    >
                      <option value="not_assessed">Not Assessed</option>
                      <option value="compliant">Compliant</option>
                      <option value="at_risk">At Risk</option>
                      <option value="non_compliant">Non-Compliant</option>
                      <option value="not_applicable">Not Applicable</option>
                    </select>
                  </div>
                  {complianceData.assessment_date && (
                    <div>
                      <label className="block text-sm text-neutral-600 mb-1">
                        Last Assessed
                      </label>
                      <p className="px-3 py-2 text-neutral-700">
                        {new Date(complianceData.assessment_date).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Assessment Notes
                </label>
                <textarea
                  value={complianceData.notes}
                  onChange={(e) => setComplianceData(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  placeholder="Add notes about compliance status, evidence, or action items..."
                  rows={4}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7EC8E3] resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-neutral-200 bg-neutral-50">
          <div>
            {saveMessage && (
              <span className={`text-sm ${saveMessage.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                {saveMessage.text}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-neutral-600 hover:text-neutral-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-[#7EC8E3] text-white rounded-lg hover:bg-[#6BB8D3] transition-colors font-medium disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


