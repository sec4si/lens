(() => {
  if (window.top !== window || navigator.globalPrivacyControl === true || navigator.doNotTrack === '1') return;

  const path = window.location.pathname;
  if (!path.startsWith('/') || path.length > 240) return;

  let referrer = '';
  if (document.referrer) {
    try {
      const source = new URL(document.referrer);
      if (/^[a-z0-9][a-z0-9.-]{0,252}$/.test(source.hostname)) referrer = source.hostname;
    } catch {
      // A page can be opened without a URL-form referrer.
    }
  }

  const submitVisit = () => {
    if (document.visibilityState === 'hidden') return;
    document.removeEventListener('visibilitychange', submitVisit);
    fetch('https://metric.sec4.si/api/visits', {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, referrer }),
      keepalive: true,
    }).catch(() => {});
  };

  document.addEventListener('visibilitychange', submitVisit);
  submitVisit();
})();
