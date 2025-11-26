import React from 'react';
import { SavedEvaluation } from '../types';
import { Trash2, Edit, Eye, Plus } from 'lucide-react';

interface HistoryViewProps {
  evaluations: SavedEvaluation[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ evaluations, onView, onEdit, onDelete, onNew }) => {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Qiymətləndirmə Tarixçəsi</h1>
          <p className="text-slate-500 mt-1">Yadda saxlanılmış bütün dərs müşahidələri</p>
        </div>
        <button
          onClick={onNew}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-indigo-200"
        >
          <Plus size={20} />
          Yeni Müşahidə
        </button>
      </div>

      {evaluations.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Eye size={40} className="text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Hələ ki, heç bir qeyd yoxdur</h3>
          <p className="text-slate-500 mt-2 mb-6">İlk dərs müşahidənizi aparın və nəticələri burada görün.</p>
          <button
            onClick={onNew}
            className="text-indigo-600 font-semibold hover:text-indigo-800 underline"
          >
            İndi başla
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {evaluations.sort((a,b) => b.timestamp - a.timestamp).map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-bold text-slate-900">{item.teacherName}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                    item.result.score >= 80 ? 'bg-green-100 text-green-700' :
                    item.result.score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {item.result.score} Bal
                  </span>
                </div>
                <div className="text-sm text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                  <span>{item.subject} - {item.classGrade}</span>
                  <span>|</span>
                  <span>{item.topic}</span>
                  <span>|</span>
                  <span>{new Date(item.timestamp).toLocaleDateString('az-AZ', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto">
                <button
                  onClick={() => onView(item.id)}
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Bax"
                >
                  <Eye size={20} />
                </button>
                <button
                  onClick={() => onEdit(item.id)}
                  className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  title="Düzəliş et"
                >
                  <Edit size={20} />
                </button>
                <button
                  onClick={() => {
                    if(confirm('Bu qeydi silmək istədiyinizə əminsiniz?')) onDelete(item.id);
                  }}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Sil"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};