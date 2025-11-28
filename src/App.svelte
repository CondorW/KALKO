<script lang="ts">
  import { onMount } from 'svelte';
  import Login from './lib/Login.svelte';
  import Calculator from './lib/Calculator.svelte';
  import logoSrc from './assets/logo.svg';

  // Runes State
  let isAuthenticated = $state(false);
  let isLoading = $state(true);

  onMount(() => {
    // Prüfen, ob User in dieser Session schon eingeloggt war
    const sessionAuth = sessionStorage.getItem('legal_auth');
    if (sessionAuth === 'true') {
      isAuthenticated = true;
    }
    isLoading = false;
  });

  function handleUnlock() {
    isAuthenticated = true;
    sessionStorage.setItem('legal_auth', 'true');
  }

  function handleLogout() {
    sessionStorage.removeItem('legal_auth');
    location.reload();
  }
</script>

<main class="min-h-screen flex flex-col w-full bg-legal-950 text-slate-200 selection:bg-legal-gold selection:text-legal-950 font-sans">
  <!-- Header -->
  <header class="bg-legal-900 border-b border-legal-700/50 p-4 shadow-lg z-50 relative">
    <div class="max-w-[1600px] mx-auto flex items-center justify-between">
      <div class="flex items-center gap-4 group cursor-default">
        <!-- Logo Container mit Glow -->
        <div class="relative w-10 h-10 flex items-center justify-center">
            <div class="absolute inset-0 bg-legal-gold/20 blur-md rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
            <!-- Logo als Image -->
            <img 
                src={logoSrc} 
                alt="KALKO Logo" 
                class="w-10 h-10 relative z-10 drop-shadow-[0_2px_10px_rgba(251,191,36,0.3)] transition-transform duration-500 group-hover:scale-105" 
            />
        </div>
        
        <!-- Brand Name -->
        <div class="flex flex-col justify-center">
          <span class="font-bold text-xl tracking-[0.15em] text-white leading-none font-mono group-hover:text-legal-gold transition-colors duration-300">KALKO</span>
          <span class="text-[10px] text-legal-500 tracking-[0.3em] uppercase leading-none mt-1.5 font-medium">Kosten Rechner</span>
        </div>
      </div>

      {#if isAuthenticated}
        <button 
          onclick={handleLogout}
          class="text-xs font-medium text-slate-400 hover:text-white px-4 py-2 rounded-sm hover:bg-legal-800 transition-all uppercase tracking-widest border border-transparent hover:border-legal-700"
        >
          Logout
        </button>
      {/if}
    </div>
  </header>

  <!-- Content Area -->
  <div class="flex-grow p-0 md:p-6 lg:p-8 flex flex-col items-center w-full">
    {#if isLoading}
      <div class="flex flex-col gap-4 justify-center items-center h-[60vh] animate-pulse">
        <img src={logoSrc} alt="Loading" class="w-16 h-16 opacity-50 drop-shadow-[0_0_15px_rgba(251,191,36,0.2)]" />
        <span class="text-legal-gold font-mono text-xs uppercase tracking-widest">System wird geladen...</span>
      </div>
    {:else if !isAuthenticated}
      <Login onUnlock={handleUnlock} />
    {:else}
      <Calculator />
    {/if}
  </div>

  <!-- Secure Footer -->
  <footer class="bg-legal-900 border-t border-legal-800/50 py-3 px-4 text-center mt-auto">
    <p class="text-[10px] text-slate-600 flex items-center justify-center gap-2 font-mono">
      <span class="text-legal-gold">🔒</span>
      <span>SECURE ENCLAVE • LOCAL EXECUTION ONLY • V1.0.4</span>
    </p>
  </footer>
</main>