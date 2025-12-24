// Utility: Convert VignetteV2 to database format
// Extracts metadata for table columns and stores full structure in vignette_data JSONB

import { VignetteV2 } from '../../types/difficult-conversations';
import { Vignette } from '../../types/modules';

/**
 * Converts a VignetteV2 to the database format (Vignette interface)
 * Extracts top-level fields for table columns, stores full structure in vignette_data
 */
export function convertVignetteV2ToDatabase(
  vignette: VignetteV2,
  institutionId: string | null, // null = global vignette (available to all institutions)
  createdByUserId?: string
): Omit<Vignette, 'id' | 'created_at' | 'updated_at'> {
  // Store the full v2 structure in vignette_data with version marker
  const vignetteData = {
    ...vignette, // Include all v2 fields
    version: '2.0', // Ensure version is set to 2.0
  };

  return {
    institution_id: institutionId,
    title: vignette.title,
    description: vignette.description,
    category: vignette.category,
    subcategory: vignette.subcategory,
    difficulty: vignette.difficulty,
    estimated_duration_minutes: vignette.estimatedDuration,
    vignette_data: vignetteData,
    created_by_user_id: createdByUserId,
    is_public: false, // Default to private
    is_active: true,
  };
}

/**
 * Validates that a VignetteV2 has all required fields
 */
export function validateVignetteV2(vignette: Partial<VignetteV2>): string[] {
  const errors: string[] = [];

  if (!vignette.id) errors.push('id is required');
  if (!vignette.title) errors.push('title is required');
  if (!vignette.description) errors.push('description is required');
  if (!vignette.category) errors.push('category is required');
  if (!vignette.difficulty || vignette.difficulty.length === 0) {
    errors.push('difficulty is required and must have at least one level');
  }
  if (!vignette.estimatedDuration) errors.push('estimatedDuration is required');
  if (!vignette.clinicalData) errors.push('clinicalData is required');
  if (!vignette.avatars) errors.push('avatars is required');
  if (!vignette.conversation) errors.push('conversation is required');
  if (!vignette.educatorResources) errors.push('educatorResources is required');
  if (!vignette.aiModel) errors.push('aiModel is required');
  if (!vignette.assessmentWeights) errors.push('assessmentWeights is required');
  if (vignette.passingScore === undefined) errors.push('passingScore is required');
  if (vignette.excellenceScore === undefined) errors.push('excellenceScore is required');
  if (!vignette.completionCriteria) errors.push('completionCriteria is required');
  if (!vignette.customizable) errors.push('customizable is required');
  if (!vignette.learningObjectives || vignette.learningObjectives.length === 0) {
    errors.push('learningObjectives is required and must have at least one objective');
  }

  return errors;
}


