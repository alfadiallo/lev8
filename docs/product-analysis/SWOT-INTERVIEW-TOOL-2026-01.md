# SWOT Analysis: EQ·PQ·IQ Interview Assessment Tool

**Product:** EQ·PQ·IQ Interview Assessment Tool  
**Date:** January 2026  
**Version:** 1.0  
**Perspective:** Residency Program Director  
**Platform:** eqpqiq.com

---

## Executive Summary

The EQ·PQ·IQ Interview Assessment Tool provides a structured framework for evaluating residency candidates across three domains: Emotional Intelligence (EQ), Professional Qualities (PQ), and Intellectual Capability (IQ). This analysis examines the tool's strategic position from the perspective of a residency program director seeking to optimize interview day operations and candidate selection.

---

## Strengths

### 1. Structured Evaluation Framework
- **15-point scale** across EQ, PQ, and IQ domains provides granular differentiation
- Standardized criteria reduce subjective bias and improve inter-rater reliability
- Clear rubrics guide faculty through consistent evaluations

### 2. Score Normalization Engine
- **Z-score transformation** addresses interviewer bias (harsh vs. lenient graders)
- Formula: `normalized = (raw - interviewer_mean) / interviewer_stddev * global_stddev + global_mean`
- Toggle between raw and normalized views for transparency
- Option to exclude resident ratings from normalization calculations

### 3. Comprehensive Analytics Dashboard
- **Season-wide rank list** with search, filtering, and CSV export
- Decile distribution visualization with color-coded tiers (green→yellow→red)
- Candidate tooltips showing names and scores within each decile
- Real-time ranking updates when normalization is toggled

### 4. Interviewer Accountability & Statistics
- Per-interviewer metrics: average scores, standard deviation, interview count
- Identification of scoring patterns (consistently high/low raters)
- Faculty can see their own statistics to self-calibrate

### 5. Operational Efficiency
- **Multi-session management** for interview days across the season
- Real-time candidate tracking during interview day
- Role-based access: Program Director, Faculty, Guest views
- Secure email-based authentication with share tokens for flexibility

### 6. Built-in Interview Guide
- Suggested questions for each domain (EQ, PQ, IQ)
- Behavioral interview prompts reduce preparation time
- Consistent question framework across all interviewers

---

## Weaknesses

### 1. Adoption Barrier
- Requires faculty buy-in and training on the EQ/PQ/IQ framework
- Learning curve for understanding normalization concepts
- Transition from traditional ranking methods may face resistance

### 2. Data Dependency
- Normalization accuracy improves with more data points
- Early-season interviews have less reliable normalized scores
- Small programs may lack sufficient sample size for meaningful statistics

### 3. Limited Historical Context
- First-year implementation lacks year-over-year comparison
- No correlation data yet between interview scores and resident outcomes
- Benchmarking against other programs not available

### 4. Single-Institution Design
- Currently optimized for individual program use
- No built-in consortium or multi-program comparison features
- Data sharing between programs not implemented

### 5. Complexity of Normalization
- Faculty may not fully understand or trust normalized scores
- "Black box" perception without proper education
- Risk of over-reliance on mathematical adjustments

---

## Opportunities

### 1. Outcome Tracking Integration
- Link interview scores to milestone achievements, ITE performance
- Build predictive models for resident success
- Validate EQ/PQ/IQ framework with longitudinal data

### 2. Multi-Program Expansion
- Consortium model for specialty-wide benchmarking
- Anonymized aggregate data for national trends
- Cross-institutional score calibration

### 3. ERAS/NRMP Integration
- Import candidate demographics from ERAS
- Export rank list in NRMP-compatible format
- Streamline match list submission workflow

### 4. AI-Powered Features
- Automated red flag detection in scoring patterns
- Suggested rank list based on program priorities
- Natural language summaries of candidate strengths

### 5. Holistic Review Support
- Weight customization for EQ vs PQ vs IQ based on program values
- Integration with application review scores
- Combined score incorporating multiple data sources

### 6. Faculty Development
- Interviewer training modules based on scoring patterns
- Calibration exercises with video vignettes
- Certification tracking for interview training

---

## Threats

### 1. Faculty Resistance
- "We've always done it this way" mentality
- Pushback against quantification of subjective assessments
- Concerns about reduced autonomy in candidate selection

### 2. Gaming the System
- Candidates may learn to present rehearsed responses
- Faculty may adjust scores knowing normalization will occur
- Strategic inflation/deflation of scores

### 3. Legal/Compliance Concerns
- Documentation requirements for rank list decisions
- Potential challenges if scores appear discriminatory
- Need for clear policies on score use and retention

### 4. Competitive Alternatives
- Other interview management platforms entering market
- Free solutions from AAMC or specialty organizations
- Home-grown spreadsheet solutions perceived as "good enough"

### 5. Data Quality Issues
- Incomplete evaluations skew statistics
- Late submissions affect real-time rankings
- Faculty fatigue on high-volume interview days

### 6. Over-Reliance Risk
- Numbers may overshadow important qualitative factors
- "Teaching to the test" interview behavior
- Loss of program-specific cultural fit assessment

---

## Strategic Recommendations

### Short-Term (This Interview Season)
1. **Educate faculty** on normalization methodology before interview season starts
2. **Pilot with subset** of interviewers before full rollout
3. **Establish baseline** metrics for future comparison

### Medium-Term (Next 1-2 Seasons)
1. **Track outcomes** by linking interview scores to early resident performance
2. **Gather feedback** from faculty on usability and trust in the system
3. **Refine weights** based on correlation analysis with successful residents

### Long-Term (3+ Seasons)
1. **Publish findings** on EQ/PQ/IQ predictive validity
2. **Expand to consortium** model with peer programs
3. **Integrate AI** for predictive analytics and red flag detection

---

## Appendix

### Feature Reference

| Feature | Location | Description |
|---------|----------|-------------|
| Rank List | `/interview/season` | Season-wide candidate rankings with export |
| Interviewer Stats | `/interview/stats` | Per-interviewer metrics and patterns |
| Rating Interface | `/interview/session/[id]/rate` | Real-time candidate evaluation |
| Dashboard | `/interview` | Session management and overview |
| Normalization Toggle | Season page header | Switch between raw/normalized views |

### Document Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | January 2026 | Initial SWOT analysis |

---

*This analysis is intended for internal strategic planning. Findings should be validated with stakeholder input before implementation decisions.*
