import React, { useState, useEffect, useRef } from 'react';
import { createPost } from '../api/post';
import { searchObjects } from '../api/object';
import { ObjectItem } from '../api/types';

interface NewPostModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  post_type: 'NEED' | 'OFFER';
  object_id: string;
  object_name: string;
  location: string;
  title: string;
  description: string;
  validity_days: number;
  allow_like: boolean;
  allow_comment: boolean;
  allow_share: boolean;
}

interface SmartDetected {
  type: 'NEED' | 'OFFER';
  entity: string;
  location: string;
  matchedObjectId: string | null;
}

const NewPostModal: React.FC<NewPostModalProps> = ({ onClose, onSuccess }) => {
  const [smartText, setSmartText] = useState('');
  const [smartDetected, setSmartDetected] = useState<SmartDetected | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    post_type: 'NEED',
    object_id: '',
    object_name: '',
    location: '',
    title: '',
    description: '',
    validity_days: 30,
    allow_like: true,
    allow_comment: true,
    allow_share: true
  });

  const [objectQuery, setObjectQuery] = useState('');
  const [objectResults, setObjectResults] = useState<ObjectItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [recommendedEntities, setRecommendedEntities] = useState<ObjectItem[]>([]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const { getObjects } = await import('../api/object');
        const res = await getObjects(0, 5);
        setRecommendedEntities(res.items || []);
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      }
    };
    fetchRecommendations();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (objectQuery.length >= 2) {
        try {
          const data = await searchObjects(objectQuery);
          setObjectResults(data.items || []);
          setShowDropdown(true);
        } catch (error) {
          console.error('Search failed:', error);
        }
      } else {
        setObjectResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [objectQuery]);

  const handleAnalyze = async () => {
    if (!smartText) return;
    setIsAnalyzing(true);
    
    const text = smartText.toLowerCase();
    let type: 'NEED' | 'OFFER' = 'NEED';
    if (text.includes('offer') || text.includes('have') || text.includes('sell') || text.includes('give')) type = 'OFFER';
    
    const words = text.replace(/[.,!?;:]/g, "").split(/\s+/);
    const stopWords = ['i', 'a', 'an', 'the', 'need', 'have', 'want', 'looking', 'for', 'in', 'at', 'near', 'with', 'and', 'or', 'some', 'any', 'my', 'his', 'her'];
    const potentialEntities = words.filter(w => w.length > 2 && !stopWords.includes(w));
    
    let loc = text.includes('in ') ? text.split('in ')[1].split(' ')[0] : '';

    let matchedObject: ObjectItem | null = null;
    
    for (const word of potentialEntities) {
      try {
        const searchData = await searchObjects(word);
        if (searchData.items && searchData.items.length > 0) {
          const exactMatch = searchData.items.find(item => item.name.toLowerCase() === word);
          matchedObject = exactMatch || searchData.items[0];
          if (matchedObject) break;
        }
      } catch (error) {
        console.error('Failed to search entity:', error);
      }
    }

    setSmartDetected({
      type,
      entity: matchedObject ? matchedObject.name : (potentialEntities[0] ? potentialEntities[0].charAt(0).toUpperCase() + potentialEntities[0].slice(1) : ''),
      location: loc ? loc.charAt(0).toUpperCase() + loc.slice(1) : '',
      matchedObjectId: matchedObject ? matchedObject.id : null
    });
    setIsAnalyzing(false);
  };

  const handleApplySmartFill = () => {
    if (!smartDetected) return;
    
    setFormData({
      ...formData,
      post_type: smartDetected.type,
      location: smartDetected.location || formData.location,
      title: `I ${smartDetected.type.toLowerCase()} ${smartDetected.entity} ${smartDetected.location ? 'in ' + smartDetected.location : ''}`,
      object_name: smartDetected.matchedObjectId ? smartDetected.entity : '',
      object_id: smartDetected.matchedObjectId || formData.object_id
    });
    setObjectQuery(smartDetected.matchedObjectId ? smartDetected.entity : '');
    setSmartDetected(null);
  };

  const handleApplyRecommended = (obj: ObjectItem) => {
    setFormData({
      ...formData,
      object_id: obj.id,
      object_name: obj.name,
      title: `I ${formData.post_type.toLowerCase()} ${obj.name} in ${formData.location || 'Madurai'}`
    });
    setObjectQuery(obj.name);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.object_id || !formData.post_type || !formData.title || !formData.location) {
      alert('Please fill all required fields (Object, Type, Title, Location)');
      return;
    }

    setIsSubmitting(true);
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + formData.validity_days);

    const { getUserIdFromToken } = await import('../utils/auth');
    const userId = (import.meta as any).env.VITE_USER_ID || getUserIdFromToken();

    let imageUrl: string | null = null;
    if (selectedFile) {
      try {
        const { uploadImage } = await import('../api/post');
        const uploadRes = await uploadImage(selectedFile);
        imageUrl = uploadRes.item?.url || null; // Adjusted based on BaseResponse
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError);
      }
    }

    try {
      await createPost({
        user_id: userId as string,
        post_type: formData.post_type,
        object_id: formData.object_id,
        location: formData.location,
        title: formData.title,
        description: formData.description,
        valid_until: validUntil.toISOString(),
        image_url: imageUrl || undefined,
        allow_like: formData.allow_like,
        allow_comment: formData.allow_comment,
        allow_share: formData.allow_share
      } as any);
      onSuccess();
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to post. Check console.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
    }}>
      <div className="card" style={{ width: '90%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', padding: 0 }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem' }}>Post to WytWall</h2>
          <button onClick={onClose} style={{ background: 'none', fontSize: '1.5rem' }}>×</button>
        </div>

        <div style={{ padding: '2rem' }}>
          {/* Smart Fill Section */}
          <div style={{ background: '#f8f4ff', padding: '1.5rem', borderRadius: '12px', border: '1px dashed #5c59f2', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#5c59f2' }}>
              <span>✨</span>
              <span style={{ fontWeight: '600' }}>Smart Fill</span>
              <span style={{ fontSize: '0.75rem', color: '#666' }}>Type a sentence and we'll auto-detect entity, location & post type</span>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input 
                type="text" 
                placeholder='e.g. "I have a car in Madurai" or "I need a laptop in Chennai"'
                style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #ddd' }}
                value={smartText}
                onChange={(e) => setSmartText(e.target.value)}
              />
              <button className="premium-btn" onClick={handleAnalyze} disabled={isAnalyzing}>
                {isAnalyzing ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>

            {smartDetected && (
              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                   <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'white', border: '1px solid #ddd', fontSize: '0.875rem' }}>
                     Detected: <b>{smartDetected.type}</b>
                   </span>
                   <span style={{ 
                     padding: '4px 12px', 
                     borderRadius: '20px', 
                     background: 'white', 
                     border: smartDetected.matchedObjectId ? '1px solid #c6f6d5' : '1px solid #fed7d7', 
                     fontSize: '0.875rem',
                     color: smartDetected.matchedObjectId ? '#22543d' : '#822727'
                   }}>
                     Entity: <b>{smartDetected.entity}</b> {smartDetected.matchedObjectId ? '✓' : '×'}
                   </span>
                   {smartDetected.location && (
                     <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'white', border: '1px solid #ddd', fontSize: '0.875rem' }}>
                       Location: <b>{smartDetected.location}</b>
                     </span>
                   )}
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>RECOMMENDED ENTITIES</p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {recommendedEntities.map(obj => (
                      <span key={obj.id} style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.75rem', background: 'white', cursor: 'pointer' }} onClick={() => handleApplyRecommended(obj)}>
                        {obj.name}
                      </span>
                    ))}
                  </div>
                </div>

                <button className="premium-btn" style={{ width: '100%', padding: '1rem' }} onClick={handleApplySmartFill}>
                  Apply Best Match
                </button>
              </div>
            )}
          </div>

          {/* Main Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Horizontal Top Section: Image on Left, Interactions & Type on Right */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'start' }}>
              {/* Left: Image Upload Box */}
              <div 
                onClick={handleImageClick}
                style={{ 
                  border: '2px dashed #e2e8f0', 
                  borderRadius: '2rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  padding: '2rem',
                  height: '320px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  position: 'relative',
                  backgroundColor: '#f8fafc',
                  transition: 'all 0.2s ease'
                }}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={handleFileChange}
                  accept="image/*"
                />
                {selectedFile ? (
                  <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <img 
                      src={URL.createObjectURL(selectedFile)} 
                      alt="Preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}>
                      <span style={{ color: 'white', fontWeight: 'bold', fontSize: '0.875rem' }}>Change Image</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', marginBottom: '1rem' }}>
                      <svg style={{ width: '2rem', height: '2rem', color: '#5c59f2' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                    <p style={{ fontWeight: '800', color: '#1e293b', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Attach an image</p>
                    <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Click to upload · Max 5MB</p>
                  </>
                )}
              </div>

              {/* Right: Interactions & Type Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '2rem', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
                  <p style={{ fontSize: '0.625rem', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.25rem' }}>Post Interactions</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[
                      { key: 'allow_like', label: 'Allow Like', icon: '❤️' },
                      { key: 'allow_comment', label: 'Allow Comment', icon: '💬' },
                      { key: 'allow_share', label: 'Allow Share', icon: '🔗' }
                    ].map(item => (
                      <label key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '1.125rem' }}>{item.icon}</span>
                          <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: '#334155' }}>{item.label}</span>
                        </div>
                        <div style={{ position: 'relative', width: '2.5rem', height: '1.25rem' }}>
                          <input 
                            type="checkbox" 
                            checked={formData[item.key as keyof FormData] as boolean}
                            onChange={(e) => setFormData({...formData, [item.key]: e.target.checked})}
                            style={{ opacity: 0, width: 0, height: 0 }}
                          />
                          <span style={{
                            position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: (formData[item.key as keyof FormData] as boolean) ? '#5c59f2' : '#e2e8f0',
                            transition: '0.4s', borderRadius: '34px'
                          }}>
                            <span style={{
                              position: 'absolute', height: '0.875rem', width: '0.875rem', left: '0.1875rem', bottom: '0.1875rem',
                              backgroundColor: 'white', transition: '0.4s', borderRadius: '50%',
                              transform: (formData[item.key as keyof FormData] as boolean) ? 'translateX(1.25rem)' : 'translateX(0)'
                            }}></span>
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', padding: '0.375rem', borderRadius: '1.25rem', background: '#f1f5f9', gap: '0.375rem' }}>
                  <button 
                    type="button"
                    style={{ 
                      flex: 1, padding: '0.875rem', 
                      background: formData.post_type === 'NEED' ? '#ffffff' : 'transparent',
                      color: formData.post_type === 'NEED' ? '#059669' : '#64748b',
                      borderRadius: '1rem', border: 'none', fontWeight: '800', fontSize: '0.75rem',
                      boxShadow: formData.post_type === 'NEED' ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' : 'none',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => setFormData({...formData, post_type: 'NEED'})}
                  >
                    🙋‍♀️ I NEED
                  </button>
                  <button 
                    type="button"
                    style={{ 
                      flex: 1, padding: '0.875rem', 
                      background: formData.post_type === 'OFFER' ? '#ffffff' : 'transparent',
                      color: formData.post_type === 'OFFER' ? '#2563eb' : '#64748b',
                      borderRadius: '1rem', border: 'none', fontWeight: '800', fontSize: '0.75rem',
                      boxShadow: formData.post_type === 'OFFER' ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' : 'none',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => setFormData({...formData, post_type: 'OFFER'})}
                  >
                    📦 I OFFER
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Fields: Full Width Container */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
              <div style={{ position: 'relative' }} ref={searchRef}>
                <label style={{ fontSize: '0.625rem', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', display: 'block' }}>What are you looking for? *</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    placeholder="Search for an entity..."
                    style={{ width: '100%', padding: '1rem 1.25rem', borderRadius: '1.25rem', border: '1px solid #f1f5f9', background: '#f8fafc', fontWeight: '700', outline: 'none', transition: 'border-color 0.2s' }}
                    value={objectQuery}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#5c59f2'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#f1f5f9'}
                    onChange={(e) => setObjectQuery(e.target.value)}
                  />
                  <div style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                    <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                </div>
                {showDropdown && objectResults.length > 0 && (
                  <div style={{ 
                    position: 'absolute', top: '100%', left: 0, width: '100%', 
                    background: 'white', borderRadius: '1.25rem', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
                    zIndex: 50, border: '1px solid #f1f5f9', marginTop: '0.5rem', overflow: 'hidden'
                  }}>
                    {objectResults.map(obj => (
                      <div 
                        key={obj.id} 
                        style={{ padding: '1rem 1.25rem', cursor: 'pointer', borderBottom: '1px solid #f8fafc', fontWeight: '600', fontSize: '0.875rem' }}
                        onMouseDown={() => {
                          setFormData({...formData, object_id: obj.id, object_name: obj.name});
                          setObjectQuery(obj.name);
                          setShowDropdown(false);
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {obj.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.625rem', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', display: 'block' }}>Where is this? *</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    placeholder="Search for a location..."
                    style={{ width: '100%', padding: '1rem 1.25rem', borderRadius: '1.25rem', border: '1px solid #f1f5f9', background: '#f8fafc', fontWeight: '700', outline: 'none' }}
                    value={formData.location}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#5c59f2'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#f1f5f9'}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                  <div style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                    <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.625rem', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', display: 'block' }}>Post title *</label>
                <input 
                  type="text" 
                  placeholder="Enter a title for your post..."
                  style={{ width: '100%', padding: '1rem 1.25rem', borderRadius: '1.25rem', border: '1px solid #f1f5f9', background: '#f8fafc', fontWeight: '700', outline: 'none' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#5c59f2'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#f1f5f9'}
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.625rem', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', display: 'block' }}>Post description (optional)</label>
                <textarea 
                  placeholder="Brief description for clarity..."
                  style={{ width: '100%', padding: '1rem 1.25rem', borderRadius: '1.25rem', border: '1px solid #f1f5f9', background: '#f8fafc', fontWeight: '700', outline: 'none', minHeight: '120px', resize: 'none' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#5c59f2'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#f1f5f9'}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.625rem', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Post Validity</label>
                  <span style={{ fontSize: '0.75rem', color: '#5c59f2', fontWeight: '800' }}>
                    🗓️ Expiring on: {new Date(new Date().setDate(new Date().getDate() + formData.validity_days)).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
                  {[7, 10, 20, 30, 70, 90].map(days => (
                    <button 
                      key={days}
                      type="button"
                      style={{ 
                        padding: '0.625rem 1.25rem', borderRadius: '1rem', border: '1px solid',
                        borderColor: formData.validity_days === days ? '#5c59f2' : '#f1f5f9',
                        background: formData.validity_days === days ? '#5c59f2' : '#ffffff',
                        color: formData.validity_days === days ? '#ffffff' : '#64748b',
                        fontSize: '0.75rem', fontWeight: '800', transition: 'all 0.2s',
                        boxShadow: formData.validity_days === days ? '0 4px 6px -1px rgb(92 89 242 / 0.3)' : 'none'
                      }}
                      onClick={() => setFormData({...formData, validity_days: days})}
                    >
                      {days} days
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                <button type="submit" className="premium-btn" disabled={isSubmitting} style={{ width: '100%', padding: '1.25rem', opacity: isSubmitting ? 0.7 : 1, borderRadius: '1.25rem', fontWeight: '900', fontSize: '0.875rem', letterSpacing: '0.05em' }}>
                  {isSubmitting ? 'Publishing...' : 'Publish Post'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewPostModal;
