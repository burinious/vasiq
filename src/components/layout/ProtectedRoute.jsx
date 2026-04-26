import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isModeratorUser } from '../../utils/admin';
import Loader from './Loader';

function ProtectedRoute({ children, requireVerified = false, requireAdmin = false }) {
  const { currentUser, loading, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader />;
  }

  if (!currentUser) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  if (requireAdmin && !isModeratorUser({ email: currentUser.email, profile })) {
    return <Navigate to="/feed" replace />;
  }

  return children;
}

export default ProtectedRoute;
