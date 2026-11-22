import { LOCAL_MODE } from '$lib/api/client.js';
import { createDevConfig, initialPromo, validPromo, promoApplies } from '$lib/dev-config.js';

const store = createDevConfig('bigwash.local.v1.promo', initialPromo, validPromo);
let config = $state(structuredClone(initialPromo));
let ready = $state(false);
let error = $state('');

export const promo = {
  get config() { return config; },
  get ready() { return ready; },
  get error() { return error; },
  clearError() { error = ''; },
  load() {
    ready = false;
    error = '';
    if (!LOCAL_MODE) return;
    try { config = store.load(); ready = true; }
    catch (failure) { error = failure.message; }
  },
  save(draft) {
    if (!LOCAL_MODE || !ready) return false;
    error = '';
    if (!validPromo(draft)) { error = 'promoInvalid'; return false; }
    try {
      store.save(draft);
      config = structuredClone($state.snapshot(draft));
      return true;
    } catch (failure) { error = failure.message; return false; }
  },
  applies(pultId) { return LOCAL_MODE && ready && promoApplies(config, pultId); }
};
