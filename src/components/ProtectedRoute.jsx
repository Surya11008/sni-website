import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Loader2, ArrowLeft } from 'lucide-react';

export default function ProtectedRoute({ children, requiredRole }) {
  const { currentUser, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-slate-600">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-medium text-slate-500">Verifying authentication status...</p>
      </div>
    );
  }

  // Not logged in -> redirect to /login preserving intended destination
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role validation
  if (requiredRole && userProfile?.role !== requiredRole) {
    return (
      <div className="max-w-2xl mx-auto my-16 px-6">
        <div className="bg-white border border-rose-200 rounded-2xl shadow-xl shadow-rose-50/50 p-8 text-center">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Restricted</h2>
          <p className="text-slate-600 mb-6 text-base">
            This section requires <span className="font-semibold text-rose-600 uppercase tracking-wide text-xs px-2 py-0.5 bg-rose-50 border border-rose-200 rounded">{requiredRole}</span> privileges.
            Your current assigned role is <span className="font-semibold text-slate-800 uppercase tracking-wide text-xs px-2 py-0.5 bg-slate-100 border border-slate-200 rounded">{userProfile?.role || 'member'}</span>.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition shadow-sm w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Dashboard
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition w-full sm:w-auto"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
