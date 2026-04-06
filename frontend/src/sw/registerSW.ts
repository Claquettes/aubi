export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  import('virtual:pwa-register')
    .then(({ registerSW }) => {
      registerSW({ immediate: true });
    })
    .catch(() => {
      /* dev sans PWA */
    });
}
