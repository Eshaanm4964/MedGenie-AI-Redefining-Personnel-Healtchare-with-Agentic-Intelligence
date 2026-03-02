
import { GoogleGenAI, Type } from "@google/genai";
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

// 1. Twin Architect Agent
export const updateDigitalTwinAgent = async (profile: UserProfile, logs: FollowUpLog[]): Promise<DigitalTwin> => {
  const systemInstruction = `
    You are the Twin Architect Agent. 
    Maintain a "Patient Digital Twin".
    LANGUAGE RULE: Output text fields in equilibriumStatus in ${profile.preferredLanguage}.
    Return ONLY valid JSON matching the DigitalTwin interface.
  `;

  const prompt = `
    Current Profile: ${JSON.stringify(profile)}
    History Logs: ${JSON.stringify(logs)}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { systemInstruction, responseMimeType: "application/json" },
  });

  return JSON.parse(response.text || '{}');
};

// 2. Counterfactual Simulator
export const simulateCounterfactualAgent = async (twin: DigitalTwin, profile: UserProfile, scenario: string) => {
  const systemInstruction = `
    You are the Counterfactual Simulator Agent.
    Respond in ${profile.preferredLanguage}.
    Focus on "Risk Deltas".
    ${GET_SAFETY_INSTRUCTIONS(profile.preferredLanguage)}
  `;

  const prompt = `
    Digital Twin State: ${JSON.stringify(twin)}
    User Profile: ${JSON.stringify(profile)}
    What-If Request: ${scenario}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { systemInstruction },
  });

  return response.text;
};

// 3. Prescription Safety Agent
export const prescriptionSafetyAgent = async (query: string, userProfile: UserProfile) => {
  const systemInstruction = `
    You are the Prescription Safety Agent. 
    Respond in ${userProfile.preferredLanguage}.
    Use googleSearch for real-time prices.
    JSON fields medication, dosage, warnings must be in ${userProfile.preferredLanguage}.
    ${GET_SAFETY_INSTRUCTIONS(userProfile.preferredLanguage)}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{ role: 'user', parts: [{ text: `Treatment and price for: ${query}. User Allergies: ${userProfile.allergies.join(', ')}` }] }],
    config: { 
      systemInstruction, 
      responseMimeType: "application/json",
      tools: [{ googleSearch: {} }]
    },
  });

  return JSON.parse(response.text || '{}');
};

export const chatWithMediGenie = async (message: string, imageData: string | null, history: any[], userProfile: UserProfile) => {
  const systemInstruction = `
    MediGenie Orchestrator. Respond exclusively in ${userProfile.preferredLanguage}.
    ${GET_SAFETY_INSTRUCTIONS(userProfile.preferredLanguage)}
  `;
  const userParts: any[] = [{ text: message }];
  if (imageData) {
    userParts.push({ 
      inlineData: { data: imageData.split(',')[1], mimeType: 'image/jpeg' } 
    });
  }
  
  return await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [...history, { role: 'user', parts: userParts }],
    config: { systemInstruction, tools: [{ googleSearch: {} }] },
  });
};

export const summarizeHealthMemory = async (profile: UserProfile, logs: FollowUpLog[]) => {
  const systemInstruction = `Memory Agent. Respond in ${profile.preferredLanguage}.`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{ role: 'user', parts: [{ text: `Profile: ${JSON.stringify(profile)}. Logs: ${JSON.stringify(logs.slice(0, 5))}.` }] }],
    config: { systemInstruction },
  });
  return response.text;
};

export const followUpAgent = async (profile: UserProfile, previousLogs: FollowUpLog[], currentUpdate: string) => {
  const systemInstruction = `Follow-up Coordinator. Respond in ${profile.preferredLanguage}. ${GET_SAFETY_INSTRUCTIONS(profile.preferredLanguage)}`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{ role: 'user', parts: [{ text: `Current: ${currentUpdate}. History: ${JSON.stringify(previousLogs.slice(0, 3))}` }] }],
    config: { systemInstruction },
  });
  return response.text;
};

export const checkDrugInteractions = async (medications: string[], profile: UserProfile) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{ role: 'user', parts: [{ text: `Analyze interactions in ${profile.preferredLanguage}: ${medications.join(', ')}` }] }],
  });
  return response.text;
};

export const analyzeSymptomsAgent = async (input: string, profile: UserProfile, imageData?: string) => {
  const parts: any[] = [{ text: `Respond in ${profile.preferredLanguage}: ${input}` }];
  if (imageData) {
    parts.push({ 
      inlineData: { data: imageData.split(',')[1], mimeType: 'image/jpeg' } 
    });
  }
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', contents: [{ role: 'user', parts }]
  });
  return response.text;
};

export const parseLabReport = async (content: string | { data: string; mimeType: string }, profile: UserProfile) => {
  const parts: any[] = typeof content === 'string' 
    ? [{ text: `Simplify this in ${profile.preferredLanguage}: ${content}` }] 
    : [{ inlineData: content }, { text: `Simplify in ${profile.preferredLanguage}` }];
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', contents: [{ role: 'user', parts }]
  });
  return response.text;
};

export const searchMedicalInfo = async (query: string, profile: UserProfile) => {
  return await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{ role: 'user', parts: [{ text: `Search and summarize in ${profile.preferredLanguage}: ${query}` }] }],
    config: { tools: [{ googleSearch: {} }] },
  });
};

export const getNextTriageStep = async (p: UserProfile, s: string, h: any[]): Promise<TriageStep> => {
  const systemInstruction = `
    You are a professional medical triage agent.
    Provide the next triage step in JSON format.
    Include a field "educationalInsight" which contains:
    - "mistake": A common mistake people make with these symptoms.
    - "delayRisk": What happens when they delay care.
    - "medicalLogic": The pathological reason why this symptom is significant.
    Translate all response fields to ${p.preferredLanguage}.
  `;

  const res = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{ role: 'user', parts: [{ text: `Symptoms: ${s}. History: ${JSON.stringify(h)}` }] }],
    config: { systemInstruction, responseMimeType: "application/json" },
  });
  return JSON.parse(res.text || '{}');
};

export const generateCarePathway = async (userProfile: UserProfile, symptoms: string, lifestyle?: any): Promise<CarePathway> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{ role: 'user', parts: [{ text: `Pathway in ${userProfile.preferredLanguage} for: ${symptoms}. Lifestyle: ${JSON.stringify(lifestyle)}` }] }],
    config: { responseMimeType: "application/json" },
  });
  return JSON.parse(response.text || '{}');
};

export const findNearbyClinics = async (s: string, lat: number, lng: number, profile: UserProfile) => {
  return await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: `Find ${s} clinics near me. Describe results in ${profile.preferredLanguage}.` }] }],
    config: { 
      tools: [{ googleMaps: {} }], 
      toolConfig: { 
        retrievalConfig: { 
          latLng: { latitude: lat, longitude: lng } 
        } 
      } 
    },
  });
};
