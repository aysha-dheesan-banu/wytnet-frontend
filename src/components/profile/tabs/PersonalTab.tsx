import React, { useState, useEffect } from 'react';
import { User } from '../../../api/types';
import { updateProfile } from '../../../api/user';

interface PersonalTabProps {
  user: User | null;
  onRefresh: () => void;
}

const PersonalTab: React.FC<PersonalTabProps> = ({ user, onRefresh }) => {
  const [formData, setFormData] = useState<Partial<User>>({});
  const [saving, setSaving] = useState(false);

  // Sync formData when user prop changes
  useEffect(() => {
    if (user) {
      setFormData(user);
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(formData);
      onRefresh();
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { id: 'full_name', label: 'Full Name', type: 'text', placeholder: 'Enter your full name' },
    { id: 'nickname', label: 'Nickname', type: 'text', placeholder: 'What do friends call you?' },
    { id: 'phone', label: 'Phone', type: 'tel', placeholder: '+1 234 567 890' },
    { id: 'location', label: 'Location', type: 'text', placeholder: 'City, Country' },
    { id: 'bio', label: 'Bio', type: 'textarea', placeholder: 'Tell us about yourself...' },
    { id: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other', 'Prefer not to say'] },
    { id: 'dob', label: 'Date of Birth', type: 'date' },
    { id: 'marital_status', label: 'Marital Status', type: 'select', options: ['Single', 'Married', 'Divorced', 'Widowed'] },
    { id: 'mother_tongue', label: 'Mother Tongue', type: 'text', placeholder: 'e.g. English' },
    { id: 'languages', label: 'Languages', type: 'text', placeholder: 'e.g. English, Spanish' },
  ];

  return (
    <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">Personal Information</h3>
          <p className="text-gray-400 text-xs">Update your basic details here</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-12 gap-y-8">
        {fields.map(field => (
          <div key={field.id} className={field.id === 'bio' ? 'col-span-2' : ''}>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2.5 ml-1">{field.label}</label>
            {field.type === 'textarea' ? (
              <textarea
                value={formData[field.id as keyof User] || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-indigo-600/20 focus:bg-white transition-all text-[13px] font-medium outline-none min-h-[120px] resize-none"
              />
            ) : field.type === 'select' ? (
              <select
                value={formData[field.id as keyof User] || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-indigo-600/20 focus:bg-white transition-all text-[13px] font-medium outline-none appearance-none"
              >
                <option value="">Select {field.label}</option>
                {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : (
              <input
                type={field.type}
                value={formData[field.id as keyof User] || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-indigo-600/20 focus:bg-white transition-all text-[13px] font-medium outline-none"
              />
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-10 pt-8 border-t border-gray-50 flex justify-end">
         <button 
          onClick={handleSave}
          disabled={saving}
          className="px-12 py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50"
        >
          {saving ? 'Processing...' : 'Save Profile Details'}
        </button>
      </div>
    </div>
  );
};

export default PersonalTab;
