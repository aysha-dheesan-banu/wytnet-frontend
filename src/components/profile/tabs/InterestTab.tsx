import React, { useState } from 'react';
import { Interest } from '../../../api/types';
import { deleteInterest, createInterest, updateInterest } from '../../../api/interests';

interface InterestTabProps {
  items: Interest[];
  onRefresh: () => void;
}

const InterestTab: React.FC<InterestTabProps> = ({ items, onRefresh }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<Interest>>({ level: 'Intermediate' });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleEdit = (item: Interest) => {
    setFormData(item);
    setEditingId(item.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Remove this interest?')) {
      try {
        await deleteInterest(id);
        onRefresh();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      if (editingId) {
        await updateInterest(editingId, formData);
        alert('Interest updated successfully!');
      } else {
        await createInterest(formData);
        alert('Interest added successfully!');
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({ level: 'Intermediate' });
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to save interest.');
    } finally {
      setSaving(false);
    }
  };

  const categories = ['Tech', 'Design', 'Music', 'Sports', 'Art', 'Writing', 'Languages', 'Travel', 'Other'];
  const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Legendary'];

  return (
    <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">Passions & Interests</h3>
          <p className="text-gray-400 text-xs">Share what drives you and your levels of expertise</p>
        </div>
        {!isAdding && (
          <button 
           onClick={() => {
             setEditingId(null);
             setFormData({ level: 'Intermediate' });
             setIsAdding(true);
           }}
           className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          >
             <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
             Add Interest
          </button>
        )}
      </div>

      {isAdding ? (
        <div className="bg-amber-50/20 rounded-[24px] p-8 border-2 border-dashed border-amber-100 mb-8 animate-in zoom-in duration-300">
           <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="col-span-2">
                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Interest Title</label>
                 <input 
                  type="text" 
                  value={formData.title || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. UI Design / Chess"
                  className="w-full px-5 py-3.5 bg-white border-2 border-transparent rounded-2xl focus:border-amber-600/20 shadow-sm outline-none font-bold text-sm"
                 />
              </div>
              <div>
                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Category</label>
                 <select 
                  value={formData.category || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-5 py-3.5 bg-white border-2 border-transparent rounded-2xl focus:border-amber-600/20 shadow-sm outline-none font-bold text-sm appearance-none"
                 >
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Years Exp.</label>
                    <input 
                      type="number" 
                      value={formData.experience_years || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, experience_years: parseInt(e.target.value) }))}
                      placeholder="2"
                      className="w-full px-5 py-3.5 bg-white border-2 border-transparent rounded-2xl focus:border-amber-600/20 shadow-sm outline-none font-bold text-sm text-center"
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Proficiency</label>
                    <select 
                      value={formData.level || 'Intermediate'}
                      onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                      className="w-full px-5 py-3.5 bg-white border-2 border-transparent rounded-2xl focus:border-amber-600/20 shadow-sm outline-none font-bold text-sm appearance-none"
                    >
                      {levels.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                 </div>
              </div>
              <div className="col-span-2">
                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Brief Description</label>
                 <textarea 
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What do you love about this?"
                  className="w-full px-5 py-3.5 bg-white border-2 border-transparent rounded-2xl focus:border-amber-600/20 shadow-sm outline-none font-medium text-[13px] h-20 resize-none"
                 />
              </div>
           </div>
           <div className="flex justify-end gap-3">
              <button 
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                  setFormData({ level: 'Intermediate' });
                }}
                className="px-6 py-2.5 rounded-xl text-gray-400 font-bold text-sm hover:bg-white transition-all"
              >Cancel</button>
              <button 
                onClick={handleCreate}
                disabled={saving || !formData.title || !formData.category}
                className="px-10 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-sm shadow-xl shadow-amber-100 hover:bg-amber-700 transition-all active:scale-95 disabled:opacity-40"
              >
                {saving ? (editingId ? 'Saving...' : 'Adding...') : (editingId ? 'Save Changes' : 'Add Interest')}
              </button>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {items.length === 0 ? (
            <div className="col-span-2 text-center py-20 bg-gray-50/50 rounded-[24px] border-2 border-dashed border-gray-100">
               <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm">💡</div>
               <p className="text-xs font-black uppercase tracking-widest text-gray-300">No interests added yet</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="group p-6 rounded-[24px] border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/10 transition-all flex flex-col h-full shadow-sm hover:shadow-md">
                  <div className="flex items-center justify-between mb-4">
                     <div className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest rounded-lg">{item.category}</div>
                     <div className="flex items-center gap-1 transition-all">
                        <button 
                         onClick={() => handleEdit(item)}
                         className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-sm"
                        >
                           <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-500 hover:text-red-500 hover:bg-white rounded-lg transition-all shadow-sm"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                     </div>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 mb-2 truncate">{item.title}</h4>
                  <p className="text-[11px] text-gray-400 font-medium mb-6 flex-1 line-clamp-2 italic">"{item.description || 'Passionate about this topic!'}"</p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                     <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-gray-300 tracking-widest">Exp:</span>
                        <span className="text-xs font-bold text-indigo-600">{item.experience_years || 0} Years</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-gray-300 tracking-widest">Level:</span>
                        <span className="text-xs font-bold text-gray-600">{item.level || 'Intermediate'}</span>
                     </div>
                  </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default InterestTab;
