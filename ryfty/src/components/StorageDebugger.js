"use client";

import { useAuth } from '@/contexts/AuthContext';
import { debugStorageStatus, getCookie, setCookie, testCookies } from '@/utils/authStorage';

export default function StorageDebugger() {
  const { user, isAuthenticated, loading } = useAuth();

  const handleDebugStorage = () => {
    debugStorageStatus();
  };

  const handleClearStorage = () => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    console.log('All storage cleared');
  };

  const handleTestCookie = () => {
    const testData = { test: 'cookie data', timestamp: Date.now() };
    setCookie('test-cookie', JSON.stringify(testData), 1);
    console.log('Test cookie set');
    
    setTimeout(() => {
      const retrieved = getCookie('test-cookie');
      console.log('Retrieved test cookie:', retrieved);
    }, 1000);
  };

  const handleTestLocalhost = () => {
    testCookies();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h3>Storage Debugger</h3>
      <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'Not authenticated'}</p>
      <p><strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
      <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
      
      <div style={{ marginTop: '10px' }}>
        <button onClick={handleDebugStorage} style={{ marginRight: '10px' }}>
          Debug Storage
        </button>
        <button onClick={handleTestCookie} style={{ marginRight: '10px' }}>
          Test Cookie
        </button>
        <button onClick={handleTestLocalhost} style={{ marginRight: '10px' }}>
          Test Cookies
        </button>
        <button onClick={handleClearStorage}>
          Clear All Storage
        </button>
      </div>
      
      <div style={{ marginTop: '10px', fontSize: '12px' }}>
        <p><strong>Current Cookies:</strong></p>
        <pre style={{ background: '#f5f5f5', padding: '5px', fontSize: '10px' }}>
          {typeof window !== 'undefined' ? document.cookie : 'Server side'}
        </pre>
      </div>
    </div>
  );
}
