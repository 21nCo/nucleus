<!-- Example: Using static in a Svelte component -->
<script>
  import { assets, assetPath } from '@nucleum/static';
  
  // You can now use shared assets across all apps
  let playSound = (soundType) => {
    const audio = new Audio(assets.sounds[soundType]);
    audio.play();
  };
</script>

<!-- Logo from shared assets -->
<img src={assets.nucleusLogo} alt="Nucleum Logo" class="logo" />

<!-- Sounds from shared assets -->
<div class="sound-controls">
  <button onclick={() => playSound('tick')}>
    Play Tick
  </button>
  <button onclick={() => playSound('upchime')}>
    Play Chime  
  </button>
  <button onclick={() => playSound('dingding')}>
    Play Notification
  </button>
</div>

<!-- Custom asset using the helper -->
<img src={assetPath('custom/my-image.png')} alt="Custom" />

<!-- Individual SVG icon -->
<img src={assets.icons.arrowBack} alt="Back Arrow" class="icon" />

<style>
  .logo {
    width: 200px;
    height: auto;
  }
  
  .sound-controls {
    display: flex;
    gap: 1rem;
    margin: 1rem 0;
  }
  
  button {
    padding: 0.5rem 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: white;
    cursor: pointer;
  }
  
  button:hover {
    background: #f0f0f0;
  }
  
  .icon {
    width: 24px;
    height: 24px;
  }
</style>
