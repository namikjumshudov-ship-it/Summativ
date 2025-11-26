import { GoogleGenAI, Type, Schema } from "@google/genai";
import { EvaluationData, AIAnalysisResult, OBSERVATION_FORM_STRUCTURE } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "Dərs müşahidəsinin peşəkar pedaqoji xülasəsi.",
    },
    sentiment: {
      type: Type.STRING,
      enum: ["Yüksək", "Orta", "Aşağı"],
      description: "Dərsin ümumi keyfiyyət səviyyəsi.",
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Müəllimin 3-4 əsas peşəkar üstünlüyü.",
    },
    weaknesses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Müəllimin təkmilləşdirməli olduğu 3-4 sahə.",
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Müəllim üçün konkret metodiki tövsiyələr.",
    },
  },
  required: ["summary", "sentiment", "strengths", "weaknesses", "recommendations"],
};

export const analyzeEvaluation = async (data: EvaluationData): Promise<AIAnalysisResult> => {
  let weightedScoreSum = 0;
  const categoryScores: Record<string, number> = {};
  
  // Construct the prompt with specific rubric descriptions
  let detailedReport = "";
  
  OBSERVATION_FORM_STRUCTURE.forEach(section => {
    let sectionScoreSum = 0;
    let sectionCriteriaCount = 0;
    
    detailedReport += `\nKATEQORİYA: ${section.title} (${section.weight}%)\n`;
    
    section.criteria.forEach(criterion => {
      const score = data.ratings[criterion.id] || 0;
      if (score > 0) {
        sectionScoreSum += score;
        sectionCriteriaCount++;
        const rubricText = criterion.rubrics[score as 1|2|3|4|5];
        detailedReport += `- ${criterion.label}: ${score}/5\n  (Qeyd: ${rubricText})\n`;
      } else {
        detailedReport += `- ${criterion.label}: Qiymətləndirilməyib\n`;
      }
    });

    // Calculate section score (normalized to 100)
    const sectionAvg = sectionCriteriaCount > 0 ? (sectionScoreSum / sectionCriteriaCount) : 0;
    const sectionNormalized = (sectionAvg / 5) * 100; // 0-100 scale
    
    categoryScores[section.id] = Math.round(sectionNormalized);
    
    // Add to total weighted score
    // Logic: (Section Score out of 100) * (Weight / 100)
    weightedScoreSum += sectionNormalized * (section.weight / 100);
  });

  const finalScore = Math.round(weightedScoreSum);

  const textPrompt = `
    Sən peşəkar təhsil eksperti, metodist və pedaqoqsan. 
    Azərbaycan Respublikası Təhsil İnstitutunun standartlarına uyğun dərs müşahidə formasını təhlil etməlisən.

    Müşahidə Məlumatları:
    - Müşahidəçi: ${data.observerName}
    - Müəllim: ${data.teacherName}
    - Fənn: ${data.subject}
    - Mövzu: ${data.topic}
    - Sinif: ${data.classGrade}
    
    Hesablanmış Ümumi Bal: ${finalScore}/100

    Meyarlar üzrə detallı qiymətləndirmə (Rubriklər daxil olmaqla):
    ${detailedReport}

    Əlavə Rəy: "${data.comment}"

    ${data.videoData ? "QEYD: Təqdim edilmiş video faylı dərsin bir hissəsini əks etdirir. Videodakı faktları müşahidəçinin qiymətləndirməsi ilə müqayisə et." : ""}
    ${data.audioData ? "QEYD: Təqdim edilmiş səs faylı dərsin bir hissəsini əks etdirir. Səsdəki ünsiyyət tərzini nəzərə al." : ""}

    TƏLİMAT:
    1. Müəllimin performansını seçilmiş rubrik təsvirlərinə əsaslanaraq təhlil et.
    2. "Strengths" bölməsində 5 və 4 verilən meyarları vurğula.
    3. "Weaknesses" bölməsində 1, 2 və 3 verilən meyarları və onların rubrikdəki çatışmazlıqlarını qeyd et.
    4. "Recommendations" bölməsində zəif nəticələri düzəltmək üçün konkret metodiki addımlar təklif et.
    5. Dil: Rəsmi, akademik Azərbaycan dili.
  `;

  const parts: any[] = [{ text: textPrompt }];

  if (data.videoData) {
    parts.push({
      inlineData: {
        mimeType: data.videoData.mimeType,
        data: data.videoData.data
      }
    });
  }

  if (data.audioData) {
    parts.push({
      inlineData: {
        mimeType: data.audioData.mimeType,
        data: data.audioData.data
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        systemInstruction: "Sən dəqiq və obyektiv təhsil ekspertisən. Sadəcə faktlara əsaslan.",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response text");
    
    const aiData = JSON.parse(text);

    return {
      ...aiData,
      score: finalScore,
      categoryScores
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
