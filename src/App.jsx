import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTopButton from './components/ScrollToTopButton';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import DynamicPage from './pages/DynamicPage';
import CategoryPage from './pages/CategoryPage';
import ContentDetailPage from './pages/ContentDetailPage';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-white font-sans text-slate-900 antialiased selection:bg-[#C59B27] selection:text-[#0F294A]">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Login Route (Public Entry) */}
                <Route path="/login" element={<Login />} />

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
                  path="/category/:categorySlug"
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

                {/* Fallback Catch-All */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <ScrollToTopButton />
            <Footer />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
