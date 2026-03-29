import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../api/auth';

const Login: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Visibility States
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  
  // Login State
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  
  // Register State
  const [regFullName, setRegFullName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regWhatsApp, setRegWhatsApp] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [isDeveloper, setIsDeveloper] = useState<boolean>(false);
  
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      const backendError = err.response?.data?.detail;
      setError(Array.isArray(backendError) ? backendError[0]?.msg : (backendError || 'Login failed. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await register({
        full_name: regFullName,
        email: regEmail,
        phone: regWhatsApp,
        password: regPassword,
        role: isDeveloper ? 'developer' : 'user'
      });
      // After registration, log in the user or switch to login tab
      await login(regEmail, regPassword);
      navigate('/dashboard');
    } catch (err: any) {
      const backendError = err.response?.data?.detail;
      setError(Array.isArray(backendError) ? backendError[0]?.msg : (backendError || 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.9rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#fff',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '0.4rem',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#4a5568',
  };

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontFamily: "'Inter', sans-serif"
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ width: '100%', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>W</div>
          <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#5c59f2' }}>WytNet</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>🌙</button>
          <button style={{ backgroundColor: '#5c59f2', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: '600' }}>Login / Join</button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', width: '100%', maxWidth: '500px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#5c59f2', marginBottom: '0.2rem' }}>WytPass</h1>
        <p style={{ color: '#a0aec0', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.1em', marginBottom: '2rem' }}>✨ YOUR GATEWAY TO WYTWALL</p>

        {/* Card */}
        <div style={{ backgroundColor: '#fcfcfd', borderRadius: '24px', padding: '2rem', width: '100%', border: '1px solid #f1f3f7', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', backgroundColor: '#f3f4f6', borderRadius: '12px', padding: '4px', marginBottom: '1.5rem' }}>
            <button 
              onClick={() => setActiveTab('login')}
              style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', backgroundColor: activeTab === 'login' ? '#5c59f2' : 'transparent', color: activeTab === 'login' ? 'white' : '#64748b', transition: 'all 0.2s', fontSize: '0.9rem' }}
            >
              Login
            </button>
            <button 
              onClick={() => setActiveTab('register')}
              style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', backgroundColor: activeTab === 'register' ? '#5c59f2' : 'transparent', color: activeTab === 'register' ? 'white' : '#64748b', transition: 'all 0.2s', fontSize: '0.9rem' }}
            >
              Register
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.7rem', color: '#a0aec0', fontWeight: '700', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
            {activeTab === 'login' ? 'Welcome back to Wytwall' : 'Join the Wytwall community'}
          </p>

          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={inputStyle}
                  />
                  <span 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#a0aec0', padding: '4px' }}
                  >
                    {showPassword ? '👁️‍🗨️' : '👁️'}
                  </span>
                </div>
              </div>
              <button type="submit" disabled={loading} style={{ width: '100%', padding: '1rem', backgroundColor: '#5c59f2', color: 'white', fontWeight: '700', borderRadius: '12px', marginBottom: '1rem' }}>
                {loading ? 'Processing...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>WhatsApp Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={regWhatsApp}
                  onChange={(e) => setRegWhatsApp(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showRegPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    style={inputStyle}
                  />
                  <span 
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#a0aec0', padding: '4px' }}
                  >
                    {showRegPassword ? '👁️‍🗨️' : '👁️'}
                  </span>
                </div>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle}>Confirm Password</label>
                <input
                  type="password"
                  placeholder="Confirm your password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                <input 
                  type="checkbox" 
                  id="dev-check" 
                  checked={isDeveloper}
                  onChange={(e) => setIsDeveloper(e.target.checked)}
                />
                <label htmlFor="dev-check" style={{ fontSize: '0.65rem', fontWeight: '700', color: '#a0aec0', textTransform: 'uppercase' }}>
                  Register as Developer (Create Projects, API Keys)
                </label>
              </div>
              <button type="submit" disabled={loading} style={{ width: '100%', padding: '1rem', backgroundColor: '#5c59f2', color: 'white', fontWeight: '700', borderRadius: '12px', marginBottom: '1rem' }}>
                {loading ? 'Processing...' : 'Create Account'}
              </button>
            </form>
          )}

          {error && <p style={{ color: '#e53e3e', fontSize: '0.8rem', textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}
        </div>

        <p style={{ marginTop: '2rem', fontSize: '0.65rem', color: '#a0aec0', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Secured by <span style={{ color: '#5c59f2' }}>WytPass</span> • Universal Identity & Validation
        </p>
      </div>
    </div>
  );
};

export default Login;
