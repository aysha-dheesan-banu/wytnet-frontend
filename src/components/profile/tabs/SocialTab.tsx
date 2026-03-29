import React, { useState } from 'react';
import { Social } from '../../../api/types';
import { deleteSocial, createSocial, updateSocial } from '../../../api/socials';

interface SocialTabProps {
  items: Social[];
  onRefresh: () => void;
}

const SocialTab: React.FC<SocialTabProps> = ({ items, onRefresh }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<Social>>({ visibility: 'PUBLIC' });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleEdit = (item: Social) => {
    setFormData(item);
    setEditingId(item.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Remove this social link?')) {
      try {
        await deleteSocial(id);
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
        await updateSocial(editingId, formData);
        alert('Social link updated successfully!');
      } else {
        await createSocial(formData);
        alert('Social link added successfully!');
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({ visibility: 'PUBLIC' });
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to save social link.');
    } finally {
      setSaving(false);
    }
  };

  const platforms = ['LinkedIn', 'GitHub', 'Twitter', 'Portfolio', 'Dribbble', 'Behance', 'Other'];

  return (
    <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">Social Networks</h3>
          <p className="text-gray-400 text-xs">Connect your professional profiles and creative portfolios</p>
        </div>
        {!isAdding && (
          <button 
           onClick={() => {
             setEditingId(null);
             setFormData({ visibility: 'PUBLIC' });
             setIsAdding(true);
           }}
           className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          >
             <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
             Add Social
          </button>
        )}
      </div>

      {isAdding ? (
        <div className="bg-indigo-50/20 rounded-[24px] p-8 border-2 border-dashed border-indigo-100 mb-8 animate-in zoom-in duration-300">
           <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Platform</label>
                 <select 
                  value={formData.platform || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
                  className="w-full px-5 py-3.5 bg-white border-2 border-transparent rounded-2xl focus:border-indigo-600/20 shadow-sm outline-none font-bold text-sm appearance-none"
                 >
                    <option value="">Select Platform</option>
                    {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
              </div>
              <div>
                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Username / Handle</label>
                 <input 
                  type="text" 
                  value={formData.username || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="e.g. johndoe"
                  className="w-full px-5 py-3.5 bg-white border-2 border-transparent rounded-2xl focus:border-indigo-600/20 shadow-sm outline-none font-bold text-sm"
                 />
              </div>
              <div className="col-span-2">
                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Profile URL</label>
                 <input 
                  type="url" 
                  value={formData.link || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                  placeholder="https://linkedin.com/in/johndoe"
                  className="w-full px-5 py-3.5 bg-white border-2 border-transparent rounded-2xl focus:border-indigo-600/20 shadow-sm outline-none font-bold text-sm"
                 />
              </div>
           </div>
           <div className="flex justify-end gap-3">
              <button 
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                  setFormData({ visibility: 'PUBLIC' });
                }}
                className="px-6 py-2.5 rounded-xl text-gray-400 font-bold text-sm hover:bg-white transition-all"
              >Cancel</button>
              <button 
                onClick={handleCreate}
                disabled={saving || !formData.platform || !formData.link}
                className="px-10 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-40"
              >
                {saving ? (editingId ? 'Saving...' : 'Adding...') : (editingId ? 'Save Changes' : 'Add Social')}
              </button>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {items.length === 0 ? (
            <div className="col-span-2 text-center py-20 bg-gray-50/50 rounded-[24px] border-2 border-dashed border-gray-100">
               <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm">🌐</div>
               <p className="text-xs font-black uppercase tracking-widest text-gray-300">No social links added yet</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="group p-6 rounded-[24px] border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/10 transition-all flex items-center justify-between shadow-sm hover:shadow-md">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-indigo-600 border border-gray-50 uppercase font-black text-[10px] group-hover:bg-indigo-600 group-hover:text-white transition-all">
                         {item.platform.substring(0, 2)}
                      </div>
                      <div>
                         <h4 className="text-sm font-bold text-gray-900">{item.platform}</h4>
                         <p className="text-[11px] text-gray-400 font-medium">@{item.username}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-1">
                     <button 
                      onClick={() => handleEdit(item)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                     >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                     </button>
                     <a 
                      href={item.link} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                     >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v11a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                     </a>
                     <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-all">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                     </button>
                   </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SocialTab;
