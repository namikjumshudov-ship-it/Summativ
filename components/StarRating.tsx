import React from 'react';
import { RubricDescription } from '../types';

interface StarRatingProps {
  label: string;
  value: number;
  rubrics: RubricDescription;
  onChange: (value: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({ label, value, rubrics, onChange }) => {
  return (
    <div className="flex flex-col py-4 border-b border-slate-100 last:border-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <span className="text-slate-800 font-semibold text-sm sm:text-base flex-1">{label}</span>
        <div className="flex gap-1.5 shrink-0">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-bold text-lg transition-all duration-200 ${
                star === value 
                  ? 'bg-indigo-600 text-white scale-105 shadow-md shadow-indigo-200' 
                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
              }`}
            >
              {star}
            </button>
          ))}
        </div>
      </div>
      
      {value > 0 && (
        <div className="mt-2 bg-indigo-50 border-l-4 border-indigo-500 p-3 rounded-r-lg animate-fade-in">
          <p className="text-sm text-indigo-900 italic">
            <span className="font-bold not-italic mr-1">Səviyyə {value}:</span>
            {rubrics[value as 1|2|3|4|5]}
          </p>
        </div>
      )}
      {value === 0 && (
        <div className="mt-2 text-xs text-slate-400 italic pl-1">
          Qiymətləndirmək üçün xal seçin (1-5)
        </div>
      )}
    </div>
  );
};