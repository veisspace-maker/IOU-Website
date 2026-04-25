import { useState, useEffect } from 'react';
import { Button, Snackbar, Alert } from '@mui/material';

export default function PWAUpdatePrompt() {
  const [offlineReady, setOfflineReady] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        setOfflineReady(true);
      });

      // Check for updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setNeedRefresh(true);
      });
    }
  }, []);

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  const handleUpdate = () => {
    if (registration) {
      registration.update().then(() => {
        window.location.reload();
      });
    }
  };

  return (
    <>
      <Snackbar
        open={offlineReady}
        autoHideDuration={6000}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={close} severity="success" sx={{ width: '100%' }}>
          App ready to work offline
        </Alert>
      </Snackbar>

      <Snackbar
        open={needRefresh}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="info"
          action={
            <Button color="inherit" size="small" onClick={handleUpdate}>
              Reload
            </Button>
          }
        >
          New content available, click reload to update
        </Alert>
      </Snackbar>
    </>
  );
}
