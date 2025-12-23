// MED-001: Clinical Scenario Data
// Complete medical foundation for Adenosine Error vignette

import { ClinicalScenario } from '../../../types/difficult-conversations';

export const medicationErrorScenario: ClinicalScenario = {
  patient: {
    demographics: { 
      age: 72, 
      gender: "male",
      identifier: "Patient J.D."
    },
    medicalHistory: [
      "dilated cardiomyopathy",
      "hypertension",
      "chronic systolic heart failure (EF 35%)",
      "previous MI (2019)"
    ],
    presentation: { 
      chiefComplaint: "palpitations and dizziness",
      vitals: { 
        hr: 180, 
        bp: "90/60", 
        rhythm: "wide-complex tachycardia",
        spo2: "94% on room air",
        rr: 22,
        temp: "98.6°F"
      },
      ekgFindings: {
        rate: 180,
        rhythm: "regular wide-complex tachycardia",
        qrsWidth: "160ms",
        morphology: "LBBB pattern"
      }
    }
  },
  
  clinicalEvents: {
    initialAssessment: {
      time: "14:00",
      findings: "Alert but anxious, diaphoretic, speaking in short sentences"
    },
    misdiagnosis: {
      time: "14:15",
      error: "Misinterpreted as SVT with aberrancy",
      reasoning: "Regular rhythm, patient hemodynamically stable",
      actualDiagnosis: "Ventricular tachycardia"
    },
    intervention: {
      time: "14:15",
      medication: "adenosine 6mg IV push",
      route: "right antecubital IV",
      flush: "20mL normal saline rapid flush"
    },
    complication: {
      time: "14:16",
      event: "Degenerated to ventricular fibrillation",
      patientStatus: "Loss of consciousness, pulseless"
    },
    resuscitation: {
      time: "14:16-14:22",
      interventions: [
        "CPR initiated immediately",
        "Defibrillation 200J biphasic x2",
        "Epinephrine 1mg IV x2",
        "Amiodarone 300mg IV"
      ],
      outcome: "ROSC achieved at 14:22"
    },
    currentStatus: {
      time: "14:22",
      location: "Medical ICU",
      condition: "Intubated and sedated",
      vitals: "Stable on norepinephrine drip",
      neuroStatus: "Following commands when sedation lightened",
      prognosis: "Guarded but showing signs of neurological recovery"
    }
  },
  
  timeline: [
    { time: "0 min", event: "Patient presents to ED with palpitations" },
    { time: "10 min", event: "IV access obtained, initial labs drawn" },
    { time: "14 min", event: "12-lead EKG shows wide-complex tachycardia" },
    { time: "15 min", event: "Decision made to give adenosine for presumed SVT" },
    { time: "15 min 30 sec", event: "Adenosine 6mg administered" },
    { time: "16 min", event: "Patient develops VF arrest" },
    { time: "16-22 min", event: "ACLS protocol, CPR, defibrillation x2" },
    { time: "22 min", event: "ROSC achieved" },
    { time: "30 min", event: "Post-arrest care initiated, cooling protocol" },
    { time: "45 min", event: "Transferred to ICU" },
    { time: "2 hours", event: "Family arrives, needs disclosure" }
  ],
  
  errorAnalysis: {
    category: "Diagnostic error leading to inappropriate treatment",
    severity: "Category D - Error reached patient and required intervention",
    preventability: "Preventable with proper EKG interpretation",
    contributingFactors: [
      "Time pressure in busy ED",
      "Cognitive bias (anchoring on SVT diagnosis)",
      "Inadequate evaluation of QRS morphology",
      "No senior consultation before treatment"
    ]
  },
  
  teachingPoints: {
    clinical: [
      "VT vs SVT with aberrancy differentiation",
      "Adenosine contraindications in wide-complex tachycardia",
      "Importance of systematic EKG interpretation",
      "When to consult cardiology before treatment"
    ],
    communication: [
      "Timely and honest error disclosure",
      "Managing family emotions during crisis",
      "Rebuilding trust after medical error",
      "Balancing honesty with hope"
    ],
    systems: [
      "Importance of cognitive timeouts",
      "Value of senior consultation",
      "Error reporting and system improvement",
      "Supporting staff after adverse events"
    ]
  }
};

