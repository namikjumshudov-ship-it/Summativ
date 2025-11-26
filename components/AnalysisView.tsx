import React, { useRef, useState } from 'react';
import { EvaluationData, AIAnalysisResult, OBSERVATION_FORM_STRUCTURE } from '../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

// Declare jsPDF and html2canvas on window since they are loaded via CDN
declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
  }
}

interface AnalysisViewProps {
  inputData: EvaluationData;
  result: AIAnalysisResult;
  onReset: () => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ inputData, result, onReset }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPDF = async () => {
    if (!contentRef.current || !window.html2canvas || !window.jspdf) return;

    setIsGeneratingPdf(true);

    // Allow UI to update
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const element = contentRef.current;
      const scrollHeight = element.scrollHeight;
      
      const canvas = await window.html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        height: scrollHeight, // Capture full height
        windowHeight: scrollHeight,
        onclone: (clonedDoc) => {
            const el = clonedDoc.querySelector('[data-pdf-target]') as HTMLElement;
            if (el) {
                el.style.height = 'auto';
                el.style.overflow = 'visible';
                el.style.maxHeight = 'none';
            }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`Müşahidə_${inputData.teacherName.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("PDF generation failed", error);
      alert("PDF yaradılarkən xəta baş verdi.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Prepare data for Radar Chart
  const radarData = OBSERVATION_FORM_STRUCTURE.map(section => ({
    subject: section.title.split(' ')[0] + '...', // Short name
    fullTitle: section.title,
    score: result.categoryScores[section.id] || 0,
    fullMark: 100
  }));

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-indigo-600';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-600';
  };

  return (
    <div className="max-w-5xl mx-auto pb-24 animate-fade-in">
      
      {/* Action Bar */}
      <div className="flex justify-end mb-4 gap-3 print:hidden">
        <button
          onClick={handleDownloadPDF}
          disabled={isGeneratingPdf}
          className={`bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm flex items-center gap-2 transition-colors ${isGeneratingPdf ? 'opacity-75 cursor-wait' : ''}`}
        >
          {isGeneratingPdf ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Hazırlanır...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              PDF Yüklə
            </>
          )}
        </button>
      </div>

      <div ref={contentRef} data-pdf-target className="bg-white p-4 sm:p-8 min-h-screen">
        {/* Header & Analysis Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8 border border-slate-100">
          <div className="bg-gradient-to-r from-slate-900 to-indigo-900 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-10 -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
              <div>
                <div className="text-indigo-200 font-medium mb-1 tracking-wide uppercase text-xs">Rəsmi Müşahidə Nəticəsi</div>
                <h2 className="text-3xl font-bold mb-1">{inputData.teacherName}</h2>
                <p className="opacity-80 text-sm flex flex-wrap gap-3 mt-2">
                  <span className="bg-white/10 px-2 py-1 rounded-md">{inputData.subject}</span>
                  <span className="bg-white/10 px-2 py-1 rounded-md">{inputData.classGrade}</span>
                  <span className="bg-white/10 px-2 py-1 rounded-md">{inputData.topic}</span>
                </p>
                <p className="mt-2 text-xs opacity-60">Müşahidəçi: {inputData.observerName} | Tarix: {new Date().toLocaleDateString('az-AZ')}</p>
              </div>
              <div className="mt-6 md:mt-0 flex items-center gap-4">
                <div className="text-right mr-2 hidden md:block">
                  <div className="text-sm opacity-70">Yekun Bal</div>
                  <div className="text-xs opacity-50">Maksimum: 100</div>
                </div>
                <div className="relative w-24 h-24 flex items-center justify-center bg-white text-slate-900 rounded-full shadow-2xl ring-4 ring-white/20">
                  <div className="text-center">
                    <div className="text-3xl font-extrabold leading-none">{result.score}</div>
                    <div className={`text-[10px] font-bold uppercase mt-1 ${
                      result.score >= 80 ? 'text-green-600' : 
                      result.score >= 50 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {result.score >= 90 ? 'Əla' : result.score >= 75 ? 'Yaxşı' : result.score >= 50 ? 'Kafi' : 'Zəif'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8">
            
            {/* Detailed Scores Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {OBSERVATION_FORM_STRUCTURE.map(section => (
                <div key={section.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                  <div className="text-xs text-slate-500 mb-1 h-8 flex items-center justify-center leading-tight">
                    {section.title}
                  </div>
                  <div className={`text-xl font-bold ${getScoreColor(result.categoryScores[section.id])}`}>
                    {result.categoryScores[section.id]}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Çəki: {section.weight}%</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Chart */}
              <div className="lg:col-span-1 bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
                <h4 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wider">Kompetensiya Diaqramı</h4>
                <div className="w-full h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar
                        name="Müəllim"
                        dataKey="score"
                        stroke="#4f46e5"
                        strokeWidth={2}
                        fill="#6366f1"
                        fillOpacity={0.5}
                      />
                      <Tooltip 
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AI Summary */}
              <div className="lg:col-span-2 space-y-6">
                 <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <span className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </span>
                      Ümumi Pedaqoji Rəy
                    </h3>
                    <p className="text-slate-700 leading-relaxed text-justify text-sm md:text-base">
                      {result.summary}
                    </p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 p-5 rounded-xl border border-green-100">
                      <h4 className="font-bold text-green-800 mb-3 text-sm uppercase">Güclü Tərəflər</h4>
                      <ul className="space-y-2">
                        {result.strengths.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-green-900">
                            <svg className="w-4 h-4 text-green-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-red-50 p-5 rounded-xl border border-red-100">
                      <h4 className="font-bold text-red-800 mb-3 text-sm uppercase">İnkişaf Etdirilməli</h4>
                      <ul className="space-y-2">
                        {result.weaknesses.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-red-900">
                            <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                 </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 relative overflow-hidden mb-8">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 -translate-y-1/2 translate-x-1/2"></div>
              <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2 relative z-10">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Metodiki İnkişaf Planı
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                 {result.recommendations.map((rec, idx) => (
                   <div key={idx} className="bg-white p-4 rounded-xl shadow-sm text-sm text-slate-700 border-l-4 border-indigo-400 flex gap-3 items-start">
                     <div className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                       {idx + 1}
                     </div>
                     <p>{rec}</p>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown with Rubrics - MOVED OUTSIDE FOR PDF STABILITY */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm break-inside-avoid">
           <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Detallı Qiymətləndirmə Cədvəli</h3>
              <p className="text-xs text-slate-500">Meyarlar üzrə seçilmiş səviyyələr və onların təsvirləri</p>
           </div>
           <div className="divide-y divide-slate-100">
              {OBSERVATION_FORM_STRUCTURE.map((section) => (
                <div key={section.id} className="p-0">
                   <div className="bg-slate-100/50 px-6 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 border-y border-slate-100">
                      {section.title} ({section.weight}%)
                   </div>
                   <div className="divide-y divide-slate-50">
                      {section.criteria.map((criteria) => {
                         const score = inputData.ratings[criteria.id] || 0;
                         if (score === 0) return null;
                         return (
                           <div key={criteria.id} className="px-6 py-4 grid grid-cols-1 md:grid-cols-12 gap-4 break-inside-avoid">
                              <div className="md:col-span-4">
                                 <h5 className="text-sm font-semibold text-slate-900">{criteria.label}</h5>
                              </div>
                              <div className="md:col-span-1">
                                 <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-white ${
                                    score === 5 ? 'bg-green-500' :
                                    score === 4 ? 'bg-indigo-500' :
                                    score === 3 ? 'bg-amber-500' : 'bg-red-500'
                                 }`}>
                                    {score}
                                 </span>
                              </div>
                              <div className="md:col-span-7">
                                 <p className="text-sm text-slate-600 italic border-l-2 border-slate-200 pl-3">
                                    {criteria.rubrics[score as 1|2|3|4|5]}
                                 </p>
                              </div>
                           </div>
                         );
                      })}
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className="fixed bottom-6 left-0 right-0 px-4 md:px-0 flex justify-center z-50 gap-4 print:hidden">
        <button 
          onClick={onReset}
          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-8 rounded-full shadow-lg transform transition hover:scale-105 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
          </svg>
          Siyahıya Qayıt
        </button>
      </div>
    </div>
  );
};