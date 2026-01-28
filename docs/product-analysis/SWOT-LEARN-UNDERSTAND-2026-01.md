# SWOT Analysis: Lev8 Learn & Understand Modules

**Product:** Elevate (lev8.ai) Medical Education Platform  
**Date:** January 2026  
**Version:** 1.0  
**Perspective:** Residency Program Director / Medical Educator  
**Focus:** Learn Module & Understand Module

---

## Executive Summary

The Learn and Understand modules form the core educational and analytics pillars of the Lev8 platform. **Learn** provides interactive training tools for clinical skill development, including AI-powered communication practice, multi-patient simulations, and clinical case studies. **Understand** delivers comprehensive resident analytics, AI-generated SWOT analysis, competency scoring, and CCC meeting support.

Together, these modules create a closed-loop system where training activities (Learn) can inform performance analytics (Understand), and analytics insights can guide personalized learning pathways. This analysis examines the strategic position of both modules from the perspective of a residency program seeking to optimize resident education and assessment.

---

# Part 1: Learn Module

## Module Overview

The Learn module contains four sub-modules designed for clinical skill development:

| Sub-Module | Purpose | Key Technology |
|------------|---------|----------------|
| Difficult Conversations | Communication skills practice | Claude AI (v1/v2 engines) |
| Clinical Cases | Clinical reasoning development | Step-by-step MCQ format |
| EKG & ACLS | Cardiac protocol training | Interactive EKG canvas |
| Running the Board | Multi-patient ED management | 4-column simulation grid |

---

## Strengths

### 1. AI-Powered Difficult Conversations (Unique Differentiator)
- **Phase-based conversation engine** with emotional state tracking
- 8 scenario categories covering critical communication challenges:
  - Medical error disclosure
  - Serious diagnosis delivery
  - End-of-life planning
  - Treatment refusal/withdrawal
  - Colleague performance issues
- **Assessment scoring** for empathy, clarity, and de-escalation
- Branching hints guide learners through difficult moments
- Session analytics track improvement over time

### 2. Multi-Patient ED Simulation (Running the Board)
- **4-column patient grid** simulates real ED workflow
- 20-minute sessions with 5 distinct phases
- ESI 1-5 acuity levels with time-sensitive actions
- Critical vs. non-critical action tracking
- **Debrief system** with facilitator notes and learner reflection
- Preset shift configurations for standardized training
- Leaderboard for peer comparison and motivation

### 3. Educator Content Creation
- Faculty can create custom vignettes, cases, and scenarios
- Institution-specific content alongside global/public library
- JSONB storage enables flexible content structures
- Content versioning and activation controls

### 4. Comprehensive Session Tracking
- All modules track user attempts and progress
- Performance metrics stored for longitudinal analysis
- Session data available for analytics integration

### 5. Role-Based Access Control
- Appropriate access for residents, faculty, and program directors
- Educator-only content creation privileges
- Multi-tenant data isolation

---

## Weaknesses

### 1. Incomplete Features
- **Clinical Cases scoring logic** not implemented (TODO in codebase)
- Demo scenarios serve as placeholders when no content exists
- Limited onboarding guidance for new users

### 2. Content Library Dependency
- Module value directly tied to available content
- Empty states when no vignettes/cases exist
- Faculty content creation requires time investment
- No pre-built content library for immediate value

### 3. Limited External Integrations
- No integration with ROSH Review, ABEMPrep, or other question banks
- No CME credit tracking or certification
- No LMS (Learning Management System) connectivity
- No SCORM/xAPI compliance for learning analytics standards

### 4. Mobile Experience
- Desktop-optimized interface
- Running the Board 4-column grid challenging on mobile
- EKG canvas interaction not touch-optimized

### 5. Single AI Provider Dependency
- Claude AI sole provider for conversations
- No fallback if API unavailable
- Quality dependent on single model's capabilities

---

## Opportunities

### 1. VirtualSIM Federation
- Architecture supports federated content from VirtualSIM
- Expand case library without internal content creation
- Partnership model for specialty-specific simulations

### 2. CME Credit Integration
- Track completion for CME credit submission
- Generate certificates of completion
- Integration with ACGME activity logging

### 3. Learning Pathway Personalization
- Use Understand module analytics to recommend Learn activities
- SWOT weaknesses → targeted training modules
- ITE score gaps → relevant clinical cases

### 4. Peer Comparison & Competition
- Expand leaderboard beyond Running the Board
- Program-wide performance rankings
- Gamification elements (badges, streaks, achievements)

### 5. External Content Partnerships
- ROSH Review question integration
- ABEMPrep case synchronization
- Publisher partnerships for case content

### 6. AI Feature Expansion
- AI-generated feedback on clinical case reasoning
- Adaptive difficulty based on performance
- Natural language case creation from clinical scenarios

---

## Threats

### 1. Established Competitors
- **MedEdPortal**: Extensive peer-reviewed case library
- **Aquifer**: Comprehensive virtual patient cases
- **SimX/Laerdal**: VR/AR simulation platforms
- **ROSH Review**: Dominant EM question bank
- Free resources from ACEP, CORD, EMCrit

