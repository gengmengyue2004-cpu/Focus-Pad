(() => {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;

  const register = () => navigator.serviceWorker.register('/sw.js?version=2', { scope: '/' }).catch(() => {});
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
})();
