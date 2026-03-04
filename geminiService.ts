
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { UserProfile, TriageStep, CarePathway, AgentName, FollowUpLog, DigitalTwin } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const GET_SAFETY_INSTRUCTIONS = (lang: string = 'English') => `
  STRICT SAFETY RULES:
  - NEVER state a definitive diagnosis.
  - ALWAYS include: "This is not medical advice. Consult a doctor." (Translate this to ${lang}).
  - If "Emergency" risk is detected, stop all other logic and insist on calling emergency services.
  - Disclaimer: "MediGenie recommendations are for informational purposes only. Do not exceed specified dosages."
  - ACTIVE LEARNING: If you are unsure about a clinical interpretation, DO NOT GUESS. Instead, ask the user a specific, clarifying medical question to reduce uncertainty.
  - LANGUAGE RULE: You MUST respond entirely in ${lang}.
`;

/**
 * Core Agent Class representing a specialized medical intelligence unit.
 */
export class MedicalAgent {
  constructor(
    public name: AgentName,
    private systemInstruction: string,
    private model: string = 'gemini-3-pro-preview',
    private tools: any[] = []
  ) {}

  async process(params: {
    prompt: string;
    imageData?: string | null;
    history?: any[];
    json?: boolean;
    toolConfig?: any;
    modalityParts?: any[];
  }): Promise<any> {
    const { prompt, imageData, history = [], json = false, toolConfig, modalityParts } = params;
    const userParts: any[] = modalityParts || [{ text: prompt }];
    
    if (imageData && !modalityParts) {
      userParts.push({ 
        inlineData: { 
          data: imageData.includes(',') ? imageData.split(',')[1] : imageData, 
          mimeType: 'image/jpeg' 
        } 
      });
    }

    const contents = history.length > 0 
      ? [...history, { role: 'user', parts: userParts }]
      : [{ role: 'user', parts: userParts }];

    const response = await ai.models.generateContent({
      model: this.model,
      contents,
      config: { 
        systemInstruction: this.systemInstruction, 
        responseMimeType: json ? "application/json" : undefined,
        tools: this.tools,
        toolConfig: toolConfig
      },
    });

    if (json) {
      try {
        const text = response.text || '{}';
        // Clean markdown if present
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
      } catch (e) {
        console.error(`[${this.name}] JSON Parse Error:`, e);
        return {};
      }
    }

    return response;
  }
}

// --- Agent Factory ---

const createTwinArchitect = (profile: UserProfile) => new MedicalAgent(
  'Twin Architect Agent',
  `You are the Twin Architect Agent. Maintain a "Patient Digital Twin". Return ONLY valid JSON matching the DigitalTwin interface.`
);

const createCounterfactualSimulator = (profile: UserProfile) => new MedicalAgent(
  'Counterfactual Simulator',
  `You are the Counterfactual Simulator Agent. Focus on "Risk Deltas". ${GET_SAFETY_INSTRUCTIONS(profile.preferredLanguage)}`
);

const createPrescriptionSafetyAgent = (profile: UserProfile) => new MedicalAgent(
  'Prescription Safety Agent',
  `You are the Prescription Safety Agent. Use googleSearch for real-time prices. ${GET_SAFETY_INSTRUCTIONS(profile.preferredLanguage)}`,
  'gemini-3-pro-preview',
  [{ googleSearch: {} }]
);

const createSymptomAnalyzer = (profile: UserProfile) => new MedicalAgent(
  'Symptom Analyzer',
  `You are a professional Symptom Analyzer. ${GET_SAFETY_INSTRUCTIONS(profile.preferredLanguage)}`
);

const createMedicalLibrarian = (profile: UserProfile) => new MedicalAgent(
  'Medical Librarian',
  `You are a Medical Librarian. Search and summarize peer-reviewed info. ${GET_SAFETY_INSTRUCTIONS(profile.preferredLanguage)}`,
  'gemini-3-pro-preview',
  [{ googleSearch: {} }]
);

