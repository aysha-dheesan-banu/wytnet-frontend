import React, { useState } from 'react';
import { Work } from '../../../api/types';
import { toast } from 'react-hot-toast';
import { deleteWork, createWork, updateWork } from '../../../api/work';

interface WorkTabProps {
  items: Work[];
  onRefresh: () => void;
}

const WorkTab: React.FC<WorkTabProps> = ({ items, onRefresh }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<Work>>({ type: 'Full-time' });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleEdit = (item: Work) => {
    setFormData(item);
    setEditingId(item.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Remove this work experience?')) {
      try {
        await deleteWork(id);
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
        await updateWork(editingId, formData);
        toast.success('Work experience updated successfully!');
      } else {
        await createWork(formData);
        toast.success('Work experience added successfully!');
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({ type: 'Full-time' });
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save work experience.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">Work Experience</h3>
          <p className="text-gray-400 text-xs">Share your professional career and domains of expertise</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({ type: 'Full-time' });
              setIsAdding(true);
            }}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Add Experience
          </button>
        )}
      </div>

      {isAdding ? (
        <div className="bg-blue-50/20 rounded-[24px] p-8 border-2 border-dashed border-blue-100 mb-8 animate-in zoom-in duration-300">
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Job Role / Position</label>
              <input
                type="text"
                value={formData.role || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                placeholder="e.g. Senior Product Designer"
                className="w-full px-5 py-3.5 bg-white border-2 border-transparent rounded-2xl focus:border-blue-600/20 shadow-sm outline-none font-bold text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Company Name</label>
              <input
                type="text"
                value={formData.company || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                placeholder="e.g. Google"
                className="w-full px-5 py-3.5 bg-white border-2 border-transparent rounded-2xl focus:border-blue-600/20 shadow-sm outline-none font-bold text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-5 py-3.5 bg-white border-2 border-transparent rounded-2xl focus:border-blue-600/20 shadow-sm outline-none font-bold text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.end_date || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-5 py-3.5 bg-white border-2 border-transparent rounded-2xl focus:border-blue-600/20 shadow-sm outline-none font-bold text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Employment Type</label>
              <select
                value={formData.type || 'Full-time'}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-5 py-3.5 bg-white border-2 border-transparent rounded-2xl focus:border-blue-600/20 shadow-sm outline-none font-bold text-sm appearance-none"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Freelance">Freelance</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Job Domain</label>
              <input
                type="text"
                value={formData.domain || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                placeholder="e.g. Fintech, E-commerce"
                className="w-full px-5 py-3.5 bg-white border-2 border-transparent rounded-2xl focus:border-blue-600/20 shadow-sm outline-none font-bold text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Location</label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g. London, UK (Remote)"
                className="w-full px-5 py-3.5 bg-white border-2 border-transparent rounded-2xl focus:border-blue-600/20 shadow-sm outline-none font-bold text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
                setFormData({ type: 'Full-time' });
              }}
              className="px-6 py-2.5 rounded-xl text-gray-400 font-bold text-sm hover:bg-white transition-all"
            >Cancel</button>
            <button
              onClick={handleCreate}
              disabled={saving || !formData.role || !formData.company}
              className="px-10 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-40"
            >
              {saving ? (editingId ? 'Saving...' : 'Adding...') : (editingId ? 'Save Changes' : 'Add Experience')}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {items.length === 0 ? (
            <div className="text-center py-20 bg-gray-50/50 rounded-[24px] border-2 border-dashed border-gray-100">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm">💼</div>
              <p className="text-xs font-black uppercase tracking-widest text-gray-300">No work experience added yet</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="group relative flex items-start gap-6 p-6 rounded-[24px] border border-gray-100 hover:border-blue-100 hover:bg-blue-50/10 transition-all">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <svg className="h-8 w-8 text-blue-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745V20a2 2 0 002 2h14a2 2 0 002-2v-6.745zM3.187 9.263l8.47 4.547a1.002 1.002 0 00.686 0l8.47-4.547A2 2 0 0019.161 6H5a2 2 0 00-1.813 3.263z" strokeWidth="1.5" /></svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[15px] font-bold text-gray-900">{item.role}</h4>
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
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">{item.company}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span className="text-[11px] font-medium text-gray-400">{item.start_date} - {item.end_date || 'Present'}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-gray-300 tracking-widest">Type:</span>
                      <span className="text-[11px] font-bold text-blue-600">{item.type || 'Full-time'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-gray-300 tracking-widest">Domain:</span>
                      <span className="text-[11px] font-bold text-gray-600">{item.domain || 'Tech'}</span>
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

export default WorkTab;
