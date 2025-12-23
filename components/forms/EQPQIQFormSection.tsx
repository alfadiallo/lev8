'use client';

import React from 'react';
import RatingSlider from './RatingSlider';

interface Attribute {
  key: string;
  label: string;
  description: string;
}

interface EQPQIQFormSectionProps {
  title: string;
  subtitle: string;
  color: string;
  attributes: Attribute[];
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
  average: number;
}

export default function EQPQIQFormSection({
  title,
  subtitle,
  color,
  attributes,
  values,
  onChange,
  average,
}: EQPQIQFormSectionProps) {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <div>
          <h3 className={`text-lg font-bold ${color}`}>{title}</h3>
          <p className="text-sm text-neutral-600">{subtitle}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-neutral-600">Average</div>
          <div className={`text-2xl font-bold ${color}`}>
            {average.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Attributes */}
      <div className="space-y-6">
        {attributes.map((attr) => (
          <RatingSlider
            key={attr.key}
            label={attr.label}
            description={attr.description}
            value={values[attr.key] || 3.0}
            onChange={(value) => onChange(attr.key, value)}
            required
          />
        ))}
      </div>
    </div>
  );
}


