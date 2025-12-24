// Board View Component - Main board layout

'use client';

import { useState, useEffect } from 'react';
import PatientCard from './PatientCard';
import { RunningBoardConfig } from '@/lib/types/modules';
import { Users, Clock, AlertCircle } from 'lucide-react';

interface BoardViewProps {
  patientCount: number;
  config: RunningBoardConfig | null;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  chiefComplaint: string;
  acuity: 'critical' | 'urgent' | 'stable';
  status: 'arrived' | 'triage' | 'exam' | 'treatment' | 'discharge';
  arrivalTime: Date;
  vitalSigns: {
    hr: number;
    bp: string;
    rr: number;
    spo2: number;
    temp: number;
  };
}

export default function BoardView({ patientCount, config }: BoardViewProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Initialize patients
    const initialPatients: Patient[] = Array.from({ length: patientCount }, (_, i) => ({
      id: `patient-${i + 1}`,
      name: `Patient ${i + 1}`,
      age: Math.floor(Math.random() * 50) + 20,
      chiefComplaint: ['Chest Pain', 'Shortness of Breath', 'Abdominal Pain', 'Headache', 'Fever'][
        Math.floor(Math.random() * 5)
      ],
      acuity: ['critical', 'urgent', 'stable'][Math.floor(Math.random() * 3)] as
        | 'critical'
        | 'urgent'
        | 'stable',
      status: 'arrived',
      arrivalTime: new Date(Date.now() - Math.random() * 3600000),
      vitalSigns: {
        hr: Math.floor(Math.random() * 40) + 60,
        bp: `${Math.floor(Math.random() * 30) + 100}/${Math.floor(Math.random() * 20) + 60}`,
        rr: Math.floor(Math.random() * 10) + 12,
        spo2: Math.floor(Math.random() * 10) + 90,
        temp: Math.floor(Math.random() * 3) + 97,
      },
    }));

    setPatients(initialPatients);

    // Update time every second
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [patientCount]);

  const getAcuityColor = (acuity: string) => {
    switch (acuity) {
      case 'critical':
        return 'bg-[#F4A5A5] text-white';
      case 'urgent':
        return 'bg-[#FFD89B] text-neutral-800';
      case 'stable':
        return 'bg-[#86C5A8] text-white';
      default:
        return 'bg-neutral-200 text-neutral-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-white/30">
          <div className="flex items-center gap-3">
            <Users className="text-[#7EC8E3]" size={24} />
            <div>
              <div className="text-2xl font-bold text-neutral-800">{patients.length}</div>
              <div className="text-sm text-neutral-600">Total Patients</div>
            </div>
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-white/30">
          <div className="flex items-center gap-3">
            <Clock className="text-[#7EC8E3]" size={24} />
            <div>
              <div className="text-2xl font-bold text-neutral-800">
                {currentTime.toLocaleTimeString()}
              </div>
              <div className="text-sm text-neutral-600">Current Time</div>
            </div>
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-white/30">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-[#F4A5A5]" size={24} />
            <div>
              <div className="text-2xl font-bold text-neutral-800">
                {patients.filter((p) => p.acuity === 'critical').length}
              </div>
              <div className="text-sm text-neutral-600">Critical</div>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {patients.map((patient) => (
          <PatientCard key={patient.id} patient={patient} />
        ))}
      </div>

      {/* Coming Soon Notice */}
      <div className="bg-[#FFD89B]/60 backdrop-blur-sm border border-[#FFD89B]/30 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-[#FFD89B]" size={24} />
          <div>
            <h3 className="font-semibold text-neutral-800 mb-1">Full Simulation Under Development</h3>
            <p className="text-sm text-neutral-700">
              The complete multi-patient management interface with order placement, status updates, and real-time progression is coming soon. This is a preview of the patient board layout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


