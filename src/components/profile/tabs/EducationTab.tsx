import React, { useState } from 'react';
import { Education } from '../../../api/types';
import { toast } from 'react-hot-toast';
import { deleteEducation, createEducation, updateEducation } from '../../../api/education';

interface EducationTabProps {
  items: Education[];
  onRefresh: () => void;
}

const EducationTab: React.FC<EducationTabProps> = ({ items, onRefresh }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<Education>>({});
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleEdit = (item: Education) => {
    setFormData(item);
    setEditingId(item.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Remove this education record?')) {
      try {
        await deleteEducation(id);
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
        await updateEducation(editingId, formData);
        toast.success('Education updated successfully!');
      } else {
        await createEducation(formData);
        toast.success('Education added successfully!');
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({});
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save education.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">Education Background</h3>
          <p className="text-gray-400 text-xs">Showcase your academic journey and certifications</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({});
              setIsAdding(true);
            }}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Add Education
          </button>
        )}
      </div>

      {isAdding ? (
        <div className="bg-blue-50/30 rounded-[24px] p-8 border-2 border-dashed border-blue-100 mb-8 animate-in zoom-in duration-300">
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">University / School</label>
              <input
                type="text"
                value={formData.university || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
                placeholder="e.g. Stanford University"
                className="w-full px-5 py-3.5 bg-white border-2 border-transparent rounded-2xl focus:border-blue-600/20 shadow-sm outline-none font-bold text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Degree</label>
              <input
                type="text"
                value={formData.degree || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, degree: e.target.value }))}
                placeholder="e.g. Bachelor of Science"
                className="w-full px-5 py-3.5 bg-white border-2 border-transparent rounded-2xl focus:border-blue-600/20 shadow-sm outline-none font-bold text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Start Year</label>
                <input
                  type="text"
                  value={formData.start_year || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_year: e.target.value }))}
                  placeholder="2018"
                  className="w-full px-5 py-3.5 bg-white border-2 border-transparent rounded-2xl focus:border-blue-600/20 shadow-sm outline-none font-bold text-sm text-center"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">End Year</label>
                <input
                  type="text"
                  value={formData.end_year || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_year: e.target.value }))}
                  placeholder="2022"
                  className="w-full px-5 py-3.5 bg-white border-2 border-transparent rounded-2xl focus:border-blue-600/20 shadow-sm outline-none font-bold text-sm text-center"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Grade / CGPA</label>
              <input
                type="text"
                value={formData.grade || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                placeholder="e.g. 3.8/4.0"
                className="w-full px-5 py-3.5 bg-white border-2 border-transparent rounded-2xl focus:border-blue-600/20 shadow-sm outline-none font-bold text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Location</label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g. California, US"
                className="w-full px-5 py-3.5 bg-white border-2 border-transparent rounded-2xl focus:border-blue-600/20 shadow-sm outline-none font-bold text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
                setFormData({});
              }}
              className="px-6 py-2.5 rounded-xl text-gray-400 font-bold text-sm hover:bg-white transition-all"
            >Cancel</button>
            <button
              onClick={handleCreate}
              disabled={saving || !formData.university}
              className="px-10 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-40"
            >
              {saving ? (editingId ? 'Saving...' : 'Adding...') : (editingId ? 'Save Changes' : 'Add Education')}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {items.length === 0 ? (
            <div className="text-center py-20 bg-gray-50/50 rounded-[24px] border-2 border-dashed border-gray-100">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm">🎓</div>
              <p className="text-xs font-black uppercase tracking-widest text-gray-300">No education added yet</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="group relative flex items-start gap-6 p-6 rounded-[24px] border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/10 transition-all">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <svg className="h-8 w-8 text-indigo-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z" strokeWidth="1.5" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" strokeWidth="1.5" /><path d="M12 14v7" strokeWidth="1.5" /></svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[15px] font-bold text-gray-900">{item.university}</h4>
                    <div className="flex items-center gap-2 transition-all">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-white rounded-lg transition-all shadow-sm"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-500 hover:text-red-500 hover:bg-white rounded-lg transition-all shadow-sm"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">{item.degree}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span className="text-[11px] font-medium text-gray-400">{item.start_year} - {item.end_year || 'Present'}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-gray-300 tracking-widest">Grade:</span>
                      <span className="text-[11px] font-bold text-indigo-600">{item.grade || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-gray-300 tracking-widest">Location:</span>
                      <span className="text-[11px] font-bold text-gray-600">{item.location || 'Remote'}</span>
                    </div>
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

export default EducationTab;
