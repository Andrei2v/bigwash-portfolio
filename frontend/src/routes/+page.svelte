<script>
  import { language } from '$lib/localisation/language.svelte.js';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { auth } from '$lib/stores/auth.svelte.js';

    onMount(() => {
        auth.init();
    });

    $effect(() => {
        if (!auth.loading) {
            if (auth.user) {
                goto('/dashboard');
            } else {
                goto('/login');
            }
        }
    });
</script>

<div class="loading-screen">
    {language.t("ui.auth.states.checking")}
</div>