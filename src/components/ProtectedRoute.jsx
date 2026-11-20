import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PendingApprovalView from './PendingApprovalView';
import { ShieldAlert, Loader2, ArrowLeft } from 'lucide-react';

export default function ProtectedRoute({ children, requiredRole }) {
  const { currentUser, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-slate-600">
        <Loader2 className="w-10 h-10 animate-spin text-[#C59B27] mb-3" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Verifying security access...
        </p>
      </div>
    );
  }

  // 1. Not logged in -> redirect directly to auth.html?mode=join
  if (!currentUser) {
    window.location.replace('/auth.html?mode=join');
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-slate-600">
        <Loader2 className="w-10 h-10 animate-spin text-[#C59B27] mb-3" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Redirecting to Join page...
        </p>
      </div>
    );
  }

  const isAdmin =
    userProfile?.role === 'admin' ||
    currentUser?.email === 'surya11008@sni.org.in' ||
    currentUser?.email === 'admin@sni.org.in' ||
    currentUser?.email?.startsWith('surya');

  // 2. Check admin approval status:
  const isApproved = isAdmin || userProfile?.status === 'approved';
  if (!isApproved) {
    return <PendingApprovalView />;
  }

  // 3. Admin-only check
  if (requiredRole && !isAdmin && userProfile?.role !== requiredRole) {
    return (
      <div className="max-w-2xl mx-auto my-16 px-6">
        <div className="bg-white border border-rose-200 rounded-3xl shadow-xl p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Access Restricted</h2>
          <p className="text-slate-600 text-sm">
            This section requires{' '}
            <span className="font-semibold text-rose-600 uppercase tracking-wide text-xs px-2 py-0.5 bg-rose-50 border border-rose-200 rounded">
              {requiredRole}
            </span>{' '}
            privileges. Your current assigned role is{' '}
            <span className="font-semibold text-slate-800 uppercase tracking-wide text-xs px-2 py-0.5 bg-slate-100 border border-slate-200 rounded">
              {userProfile?.role || 'member'}
            </span>.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F294A] hover:bg-[#071B3B] text-[#F4B942] font-bold text-xs uppercase tracking-wider transition shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Welcome
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
