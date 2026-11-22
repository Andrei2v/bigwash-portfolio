
<script>
    import { auth } from '$lib/stores/auth.svelte.js';
    import { authAPI, isAllowedToken, LOCAL_MODE } from '$lib/api/client';
    import { goto } from '$app/navigation';
    import { t as ua } from '$lib/localisation/ua.js';
    import { t as ru } from '$lib/localisation/ru.js';
    import { language } from '$lib/localisation/language.svelte.js';
    let t = $derived(language.current === 'RU' ? ru : ua);

    let isSignUp = $state(false);
    let error = $state('');
    let success = $state('');
    let loading = $state(false);

    let loginData = $state({
        email: '',
        password: '',
        show: false
    });

    let registerData = $state({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        password: '',
        show: false
    });

    function switchForm(signUp) {
        isSignUp = signUp;
        error = '';
        success = '';
    }

    function getErrorMessage(err, action = 'login') {
        const status = err?.response?.status;
        const data = err?.response?.data;
        const serverError = data?.error || data?.message;

        if (err?.message === 'INVALID_AUTH_RESPONSE') {
            return 'Сервер повернув некоректну відповідь авторизації.';
        }

        // Local browser failures have no HTTP response; they are not Go connection errors.
        if (LOCAL_MODE) {
            if (err?.code === 'LOCAL_AUTH_HTTPS_REQUIRED') return language.t('auth.localHttpsRequired');
            if (err?.code === 'LOCAL_AUTH_CRYPTO_UNAVAILABLE') return language.t('auth.localCryptoUnavailable');
            if (!err?.response || status >= 500) return language.t('auth.localOperationFailed');
        }

        if (!err?.response) {
            return 'Не вдалося зв’язатися із сервером. Перевірте backend та API URL.';
        }

        if (status === 401 || status === 403) {
            return 'Невірний email або пароль.';
        }

        if (status === 409 || serverError === 'email already exists') {
            return 'Користувач із таким email вже існує.';
        }

        if (serverError === 'admin role not found') {
            return 'Роль адміністратора не налаштована на сервері.';
        }

        if (status === 400) {
            return serverError || 'Перевірте введені дані.';
        }

        if (status >= 500) {
            return 'Помилка сервера. Перевірте логи backend.';
        }

        return action === 'register'
            ? 'Помилка реєстрації.'
            : 'Не вдалося виконати вхід.';
    }

    // authAPI owns the DEV/PROD boundary; API failures must never select local auth.
    async function handleLogin(e) {
        e?.preventDefault();

        if (loading) return;

        error = '';
        success = '';

        const email = loginData.email.trim().toLowerCase();
        const password = loginData.password;

        if (!email || !password) {
            error = 'Введіть email та пароль.';
            return;
        }

        loading = true;

        try {
            const response = await authAPI.login(email, password);
            const { token, user } = response?.data ?? {};

            if (!isAllowedToken(token) || !user || typeof user !== 'object') {
                throw new Error('INVALID_AUTH_RESPONSE');
            }

            auth.login(user, token);

            await goto('/dashboard');
        } catch (err) {
            console.error('Login failed; HTTP status:', err?.response?.status);
            error = getErrorMessage(err, 'login');
        } finally {
            loading = false;
        }
    }

    async function handleRegister(e) {
        e?.preventDefault();

        if (loading) return;

        error = '';
        success = '';

        if (registerData.password.length < 6) {
            error = 'Пароль повинен містити мінімум 6 символів.';
            return;
        }

        loading = true;

        try {
            const email = registerData.email.trim().toLowerCase();

            // Keep field names compatible with Go auth.go and the local adapter.
            await authAPI.register({
                firstname: registerData.firstName.trim(),
                lastname: registerData.lastName.trim(),
                phone: registerData.phone.trim(),
                email,
                password: registerData.password
            });

            // Registration does not establish a session; require an explicit login.
            loginData.email = email;
            loginData.password = '';
            registerData.password = '';

            isSignUp = false;

            success = 'Реєстрація успішна! Тепер увійдіть у свій акаунт.';
        } catch (err) {
            console.error('Registration failed; HTTP status:', err?.response?.status);
            error = getErrorMessage(err, 'register');
        } finally {
            loading = false;
        }
    }
