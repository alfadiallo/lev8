// Rubric Modal Component
// Displays the SWOT analysis rubric used by AI

'use client';

import { useEffect } from 'react';
import { X, FileText, Target, BarChart3, GraduationCap, MessageSquare, Lightbulb } from 'lucide-react';
import { extractRubricFromPrompt, getScoringScale } from '@/lib/ai/rubric-extractor';
import { SWOT_RUBRIC_VERSION, SWOT_RUBRIC_LAST_UPDATED } from '@/lib/ai/swot-prompt';

interface RubricModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RubricModal({ isOpen, onClose }: RubricModalProps) {
  const rubric = extractRubricFromPrompt();
  const scoringScale = getScoringScale();

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div>
            <h2 className="text-2xl font-bold text-neutral-800">SWOT Analysis Rubric</h2>
            <p className="text-sm text-neutral-600 mt-1">
              Individual Resident Evaluation Criteria
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={24} className="text-neutral-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Overview */}
          <section>
            <h3 className="text-lg font-semibold text-neutral-800 mb-3 flex items-center gap-2">
              <FileText className="text-blue-600" size={24} />
              Overview
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-neutral-700 leading-relaxed whitespace-pre-line">
                {rubric.overview}
              </p>
            </div>
          </section>

          {/* SWOT Categories */}
          <section>
            <h3 className="text-lg font-semibold text-neutral-800 mb-3 flex items-center gap-2">
              <Target className="text-green-600" size={24} />
              SWOT Categories
            </h3>
            <div className="space-y-4">
              {rubric.categories.map((category, index) => (
                <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-neutral-800 mb-2">
                    {category.title}
                  </h4>
                  <p className="text-neutral-700 text-sm mb-2">{category.content}</p>
                  
                  {category.subsections && category.subsections.length > 0 && (
                    <ul className="ml-4 space-y-2 mt-3">
                      {category.subsections.map((sub, subIndex) => (
                        <li key={subIndex} className="text-sm">
                          <span className="font-medium text-neutral-800">{sub.title}:</span>
                          <span className="text-neutral-600 ml-1">{sub.content}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Scoring Scale */}
          <section>
            <h3 className="text-lg font-semibold text-neutral-800 mb-3 flex items-center gap-2">
              <BarChart3 className="text-purple-600" size={24} />
              Scoring Scale
            </h3>
            <div className="bg-gradient-to-br from-green-50 to-red-50 border border-gray-200 rounded-lg p-4">
              <div className="space-y-2">
                {scoringScale.map((item, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-3 p-2 bg-white/80 rounded"
                  >
                    <span className="font-bold text-lg text-neutral-800 min-w-[3rem]">
                      {item.score}
                    </span>
                    <span className="text-neutral-700">{item.description}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-neutral-600 mt-4 italic">
                {rubric.scoringGuidance}
              </p>
            </div>
          </section>

          {/* Scoring Attributes */}
          <section>
            <h3 className="text-lg font-semibold text-neutral-800 mb-3 flex items-center gap-2">
              <GraduationCap className="text-indigo-600" size={24} />
              {rubric.scoringScale.title}
            </h3>
            <p className="text-neutral-700 mb-4">{rubric.scoringScale.content}</p>
            
            <div className="space-y-4">
              {rubric.scoringScale.subsections?.map((section, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-neutral-800 mb-3">{section.title}</h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {section.subsections?.map((attr, attrIndex) => (
                      <div key={attrIndex} className="bg-gray-50 rounded p-3">
                        <span className="font-medium text-sm text-neutral-800">
                          {attr.title}:
                        </span>
                        <span className="text-sm text-neutral-600 ml-1">
                          {attr.content}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Evidence Requirements */}
          <section>
            <h3 className="text-lg font-semibold text-neutral-800 mb-3 flex items-center gap-2">
              <MessageSquare className="text-teal-600" size={24} />
              Supporting Evidence
            </h3>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-neutral-700 leading-relaxed whitespace-pre-line">
                {rubric.evidenceRequirements}
              </p>
            </div>
          </section>

          {/* Philosophy */}
          <section>
            <h3 className="text-lg font-semibold text-neutral-800 mb-3 flex items-center gap-2">
              <Lightbulb className="text-yellow-600" size={24} />
              Analysis Philosophy
            </h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-neutral-700 leading-relaxed whitespace-pre-line">
                {rubric.outputFormat}
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-neutral-600">
            <div>
              <span className="font-medium">Rubric Version:</span> {SWOT_RUBRIC_VERSION}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span> {SWOT_RUBRIC_LAST_UPDATED}
            </div>
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            This rubric is extracted directly from the AI prompt to ensure accuracy and transparency.
          </p>
        </div>
      </div>
    </div>
  );
}

