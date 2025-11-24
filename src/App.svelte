<script lang="ts">
  import { onMount } from 'svelte';
  import Login from './lib/Login.svelte';
  import Calculator from './lib/Calculator.svelte';

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

<main class="min-h-screen flex flex-col w-full">
  <!-- Header -->
  <header class="bg-legal-800 border-b border-legal-700 p-4 shadow-md z-10">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-legal-gold rounded-sm flex items-center justify-center">
          <span class="text-legal-900 font-bold text-xs">LI</span>
        </div>
        <span class="font-bold text-lg tracking-wide text-white">LEGAL FEES</span>
      </div>
      {#if isAuthenticated}
        <button 
          onclick={handleLogout}
          class="text-sm text-slate-400 hover:text-white cursor-pointer"
        >
          Logout
        </button>
      {/if}
    </div>
  </header>

  <!-- Content Area -->
  <div class="flex-grow p-4 md:p-8 flex flex-col items-center w-full">
    {#if isLoading}
      <div class="flex justify-center items-center h-full text-legal-gold animate-pulse">Loading...</div>
    {:else if !isAuthenticated}
      <Login onUnlock={handleUnlock} />
    {:else}
      <Calculator />
    {/if}
  </div>

  <!-- Secure Footer -->
  <footer class="bg-legal-900 border-t border-legal-800 py-4 px-4 text-center mt-auto">
    <p class="text-xs text-slate-500 flex items-center justify-center gap-2">
      <span>🔒</span>
      <span>Secure Mode: Alle Berechnungen finden lokal in Ihrem Browser statt.</span>
    </p>
  </footer>
</main>