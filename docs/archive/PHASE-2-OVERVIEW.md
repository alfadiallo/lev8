# Phase 2: Module Content & First Use Cases

**Started:** November 6, 2025  
**Status:** In Progress  
**Theme:** Create first complete, production-ready use cases for each learning module

---

## Overview

Phase 2 focuses on implementing sophisticated, educationally validated use cases for each learning module. After establishing the core platform infrastructure in Phase 1, Phase 2 ensures that all modules have at least one fully functional, high-quality scenario that demonstrates the platform's capabilities.

## Phase 2 Goals

1. **Difficult Conversations Module:** Implement v2 vignette architecture starting with MED-001 (Adenosine Error)
2. **Clinical Cases Module:** Create first complete clinical case scenario
3. **EKG & ACLS Module:** Build first ACLS simulation scenario
4. **Running the Board Module:** Develop first multi-patient board configuration
5. **Content Authoring Framework:** Establish workflows and templates for educators to create new content

## Current Focus: Epic 2.1 - Difficult Conversations

**Epic 2.1** implements the sophisticated v2 vignette architecture for Difficult Conversations, starting with the MED-001 (Adenosine Error) case. This epic establishes:

- **5-File Modular Architecture:** Clinical scenario, avatar profiles, conversation design, index, educator guide
- **Phase-Based Conversations:** Structured progression through opening, disclosure, emotional processing, clinical questions, and next steps
- **Emotional State Tracking:** Continuous 0-1 scale with event-based modifiers
- **Branching Logic:** Adaptive conversation flow based on learner performance
- **Dynamic Prompt Layers:** Emotional state, conversation history, information boundaries, difficulty adjustment
- **Semantic Assessment:** Pattern recognition for empathy, clarity, and accountability
- **Multi-Model AI Support:** Both Gemini and Claude providers with vignette-level selection

## Success Criteria

### For Each Module Use Case:
- ✅ Fully functional with all features working
- ✅ Educationally validated by subject matter experts
- ✅ Assessment system provides meaningful feedback
- ✅ UI provides clear guidance and feedback
- ✅ Performance meets latency requirements (<2s response time)
- ✅ Content can be easily authored and imported
- ✅ Documentation complete for educators

### For Phase 2 Overall:
- ✅ All 4 modules have at least one production-ready use case
- ✅ Content authoring process is documented and repeatable
- ✅ Assessment and analytics systems are operational
- ✅ Voice avatar integration hooks are in place (ready for Phase 3)
- ✅ Foundation established for scaling to multiple use cases per module

## Epic Breakdown

### Epic 2.1: Difficult Conversations - First Use Case (MED-001) ✅ IN PROGRESS
**Priority:** High  
**Estimated:** 40-50 hours  
**Status:** Active Development

**Deliverables:**
- Complete MED-001 vignette data structure
- Refactored conversation engine supporting v2 architecture
- Phase-based UI components
- Assessment system with semantic pattern matching
- Gemini integration alongside Claude
- Database schema extensions
- Migration tools for importing v2 vignettes
- Complete documentation

### Epic 2.2: Clinical Cases - First Use Case (Planned)
**Priority:** High  
**Estimated:** 20-30 hours  
**Status:** Planned

### Epic 2.3: EKG & ACLS - First Scenario (Planned)
**Priority:** Medium  
**Estimated:** 25-35 hours  
**Status:** Planned

### Epic 2.4: Running the Board - First Configuration (Planned)
**Priority:** Medium  
**Estimated:** 30-40 hours  
**Status:** Planned

## Technical Architecture

### v2 Vignette Structure (Difficult Conversations)

```
lib/vignettes/v2/
├── MED-001-adenosine-error.ts          # Consolidated vignette export
└── [template files for future vignettes]

lib/conversations/v2/
├── ConversationEngine.ts               # Main orchestration
├── PhaseManager.ts                     # Phase transitions & branching
├── EmotionalStateTracker.ts            # Emotional state management
├── PromptBuilder.ts                    # Dynamic prompt construction
├── AssessmentEngine.ts                 # Semantic assessment
├── PatternMatcher.ts                   # Pattern recognition
└── modelProviders/
    ├── ConversationProvider.ts         # Interface
    ├── GeminiProvider.ts               # Gemini integration
    └── ClaudeProvider.ts               # Claude integration
```

### Database Schema

**vignettes.vignette_data** (JSONB) - Extended for v2:
```json
{
  "version": "2.0",
  "clinicalData": {...},
  "avatars": {...},
  "conversation": {
    "phases": [...],
    "mechanics": {...}
  },
  "educatorGuide": {...}
}
```

**training_sessions.session_data** (JSONB) - Enhanced:
```json
{
  "currentPhase": "disclosure",
  "emotionalState": 0.65,
  "branchPath": ["opening", "clear_empathetic", "emotional_processing"],
  "phaseObjectives": {...},
  "assessmentScores": {...}
}
```

## Implementation Approach

### 1. Modular Development
- Build components independently with clear interfaces
- Test each component in isolation
- Integrate incrementally

### 2. Backward Compatibility
- Maintain v1 vignette support
- Version detection in API routes
- Gradual migration path

### 3. Model Agnostic
- Unified provider interface
- Vignette-level model selection
- Easy to add new providers

### 4. Educator-Centric
- Clear authoring documentation
- Template files for new vignettes
- Validation tools for content

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Complex prompt engineering | High | Start with Claude (known), add Gemini incrementally |
| Emotional state drift | Medium | Validation checks, recalibration points |
| Assessment accuracy | High | Extensive testing, educator validation |
| Performance degradation | Medium | Caching, optimized prompts, rate limiting |
| Model API changes | Low | Adapter pattern, version pinning |

## Timeline

**Epic 2.1 (Difficult Conversations):** 1-2 weeks  
**Epic 2.2-2.4 (Other Modules):** 2-3 weeks each  
**Total Phase 2 Duration:** 8-12 weeks

## Documentation

- **Technical Docs:** Architecture, API endpoints, type definitions
- **Authoring Guides:** How to create new vignettes/cases/scenarios
- **Educator Resources:** Facilitation guides, assessment rubrics
- **User Guides:** How to use each module

## Next Phase Preview

**Phase 3:** Multi-User Testing & Refinement
- User testing with real residents
- Educator feedback incorporation
- Performance optimization
- Additional use cases
- Voice avatar integration

---

**Last Updated:** November 6, 2025  
**Current Epic:** 2.1 - Difficult Conversations First Use Case


