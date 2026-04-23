import { useAuth } from '../../context/AuthContext';

function AppStatusBanner() {
  const { bootstrapError } = useAuth();

  if (!bootstrapError) {
    return null;
  }

  return (
    <div className="status-banner">
      <strong>Firebase setup issue:</strong> {bootstrapError}
    </div>
  );
}

export default AppStatusBanner;
