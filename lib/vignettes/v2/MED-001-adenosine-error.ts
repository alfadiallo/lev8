// MED-001: Adenosine Error Vignette
// Complete v2 vignette structure consolidated from 5-file architecture
// Exports as VignetteV2 type for use in conversation engine

import { VignetteV2 } from '../../types/difficult-conversations';
import { medicationErrorScenario } from './data/MED-001-clinical-scenario';
import { avatarProfiles } from './data/MED-001-avatar-profiles';
import { conversationDesign } from './data/MED-001-conversation-design';
import { educatorGuide } from './data/MED-001-educator-guide';

export const MED001AdenosineErrorVignette: VignetteV2 = {
  // Identification
  id: 'MED-001-adenosine-error-v1',
  category: 'MED',
  subcategory: 'medication-error',
  version: 1,
  
  // Human-readable information
  title: 'Disclosing a Medication Error: Adenosine Administration in VT',
  shortTitle: 'Adenosine VT Error',
  description: 'Practice disclosing a serious medication error where adenosine was given for ventricular tachycardia, resulting in cardiac arrest. Focus on honest disclosure, managing emotions, and rebuilding trust.',
  
  // Clinical components
  clinicalData: medicationErrorScenario,
  avatars: avatarProfiles,
  conversation: conversationDesign,
  educatorResources: educatorGuide,
  
  // Metadata
  difficulty: ['beginner', 'intermediate', 'advanced'],
  estimatedDuration: 15,
  debriefDuration: 10,
  totalSessionTime: 25,
  
  // Educational alignment
  learningObjectives: [
    {
      id: 'obj-1',
      category: 'Communication',
      objective: 'Deliver clear, honest error disclosure using appropriate language'
    },
    {
      id: 'obj-2', 
      category: 'Emotional Intelligence',
      objective: 'Manage family emotional responses while maintaining composure'
    },
    {
      id: 'obj-3',
      category: 'Professionalism',
      objective: 'Accept responsibility appropriately without admitting legal liability'
    },
    {
      id: 'obj-4',
      category: 'Patient Safety',
      objective: 'Discuss system improvements to prevent future errors'
    }
  ],
  
  prerequisites: [
    'basic-communication-skills',
    'understanding-medical-errors'
  ],
  
  // Searchable tags
  tags: [
    'medical-error',
    'disclosure',
    'cardiac',
    'emergency-medicine',
    'medication-error',
    'cardiac-arrest',
    'difficult-conversations',
    'family-communication',
    'adenosine',
    'ventricular-tachycardia'
  ],
  
  clinicalContext: [
    'emergency-medicine',
    'cardiology',
    'critical-care',
    'patient-safety'
  ],
  
  // Related content
  relatedVignettes: [
    'MED-002-wrong-site-surgery-v1',
    'UO-001-unexpected-arrest-v1'
  ],
  
  suggestedPreparation: [
    'Review institution error disclosure policy',
    'AHRQ CANDOR Toolkit basics',
    'VT vs SVT differentiation review'
  ],
  
  // Tracking
  createdDate: '2025-01-15',
  lastModified: '2025-01-15',
  authors: ['Virtual Sim Team'],
  reviewers: ['Emergency Medicine Faculty'],
  
  // Technical settings
  aiModel: 'gemini-1.5-pro',
  responseStyle: 'conversational',
  maxResponseLength: 150,
  
  // Assessment configuration
  assessmentWeights: {
    empathy: 0.4,
    clarity: 0.3,
    accountability: 0.3
  },
  
  passingScore: 0.7,
  excellenceScore: 0.85,
  
  // Completion tracking
  completionCriteria: {
    minimumDuration: 10, // minutes
    phasesCompleted: ['opening', 'disclosure', 'emotional_processing', 'next_steps'],
    assessmentSubmitted: true
  },
  
  // Institutional customization flags
  customizable: {
    institutionPolicies: true,
    localProtocols: true,
    culturalAdaptation: true
  }
};

export default MED001AdenosineErrorVignette;

