import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { login, register, googleLogin } from '../api/auth';
import { GoogleLogin } from '@react-oauth/google';

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

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError('');
    setLoading(true);
    try {
      if (credentialResponse.credential) {
        await googleLogin(credentialResponse.credential);
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      setError('Google Authentication failed. Please try again.');
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
        role: 'user'
      });
      await login(regEmail, regPassword);
      navigate('/dashboard');
    } catch (err: any) {
      const backendError = err.response?.data?.detail;
      setError(Array.isArray(backendError) ? backendError[0]?.msg : (backendError || 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-['Inter']">
      {/* BEGIN: Header */}
      <header className="w-full py-4 px-8 flex justify-between items-center bg-white border-none">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <Logo size="sm" />
        </div>
        <div className="flex items-center gap-6">
          <button className="text-xl hover:opacity-70 transition-opacity">🌙</button>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-sm text-sm">
            Login / Join
          </button>
        </div>
      </header>

      {/* BEGIN: Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-[540px] mx-auto w-full">
        {/* Branding */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-indigo-600 tracking-tight mb-1">WytPass</h1>
          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
            <span className="text-xs">✨</span> YOUR GATEWAY TO WYTWALL
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#fcfcfd] border border-gray-100 rounded-[2.5rem] p-8 w-full shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          {/* Segmented Tabs */}
          <div className="bg-gray-100/80 p-1.5 rounded-2xl flex md:flex-row gap-1 mb-8">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'login' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'register' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Register
            </button>
          </div>

          <p className="text-center text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-8">
            {activeTab === 'login' ? 'Welcome back to Wytwall' : 'Join the Wytwall community'}
          </p>

          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 px-1">Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-gray-300"
                  required
                />
              </div>
              <div className="relative">
                <label className="block text-xs font-bold text-gray-700 mb-2 px-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-gray-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                    )}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-xl shadow-indigo-100 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 px-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 px-1">WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="+91..."
                    value={regWhatsApp}
                    onChange={(e) => setRegWhatsApp(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 px-1">Email</label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all"
                  required
                />
              </div>
              <div className="relative">
                <label className="block text-xs font-bold text-gray-700 mb-1 px-1">Password</label>
                <div className="relative">
                  <input
                    type={showRegPassword ? "text" : "password"}
                    placeholder="Create password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    {showRegPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 px-1">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Repeat password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          {error && <p className="text-red-500 text-[10px] font-bold text-center mt-4 bg-red-50 p-2 rounded-lg">{error}</p>}

          {/* Social Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
            <div className="relative flex justify-center text-[9px] font-black uppercase tracking-[0.2em]"><span className="px-3 bg-[#fcfcfd] text-gray-300">Or continue with</span></div>
          </div>

          {/* Social Buttons */}
          <div className="flex justify-center w-full mt-4 scale-110">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                setError('Google Login Failed');
              }}
              theme="outline"
              shape="pill"
              size="large"
              width="380px"
            />
          </div>

        </div>

        {/* Footer */}
        <footer className="mt-10 mb-8 flex flex-col items-center gap-2">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">
            Secured by <span className="text-indigo-600">WytPass</span> • Universal Identity & Validation
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Login;
