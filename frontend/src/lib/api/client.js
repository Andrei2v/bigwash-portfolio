
import axios from 'axios';
import { validateClient, validCardDiscount } from '$lib/review-validation.js';

// Local adapters require an explicit development opt-in. Production always uses Go API.

export const LOCAL_MODE =
    import.meta.env.DEV &&
    !import.meta.env.PROD &&
    import.meta.env.VITE_LOCAL_MODE === 'true';

export const isAllowedToken = (value) =>
    typeof value === 'string' && value.length > 0 && value === value.trim() &&
    (LOCAL_MODE
        ? value.startsWith('local-preview-')
        : !value.startsWith('local-preview-'));

function invalidateSession() {
    if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('bigwash:unauthorized'));
    }
}

const BASE = (
    import.meta.env.VITE_API_URL ||
    'http://localhost:8080/api/v1'
).replace(/\/+$/, '');

const LOCAL_BASE = '/__bigwash_local__/api/v1';

export const API_URL = LOCAL_MODE
    ? LOCAL_BASE
    : BASE;

export const WS_URL = LOCAL_MODE
    ? `${
        typeof location !== 'undefined'
            ? location.origin.replace(/^http/, 'ws')
            : 'ws://localhost:5173'
      }${LOCAL_BASE}/ws`
    : (
        import.meta.env.VITE_WS_URL ||
        BASE.replace(/^http:/, 'ws:')
            .replace(/^https:/, 'wss:') + '/ws'
    );

// Browser-only fixtures are not a substitute for server-side authentication.

const STORE = 'bigwash.local.v1.';

const read = (key, fallback) => {
    if (typeof localStorage === 'undefined') {
        return fallback;
    }

    try {
        const value = localStorage.getItem(STORE + key);

        return value === null
            ? fallback
            : JSON.parse(value);
    } catch {
        return fallback;
    }
};

const write = (key, value) => {
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem(
            STORE + key,
            JSON.stringify(value)
        );
    }
};

const newId = () =>
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const normalizeEmail = (email) =>
    String(email || '').trim().toLowerCase();

// Avoid plaintext passwords, but PBKDF2 cannot protect browser data from local tampering.

function requireLocalAuthCrypto() {
    const code = globalThis.isSecureContext === false
        ? 'LOCAL_AUTH_HTTPS_REQUIRED'
        : !globalThis.crypto?.subtle ? 'LOCAL_AUTH_CRYPTO_UNAVAILABLE' : '';
    if (code) {
        const error = new Error(code);
        error.code = code;
        throw error;
    }
}

async function passwordDigest(password, salt) {
    requireLocalAuthCrypto();

    const encoder = new TextEncoder();

    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
    );

    const hash = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: encoder.encode(salt),
            iterations: 120000,
            hash: 'SHA-256'
        },
        key,
        256
    );

    return [...new Uint8Array(hash)]
        .map((x) => x.toString(16).padStart(2, '0'))
        .join('');
}

// Keep development accounts separate from the current session in localStorage.
// Fall back to localStorage only when IndexedDB is unavailable.
// A failed IndexedDB write must not report success against a different account store.

function accountStorage(action, value) {
    if (typeof indexedDB === 'undefined') {
        return Promise.resolve(
            action === 'get'
                ? read('accounts', null)
                : write('accounts', value)
        );
    }

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(
            'bigwash-local-preview',
            1
        );

        request.onupgradeneeded = () => {
            if (!request.result.objectStoreNames.contains('settings')) {
                request.result.createObjectStore('settings');
            }
        };

        request.onerror = () => reject(request.error);

        request.onsuccess = () => {
            const db = request.result;

            const tx = db.transaction(
                'settings',
                action === 'get' ? 'readonly' : 'readwrite'
            );

            const operation = action === 'get'
                ? tx.objectStore('settings').get('accounts')
                : tx.objectStore('settings').put(value, 'accounts');

            let result;
            operation.onsuccess = () => { result = operation.result; };
            tx.oncomplete = () => {
                db.close();
                resolve(result);
            };
            tx.onabort = () => {
                db.close();
                reject(tx.error || operation.error || new Error('Account transaction aborted'));
            };
        };
    });
}

async function getAccounts() {
    const saved = await accountStorage('get');
    // Preserve legacy localStorage accounts when IndexedDB has no account record yet.
    return saved ?? read('accounts', []);
}

