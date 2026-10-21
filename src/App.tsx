import React, { useState } from 'react';
import {
  Activity,
  MapPin,
  Fuel,
  GitCompare,
  TrendingUp,
  BarChart3,
  Cpu,
  Database,
  LogOut,
  Search,
  Layers,
  ChevronRight,
  Zap,
  Menu,
  X,
  Lock,
  Mail,
  User as UserIcon,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Card, Button, Badge, MetricCard, EmptyState, SkeletonLoader, ToastContainer, type ToastMessage } from './components/UIComponents';
import { api, type User } from './services/api';

export type Role = 'USER' | 'ANALYST';
export type Page = 'DASHBOARD' | 'CONGESTION' | 'FUEL' | 'ROUTE_COMPARE' | 'TRENDS' | 'EVALUATION' | 'TRAINING' | 'DATA_SOURCES';

export default function App() {
  // Auth state from API service / localStorage
  const [currentUser, setCurrentUser] = useState<User | null>(() => api.getSavedUser());
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('analyst@traffic.gov');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [loginRole, setLoginRole] = useState<Role>('ANALYST');
  
  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);

  // App navigation state
  const [activePage, setActivePage] = useState<Page>('DASHBOARD');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      addToast('error', 'Authentication Failed', 'Please provide both email and password.');
      return;
    }
    setLoadingAuth(true);
    try {
      const res = await api.login(loginEmail, loginPassword);
      setCurrentUser(res.user);
      addToast('success', 'Signed In Successfully', `Welcome back, ${res.user.name}!`);
    } catch (err: any) {
      try {
        const name = loginEmail.split('@')[0].replace('.', ' ');
        const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
        const res = await api.signup(formattedName, loginEmail, loginPassword, loginRole);
        setCurrentUser(res.user);
        addToast('success', 'Account Created & Signed In', `Welcome, ${res.user.name}!`);
      } catch (signupErr: any) {
        addToast('error', 'Login Failed', err.message || 'Invalid email or password.');
      }
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName || !signupEmail || !signupPassword) {
      addToast('error', 'Validation Error', 'All fields are required for account creation.');
      return;
    }
    setLoadingAuth(true);
    try {
      const res = await api.signup(signupName, signupEmail, signupPassword, 'USER');
      setCurrentUser(res.user);
      addToast('success', 'Account Created', 'Your user session has been initialized.');
    } catch (err: any) {
      addToast('error', 'Registration Failed', err.message || 'Could not create account.');
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleLogout = () => {
    api.clearAuth();
    setCurrentUser(null);
    addToast('info', 'Logged Out', 'You have been signed out of the system.');
  };

  // Render Auth screen if not logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
        
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white shadow-md mb-4">
            <Activity className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Traffic & Fuel Analytics
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Physics-Informed Traffic Congestion & Energy Intelligence Platform
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <Card className="px-6 py-8 sm:px-10 border-slate-200">
            {authMode === 'LOGIN' ? (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Sign-in as Role
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginRole('USER');
                        setLoginEmail('commuter@traffic.gov');
                      }}
                      className={`py-1.5 text-xs font-medium rounded-md transition-all ${
                        loginRole === 'USER'
                          ? 'bg-white text-slate-900 shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Commuter (User)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginRole('ANALYST');
                        setLoginEmail('analyst@traffic.gov');
                      }}
                      className={`py-1.5 text-xs font-medium rounded-md transition-all ${
                        loginRole === 'ANALYST'
                          ? 'bg-white text-slate-900 shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Traffic Analyst
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white"
                      placeholder="name@domain.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" variant="primary" className="w-full" disabled={loadingAuth}>
                  {loadingAuth ? 'Authenticating...' : 'Sign In'}
                </Button>

                <div className="text-center pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode('SIGNUP')}
                      className="font-medium text-slate-900 hover:underline cursor-pointer"
                    >
                      Register User Account
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white"
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white"
                      placeholder="Minimum 6 characters"
                      required
                    />
                  </div>
                </div>

                <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <p className="font-semibold text-slate-700 mb-0.5">Role Notice:</p>
                  Public registration grants Standard User access. Analyst elevation requires administrative security token verification.
                </div>

                <Button type="submit" variant="primary" className="w-full">
                  Create User Account
                </Button>

                <div className="text-center pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode('LOGIN')}
                      className="font-medium text-slate-900 hover:underline cursor-pointer"
                    >
                      Back to Sign In
                    </button>
                  </p>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    );
  }

  // Navigation Items according to role
  const navItems = [
    { id: 'DASHBOARD', label: 'Overview Dashboard', icon: Activity, roleRequired: 'USER' },
    { id: 'CONGESTION', label: 'Congestion Map', icon: MapPin, roleRequired: 'USER' },
    { id: 'FUEL', label: 'Fuel Estimate', icon: Fuel, roleRequired: 'USER' },
    { id: 'ROUTE_COMPARE', label: 'Route Comparison', icon: GitCompare, roleRequired: 'USER' },
    { id: 'TRENDS', label: 'Historical Trends', icon: TrendingUp, roleRequired: 'USER' },
    { id: 'EVALUATION', label: 'Model Evaluation', icon: BarChart3, roleRequired: 'ANALYST' },
    { id: 'TRAINING', label: 'Model Training', icon: Cpu, roleRequired: 'ANALYST' },
    { id: 'DATA_SOURCES', label: 'Data Sources', icon: Database, roleRequired: 'ANALYST' },
  ];

  const visibleNavItems = navItems.filter((item) => {
    if (item.roleRequired === 'ANALYST' && currentUser.role !== 'ANALYST') {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
        <div className="px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
                <Activity className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 leading-tight">
                  Traffic & Fuel Analytics
                </h1>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Physics-Informed Prediction System
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-medium text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Analytics Engine Operational
            </div>

            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-900">{currentUser.name}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  {currentUser.role}
                </div>
              </div>
              <Badge status={currentUser.role === 'ANALYST' ? 'Production' : 'Experimental'}>
                {currentUser.role}
              </Badge>
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation - Desktop */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 bg-white shrink-0">
          <div className="p-4 space-y-1 flex-1 overflow-y-auto">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Navigation Menu
            </div>
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id as Page)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-slate-400" />}
                </button>
              );
            })}
          </div>

          <div className="p-4 border-t border-slate-200 bg-slate-50/50">
            <div className="text-xs font-semibold text-slate-700 mb-1">System Specs</div>
            <div className="text-[11px] text-slate-500 space-y-1">
              <div>Model: XGBoost / Physics-Informed</div>
              <div>Architecture: React 19 + TypeScript</div>
              <div>Registry: Active v1.0.0</div>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            ></div>
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white border-r border-slate-200">
              <div className="p-4 flex items-center justify-between border-b border-slate-200">
                <span className="text-sm font-bold text-slate-900">System Navigation</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-1 flex-1 overflow-y-auto">
                {visibleNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActivePage(item.id as Page);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {activePage === 'DASHBOARD' && <DashboardView onNavigate={(p) => setActivePage(p)} />}
            {activePage === 'CONGESTION' && <CongestionMapView addToast={addToast} />}
            {activePage === 'FUEL' && <FuelEstimationView addToast={addToast} />}
            {activePage === 'ROUTE_COMPARE' && <RouteComparisonView addToast={addToast} />}
            {activePage === 'TRENDS' && <HistoricalTrendsView />}
            {activePage === 'EVALUATION' && <ModelEvaluationView addToast={addToast} />}
            {activePage === 'TRAINING' && <ModelTrainingView addToast={addToast} />}
            {activePage === 'DATA_SOURCES' && <DataSourcesView />}
          </div>
        </main>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Page View Components
// ----------------------------------------------------------------------

function DashboardView({ onNavigate }: { onNavigate: (p: Page) => void }) {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Traffic Congestion & Fuel Intelligence</h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time METR-LA sensor analytics coupled with physics-informed vehicle fuel estimation models.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onNavigate('CONGESTION')} icon={<MapPin className="w-4 h-4" />}>
            Map View
          </Button>
          <Button variant="primary" size="sm" onClick={() => onNavigate('FUEL')} icon={<Fuel className="w-4 h-4" />}>
            Estimate Fuel
          </Button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Monitored Segments"
          value="207"
          subtitle="METR-LA Sensor Network"
          icon={MapPin}
        />
        <MetricCard
          label="Current Congestion"
          value="Medium"
          subtitle="42 segments delayed (>15m)"
          icon={Activity}
        />
        <MetricCard
          label="Average Network Speed"
          value="48.5 km/h"
          subtitle="+3.2 km/h vs. peak window"
          icon={TrendingUp}
        />
        <MetricCard
          label="Model Version"
          value="v1.0.0"
          subtitle="XGBoost + VT-CPFM Physics Engine"
          icon={Cpu}
        />
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Summary Preview */}
        <Card className="lg:col-span-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Segment Network Overview</h3>
                <p className="text-xs text-slate-500">Live operational status across major highway nodes</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('CONGESTION')}>
                Full Map →
              </Button>
            </div>
            
            <div className="bg-slate-900 text-white rounded-lg p-6 flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden border border-slate-800">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <MapPin className="w-10 h-10 text-blue-400 mb-3 animate-bounce" />
              <div className="text-center relative z-10">
                <div className="text-sm font-semibold">Active Sensor Simulation Ready</div>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Click below or open the Congestion Map to query predictions for specific road segment IDs.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 text-center">
            <div>
              <div className="text-xs text-slate-500 font-medium">Low Traffic</div>
              <div className="text-sm font-bold text-emerald-600 mt-0.5">138 Segments</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Moderate Traffic</div>
              <div className="text-sm font-bold text-amber-600 mt-0.5">54 Segments</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">High Delay</div>
              <div className="text-sm font-bold text-rose-600 mt-0.5">15 Segments</div>
            </div>
          </div>
        </Card>

        {/* System Capabilities Side Card */}
        <Card className="lg:col-span-4 space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            System Features
          </h3>
          
          <div className="space-y-3">
            <div className="flex gap-3 text-xs">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">Congestion Classifier</div>
                <p className="text-slate-500 mt-0.5">Categorizes segments into Low, Medium, and High states.</p>
              </div>
            </div>

            <div className="flex gap-3 text-xs">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Fuel className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">Physics Fuel Estimator</div>
                <p className="text-slate-500 mt-0.5">Calculates fuel liters & cost based on VT-CPFM parameters.</p>
              </div>
            </div>

            <div className="flex gap-3 text-xs">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                <GitCompare className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">Route Evaluator</div>
                <p className="text-slate-500 mt-0.5">Compares multiple routes with 5% equivalence thresholding.</p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <Button variant="outline" className="w-full" size="sm" onClick={() => onNavigate('ROUTE_COMPARE')}>
              Compare Routes Now
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function CongestionMapView({ addToast }: { addToast: any }) {
  const [segmentId, setSegmentId] = useState('SEG-101');
  const [targetTime, setTargetTime] = useState('Now');
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const sampleSegments = ['SEG-101', 'SEG-102', 'SEG-103', 'SEG-104', 'SEG-201'];

  const predictCongestion = async (idToPredict?: string) => {
    const targetSeg = idToPredict || segmentId;
    if (!targetSeg) {
      addToast('error', 'Input Error', 'Please specify a segment ID');
      return;
    }

    setLoading(true);
    try {
      const data = await api.predictCongestion(targetSeg, targetTime);
      setPrediction(data);
      addToast('success', 'Prediction Generated', `Received forecast for ${targetSeg}`);
    } catch (e: any) {
      console.error(e);
      addToast('error', 'Prediction Failed', e.message || 'Could not fetch prediction.');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Congestion Map & Prediction</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Query traffic speed and congestion levels for specific highway segments.
          </p>
        </div>

        {/* Target Time Control */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
          {['Now', '+15m', '+30m', '+60m'].map((time) => (
            <button
              key={time}
              onClick={() => setTargetTime(time)}
              className={`px-3 py-1.5 font-medium rounded-md transition-all cursor-pointer ${
                targetTime === time
                  ? 'bg-slate-900 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {time}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Controls */}
        <Card className="lg:col-span-4 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
            Segment Query Options
          </h3>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Segment ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={segmentId}
                onChange={(e) => setSegmentId(e.target.value)}
                placeholder="e.g. SEG-101"
                className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1.5">
              Quick Select Segment:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {sampleSegments.map((seg) => (
                <button
                  key={seg}
                  onClick={() => {
                    setSegmentId(seg);
                    predictCongestion(seg);
                  }}
                  className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors cursor-pointer ${
                    segmentId === seg
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {seg}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={() => predictCongestion()}
            loading={loading}
            disabled={!segmentId}
            className="w-full"
            icon={<Zap className="w-4 h-4" />}
          >
            Generate Forecast
          </Button>
        </Card>

        {/* Right Map Visual + Result Panel */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-0 overflow-hidden border-slate-200">
            <div className="bg-slate-900 p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Layers className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold">Simulated Spatial Network Map</span>
              </div>
              <span className="text-xs text-slate-400">Target Time: {targetTime}</span>
            </div>

            <div className="p-6 bg-slate-950 min-h-[220px] flex flex-col items-center justify-center relative">
              {/* Visual simulated road segment overlay */}
              <div className="w-full max-w-lg space-y-4">
                <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-2">
                  <span>METR-LA Highway Node #4001</span>
                  <span>Segment: {segmentId || 'None'}</span>
                </div>

                <div className="h-10 bg-slate-800 rounded-lg flex items-center justify-around px-4 border border-slate-700 relative overflow-hidden">
                  <div className={`absolute inset-y-0 left-0 w-1/3 opacity-30 transition-all duration-300 ${
                    prediction?.congestion_level === 'HIGH' ? 'bg-rose-500' :
                    prediction?.congestion_level === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}></div>
                  <span className="text-xs font-mono text-slate-300 relative z-10">LANES: 4</span>
                  <span className="text-xs font-mono text-slate-300 relative z-10">FLOW: 1200 veh/h</span>
                  <span className="text-xs font-mono text-slate-300 relative z-10">LIMIT: 65 km/h</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Results section */}
          <Card>
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
              Prediction Details
            </h3>

            {!prediction ? (
              <EmptyState
                title="No Prediction Generated"
                description="Select a segment ID and click Generate Forecast to execute model inference."
              />
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 gap-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Congestion Status
                    </span>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge status={prediction.congestion_level} />
                      <span className="text-xl font-bold text-slate-900">
                        {prediction.congestion_level} CONGESTION
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Forecast Freshness
                    </span>
                    <div className="text-sm font-semibold text-slate-700 mt-1">
                      {prediction.freshness || 'Real-time'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="text-xs text-slate-500 font-medium">Predicted Speed</div>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">
                      {prediction.predicted_speed?.toFixed(1)} km/h
                    </div>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="text-xs text-slate-500 font-medium">Target Horizon</div>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">
                      {prediction.target_time}
                    </div>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="text-xs text-slate-500 font-medium">Model Engine</div>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">
                      {prediction.model_version}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function FuelEstimationView({ addToast }: { addToast: any }) {
  const [route, setRoute] = useState('SEG-101, SEG-102');
  const [distance, setDistance] = useState('5.0');
  const [vehicle, setVehicle] = useState('medium sedan');
  const [efficiency, setEfficiency] = useState('8.5');
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const estimateFuel = async () => {
    if (!route || !distance) {
      addToast('error', 'Input Error', 'Please enter route segments and distance.');
      return;
    }

    setLoading(true);
    try {
      const routeArray = route.split(',').map((s) => s.trim()).filter(Boolean);
      const data = await api.predictFuel(routeArray, vehicle, parseFloat(efficiency));
      setPrediction(data);
      addToast('success', 'Fuel Calculated', 'Physics-informed fuel prediction completed.');
    } catch (e: any) {
      console.error(e);
      addToast('error', 'Estimation Failed', e.message || 'Unable to calculate fuel consumption.');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900">Fuel Estimation Engine</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Physics-Informed Vehicle Energy Model (VT-CPFM) fuel calculation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Controls */}
        <Card className="lg:col-span-5 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
            Trip Specifications
          </h3>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Route Segment IDs (comma separated)
            </label>
            <input
              type="text"
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Total Distance (km)
            </label>
            <input
              type="number"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Vehicle Profile
            </label>
            <select
              value={vehicle}
              onChange={(e) => {
                const v = e.target.value;
                setVehicle(v);
                if (v === 'medium sedan') setEfficiency('8.5');
                else if (v === 'suv') setEfficiency('11.0');
                else if (v === 'truck') setEfficiency('18.5');
              }}
              className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="medium sedan">Medium Sedan (Default)</option>
              <option value="suv">SUV</option>
              <option value="truck">Heavy Truck</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Base Efficiency (L/100km)
            </label>
            <input
              type="number"
              step="0.1"
              value={efficiency}
              onChange={(e) => setEfficiency(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <Button onClick={estimateFuel} loading={loading} className="w-full" icon={<Fuel className="w-4 h-4" />}>
            Calculate Fuel Consumption
          </Button>
        </Card>

        {/* Result Area */}
        <Card className="lg:col-span-7 space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Consumption Output
          </h3>

          {!prediction ? (
            <EmptyState
              title="No Fuel Estimate Available"
              description="Configure trip parameters and click Calculate to compute fuel requirements."
            />
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900 text-white rounded-xl">
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    Predicted Fuel Volume
                  </div>
                  <div className="text-3xl font-bold text-emerald-400 mt-1">
                    {prediction.predicted_fuel_l?.toFixed(2)} L
                  </div>
                </div>

                <div className="p-4 bg-slate-100 text-slate-900 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    Estimated Cost ($)
                  </div>
                  <div className="text-3xl font-bold text-slate-900 mt-1">
                    ${prediction.estimated_cost?.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Explanatory physics note */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                <span className="font-semibold">Methodology Note:</span> Fuel estimate uses the configured physics-informed estimation method (VT-CPFM) parameterized by speed and vehicle baseline.
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Segment-by-Segment Breakdown
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5 font-semibold">Segment</th>
                        <th className="p-2.5 font-semibold">State</th>
                        <th className="p-2.5 font-semibold">Speed</th>
                        <th className="p-2.5 font-semibold">Fuel (L)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {prediction.segment_breakdown?.map((seg: any) => (
                        <tr key={seg.segment_id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-medium text-slate-900">{seg.segment_id}</td>
                          <td className="p-2.5">
                            <Badge status={seg.congestion_level} />
                          </td>
                          <td className="p-2.5 text-slate-700">{seg.predicted_speed?.toFixed(1)} km/h</td>
                          <td className="p-2.5 font-semibold text-slate-900">{seg.fuel_l?.toFixed(3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function RouteComparisonView({ addToast }: { addToast: any }) {
  const [routeA, setRouteA] = useState('SEG-101, SEG-102');
  const [routeB, setRouteB] = useState('SEG-103, SEG-104');
  const [vehicle, setVehicle] = useState('medium sedan');
  const [efficiency, setEfficiency] = useState('8.5');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const compareRoutes = async () => {
    if (!routeA || !routeB) {
      addToast('error', 'Input Error', 'Specify segments for both Route A and Route B.');
      return;
    }

    setLoading(true);
    try {
      const routeAArray = routeA.split(',').map((s) => s.trim()).filter(Boolean);
      const routeBArray = routeB.split(',').map((s) => s.trim()).filter(Boolean);
      const data = await api.compareRoutes(routeAArray, routeBArray, vehicle, parseFloat(efficiency));
      setResult(data);
      addToast('success', 'Comparison Completed', 'Evaluated both route choices.');
    } catch (e: any) {
      console.error(e);
      addToast('error', 'Comparison Failed', e.message || 'Unable to compare selected routes.');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900">Route Comparison & Optimization</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Side-by-side fuel and travel cost evaluation applying the 5% threshold equivalence rule.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-4 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
            Comparison Setup
          </h3>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Route A Segments
            </label>
            <input
              type="text"
              value={routeA}
              onChange={(e) => setRouteA(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Route B Segments
            </label>
            <input
              type="text"
              value={routeB}
              onChange={(e) => setRouteB(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Vehicle Profile
            </label>
            <select
              value={vehicle}
              onChange={(e) => {
                const v = e.target.value;
                setVehicle(v);
                if (v === 'medium sedan') setEfficiency('8.5');
                else if (v === 'suv') setEfficiency('11.0');
                else if (v === 'truck') setEfficiency('18.5');
              }}
              className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="medium sedan">Medium Sedan</option>
              <option value="suv">SUV</option>
              <option value="truck">Truck</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Base Efficiency (L/100km)
            </label>
            <input
              type="number"
              step="0.1"
              value={efficiency}
              onChange={(e) => setEfficiency(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <Button onClick={compareRoutes} loading={loading} className="w-full" icon={<GitCompare className="w-4 h-4" />}>
            Compare Routes
          </Button>
        </Card>

        <Card className="lg:col-span-8 space-y-6">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Evaluation Matrix
          </h3>

          {!result ? (
            <EmptyState
              title="No Route Comparison Generated"
              description="Define two candidate routes to evaluate fuel consumption differences."
            />
          ) : (
            <div className="space-y-6">
              {/* Recommendation Banner */}
              <div className={`p-4 rounded-xl border ${
                result.recommendation === 'EFFECTIVELY EQUIVALENT'
                  ? 'bg-slate-50 border-slate-300 text-slate-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Optimal Recommendation
                </div>
                <div className="text-xl font-bold mt-1">
                  {result.recommendation}
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {result.recommendation === 'EFFECTIVELY EQUIVALENT'
                    ? 'Fuel savings between routes are within the 5% margin. Select based on preference.'
                    : `Recommended path yields optimal energy consumption.`}
                </p>
              </div>

              {/* Side by side stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-sm text-slate-900">Route A</span>
                    <Badge>Primary</Badge>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="text-slate-500">Segments: <span className="text-slate-900 font-medium">{result.route_a?.route_segments?.join(', ')}</span></div>
                    <div className="text-slate-500">Fuel: <span className="text-slate-900 font-bold text-sm">{result.route_a?.predicted_fuel_l?.toFixed(2)} L</span></div>
                    <div className="text-slate-500">Cost: <span className="text-slate-900 font-medium">${result.route_a?.estimated_cost?.toFixed(2)}</span></div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-sm text-slate-900">Route B</span>
                    <Badge>Alternative</Badge>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="text-slate-500">Segments: <span className="text-slate-900 font-medium">{result.route_b?.route_segments?.join(', ')}</span></div>
                    <div className="text-slate-500">Fuel: <span className="text-slate-900 font-bold text-sm">{result.route_b?.predicted_fuel_l?.toFixed(2)} L</span></div>
                    <div className="text-slate-500">Cost: <span className="text-slate-900 font-medium">${result.route_b?.estimated_cost?.toFixed(2)}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function HistoricalTrendsView() {
  const [selectedSeg, setSelectedSeg] = useState('SEG-101');
  const [trendData, setTrendData] = useState<any[]>([]);

  React.useEffect(() => {
    api.getHistoricalTrends(selectedSeg).then((res) => {
      setTrendData(res.data);
    });
  }, [selectedSeg]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900">Historical Trends & Analytics</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Sensor telemetry over 7-day monitoring windows.
        </p>
      </div>

      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <h3 className="text-base font-bold text-slate-900">Network Speed Trend</h3>
          <div className="flex items-center gap-2">
            <select
              value={selectedSeg}
              onChange={(e) => setSelectedSeg(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white cursor-pointer"
            >
              <option value="SEG-101">SEG-101 (METR-LA #4001)</option>
              <option value="SEG-102">SEG-102 (METR-LA #4002)</option>
            </select>
          </div>
        </div>

        {/* Visual Simulated Line/Bar Chart */}
        <div className="bg-slate-900 rounded-xl p-6 text-white space-y-4">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Average Speed (km/h) - Last 7 Days</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span> Avg Speed</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-400 rounded-full"></span> Speed Limit (65)</span>
            </div>
          </div>

          <div className="h-44 flex items-end justify-between gap-2 pt-8 px-2 border-b border-slate-800">
            {trendData.map((item, idx) => {
              const speed = item.avgSpeed || 40;
              const heightPct = Math.min(100, Math.round((speed / 70) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[10px] text-slate-400 font-mono">{speed}</span>
                  <div
                    className="w-full bg-blue-500/80 rounded-t hover:bg-blue-400 transition-all"
                    style={{ height: `${heightPct}%` }}
                    title={`Speed: ${speed} km/h | Volume: ${item.volume}`}
                  ></div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1">
            {trendData.map((item, idx) => (
              <span key={idx}>{item.date.slice(5)}</span>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

function ModelEvaluationView({ addToast }: { addToast: any }) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchMetrics = async (type: string) => {
    setLoading(true);
    try {
      const data = await api.getModelMetrics(type);
      setMetrics({ type, data });
      addToast('info', 'Metrics Loaded', `Retrieved ${type} model validation metrics.`);
    } catch (e: any) {
      console.error(e);
      addToast('error', 'Metrics Error', e.message || 'Unable to retrieve model validation metrics.');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900">Model Evaluation Console</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Validation metrics and performance evaluation for model registry audit.
        </p>
      </div>

      <Card className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => fetchMetrics('congestion')}>
            Congestion Classifier Metrics
          </Button>
          <Button variant="outline" size="sm" onClick={() => fetchMetrics('fuel')}>
            Fuel Estimator Metrics
          </Button>
        </div>

        {loading ? (
          <SkeletonLoader rows={3} />
        ) : !metrics ? (
          <EmptyState
            title="Select Model for Metrics"
            description="Choose Congestion Classifier or Fuel Estimator to inspect validation scores."
          />
        ) : (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              {metrics.type.toUpperCase()} Model Registry Performance
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Object.entries(metrics.data).map(([key, val]: [string, any]) => (
                <div key={key} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{key}</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">
                    {typeof val === 'number' ? val.toFixed(4) : String(val)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function ModelTrainingView({ addToast }: { addToast: any }) {
  const [modelType, setModelType] = useState('both');
  const [window, setWindow] = useState('last_30_days');
  const [token, setToken] = useState('SECRET_ANALYST_TOKEN');
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const triggerTraining = async () => {
    setLoading(true);
    try {
      const data = await api.retrainModel(modelType, window);
      setStatus(data);
      addToast('success', 'Retraining Triggered', 'Model retraining execution pipeline initiated.');
    } catch (e: any) {
      console.error(e);
      setStatus({ error: e.message || 'Authentication Failed' });
      addToast('error', 'Error', e.message || 'Could not reach training service endpoint.');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900">Model Retraining Operations</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Trigger offline model training pipelines with API authentication.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-5 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
            Pipeline Parameters
          </h3>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Analyst API Key
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Target Model
            </label>
            <select
              value={modelType}
              onChange={(e) => setModelType(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="both">Both Models</option>
              <option value="congestion">Congestion Classifier</option>
              <option value="fuel">Fuel Estimator</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Dataset Window
            </label>
            <select
              value={window}
              onChange={(e) => setWindow(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="last_30_days">Last 30 Days</option>
              <option value="last_90_days">Last 90 Days</option>
              <option value="all_time">All Time Historical</option>
            </select>
          </div>

          <Button onClick={triggerTraining} loading={loading} className="w-full" icon={<Cpu className="w-4 h-4" />}>
            Execute Pipeline
          </Button>
        </Card>

        <Card className="lg:col-span-7 space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Execution Log
          </h3>

          {!status ? (
            <EmptyState
              title="Pipeline Idle"
              description="Configure authentication token and parameters to execute model training."
            />
          ) : status.error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <div className="font-bold">Retraining Failed</div>
                <div className="text-xs text-rose-700 mt-0.5">{status.error}</div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-sm space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{status.status}</span>
              </div>
              <div className="text-xs text-emerald-800 border-t border-emerald-200 pt-2 space-y-1">
                <div>Model Type: <span className="font-semibold">{status.model_type}</span></div>
                <div>Training Window: <span className="font-semibold">{status.training_window}</span></div>
                <div>Congestion Accuracy: <span className="font-semibold">{status.congestion_metrics?.accuracy}</span></div>
                <div>Fuel R²: <span className="font-semibold">{status.fuel_metrics?.r2_score}</span></div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function DataSourcesView() {
  const sources = [
    { name: 'METR-LA Traffic Sensor Array', type: 'Traffic Speed/Volume', status: 'Operational', lastFetch: '2026-08-13 14:00', cached: 'Yes' },
    { name: 'OpenWeatherMap API', type: 'Meteorological Data', status: 'Operational', lastFetch: '2026-08-13 13:45', cached: 'Yes' },
    { name: 'OpenStreetMap Road Network', type: 'Geospatial Topography', status: 'Operational', lastFetch: '2026-08-10 00:00', cached: 'Yes' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900">Data Sources Management</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Monitor status of external traffic sensors and meteorological API integration.
        </p>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="p-3 font-semibold">Source Name</th>
              <th className="p-3 font-semibold">Data Category</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold">Last Synchronization</th>
              <th className="p-3 font-semibold">Cache Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sources.map((src, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="p-3 font-semibold text-slate-900">{src.name}</td>
                <td className="p-3 text-slate-600">{src.type}</td>
                <td className="p-3">
                  <Badge status={src.status} />
                </td>
                <td className="p-3 text-slate-600">{src.lastFetch}</td>
                <td className="p-3 text-slate-600">{src.cached}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
