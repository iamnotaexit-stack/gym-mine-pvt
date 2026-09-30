import { HashRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import LanguageSelector from './components/LanguageSelector';
import { LogOut, Users, Settings as SettingsIcon, Trash2, ListChecks, BarChart2, History, MapPin } from 'lucide-react';
import React, { Suspense, useState } from 'react';
import Members from './pages/Members';

// Code split other routes to keep main bundle tiny
const MemberForm = React.lazy(() => import('./pages/MemberForm'));
const MemberDetails = React.lazy(() => import('./pages/MemberDetails'));
const PaymentForm = React.lazy(() => import('./pages/PaymentForm'));
const Receipt = React.lazy(() => import('./pages/Receipt'));
const Trash = React.lazy(() => import('./pages/Trash'));
const Settings = React.lazy(() => import('./pages/Settings'));
const ChaseList = React.lazy(() => import('./pages/ChaseList'));
const Stats = React.lazy(() => import('./pages/Stats'));
const ActivityLog = React.lazy(() => import('./pages/ActivityLog'));

function ProtectedRoute({ children, requireOwner = false }: { children: React.ReactNode, requireOwner?: boolean }) {
  const { user, role, loading } = useAuth();

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (requireOwner && role !== 'owner') return <Navigate to="/" />;

  return <>{children}</>;
}

function Layout({ children }: { children: React.ReactNode }) {
  const { signOut, role } = useAuth();
  const { t } = useLanguage();
  
  const roleLabel = role === 'owner' ? t('role_owner') : (role === 'subadmin' ? t('role_subadmin') : t('role_member'));

  return (
    <div className="min-h-screen flex flex-col sm:flex-row bg-white pb-16 sm:pb-0">
      <header className="bg-red-700 text-white p-4 flex sm:flex-col justify-between sm:justify-start items-center sm:items-stretch shadow-md sm:w-64 sm:h-screen sm:sticky top-0 z-10 shrink-0">
        <div className="flex flex-col w-full sm:mb-4">
          <div className="flex justify-between items-center w-full">
            <div>
              <h1 className="font-bold text-xl sm:text-2xl text-left leading-tight">{t('app_title')}</h1>
              <div className="flex items-center gap-1 text-[11px] text-red-100 font-medium mt-0.5">
                <MapPin size={11} className="shrink-0 text-red-200" />
                <span>{t('app_subtitle')}</span>
              </div>
            </div>
            
          </div>
        </div>

        <div className="hidden sm:block mb-4">
          <LanguageSelector variant="header" className="w-full justify-center" />
        </div>
        
        {/* Desktop Nav Rail / Sidebar */}
        <nav className="hidden sm:flex flex-col gap-2 flex-1">
          {role !== 'member' && (
            <>
              <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-600 transition-colors text-red-50">
                <Users size={20} /> <span className="hidden md:inline font-medium">{t('nav_members')}</span>
              </Link>
              <Link to="/chase" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-600 transition-colors text-red-50">
                <ListChecks size={20} /> <span className="hidden md:inline font-medium">{t('nav_chase')}</span>
              </Link>
            </>
          )}
          {role === 'owner' && (
            <>
              <Link to="/stats" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-600 transition-colors text-red-50">
                <BarChart2 size={20} /> <span className="hidden md:inline font-medium">{t('nav_stats')}</span>
              </Link>
              <Link to="/trash" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-600 transition-colors text-red-50">
                <Trash2 size={20} /> <span className="hidden md:inline font-medium">{t('nav_trash')}</span>
              </Link>
              <Link to="/activity" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-600 transition-colors text-red-50">
                <History size={20} /> <span className="hidden md:inline font-medium">{t('nav_activity')}</span>
              </Link>
              <Link to="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-600 transition-colors text-red-50">
                <SettingsIcon size={20} /> <span className="hidden md:inline font-medium">{t('nav_settings')}</span>
              </Link>
            </>
          )}
        </nav>

        <div className="flex sm:flex-col items-center sm:items-start gap-4 sm:gap-2 sm:mt-auto">
          <div className="text-xs opacity-80 uppercase font-semibold tracking-wider">{roleLabel}</div>
          <button onClick={signOut} className="p-2 sm:px-3 sm:py-2 sm:w-full flex items-center justify-center sm:justify-start gap-2 hover:bg-red-600 rounded-full sm:rounded-lg transition-colors text-red-50">
            <LogOut size={20} /> <span className="hidden md:inline font-medium">{t('nav_logout')}</span>
          </button>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-red-200 flex justify-around items-center h-16 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {role !== 'member' && (
          <>
            <Link to="/" className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-red-600">
              <Users size={24} />
              <span className="text-[10px] font-medium mt-1">{t('nav_members')}</span>
            </Link>
            <Link to="/chase" className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-red-600">
              <ListChecks size={24} />
              <span className="text-[10px] font-medium mt-1">{t('nav_chase')}</span>
            </Link>
          </>
        )}
        {role === 'owner' && (
          <>
            <Link to="/stats" className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-red-600">
              <BarChart2 size={24} />
              <span className="text-[10px] font-medium mt-1">{t('nav_stats')}</span>
            </Link>
            <Link to="/settings" className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-red-600">
              <SettingsIcon size={24} />
              <span className="text-[10px] font-medium mt-1">{t('nav_settings')}</span>
            </Link>
          </>
        )}
      </nav>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 min-w-0">
        <Suspense fallback={<div className="p-8 text-center text-gray-500">{t('loading')}</div>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}

function Login() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isMagicLink, setIsMagicLink] = useState(false);

  if (user) return <Navigate to="/" />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    const { supabase } = await import('./lib/supabase');
    
    if (isMagicLink) {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: window.location.origin } });
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      }
    }
    setLoading(false);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm border border-red-100">
        <div className="flex justify-between items-center mb-4">
          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-sm">
            GA
          </div>
          <LanguageSelector variant="compact" />
        </div>
        
        <h2 className="text-2xl font-bold text-center mb-1 text-gray-900">{t('app_title')}</h2>
        <p className="text-xs text-center text-gray-500 mb-6">{t('app_subtitle')}</p>
        
        {/* Tabs */}
        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          <button type="button" onClick={() => { setIsMagicLink(false); setError(null); setSuccess(false); }} className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${!isMagicLink ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>Password</button>
          <button type="button" onClick={() => { setIsMagicLink(true); setError(null); setSuccess(false); }} className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${isMagicLink ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>Magic Link</button>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-4">Check your email for the magic login link!</div>}

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              required
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 min-h-[44px]"
            />
          </div>
          
          {!isMagicLink && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input 
                required
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 min-h-[44px]"
              />
            </div>
          )}
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 min-h-[44px] shadow-sm disabled:opacity-50"
        >
          {loading ? 'Sending...' : (isMagicLink ? 'Send Magic Link' : 'Sign In')}
        </button>
      </form>
    </div>
  );
}

