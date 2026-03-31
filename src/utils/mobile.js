// Mobile detection and utilities
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth <= 768;
};

// Prevent body scroll when keyboard is open
export const preventBodyScroll = () => {
  if (isMobile()) {
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
  }
};

export const allowBodyScroll = () => {
  if (isMobile()) {
    document.body.style.position = '';
    document.body.style.width = '';
  }
};

// Handle viewport resize on mobile keyboard open/close
export const handleViewportResize = (callback) => {
  if (!isMobile()) return;
  
  let lastHeight = window.innerHeight;
  
  const resizeHandler = () => {
    const currentHeight = window.innerHeight;
    const diff = lastHeight - currentHeight;
    
    // Keyboard opened (viewport shrunk significantly)
    if (diff > 150) {
      callback('keyboard-open');
    }
    // Keyboard closed (viewport expanded)
    else if (diff < -150) {
      callback('keyboard-close');
    }
    
    lastHeight = currentHeight;
  };
  
  window.addEventListener('resize', resizeHandler);
  return () => window.removeEventListener('resize', resizeHandler);
};
