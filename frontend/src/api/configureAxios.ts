import axios from 'axios';

axios.defaults.withCredentials = true;

function applyBaseURL(): void {
  if (typeof window === 'undefined') return;
  // Use relative URLs by default so /api is served by the same host (e.g. nginx → backend).
  // Only set VITE_API_URL at build time when the API lives on a different origin.
  axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';
}

applyBaseURL();
