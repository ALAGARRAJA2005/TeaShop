/**
 * ZENITH — Interactive Web Application Logic
 * Ties together Three.js 3D WebGL stage, Web Audio synthesis, 3D tilt cards,
 * HUD telemetry, Brew Lab customizer, and Tasting Flight tray.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize 3D WebGL Stage
  const stage = window.initZenith3DStage('three-canvas-container');

  // DOM Elements - HUD & Scene Switching
  const sceneHeroTitle = document.getElementById('scene-hero-title');
  const sceneHeroDesc = document.getElementById('scene-hero-desc');
  const heroPrimaryAction = document.getElementById('hero-primary-action');
  const heroActionText = document.getElementById('hero-action-text');
  const actionTriggerBtn = document.getElementById('action-trigger-btn');
  const actionBtnLabel = document.getElementById('action-btn-label');
  const actionPourBtn = document.getElementById('action-pour-btn');
  const pourBtnLabel = document.getElementById('pour-btn-label');
  const scenePillBtns = document.querySelectorAll('.scene-pill-btn');
  const feastBanner = document.getElementById('feast-banner');

  // Telemetry Elements
  const telemetryTemp = document.getElementById('telemetry-temp');
  const telemetryTempBar = document.getElementById('telemetry-temp-bar');
  const telemetryExtract = document.getElementById('telemetry-extract');
  const telemetrySteam = document.getElementById('telemetry-steam');
  const telemetryTimer = document.getElementById('telemetry-timer');

  // Scene metadata
  const sceneData = {
    tea: {
      title: "The Perfect<br>Tea Drop",
      desc: "Witness fluid physics in high fidelity. Golden droplets cascade into ceramic celadon, forming hypnotic concentric ripples and aromatic steam.",
      actionText: "Drop Tea Bead",
      pourText: "Continuous Stream",
      temp: "88°C",
      tempPct: "82%",
      extract: "94.2%",
      steam: "Optimal",
      timer: "00:45"
    },
    coffee: {
      title: "Artisan Coffee<br>Craft",
      desc: "Precision extraction in motion. Watch roasted beans tumble, dark espresso stream through the V60 dripper, and rich golden crema swirl.",
      actionText: "Brew Espresso Shot",
      pourText: "Pour Kettle Stream",
      temp: "94°C",
      tempPct: "92%",
      extract: "98.5%",
      steam: "Dense",
      timer: "02:15"
    },
    rice: {
      title: "Steaming Rice<br>& Tea Ready",
      desc: "The warmth of the hearth. Freshly steamed Koshihikari pearl rice reveals billowing clouds of hot steam and pair of chopsticks beside ceremonial tea.",
      actionText: "Lift Lid / Feast Ready!",
      pourText: "Steam Intensity",
      temp: "99°C",
      tempPct: "99%",
      extract: "100%",
      steam: "Billowing",
      timer: "Ready"
    }
  };

  let currentSceneKey = 'tea';
  let isPourActive = false;

  // Scene Switch Handler
  function setScene(sceneKey) {
    currentSceneKey = sceneKey;
    const data = sceneData[sceneKey];
    if (!data) return;

    // Update 3D Stage
    if (stage) {
      stage.switchScene(sceneKey);
    }

    // Update Pill Buttons
    scenePillBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.scene === sceneKey);
    });

    // Update Text Content with GSAP fade
    if (window.gsap) {
      gsap.fromTo([sceneHeroTitle, sceneHeroDesc],
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 }
      );
    }

    sceneHeroTitle.innerHTML = data.title;
    sceneHeroDesc.innerHTML = data.desc;
    heroActionText.textContent = data.actionText;
    actionBtnLabel.textContent = data.actionText;
    pourBtnLabel.textContent = data.pourText;

    // Update Telemetry
    telemetryTemp.textContent = data.temp;
    telemetryTempBar.style.width = data.tempPct;
    telemetryExtract.textContent = data.extract;
    telemetrySteam.textContent = data.steam;
    telemetryTimer.textContent = data.timer;

    if (window.zenithAudio) {
      window.zenithAudio.playClick();
    }
  }

  scenePillBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      setScene(btn.dataset.scene);
    });
  });

  // Action Button Handlers (Hero & Action Bar)
  function handleTriggerAction() {
    if (window.zenithAudio) window.zenithAudio.init();

    if (currentSceneKey === 'tea') {
      stage.triggerTeaDrop();
    } else if (currentSceneKey === 'coffee') {
      stage.triggerCoffeeBrew();
    } else if (currentSceneKey === 'rice') {
      stage.triggerRiceReady();

      // Show celebratory feast banner
      feastBanner.style.display = 'block';
      setTimeout(() => {
        feastBanner.style.display = 'none';
      }, 5000);
    }
  }

  heroPrimaryAction.addEventListener('click', handleTriggerAction);
  actionTriggerBtn.addEventListener('click', handleTriggerAction);

  // Continuous Pour Handler
  actionPourBtn.addEventListener('click', () => {
    if (window.zenithAudio) window.zenithAudio.init();

    isPourActive = !isPourActive;
    actionPourBtn.classList.toggle('active', isPourActive);

    if (currentSceneKey === 'tea') {
      stage.toggleContinuousTeaPour(isPourActive);
    } else if (currentSceneKey === 'coffee') {
      stage.coffeeStreamMesh.visible = isPourActive;
      if (isPourActive) {
        window.zenithAudio.startPourSound();
        window.zenithAudio.startSteamHiss(0.2);
      } else {
        window.zenithAudio.stopPourSound();
        window.zenithAudio.stopSteamHiss();
      }
    } else if (currentSceneKey === 'rice') {
      if (isPourActive) {
        stage.triggerRiceReady();
        feastBanner.style.display = 'block';
      } else {
        stage.resetRiceLid();
        feastBanner.style.display = 'none';
      }
    }
  });

  // Camera Presets Buttons
  const camBtns = document.querySelectorAll('.cam-btn');
  camBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      camBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const preset = btn.dataset.camera;
      if (stage) {
        stage.setCameraPreset(preset);
      }
      if (window.zenithAudio) window.zenithAudio.playClick();
    });
  });

  // 3D Lighting Mood Presets Buttons
  const moodBtns = document.querySelectorAll('.mood-btn');
  moodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      moodBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mood = btn.dataset.lighting;
      if (stage && stage.setLightingMood) {
        stage.setLightingMood(mood);
      }
      if (window.zenithAudio) window.zenithAudio.playClick();
    });
  });

  // Dynamic Cursor Light Tracking across 3D canvas
  window.addEventListener('mousemove', (e) => {
    const normX = (e.clientX / window.innerWidth) * 2 - 1;
    const normY = (e.clientY / window.innerHeight) * 2 - 1;
    if (stage && stage.updateCursorLighting) {
      stage.updateCursorLighting(normX, normY);
    }
  });

  // ========================================================================
  // SOUNDSCAPE ENGINE & VISUALIZER
  // ========================================================================
  const soundBtn = document.getElementById('sound-btn');
  const soundText = document.getElementById('sound-text');
  const soundBars = document.getElementById('sound-bars');
  let soundRunning = false;

  soundBtn.addEventListener('click', () => {
    if (!soundRunning) {
      window.zenithAudio.init();
      soundRunning = true;
    }
    const isUnmuted = window.zenithAudio.toggleMute();
    soundText.textContent = isUnmuted ? "Cafe Music On" : "Cafe Music Muted";
    soundBars.classList.toggle('sound-active', isUnmuted);
  });

  // ========================================================================
  // COFFEE SHOP AMBIENCE MIXER CONTROLS
  // ========================================================================
  const mixerBtn = document.getElementById('mixer-btn');
  const soundMixerModal = document.getElementById('sound-mixer-modal');
  const lofiVolSlider = document.getElementById('lofi-vol-slider');
  const lofiVolText = document.getElementById('lofi-vol-text');
  const vinylVolSlider = document.getElementById('vinyl-vol-slider');
  const vinylVolText = document.getElementById('vinyl-vol-text');
  const baristaVolSlider = document.getElementById('barista-vol-slider');
  const baristaVolText = document.getElementById('barista-vol-text');

  if (mixerBtn && soundMixerModal) {
    mixerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      soundMixerModal.classList.toggle('open');
      if (themeModal) themeModal.classList.remove('open');
    });

    document.addEventListener('click', (e) => {
      if (!soundMixerModal.contains(e.target) && e.target !== mixerBtn) {
        soundMixerModal.classList.remove('open');
      }
    });

    if (lofiVolSlider) {
      lofiVolSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        lofiVolText.textContent = `${val}%`;
        window.zenithAudio.setMusicVolume(val / 100);
      });
    }

    if (vinylVolSlider) {
      vinylVolSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        vinylVolText.textContent = `${val}%`;
        window.zenithAudio.setVinylVolume(val / 100);
      });
    }

    if (baristaVolSlider) {
      baristaVolSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        baristaVolText.textContent = `${val}%`;
        window.zenithAudio.setBaristaVolume(val / 100);
      });
    }
  }

  // Mobile Navigation Drawer Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileNavDrawer = document.getElementById('mobile-nav-drawer');
  const mobileNavClose = document.getElementById('mobile-nav-close');
  const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  function openMobileNav() {
    if (mobileNavDrawer) mobileNavDrawer.classList.add('open');
    if (mobileNavOverlay) mobileNavOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileNav() {
    if (mobileNavDrawer) mobileNavDrawer.classList.remove('open');
    if (mobileNavOverlay) mobileNavOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileNav);
  if (mobileNavClose) mobileNavClose.addEventListener('click', closeMobileNav);
  if (mobileNavOverlay) mobileNavOverlay.addEventListener('click', closeMobileNav);
  mobileNavLinks.forEach(link => link.addEventListener('click', closeMobileNav));

  // Live Atelier Ticker Dismiss & Smooth Rotation
  const tickerDismissBtn = document.getElementById('ticker-dismiss-btn');
  const liveAtelierTicker = document.getElementById('live-atelier-ticker');
  if (tickerDismissBtn && liveAtelierTicker) {
    tickerDismissBtn.addEventListener('click', () => {
      liveAtelierTicker.classList.add('dismissed');
    });
  }

  const liveTickerText = document.getElementById('live-ticker-text');
  if (liveTickerText) {
    const liveUpdates = [
      "Master Alagar is brewing South Indian Degree Filter Coffee at the counter • Call +91 9600470133 for VIP Reservations",
      "Fresh batch of A2 Ghee Podi Steamed Basmati Rice is Ready • Royal Kashmiri Kahwa is steeping in copper samovar",
      "Kyoto Single-Estate Uji Matcha whisked fresh for table #4 • Stone Ground 1st Harvest",
      "Niigata Koshihikari Pearl Donburi served with steaming Genmaicha tea broth • Atelier counter open",
      "Mysore Nugget Extra Bold Espresso extracted with tiger-stripe crema • Third-wave roast by Alagar"
    ];
    let tickerIdx = 0;
    setInterval(() => {
      tickerIdx = (tickerIdx + 1) % liveUpdates.length;
      if (window.gsap) {
        gsap.to(liveTickerText, {
          opacity: 0,
          y: -6,
          duration: 0.35,
          onComplete: () => {
            liveTickerText.textContent = liveUpdates[tickerIdx];
            gsap.to(liveTickerText, { opacity: 1, y: 0, duration: 0.45 });
          }
        });
      } else {
        liveTickerText.textContent = liveUpdates[tickerIdx];
      }
    }, 8500);
  }

  // ========================================================================
  // THEME SWITCHER
  // ========================================================================
  const themeBtn = document.getElementById('theme-btn');
  const themeModal = document.getElementById('theme-modal');
  const themeOptBtns = document.querySelectorAll('.theme-opt-btn');

  themeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    themeModal.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!themeModal.contains(e.target) && e.target !== themeBtn) {
      themeModal.classList.remove('open');
    }
  });

  themeOptBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.setTheme;
      document.documentElement.setAttribute('data-theme', theme);
      themeOptBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      themeModal.classList.remove('open');

      if (window.zenithAudio) window.zenithAudio.playClick();
    });
  });

  // ========================================================================
  // CRAFT STUDIO / THE BREW & HEARTH LAB
  // ========================================================================
  const sliderTemp = document.getElementById('slider-temp');
  const sliderTempVal = document.getElementById('slider-temp-val');
  const sliderTime = document.getElementById('slider-time');
  const sliderTimeVal = document.getElementById('slider-time-val');
  const sliderSteam = document.getElementById('slider-steam');
  const sliderSteamVal = document.getElementById('slider-steam-val');
  const craftTabBtns = document.querySelectorAll('.craft-tab-btn');
  const blendPills = document.querySelectorAll('#blend-pills .flavor-tag');

  const tastingCardName = document.getElementById('tasting-card-name');
  const tastingCardDesc = document.getElementById('tasting-card-desc');
  const meterSweet = document.getElementById('meter-sweet');
  const barSweet = document.getElementById('bar-sweet');
  const meterAroma = document.getElementById('meter-aroma');
  const barAroma = document.getElementById('bar-aroma');
  const meterBody = document.getElementById('meter-body');
  const barBody = document.getElementById('bar-body');

  const craftProfiles = {
    matcha: {
      name: "Spring Mist Uji Gyokuro",
      desc: "Shade-grown under bamboo straw mats for 21 days to preserve delicate L-theanine amino acids and intense sweet umami notes.",
      sweet: "92%",
      aroma: "88%",
      body: "75%",
      color: 0x6a8e45
    },
    oolong: {
      name: "Roasted Iron Goddess Oolong",
      desc: "Slow charcoal-fired over longan wood. Deep toasted hazelnut aroma with persistent honey orchid sweetness.",
      sweet: "78%",
      aroma: "96%",
      body: "89%",
      color: 0xb28938
    },
    jasmine: {
      name: "Silver Needle Jasmine Blossom",
      desc: "Plucked in dawn fog and scented seven times with night-blooming jasmine flowers for pure ethereal fragrance.",
      sweet: "84%",
      aroma: "99%",
      body: "62%",
      color: 0xccd59b
    },
    earlgrey: {
      name: "Royal Bergamot Single-Estate",
      desc: "Cold-pressed Calabrian bergamot infused into rich Ceylon black tea. Bright citrus peel fragrance with amber body.",
      sweet: "70%",
      aroma: "91%",
      body: "94%",
      color: 0x7f4f24
    }
  };

  sliderTemp.addEventListener('input', (e) => {
    sliderTempVal.textContent = `${e.target.value}°C`;
    telemetryTemp.textContent = `${e.target.value}°C`;
    telemetryTempBar.style.width = `${((e.target.value - 70) / 28) * 100}%`;
  });

  sliderTime.addEventListener('input', (e) => {
    sliderTimeVal.textContent = `${e.target.value} sec`;
  });

  sliderSteam.addEventListener('input', (e) => {
    sliderSteamVal.textContent = `${e.target.value}%`;
  });

  blendPills.forEach(pill => {
    pill.addEventListener('click', () => {
      blendPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const blendKey = pill.dataset.blend;
      const profile = craftProfiles[blendKey];
      if (profile) {
        tastingCardName.textContent = profile.name;
        tastingCardDesc.textContent = profile.desc;
        meterSweet.textContent = profile.sweet;
        barSweet.style.width = profile.sweet;
        meterAroma.textContent = profile.aroma;
        barAroma.style.width = profile.aroma;
        meterBody.textContent = profile.body;
        barBody.style.width = profile.body;

        if (stage) {
          stage.setTeaBlendColor(profile.color);
        }
      }
      if (window.zenithAudio) window.zenithAudio.playClick();
    });
  });

  craftTabBtns.forEach(tab => {
    tab.addEventListener('click', () => {
      craftTabBtns.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const mode = tab.dataset.craftMode;
      setScene(mode);
    });
  });

  // ========================================================================
  // 3D TILT CARDS & MENU
  // ========================================================================
  const tiltCards = document.querySelectorAll('.tilt-card');
  const menuFilterBtns = document.querySelectorAll('.menu-filter-btn');

  // 3D Tilt calculation on mousemove
  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -12; // tilt up/down
      const rotateY = ((x - centerX) / centerX) * 12;  // tilt left/right

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

      // Update glare position
      card.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
      card.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });
  });

  // ========================================================================
  // CAROUSEL & GRID VIEW CONTROLLER
  // ========================================================================
  const viewCarouselBtn = document.getElementById('view-carousel-btn');
  const viewGridBtn = document.getElementById('view-grid-btn');
  const menuGrid = document.getElementById('menu-grid');
  const carouselNavControls = document.getElementById('carousel-nav-controls');
  const carouselPrevBtn = document.getElementById('carousel-prev-btn');
  const carouselNextBtn = document.getElementById('carousel-next-btn');
  const carouselIndicatorText = document.getElementById('carousel-indicator-text');

  function updateCarouselIndicator() {
    if (!menuGrid || !carouselIndicatorText) return;
    const visibleCards = Array.from(tiltCards).filter(c => c.style.display !== 'none');
    const total = visibleCards.length;
    if (total === 0) {
      carouselIndicatorText.textContent = '0 / 0';
      return;
    }
    const scrollLeft = menuGrid.scrollLeft;
    const firstCard = visibleCards[0];
    const cardWidth = firstCard ? firstCard.offsetWidth : 340;
    const gap = 24;
    const currentIdx = Math.min(Math.round(scrollLeft / (cardWidth + gap)) + 1, total);
    carouselIndicatorText.textContent = `${currentIdx} / ${total}`;
  }

  if (viewCarouselBtn && viewGridBtn && menuGrid) {
    viewCarouselBtn.addEventListener('click', () => {
      viewCarouselBtn.classList.add('active');
      viewGridBtn.classList.remove('active');
      menuGrid.classList.add('carousel-mode');
      if (carouselNavControls) carouselNavControls.style.display = 'flex';
      updateCarouselIndicator();
      if (window.zenithAudio) window.zenithAudio.playClick();
    });

    viewGridBtn.addEventListener('click', () => {
      viewGridBtn.classList.add('active');
      viewCarouselBtn.classList.remove('active');
      menuGrid.classList.remove('carousel-mode');
      if (carouselNavControls) carouselNavControls.style.display = 'none';
      if (window.zenithAudio) window.zenithAudio.playClick();
    });

    if (carouselPrevBtn) {
      carouselPrevBtn.addEventListener('click', () => {
        const visibleCards = Array.from(tiltCards).filter(c => c.style.display !== 'none');
        const cardWidth = visibleCards[0] ? visibleCards[0].offsetWidth : 340;
        menuGrid.scrollBy({ left: -(cardWidth + 24), behavior: 'smooth' });
        if (window.zenithAudio) window.zenithAudio.playClick();
      });
    }

    if (carouselNextBtn) {
      carouselNextBtn.addEventListener('click', () => {
        const visibleCards = Array.from(tiltCards).filter(c => c.style.display !== 'none');
        const cardWidth = visibleCards[0] ? visibleCards[0].offsetWidth : 340;
        menuGrid.scrollBy({ left: (cardWidth + 24), behavior: 'smooth' });
        if (window.zenithAudio) window.zenithAudio.playClick();
      });
    }

    menuGrid.addEventListener('scroll', () => {
      updateCarouselIndicator();
    }, { passive: true });

    // Initial indicator calculation
    updateCarouselIndicator();
  }

  // Filter Menu Cards
  menuFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      menuFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;

      tiltCards.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });

      if (menuGrid) menuGrid.scrollLeft = 0;
      updateCarouselIndicator();
      if (window.zenithAudio) window.zenithAudio.playClick();
    });
  });

  // ========================================================================
  // TASTING FLIGHT TRAY (CART) & RESERVATION
  // ========================================================================
  const cartToggleBtn = document.getElementById('cart-toggle-btn');
  const cartDrawer = document.getElementById('cart-drawer');
  const cartBackdrop = document.getElementById('cart-backdrop');
  const cartCloseBtn = document.getElementById('cart-close-btn');
  const cartItemsList = document.getElementById('cart-items-list');
  const cartSubtotal = document.getElementById('cart-subtotal');
  const cartCount = document.getElementById('cart-count');
  const addCustomBrewBtn = document.getElementById('add-custom-brew-btn');

  let cart = [];

  function openCart() {
    cartDrawer.classList.add('open');
    cartBackdrop.classList.add('open');
    if (window.zenithAudio) window.zenithAudio.playClick();
  }

  function closeCart() {
    cartDrawer.classList.remove('open');
    cartBackdrop.classList.remove('open');
  }

  cartToggleBtn.addEventListener('click', openCart);
  cartCloseBtn.addEventListener('click', closeCart);
  cartBackdrop.addEventListener('click', closeCart);

  function updateCartUI() {
    cartCount.textContent = cart.length;

    if (cart.length === 0) {
      cartItemsList.innerHTML = `
        <div style="text-align:center;color:var(--text-muted);padding-top:40px;">
          Your tasting flight is currently empty.<br>Add teas, coffees, or rice bowls from the menu!
        </div>
      `;
      cartSubtotal.textContent = "₹0.00";
      return;
    }

    let total = 0;
    cartItemsList.innerHTML = '';

    cart.forEach((item, index) => {
      total += item.price;
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <div>
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-price">₹${item.price.toFixed(0)}</div>
        </div>
        <button class="cart-item-remove" data-index="${index}">&times; Remove</button>
      `;
      cartItemsList.appendChild(row);
    });

    cartSubtotal.textContent = `₹${total.toFixed(0)}`;

    // Add remove listeners
    document.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        cart.splice(idx, 1);
        updateCartUI();
      });
    });
  }

  // Celebratory Confetti Particle Burst Function
  function triggerFlightConfetti(startX, startY) {
    if (!startX || !startY) return;
    const colors = ['#d4af37', '#7ca982', '#f4a261', '#ffd166', '#ffffff'];
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div');
      p.className = 'flight-confetti-particle';
      p.style.left = `${startX}px`;
      p.style.top = `${startY}px`;
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      document.body.appendChild(p);

      const angle = Math.random() * Math.PI * 2;
      const distance = 40 + Math.random() * 80;
      const destX = startX + Math.cos(angle) * distance;
      const destY = startY + Math.sin(angle) * distance - 25;

      if (window.gsap) {
        gsap.to(p, {
          x: destX - startX,
          y: destY - startY,
          opacity: 0,
          scale: 0.2,
          duration: 0.75 + Math.random() * 0.35,
          ease: "power2.out",
          onComplete: () => p.remove()
        });
      } else {
        setTimeout(() => p.remove(), 800);
      }
    }
  }

  function addToCart(name, priceStr, clickEvent) {
    const price = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 180;
    cart.push({ name, price });
    updateCartUI();
    openCart();

    if (clickEvent && clickEvent.clientX) {
      triggerFlightConfetti(clickEvent.clientX, clickEvent.clientY);
    }
    if (window.zenithAudio) window.zenithAudio.playWaterDrop(1.4);
  }

  // Hook Menu Add buttons
  document.querySelectorAll('.btn-add-flight').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.tilt-card');
      if (card) {
        addToCart(card.dataset.name, card.dataset.price, e);
      }
    });
  });

  // Add custom recipe from Craft Studio
  addCustomBrewBtn.addEventListener('click', (e) => {
    const name = `Bespoke ${tastingCardName.textContent}`;
    addToCart(name, "₹240", e);
  });

  // Reservation Modal
  const reserveBtn = document.getElementById('reserve-btn');
  const checkoutOrderBtn = document.getElementById('checkout-order-btn');
  const reservationModal = document.getElementById('reservation-modal');
  const reservationCloseBtn = document.getElementById('reservation-close-btn');
  const reservationForm = document.getElementById('reservation-form');

  function openReservation() {
    closeCart();
    reservationModal.classList.add('open');
    if (window.zenithAudio) window.zenithAudio.playClick();
  }

  function closeReservation() {
    reservationModal.classList.remove('open');
  }

  reserveBtn.addEventListener('click', openReservation);
  checkoutOrderBtn.addEventListener('click', openReservation);
  reservationCloseBtn.addEventListener('click', closeReservation);
  reservationModal.addEventListener('click', (e) => {
    if (e.target === reservationModal) closeReservation();
  });

  reservationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    closeReservation();
    if (window.zenithAudio) window.zenithAudio.playCelebrationChime();
    alert("✨ Your Atelier Counter Tasting reservation has been confirmed! Master Alagar and our team look forward to welcoming you.");
    cart = [];
    updateCartUI();
  });

  // Hook Master Alagar Book Session button
  const masterBookBtn = document.getElementById('master-book-btn');
  if (masterBookBtn) {
    masterBookBtn.addEventListener('click', () => {
      openReservation();
    });
  }

  // ========================================================================
  // INTERACTIVE CURSOR SPARK PARTICLES
  // ========================================================================
  let lastSparkTime = 0;
  window.addEventListener('mousemove', (e) => {
    const now = performance.now();
    if (now - lastSparkTime < 45) return; // throttle
    lastSparkTime = now;

    const spark = document.createElement('div');
    spark.className = 'cursor-spark-dot';
    spark.style.left = `${e.clientX}px`;
    spark.style.top = `${e.clientY}px`;
    spark.style.transform = `translate(-50%, -50%) scale(${0.6 + Math.random() * 0.8})`;
    document.body.appendChild(spark);

    if (window.gsap) {
      gsap.to(spark, {
        y: e.clientY - 18 - Math.random() * 15,
        x: e.clientX + (Math.random() - 0.5) * 20,
        opacity: 0,
        scale: 0.2,
        duration: 0.65,
        ease: "power1.out",
        onComplete: () => spark.remove()
      });
    } else {
      setTimeout(() => spark.remove(), 600);
    }
  });

  // ========================================================================
  // CORNER CARTOON TEA MAKER MASCOT (CHIBI ALAGAR TEA MAKER)
  // ========================================================================
  const cartoonMascot = document.getElementById('cartoon-mascot');
  const mascotFigure = document.getElementById('mascot-figure');
  const mascotMsg = document.getElementById('mascot-msg');
  const mascotMakeTeaBtn = document.getElementById('mascot-make-tea-btn');
  const mascotMinimizeBtn = document.getElementById('mascot-minimize-btn');
  const mascotMaximizeBtn = document.getElementById('mascot-maximize-btn');
  const mascotEyes = document.getElementById('mascot-eyes');
  const mascotMouth = document.getElementById('mascot-mouth');

  if (cartoonMascot) {
    let isMascotBrewing = false;

    const mascotDialogues = [
      "Vanakkam! Hot tea ready pannava? Click to brew with me! ✨",
      "Special Assam Cutting Chai aroma smells so fresh today! 🍵",
      "Tea pot ready-aa irukku! Click my teapot to pour tea! 🫖",
      "Master Alagar's Degree Filter Coffee is frothing hot! ☕",
      "Kashmiri Kahwa with saffron strands... want a sip? 🌸",
      "Direct orders or inquiries: Call Master Alagar at 9600470133! 📞"
    ];

    let dialogueIdx = 0;
    setInterval(() => {
      if (isMascotBrewing || cartoonMascot.classList.contains('minimized')) return;
      dialogueIdx = (dialogueIdx + 1) % mascotDialogues.length;
      if (window.gsap && mascotMsg) {
        gsap.to(mascotMsg, {
          opacity: 0,
          y: -4,
          duration: 0.3,
          onComplete: () => {
            mascotMsg.textContent = mascotDialogues[dialogueIdx];
            gsap.to(mascotMsg, { opacity: 1, y: 0, duration: 0.4 });
          }
        });
      } else if (mascotMsg) {
        mascotMsg.textContent = mascotDialogues[dialogueIdx];
      }
    }, 11000);

    // Make Tea Action Trigger
    const startMascotBrew = () => {
      if (isMascotBrewing) return;
      isMascotBrewing = true;
      cartoonMascot.classList.add('is-brewing');

      if (window.zenithAudio) {
        window.zenithAudio.init();
        window.zenithAudio.startPourSound();
        window.zenithAudio.startSteamHiss(0.18);
      }

      if (mascotMsg) {
        mascotMsg.textContent = "Pot tilting... Hot aromatic tea is pouring! 🍵✨";
      }

      // Happy curved eyes while brewing
      if (mascotEyes) {
        mascotEyes.style.transform = "scaleY(0.4)";
      }

      // After 2.5 seconds, finish brew!
      setTimeout(() => {
        if (window.zenithAudio) {
          window.zenithAudio.stopPourSound();
          window.zenithAudio.stopSteamHiss();
          window.zenithAudio.playCelebrationChime();
        }

        if (mascotMsg) {
          mascotMsg.textContent = "Aahaa! Super Hot Tea Ready! ☕ Enjoy pannunga! ✨";
        }

        // Happy smile and eye sparkles
        if (mascotEyes) {
          mascotEyes.style.transform = "scaleY(1)";
        }

        // Trigger celebratory sparkle confetti around the mascot
        const rect = mascotFigure.getBoundingClientRect();
        if (typeof triggerFlightConfetti === 'function') {
          triggerFlightConfetti(rect.left + 65, rect.top + 50);
        }

        // Reset to idle state after enjoying tea
        setTimeout(() => {
          cartoonMascot.classList.remove('is-brewing');
          isMascotBrewing = false;
        }, 3200);

      }, 2600);
    };

    if (mascotMakeTeaBtn) {
      mascotMakeTeaBtn.addEventListener('click', startMascotBrew);
    }
    if (mascotFigure) {
      mascotFigure.addEventListener('click', startMascotBrew);
    }

    // Minimize and Maximize Handlers
    if (mascotMinimizeBtn) {
      mascotMinimizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        cartoonMascot.classList.add('minimized');
        if (window.zenithAudio) window.zenithAudio.playClick();
      });
    }

    if (mascotMaximizeBtn) {
      mascotMaximizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        cartoonMascot.classList.remove('minimized');
        if (window.zenithAudio) window.zenithAudio.playClick();
      });
    }
  }
});
