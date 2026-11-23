import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig(({ command, mode, isPreview }) => ({
  plugins: [sveltekit()],
  // Keep first navigation to a feature page from triggering a dependency reload.
  optimizeDeps: { include: ['axios', 'chart.js/auto', 'lucide-svelte'] },
  // Generated TLS keys must stay private even when regular Vite is exposed over LAN.
  server: {
    watch: { ignored: ['**/.cache/**', '**/.local/**'] },
    fs: { deny: ['.env', '.env.*', '*.{crt,pem,pfx,p12,key,cer}', '**/.local/**', '**/.cache/**', '**/.git/**'] }
  },
  // Keep local authentication out of every build, including build --mode development.
  define: command === 'build' || mode === 'production' || isPreview ? {
    'import.meta.env.VITE_LOCAL_MODE': '"false"',
    'import.meta.env.VITE_DEMO_MODE': '"false"'
  } : {}
}));