const createSupervisor = (profile: UserProfile) => new MedicalAgent(
  'Safety Officer', // Using Safety Officer as the base for the Supervisor
  `You are the MediGenie Orchestrator Supervisor. 
   Your job is to analyze the user's request and decide which specialized agents to invoke.
   Available Agents:
   - 'Symptom Analyzer': For physical symptoms, rashes, or visual inputs.
   - 'Prescription Safety Agent': For medications, dosages, interactions, and pricing.
   - 'Medical Librarian': For general medical knowledge, research, and search grounding.
   - 'Memory Agent': For recalling user history.
   - 'Twin Architect Agent': For updating or querying the Patient Digital Twin.
   - 'Counterfactual Simulator': For "What-if" health scenarios.

   Output a JSON plan:
   {
     "agentsToInvoke": ["AgentName1", "AgentName2"],
     "reasoning": "Why these agents?",
     "subPrompts": { "AgentName1": "Specific prompt for agent 1", "AgentName2": "Specific prompt for agent 2" }
   }
   Respond ONLY in JSON.`
);

const createSynthesizer = (profile: UserProfile) => new MedicalAgent(
  'Safety Officer',
  `You are the MediGenie Synthesizer. 
   You will receive outputs from multiple specialized agents. 
   Your job is to merge them into a single, cohesive, and safe response for the user in ${profile.preferredLanguage}.
   ${GET_SAFETY_INSTRUCTIONS(profile.preferredLanguage)}`
);

/**
 * Orchestrated Chat Function
 */
export const chatWithMediGenie = async (message: string, imageData: string | null, history: any[], userProfile: UserProfile) => {
  // 1. Plan with Supervisor
  const supervisor = createSupervisor(userProfile);
  const plan = await supervisor.process({
    prompt: `User Message: ${message}. Has Image: ${!!imageData}. History: ${JSON.stringify(history.slice(-2))}`,
    json: true
  });

  const agentOutputs: Record<string, string> = {};
  const activeAgents = plan.agentsToInvoke || ['Medical Librarian'];

  // 2. Execute Agents in Parallel
  await Promise.all(activeAgents.map(async (agentName: string) => {
    let agent: MedicalAgent;
    const subPrompt = plan.subPrompts?.[agentName] || message;

    switch(agentName) {
      case 'Symptom Analyzer': agent = createSymptomAnalyzer(userProfile); break;
      case 'Prescription Safety Agent': agent = createPrescriptionSafetyAgent(userProfile); break;
      case 'Twin Architect Agent': agent = createTwinArchitect(userProfile); break;
      case 'Counterfactual Simulator': agent = createCounterfactualSimulator(userProfile); break;
      default: agent = createMedicalLibrarian(userProfile);
    }

    const res = await agent.process({ prompt: subPrompt, imageData, history });
    agentOutputs[agentName] = res.text || "No response from agent.";
  }));

  // 3. Synthesize Final Response
  const synthesizer = createSynthesizer(userProfile);
  const finalResponse = await synthesizer.process({
    prompt: `Original Message: ${message}. Agent Outputs: ${JSON.stringify(agentOutputs)}`,
    history
  });

  // Attach metadata for the UI
  (finalResponse as any).activeAgent = activeAgents[0] as AgentName;
  return finalResponse;
};

// --- Other Helper Functions ---

export const updateDigitalTwinAgent = async (profile: UserProfile, logs: FollowUpLog[]): Promise<DigitalTwin> => {
  const agent = createTwinArchitect(profile);
  return await agent.process({
    prompt: `Current Profile: ${JSON.stringify(profile)}. History Logs: ${JSON.stringify(logs)}`,
    json: true
  });
};

export const simulateCounterfactualAgent = async (twin: DigitalTwin, profile: UserProfile, scenario: string) => {
  const agent = createCounterfactualSimulator(profile);
  const response = await agent.process({
    prompt: `Digital Twin State: ${JSON.stringify(twin)}. User Profile: ${JSON.stringify(profile)}. What-If Request: ${scenario}`
  });
  return response.text;
};

