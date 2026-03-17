export { default as SectionCard } from './SectionCard';
export { default as HeatmapSection } from './HeatmapSection';
export { default as DrilldownSection } from './DrilldownSection';
export { default as TrajectorySection } from './TrajectorySection';
export { default as ArchetypeSection } from './ArchetypeSection';
export { default as RadarSection } from './RadarSection';
export { default as ComparisonSection } from './ComparisonSection';
export { default as TrendSection } from './TrendSection';
export { default as SwotSection } from './SwotSection';
export { default as IteSection } from './IteSection';
export { default as RatingsSection } from './RatingsSection';
export { default as CommentsSection } from './CommentsSection';

export {
  THEME,
  PERIOD_ORDER,
  periodSortIndex,
  scoreToRGB,
  scoreBg,
  scoreColor,
  grade,
  HeatCell,
  MiniSparkline,
} from './primitives';

export type { default as SectionCardProps } from './SectionCard';

import type { Profile } from '../types';
import type { ComponentType } from 'react';

export interface SectionDef {
  id: string;
  group: 'overview' | 'deep-dive' | 'context';
  component: ComponentType<{ profile: Profile; pillar?: 'eq' | 'pq' | 'iq'; expanded?: boolean; onToggleExpanded?: () => void }>;
  pillar?: 'eq' | 'pq' | 'iq';
}

import {
  default as _RadarSection,
} from './RadarSection';
import {
  default as _ComparisonSection,
} from './ComparisonSection';
import {
  default as _HeatmapSection,
} from './HeatmapSection';
import {
  default as _TrendSection,
} from './TrendSection';
import {
  default as _DrilldownSection,
} from './DrilldownSection';
import {
  default as _TrajectorySection,
} from './TrajectorySection';
import {
  default as _SwotSection,
} from './SwotSection';
import {
  default as _IteSection,
} from './IteSection';
import {
  default as _ArchetypeSection,
} from './ArchetypeSection';
import {
  default as _RatingsSection,
} from './RatingsSection';
import {
  default as _CommentsSection,
} from './CommentsSection';

export const SECTION_REGISTRY: SectionDef[] = [
  { id: 'radar',         group: 'overview',   component: _RadarSection },
  { id: 'comparison',    group: 'overview',   component: _ComparisonSection },
  { id: 'heatmap',       group: 'overview',   component: _HeatmapSection },
  { id: 'trends',        group: 'overview',   component: _TrendSection },
  { id: 'ite',           group: 'overview',   component: _IteSection },
  { id: 'eq-drilldown',  group: 'deep-dive',  component: _DrilldownSection, pillar: 'eq' },
  { id: 'pq-drilldown',  group: 'deep-dive',  component: _DrilldownSection, pillar: 'pq' },
  { id: 'iq-drilldown',  group: 'deep-dive',  component: _DrilldownSection, pillar: 'iq' },
  { id: 'trajectory',    group: 'deep-dive',  component: _TrajectorySection },
  { id: 'swot',          group: 'context',    component: _SwotSection },
  { id: 'archetype',     group: 'context',    component: _ArchetypeSection },
  { id: 'ratings',       group: 'context',    component: _RatingsSection },
  { id: 'comments',      group: 'context',    component: _CommentsSection },
];

export const SECTION_GROUPS: { id: string; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'deep-dive', label: 'Deep Dive' },
  { id: 'context', label: 'Context & History' },
];
