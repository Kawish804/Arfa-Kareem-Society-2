// INSIDE YOUR ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  // 🔴 CHECK IF ANY OF THE USER'S ROLES MATCH THE ALLOWED ROLES
  // Ensures it works whether user.role is a String (old users) or an Array (new users)
  const userRoles = Array.isArray(user.role) ? user.role : [user.role];
  
  const hasAccess = allowedRoles.some(allowedRole => userRoles.includes(allowedRole));

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />; // Or redirect to their default dashboard
  }

  return <Outlet />;
};

export default ProtectedRoute;