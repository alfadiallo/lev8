'use client';

import { useState } from 'react';
import SubAttributeSection from './SubAttributeSection';
import { Domain } from '@/lib/interview/guide-data';

interface DomainGuidePanelProps {
  domain: Domain;
  usedQuestions: Record<string, boolean>;
  onQuestionToggle: (questionId: string) => void;
}

export default function DomainGuidePanel({
  domain,
  usedQuestions,
  onQuestionToggle
}: DomainGuidePanelProps) {
  // Track which sub-attributes are expanded
  const [expandedAttrs, setExpandedAttrs] = useState<Record<string, boolean>>({});

  const toggleAttr = (attrId: string) => {
    setExpandedAttrs(prev => ({
      ...prev,
      [attrId]: !prev[attrId]
    }));
  };

  return (
    <div className="space-y-2 mt-4">
      {domain.subAttributes.map(attr => (
        <SubAttributeSection
          key={attr.id}
          domainId={domain.id}
          subAttribute={attr}
          isExpanded={expandedAttrs[attr.id] || false}
          onToggle={() => toggleAttr(attr.id)}
          usedQuestions={usedQuestions}
          onQuestionToggle={onQuestionToggle}
        />
      ))}
    </div>
  );
}
