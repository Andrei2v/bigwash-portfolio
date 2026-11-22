import { LOCAL_MODE } from '$lib/api/client.js';

// Fixtures are available only behind the explicit local development API gate.
export const DEMO_MODE = LOCAL_MODE && import.meta.env.VITE_DEMO_MODE === 'true';
