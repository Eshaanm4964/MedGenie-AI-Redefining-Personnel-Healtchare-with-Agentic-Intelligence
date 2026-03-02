
import React, { useState } from 'react';
import { UserProfile, TriageStep } from '../types';
import { getNextTriageStep } from '../geminiService';
// Added missing Zap icon import to resolve "Cannot find name 'Zap'" error
import { Activity, AlertCircle, ChevronRight, Loader2, RefreshCcw, ShieldAlert, Brain, Clock, Info, Zap } from 'lucide-react';

const SymptomTriage: React.FC<{ profile: UserProfile }> = ({ profile }) => {
  const [symptoms, setSymptoms] = useState('');
  const [history, setHistory] = useState<{ question: string; answer: string }[]>([]);
  const [currentStep, setCurrentStep] = useState<TriageStep | null>(null);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);

  const startTriage = async () => {
    if (!symptoms) return;
    setLoading(true);
    setStarted(true);
    try {
      const step = await getNextTriageStep(profile, symptoms, []);
      setCurrentStep(step);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (answer: string) => {
    setLoading(true);
    const newHistory = [...history, { question: currentStep!.question, answer }];
    setHistory(newHistory);
    try {
      const step = await getNextTriageStep(profile, symptoms, newHistory);
      setCurrentStep(step);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStarted(false);
    setSymptoms('');
    setHistory([]);
    setCurrentStep(null);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Emergency': return 'bg-red-500 text-white';
      case 'High': return 'bg-orange-500 text-white';
      case 'Medium': return 'bg-yellow-500 text-slate-900';
      default: return 'bg-emerald-500 text-white';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black text-slate-900 flex items-center justify-center gap-3 italic tracking-tighter uppercase">
          <Activity className="text-emerald-500" /> Clinical Symptom Triage
        </h2>
        <p className="text-slate-500 font-medium">Multi-agent interview for rapid risk assessment.</p>
      </div>

      {!started ? (
        <div className="max-w-2xl mx-auto bg-white p-10 rounded-[2.5rem] border shadow-2xl space-y-8 animate-in zoom-in-95 duration-500">
          <div className="space-y-4">
            <label className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">Describe your current session symptoms</label>
            <textarea
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6 h-40 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700 leading-relaxed"
              placeholder="e.g. 'Sudden intense headache with blurred vision, persistent for 45 minutes...'"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />
          </div>
          <button
            onClick={startTriage}
            disabled={!symptoms}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black italic uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl disabled:opacity-30 active:scale-[0.98] flex items-center justify-center gap-3"
          >
            Initiate Interview <ChevronRight />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Interview Card */}
          <div className="lg:col-span-7 space-y-6">
            {loading ? (
              <div className="bg-white p-20 rounded-[3rem] border shadow-2xl flex flex-col items-center gap-6 animate-pulse">
                <div className="relative">
                  <Loader2 className="animate-spin text-emerald-500" size={60} />
                  <div className="absolute inset-0 bg-emerald-500/10 blur-2xl rounded-full"></div>
                </div>
                <div className="text-center">
                  <p className="text-xl font-black italic text-slate-900 tracking-tight uppercase">Analyzing Clinical Bio-Signals</p>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Computing next diagnostic step...</p>
                </div>
              </div>
            ) : currentStep ? (
              <div className="bg-white rounded-[3rem] border shadow-2xl overflow-hidden animate-in slide-in-from-left-8 duration-500">
                <div className={`p-6 flex items-center justify-between ${getRiskColor(currentStep.riskLevel)}`}>
                  <div className="flex items-center gap-3">
                    <ShieldAlert size={20} className="animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-[0.2em] italic">
                      {currentStep.riskLevel} Clinical Risk Detected
                    </span>
                  </div>
                  <span className="text-[10px] font-black bg-black/10 px-3 py-1 rounded-full uppercase italic">Session Depth: {history.length + 1}</span>
                </div>

                <div className="p-10 space-y-10">
                  {currentStep.isComplete ? (
                    <div className="space-y-8">
                      <div className="bg-emerald-50 p-8 rounded-[2rem] border border-emerald-100 shadow-inner">
                        <h4 className="font-black text-emerald-900 mb-4 text-2xl italic tracking-tighter uppercase">Clinical Recommendation</h4>
                        <p className="text-emerald-800 leading-relaxed font-bold italic text-lg">"{currentStep.result?.recommendation}"</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 group hover:border-emerald-500 transition-colors">
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Diagnostic Risk Score</p>
                          <p className="text-3xl font-black text-slate-900 tracking-tighter">{currentStep.result?.riskScore}<span className="text-sm opacity-30">/100</span></p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Response Urgency</p>
                          <p className="text-xl font-black text-slate-900 uppercase italic">{currentStep.result?.urgency}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Potential Clinical Profiles</p>
                        <div className="flex flex-wrap gap-3">
                          {currentStep.result?.potentialConditions?.map((c, i) => (
                            <span key={i} className="bg-white border-2 border-slate-100 px-5 py-2 rounded-xl text-sm text-slate-700 font-black italic tracking-tight">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={reset}
                        className="w-full py-5 rounded-2xl border-4 border-slate-50 text-slate-400 font-black uppercase tracking-widest hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center justify-center gap-3 group"
                      >
                        <RefreshCcw size={20} className="group-hover:rotate-180 transition-transform duration-500" /> Purge & Reset Assessment
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-5">
                        <h3 className="text-3xl font-black text-slate-900 leading-none italic tracking-tighter uppercase">{currentStep.question}</h3>
                        <div className="flex items-center gap-3 text-sm text-slate-400 italic font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
                           <Info size={18} className="text-emerald-500 shrink-0" />
                           <span>Summary so far: {currentStep.summarySoFar}</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {currentStep.options ? (
                          currentStep.options.map((opt, i) => (
                            <button
                              key={i}
                              onClick={() => submitAnswer(opt)}
                              className="w-full text-left p-6 rounded-[1.5rem] border-2 border-slate-50 hover:border-emerald-500 hover:bg-emerald-50 transition-all group flex items-center justify-between"
                            >
                              <span className="font-black text-slate-700 italic group-hover:text-emerald-700 uppercase tracking-tight">{opt}</span>
                              <ChevronRight size={20} className="text-slate-200 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                            </button>
                          ))
                        ) : (
                          <div className="relative">
                            <input 
                              type="text" 
                              autoFocus
                              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-6 outline-none focus:border-emerald-500 font-black italic text-slate-800 text-lg pr-16"
                              placeholder="Describe details..."
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  submitAnswer((e.target as HTMLInputElement).value);
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }}
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300">
                               <Zap size={20} />
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : null}

            {currentStep?.riskLevel === 'Emergency' && (
              <div className="bg-red-600 p-8 rounded-[3rem] text-white flex items-center gap-6 animate-pulse shadow-2xl shadow-red-500/20 border-4 border-white/20">
                <AlertCircle size={60} className="shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-2xl font-black italic tracking-tighter uppercase">Clinical Red Alert</h4>
                  <p className="text-red-100 text-sm font-bold italic leading-relaxed">
                    Protocol Exception: Life-threatening indicators detected. Cease interaction immediately and contact emergency services.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Medical Intelligence & Common Mistakes */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
             {currentStep?.educationalInsight ? (
               <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl border border-white/5 space-y-10 animate-in slide-in-from-right-8 duration-700">
                 <div className="space-y-2">
                   <div className="flex items-center gap-2 text-emerald-400 font-black text-[10px] uppercase tracking-[0.3em] italic">
                     <Brain size={14} /> Medical Intelligence Core
                   </div>
                   <h3 className="text-2xl font-black italic tracking-tighter uppercase">Session Insights</h3>
                 </div>

                 <div className="space-y-8">
                   {/* Mistake Section */}
                   <div className="space-y-3 group">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-rose-500/20 rounded-xl flex items-center justify-center text-rose-400 border border-rose-500/20 group-hover:scale-110 transition-transform">
                         <ShieldAlert size={20} />
                       </div>
                       <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Common Misstep</h4>
                     </div>
                     <p className="text-lg font-bold italic text-white/90 leading-tight">
                       "{currentStep.educationalInsight.mistake}"
                     </p>
                   </div>

                   {/* Delay Section */}
                   <div className="space-y-3 group">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
                         <Clock size={20} />
                       </div>
                       <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Risk of Procrastination</h4>
                     </div>
                     <p className="text-lg font-bold italic text-white/90 leading-tight">
                       "{currentStep.educationalInsight.delayRisk}"
                     </p>
                   </div>

                   {/* Logic Section */}
                   <div className="space-y-3 group">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
                         <Activity size={20} />
                       </div>
                       <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">The Biological "Why"</h4>
                     </div>
                     <p className="text-lg font-bold italic text-white/90 leading-tight">
                       "{currentStep.educationalInsight.medicalLogic}"
                     </p>
                   </div>
                 </div>

                 <div className="pt-8 border-t border-white/5">
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 italic">Clinical Verification Required</p>
                 </div>
               </div>
             ) : (
               <div className="bg-slate-100 rounded-[3rem] p-12 text-center space-y-6 border-4 border-dashed border-slate-200">
                  <Brain size={60} className="mx-auto text-slate-300 animate-pulse" />
                  <div className="space-y-2">
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Knowledge Engine Idle</h4>
                    <p className="text-xs text-slate-400 italic font-medium">Continue the triage to unlock deep medical insights regarding your symptoms.</p>
                  </div>
               </div>
             )}
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default SymptomTriage;
