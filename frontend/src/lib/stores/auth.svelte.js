
import { browser } from '$app/environment';
import api, { LOCAL_MODE, isAllowedToken } from '$lib/api/client.js';

let user = $state(null);
let token = $state(null);
let loading = $state(true);
let initialization = null;
let revision = 0;

export const auth = {
    get user() {
        return user;
    },

    get token() {
        return token;
    },

    get loading() {
        return loading;
    },

    get isAuthenticated() {
        return Boolean(user && token);
    },

    login(newUser, newToken) {
        if (!newUser || typeof newUser !== 'object' || !isAllowedToken(newToken)) {
            this.logout();
            throw new Error('INVALID_AUTH_RESPONSE');
        }
        revision++;
        user = newUser;
        token = newToken;

        if (browser) {
            localStorage.setItem(
                'user',
                JSON.stringify(newUser)
            );

            localStorage.setItem('token', newToken);
        }

        loading = false;
    },

    logout() {
        revision++;
        user = null;
        token = null;

        if (browser) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        }

        loading = false;
    },

    async init() {
        if (!browser) return;
        if (!loading && this.isAuthenticated) return;
        if (initialization) return initialization;
        const currentRevision = revision;
        initialization = (async () => {
          loading = true;
          try {
            const savedToken = localStorage.getItem('token');
            const savedUser = localStorage.getItem('user');
            const parsed = savedUser
                ? JSON.parse(savedUser)
                : null;
            if (!parsed || typeof parsed !== 'object' || !isAllowedToken(savedToken)) {
                if (revision === currentRevision) this.logout();
                return;
            }
            // A cached browser profile is not proof of a valid server session.
            // Verify it through an existing protected Go endpoint; never fall back to local auth.
            if (!LOCAL_MODE) {
                const response = await api.get('/stats/dashboard');
                if (!response.data?.daily_stats || typeof response.data.daily_stats !== 'object') {
                    throw new Error('INVALID_AUTH_RESPONSE');
                }
            }
            // A login or logout during validation invalidates the pending response.
            if (revision !== currentRevision) return;
            user = parsed;
            token = savedToken;
          } catch {
            if (revision === currentRevision) this.logout();
          } finally {
            if (revision === currentRevision) loading = false;
          }
        })();
        try {
            await initialization;
        } finally {
            initialization = null;
        }
    }
};

if (browser) {
    window.addEventListener('bigwash:unauthorized', () => auth.logout());
}
