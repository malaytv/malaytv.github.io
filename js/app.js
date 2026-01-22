// ===== js/app.js (TV Malaysia Online - FINAL) =====
// Full version untuk TV Malaysia Online

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

let CHANNELS = [];
let CHANNELS_MAP = new Map();
let currentChannel = null;
let currentStreamUrl = null;
let adLoaded = false;

const CATEGORIES = {
  TERRESTRIAL: 'terrestrial',
  ASTRO: 'astro',
  SUKAN: 'sukan',
  BERITA: 'berita',
  HIBURAN: 'hiburan',
  ISLAMIK: 'islamik'
};

// --- Initialization ---
async function init() {
  try {
    console.log('📺 TV Malaysia Online Initializing...');
    
    // Check required DOM elements
    if (!$('#cards')) {
      console.error('❌ Cards container not found');
      return;
    }
    
    if (!$('#playerModal')) {
      console.warn('⚠️ Player modal not found');
    }
    
    await loadChannels();
    updateHeroStats();
    populateCategoryFilter();
    renderChannelCards(CHANNELS);
    setupEventListeners();
    setupTelegramButton();
    
    console.log('✅ TV Malaysia Online ready!');
  } catch (err) {
    console.error('Initialization error:', err);
    showError('Gagal memuat aplikasi. Sila refresh halaman.');
  }
}

// --- Load channels ---
async function loadChannels() {
  try {
    const res = await fetch('data/events.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    CHANNELS = await res.json();

    CHANNELS.forEach(channel => {
      CHANNELS_MAP.set(channel.id, channel);
      
      // Simulate live status (70% chance live)
      channel.isLive = Math.random() > 0.3;
      channel.viewers = Math.floor(Math.random() * 10000) + 1000;
      
      // Set current program
      const programs = [
        'Berita Utama',
        'Drama Melayu',
        'Sukan Live',
        'Hiburan Malam',
        'Rancangan Agama',
        'Filem Terkini',
        'Berita Sukan',
        'Hiburan Keluarga'
      ];
      channel.currentProgram = programs[Math.floor(Math.random() * programs.length)];
    });
    
    console.log(`✅ Loaded ${CHANNELS.length} TV channels`);
  } catch (err) {
    console.error('Failed to load channels:', err);
    CHANNELS = [];
    CHANNELS_MAP.clear();
  }
}

// --- Update hero section stats ---
function updateHeroStats() {
  const totalChannels = CHANNELS.length;
  const liveChannels = CHANNELS.filter(c => c.isLive).length;
  
  $('#totalChannels').textContent = totalChannels;
  $('#liveNow').textContent = liveChannels;
  $('#footer-total-channels').textContent = totalChannels;
  $('#footer-live-channels').textContent = liveChannels;
}

// --- Populate category filter ---
function populateCategoryFilter() {
  const categorySelect = $('#filterCategory');
  if (!categorySelect) return;
  
  // Clear default options
  while (categorySelect.options.length > 1) {
    categorySelect.remove(1);
  }
  
  // Add category options
  const categories = [
    { value: 'terrestrial', label: 'TV Terrestrial' },
    { value: 'astro', label: 'Astro' },
    { value: 'sukan', label: 'Sukan' },
    { value: 'berita', label: 'Berita' },
    { value: 'hiburan', label: 'Hiburan' },
    { value: 'islamik', label: 'Islamik' }
  ];
  
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.value;
    option.textContent = category.label;
    categorySelect.appendChild(option);
  });
}

