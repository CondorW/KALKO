<script lang="ts">
  // Wir definieren Props mit $props()
  let { onUnlock } = $props<{ onUnlock: () => void }>();
  
  let pin = $state('');
  let error = $state('');
  const CORRECT_PIN = '1234';

  function handleLogin() {
    if (pin === CORRECT_PIN) {
      onUnlock();
    } else {
      error = 'Zugriff verweigert. Falscher PIN.';
      pin = '';
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleLogin();
  }
</script>

<div class="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
  <div class="card max-w-md w-full border-t-4 border-t-legal-gold">
    <div class="mb-6">
      <div class="w-16 h-16 bg-legal-700 rounded-full flex items-center justify-center mx-auto mb-4">
        <span class="text-3xl">⚖️</span>
      </div>
      <h1 class="text-2xl font-bold text-white">Kanzlei Tarifrechner</h1>
      <p class="text-slate-400 mt-2 text-sm">Bitte authentifizieren Sie sich.</p>
    </div>

    <div class="space-y-4">
      <div>
        <input 
          type="password" 
          bind:value={pin} 
          onkeydown={handleKeydown}
          placeholder="Zugangscode eingeben" 
          class="input-field text-center tracking-widest text-lg"
          autofocus
        />
      </div>

      {#if error}
        <p class="text-red-400 text-sm animate-pulse">{error}</p>
      {/if}

      <button onclick={handleLogin} class="btn-primary w-full">
        Unlock Tool
      </button>
    </div>
    
    <div class="mt-8 text-xs text-slate-600">
      Internal Use Only • Liechtenstein Law
    </div>
  </div>
</div>