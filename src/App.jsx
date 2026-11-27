import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { PortalProvider } from './context/PortalContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTopButton from './components/ScrollToTopButton';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import DynamicPage from './pages/DynamicPage';
import CategoryPage from './pages/CategoryPage';
import ContentDetailPage from './pages/ContentDetailPage';

function RedirectToAuthSignIn() {
  useEffect(() => {
    window.location.replace('/signin');
  }, []);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-slate-600">
      <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-3"></div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Opening Sign In page...
      </p>
    </div>
  );
}

function RedirectToAuthJoin() {
  useEffect(() => {
    window.location.replace('/join');
  }, []);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-slate-600">
      <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-3"></div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Opening Join page...
      </p>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    // Clear any previous Google Translate cookies so translation is deactivated
    try {
      document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
      document.cookie = `googtrans=; path=/; domain=.${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
      const script = document.getElementById('google-translate-script');
      if (script) script.remove();
    } catch {
      // ignore
    }
  }, []);

  return (
    <LanguageProvider>
      <AuthProvider>
        <PortalProvider>
          <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-white font-sans text-slate-900 antialiased selection:bg-[#C59B27] selection:text-[#0F294A]">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Authentication Routes */}
                <Route path="/signin" element={<RedirectToAuthSignIn />} />
                <Route path="/signin.html" element={<RedirectToAuthSignIn />} />
                <Route path="/login" element={<RedirectToAuthSignIn />} />
                <Route path="/login.html" element={<RedirectToAuthSignIn />} />
                <Route path="/auth" element={<RedirectToAuthSignIn />} />
                <Route path="/auth.html" element={<RedirectToAuthSignIn />} />
                <Route path="/join" element={<RedirectToAuthJoin />} />
                <Route path="/join.html" element={<RedirectToAuthJoin />} />

                {/* Gated Behind Login - Only Authenticated & Approved Users Can Access */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/home"
                  element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/Home"
                  element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/category/:categorySlug"
                  element={
                    <ProtectedRoute>
                      <CategoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/Home/:categorySlug"
                  element={
                    <ProtectedRoute>
                      <CategoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/home/:categorySlug"
                  element={
                    <ProtectedRoute>
                      <CategoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/page/:categorySlug/:pageSlug"
                  element={
                    <ProtectedRoute>
                      <DynamicPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/Home/:categorySlug/:pageSlug"
                  element={
                    <ProtectedRoute>
                      <DynamicPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/home/:categorySlug/:pageSlug"
                  element={
                    <ProtectedRoute>
                      <DynamicPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/program/stars"
                  element={<Navigate to="/page/program/stars" replace />}
                />
                <Route
                  path="/content/:contentId"
                  element={
                    <ProtectedRoute>
                      <ContentDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/Home/:categorySlug/:pageSlug/:contentId"
                  element={
                    <ProtectedRoute>
                      <ContentDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/home/:categorySlug/:pageSlug/:contentId"
                  element={
                    <ProtectedRoute>
                      <ContentDetailPage />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Member Route */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Admin Route */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminPanel />
                    </ProtectedRoute>
                  }
                />
                <Route path="/admin.html" element={<Navigate to="/admin" replace />} />

                {/* Fallback Catch-All */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <ScrollToTopButton />
            <Footer />
          </div>
        </BrowserRouter>
        </PortalProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
