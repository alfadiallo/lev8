'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, ChevronDown, ChevronRight, Plus, Trash2, GripVertical,
  Save, AlertCircle, CheckCircle2, Pencil, X, Eye
} from 'lucide-react';

const COLORS = {
  lightest: '#D8F3DC',
  light: '#B7E4C7',
  medium: '#74C69D',
  dark: '#40916C',
  darker: '#2D6A4F',
  veryDark: '#1B4332',
};

interface FrameworkPillar {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  display_order: number;
  attributes: FrameworkAttribute[];
}

interface FrameworkAttribute {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  tags: string[];
  category: string | null;
}

interface Framework {
  id: string;
  name: string;
  version: number;
  is_active: boolean;
  score_min: number;
  score_max: number;
  score_step: number;
  description: string | null;
  pillars: FrameworkPillar[];
}

interface FrameworkEditorProps {
  programId: string;
}

export default function FrameworkEditor({ programId }: FrameworkEditorProps) {
  const [framework, setFramework] = useState<Framework | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);

  // Editing state
  const [editingAttr, setEditingAttr] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', slug: '', tags: '' });

  const fetchFramework = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/progress-check/frameworks/${programId}`);
      if (res.status === 404) {
        setFramework(null);
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setFramework(data.framework);
    } catch {
      setError('Failed to load framework');
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    fetchFramework();
  }, [fetchFramework]);

  const handleSaveAttribute = async (attrId: string) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/progress-check/frameworks/${programId}/attributes/${attrId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          tags: editForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setEditingAttr(null);
      setSuccess('Attribute updated');
      setTimeout(() => setSuccess(''), 2000);
      await fetchFramework();
    } catch {
      setError('Failed to save attribute');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (attr: FrameworkAttribute) => {
    setEditingAttr(attr.id);
    setEditForm({
      name: attr.name,
      description: attr.description || '',
      slug: attr.slug,
      tags: (attr.tags || []).join(', '),
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-6" style={{ borderColor: COLORS.light }}>
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: COLORS.dark }} />
          <span className="text-sm text-slate-500">Loading framework...</span>
        </div>
      </div>
    );
  }

  if (!framework) {
    return (
      <div className="bg-white rounded-xl border p-6" style={{ borderColor: COLORS.light }}>
        <Eye className="w-8 h-8 mb-3" style={{ color: COLORS.dark }} />
        <h3 className="font-semibold text-slate-900 mb-1">Evaluation Framework</h3>
        <p className="text-sm text-slate-500">
          No framework configured for this program yet.
          Run the database migration to seed the default framework.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border" style={{ borderColor: COLORS.light }}>
      <div className="p-6 border-b" style={{ borderColor: COLORS.lightest }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">{framework.name}</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Version {framework.version} · {framework.pillars.length} pillars · {' '}
              {framework.pillars.reduce((sum, p) => sum + p.attributes.length, 0)} attributes ·{' '}
              Score range: {framework.score_min}–{framework.score_max} (step {framework.score_step})
            </p>
          </div>
          {framework.is_active && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: COLORS.lightest, color: COLORS.darker }}>
              Active
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto text-xs font-medium">Dismiss</button>
        </div>
      )}

      {success && (
        <div className="mx-6 mt-4 flex items-center gap-2 p-3 rounded-lg text-sm"
          style={{ backgroundColor: COLORS.lightest, color: COLORS.darker }}>
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}

      <div className="p-6 space-y-3">
        {framework.pillars.map(pillar => {
          const isExpanded = expandedPillar === pillar.id;

          return (
            <div key={pillar.id} className="border rounded-lg" style={{ borderColor: COLORS.light }}>
              <button
                onClick={() => setExpandedPillar(isExpanded ? null : pillar.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-green-50/30"
              >
                <div className="flex items-center gap-3">
                  {pillar.color && (
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pillar.color }} />
                  )}
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-900">{pillar.name}</p>
                    <p className="text-xs text-slate-500">
                      {pillar.slug.toUpperCase()} · {pillar.attributes.length} attributes
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              {isExpanded && (
                <div className="border-t px-4 pb-4" style={{ borderColor: COLORS.lightest }}>
                  {pillar.description && (
                    <p className="text-xs text-slate-500 py-2">{pillar.description}</p>
                  )}

                  <div className="space-y-2 pt-1">
                    {pillar.attributes.map((attr, idx) => (
                      <div key={attr.id}>
                        {editingAttr === attr.id ? (
                          <div className="border rounded-lg p-3 space-y-3" style={{ borderColor: COLORS.medium }}>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                              <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-2 py-1.5 border rounded text-sm"
                                style={{ borderColor: COLORS.light }}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                              <input
                                type="text"
                                value={editForm.description}
                                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full px-2 py-1.5 border rounded text-sm"
                                style={{ borderColor: COLORS.light }}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                Tags (comma-separated)
                              </label>
                              <input
                                type="text"
                                value={editForm.tags}
                                onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                                className="w-full px-2 py-1.5 border rounded text-sm"
                                style={{ borderColor: COLORS.light }}
                                placeholder="interpersonal, communication"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingAttr(null)}
                                className="px-3 py-1.5 text-xs border rounded text-slate-600"
                                style={{ borderColor: COLORS.light }}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveAttribute(attr.id)}
                                disabled={saving}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs text-white rounded disabled:opacity-50"
                                style={{ backgroundColor: COLORS.dark }}
                              >
                                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 group">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-300 w-4 text-right">{idx + 1}</span>
                              <div>
                                <p className="text-sm text-slate-800">{attr.name}</p>
                                {attr.description && (
                                  <p className="text-xs text-slate-400">{attr.description}</p>
                                )}
                                {attr.tags && attr.tags.length > 0 && (
                                  <div className="flex gap-1 mt-1 flex-wrap">
                                    {attr.tags.map(tag => (
                                      <span
                                        key={tag}
                                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                                        style={{ backgroundColor: COLORS.lightest, color: COLORS.darker }}
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => startEdit(attr)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-100"
                              title="Edit attribute"
                            >
                              <Pencil className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
