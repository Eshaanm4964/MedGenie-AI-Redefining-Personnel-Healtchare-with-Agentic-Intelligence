# 🩺 MediGenie AI - Your Agentic Medical Assistant

MediGenie AI is a state of the art medical companion designed to empower users with personalized health insights, clinical-grade symptom triage, and longitudinal health tracking. Built with Google's Gemini 3 series models, it bridges the gap between complex medical data and actionable patient understanding.


## 🌟 Key Features

### 🤖 Multi-Agent Orchestration
MediGenie utilizes a specialized agentic architecture to handle diverse health queries:
- **Symptom Analyzer**: Evaluates symptoms with clinical logic and risk assessment.
- **Twin Architect**: Maintains your "Patient Digital Twin" based on health history.
- **Prescription Safety Agent**: Checks for drug interactions and real-time pricing.
- **Memory Agent**: Recalls past health events to provide context-aware advice.

### 👤 Patient Digital Twin (PDT)
- **Dynamic Modeling**: A virtual representation of your health state.
- **What-If Simulations**: Simulate the impact of lifestyle changes or medication adherence on your future health trajectories.
- **Vital Tracking**: Interactive visualizations of heart rate, BMI, and blood pressure.

### 🩺 Intelligent Symptom Triage
- **Medical Logic**: Understand the *why* behind every question asked during triage.
- **Emergency Protocol**: Immediate escalation and guidance for high-risk symptoms.
- **Educational Insights**: Learn about common medical misconceptions related to your symptoms.

### 📋 Advanced Tools
- **Lab Report Parser**: Upload images of lab results to get simplified, layman-friendly explanations.
- **Clinic Finder**: Integrated with Google Maps to find the nearest specialized healthcare facilities.
- **Drug Interaction Checker**: Analyze multiple medications for potential contraindications.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **AI Engine**: Google Gemini 3 Pro & 2.5 Flash
- **Grounding**: Google Search & Google Maps
- **Data Visualization**: Recharts
- **Icons**: Lucide React
- **Build Tool**: Vite

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/medigenie-ai.git
   cd medigenie-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## 🏗️ System Architecture

MediGenie AI follows a modular agentic architecture:
1. **Client Layer**: React-based UI with LocalStorage persistence.
2. **Service Layer**: `geminiService.ts` handles SDK interactions and prompt engineering.
3. **Agentic Layer**: Specialized agents (Symptom, Twin, Safety) process requests.
4. **Model Layer**: Gemini 3 Pro for reasoning; Gemini 2.5 Flash for speed.
5. **Grounding Layer**: Real-time data via Google Search and Maps.

## ⚠️ Safety Disclaimer

**MediGenie AI is for informational and educational purposes only.** It is NOT a substitute for professional medical advice, diagnosis, or treatment. 
- **Never** disregard professional medical advice or delay seeking it because of something you have read on this application.
- **Always** consult with a qualified healthcare provider for any medical concerns.
- In case of a medical emergency, call your local emergency services immediately.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Crafted with ❤️ for a healthier future.*