</script>

<div class="login-page-wrapper">
    <div class="bubbles">
        {#each Array(8) as _, i}
            <div class="bubble"></div>
        {/each}
    </div>

    <div
        class="container {isSignUp ? 'right-panel-active' : ''}"
        id="container"
    >
        <div class="mobile-form-tabs" role="group" aria-label={t.auth.loginTitle}>
        <button type="button" class:chosen={!isSignUp} onclick={() => switchForm(false)}>{t.auth.btnSignIn}</button>
        <button type="button" class:chosen={isSignUp} onclick={() => switchForm(true)}>{t.auth.btnSignUp}</button>
      </div>
      <div class="form-container sign-up-container">
            <form onsubmit={handleRegister}>
                <div class="logo">{t.common.brand}</div>

                <h1>{t.auth.registerTitle}</h1>

                <div class="name-inputs">
                    <input
                        type="text"
                        placeholder={t.auth.firstNamePlace}
                        bind:value={registerData.firstName}
                        autocomplete="given-name"
                        required
                    />

                    <input
                        type="text"
                        placeholder={t.auth.lastNamePlace}
                        bind:value={registerData.lastName}
                        autocomplete="family-name"
                        required
                    />
                </div>

                <input
                    type="tel"
                    placeholder={t.auth.phonePlace}
                    bind:value={registerData.phone}
                    autocomplete="tel"
                    required
                />

                <input
                    type="email"
                    placeholder={t.auth.emailPlace}
                    bind:value={registerData.email}
                    autocomplete="email"
                    required
                />

                <div class="password-container">
                    <input
                        type={registerData.show ? 'text' : 'password'}
                        placeholder={t.auth.passPlace}
                        bind:value={registerData.password}
                        autocomplete="new-password"
                        minlength="6"
                        required
                    />

                    <button
                        type="button"
                        class="password-toggle"
                        aria-label={registerData.show ? language.t("ui.auth.password.hide") : language.t("ui.auth.password.show")}
                        onclick={() => registerData.show = !registerData.show}
                    >
                        {registerData.show ? '🙈' : '👁️'}
                    </button>
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? t.common.loading : t.auth.btnSignUp}
                </button>

                {#if error && isSignUp}
                    <div class="error-message show" role="alert">
                        {language.translate(error)}
                    </div>
                {/if}
            </form>
        </div>

        <div class="form-container sign-in-container">
            <form onsubmit={handleLogin}>
                <div class="logo">{t.common.brand}</div>

                <h1>{t.auth.loginTitle}</h1>

                <input
                    type="email"
                    placeholder={t.auth.emailPlace}
                    bind:value={loginData.email}
                    autocomplete="username"
                    required
                />

                <div class="password-container">
                    <input
                        type={loginData.show ? 'text' : 'password'}
                        placeholder={t.auth.passPlace}
                        bind:value={loginData.password}
                        autocomplete="current-password"
                        required
                    />

                    <button
                        type="button"
                        class="password-toggle"
                        aria-label={loginData.show ? language.t("ui.auth.password.hide") : language.t("ui.auth.password.show")}
                        onclick={() => loginData.show = !loginData.show}
                    >
                        {loginData.show ? '🙈' : '👁️'}
                    </button>
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? t.common.loading : t.auth.btnSignIn}
                </button>

                {#if error && !isSignUp}
                    <div class="error-message show" role="alert">
                        {language.translate(error)}
                    </div>
                {/if}

                {#if success && !isSignUp}
                    <div class="success-message" role="status">
                        {language.translate(success)}
                    </div>
                {/if}
            </form>
        </div>

        <div class="overlay-container">
            <div class="overlay">
                <div class="overlay-panel overlay-left">
                    <h1>{t.auth.hasAccount}</h1>

                    <p>{t.auth.signInDesc}</p>

                    <button
                        type="button"
                        class="ghost"
                        onclick={() => switchForm(false)}
                    >
                        {t.auth.btnSignIn}
                    </button>
                </div>

                <div class="overlay-panel overlay-right">
                    <h1>{t.auth.noAccount}</h1>

                    <p>{t.auth.signUpDesc}</p>

                    <button
                        type="button"
                        class="ghost"
                        onclick={() => switchForm(true)}
                    >
                        {t.auth.btnSignUp}
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .login-page-wrapper {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(
            135deg,
            #1e3c72 0%,
            #2a5298 100%
        );
        font-family: 'Montserrat', sans-serif;
        z-index: 1000;
        overflow: hidden;
    }

    .error-message {
        color: #dc2626;
        font-size: 13px;
        margin-top: 10px;
        display: none;
        background: #fee2e2;
        padding: 8px;
        border-radius: 6px;
        width: 100%;
    }

    .error-message.show {
        display: block;
    }

    .success-message {
        background: #dcfce7;
        color: #166534;
        padding: 10px;
        border-radius: 8px;
        font-size: 13px;
        margin-top: 12px;
        width: 100%;
        text-align: center;
    }

    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    .bubbles {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
        pointer-events: none;
    }

    .bubble {
        position: absolute;
        bottom: -150px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        animation: rise 15s infinite ease-in;
    }

    .bubble:nth-child(1) {
        width: 80px;
        height: 80px;
        left: 10%;
        animation-duration: 8s;
    }

    .bubble:nth-child(2) {
        width: 120px;
        height: 120px;
        left: 20%;
        animation-duration: 12s;
        animation-delay: 1s;
    }

    .bubble:nth-child(3) {
        width: 50px;
        height: 50px;
        left: 35%;
        animation-duration: 10s;
    }

    .bubble:nth-child(4) {
        width: 150px;
        height: 150px;
        left: 50%;
        animation-duration: 15s;
        animation-delay: 2s;
    }

    .bubble:nth-child(5) {
        width: 90px;
        height: 90px;
        left: 65%;
        animation-duration: 11s;
    }

    .bubble:nth-child(6) {
        width: 40px;
        height: 40px;
        left: 80%;
        animation-duration: 9s;
        animation-delay: 3s;
    }

    .bubble:nth-child(7) {
        width: 110px;
        height: 110px;
        left: 90%;
        animation-duration: 13s;
    }

    .bubble:nth-child(8) {
        width: 60px;
        height: 60px;
        left: 25%;
        animation-duration: 7s;
        animation-delay: 4s;
    }

    @keyframes rise {
        0% {
            bottom: -100px;
            transform: translateX(0);
        }

        50% {
            transform: translateX(100px);
        }

        100% {
            bottom: 1080px;
            transform: translateX(-200px);
        }
    }

    .container {
        position: relative;
        z-index: 1;
        width: 900px;
        height: 550px;
        background: white;
        border-radius: 20px;
        box-shadow: 0 20px 80px rgba(0, 0, 0, 0.3);
        overflow: hidden;
        display: flex;
    }

    .form-container {
        position: absolute;
        top: 0;
        height: 100%;
        transition: all 0.6s ease-in-out;
    }

    .sign-in-container {
        left: 0;
        width: 50%;
        z-index: 2;
    }

    .sign-up-container {
        left: 0;
        width: 50%;
        opacity: 0;
        z-index: 1;
        pointer-events: none;
    }

    .container.right-panel-active .sign-in-container {
        transform: translateX(100%);
        pointer-events: none;
    }

    .container.right-panel-active .sign-up-container {
        transform: translateX(100%);
        opacity: 1;
        z-index: 5;
        pointer-events: auto;
        animation: show 0.6s;
    }

    @keyframes show {
        0%, 49.99% {
            opacity: 0;
            z-index: 1;
        }

        50%, 100% {
            opacity: 1;
            z-index: 5;
        }
    }

    .overlay-container {
        position: absolute;
        top: 0;
        left: 50%;
        width: 50%;
        height: 100%;
        overflow: hidden;
        transition: transform 0.6s ease-in-out;
        z-index: 100;
    }

    .container.right-panel-active .overlay-container {
        transform: translateX(-100%);
    }

    .overlay {
        background: linear-gradient(
            135deg,
            #2a5298 0%,
            #1e3c72 100%
        );
        color: white;
        position: relative;
        left: -100%;
        height: 100%;
        width: 200%;
        transform: translateX(0);
        transition: transform 0.6s ease-in-out;
    }

    .container.right-panel-active .overlay {
        transform: translateX(50%);
    }

    .overlay-panel h1,
    .overlay-panel p {
        color: #ffffff !important;
    }

    .overlay-panel {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        padding: 0 40px;
        text-align: center;
        top: 0;
        height: 100%;
        width: 50%;
        transition: transform 0.6s ease-in-out;
    }

    .overlay-left {
        transform: translateX(-20%);
    }

    .container.right-panel-active .overlay-left {
        transform: translateX(0);
    }

    .overlay-right {
        right: 0;
        transform: translateX(0);
    }

    .container.right-panel-active .overlay-right {
        transform: translateX(20%);
    }

    form {
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        padding: 0 50px;
        height: 100%;
        text-align: center;
    }

    .logo {
        font-size: 48px;
        font-weight: bold;
        color: #1e3c72;
        margin-bottom: 20px;
        letter-spacing: 2px;
    }

    h1 {
        font-weight: bold;
        margin: 0;
        color: #1e3c72;
        font-size: 28px;
    }

    p {
        font-size: 14px;
        margin: 20px 0 30px;
    }

    input {
        background: #f6f9fc;
        border: 1px solid #e0e6ed;
        padding: 12px 15px;
        margin: 8px 0;
        width: 100%;
        border-radius: 8px;
    }

    button {
        border-radius: 20px;
        border: 1px solid #2a5298;
        background: linear-gradient(
            135deg,
            #2a5298 0%,
            #1e3c72 100%
        );
        color: white;
        padding: 12px 45px;
        cursor: pointer;
        text-transform: uppercase;
        font-weight: bold;
    }

    button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    button.ghost {
        background: transparent;
        border-color: white;
    }

    .name-inputs {
        display: flex;
        gap: 10px;
        width: 100%;
    }

    .password-container {
        position: relative;
        width: 100%;
        display: flex;
        align-items: center;
        margin: 8px 0;
    }

    .password-container input {
        margin: 0 !important;
        padding-right: 45px !important;
    }

    .password-toggle {
        position: absolute !important;
        right: 12px !important;
        top: 50% !important;
        transform: translateY(-50%) !important;
        background: transparent !important;
        border: none !important;
        padding: 0 !important;
        width: 30px !important;
        height: 30px !important;
        cursor: pointer;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: none !important;
    }

    @media (max-width: 700px) {
        .container {
            width: 95vw;
            max-width: 450px;
            height: 550px;
        }

        .form-container {
            width: 100%;
        }

        .sign-in-container,
        .sign-up-container {
            width: 100%;
        }

        .overlay-container {
            display: none;
        }

        .container.right-panel-active .sign-in-container {
            opacity: 0;
            pointer-events: none;
        }

        .container.right-panel-active .sign-up-container {
            transform: none;
        }

        form {
            padding: 0 25px;
        }

        .logo {
            font-size: 36px;
        }

        h1 {
            font-size: 24px;
        }
    }

    .mobile-form-tabs { display: none; }
    @media(max-width:700px) {
      .login-page-wrapper { height: 100dvh; overflow-y: auto; padding: 16px 12px; align-items: flex-start; }
      .container { display: block; width: 100%; max-width: 450px; min-height: 560px; height: auto; margin: auto; flex-shrink: 0; }
      .mobile-form-tabs { display: flex; gap: 6px; position: relative; z-index: 12; padding: 14px; }
      .mobile-form-tabs button { flex: 1; padding: 10px 6px; font-size: 12px; border-radius: 10px; background: #e2e8f0; color: #1e3c72; }
      .mobile-form-tabs button.chosen { background: #1e3c72; color: white; }
      .form-container { position: relative; height: auto; top: auto; transition: none; }
      .sign-up-container { display: none; }
      .sign-in-container { transform: none !important; }
      .container.right-panel-active .sign-in-container { display: none; }
      .container.right-panel-active .sign-up-container { display: block; transform: none; }
      form { padding: 12px 20px 26px; height: auto; min-height: 470px; gap: 6px; }
      .name-inputs { flex-direction: column; gap: 0; }
      input { min-width: 0; font-size: 16px; }
      .bubbles { position: fixed; overflow: hidden; }
    }
</style>
