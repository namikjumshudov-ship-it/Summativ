import React, { useState, useEffect } from 'react';
import { AppState, EvaluationData, AIAnalysisResult, OBSERVATION_FORM_STRUCTURE, SavedEvaluation, MediaFile } from './types';
import { StarRating } from './components/StarRating';
import { AnalysisView } from './components/AnalysisView';
import { HistoryView } from './components/HistoryView';
import { analyzeEvaluation } from './services/geminiService';
import { Video, Mic, FileWarning, ArrowLeft } from 'lucide-react';

const STORAGE_KEY = 'dersmonitor_evaluations';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.HISTORY);
  const [loadingText, setLoadingText] = useState("Dərs təhlil edilir...");
  
  // Persistent Storage State
  const [savedEvaluations, setSavedEvaluations] = useState<SavedEvaluation[]>([]);

  const [formData, setFormData] = useState<EvaluationData>({
    observerName: '',
    teacherName: '',
    subject: '',
    topic: '',
    classGrade: '',
    ratings: {},
    comment: '',
    videoData: null,
    audioData: null
  });

  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSavedEvaluations(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save to local storage whenever savedEvaluations changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedEvaluations));
  }, [savedEvaluations]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRatingChange = (criteriaId: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      ratings: { ...prev.ratings, [criteriaId]: value }
    }));
  };

  const fileToMedia = (file: File): Promise<MediaFile> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove data URL prefix (e.g. "data:image/jpeg;base64,")
        const base64Data = base64String.split(',')[1];
        resolve({
          data: base64Data,
          mimeType: file.type,
          name: file.name
        });
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'audio') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Limit file size to 20MB for browser safety (base64 overhead)
      if (file.size > 20 * 1024 * 1024) {
        alert("Fayl çox böyükdür. Brauzer yaddaşı üçün maksimum 20MB məsləhətdir.");
        return;
      }
      try {
        const media = await fileToMedia(file);
        setFormData(prev => ({
          ...prev,
          [type === 'video' ? 'videoData' : 'audioData']: media
        }));
      } catch (error) {
        console.error("File reading error", error);
        alert("Fayl oxunarkən xəta baş verdi.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.teacherName || !formData.subject || !formData.observerName) {
      alert("Zəhmət olmasa, əsas məlumatları daxil edin.");
      return;
    }
    
    if (Object.keys(formData.ratings).length < 5) {
       if(!confirm("Meyarların çoxu qiymətləndirilməyib. Davam etmək istəyirsiniz?")) {
         return;
       }
    }

    setAppState(AppState.ANALYZING);
    
    const timers = [
      setTimeout(() => setLoadingText("Rubriklər analiz edilir..."), 1000),
      setTimeout(() => setLoadingText("Güclü və zəif tərəflər müəyyən edilir..."), 3000),
      setTimeout(() => setLoadingText("Yekun hesabat hazırlanır..."), 5000),
    ];

    try {
      const result = await analyzeEvaluation(formData);
      setAnalysisResult(result);
      
      // Save logic
      const newRecord: SavedEvaluation = {
        ...formData,
        id: formData.id || Date.now().toString(),
        timestamp: formData.timestamp || Date.now(),
        result: result
      };

      setSavedEvaluations(prev => {
        const exists = prev.findIndex(p => p.id === newRecord.id);
        if (exists >= 0) {
          const updated = [...prev];
          updated[exists] = newRecord;
          return updated;
        }
        return [newRecord, ...prev];
      });

      setAppState(AppState.RESULT);
    } catch (error) {
      console.error(error);
      setAppState(AppState.ERROR);
    } finally {
      timers.forEach(clearTimeout);
    }
  };

  const resetToHistory = () => {
    setAppState(AppState.HISTORY);
    setFormData({
      observerName: '',
      teacherName: '',
      subject: '',
      topic: '',
      classGrade: '',
      ratings: {},
      comment: '',
      videoData: null,
      audioData: null
    });
    setAnalysisResult(null);
  };

  const startNew = () => {
    setFormData({
      observerName: '',
      teacherName: '',
      subject: '',
      topic: '',
      classGrade: '',
      ratings: {},
      comment: '',
      videoData: null,
      audioData: null
    });
    setAnalysisResult(null);
    setAppState(AppState.FORM);
  };

  const handleViewHistory = (id: string) => {
    const record = savedEvaluations.find(r => r.id === id);
    if (record) {
      setFormData(record);
      setAnalysisResult(record.result);
      setAppState(AppState.RESULT);
    }
  };

  const handleEditHistory = (id: string) => {
    const record = savedEvaluations.find(r => r.id === id);
    if (record) {
      setFormData(record);
      setAppState(AppState.FORM);
    }
  };

  const handleDeleteHistory = (id: string) => {
    setSavedEvaluations(prev => prev.filter(r => r.id !== id));
  };

  if (appState === AppState.HISTORY) {
    return (
      <div className="min-h-screen bg-slate-50">
         <HistoryView 
            evaluations={savedEvaluations}
            onNew={startNew}
            onView={handleViewHistory}
            onEdit={handleEditHistory}
            onDelete={handleDeleteHistory}
         />
      </div>
    );
  }

  if (appState === AppState.ANALYZING) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-indigo-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-slate-800 animate-pulse">{loadingText}</h2>
        <p className="text-slate-500 mt-2 text-sm">Gemini 2.5 tərəfindən emal edilir</p>
        {(formData.videoData || formData.audioData) && (
           <p className="text-indigo-500 mt-2 text-xs font-medium bg-indigo-50 px-3 py-1 rounded-full">Multimedia analizi aktivdir</p>
        )}
      </div>
    );
  }

  if (appState === AppState.RESULT && analysisResult) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <AnalysisView inputData={formData} result={analysisResult} onReset={resetToHistory} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
           <button onClick={() => setAppState(AppState.HISTORY)} className="flex items-center text-slate-500 hover:text-slate-800 transition-colors font-medium">
              <ArrowLeft size={20} className="mr-1" />
              Tarixçəyə qayıt
           </button>
        </div>

        <div className="text-center mb-10">
          <div className="inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase mb-2">Peşəkar Versiya</div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl mb-2">
            Dərs Müşahidə <span className="text-indigo-600">Sistemi</span>
          </h1>
          <p className="text-base text-slate-600">
            Müəllim fəaliyyətinin rəqəmsal qiymətləndirilməsi
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
          <div className="bg-slate-900 px-6 py-5 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Müşahidə Vərəqi
            </h3>
            <span className="text-xs text-slate-400">v2.1 (Rubrik Sistemi)</span>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
            
            {/* General Info Section */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h4 className="text-sm uppercase tracking-wider text-slate-500 font-bold mb-4 border-b border-slate-200 pb-2">Ümumi Məlumatlar</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Müşahidəçi (Ad, Soyad)</label>
                  <input
                    type="text"
                    name="observerName"
                    required
                    value={formData.observerName}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Müəllim (Ad, Soyad)</label>
                  <input
                    type="text"
                    name="teacherName"
                    required
                    value={formData.teacherName}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fənn</label>
                  <input
                    type="text"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sinif</label>
                  <input
                    type="text"
                    name="classGrade"
                    required
                    placeholder="Məs: 9A"
                    value={formData.classGrade}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3"
                  />
                </div>
                 <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mövzu</label>
                  <input
                    type="text"
                    name="topic"
                    required
                    value={formData.topic}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3"
                  />
                </div>
              </div>
            </div>

            {/* Media Upload Section */}
            <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
               <h4 className="text-sm uppercase tracking-wider text-indigo-800 font-bold mb-4 border-b border-indigo-200 pb-2 flex items-center gap-2">
                 Multimedia Sübutlar
                 <span className="text-[10px] bg-indigo-200 px-2 py-0.5 rounded text-indigo-800 normal-case">Beta</span>
               </h4>
               <p className="text-xs text-indigo-600 mb-4">
                 Dərsin video və ya səs yazısını yükləyərək AI analizinin dəqiqliyini artırın. 
                 <br/><span className="font-bold">Qeyd:</span> Yalnız kiçik həcmli fayllar (maks 20MB) dəstəklənir.
               </p>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${formData.videoData ? 'border-green-400 bg-green-50' : 'border-indigo-200 hover:border-indigo-400 bg-white'}`}>
                     <input 
                       type="file" 
                       accept="video/*" 
                       onChange={(e) => handleFileChange(e, 'video')} 
                       className="hidden" 
                       id="video-upload"
                     />
                     <label htmlFor="video-upload" className="cursor-pointer w-full h-full flex flex-col items-center">
                        <Video size={24} className={formData.videoData ? "text-green-600" : "text-indigo-400"} />
                        <span className="text-sm font-medium mt-2 text-slate-700">
                          {formData.videoData ? "Video Yükləndi" : "Video əlavə et"}
                        </span>
                        {formData.videoData && <span className="text-xs text-green-600 mt-1 max-w-[150px] truncate">{formData.videoData.name}</span>}
                     </label>
                  </div>

                  <div className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${formData.audioData ? 'border-green-400 bg-green-50' : 'border-indigo-200 hover:border-indigo-400 bg-white'}`}>
                     <input 
                       type="file" 
                       accept="audio/*" 
                       onChange={(e) => handleFileChange(e, 'audio')} 
                       className="hidden" 
                       id="audio-upload"
                     />
                     <label htmlFor="audio-upload" className="cursor-pointer w-full h-full flex flex-col items-center">
                        <Mic size={24} className={formData.audioData ? "text-green-600" : "text-indigo-400"} />
                        <span className="text-sm font-medium mt-2 text-slate-700">
                           {formData.audioData ? "Səs Yükləndi" : "Səs əlavə et"}
                        </span>
                         {formData.audioData && <span className="text-xs text-green-600 mt-1 max-w-[150px] truncate">{formData.audioData.name}</span>}
                     </label>
                  </div>
               </div>
            </div>

            {/* Dynamic Observation Sections */}
            {OBSERVATION_FORM_STRUCTURE.map((section) => (
              <div key={section.id} className="pt-2">
                <div className="flex items-center gap-3 mb-4 bg-slate-100 p-3 rounded-lg border-l-4 border-slate-600">
                  <h4 className="text-lg font-bold text-slate-800">
                    {section.title}
                  </h4>
                  <span className="text-xs font-semibold bg-slate-200 text-slate-700 px-2 py-1 rounded">
                    {section.weight}%
                  </span>
                </div>
                
                <div className="space-y-2">
                  {section.criteria.map((criteria) => (
                    <div key={criteria.id} className="bg-white hover:bg-slate-50 px-4 rounded-xl transition-colors border border-slate-100 hover:border-slate-200 shadow-sm">
                      <StarRating 
                        label={criteria.label}
                        value={formData.ratings[criteria.id] || 0}
                        rubrics={criteria.rubrics}
                        onChange={(v) => handleRatingChange(criteria.id, v)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Comment */}
            <div className="border-t border-slate-100 pt-6">
              <label className="block text-lg font-bold text-slate-800 mb-2">Əlavə Qeydlər</label>
              <p className="text-sm text-slate-500 mb-3">Dərs zamanı diqqətinizi çəkən xüsusi məqamları və ya qiymətləndirmədən kənar qalan hissələri qeyd edin.</p>
              <textarea
                name="comment"
                rows={4}
                value={formData.comment}
                onChange={handleInputChange}
                placeholder="..."
                className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3 px-4"
              />
            </div>

            <div className="sticky bottom-4 sm:static pt-4 sm:pt-0 z-40">
               <button
                type="submit"
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl shadow-indigo-200 text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform active:scale-[0.99]"
              >
                Analiz Et və Nəticəni Göstər
              </button>
            </div>
            
          </form>
        </div>
        
        {appState === AppState.ERROR && (
           <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
             <p className="text-sm text-red-700">
               Xəta baş verdi. Zəhmət olmasa internet bağlantısını yoxlayın və yenidən cəhd edin.
             </p>
             <button onClick={() => setAppState(AppState.FORM)} className="text-red-700 underline text-sm mt-1">Yenidən cəhd et</button>
          </div>
        )}

      </div>
    </div>
  );
};

export default App;