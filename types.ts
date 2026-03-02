
export interface DigitalTwin {
  vitals: {
    heartRate: number[];
    bmi: number[];
    bloodPressure: string[];
    lastUpdated: Date;
  };
  trajectories: {
    label: string;
    values: number[];
    dates: string[];
  }[];
  medicationResponses: Array<{
    med: string;
    effectiveness: 'High' | 'Medium' | 'Low' | 'Unknown';
    sideEffectsSeverity: 'None' | 'Mild' | 'Moderate' | 'Severe';
  }>;
  equilibriumStatus: string; // Qualitative state summary
}

export interface UserProfile {
  name: string;
  age: number;
  gender: string;
  weight: number;
  height: number;
  bloodGroup: string;
  allergies: string[];
  medicalHistory: string;
  healthSummary?: string;
  digitalTwin?: DigitalTwin; // The Patient Digital Twin model
  preferredLanguage: string; // New field for internationalization
  isRegistered: boolean;
}

export type AgentName = 
  | 'Symptom Analyzer' 
  | 'Medical Librarian' 
  | 'Risk Evaluator' 
  | 'Action Planner' 
  | 'Safety Officer'
  | 'Follow-up Coordinator'
  | 'Prescription Safety Agent'
  | 'Memory Agent'
  | 'Twin Architect Agent'
  | 'Counterfactual Simulator';

export interface EducationalInsight {
  mistake: string;
  delayRisk: string;
  medicalLogic: string;
}

export interface TriageStep {
  question: string;
  options?: string[];
  riskLevel: 'Low' | 'Medium' | 'High' | 'Emergency';
  summarySoFar: string;
  isComplete: boolean;
  educationalInsight?: EducationalInsight;
  result?: TriageResult;
}

export interface TriageResult {
  potentialConditions: string[];
  riskScore: number;
  recommendation: string;
  urgency: string;
}

export interface CarePathway {
  potentialCauses: Array<{ title: string; likelihood: string; description: string }>;
  immediateActions: string[];
  homeCareSteps: string[];
  doctorFollowUp: string;
  redFlags: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  image?: string;
  timestamp: Date;
  sources?: Array<{ title: string; uri: string }>;
  confidence?: 'Low' | 'Medium' | 'High';
  activeAgent?: AgentName;
  recommendation?: {
    medication: string;
    dosage: string;
    price?: string;
    sideEffects: string[];
    warnings: string[];
  };
}

export interface FollowUpLog {
  id: string;
  date: Date;
  condition: string;
  status: 'Improving' | 'Stable' | 'Worsening';
  notes: string;
}