// --- Render channel cards ---
function renderChannelCards(channels) {
  const container = $('#cards');
  if (!container) {
    console.error('Cards container not found');
    return;
  }
  
  if (!channels || channels.length === 0) {
    $('#noResults').classList.remove('hidden');
    container.innerHTML = '';
    return;
  }
  
  $('#noResults').classList.add('hidden');
  
  // Sort channels: live first, then by name
  channels.sort((a, b) => {
    if (a.isLive !== b.isLive) return b.isLive - a.isLive;
    return a.name.localeCompare(b.name);
  });
  
  const cardsHTML = channels.map(createChannelCardHTML).join('');
  container.innerHTML = cardsHTML;
  
  attachCardButtonListeners(container);
  
  // DEBUG: Log button count
  const watchButtons = container.querySelectorAll('.watch-btn');
  console.log(`🎯 Rendered ${watchButtons.length} Watch buttons`);
}

// --- Create channel card HTML ---
function createChannelCardHTML(channel) {
  const isLive = channel.isLive;
  const statusClass = isLive ? 'status-live' : 'status-offline';
  const statusText = isLive ? 'Live Sekarang' : 'Offline';
  
  return `
    <article class="channel-card" data-id="${channel.id}" data-category="${channel.category}">
      <div class="channel-header">
        <div class="channel-category-badge">${getCategoryName(channel.category)}</div>
        <div class="channel-quality">${channel.quality}</div>
      </div>
      
      <div class="channel-logo-container">
        <img src="${escapeHTML(channel.logo)}" 
             alt="${escapeHTML(channel.name)} Logo" 
             class="channel-logo"
             loading="lazy"
             onerror="this.src='https://via.placeholder.com/120/1a1f2e/8a94b3?text=${encodeURIComponent(channel.name.substring(0,3).toUpperCase())}'">
      </div>
      
      <div class="channel-info">
        <h3 class="channel-name">${escapeHTML(channel.name)}</h3>
        <p class="channel-desc">${escapeHTML(channel.description.substring(0,60))}...</p>
        
        <div class="channel-meta">
          <span class="meta-language">${escapeHTML(channel.language)}</span>
          <span class="meta-type">${escapeHTML(channel.type)}</span>
        </div>
      </div>
      
      <div class="channel-footer">
        <div class="channel-status ${statusClass}">
          <span class="status-dot"></span>
          ${statusText}
          ${isLive ? `<span class="viewer-count">👤 ${channel.viewers.toLocaleString()}</span>` : ''}
        </div>
        <button class="btn btn-primary watch-btn" data-id="${channel.id}">
          <span class="btn-icon">▶</span>
          ${isLive ? 'Tonton Live' : 'Tonton'}
        </button>
      </div>
    </article>
  `;
}

// --- Get category display name ---
function getCategoryName(category) {
  const categoryMap = {
    'terrestrial': 'TV Terrestrial',
    'astro': 'Astro',
    'sukan': 'Sukan',
    'berita': 'Berita',
    'hiburan': 'Hiburan',
    'islamik': 'Islamik'
  };
  return categoryMap[category] || category;
}

// --- Escape HTML for safety ---
function escapeHTML(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// --- Attach card button listeners ---
function attachCardButtonListeners(container) {
  if (!container) return;
  
  // Watch buttons
  container.querySelectorAll('.watch-btn').forEach(btn => {
    btn.addEventListener('click', onWatchClick);
  });
  
  // Category buttons
  container.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', onCategoryClick);
  });
}

// --- Handle watch button click ---
function onWatchClick(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const id = e.currentTarget.dataset.id;
  const channel = CHANNELS_MAP.get(id);
  
  if (!channel) {
    console.warn('Channel not found:', id);
    return;
  }
  
  console.log('📺 Watch clicked for:', channel.name);
  
  // Check if player modal exists
  if (!$('#playerModal')) {
    console.warn('⚠️ Player modal not found');
    if (channel.streams && channel.streams.length > 0) {
      window.open(channel.streams[0].url, '_blank');
    }
    return;
  }
  
  openPlayerModal(channel);
}

// --- Handle category button click ---
function onCategoryClick(e) {
  const category = e.currentTarget.dataset.category;
  const categorySelect = $('#filterCategory');
  
  if (categorySelect) {
    categorySelect.value = category;
    applyFilters();
  }
}

