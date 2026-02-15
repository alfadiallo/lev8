'use client';

import Link from 'next/link';
import {
  Heart,
  Award,
  Brain,
  BarChart3,
  TrendingUp,
  Users,
  User,
  Sparkles,
  ArrowRight,
  Shield,
  Target,
  Layers,
  GitBranch,
  LineChart,
  Stethoscope,
  Activity,
  ClipboardCheck,
} from 'lucide-react';

// Green color palette – consistent with Interview / Pulse Check
const COLORS = {
  lightest: '#D8F3DC',
  light: '#B7E4C7',
  mediumLight: '#95D5B2',
  medium: '#74C69D',
  mediumDark: '#52B788',
  dark: '#40916C',
  darker: '#2D6A4F',
  veryDark: '#1B4332',
  darkest: '#081C15',
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION WRAPPER
// ─────────────────────────────────────────────────────────────────────────────
function Section({
  children,
  className = '',
  id,
  alt = false,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  alt?: boolean;
}) {
  return (
    <section
      id={id}
      className={`py-20 sm:py-24 ${alt ? 'bg-slate-50/60' : ''} ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs font-semibold uppercase tracking-widest mb-3"
      style={{ color: COLORS.mediumDark }}
    >
      {children}
    </p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">{children}</h2>
  );
}

function SectionSubtitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-lg text-slate-600 max-w-3xl">{children}</p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function EqpqiqLandingPage() {
  return (
    <>
      {/* ================================================================ */}
      {/* HERO                                                             */}
      {/* ================================================================ */}
      <Section className="!pt-16 sm:!pt-24 !pb-12 text-center">
        <div className="max-w-4xl mx-auto">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-8"
            style={{ backgroundColor: COLORS.lightest, color: COLORS.darker }}
          >
            <Sparkles className="w-4 h-4" />
            Comprehensive Evaluation Framework
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 leading-[1.08]">
            Measure What{' '}
            <span style={{ color: COLORS.dark }}>Matters</span>
          </h1>

          <p className="text-xl sm:text-2xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            A structured framework for evaluating the{' '}
            <strong className="text-slate-800">Emotional</strong>,{' '}
            <strong className="text-slate-800">Professional</strong>, and{' '}
            <strong className="text-slate-800">Intellectual</strong>{' '}
            qualities that define high-performing individuals.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/interview"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
              style={{ backgroundColor: COLORS.darker }}
            >
              Try Interview Assessment
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pulsecheck"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold border-2 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
              style={{ borderColor: COLORS.dark, color: COLORS.darker }}
            >
              Try Pulse Check
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </Section>

      {/* ================================================================ */}
      {/* PHILOSOPHY – The Three Pillars                                   */}
      {/* ================================================================ */}
      <Section id="philosophy" alt>
        <div className="text-center mb-14">
          <SectionLabel>Philosophy</SectionLabel>
          <SectionTitle>Three Pillars of Performance</SectionTitle>
          <SectionSubtitle>
            Traditional evaluation narrows in on knowledge alone. EQ·PQ·IQ widens
            the lens to the full spectrum of what makes someone effective—because
            clinical excellence requires more than intellect.
          </SectionSubtitle>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* EQ */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
              style={{ backgroundColor: '#FFF0F3' }}
            >
              <Heart className="w-7 h-7 text-rose-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Emotional Quotient
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-4">
              The interpersonal and intrapersonal intelligence that drives patient rapport,
              team cohesion, and resilience under pressure.
            </p>
            <ul className="space-y-1.5 text-sm text-slate-600">
              <li className="flex items-start gap-2"><span className="text-rose-400 mt-0.5">-</span> Empathy &amp; Positive Interactions</li>
              <li className="flex items-start gap-2"><span className="text-rose-400 mt-0.5">-</span> Adaptability &amp; Self-Awareness</li>
              <li className="flex items-start gap-2"><span className="text-rose-400 mt-0.5">-</span> Stress Management &amp; Resilience</li>
              <li className="flex items-start gap-2"><span className="text-rose-400 mt-0.5">-</span> Curiosity &amp; Growth Mindset</li>
              <li className="flex items-start gap-2"><span className="text-rose-400 mt-0.5">-</span> Communication Effectiveness</li>
            </ul>
          </div>

          {/* PQ */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
              style={{ backgroundColor: '#F0FDFA' }}
            >
              <Award className="w-7 h-7 text-teal-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Professional Quotient
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-4">
              The professional habits, ethics, and leadership behaviors that earn trust
              and drive accountability in clinical environments.
            </p>
            <ul className="space-y-1.5 text-sm text-slate-600">
              <li className="flex items-start gap-2"><span className="text-teal-400 mt-0.5">-</span> Work Ethic &amp; Reliability</li>
              <li className="flex items-start gap-2"><span className="text-teal-400 mt-0.5">-</span> Integrity &amp; Accountability</li>
              <li className="flex items-start gap-2"><span className="text-teal-400 mt-0.5">-</span> Teachability &amp; Receptiveness</li>
              <li className="flex items-start gap-2"><span className="text-teal-400 mt-0.5">-</span> Documentation Quality</li>
              <li className="flex items-start gap-2"><span className="text-teal-400 mt-0.5">-</span> Leadership &amp; Relationships</li>
            </ul>
          </div>

          {/* IQ */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
              style={{ backgroundColor: '#F0FDF4' }}
            >
              <Brain className="w-7 h-7 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Intellectual Quotient
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-4">
              The clinical knowledge, reasoning, and adaptive thinking that underpin
              safe, evidence-based decision-making.
            </p>
            <ul className="space-y-1.5 text-sm text-slate-600">
              <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">-</span> Medical Knowledge Base</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">-</span> Analytical Thinking</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">-</span> Commitment to Learning</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">-</span> Clinical Flexibility</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">-</span> Performance for Level</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* ================================================================ */}
      {/* USE CASES                                                        */}
      {/* ================================================================ */}
      <Section id="use-cases">
        <div className="text-center mb-14">
          <SectionLabel>Use Cases</SectionLabel>
          <SectionTitle>One Framework, Many Applications</SectionTitle>
          <SectionSubtitle>
            EQ·PQ·IQ adapts to the context—interviews, ongoing performance,
            or longitudinal training—while keeping the same structured lens.
          </SectionSubtitle>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Interview Assessment */}
          <div
            className="rounded-2xl p-8 border-2 hover:shadow-lg transition-all group"
            style={{ borderColor: COLORS.light, backgroundColor: 'white' }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
              style={{ backgroundColor: COLORS.lightest }}
            >
              <ClipboardCheck className="w-7 h-7" style={{ color: COLORS.dark }} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Interview Assessment</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-4">
              Structured candidate evaluation for residency interviews. Rate EQ, PQ, and IQ on
              a 0-100 scale with question guides, interviewer normalization, and season-wide rank lists.
            </p>
            <ul className="space-y-1.5 text-sm text-slate-600 mb-6">
              <li className="flex items-center gap-2"><Target className="w-3.5 h-3.5 text-slate-400" /> Structured question &amp; cue guides</li>
              <li className="flex items-center gap-2"><BarChart3 className="w-3.5 h-3.5 text-slate-400" /> Z-score normalization across raters</li>
              <li className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-slate-400" /> Season-wide rank lists</li>
            </ul>
            <Link
              href="/interview"
              className="inline-flex items-center gap-1 text-sm font-semibold group-hover:gap-2 transition-all"
              style={{ color: COLORS.darker }}
            >
              Explore Interview Tool <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Pulse Check */}
          <div
            className="rounded-2xl p-8 border-2 hover:shadow-lg transition-all group"
            style={{ borderColor: COLORS.light, backgroundColor: 'white' }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
              style={{ backgroundColor: '#EDE9FE' }}
            >
              <Activity className="w-7 h-7 text-violet-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Pulse Check</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-4">
              Ongoing physician and APC performance evaluation. Configurable cycles, operational
              metrics (LOS, imaging, PPH), sparkline trends, and provider profile views.
            </p>
            <ul className="space-y-1.5 text-sm text-slate-600 mb-6">
              <li className="flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5 text-slate-400" /> Sparkline trend visualizations</li>
              <li className="flex items-center gap-2"><Layers className="w-3.5 h-3.5 text-slate-400" /> Health-system hierarchy support</li>
              <li className="flex items-center gap-2"><BarChart3 className="w-3.5 h-3.5 text-slate-400" /> Operational metrics integration</li>
            </ul>
            <Link
              href="/pulsecheck"
              className="inline-flex items-center gap-1 text-sm font-semibold group-hover:gap-2 transition-all"
              style={{ color: COLORS.darker }}
            >
              Explore Pulse Check <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Residency Analytics */}
          <div
            className="rounded-2xl p-8 border-2 hover:shadow-lg transition-all group"
            style={{ borderColor: COLORS.light, backgroundColor: 'white' }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
              style={{ backgroundColor: '#FEF3C7' }}
            >
              <Stethoscope className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Residency Analytics</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-4">
              Longitudinal resident evaluation across 15 attributes on the Elevate platform.
              Faculty and self-assessment, radar charts, gap analysis, and AI-powered SWOT.
            </p>
            <ul className="space-y-1.5 text-sm text-slate-600 mb-6">
              <li className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-slate-400" /> AI-generated SWOT analysis</li>
              <li className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-slate-400" /> Faculty vs self-assessment</li>
              <li className="flex items-center gap-2"><LineChart className="w-3.5 h-3.5 text-slate-400" /> 15-point radar charts</li>
            </ul>
            <a
              href="https://lev8.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold group-hover:gap-2 transition-all"
              style={{ color: COLORS.darker }}
            >
              Visit Elevate Platform <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </Section>

      {/* ================================================================ */}
      {/* AI ANALYTICS                                                     */}
      {/* ================================================================ */}
      <Section id="ai-analytics" alt>
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <SectionLabel>AI-Powered Analytics</SectionLabel>
            <SectionTitle>From Narratives to Structured Insights</SectionTitle>
            <SectionSubtitle>
              Evaluation comments are rich but hard to aggregate. Our AI mid-layer transforms
              unstructured narratives into quantified EQ·PQ·IQ scores, SWOT analyses, and
              actionable recommendations—while maintaining full privacy.
            </SectionSubtitle>
          </div>

          <div className="space-y-5">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: COLORS.mediumDark }}
              >
                1
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Collect</h4>
                <p className="text-sm text-slate-500">
                  Faculty evaluations, self-assessments, and structured ratings flow into the system
                  from forms, imports, or existing LMS integrations.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: COLORS.mediumDark }}
              >
                2
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Anonymize &amp; Analyze</h4>
                <p className="text-sm text-slate-500">
                  Identifiers are stripped before AI analysis. Claude reads narratives and produces
                  evidence-based SWOT elements with severity levels, supporting quotes, and confidence scores.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: COLORS.mediumDark }}
              >
                3
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Score &amp; Visualize</h4>
                <p className="text-sm text-slate-500">
                  AI scores all 15 EQ·PQ·IQ attributes (1.0–5.0), generates period-over-period
                  trendlines, and surfaces gap analysis between self and observer ratings.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4">
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: COLORS.mediumDark }}
              >
                4
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Act</h4>
                <p className="text-sm text-slate-500">
                  Program directors and evaluators receive radar charts, SWOT dashboards,
                  archetype classifications, and targeted recommendations—ready for coaching
                  conversations or CCC meetings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ================================================================ */}
      {/* ARCHETYPING                                                      */}
      {/* ================================================================ */}
      <Section id="archetyping">
        <div className="text-center mb-14">
          <SectionLabel>Archetyping</SectionLabel>
          <SectionTitle>Classify Trajectories, Not Just Levels</SectionTitle>
          <SectionSubtitle>
            A single score at one point in time tells you very little. EQ·PQ·IQ tracks
            performance trajectories—year over year—and classifies individuals into
            actionable archetypes so support is targeted, not generic.
          </SectionSubtitle>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              name: 'Elite Performer',
              desc: 'Consistently high. Leadership and fellowship track.',
              color: '#1ABC9C',
              risk: 'Low',
            },
            {
              name: 'Breakthrough',
              desc: 'Major improvement year-over-year. Document what worked.',
              color: '#3498DB',
              risk: 'Low',
            },
            {
              name: 'Late Bloomer',
              desc: 'Low start but positive trajectory. Encourage continuation.',
              color: '#9B59B6',
              risk: 'Low',
            },
            {
              name: 'Steady Climber',
              desc: 'Consistent gains each year. Maintain approach.',
              color: '#27AE60',
              risk: 'Low',
            },
            {
              name: 'Peak & Decline',
              desc: 'Improved then dropped. Investigate underlying factors.',
              color: '#E74C3C',
              risk: 'High',
            },
            {
              name: 'Late Struggle',
              desc: 'Strong start, late decline. Assess burnout and support.',
              color: '#E67E22',
              risk: 'Moderate',
            },
            {
              name: 'Continuous Decline',
              desc: 'Declining trajectory. Intensive intervention needed.',
              color: '#C0392B',
              risk: 'High',
            },
            {
              name: 'Variable',
              desc: 'Unique pattern. Individualized approach required.',
              color: '#7F8C8D',
              risk: 'Moderate',
            },
          ].map((arch) => (
            <div
              key={arch.name}
              className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: arch.color }}
                />
                <h4 className="font-semibold text-slate-900 text-sm">{arch.name}</h4>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">{arch.desc}</p>
              <span
                className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor:
                    arch.risk === 'Low'
                      ? '#D1FAE5'
                      : arch.risk === 'Moderate'
                        ? '#FEF3C7'
                        : '#FEE2E2',
                  color:
                    arch.risk === 'Low'
                      ? '#065F46'
                      : arch.risk === 'Moderate'
                        ? '#92400E'
                        : '#991B1B',
                }}
              >
                {arch.risk} Risk
              </span>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-slate-500 max-w-2xl mx-auto">
            Each archetype includes confidence scores, similar historical profiles,
            methodology versioning, and specific recommendations for coaching, mentorship, and intervention.
          </p>
        </div>
      </Section>

      {/* ================================================================ */}
      {/* LONGITUDINAL VALUE                                               */}
      {/* ================================================================ */}
      <Section id="longitudinal" alt>
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Visual */}
          <div className="order-2 lg:order-1">
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
              {/* Simplified trendline illustration */}
              <div className="flex items-end gap-3 h-48">
                {[
                  { label: 'PGY-1 Fall', eq: 55, pq: 60, iq: 50 },
                  { label: 'PGY-1 Spring', eq: 62, pq: 65, iq: 58 },
                  { label: 'PGY-2 Fall', eq: 70, pq: 72, iq: 65 },
                  { label: 'PGY-2 Spring', eq: 75, pq: 78, iq: 72 },
                  { label: 'PGY-3 Fall', eq: 82, pq: 85, iq: 80 },
                  { label: 'PGY-3 Spring', eq: 88, pq: 90, iq: 85 },
                ].map((period) => (
                  <div key={period.label} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex gap-0.5 items-end h-40">
                      <div
                        className="flex-1 rounded-t"
                        style={{
                          height: `${period.eq}%`,
                          backgroundColor: '#FDA4AF',
                        }}
                      />
                      <div
                        className="flex-1 rounded-t"
                        style={{
                          height: `${period.pq}%`,
                          backgroundColor: '#99F6E4',
                        }}
                      />
                      <div
                        className="flex-1 rounded-t"
                        style={{
                          height: `${period.iq}%`,
                          backgroundColor: '#BBF7D0',
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 text-center leading-tight whitespace-nowrap">
                      {period.label.replace('PGY-', 'Y').replace(' ', '\n')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-center gap-6 mt-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#FDA4AF' }} /> EQ
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#99F6E4' }} /> PQ
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#BBF7D0' }} /> IQ
                </span>
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="order-1 lg:order-2">
            <SectionLabel>Longitudinal Tracking</SectionLabel>
            <SectionTitle>Growth Over Time, Not Snapshots</SectionTitle>
            <div className="space-y-4 mt-4">
              <div className="flex gap-3">
                <TrendingUp className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: COLORS.dark }} />
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Period-Over-Period Tracking</h4>
                  <p className="text-sm text-slate-500">
                    Fall and spring snapshots across each training year. See how EQ, PQ, and IQ
                    evolve from intern year through graduation.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <LineChart className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: COLORS.dark }} />
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Multi-Level Trendlines</h4>
                  <p className="text-sm text-slate-500">
                    Compare an individual against their class average and program average across
                    every attribute and period.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Shield className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: COLORS.dark }} />
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Early Intervention</h4>
                  <p className="text-sm text-slate-500">
                    Declining trajectories and widening faculty-self gaps are flagged early, enabling
                    targeted support before small issues become serious concerns.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <GitBranch className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: COLORS.dark }} />
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Gap Analysis</h4>
                  <p className="text-sm text-slate-500">
                    Track how self-perception compares to observer ratings over time. Blind spots
                    and overconfidence become visible in the data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ================================================================ */}
      {/* INDIVIDUAL vs GROUP                                              */}
      {/* ================================================================ */}
      <Section id="individual-vs-group">
        <div className="text-center mb-14">
          <SectionLabel>Scope</SectionLabel>
          <SectionTitle>Individual Insight. Organizational Intelligence.</SectionTitle>
          <SectionSubtitle>
            EQ·PQ·IQ operates at two levels: detailed feedback for the individual, and
            aggregate analytics for the program, department, or health system.
          </SectionSubtitle>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Individual */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: COLORS.lightest }}
              >
                <User className="w-6 h-6" style={{ color: COLORS.dark }} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Individual</h3>
            </div>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex gap-2">
                <span style={{ color: COLORS.mediumDark }}>-</span>
                <span><strong>Personal EQ·PQ·IQ profile</strong> — 15-attribute radar chart with scores and trends</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: COLORS.mediumDark }}>-</span>
                <span><strong>SWOT analysis</strong> — AI-generated strengths, weaknesses, opportunities, threats</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: COLORS.mediumDark }}>-</span>
                <span><strong>Gap analysis</strong> — Faculty vs self-assessment perception differences</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: COLORS.mediumDark }}>-</span>
                <span><strong>Archetype classification</strong> — Trajectory type, risk level, similar profiles</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: COLORS.mediumDark }}>-</span>
                <span><strong>Coaching ready</strong> — Evidence-backed talking points for 1:1 feedback</span>
              </li>
            </ul>
          </div>

          {/* Group */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: '#EDE9FE' }}
              >
                <Users className="w-6 h-6 text-violet-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Group / Cohort</h3>
            </div>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex gap-2">
                <span className="text-violet-400">-</span>
                <span><strong>Cohort SWOT</strong> — Class-level themes with prevalence indicators</span>
              </li>
              <li className="flex gap-2">
                <span className="text-violet-400">-</span>
                <span><strong>Class vs class</strong> — Compare this year&apos;s PGY-3 to prior PGY-3 cohorts</span>
              </li>
              <li className="flex gap-2">
                <span className="text-violet-400">-</span>
                <span><strong>Program-wide averages</strong> — Attribute trends across the entire program</span>
              </li>
              <li className="flex gap-2">
                <span className="text-violet-400">-</span>
                <span><strong>Interview rank lists</strong> — Normalized scores, interviewer statistics, season analytics</span>
              </li>
              <li className="flex gap-2">
                <span className="text-violet-400">-</span>
                <span><strong>Curriculum &amp; wellness</strong> — Identify systemic gaps and inform program design</span>
              </li>
            </ul>
          </div>
        </div>
      </Section>

      {/* ================================================================ */}
      {/* CTA                                                              */}
      {/* ================================================================ */}
      <Section alt>
        <div className="text-center">
          <SectionLabel>Get Started</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Ready to Measure What Matters?
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10">
            Choose a product below to explore the EQ·PQ·IQ framework in action.
            Each includes live demo access—no account required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/interview"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
              style={{ backgroundColor: COLORS.darker }}
            >
              <ClipboardCheck className="w-5 h-5" />
              Interview Assessment
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pulsecheck"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-semibold border-2 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
              style={{ borderColor: COLORS.dark, color: COLORS.darker }}
            >
              <Activity className="w-5 h-5" />
              Pulse Check
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <p className="mt-8 text-sm text-slate-400">
            For residency programs, visit{' '}
            <a
              href="https://lev8.ai"
              className="underline"
              style={{ color: COLORS.dark }}
              target="_blank"
              rel="noopener noreferrer"
            >
              lev8.ai
            </a>{' '}
            to access the full Elevate platform.
          </p>
        </div>
      </Section>
    </>
  );
}