async function saveAccounts(accounts) {
    await accountStorage('set', accounts);
}

function localError(message, status = 400) {
    const err = new Error(message);

    err.response = {
        status,
        data: { error: message }
    };

    return err;
}

// Explicit DEV maintenance only: reuse existing accounts without adding a Go endpoint.
export const changeLocalCredentials = async (currentEmail, currentPassword, nextEmail, nextPassword) => {
    if (!LOCAL_MODE) throw localError('Локальний API вимкнено.', 403);
    requireLocalAuthCrypto();

    const email = normalizeEmail(nextEmail);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof nextPassword !== 'string' || nextPassword.length < 6) {
        throw localError('Перевірте введені дані.', 400);
    }

    const accounts = await getAccounts();
    const index = accounts.findIndex(account => account.user.email === normalizeEmail(currentEmail));
    const account = accounts[index];
    if (!account || await passwordDigest(currentPassword || '', account.salt) !== account.hash) {
        throw localError('invalid credentials', 401);
    }
    if (accounts.some((item, position) => position !== index && item.user.email === email)) {
        throw localError('email already exists', 409);
    }

    const salt = newId();
    const user = { ...account.user, email };
    const updated = { ...account, user, salt, hash: await passwordDigest(nextPassword, salt) };
    await saveAccounts(accounts.map((item, position) => position === index ? updated : item));

    // End the current DEV session only after the new credentials have committed.
    invalidateSession();
    return { user };
};

// Stable fixtures for offline development.

const initial = {
    admins: [
        {
            id: 1,
            firstname: 'Олена',
            lastname: 'Коваль',
            email: 'olena@example.local',
            phone: '+380000000001',
            role: 'Адмін'
        },
        {
            id: 2,
            firstname: 'Максим',
            lastname: 'Петренко',
            email: 'maksym@example.local',
            phone: '+380000000002',
            role: 'Власник'
        }
    ],

    clients: [
        {
            id: 1,
            name: 'Олена',
            surname: 'Коваль',
            firstname: 'Олена',
            lastname: 'Коваль',
            money: '1250.00',
            phone: '+380000000001',
            tags: [
                {
                    name: 'Авто',
                    color: '#A855F7'
                }
            ],
            email: 'olena@example.local',
            date: '01.10.2026',
            card: '10000001'
        },
        {
            id: 2,
            name: 'Максим',
            surname: 'Петренко',
            firstname: 'Максим',
            lastname: 'Петренко',
            money: '340.50',
            phone: '+380000000002',
            tags: [
                {
                    name: 'Мото',
                    color: '#EF3636'
                }
            ],
            email: 'maksym@example.local',
            date: '02.10.2026',
            card: '10000002'
        }
    ],

    cards: [
        {
            id: 1,
            uid: '10000001',
            amount: 450,
            user: {
                id: 1,
                firstname: 'Олена',
                lastname: 'Коваль'
            },
            created_at: '2026-10-01T10:00:00Z',
            last_used_at: '2026-10-02T10:00:00Z'
        },
        {
            id: 2,
            uid: '10000002',
            amount: 1200,
            user: {
                id: 2,
                firstname: 'Максим',
                lastname: 'Петренко'
            },
            created_at: '2026-10-02T10:00:00Z',
            last_used_at: '2026-10-02T12:00:00Z'
        }
    ]
};

function collection(name) {
    return read(name, initial[name] || []);
}

function saveCollection(name, value) {
    write(name, value);
    return value;
}

// Match the server response shapes so Axios and fetch callers can share local fixtures.