// --- Open player modal ---
function openPlayerModal(channel) {
  if (!channel) return;
  
  console.log('🎥 Opening player modal for:', channel.name);
  
  // Reset ad loaded flag
  adLoaded = false;
  
  // Check if modal exists
  const playerModal = $('#playerModal');
  if (!playerModal) {
    console.error('❌ Player modal not found');
    showError('Player interface tidak tersedia. Sila refresh halaman.');
    return;
  }
  
  currentChannel = channel;

  // Update modal header
  $('#player-channel-name').textContent = channel.name;
  $('#player-channel-category').textContent = getCategoryName(channel.category);
  $('#player-now-playing').textContent = `Sedang Main: ${channel.currentProgram}`;

  const playerContainer = $('#playerContainer');
  const loader = $('#playerLoader');
  
  if (playerContainer) {
    playerContainer.innerHTML = '';
  }
  
  if (loader) {
    loader.classList.remove('hidden');
  }

  // Update channel info
  updateChannelInfo(channel);

  // Setup stream buttons
  setupStreamButtons(channel);

  // Load Adsterra banner
  setTimeout(() => {
    loadAdsterraBanner();
  }, 100);

  // Show modal
  playerModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  
  console.log('✅ Player modal opened');
}

// --- Update channel info in modal ---
function updateChannelInfo(channel) {
  const descriptionEl = $('#channel-description');
  const languageEl = $('#channel-language');
  const qualityEl = $('#channel-quality');
  const typeEl = $('#channel-type');
  
  if (descriptionEl) descriptionEl.textContent = channel.description;
  if (languageEl) languageEl.textContent = `Bahasa: ${channel.language}`;
  if (qualityEl) qualityEl.textContent = `Kualiti: ${channel.quality}`;
  if (typeEl) typeEl.textContent = `Jenis: ${channel.type}`;
}

// --- Setup stream buttons ---
function setupStreamButtons(channel) {
  const streamButtons = $('#streamButtons');
  if (!streamButtons) return;
  
  streamButtons.innerHTML = '';
  
  if (Array.isArray(channel.streams) && channel.streams.length > 0) {
    channel.streams.forEach((stream, index) => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-secondary';
      btn.type = 'button';
      btn.textContent = stream.label || `Stream ${index + 1}`;
      btn.dataset.url = stream.url;
      btn.setAttribute('aria-pressed', 'false');
      
      btn.addEventListener('click', () => {
        setActiveStreamButton(btn);
        loadStream(stream.url);
      });
      
      streamButtons.appendChild(btn);
    });
    
    const firstBtn = streamButtons.querySelector('.btn');
    if (firstBtn) {
      setActiveStreamButton(firstBtn);
      loadStream(firstBtn.dataset.url);
    }
  } else {
    // No streams available
    const playerContainer = $('#playerContainer');
    if (playerContainer) {
      playerContainer.innerHTML = `
        <div style="text-align:center;padding:40px;color:var(--text-muted);">
          <div style="font-size:48px;margin-bottom:20px;">📺</div>
          <h4 style="margin-bottom:10px;">Tiada stream tersedia</h4>
          <p>Stream untuk channel ini tidak tersedia buat masa ini.</p>
        </div>
      `;
    }
    const loader = $('#playerLoader');
    if (loader) loader.classList.add('hidden');
  }
}

// --- Set active stream button ---
function setActiveStreamButton(button) {
  $$('.stream-buttons .btn').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-pressed', 'false');
  });
  
  if (button) {
    button.classList.add('active');
    button.setAttribute('aria-pressed', 'true');
  }
}