const MemberDashboard = React.lazy(() => import('./pages/MemberDashboard'));

function RootRoute() {
  const { role } = useAuth();
  if (role === 'member') return <MemberDashboard />;
  return <Members />;
}

import { ErrorBoundary } from './ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Layout><RootRoute /></Layout></ProtectedRoute>} />
              <Route path="/members/add" element={<ProtectedRoute><Layout><MemberForm /></Layout></ProtectedRoute>} />
              <Route path="/members/:id" element={<ProtectedRoute><Layout><MemberDetails /></Layout></ProtectedRoute>} />
              <Route path="/members/:id/edit" element={<ProtectedRoute><Layout><MemberForm /></Layout></ProtectedRoute>} />
              <Route path="/payments/add/:memberId" element={<ProtectedRoute requireOwner><Layout><PaymentForm /></Layout></ProtectedRoute>} />
              <Route path="/receipt/:id" element={<ProtectedRoute><Layout><Receipt /></Layout></ProtectedRoute>} />
              <Route path="/chase" element={<ProtectedRoute><Layout><ChaseList /></Layout></ProtectedRoute>} />
              <Route path="/stats" element={<ProtectedRoute requireOwner><Layout><Stats /></Layout></ProtectedRoute>} />
              <Route path="/trash" element={<ProtectedRoute requireOwner><Layout><Trash /></Layout></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute requireOwner><Layout><Settings /></Layout></ProtectedRoute>} />
              <Route path="/activity" element={<ProtectedRoute requireOwner><Layout><ActivityLog /></Layout></ProtectedRoute>} />
            </Routes>
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
