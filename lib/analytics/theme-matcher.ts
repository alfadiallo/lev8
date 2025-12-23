// Theme matching utility for filtering comments relevant to SWOT themes

/**
 * Extract keywords from a SWOT theme description
 * E.g., "efficiency and task switching" → ["efficiency", "task", "switching", "pace", "time management"]
 */
export function extractKeywords(theme: string): string[] {
  // Base keywords from the theme itself
  const baseKeywords = theme
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 3); // Filter short words

  // Synonym mapping for common medical education themes
  const synonymMap: { [key: string]: string[] } = {
    efficiency: ['pace', 'speed', 'time management', 'workflow', 'productivity', 'timely'],
    documentation: ['charting', 'notes', 'chart', 'documentation', 'paperwork', 'records'],
    communication: ['communicate', 'interaction', 'rapport', 'team', 'collaboration', 'discussion'],
    knowledge: ['knowledge', 'understanding', 'aware', 'familiar', 'learns', 'study'],
    procedures: ['procedural', 'technical', 'skills', 'hands-on', 'ultrasound', 'intubation', 'line'],
    professionalism: ['professional', 'attitude', 'respectful', 'courteous', 'demeanor'],
    'work ethic': ['dedicated', 'hard working', 'reliable', 'dependable', 'committed'],
    teaching: ['teach', 'mentor', 'education', 'student', 'junior'],
    clinical: ['clinical', 'patient', 'diagnosis', 'differential', 'assessment', 'reasoning'],
  };

  // Add synonyms for matched keywords
  const expandedKeywords = new Set(baseKeywords);
  baseKeywords.forEach(keyword => {
    Object.entries(synonymMap).forEach(([key, synonyms]) => {
      if (key.includes(keyword) || keyword.includes(key)) {
        synonyms.forEach(syn => expandedKeywords.add(syn));
      }
    });
  });

  return Array.from(expandedKeywords);
}

/**
 * Calculate relevance score for a comment based on keyword matching
 * Returns a score between 0 and 1
 */
export function calculateRelevanceScore(commentText: string, keywords: string[]): number {
  const lowerComment = commentText.toLowerCase();
  let matchCount = 0;
  let totalWeight = 0;

  keywords.forEach(keyword => {
    // Exact phrase match (higher weight)
    if (lowerComment.includes(keyword)) {
      matchCount += 2;
      totalWeight += 2;
    }
    // Partial word match (lower weight)
    else if (lowerComment.split(/\s+/).some(word => word.includes(keyword) || keyword.includes(word))) {
      matchCount += 1;
      totalWeight += 1;
    }
  });

  // Normalize score
  if (keywords.length === 0) return 0;
  return Math.min(matchCount / Math.max(keywords.length, 5), 1);
}

/**
 * Filter comments by relevance to a theme
 * @param comments - Array of comments to filter
 * @param themeDescription - SWOT theme description
 * @param threshold - Minimum relevance score (0-1), default 0.15
 * @returns Filtered and scored comments
 */
export function filterCommentsByTheme<T extends { comment_text: string }>(
  comments: T[],
  themeDescription: string,
  threshold: number = 0.15
): Array<T & { relevance_score: number }> {
  const keywords = extractKeywords(themeDescription);
  
  const scoredComments = comments.map(comment => ({
    ...comment,
    relevance_score: calculateRelevanceScore(comment.comment_text, keywords),
  }));

  // Filter by threshold and sort by relevance
  return scoredComments
    .filter(c => c.relevance_score >= threshold)
    .sort((a, b) => b.relevance_score - a.relevance_score);
}


