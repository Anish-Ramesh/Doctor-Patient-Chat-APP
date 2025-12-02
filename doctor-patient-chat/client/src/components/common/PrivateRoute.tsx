import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles: ('doctor' | 'patient')[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  if (!user) {
    // Redirect to login page if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has the required role
  if (!allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on user role
    const redirectTo = user.role === 'doctor' ? '/doctor' : '/patient';
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