### 2. AI Conversation Quality Concerns
- LLM hallucinations in medical context could be harmful
- Inconsistent emotional calibration across sessions
- Faculty skepticism of AI as educational tool

### 3. Faculty Adoption Barriers
- Time investment to create content
- Preference for traditional teaching methods
- Concerns about replacing human interaction

### 4. Content Staleness
- Medical guidelines evolve; content requires updates
- No automated content review/refresh workflow
- Liability concerns for outdated clinical information

### 5. Learner Engagement Decline
- Initial novelty may wear off
- Competition with entertainment for attention
- Mandatory vs. voluntary usage considerations

---

# Part 2: Understand Module

## Module Overview

The Understand module provides comprehensive resident analytics and CCC meeting support:

| Feature | Status | Description |
|---------|--------|-------------|
| SWOT Analysis | Implemented | AI-generated from evaluation comments |
| EQ/PQ/IQ Scoring | Implemented | 15-point radar charts with gap analysis |
| ITE Tracking | Implemented | Trajectory analysis with archetypes |
| CCC Meetings | Implemented | Session management with timers |
| Class Cohort | Implemented | Scatter visualization by archetype |
| ROSH/Procedures/Ultrasound | Coming Soon | Placeholders in UI |
| Program-Wide Analytics | Coming Soon | Feature preview cards |
| My Profile (Resident) | Partial | Structure exists, data not connected |

---

## Strengths

### 1. AI-Powered SWOT Analysis
- **Automated generation** from MedHub evaluation comments
- Period-based analysis (PGY-1 Fall, PGY-2 Spring, etc.)
- Evidence citations link insights to source comments
- Historical comparison across periods
- Attribute timeline visualization tracks themes over time
- Class-level SWOT aggregation for cohort analysis

### 2. Comprehensive Competency Framework (EQ/PQ/IQ)
- **15-point evaluation** across Emotional, Professional, and Intellectual domains
- D3.js radar charts for visual competency profiles
- **Gap analysis** comparing faculty ratings vs. self-assessment
- Period-over-period trend tracking
- AI-derived scores from evaluation comment analysis

### 3. ITE Archetype Classification System
- **9 complete archetypes** (Elite Performer, Steady Climber, Late Bloomer, etc.)
- Risk level indicators (Low, Moderate, High)
- Confidence scoring for classification reliability
- Similar residents identification for pattern matching
- **Class cohort scatter visualization** (X: PGY-1 score, Y: Delta)
- Methodology versioning for classification evolution

### 4. CCC Meeting Workflow Integration
- **Session timer system** for meeting management
- Per-resident and session-level timing
- Resident ordering with discussion tracking
- **Integrated notes** with type classification
- Same analytics panes available in meeting context
- Session creation with date, academic year, PGY filter

### 5. Rich Data Visualization
- D3.js-powered interactive charts
- Slope charts for ITE progression
- Dual-line charts for ROSH completion
- Radar charts for competency profiles
- Scatter plots for archetype distribution
- Timeline charts for attribute trends

### 6. Longitudinal Data Model
- Period-based aggregation enables trend analysis
- Historical data preserved for comparison
- Version-controlled classifications track evolution

---

## Weaknesses

### 1. Multiple "Coming Soon" Placeholders
- **5 panes incomplete**: ROSH, Procedures, Ultrasound, CSI, Milestones
- Program-Wide Analytics not functional
- Creates perception of incomplete product

### 2. Resident Self-Service Gap
- My Profile page exists but lacks data connections
- Residents cannot view their own SWOT, ITE, or scores
- Limits resident engagement and self-reflection

### 3. Single-Institution Data
- All current data from Memorial Healthcare System
- No benchmarking against other programs
- Limited sample size for statistical significance

### 4. AI Generation Dependencies
- SWOT analysis requires AI API availability
- Comment quality affects SWOT accuracy
- No manual override or editing of AI-generated content
- Potential bias in AI interpretation

### 5. Data Import Friction
- MedHub CSV import required for evaluation comments
- ITE scores require manual entry
- No automated data synchronization

### 6. Limited Milestone Integration
- ACGME milestones pane is placeholder
- No EPA (Entrustable Professional Activity) tracking
- Missing key accreditation metrics

---

## Opportunities

### 1. ACGME Milestone Integration
- Map EQ/PQ/IQ to ACGME competencies
- Auto-populate milestone evaluations from data
- Reduce faculty documentation burden

### 2. Multi-Program Benchmarking
- Anonymized comparison across participating programs
- National percentile context for ITE archetypes
- Consortium model for shared insights

### 3. Predictive Analytics
- Correlate archetype classifications with board outcomes
- Early warning system for at-risk residents
- Success prediction models based on multi-factor analysis

### 4. Learn Module Integration
- SWOT weaknesses trigger Learn module recommendations
- Track learning activity impact on subsequent ratings
- Personalized development plans based on analytics

### 5. Board Exam Outcome Tracking
- Link ITE trajectory to qualifying exam results
- Validate archetype predictions with real outcomes
- Publish findings on predictive validity

### 6. MedHub/New Innovations Direct Integration
- Automated evaluation sync instead of CSV import
- Real-time SWOT updates as comments arrive
- Reduce manual data management

