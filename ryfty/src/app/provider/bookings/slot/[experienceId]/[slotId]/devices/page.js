"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import TabNavigation from '@/components/provider/TabNavigation';
import ProviderHeader from '@/components/provider/ProviderHeader';
import { authorizeDevice, fetchAuthorizedDevices, deauthorizeDevice, fetchSlotDetails } from '@/utils/api';
import QRCode from 'qrcode';
import '@/styles/provider.css';
import '@/styles/bookings-redesign.css';

export default function DeviceManagementPage({ params }) {
  const { experienceId, slotId } = params;
  const { isAuthenticated, isProvider } = useAuth();
  const router = useRouter();

  const [slot, setSlot] = useState(null);
  const [devices, setDevices] = useState([]);
  const [deviceName, setDeviceName] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  
  // The newly generated token to display to the scanner
  const [deviceToken, setDeviceToken] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  
  // Generate QR Code when token changes
  useEffect(() => {
    if (deviceToken) {
      QRCode.toDataURL(deviceToken, { margin: 1, width: 180 }, (err, url) => {
        if (!err) setQrDataUrl(url);
      });
    } else {
       setQrDataUrl('');
    }
  }, [deviceToken]);
  useEffect(() => {
    const fetchData = async () => {
      if (!experienceId || !slotId) return;
      try {
        setLoading(true);
        // Load Slot Context
        const slotRes = await fetchSlotDetails(slotId);
        if (slotRes?.slot) setSlot(slotRes.slot);

        // Load Devices
        const devRes = await fetchAuthorizedDevices();
        if (devRes?.devices) {
           // We might need to filter if devices are global, but currently assuming the backend handles them properly.
           setDevices(devRes.devices);
        }
      } catch (err) {
        console.error("Failed to load devices", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [experienceId, slotId]);

  const handleAuthorize = async (e) => {
    e.preventDefault();
    if (!deviceName.trim()) return;
    
    setActionError(null);
    setAuthLoading(true);
    setDeviceToken(null);
    
    try {
      const res = await authorizeDevice(experienceId, slotId, deviceName);
      if (res?.token) {
        setDeviceToken(res.token);
        setDeviceName(''); // clear input
        // Refresh devices list
        const devRes = await fetchAuthorizedDevices();
        if (devRes?.devices) setDevices(devRes.devices);
      }
    } catch (err) {
      setActionError(err.message || 'Failed to authorize device');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRevoke = async (name) => {
    try {
      await deauthorizeDevice(name);
      // Refresh list locally
      setDevices(prev => prev.filter(d => d.device_name !== name));
      if (deviceToken && deviceName === name) setDeviceToken(null); // Clear token if we just revoked exactly what we added
    } catch(err) {
      alert("Failed to revoke: " + err.message);
    }
  };

  return (
    <div className="br-bookings-page">
      <ProviderHeader variant="main" />

      <div className="provider-layout-content">
        <TabNavigation className="provider-left-nav" orientation="vertical" />

        <main className="provider-main-content">
          <div className="content-wrapper">
             {/* Header */}
            <motion.div 
              className="br-header"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '1rem' }}
            >
               <button className="btn btn-secondary btn-sm" style={{ border: 'none', background: 'transparent', padding: '0', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--lr-gray-600)'}} onClick={() => router.push(`/provider/bookings/slot/${experienceId}/${slotId}`)}>
                  ← Back
               </button>
              <div>
                <h1 className="br-title">Check-in Scanners</h1>
                <p className="br-subtitle">
                  Authorize physical devices (phones/tablets) to scan tickets for this slot.
                </p>
              </div>
            </motion.div>

            {loading ? (
               <div className="provider-loading"><div className="spinner"></div></div>
            ) : (
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
                  
                  {/* Left Column: Authorize Device Form & Token Dispenser */}
                  <motion.div
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                  >
                     <div className="br-ledger-container" style={{ padding: '1.5rem' }}>
                        <h3 className="br-customer-name" style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Add New Scanner</h3>
                        
                        <form onSubmit={handleAuthorize} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                           <div>
                              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--lr-gray-700)'}}>Friendly Name (e.g. Front Gate iPad)</label>
                              <input 
                                 type="text" 
                                 maxLength="32"
                                 value={deviceName}
                                 onChange={(e) => setDeviceName(e.target.value)}
                                 placeholder="Device Name"
                                 style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--lr-border)', borderRadius: 'var(--lr-radius-md)', fontSize: '0.9375rem' }}
                                 required
                              />
                           </div>
                           
                           {actionError && <p style={{ color: 'var(--lr-red-600)', fontSize: '0.875rem', margin: '0' }}>{actionError}</p>}
                           
                           <button 
                              type="submit" 
                              className="btn btn-primary" 
                              disabled={authLoading || !deviceName.trim()}
                              style={{ width: '100%', height: '44px' }}
                           >
                              {authLoading ? 'Authorizing...' : 'Generate Access Token'}
                           </button>
                        </form>
                     </div>

                     {/* The Token / QR Display */}
                     <AnimatePresence>
                        {deviceToken && (
                           <motion.div
                              className="br-ledger-container"
                              style={{ padding: '2rem', textAlign: 'center', background: 'var(--lr-gray-900)', color: 'white', marginTop: '1rem' }}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                           >
                              <h3 style={{ margin: '0 0 1rem 0', color: 'white' }}>Device Authorized!</h3>
                              <p style={{ margin: '0 0 2rem 0', color: 'var(--lr-gray-400)', fontSize: '0.9375rem' }}>
                                 Scan this code with the scanner device or enter the token manually to begin verifying tickets.
                              </p>
                              
                              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', display: 'inline-block', marginBottom: '2rem' }}>
                                 {qrDataUrl && <img src={qrDataUrl} alt="Device Token QR Code" />}
                              </div>

                              <div>
                                 <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8125rem', color: 'var(--lr-gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Manual Entry Token</p>
                                 <code style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '1.125rem', letterSpacing: '2px' }}>
                                    {deviceToken}
                                 </code>
                              </div>
                           </motion.div>
                        )}
                     </AnimatePresence>
                  </motion.div>

                  {/* Right Column: Active Devices */}
                  <motion.div
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.1 }}
                  >
                     <div className="br-ledger-container" style={{ padding: '1.5rem' }}>
                        <h3 className="br-customer-name" style={{ marginBottom: '1.5rem', fontSize: '1.125rem' }}>Active Scanners</h3>
                        
                        {devices.length > 0 ? (
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              {devices.map((device, idx) => (
                                 <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--lr-border)', borderRadius: 'var(--lr-radius-md)' }}>
                                    <div>
                                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                             <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line>
                                          </svg>
                                          <span className="br-customer-name">{device.device_name}</span>
                                       </div>
                                       <span className="br-text-sub">Authorized for this account</span>
                                    </div>
                                    <button 
                                       className="btn btn-secondary btn-sm" 
                                       style={{ color: 'var(--lr-red-600)', borderColor: 'var(--lr-border)', padding: '0.4rem 0.8rem' }}
                                       onClick={() => {
                                          if (window.confirm(`Revoke access for ${device.device_name}?`)) {
                                             handleRevoke(device.device_name)
                                          }
                                       }}
                                    >
                                       Revoke
                                    </button>
                                 </div>
                              ))}
                           </div>
                        ) : (
                           <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'var(--lr-gray-50)', borderRadius: 'var(--lr-radius-md)' }}>
                              <p className="br-subtitle">No scanners currently authorized.</p>
                           </div>
                        )}
                     </div>
                  </motion.div>

               </div>
            )}
            
          </div>
        </main>
      </div>
    </div>
  );
}