async function handleLocal(method, path, body) {
    if (!LOCAL_MODE) throw localError('Локальний API вимкнено.', 403);
    const clean = path
        .split('?')[0]
        .replace(/^\/+/, '');

    // REGISTER
    if (clean === 'auth/register' && method === 'POST') {
        requireLocalAuthCrypto();
        const email = normalizeEmail(body.email);

        if (
            !email ||
            !body.password ||
            body.password.length < 6 ||
            !body.firstname?.trim() ||
            !body.lastname?.trim() ||
            !body.phone?.trim()
        ) {
            throw localError(
                'Заповніть усі поля. Пароль має містити щонайменше 6 символів.',
                400
            );
        }

        const accounts = await getAccounts();

        if (accounts.some((a) => a.user.email === email)) {
            throw localError('email already exists', 409);
        }

        const salt = newId();

        const user = {
            id: newId(),
            email,
            firstname: body.firstname.trim(),
            lastname: body.lastname.trim(),
            phone: body.phone.trim(),
            role: 'admin'
        };

        accounts.push({
            user,
            salt,
            hash: await passwordDigest(body.password, salt)
        });

        await saveAccounts(accounts);

        return {
            message: 'user registered successfully',
            user
        };
    }

    // LOGIN
    if (clean === 'auth/login' && method === 'POST') {
        requireLocalAuthCrypto();
        const email = normalizeEmail(body.email);

        const accounts = await getAccounts();

        const account = accounts.find(
            (a) => a.user.email === email
        );

        if (
            !account ||
            (await passwordDigest(
                body.password || '',
                account.salt
            )) !== account.hash
        ) {
            throw localError('invalid credentials', 401);
        }

        return {
            user: account.user,
            token: `local-preview-${newId()}`
        };
    }

    // DASHBOARD
    if (clean === 'stats/dashboard') {
        return {
            daily_stats: {
                profit: 125521,
                expenses: 25521,
                balance: 100000
            }
        };
    }

    if (clean === 'stats/monthly-chart') {
        return [];
    }

    if (clean === 'stats/payment-methods') {
        return [];
    }

    if (clean === 'stats/activities') {
        return collection('activities');
    }

    if (clean === 'stats/daily' && method === 'PUT') {
        return body;
    }

    if (
        clean === 'stats/activities' &&
        method === 'POST'
    ) {
        const activities = collection('activities');

        const record = {
            id: newId(),
            ...body
        };

        saveCollection(
            'activities',
            [record, ...activities]
        );

        return record;
    }

    // ADMINS, CLIENTS, CARDS
    const match =
        /^(admins|clients|cards)(?:\/([^/]+))?(?:\/(replenish|block|stats))?$/
            .exec(clean);

    if (match) {
        const [, name, id, action] = match;

        let rows = collection(name);

        if (action === 'stats' || id === 'stats') {
            return { total: rows.length };
        }

        if (!id) {
            if (method === 'GET') {
                return rows;
            }

            if (method === 'POST') {
                if (name === 'clients') {
                    const error = validateClient(body, { creating: true });
                    if (error) throw localError(`review.${error}`, 400);
                }
                if (name === 'cards' && 'discount' in body && !validCardDiscount(body.discount)) {
                    throw localError('review.cardDiscountInvalid', 400);
                }
                const created = {
                    ...body,
                    id: newId()
                };

                saveCollection(
                    name,
                    [...rows, created]
                );

                return created;
            }
        }

        const idx = rows.findIndex(
            (item) => String(item.id) === String(id)
        );

        if (idx < 0) {
            throw localError('Запис не знайдено', 404);
        }

        if (method === 'GET') {
            return rows[idx];
        }

        if (method === 'DELETE') {
            saveCollection(
                name,
                rows.filter((_, i) => i !== idx)
            );

            return { success: true };
        }

        if (method === 'PUT' || method === 'PATCH') {
            const updated = { ...rows[idx], ...body };
            if (name === 'clients') {
                const error = validateClient(updated, { previous: rows[idx] });
                if (error) throw localError(`review.${error}`, 400);
            }
            if (name === 'cards' && 'discount' in body && !validCardDiscount(body.discount)) {
                throw localError('review.cardDiscountInvalid', 400);
            }
            rows[idx] = updated;

            saveCollection(name, rows);

            return rows[idx];
        }

        if (
            method === 'POST' &&
            action === 'replenish'
        ) {
            rows[idx].amount =
                Number(rows[idx].amount || 0) +
                Number(body.amount || 0);

            saveCollection(name, rows);

            return rows[idx];
        }

        if (
            method === 'POST' &&
            action === 'block'
        ) {
            rows[idx].blocked = true;

            saveCollection(name, rows);

            return rows[idx];
        }
    }

    // Reject unsupported operations rather than silently pretending they were saved.
    if (method === 'GET') {
        return [];
    }

    throw localError(
        'Цю операцію ще не підключено до локального сховища.',
        501
    );
}

