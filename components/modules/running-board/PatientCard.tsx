// Patient Card Component

'use client';

import { Patient } from './BoardView';
import { Clock, Heart, Thermometer, Activity } from 'lucide-react';

interface PatientCardProps {
  patient: Patient;
}

export default function PatientCard({ patient }: PatientCardProps) {
  const getAcuityColor = (acuity: string) => {
    switch (acuity) {
      case 'critical':
        return 'bg-[#F4A5A5]/20 text-[#F4A5A5] border-[#F4A5A5]/30';
      case 'urgent':
        return 'bg-[#FFD89B]/20 text-[#FFD89B] border-[#FFD89B]/30';
      case 'stable':
        return 'bg-[#86C5A8]/20 text-[#86C5A8] border-[#86C5A8]/30';
      default:
        return 'bg-neutral-200 text-neutral-600 border-neutral-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'arrived':
        return 'bg-[#D4F1F4] text-[#7EC8E3]';
      case 'triage':
        return 'bg-[#FFE5D9] text-[#FFB5A7]';
      case 'exam':
        return 'bg-[#FFD89B]/30 text-[#FFD89B]';
      case 'treatment':
        return 'bg-[#86C5A8]/30 text-[#86C5A8]';
      case 'discharge':
        return 'bg-neutral-200 text-neutral-600';
      default:
        return 'bg-neutral-200 text-neutral-600';
    }
  };

  const timeInED = Math.floor(
    (Date.now() - patient.arrivalTime.getTime()) / 1000 / 60
  );

  return (
    <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-md border border-white/30 hover:shadow-lg transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-neutral-800">{patient.name}</h3>
          <p className="text-sm text-neutral-600">{patient.age} years old</p>
        </div>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-lg border ${getAcuityColor(
            patient.acuity
          )}`}
        >
          {patient.acuity}
        </span>
      </div>

      {/* Chief Complaint */}
      <div className="mb-4">
        <p className="text-sm font-medium text-neutral-700 mb-1">Chief Complaint</p>
        <p className="text-neutral-800">{patient.chiefComplaint}</p>
      </div>

      {/* Vital Signs */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Heart size={16} className="text-[#F4A5A5]" />
          <span className="text-xs text-neutral-600">
            HR: <span className="font-semibold text-neutral-800">{patient.vitalSigns.hr}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-[#7EC8E3]" />
          <span className="text-xs text-neutral-600">
            BP: <span className="font-semibold text-neutral-800">{patient.vitalSigns.bp}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-[#86C5A8]" />
          <span className="text-xs text-neutral-600">
            RR: <span className="font-semibold text-neutral-800">{patient.vitalSigns.rr}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Thermometer size={16} className="text-[#FFD89B]" />
          <span className="text-xs text-neutral-600">
            SpO₂: <span className="font-semibold text-neutral-800">{patient.vitalSigns.spo2}%</span>
          </span>
        </div>
      </div>

      {/* Status and Time */}
      <div className="flex items-center justify-between pt-4 border-t border-white/30">
        <span
          className={`text-xs font-medium px-2 py-1 rounded-lg ${getStatusColor(patient.status)}`}
        >
          {patient.status}
        </span>
        <div className="flex items-center gap-1 text-xs text-neutral-500">
          <Clock size={12} />
          <span>{timeInED} min</span>
        </div>
      </div>
    </div>
  );
}