// --- Load stream ---
function loadStream(url) {
  if (!url) return;
  currentStreamUrl = url;

  const playerContainer = $('#playerContainer');
  const loader = $('#playerLoader');
  const refreshBtn = $('#refreshCurrentStream');

  if (!playerContainer) return;

  if (loader) loader.classList.remove('hidden');
  if (refreshBtn) refreshBtn.disabled = true;

  const old = playerContainer.querySelector('iframe');
  if (old) old.remove();

  const cacheBuster = `_t=${Date.now()}`;
  const separator = url.includes('?') ? '&' : '?';
  const src = `${url}${separator}${cacheBuster}`;

  const iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
  iframe.allowFullscreen = true;
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.style.opacity = '0';
  iframe.style.transition = 'opacity 0.25s ease';

  iframe.addEventListener('load', () => {
    iframe.style.opacity = '1';
    if (loader) loader.classList.add('hidden');
    if (refreshBtn) refreshBtn.disabled = false;
  }, { once: true });

  playerContainer.appendChild(iframe);

  // Fallback: hide loader after 5 seconds
  setTimeout(() => {
    if (loader && !loader.classList.contains('hidden')) {
      loader.classList.add('hidden');
      if (refreshBtn) refreshBtn.disabled = false;
    }
  }, 5000);
}

// --- Close player modal ---
function closePlayerModal() {
  $('#playerModal').classList.add('hidden');
  document.body.style.overflow = 'auto';

  const playerContainer = $('#playerContainer');
  const iframe = playerContainer.querySelector('iframe');
  if (iframe) {
    iframe.src = '';
    iframe.remove();
  }
  
  currentChannel = null;
  currentStreamUrl = null;
}

// --- Apply filters ---
function applyFilters() {
  const categoryFilter = $('#filterCategory')?.value || 'all';
  const statusFilter = $('#filterStatus')?.value || 'all';
  const searchQuery = ($('#search')?.value || '').trim().toLowerCase();

  let filtered = CHANNELS.slice();

  if (categoryFilter !== 'all') {
    filtered = filtered.filter(channel => channel.category === categoryFilter);
  }

  if (statusFilter !== 'all') {
    if (statusFilter === 'live') {
      filtered = filtered.filter(channel => channel.isLive);
    } else if (statusFilter === '24h') {
      filtered = filtered.filter(channel => channel.type === '24h');
    }
  }

  if (searchQuery) {
    filtered = filtered.filter(channel => {
      return channel.name.toLowerCase().includes(searchQuery) ||
             channel.description.toLowerCase().includes(searchQuery) ||
             channel.category.toLowerCase().includes(searchQuery);
    });
  }

  renderChannelCards(filtered);
}

// --- Setup event listeners ---
function setupEventListeners() {
  console.log('🔧 Setting up event listeners...');
  
  // Search input
  const searchInput = $('#search');
  let searchTimeout = null;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(applyFilters, 250);
    });
  }

  // Clear search
  $('#clearSearch')?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    applyFilters();
  });

  // Filter change
  $('#filterCategory')?.addEventListener('change', applyFilters);
  $('#filterStatus')?.addEventListener('change', applyFilters);

  // Menu toggle
  $('#menuToggle')?.addEventListener('click', () => {
    $('#filters')?.classList.toggle('open');
  });

  // Close modal buttons
  $('#closePlayerModal')?.addEventListener('click', closePlayerModal);

  // Modal overlay click
  $$('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        if (modal.id === 'playerModal') closePlayerModal();
      }
    });
  });

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!$('#playerModal').classList.contains('hidden')) closePlayerModal();
    }
  });

  // Refresh stream button
  $('#refreshCurrentStream')?.addEventListener('click', refreshCurrentStream);
  
  // Category buttons
  $$('.category-btn').forEach(btn => {
    btn.addEventListener('click', onCategoryClick);
  });

  console.log('✅ Event listeners setup complete');
}

