import axios from 'axios';

axios.defaults.withCredentials = true;

function applyBaseURL(): void {
  if (typeof window === 'undefined') return;
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    axios.defaults.baseURL = '';
    return;
  }
  axios.defaults.baseURL =
    import.meta.env.VITE_API_URL || `http://${host}:3001`;
}

applyBaseURL();