export const prescriptionSafetyAgent = async (query: string, userProfile: UserProfile) => {
  const agent = createPrescriptionSafetyAgent(userProfile);
  return await agent.process({
    prompt: `Treatment and price for: ${query}. User Allergies: ${userProfile.allergies.join(', ')}`,
    json: true
  });
};

export const summarizeHealthMemory = async (profile: UserProfile, logs: FollowUpLog[]) => {
  const agent = new MedicalAgent('Memory Agent', `Memory Agent. Respond in ${profile.preferredLanguage}.`);
  const response = await agent.process({
    prompt: `Profile: ${JSON.stringify(profile)}. Logs: ${JSON.stringify(logs.slice(0, 5))}.`
  });
  return response.text;
};

export const followUpAgent = async (profile: UserProfile, previousLogs: FollowUpLog[], currentUpdate: string) => {
  const agent = new MedicalAgent('Follow-up Coordinator', `Follow-up Coordinator. Respond in ${profile.preferredLanguage}. ${GET_SAFETY_INSTRUCTIONS(profile.preferredLanguage)}`);
  const response = await agent.process({
    prompt: `Current: ${currentUpdate}. History: ${JSON.stringify(previousLogs.slice(0, 3))}`
  });
  return response.text;
};

export const checkDrugInteractions = async (medications: string[], profile: UserProfile) => {
  const agent = createPrescriptionSafetyAgent(profile);
  const response = await agent.process({
    prompt: `Analyze interactions in ${profile.preferredLanguage}: ${medications.join(', ')}`
  });
  return response.text;
};

export const analyzeSymptomsAgent = async (input: string, profile: UserProfile, imageData?: string) => {
  const agent = createSymptomAnalyzer(profile);
  const response = await agent.process({
    prompt: input,
    imageData
  });
  return response.text;
};

export const parseLabReport = async (content: string | { data: string; mimeType: string }, profile: UserProfile) => {
  const agent = new MedicalAgent('Medical Librarian', `You are a Lab Report Specialist. Simplify medical data in ${profile.preferredLanguage}.`);
  const response = await agent.process({
    prompt: typeof content === 'string' ? content : "Analyze this lab report.",
    modalityParts: typeof content === 'string' ? undefined : [{ inlineData: content }, { text: `Simplify in ${profile.preferredLanguage}` }]
  });
  return response.text;
};

export const searchMedicalInfo = async (query: string, profile: UserProfile) => {
  const agent = createMedicalLibrarian(profile);
  return await agent.process({
    prompt: `Search and summarize in ${profile.preferredLanguage}: ${query}`
  });
};

export const getNextTriageStep = async (p: UserProfile, s: string, h: any[]): Promise<TriageStep> => {
  const agent = new MedicalAgent('Risk Evaluator', `You are a professional medical triage agent. Provide the next triage step in JSON format. Translate all response fields to ${p.preferredLanguage}.`);
  return await agent.process({
    prompt: `Symptoms: ${s}. History: ${JSON.stringify(h)}`,
    json: true
  });
};

export const generateCarePathway = async (userProfile: UserProfile, symptoms: string, lifestyle?: any): Promise<CarePathway> => {
  const agent = new MedicalAgent('Action Planner', `You are an Action Planner. Generate a CarePathway in JSON format in ${userProfile.preferredLanguage}.`);
  return await agent.process({
    prompt: `Pathway in ${userProfile.preferredLanguage} for: ${symptoms}. Lifestyle: ${JSON.stringify(lifestyle)}`,
    json: true
  });
};

export const findNearbyClinics = async (s: string, lat: number, lng: number, profile: UserProfile) => {
  const agent = new MedicalAgent('Medical Librarian', `You are a Clinic Locator. Find clinics near the user. Describe results in ${profile.preferredLanguage}.`, 'gemini-2.5-flash', [{ googleMaps: {} }]);
  return await agent.process({
    prompt: `Find ${s} clinics near me. Describe results in ${profile.preferredLanguage}.`,
    toolConfig: { 
      retrievalConfig: { 
        latLng: { latitude: lat, longitude: lng } 
      } 
    }
  });
};
