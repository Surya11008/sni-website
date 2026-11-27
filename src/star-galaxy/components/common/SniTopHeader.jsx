import React, { useState } from 'react';
import { Download } from 'lucide-react';
import InstallAppModal from './InstallAppModal';

export default function SniTopHeader() {
  const [showInstallModal, setShowInstallModal] = useState(false);

  // If embedded on SNI portal page, hide duplicate SNI navbar
  if (typeof window !== 'undefined' && window.location.pathname.includes('/page/program/stars')) {
    return null;
  }

  const handleInstallClick = async () => {
    if (window.deferredPWAInstallPrompt) {
      try {
        window.deferredPWAInstallPrompt.prompt();
        const choice = await window.deferredPWAInstallPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          window.deferredPWAInstallPrompt = null;
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    setShowInstallModal(true);
  };

  return (
    <>
      <header className="site-header" id="sni-site-header">
        <a className="site-logo" href="https://sni.org.in" title="SNI - S Natural Intelligence">
          <img
            src="/Images/sni-logo.png"
            alt="SNI Logo"
            style={{ width: '44px', height: '44px', objectFit: 'contain' }}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/sni-logo.png';
            }}
          />
          <span>
            <strong>SNI</strong>
            <small>S NATURAL INTELLIGENCE</small>
          </span>
        </a>

        <nav className="site-nav" aria-label="Main navigation">
          <a href="https://sni.org.in/#home">Home</a>
          <a href="https://sni.org.in/#notices">Notices</a>
          <button
            type="button"
            onClick={handleInstallClick}
            className="site-install-button"
            aria-label="Install Star Galaxy App on Phone"
            title="Install Star Galaxy App on Phone"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install App</span>
          </button>
        </nav>
      </header>

      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </>
  );
}
