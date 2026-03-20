import React, { useState, useEffect, useRef } from 'react';
import { createPost } from '../api/post';
import { searchObjects } from '../api/object';

const NewPostModal = ({ onClose, onSuccess }) => {
  const [smartText, setSmartText] = useState('');
  const [smartDetected, setSmartDetected] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [formData, setFormData] = useState({
    post_type: 'NEED',
    object_id: '',
    object_name: '',
    location: '',
    title: '',
    description: '',
    validity_days: 30
  });

  const [objectQuery, setObjectQuery] = useState('');
  const [objectResults, setObjectResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  const [recommendedEntities, setRecommendedEntities] = useState([]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const data = await searchObjects('a'); // Get some common objects
        // or just use getObjects
        import('../api/object').then(async ({ getObjects }) => {
          const res = await getObjects(0, 5);
          setRecommendedEntities(res.items || []);
        });
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      }
    };
    fetchRecommendations();
  }, []);

  // Debounced Object Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (objectQuery.length >= 2) {
        setIsSearching(true);
        try {
          const data = await searchObjects(objectQuery);
          setObjectResults(data.items || []);
          setShowDropdown(true);
        } catch (error) {
          console.error('Search failed:', error);
        } finally {
          setIsSearching(false);
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
    
    // Basic Frontend Parsing
    const text = smartText.toLowerCase();
    let type = 'NEED';
    if (text.includes('offer') || text.includes('have') || text.includes('sell') || text.includes('give')) type = 'OFFER';
    
    const words = text.replace(/[.,!?;:]/g, "").split(/\s+/);
    const stopWords = ['i', 'a', 'an', 'the', 'need', 'have', 'want', 'looking', 'for', 'in', 'at', 'near', 'with', 'and', 'or', 'some', 'any', 'my', 'his', 'her'];
    const potentialEntities = words.filter(w => w.length > 2 && !stopWords.includes(w));
    
    let loc = text.includes('in ') ? text.split('in ')[1].split(' ')[0] : '';

    // Verify entity in backend by checking potential words
    let matchedObject = null;
    
    // Try to find a match among potential words
    for (const word of potentialEntities) {
      try {
        const searchData = await searchObjects(word);
        if (searchData.items && searchData.items.length > 0) {
          // Check if any result is an exact or very close match
          const exactMatch = searchData.items.find(item => item.name.toLowerCase() === word);
          matchedObject = exactMatch || searchData.items[0];
          if (matchedObject) break; // Found one!
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

  const handleApplyRecommended = (obj) => {
    setFormData({
      ...formData,
      object_id: obj.id,
      object_name: obj.name,
      title: `I ${formData.post_type.toLowerCase()} ${obj.name} in ${formData.location || 'Madurai'}`
    });
    setObjectQuery(obj.name);
  };

  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.object_id || !formData.post_type || !formData.title || !formData.location) {
      alert('Please fill all required fields (Object, Type, Title, Location)');
      return;
    }

    setIsSubmitting(true);
    // Calculate real validity date
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + formData.validity_days);

    const userId = import.meta.env.VITE_USER_ID || (await import('../utils/auth')).getUserIdFromToken();

    let imageUrl = null;
    if (selectedFile) {
      try {
        const uploadRes = await import('../api/post').then(({ uploadImage }) => uploadImage(selectedFile));
        imageUrl = uploadRes.url;
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError);
      }
    }

    try {
      await createPost({
        user_id: userId,
        post_type: formData.post_type,
        object_id: formData.object_id,
        location: formData.location,
        title: formData.title,
        description: formData.description,
        valid_until: validUntil.toISOString(),
        image_url: imageUrl
      });
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
          <div style={{ background: '#f8f4ff', padding: '1.5rem', borderRadius: '12px', border: '1px dashed var(--primary-color)', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>
              <span>✨</span>
              <span style={{ fontWeight: '600' }}>Smart Fill</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Type a sentence and we'll auto-detect entity, location & post type</span>
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
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>RECOMMENDED ENTITIES</p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {recommendedEntities.map(obj => (
                      <span key={obj.id} style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.75rem', background: 'white', cursor: 'pointer' }} onClick={() => handleApplyRecommended(obj)}>
                        {obj.name}
                      </span>
                    ))}
                  </div>
                </div>

                {smartDetected.location && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>RECOMMENDED LOCATIONS</p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid #c6f6d5', fontSize: '0.75rem', background: '#f0fff4', color: '#2f855a', cursor: 'pointer' }}>
                        {smartDetected.location} <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>New Location</span>
                      </span>
                    </div>
                  </div>
                )}

                <button className="premium-btn" style={{ width: '100%', padding: '1rem', background: 'var(--purple-gradient)' }} onClick={handleApplySmartFill}>
                  Apply Best Match
                </button>
              </div>
            )}
          </div>

          {/* Main Form */}
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
            {/* Left: Image Upload */}
            <div 
              onClick={handleImageClick}
              style={{ 
                border: '2px dashed #ddd', 
                borderRadius: '12px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '2rem',
                height: '300px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                overflow: 'hidden',
                position: 'relative'
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
                <div style={{ textAlign: 'center' }}>
                  <img 
                    src={URL.createObjectURL(selectedFile)} 
                    alt="Preview" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} 
                  />
                  <div style={{ position: 'relative', zIndex: 1, background: 'rgba(255,255,255,0.8)', padding: '0.5rem', borderRadius: '4px' }}>
                    Change Image
                  </div>
                </div>
              ) : (
                <>
                  <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>📤</span>
                  <p style={{ fontWeight: '600' }}>Attach an image</p>
                  <p style={{ fontSize: '0.75rem' }}>Click to upload - Max 5MB</p>
                </>
              )}
            </div>

            {/* Right: Form Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Type Toggle */}
              <div style={{ display: 'flex', borderRadius: '12px', border: '1px solid #ddd', overflow: 'hidden' }}>
                <button 
                  type="button"
                  style={{ 
                    flex: 1, padding: '1rem', 
                    background: formData.post_type === 'NEED' ? '#f0f4ff' : 'white',
                    color: formData.post_type === 'NEED' ? 'var(--primary-color)' : 'var(--text-main)',
                    borderRadius: 0,
                    borderRight: '1px solid #ddd'
                  }}
                  onClick={() => setFormData({...formData, post_type: 'NEED'})}
                >
                  🙋‍♂️ I NEED
                </button>
                <button 
                  type="button"
                  style={{ 
                    flex: 1, padding: '1rem', 
                    background: formData.post_type === 'OFFER' ? '#f0f4ff' : 'white',
                    color: formData.post_type === 'OFFER' ? 'var(--primary-color)' : 'var(--text-main)',
                    borderRadius: 0
                  }}
                  onClick={() => setFormData({...formData, post_type: 'OFFER'})}
                >
                  📦 I OFFER
                </button>
              </div>

              {/* Object Search */}
              <div style={{ position: 'relative' }} ref={searchRef}>
                <label>What are you looking for? *</label>
                <input 
                  type="text" 
                  placeholder="Search for an entity..."
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #ddd' }}
                  value={objectQuery}
                  onChange={(e) => setObjectQuery(e.target.value)}
                />
                {showDropdown && objectResults.length > 0 && (
                  <div style={{ 
                    position: 'absolute', top: '100%', left: 0, width: '100%', 
                    background: 'white', borderRadius: '8px', boxShadow: 'var(--shadow)', 
                    zIndex: 10, border: '1px solid #eee' 
                  }}>
                    {objectResults.map(obj => (
                      <div 
                        key={obj.id} 
                        style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f9f9f9' }}
                        onMouseDown={() => {
                          setFormData({...formData, object_id: obj.id, object_name: obj.name});
                          setObjectQuery(obj.name);
                          setShowDropdown(false);
                        }}
                      >
                        {obj.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label>Where is this? *</label>
                <input 
                  type="text" 
                  placeholder="Search for a location..."
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #ddd' }}
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>

              <div>
                <label>Post title *</label>
                <input 
                  type="text" 
                  placeholder="Enter a title for your post..."
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #ddd' }}
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div>
                <label>Post description (optional)</label>
                <textarea 
                  placeholder="Brief description for clarity..."
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #ddd', minHeight: '100px' }}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              {/* Validity */}
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Post Validity
                  <span style={{ fontSize: '0.875rem', color: 'var(--primary-color)', fontWeight: '600' }}>
                    Expiring on: {new Date(new Date().setDate(new Date().getDate() + formData.validity_days)).toLocaleDateString()}
                  </span>
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {[7, 10, 20, 30, 70, 90].map(days => (
                    <button 
                      key={days}
                      type="button"
                      style={{ 
                        padding: '6px 12px', borderRadius: '6px', border: '1px solid #ddd',
                        background: formData.validity_days === days ? 'var(--primary-color)' : 'white',
                        color: formData.validity_days === days ? 'white' : 'var(--text-main)',
                        fontSize: '0.875rem'
                      }}
                      onClick={() => setFormData({...formData, validity_days: days})}
                    >
                      {days} days
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="premium-btn" disabled={isSubmitting} style={{ width: '100%', padding: '1rem', opacity: isSubmitting ? 0.7 : 1 }}>
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
