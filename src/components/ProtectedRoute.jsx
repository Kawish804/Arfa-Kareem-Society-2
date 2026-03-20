import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Verifying Access...</div>;

  // 1. If not logged in at all, kick them to the login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. If logged in, but their role isn't in the "allowedRoles" list, redirect them safely
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'CR') return <Navigate to="/cr-dashboard" replace />;
    return <Navigate to="/" replace />; // Fallback to the Student Portal (Home)
  }

  // 3. If they pass the checks, let them render the page!
  return <Outlet />;
};

export default ProtectedRoute;