// --- Refresh current stream ---
function refreshCurrentStream() {
  if (!currentChannel || !currentStreamUrl) {
    console.warn('No current channel or stream URL to refresh');
    return;
  }
  
  const refreshBtn = $('#refreshCurrentStream');
  const playerContainer = $('#playerContainer');
  const loader = $('#playerLoader');
  
  if (!refreshBtn || !playerContainer) return;
  
  // Show loading state
  refreshBtn.classList.add('loading');
  refreshBtn.disabled = true;
  refreshBtn.innerHTML = '<span class="btn-icon">⏳</span> Refreshing...';
  
  if (loader) loader.classList.remove('hidden');
  
  // Hide current iframe
  const oldIframe = playerContainer.querySelector('iframe');
  if (oldIframe) {
    oldIframe.style.opacity = '0.3';
  }
  
  // Reload channel data
  loadChannels().then(() => {
    const updatedChannel = CHANNELS.find(c => c.id === currentChannel.id);
    if (updatedChannel) {
      currentChannel = updatedChannel;
      
      // Update modal content
      $('#player-now-playing').textContent = `Sedang Main: ${updatedChannel.currentProgram}`;
      updateChannelInfo(updatedChannel);
    }
    
    // Refresh stream
    const iframe = playerContainer.querySelector('iframe');
    if (iframe) {
      const baseUrl = currentStreamUrl.split('?')[0];
      const separator = baseUrl.includes('?') ? '&' : '?';
      const newUrl = `${baseUrl}${separator}_t=${Date.now()}`;
      iframe.src = newUrl;
    }
    
    console.log('✅ Stream refreshed');
  }).catch(err => {
    console.error('Failed to refresh stream:', err);
  }).finally(() => {
    // Reset button state after 2 seconds
    setTimeout(() => {
      refreshBtn.classList.remove('loading');
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = '<span class="btn-icon">🔄</span> Refresh';
    }, 2000);
  });
}

// --- Load Adsterra banner ---
function loadAdsterraBanner() {
  if (adLoaded) return;
  
  const container = document.getElementById('adsterra-banner-728x90');
  if (!container) return;
  
  // Clear container
  container.innerHTML = '';
  
  // Create script element
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.innerHTML = `
    atOptions = {
      'key' : '6cbe6f51f75544035b319bfb444712e9',
      'format' : 'iframe',
      'height' : 90,
      'width' : 728,
      'params' : {}
    };
  `;
  
  const script2 = document.createElement('script');
  script2.type = 'text/javascript';
  script2.src = '//www.highperformanceformat.com/6cbe6f51f75544035b319bfb444712e9/invoke.js';
  script2.async = true;
  
  container.appendChild(script);
  container.appendChild(script2);
  
  adLoaded = true;
  console.log('✅ Adsterra banner loaded');
}

// --- Setup Telegram button ---
function setupTelegramButton() {
  const telegramFloat = $('#telegramFloat');
  const telegramAnchor = document.querySelector('#telegramFloat .telegram-btn');
  
  if (!telegramFloat) return;
  
  const isHidden = localStorage.getItem('telegramHidden') === 'true';
  if (isHidden) telegramFloat.style.display = 'none';
  
  if (telegramAnchor) telegramAnchor.style.pointerEvents = 'auto';
}

// --- Show error ---
function showError(message) {
  const container = $('#cards');
  if (!container) return;
  
  container.innerHTML = `
    <div style="text-align:center;padding:60px 20px;">
      <div style="font-size:60px;margin-bottom:20px;">⚠️</div>
      <h3 style="margin-bottom:10px;">Ralat berlaku</h3>
      <p style="margin-bottom:30px;">${escapeHTML(message)}</p>
      <button id="reloadBtn" class="btn btn-primary">Muat Semula Halaman</button>
    </div>
  `;
  
  $('#reloadBtn')?.addEventListener('click', () => location.reload());
}

// --- Initialize ---
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Debug functions
window.debugChannels = () => console.log('Channels:', CHANNELS);
window.debugButtons = () => {
  const watchButtons = $$('.watch-btn');
  console.log(`Found ${watchButtons.length} Watch buttons`);
};

// Di app.js - tambahkan cache control
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
