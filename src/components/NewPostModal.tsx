import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { createPost, uploadImage } from '../api/post';
import { searchObjects } from '../api/object';
import { WytObject } from '../api/types';
import { getUserIdFromToken } from '../utils/auth';

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
}

const NewPostModal: React.FC<NewPostModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState<FormData>({
    post_type: 'NEED',
    object_id: '',
    object_name: '',
    location: '',
    title: '',
    description: '',
    validity_days: 30,
    allow_like: true,
    allow_comment: true
  });

  const [objectQuery, setObjectQuery] = useState('');
  const [objectResults, setObjectResults] = useState<WytObject[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [smartInput, setSmartInput] = useState('');
  const [analysis, setAnalysis] = useState<{ type: 'NEED' | 'OFFER' | null; entity: string; location: string } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const skipNextSearch = useRef(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleAnalyze = () => {
    const text = smartInput.toLowerCase();
    let type: 'NEED' | 'OFFER' | null = null;

    // Check for OFFER keywords (higher priority)
    if (text.includes('sell') || text.includes('selling') || text.includes('i have') || text.includes('i offer')) {
      type = 'OFFER';
    } else if (text.includes('i need') || text.includes('i want') || text.includes('looking for') || text.includes('buy')) {
      type = 'NEED';
    }

    // Advanced parsing for "I want to sell [X] in [Y]"
    let entity = '';
    let location = '';

    const inIndex = text.indexOf(' in ');
    if (inIndex !== -1) {
      location = text.substring(inIndex + 4).trim();
      entity = text.substring(0, inIndex);
    } else {
      entity = text;
    }

    // Clean up entity by removing common filler phrases
    entity = entity.replace(/i want to sell|i want to|i have|i need|i offer|looking for|selling|sell|buy/g, '').trim();

    setAnalysis({
      type,
      entity: entity.charAt(0).toUpperCase() + entity.slice(1),
      location: location.charAt(0).toUpperCase() + location.slice(1)
    });
  };

  const handleApplyBestMatch = async () => {
    if (!analysis) return;
    const newFormData = { ...formData };
    if (analysis.type) newFormData.post_type = analysis.type;
    if (analysis.location) newFormData.location = analysis.location;

    if (analysis.entity) {
      setObjectQuery(analysis.entity);
      try {
        const data = await searchObjects(analysis.entity);
        if (data.items && data.items.length > 0) {
          const best = data.items[0];
          newFormData.object_id = best.id;
          newFormData.object_name = analysis.entity;
        }
      } catch (e) {
        console.error('Best match search failed:', e);
      }
    }

    // Auto-generate title: I NEED/OFFER [Entity] in [Location]
    // Use the user's input (alias) for the title to preserve their intent
    const typeLabel = newFormData.post_type === 'NEED' ? 'I NEED' : 'I OFFER';
    const objPart = analysis.entity ? ` ${analysis.entity}` : '';
    const locPart = newFormData.location ? ` in ${newFormData.location}` : '';
    newFormData.title = `${typeLabel}${objPart}${locPart}`;

    skipNextSearch.current = true;
    setFormData(newFormData);
    setAnalysis(null);
    setSmartInput('');
    setObjectQuery(analysis.entity);
    setShowDropdown(false);
    setObjectResults([]);
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (skipNextSearch.current) {
        skipNextSearch.current = false;
        return;
      }
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

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + formData.validity_days);
    const userId = (import.meta as any).env.VITE_USER_ID || getUserIdFromToken();

    console.log('Submission attempted with data:', {
      ...formData,
      userId,
      validUntil: validUntil.toISOString()
    });

    if (!formData.post_type || !formData.title || !formData.location) {
      console.warn('Validation failed:', {
        post_type: !!formData.post_type,
        title: !!formData.title,
        location: !!formData.location
      });
      setShowErrors(true);
      return;
    }

    setIsSubmitting(true);
    let imageUrl: string | null = null;
    if (selectedFile) {
      try {
        const uploadRes = await uploadImage(selectedFile);
        imageUrl = uploadRes.item?.url || null;
      } catch (uploadError: any) {
        console.error('Image upload failed:', uploadError);
        toast.error(`Image upload failed: ${uploadError.message || 'Check your Supabase Storage policies.'}`);
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const response = await createPost({
        user_id: userId as string,
        post_type: formData.post_type,
        object_id: formData.object_id || undefined,
        location: formData.location,
        title: formData.title,
        description: formData.description,
        valid_until: validUntil.toISOString(),
        image_url: imageUrl || undefined,
        allow_like: formData.allow_like,
        allow_comment: formData.allow_comment
      } as any);
      console.log('Post created successfully:', response);
      onSuccess();
    } catch (error: any) {
      console.error('Failed to create post:', error);
      toast.error(`Failed to create post: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="card" style={{ width: '90%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', padding: 0 }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Post to WytWall</h2>
          <button onClick={onClose} style={{ background: 'none', fontSize: '1.5rem' }}>×</button>
        </div>

        <div style={{ padding: '1.5rem 2rem' }}>
          {/* Smart Fill Section */}
          <div style={{
            background: '#ffffff',
            border: '2px dashed #e2e8f0',
            borderRadius: '1.5rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '2rem', height: '2rem', background: '#5c59f2', borderRadius: '0.625rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <span className="material-icons" style={{ fontSize: '1.125rem' }}>auto_awesome</span>
              </div>
              <div>
                <h3 style={{ fontSize: '0.8125rem', fontWeight: '700', color: '#1e293b' }}>Smart Fill ✨</h3>
                <p style={{ fontSize: '0.6875rem', color: '#94a3b8', fontWeight: '400' }}>Type a sentence and we'll auto-detect entity, location & post type</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                placeholder="e.g. i have laptop in chennai"
                value={smartInput}
                onChange={(e) => setSmartInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                style={{
                  flex: 1,
                  padding: '0.875rem 1.25rem',
                  borderRadius: '1rem',
                  border: '1px solid #f1f5f9',
                  background: '#f8fafc',
                  fontSize: '0.8125rem',
                  fontWeight: '600',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!smartInput.trim()}
                style={{
                  padding: '0 1.5rem',
                  background: '#a5b4fc',
                  color: 'white',
                  borderRadius: '1rem',
                  fontWeight: '800',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: !smartInput.trim() ? 0.5 : 1
                }}
              >
                <span className="material-icons" style={{ fontSize: '1rem' }}>bolt</span>
                Analyze
              </button>
            </div>

            {analysis && (
              <div style={{ marginTop: '1.25rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  {analysis.type && (
                    <div style={{ padding: '0.5rem 0.875rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.75rem', color: '#166534', fontSize: '0.6875rem', fontWeight: '600' }}>
                      Detected: {analysis.type}
                    </div>
                  )}
                  {analysis.entity && (
                    <div style={{ padding: '0.5rem 0.875rem', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '0.75rem', color: '#5b21b6', fontSize: '0.6875rem', fontWeight: '600' }}>
                      Entity: {analysis.entity}
                    </div>
                  )}
                  {analysis.location && (
                    <div style={{ padding: '0.5rem 0.875rem', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '0.75rem', color: '#92400e', fontSize: '0.6875rem', fontWeight: '600' }}>
                      Location: {analysis.location}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleApplyBestMatch}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    background: '#5c59f2',
                    color: 'white',
                    borderRadius: '1rem',
                    fontWeight: '700',
                    fontSize: '0.8125rem'
                  }}
                >
                  Apply Best Match
                </button>
              </div>
            )}

            <div style={{ height: '1.5rem' }}></div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, post_type: 'NEED' })}
              style={{
                flex: 1, padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid',
                borderColor: formData.post_type === 'NEED' ? '#5c59f2' : '#f1f5f9',
                background: formData.post_type === 'NEED' ? '#f5f4ff' : '#ffffff',
                color: formData.post_type === 'NEED' ? '#5c59f2' : '#64748b',
                fontWeight: '700', fontSize: '0.875rem', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem'
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
                fontWeight: '700', fontSize: '0.875rem', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem'
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
                    border: '2px dashed #e2e8f0', borderRadius: '1.5rem', padding: previewUrl ? '0' : '2rem',
                    textAlign: 'center', cursor: 'pointer', background: '#f8fafc',
                    transition: 'all 0.2s', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: '0.75rem', height: '120px', justifyContent: 'center',
                    overflow: 'hidden'
                  }}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <>
                      <p style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.75rem' }}>Attach an image</p>
                      <p style={{ fontSize: '0.625rem', color: '#94a3b8' }}>Click to upload · Max 5MB</p>
                    </>
                  )}
                </div>

                <div>
                  <h3 style={{ fontSize: '0.625rem', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Post Interactions</h3>
                  <p style={{ fontSize: '0.6875rem', color: '#94a3b8', marginBottom: '1.25rem' }}>Choose what other users can do on your post.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[
                      { key: 'allow_like', label: 'Allow Like', icon: '❤️' },
                      { key: 'allow_comment', label: 'Allow Comment', icon: '💬' }
                    ].map(item => (
                      <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData[item.key as keyof FormData] as boolean}
                          onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
                          style={{ width: '1.125rem', height: '1.125rem', borderRadius: '4px' }}
                        />
                        <span style={{ fontSize: '0.875rem' }}>{item.icon}</span>
                        <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#475569' }}>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.6875rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.375rem', display: 'block' }}>Post title *</label>
                  <input
                    type="text"
                    placeholder="Enter a title for your post..."
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '1rem', border: '1px solid #f1f5f9', background: '#f8fafc', fontWeight: '600', outline: 'none', fontSize: '0.8125rem' }}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                  {showErrors && !formData.title && <p style={{ color: '#ef4444', fontSize: '0.625rem', fontWeight: '700', marginTop: '0.25rem' }}>This field is mandatory</p>}
                </div>

                <div>
                  <label style={{ fontSize: '0.6875rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.375rem', display: 'block' }}>Post description (optional)</label>
                  <textarea
                    placeholder="Brief description for clarity (not used for matching)"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '1rem', border: '1px solid #f1f5f9', background: '#f8fafc', fontWeight: '500', outline: 'none', minHeight: '80px', resize: 'none', fontSize: '0.8125rem' }}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.6875rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.375rem', display: 'block' }}>What are you looking for? *</label>
                  <div style={{ position: 'relative' }} ref={searchRef}>
                    <input
                      type="text"
                      placeholder="Search for an entity..."
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '1rem', border: '1px solid #f1f5f9', background: '#f8fafc', fontWeight: '500', outline: 'none', fontSize: '0.8125rem' }}
                      value={formData.object_name || objectQuery}
                      onChange={(e) => { setObjectQuery(e.target.value); setFormData({ ...formData, object_id: '', object_name: '' }); }}
                    />
                    {showDropdown && objectResults.length > 0 && !formData.object_id && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: 'white', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 50, border: '1px solid #f1f5f9', marginTop: '0.375rem', overflow: 'hidden' }}>
                        {objectResults.map(obj => (
                          <div key={obj.id} style={{ padding: '0.625rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f8fafc', fontWeight: '600', fontSize: '0.75rem' }} onMouseDown={() => { setFormData({ ...formData, object_id: obj.id, object_name: obj.name }); setObjectQuery(obj.name); setShowDropdown(false); }}>
                            {obj.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.6875rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.375rem', display: 'block' }}>Where is this? *</label>
                  <input
                    type="text"
                    placeholder="Search for a location..."
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '1rem', border: '1px solid #f1f5f9', background: '#f8fafc', fontWeight: '500', outline: 'none', fontSize: '0.8125rem' }}
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                  {showErrors && !formData.location && <p style={{ color: '#ef4444', fontSize: '0.625rem', fontWeight: '600', marginTop: '0.25rem' }}>This field is mandatory</p>}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '1rem' }}>🕒</span>
                    <label style={{ fontSize: '0.6875rem', fontWeight: '800', color: '#1e293b' }}>Post Validity</label>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {[7, 10, 20, 30, 70, 90].map(days => (
                      <button
                        key={days}
                        type="button"
                        style={{
                          padding: '0.5rem 0.875rem', borderRadius: '0.625rem', border: '1px solid',
                          borderColor: formData.validity_days === days ? '#2563eb' : '#f1f5f9',
                          background: formData.validity_days === days ? '#2563eb' : '#ffffff',
                          color: formData.validity_days === days ? '#ffffff' : '#64748b',
                          fontSize: '0.75rem', fontWeight: '700'
                        }}
                        onClick={() => setFormData({ ...formData, validity_days: days })}
                      >
                        {days} days
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.625rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                    🗓️ Expires on {(() => {
                      const expiryDate = new Date(new Date().setDate(new Date().getDate() + formData.validity_days));
                      return expiryDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                    })()}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <button type="submit" className="premium-btn" disabled={isSubmitting} style={{
                width: '100%', padding: '1rem', borderRadius: '1rem', fontWeight: '800',
                fontSize: '0.875rem', background: '#a5b4fc', color: '#ffffff', transition: 'all 0.2s',
                opacity: isSubmitting ? 0.7 : 1, boxShadow: '0 4px 6px -1px rgba(165, 180, 252, 0.3)'
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