### 7. Resident Self-Service Expansion
- Complete My Profile functionality
- Allow resident goal-setting based on SWOT
- Enable self-reflection journaling (Grow module link)

---

## Threats

### 1. HIPAA/FERPA Compliance Concerns
- Educational records require careful handling
- AI processing of evaluation data raises privacy questions
- Multi-tenant data isolation must be bulletproof

### 2. Faculty Resistance to AI Assessments
- Skepticism of AI-generated SWOT accuracy
- Concerns about "black box" analysis
- Preference for human judgment in high-stakes decisions

### 3. Alternative Analytics Platforms
- **Medhub Analytics**: Native analytics within evaluation system
- **New Innovations**: Built-in reporting dashboards
- **MedHub Competency Tracking**: Direct ACGME integration
- Custom institutional solutions

### 4. Data Quality Dependency
- "Garbage in, garbage out" for AI analysis
- Incomplete evaluations reduce SWOT accuracy
- ITE score gaps limit archetype classification

### 5. Over-Reliance on Quantification
- Complex human development reduced to scores
- Risk of teaching to metrics vs. holistic development
- Loss of nuance in committee discussions

### 6. Accreditation Body Changes
- ACGME competency frameworks may evolve
- EPA adoption could require system redesign
- New assessment requirements not anticipated

---

# Part 3: Combined Strategic Recommendations

## Short-Term Priorities (Next 3 Months)

### Learn Module
1. **Complete Clinical Cases scoring** - Remove TODO, implement assessment logic
2. **Seed initial content library** - Create 10-20 cases per sub-module for immediate value
3. **Add session completion tracking** - Enable analytics integration

### Understand Module
1. **Complete My Profile for residents** - Connect existing data to resident view
2. **Implement ROSH pane** - Leverage existing ROSH completion data
3. **Add manual SWOT editing** - Allow faculty to refine AI-generated content

## Medium-Term Roadmap (3-12 Months)

### Learn Module
1. **ROSH Review integration** - Partner for question bank access
2. **CME credit tracking** - Enable completion certificates
3. **Mobile optimization** - Responsive design for all sub-modules

### Understand Module
1. **MedHub direct integration** - API sync instead of CSV import
2. **ACGME milestone mapping** - Connect EQ/PQ/IQ to competency framework
3. **Program-wide analytics** - Complete aggregated views
4. **Board outcome tracking** - Start collecting qualifying exam data

### Cross-Module
1. **Learn → Understand feedback loop** - Training completion informs analytics
2. **Understand → Learn recommendations** - SWOT weaknesses suggest learning paths

## Long-Term Vision (1-3 Years)

### Learn Module
1. **VR/AR simulation expansion** - Partner with simulation platforms
2. **AI case generation** - Create cases from real clinical scenarios
3. **Adaptive learning paths** - Personalized curriculum based on performance

### Understand Module
1. **Multi-program consortium** - Benchmarking across participating programs
2. **Predictive success models** - Validated with board exam outcomes
3. **Published research** - Validate EQ/PQ/IQ and archetype frameworks

### Platform Integration
1. **Closed-loop learning system** - Seamless Learn ↔ Understand ↔ Grow integration
2. **Institutional dashboards** - Program-wide KPIs across all modules
3. **Accreditation automation** - Auto-generate ACGME self-study data

---

## Appendix

### Feature Reference

#### Learn Module Routes

| Feature | Route | Description |
|---------|-------|-------------|
| Learn Overview | `/modules/learn` | Module landing with 4 tiles |
| Difficult Conversations | `/modules/learn/difficult-conversations` | AI conversation practice |
| Clinical Cases | `/modules/learn/clinical-cases` | Case-based learning |
| EKG & ACLS | `/modules/learn/ekg-acls` | Cardiac protocol training |
| Running the Board | `/modules/learn/running-board` | Multi-patient simulation |

#### Understand Module Routes

| Feature | Route | Description |
|---------|-------|-------------|
| Understand Overview | `/modules/understand` | Module landing with tiles |
| Residents Portal | `/modules/understand/residents` | Faculty "Look Book" |
| Class Cohort | `/modules/understand/class` | Archetype scatter view |
| Program Analytics | `/modules/understand/program` | Program-wide (coming soon) |
| CCC Session | `/modules/understand/[sessionId]` | Meeting workspace |
| My Profile | `/modules/understand/my-profile` | Resident self-service |

### Key API Endpoints

| Endpoint | Module | Purpose |
|----------|--------|---------|
| `/api/conversations/v2/chat` | Learn | AI conversation engine |
| `/api/running-board/sessions` | Learn | Simulation management |
| `/api/v2/analytics/swot` | Understand | SWOT analysis retrieval |
| `/api/v2/analytics/scores` | Understand | EQ/PQ/IQ scores |
| `/api/archetypes/class/[year]` | Understand | Class archetype distribution |

### Document Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | January 2026 | Initial SWOT analysis for Learn & Understand modules |

---

*This analysis is intended for internal strategic planning. Findings should be validated with stakeholder input before implementation decisions.*