function getLocalPath(url) {
    const parsed = new URL(
        String(url),
        typeof location !== 'undefined'
            ? location.origin
            : 'http://localhost'
    );

    const prefix = LOCAL_BASE + '/';

    if (!parsed.pathname.startsWith(prefix)) {
        return null;
    }

    return parsed.pathname.slice(prefix.length) +
        parsed.search;
}

async function localAdapter(config) {
    const path = getLocalPath(
        `${LOCAL_BASE}/${
            String(config.url || '').replace(/^\/+/, '')
        }`
    );

    const payload = typeof config.data === 'string'
        ? JSON.parse(config.data)
        : (config.data || {});

    const data = await handleLocal(
        (config.method || 'get').toUpperCase(),
        path || '',
        payload
    );

    return {
        data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config
    };
}

// Legacy pages use fetch. Intercept only the local prefix; leave all other requests native.

if (
    LOCAL_MODE &&
    typeof window !== 'undefined' &&
    !window.__bigwashLocalFetchInstalled
) {
    const nativeFetch = window.fetch.bind(window);

    window.fetch = async (input, init = {}) => {
        const url = typeof input === 'string'
            ? input
            : input instanceof URL
                ? input.href
                : input?.url;

        const path = url
            ? getLocalPath(url)
            : null;

        if (path === null) {
            return nativeFetch(input, init);
        }

        const method = String(
            init.method ||
            (typeof input === 'object' && input.method) ||
            'GET'
        ).toUpperCase();

        let body = {};

        if (init.body) {
            try {
                body = JSON.parse(init.body);
            } catch {
                body = {};
            }
        }

        try {
            const data = await handleLocal(
                method,
                path,
                body
            );

            return new Response(
                JSON.stringify(data),
                {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        } catch (err) {
            return new Response(
                JSON.stringify({
                    error: err.message
                }),
                {
                    status: err.response?.status || 500,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }
    };

    window.__bigwashLocalFetchInstalled = true;
}

// AXIOS

export const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
    },
    ...(LOCAL_MODE ? {
        adapter: localAdapter
    } : {})
});

api.interceptors.request.use((config) => {
    if (
        !LOCAL_MODE &&
        typeof localStorage !== 'undefined'
    ) {
        const token = localStorage.getItem('token');

        if (isAllowedToken(token)) {
            config.headers.Authorization =
                `Bearer ${token}`;
        } else if (token) {
            invalidateSession();
        }
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!LOCAL_MODE && error.response?.status === 401 &&
            !String(error.config?.url || '').startsWith('/auth/')) {
            invalidateSession();
        }
        return Promise.reject(error);
    }
);

// AUTH API

export const authAPI = {
    login: (email, password) =>
        api.post('/auth/login', {
            email: normalizeEmail(email),
            password
        }),

    register: (data) =>
        api.post('/auth/register', {
            firstname: data.firstname,
            lastname: data.lastname,
            phone: data.phone,
            email: normalizeEmail(data.email),
            password: data.password
        })
};

// ADMINS API

export const adminsAPI = {
    getAll: () => api.get('/admins'),

    getStats: () => api.get('/admins/stats'),

    getOne: (id) => api.get(`/admins/${id}`),

    create: (data) => api.post('/admins', data),

    update: (id, data) => api.put(`/admins/${id}`, data),

    delete: (id) => api.delete(`/admins/${id}`)
};

// CARDS API

export const cardsAPI = {
    getAll: () => api.get('/cards'),

    getStats: () => api.get('/cards/stats'),

    getOne: (id) => api.get(`/cards/${id}`),

    create: (data) => api.post('/cards', data),

    update: (id, data) => api.put(`/cards/${id}`, data),

    delete: (id) => api.delete(`/cards/${id}`),

    replenish: (id, amount) =>
        api.post(`/cards/${id}/replenish`, { amount }),

    block: (id) => api.post(`/cards/${id}/block`)
};

// STATS API

export const statsAPI = {
    getDashboard: () =>
        api.get('/stats/dashboard'),

    getMonthlyChart: () =>
        api.get('/stats/monthly-chart'),

    getPaymentMethods: (period = 'month') =>
        api.get('/stats/payment-methods', {
            params: { period }
        }),

    getActivities: (limit = 10) =>
        api.get('/stats/activities', {
            params: { limit }
        }),

    updateDaily: (data) =>
        api.put('/stats/daily', data),

    addActivity: (data) =>
        api.post('/stats/activities', data)
};

export default api;
