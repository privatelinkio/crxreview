import { Suspense, useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ViewerPage } from './pages/ViewerPage';
import { LandingPage } from './pages/LandingPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PasswordModal } from './components/viewer/PasswordModal';
import './App.css';

// Check if password protection is enabled (defaults to true)
const PASSWORD_PROTECTION_ENABLED = import.meta.env.VITE_PASSWORD_PROTECTED !== 'false';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    if (!PASSWORD_PROTECTION_ENABLED) {
      setIsAuthenticated(true);
      return;
    }

    const sessionAuth = sessionStorage.getItem('crxreview_auth');
    if (sessionAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handlePasswordCorrect = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('crxreview_auth', 'true');
  };

  // Show password modal if not authenticated and protection is enabled
  if (PASSWORD_PROTECTION_ENABLED && !isAuthenticated) {
    return <PasswordModal onCorrectPassword={handlePasswordCorrect} />;
  }

  return (
    <ErrorBoundary>
      <HashRouter>
        <Suspense fallback={<div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">Loading...</div>}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/app" element={<ViewerPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </ErrorBoundary>
  );
}

export default App;
