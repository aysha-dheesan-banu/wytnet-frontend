import React, { useState, useEffect, useRef } from 'react';
import { createPost } from '../api/post';
import { searchObjects } from '../api/object';
import { WytObject } from '../api/types';

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
  const [objectResults, setObjectResults] = useState<WytObject[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [recommendedEntities, setRecommendedEntities] = useState<WytObject[]>([]);


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

    let matchedObject: WytObject | null = null;
    let matchedWord = '';

    for (const word of potentialEntities) {
      try {
        const searchData = await searchObjects(word);
        if (searchData.items && searchData.items.length > 0) {
          const exactMatch = searchData.items.find(item => item.name.toLowerCase() === word);
          matchedObject = exactMatch || searchData.items[0];
          if (matchedObject) {
            matchedWord = word.charAt(0).toUpperCase() + word.slice(1);
            break;
          }
        }
      } catch (error) {
        console.error('Failed to search entity:', error);
      }
    }

    if (matchedObject) {
      // Dynamic Recommendations based on relationships
      const currentRelated: WytObject[] = [matchedObject];

      // Smart Fallbacks for common entities if the graph is sparse
      const entityName = matchedObject.name.toLowerCase();
      if (entityName === 'laptop') {
        const fallbacks = [
          { id: 'kbd-id', name: 'Keyboard', category: 'Peripheral' },
          { id: 'mse-id', name: 'Mouse', category: 'Peripheral' },
          { id: 'chg-id', name: 'Charger', category: 'Accessory' }
        ];
        fallbacks.forEach(f => {
          if (!currentRelated.find(r => r.name.toLowerCase() === f.name.toLowerCase())) {
            currentRelated.push(f as unknown as WytObject);
          }
        });
      }

      setRecommendedEntities(currentRelated);

      try {
        const { getObjectRelations } = await import('../api/object');
        const relData = await getObjectRelations(matchedObject.id);
        if (relData && relData.items && relData.items.length > 0) {
          const apiRelated = relData.items.map((r: any) => r.related_object).filter(Boolean);
          const combined = [...currentRelated, ...apiRelated];
          // Unique by name
          const unique = combined.filter((v, i, a) => a.findIndex(t => t.name === v.name) === i);
          setRecommendedEntities(unique as WytObject[]);
        }
      } catch (err) {
        console.error('Failed to fetch relations for recommendations:', err);
      }
    } else {
      setRecommendedEntities([]);
    }

    setSmartDetected({
      type,
      entity: matchedWord || (potentialEntities[0] ? potentialEntities[0].charAt(0).toUpperCase() + potentialEntities[0].slice(1) : ''),
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

  const handleApplyRecommended = (obj: WytObject) => {
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
  const [showErrors, setShowErrors] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.object_id || !formData.post_type || !formData.title || !formData.location) {
      setShowErrors(true);
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

        <div style={{ padding: '1.5rem 2rem' }}>
          {/* Smart Fill Section at Top */}
          <div style={{ background: '#f8f4ff', padding: '1.25rem', borderRadius: '1.25rem', border: '1px dashed #c084fc', marginBottom: '1.5rem', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ background: '#9333ea', color: 'white', width: '2rem', height: '2rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div>
                <p style={{ fontSize: '0.8125rem', fontWeight: '800', color: '#6b21a8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>Smart Fill ✨</p>
                <p style={{ fontSize: '0.6875rem', color: '#9333ea', fontWeight: '500' }}>Type a sentence and we'll auto-detect entity, location & post type</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                placeholder='e.g. "I have a car in Madurai" or "I need a laptop in Chennai"'
                style={{ flex: 1, padding: '0.875rem 1.25rem', borderRadius: '1rem', border: '1px solid #f1f5f9', outline: 'none', fontSize: '0.8125rem' }}
                value={smartText}
                onChange={(e) => setSmartText(e.target.value)}
              />
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                style={{
                  padding: '0.875rem 1.5rem', background: '#c084fc', color: 'white', borderRadius: '1rem',
                  fontWeight: '800', fontSize: '0.8125rem', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}
              >
                {isAnalyzing ? '...' : <><svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg> Analyze</>}
              </button>
            </div>

            {smartDetected && (
              <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ padding: '0.375rem 0.875rem', background: 'white', borderRadius: '2rem', border: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: '700' }}>Detected: {smartDetected.type}</span>
                  <span style={{ padding: '0.375rem 0.875rem', background: 'white', borderRadius: '2rem', border: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: '700' }}>Entity: {smartDetected.entity}</span>
                  {smartDetected.location && <span style={{ padding: '0.375rem 0.875rem', background: 'white', borderRadius: '2rem', border: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: '700' }}>Location: {smartDetected.location}</span>}
                </div>

                {recommendedEntities.length > 0 && (
                  <div style={{ background: 'white', padding: '1rem', borderRadius: '1rem', border: '1px solid #f1f5f9' }}>
                    <p style={{ fontSize: '0.625rem', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Recommended Entities</p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {recommendedEntities.map(obj => (
                        <span
                          key={obj.id}
                          onClick={() => handleApplyRecommended(obj)}
                          style={{ padding: '0.375rem 0.75rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #f1f5f9', fontSize: '0.6875rem', fontWeight: '700', cursor: 'pointer', color: '#5c59f2' }}
                        >
                          {obj.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button type="button" onClick={handleApplySmartFill} style={{ width: '100%', padding: '0.75rem', background: '#9333ea', color: 'white', borderRadius: '0.75rem', fontWeight: '800', fontSize: '0.75rem', boxShadow: '0 4px 6px -1px rgba(147, 51, 234, 0.2)' }}>Apply Best Match</button>
              </div>
            )}
          </div>

          {/* Post Type Selector */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, post_type: 'NEED' })}
              style={{
                flex: 1, padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid',
                borderColor: formData.post_type === 'NEED' ? '#5c59f2' : '#f1f5f9',
                background: formData.post_type === 'NEED' ? '#f5f4ff' : '#ffffff',
                color: formData.post_type === 'NEED' ? '#5c59f2' : '#64748b',
                fontWeight: '800', fontSize: '0.875rem', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                boxShadow: formData.post_type === 'NEED' ? '0 4px 12px -2px rgba(92, 89, 242, 0.15)' : 'none'
              }}
            >
              <div style={{ padding: '0.5rem', background: 'white', borderRadius: '0.75rem', fontSize: '1.25rem' }}>🙋‍♀️</div>
              I NEED
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, post_type: 'OFFER' })}
              style={{
                flex: 1, padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid',
                borderColor: formData.post_type === 'OFFER' ? '#5c59f2' : '#f1f5f9',
                background: formData.post_type === 'OFFER' ? '#f5f4ff' : '#ffffff',
                color: formData.post_type === 'OFFER' ? '#5c59f2' : '#64748b',
                fontWeight: '800', fontSize: '0.875rem', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                boxShadow: formData.post_type === 'OFFER' ? '0 4px 12px -2px rgba(92, 89, 242, 0.15)' : 'none'
              }}
            >
              <div style={{ padding: '0.5rem', background: 'white', borderRadius: '0.75rem', fontSize: '1.25rem' }}>📦</div>
              I OFFER
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '2.5rem', alignItems: 'start' }}>

              {/* Left Column: Image & Interactions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div
                  onClick={handleImageClick}
                  style={{
                    border: '2px dashed #f1f5f9', borderRadius: '2rem', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', padding: '2rem', height: '300px',
                    color: '#94a3b8', cursor: 'pointer', overflow: 'hidden', position: 'relative',
                    backgroundColor: '#f8fafc', transition: 'all 0.2s ease'
                  }}
                >
                  <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} accept="image/*" />
                  {selectedFile ? (
                    <div style={{ width: '100%', height: '100%' }}>
                      <img src={URL.createObjectURL(selectedFile)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <>
                      <div style={{ padding: '0.75rem', backgroundColor: 'white', borderRadius: '1rem', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <svg style={{ width: '1.5rem', height: '1.5rem', color: '#cbd5e1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                      <p style={{ fontWeight: '800', color: '#334155', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>Attach an image</p>
                      <p style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>Click to upload · Max 5MB</p>
                    </>
                  )}
                </div>

                <div>
                  <p style={{ fontSize: '0.625rem', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.25rem' }}>Post Interactions</p>
                  <p style={{ fontSize: '0.6875rem', color: '#94a3b8', marginBottom: '1.25rem' }}>Choose what other users can do on your post.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[
                      { key: 'allow_like', label: 'Allow Like', icon: '❤️' },
                      { key: 'allow_comment', label: 'Allow Comment', icon: '💬' },
                      { key: 'allow_share', label: 'Allow Share', icon: '🔗' }
                    ].map(item => (
                      <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', userSelect: 'none' }}>
                        <input
                          type="checkbox"
                          checked={formData[item.key as keyof FormData] as boolean}
                          onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
                          style={{ width: '1.25rem', height: '1.25rem', borderRadius: '4px', border: '2px solid #e2e8f0' }}
                        />
                        <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                        <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: '#334155' }}>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.6875rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem', display: 'block' }}>Post title *</label>
                  <input
                    type="text"
                    placeholder="Enter a title for your post..."
                    style={{ width: '100%', padding: '1rem 1.25rem', borderRadius: '1.25rem', border: '1px solid #f1f5f9', background: '#f8fafc', fontWeight: '600', outline: 'none', fontSize: '0.875rem' }}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                  {showErrors && !formData.title && <p style={{ color: '#ef4444', fontSize: '0.625rem', fontWeight: '700', marginTop: '0.375rem' }}>This field is mandatory</p>}
                </div>

                <div>
                  <label style={{ fontSize: '0.6875rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem', display: 'block' }}>Post description (optional)</label>
                  <textarea
                    placeholder="Brief description for clarity (not used for matching)"
                    style={{ width: '100%', padding: '1rem 1.25rem', borderRadius: '1.25rem', border: '1px solid #f1f5f9', background: '#f8fafc', fontWeight: '600', outline: 'none', minHeight: '100px', resize: 'none', fontSize: '0.875rem' }}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div style={{ position: 'relative' }} ref={searchRef}>
                  <label style={{ fontSize: '0.6875rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem', display: 'block' }}>What are you looking for? *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Search for an entity..."
                      style={{ width: '100%', padding: '1rem 1.25rem', borderRadius: '1.25rem', border: '1px solid #f1f5f9', background: '#f8fafc', fontWeight: '600', outline: 'none', transition: 'border-color 0.2s', fontSize: '0.875rem' }}
                      value={formData.object_name || objectQuery}
                      onChange={(e) => setObjectQuery(e.target.value)}
                    />
                    <div style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#cbd5e1' }}>
                      <svg style={{ width: '1.125rem', height: '1.125rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  </div>
                  {showDropdown && objectResults.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: 'white', borderRadius: '1.25rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 50, border: '1px solid #f1f5f9', marginTop: '0.5rem', overflow: 'hidden' }}>
                      {objectResults.map(obj => (
                        <div key={obj.id} style={{ padding: '0.875rem 1.25rem', cursor: 'pointer', borderBottom: '1px solid #f8fafc', fontWeight: '600', fontSize: '0.875rem' }} onMouseDown={() => { setFormData({ ...formData, object_id: obj.id, object_name: obj.name }); setObjectQuery(obj.name); setShowDropdown(false); }}>
                          {obj.name}
                        </div>
                      ))}
                    </div>
                  )}
                  {showErrors && !formData.object_id && <p style={{ color: '#ef4444', fontSize: '0.625rem', fontWeight: '700', marginTop: '0.375rem' }}>This field is mandatory</p>}
                </div>

                <div>
                  <label style={{ fontSize: '0.6875rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem', display: 'block' }}>Where is this? *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Search for a location..."
                      style={{ width: '100%', padding: '1rem 1.25rem', borderRadius: '1.25rem', border: '1px solid #f1f5f9', background: '#f8fafc', fontWeight: '600', outline: 'none', fontSize: '0.875rem' }}
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                    <div style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#cbd5e1' }}>
                      <svg style={{ width: '1.125rem', height: '1.125rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  </div>
                  {showErrors && !formData.location && <p style={{ color: '#ef4444', fontSize: '0.625rem', fontWeight: '700', marginTop: '0.375rem' }}>This field is mandatory</p>}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '1rem' }}>⏳</span>
                    <label style={{ fontSize: '0.6875rem', fontWeight: '800', color: '#1e293b' }}>Post Validity</label>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {[7, 10, 20, 30, 70, 90].map(days => (
                      <button
                        key={days}
                        type="button"
                        style={{
                          padding: '0.75rem 1.25rem', borderRadius: '0.75rem', border: '1px solid',
                          borderColor: formData.validity_days === days ? '#2563eb' : '#f1f5f9',
                          background: formData.validity_days === days ? '#2563eb' : '#ffffff',
                          color: formData.validity_days === days ? '#ffffff' : '#64748b',
                          fontSize: '0.8125rem', fontWeight: '700', transition: 'all 0.2s'
                        }}
                        onClick={() => setFormData({ ...formData, validity_days: days })}
                      >
                        {days} days
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: '0.75rem' }}>
                    📝 Expires on {(() => {
                      const expiryDate = new Date(new Date().setDate(new Date().getDate() + formData.validity_days));
                      const month = expiryDate.toLocaleDateString('en-US', { month: 'long' });
                      const day = expiryDate.getDate();
                      const year = expiryDate.getFullYear();
                      let suffix = 'th';
                      if (day > 3 && day < 21) suffix = 'th';
                      else {
                        switch (day % 10) {
                          case 1: suffix = "st"; break;
                          case 2: suffix = "nd"; break;
                          case 3: suffix = "rd"; break;
                          default: suffix = "th";
                        }
                      }
                      return `${month} ${day}${suffix}, ${year}`;
                    })()}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Submit Row */}
            <div style={{ marginTop: '2.5rem' }}>
              <button type="submit" className="premium-btn" disabled={isSubmitting} style={{
                width: '100%', padding: '1.25rem', borderRadius: '1.25rem', fontWeight: '800',
                fontSize: '1rem', background: '#a5b4fc', color: '#1e1b4b', transition: 'all 0.2s',
                opacity: isSubmitting ? 0.7 : 1
              }}>
                {isSubmitting ? 'Publishing...' : 'Publish Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewPostModal;
