<script lang="ts">
  import logoSrc from '../assets/logo2.svg';

  // Props
  let { onUnlock } = $props<{ onUnlock: () => void }>();

  let pin = $state('');
  let error = $state('');

  const CORRECT_PIN = '5555';

  function handleLogin() {
    if (pin === CORRECT_PIN) {
      onUnlock(); // Sofortiger Unlock ohne Verzögerung
    } else {
      error = 'ZUGRIFF VERWEIGERT';
      pin = '';
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleLogin();
  }

  // Svelte Action: Setzt den Fokus ohne A11y-Linting-Verletzung
  function focusOnMount(node: HTMLInputElement) {
    node.focus();
  }
</script>

<div class="fixed inset-0 overflow-hidden flex flex-col items-center justify-center bg-legal-950">
  
  <div class="relative z-20 w-full max-w-md px-4 flex flex-col items-center">
    
    <div class="mb-12 flex flex-col items-center cursor-default w-full">
      <div class="mb-6 transition-transform duration-700 ease-out hover:scale-105">
        <img src={logoSrc} alt="TarifPoint Logo" class="h-16 md:h-20 drop-shadow-[0_4px_15px_rgba(251,191,36,0.2)]" />
      </div>
      <p class="text-legal-500 text-xs uppercase tracking-[0.4em] font-medium">Liechtenstein Kosten Rechner</p>
    </div>

    <div class="card max-w-sm w-full bg-legal-900/80 backdrop-blur-md border border-legal-700/50 p-8 shadow-2xl relative overflow-hidden focus-within:border-legal-gold/30 transition-colors">
      <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-legal-gold/30 to-transparent"></div>
      
      <div class="space-y-6 relative z-10">
        <div class="text-center">
          <label for="pin" class="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-3 block">Sicherheits-PIN</label>
          <div class="relative group/input">
            <input 
              id="pin"
              type="password" 
              bind:value={pin} 
              onkeydown={handleKeydown}
              use:focusOnMount
              placeholder="••••" 
              class="w-full bg-legal-950/60 border border-legal-700 rounded-sm text-center text-3xl tracking-[0.5em] text-white py-4 focus:ring-1 focus:ring-legal-gold focus:border-legal-gold focus:outline-none transition-all placeholder:text-legal-800 font-mono shadow-inner group-hover/input:border-legal-600"
            />
          </div>
        </div>

        {#if error}
          <div class="text-red-400 text-xs text-center font-mono uppercase tracking-wide border border-red-900/30 bg-red-950/30 py-3 rounded-sm animate-pulse flex items-center justify-center gap-2">
            <span class="text-lg">⚠️</span> {error}
          </div>
        {/if}

        <button aria-label="System entsperren" onclick={handleLogin} class="btn-primary w-full py-4 text-xs uppercase tracking-widest font-bold shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] bg-gradient-to-r from-legal-accent to-blue-600 hover:to-blue-500 border border-white/10 active:scale-95 transition-transform">
          System entsperren
        </button>
      </div>
    </div>
    
    <div class="mt-16 text-[10px] text-slate-600 text-center max-w-xs leading-relaxed font-mono opacity-60">
      GESCHÜTZTE UMGEBUNG<br>
      ZUGRIFF NUR FÜR AUTORISIERTES PERSONAL
    </div>
  </div>
</div>