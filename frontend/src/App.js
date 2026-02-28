import { useEffect, useRef, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import SubscriptionGuard from "@/components/SubscriptionGuard";

// Pages
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import AuthCallback from "@/pages/AuthCallback";
import Dashboard from "@/pages/Dashboard";
import PostCreator from "@/pages/PostCreator";
import Templates from "@/pages/Templates";
import TemplateEditor from "@/pages/TemplateEditor";
import LandingPages from "@/pages/LandingPages";
import Leads from "@/pages/Leads";
import Campaigns from "@/pages/Campaigns";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import Subscription from "@/pages/Subscription";
import SubscriptionSuccess from "@/pages/SubscriptionSuccess";
import PublicLandingPage from "@/pages/PublicLandingPage";
import SocialAccounts from "@/pages/SocialAccounts";
import WorkspaceSettings from "@/pages/WorkspaceSettings";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Configure axios defaults for credentials
axios.defaults.withCredentials = true;

// Auth context
import { createContext, useContext } from "react";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    // CRITICAL: If returning from OAuth callback, skip the /me check.
    // AuthCallback will exchange the session_id and establish the session first.
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }
    
    try {
      const res = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(res.data);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = (userData) => setUser(userData);
  const logout = async () => {
    await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route with Subscription Check
const ProtectedRoute = ({ children, requireSubscription = true }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Wrap with subscription guard if required
  if (requireSubscription) {
    return <SubscriptionGuard>{children}</SubscriptionGuard>;
  }

  return children;
};

// App Router
function AppRouter() {
  const location = useLocation();
  
  // Check URL fragment for session_id - SYNCHRONOUS check before render
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/p/:slug" element={<PublicLandingPage />} />
      
      {/* Protected Routes - All require active subscription */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/posts" element={<ProtectedRoute><PostCreator /></ProtectedRoute>} />
      <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
      <Route path="/templates/editor" element={<ProtectedRoute><TemplateEditor /></ProtectedRoute>} />
      <Route path="/templates/editor/:templateId" element={<ProtectedRoute><TemplateEditor /></ProtectedRoute>} />
      <Route path="/landing-pages" element={<ProtectedRoute><LandingPages /></ProtectedRoute>} />
      <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
      <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/social-accounts" element={<ProtectedRoute><SocialAccounts /></ProtectedRoute>} />
      <Route path="/workspace" element={<ProtectedRoute><WorkspaceSettings /></ProtectedRoute>} />
      
      {/* Subscription page doesn't require subscription check (allow access to upgrade) */}
      <Route path="/subscription" element={<ProtectedRoute requireSubscription={false}><Subscription /></ProtectedRoute>} />
      <Route path="/subscription/success" element={<ProtectedRoute requireSubscription={false}><SubscriptionSuccess /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute requireSubscription={false}><Settings /></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
