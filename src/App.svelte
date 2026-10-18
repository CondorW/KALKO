<script lang="ts">
  import { onMount } from 'svelte';
  import Login from './lib/Login.svelte';
  import Calculator from './lib/Calculator.svelte';

  let isAuthenticated = $state(false);
  let isLoading = $state(true);
  onMount(() => {
    isAuthenticated = sessionStorage.getItem('legal_auth') === 'true';
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

<main class="app-shell">
  <header class="app-header">
    <div class="app-brand"><span class="brand-mark" aria-hidden="true">K</span><div><span class="brand-name">KALKO</span><span class="brand-description">Honorare &amp; Kosten</span></div></div>
    <div class="app-header-actions"><span class="local-status"><span aria-hidden="true"></span>Lokal im Browser</span>{#if isAuthenticated}<button onclick={handleLogout} class="logout-button">Abmelden</button>{/if}</div>
  </header>
  <div class="app-content" class:login-content={!isAuthenticated}>
    {#if isLoading}<div class="text-legal-gold">Wird geladen …</div>{:else if !isAuthenticated}<Login onUnlock={handleUnlock} />{:else}<Calculator />{/if}
  </div>
  <footer class="app-footer">Berechnungen und Eingaben bleiben lokal in deinem Browser.</footer>
</main>
