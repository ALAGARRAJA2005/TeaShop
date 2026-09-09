/**
 * Zenith 3D WebGL Engine - Three.js Procedural 3D Stage
 * Features:
 * 1. Scene 1: The Perfect Tea Drop (Teapot, falling droplets, liquid surface ripples, volumetric steam, floating leaves)
 * 2. Scene 2: Artisan Coffee Craft (Gooseneck kettle, V60 dripper, double-walled carafe, falling beans, crema swirl, aroma steam)
 * 3. Scene 3: Steaming Rice & Tea Ready Feast (Ceremonial tray, Donburi bowl, lifting lid, fluffy rice & garnish, chopsticks, celebration particles)
 */

class Zenith3DStage {
  constructor(canvasContainerId) {
    this.container = document.getElementById(canvasContainerId);
    if (!this.container) {
      console.error("Canvas container not found:", canvasContainerId);
      return;
    }

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.clock = new THREE.Clock();

    // Scene Groups
    this.stageGroup = null;
    this.teaGroup = null;
    this.coffeeGroup = null;
    this.riceGroup = null;

    this.currentScene = 'tea'; // 'tea', 'coffee', 'rice'
    this.isPouringTea = false;
    this.isBrewingCoffee = false;
    this.isRiceReady = false;
    this.isLidOpen = false;

    // Animation Objects & States
    this.teaDropMesh = null;
    this.teaDropY = 0;
    this.teaDropVy = 0;
    this.teaLiquidMesh = null;
    this.teaRipples = []; // Active ripple rings { radius, alpha, speed, maxRadius }
    this.teaSteamParticles = null;
    this.teaLeaves = [];
    this.teaStreamMesh = null;

    // Coffee Objects
    this.coffeeStreamMesh = null;
    this.coffeeBeans = [];
    this.coffeeLiquidMesh = null;
    this.coffeeCremaMesh = null;
    this.coffeeSteamParticles = null;
    this.coffeeLevel = 0.3;

    // Rice Objects
    this.riceLidMesh = null;
    this.riceSteamParticles = null;
    this.celebrationParticles = null;
    this.chopsticksGroup = null;

    // Shared Materials & Shaders
    this.materials = {};

    // Advanced Lighting & Atmosphere Effects
    this.lightingMood = 'golden'; // 'golden', 'candle', 'moonlight', 'neon'
    this.ambientLight = null;
    this.keyLight = null;
    this.rimLight = null;
    this.fillLight = null;
    this.trackingSpotlight = null;
    this.hearthFireLight = null;
    this.sparkParticles = null;
    this.cursor3D = { x: 0, y: 0 };

    // Camera targets & presets
    this.cameraPositions = {
      cinematic: { pos: new THREE.Vector3(0, 4.5, 9.5), target: new THREE.Vector3(0, 0.8, 0) },
      pour: { pos: new THREE.Vector3(-2.2, 5.2, 5.8), target: new THREE.Vector3(-0.2, 1.2, 0) },
      top: { pos: new THREE.Vector3(0, 11, 0.1), target: new THREE.Vector3(0, 0, 0) },
      macro: { pos: new THREE.Vector3(1.2, 2.6, 4.2), target: new THREE.Vector3(0, 1.0, 0) }
    };

    this.init();
  }

  init() {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0c0f0d, 0.035);

    // 2. Camera
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || (window.innerHeight * 0.75);
    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    this.camera.position.set(0, 4.5, 9.5);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    if (window.THREE && THREE.OrbitControls) {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.06;
      this.controls.minDistance = 3.5;
      this.controls.maxDistance = 18;
      this.controls.maxPolarAngle = Math.PI / 2 - 0.04; // Don't clip below floor
      this.controls.target.set(0, 0.8, 0);
    }

    // 5. Lighting
    this.setupLighting();

    // 6. Base Stage (Countertop & Pedestal)
    this.setupStageEnvironment();

    // 7. Build All 3 Sub-Scenes
    this.buildTeaScene();
    this.buildCoffeeScene();
    this.buildRiceScene();

    // Show initial scene
    this.switchScene('tea', false);

    // 8. Event Listeners
    window.addEventListener('resize', () => this.onWindowResize());
    
    // 9. Start Render Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupLighting() {
    // Soft Warm Ambient Light
    this.ambientLight = new THREE.AmbientLight(0xf5eedc, 0.75);
    this.scene.add(this.ambientLight);

    // Main Warm Key Light (Directional with shadow)
    this.keyLight = new THREE.DirectionalLight(0xfff3db, 1.8);
    this.keyLight.position.set(5, 10, 6);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 25;
    this.keyLight.shadow.camera.left = -6;
    this.keyLight.shadow.camera.right = 6;
    this.keyLight.shadow.camera.top = 6;
    this.keyLight.shadow.camera.bottom = -6;
    this.keyLight.shadow.bias = -0.0005;
    this.scene.add(this.keyLight);

    // Cool Rim Light for modern specular highlights
    this.rimLight = new THREE.DirectionalLight(0xaad3df, 0.9);
    this.rimLight.position.set(-6, 6, -5);
    this.scene.add(this.rimLight);

    // Subtle Under/Fill Glow
    this.fillLight = new THREE.PointLight(0xe8c89b, 0.8, 12);
    this.fillLight.position.set(0, 1.5, 3);
    this.scene.add(this.fillLight);

    // Interactive Tracking Spotlight (Tracks Cursor)
    this.trackingSpotlight = new THREE.SpotLight(0xffeed6, 2.5, 24, Math.PI / 4.8, 0.4, 1.2);
    this.trackingSpotlight.position.set(0, 7.5, 4.5);
    this.trackingSpotlight.target.position.set(0, 1.0, 0);
    this.trackingSpotlight.castShadow = true;
    this.scene.add(this.trackingSpotlight);
    this.scene.add(this.trackingSpotlight.target);

    // Flickering Candle / Hearth Point Light
    this.hearthFireLight = new THREE.PointLight(0xff9933, 1.4, 9, 1.8);
    this.hearthFireLight.position.set(0, 1.2, 0.2);
    this.scene.add(this.hearthFireLight);

    // Atmospheric Glowing Ember / Spark Particles
    this.createAtmosphericSparks();
  }

  createAtmosphericSparks() {
    const sparkCount = 110;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(sparkCount * 3);
    const colors = new Float32Array(sparkCount * 3);
    const velocities = [];

    const sparkGold = new THREE.Color(0xffbb33);
    const sparkAmber = new THREE.Color(0xff6622);

    for (let i = 0; i < sparkCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 5.5;
      positions[i * 3 + 1] = 0.2 + Math.random() * 4.0;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5.5;

      const c = Math.random() > 0.4 ? sparkGold : sparkAmber;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      velocities.push({
        vy: 0.005 + Math.random() * 0.012,
        swirlSpeed: 0.8 + Math.random() * 1.5,
        radius: 1.2 + Math.random() * 2.5,
        angle: Math.random() * Math.PI * 2,
        initialY: 0.2,
        maxY: 4.5 + Math.random() * 1.5
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Glow dot texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(255,190,80,0.85)');
    grad.addColorStop(0.7, 'rgba(255,100,20,0.3)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.28,
      map: texture,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.sparkParticles = new THREE.Points(geometry, material);
    this.sparkParticles.userData = { velocities };
    this.scene.add(this.sparkParticles);
  }

  setupStageEnvironment() {
    this.stageGroup = new THREE.Group();
    this.scene.add(this.stageGroup);

    // 1. Circular Wooden/Slate Podium
    const podiumGeo = new THREE.CylinderGeometry(4.8, 5.0, 0.4, 64);
    const podiumMat = new THREE.MeshStandardMaterial({
      color: 0x1b1917,
      roughness: 0.65,
      metalness: 0.15
    });
    const podium = new THREE.Mesh(podiumGeo, podiumMat);
    podium.position.y = -0.2;
    podium.receiveShadow = true;
    this.stageGroup.add(podium);

    // Brass Inlay Ring on the Podium
    const ringGeo = new THREE.TorusGeometry(4.2, 0.025, 16, 80);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.3,
      metalness: 0.85
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.01;
    this.stageGroup.add(ring);

    // Ceramic Coaster Mat for Cups/Bowls
    const coasterGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.06, 48);
    const coasterMat = new THREE.MeshStandardMaterial({
      color: 0x272421,
      roughness: 0.8,
      metalness: 0.1
    });
    const coaster = new THREE.Mesh(coasterGeo, coasterMat);
    coaster.position.set(0, 0.03, 0);
    coaster.receiveShadow = true;
    this.stageGroup.add(coaster);
  }

  // ==========================================
  // SCENE 1: THE PERFECT TEA DROP
  // ==========================================
  buildTeaScene() {
    this.teaGroup = new THREE.Group();
    this.scene.add(this.teaGroup);

    // --- A. Ceramic Kyusu Teapot ---
    const teapotGroup = new THREE.Group();
    teapotGroup.position.set(-2.2, 3.2, -0.4);
    teapotGroup.rotation.z = -0.38; // Tilted ready to pour!
    teapotGroup.rotation.y = 0.35;

    const ceramicCeladonMat = new THREE.MeshStandardMaterial({
      color: 0x486b5e, // Celadon Jade Ceramic
      roughness: 0.22,
      metalness: 0.12
    });

    // Teapot body
    const bodyGeo = new THREE.SphereGeometry(1.0, 32, 24);
    bodyGeo.scale(1.15, 0.82, 1.0);
    const body = new THREE.Mesh(bodyGeo, ceramicCeladonMat);
    body.castShadow = true;
    teapotGroup.add(body);

    // Teapot Lid
    const lidGeo = new THREE.CylinderGeometry(0.55, 0.65, 0.18, 32);
    const lid = new THREE.Mesh(lidGeo, ceramicCeladonMat);
    lid.position.y = 0.72;
    teapotGroup.add(lid);

    const knobGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const knob = new THREE.Mesh(knobGeo, ceramicCeladonMat);
    knob.position.y = 0.88;
    teapotGroup.add(knob);

    // Curved Pouring Spout
    const spoutCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.6, 0.1, 0),
      new THREE.Vector3(1.3, 0.5, 0.1),
      new THREE.Vector3(1.9, 0.3, 0.15)
    ]);
    const spoutGeo = new THREE.TubeGeometry(spoutCurve, 24, 0.14, 16, false);
    const spout = new THREE.Mesh(spoutGeo, ceramicCeladonMat);
    spout.castShadow = true;
    teapotGroup.add(spout);
    this.teapotSpoutTip = new THREE.Vector3(1.9, 0.3, 0.15); // Local pos

    // Traditional Wood Side Handle
    const handleGeo = new THREE.CylinderGeometry(0.11, 0.13, 1.2, 16);
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x6e4726,
      roughness: 0.6,
      metalness: 0.1
    });
    const handle = new THREE.Mesh(handleGeo, woodMat);
    handle.position.set(-1.1, 0.3, 0.7);
    handle.rotation.x = Math.PI / 3.2;
    handle.rotation.z = -Math.PI / 3.8;
    teapotGroup.add(handle);

    this.teaGroup.add(teapotGroup);
    this.teapotGroup = teapotGroup;

    // --- B. Traditional Japanese Teacup (Yunomi) ---
    const cupGroup = new THREE.Group();
    cupGroup.position.set(0, 0.05, 0);

    const cupMat = new THREE.MeshStandardMaterial({
      color: 0xded5c6, // Off-white wabi-sabi clay
      roughness: 0.45,
      metalness: 0.05
    });

    // Cup outer body (lathe/cylinder with tapered base)
    const cupGeo = new THREE.CylinderGeometry(0.9, 0.62, 1.3, 40, 1, true);
    const cupOuter = new THREE.Mesh(cupGeo, cupMat);
    cupOuter.position.y = 0.65;
    cupOuter.castShadow = true;
    cupOuter.receiveShadow = true;
    cupGroup.add(cupOuter);

    // Cup bottom base
    const baseGeo = new THREE.CylinderGeometry(0.62, 0.62, 0.08, 32);
    const cupBase = new THREE.Mesh(baseGeo, cupMat);
    cupBase.position.y = 0.04;
    cupGroup.add(cupBase);

    // --- C. Liquid Surface in Teacup with concentric ripple rings ---
    const liquidMat = new THREE.MeshStandardMaterial({
      color: 0x6a8e45, // Fresh Matcha / Green tea
      roughness: 0.1,
      metalness: 0.25,
      transparent: true,
      opacity: 0.92
    });
    this.teaLiquidMat = liquidMat;

    const liquidGeo = new THREE.CircleGeometry(0.85, 48);
    const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
    liquidMesh.rotation.x = -Math.PI / 2;
    liquidMesh.position.y = 1.05;
    cupGroup.add(liquidMesh);
    this.teaLiquidMesh = liquidMesh;

    // Ripple Rings Pool (3 concentric rings that expand & fade)
    this.rippleRings = [];
    for (let i = 0; i < 4; i++) {
      const ringGeo = new THREE.RingGeometry(0.04, 0.07, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xa3cc70,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.y = 1.055;
      ringMesh.visible = false;
      cupGroup.add(ringMesh);
      this.rippleRings.push({ mesh: ringMesh, active: false, radius: 0.05, alpha: 1 });
    }

    this.teaGroup.add(cupGroup);

    // --- D. Falling 3D Tea Drop ---
    const dropGeo = new THREE.SphereGeometry(0.12, 16, 16);
    dropGeo.scale(0.8, 1.4, 0.8); // Tear drop shape
    const dropMat = new THREE.MeshStandardMaterial({
      color: 0x7da44e,
      roughness: 0.05,
      metalness: 0.4,
      transparent: true,
      opacity: 0.95
    });
    this.teaDropMesh = new THREE.Mesh(dropGeo, dropMat);
    this.teaDropMesh.position.set(-0.25, 2.7, 0);
    this.teaDropMesh.castShadow = true;
    this.teaGroup.add(this.teaDropMesh);

    // Continuous Pour Stream Mesh (Tube from teapot spout to cup)
    const streamCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.7, 2.9, 0),
      new THREE.Vector3(-0.4, 2.0, 0),
      new THREE.Vector3(0, 1.08, 0)
    );
    const streamGeo = new THREE.TubeGeometry(streamCurve, 20, 0.045, 8, false);
    const streamMat = new THREE.MeshStandardMaterial({
      color: 0x7da44e,
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.9
    });
    this.teaStreamMesh = new THREE.Mesh(streamGeo, streamMat);
    this.teaStreamMesh.visible = false;
    this.teaGroup.add(this.teaStreamMesh);

    // --- E. Volumetric Rising Steam Particles ---
    this.teaSteamParticles = this.createSteamParticleSystem(0xedf2eb, 90, 0, 1.1, 0);
    this.teaGroup.add(this.teaSteamParticles);

    // --- F. Floating Zen Tea Leaves ---
    this.createFloatingTeaLeaves();
  }

  createFloatingTeaLeaves() {
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x3d6b38,
      roughness: 0.5,
      metalness: 0.1,
      side: THREE.DoubleSide
    });

    for (let i = 0; i < 14; i++) {
      // Curved leaf geometry
      const leafShape = new THREE.Shape();
      leafShape.moveTo(0, 0);
      leafShape.quadraticCurveTo(0.18, 0.25, 0, 0.5);
      leafShape.quadraticCurveTo(-0.18, 0.25, 0, 0);

      const leafGeo = new THREE.ShapeGeometry(leafShape);
      const leaf = new THREE.Mesh(leafGeo, leafMat);

      // Random placement floating around the cup
      const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 1.4 + Math.random() * 1.8;
      leaf.position.set(
        Math.cos(angle) * dist,
        0.5 + Math.random() * 2.5,
        Math.sin(angle) * dist
      );
      leaf.scale.setScalar(0.45 + Math.random() * 0.35);
      leaf.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      leaf.userData = {
        baseY: leaf.position.y,
        speed: 0.4 + Math.random() * 0.6,
        rotSpeed: 0.5 + Math.random() * 0.8,
        angle: angle
      };

      this.teaGroup.add(leaf);
      this.teaLeaves.push(leaf);
    }
  }

  // ==========================================
  // SCENE 2: ARTISAN COFFEE CRAFT
  // ==========================================
  buildCoffeeScene() {
    this.coffeeGroup = new THREE.Group();
    this.scene.add(this.coffeeGroup);

    // --- A. Double-Walled Glass Server / Carafe ---
    const carafeGroup = new THREE.Group();
    carafeGroup.position.set(0, 0.05, 0);

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.08,
      transmission: 0.9,
      thickness: 0.6,
      ior: 1.52,
      transparent: true,
      opacity: 0.85
    });

    // Outer glass body
    const carafeGeo = new THREE.CylinderGeometry(0.8, 1.25, 1.8, 36, 1, true);
    const carafe = new THREE.Mesh(carafeGeo, glassMat);
    carafe.position.y = 0.9;
    carafe.castShadow = true;
    carafe.receiveShadow = true;
    carafeGroup.add(carafe);

    // Glass Base
    const glassBaseGeo = new THREE.CylinderGeometry(1.25, 1.25, 0.1, 36);
    const glassBase = new THREE.Mesh(glassBaseGeo, glassMat);
    glassBase.position.y = 0.05;
    carafeGroup.add(glassBase);

    // Glass Spout & Handle
    const glassHandleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.1, 1.5, 0),
      new THREE.Vector3(1.6, 1.1, 0),
      new THREE.Vector3(1.4, 0.5, 0),
      new THREE.Vector3(1.2, 0.4, 0)
    ]);
    const glassHandleGeo = new THREE.TubeGeometry(glassHandleCurve, 20, 0.07, 12, false);
    const glassHandle = new THREE.Mesh(glassHandleGeo, glassMat);
    carafeGroup.add(glassHandle);

    // --- B. V60 Coffee Dripper on top of carafe ---
    const dripperMat = new THREE.MeshStandardMaterial({
      color: 0x9b2226, // Ceramic Ruby Red
      roughness: 0.25,
      metalness: 0.2
    });
    const dripperGeo = new THREE.ConeGeometry(1.15, 1.2, 32, 1, true);
    const dripper = new THREE.Mesh(dripperGeo, dripperMat);
    dripper.position.y = 2.4;
    dripper.castShadow = true;
    carafeGroup.add(dripper);

    // Dripper Ring Base Collar
    const collarGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.1, 32);
    const collar = new THREE.Mesh(collarGeo, dripperMat);
    collar.position.y = 1.85;
    carafeGroup.add(collar);

    // Coffee Bed inside Dripper
    const coffeeBedGeo = new THREE.ConeGeometry(0.95, 0.7, 24);
    const coffeeBedMat = new THREE.MeshStandardMaterial({
      color: 0x22130c, // Ground coffee dark roast
      roughness: 0.9,
      metalness: 0.05
    });
    const coffeeBed = new THREE.Mesh(coffeeBedGeo, coffeeBedMat);
    coffeeBed.position.y = 2.4;
    carafeGroup.add(coffeeBed);

    // --- C. Liquid Coffee in Carafe & Crema Swirl ---
    const coffeeLiquidMat = new THREE.MeshStandardMaterial({
      color: 0x2b1408, // Rich Espresso Brown
      roughness: 0.15,
      metalness: 0.35,
      transparent: true,
      opacity: 0.94
    });
    const coffeeLiquidGeo = new THREE.CylinderGeometry(1.1, 1.2, 0.7, 32);
    this.coffeeLiquidMesh = new THREE.Mesh(coffeeLiquidGeo, coffeeLiquidMat);
    this.coffeeLiquidMesh.position.y = 0.45;
    carafeGroup.add(this.coffeeLiquidMesh);

    // Crema Disc with procedural swirl texture
    const cremaGeo = new THREE.CircleGeometry(1.1, 32);
    const cremaMat = new THREE.MeshStandardMaterial({
      color: 0xd49b56, // Golden Crema
      roughness: 0.6,
      metalness: 0.1,
      transparent: true,
      opacity: 0.95
    });
    this.coffeeCremaMesh = new THREE.Mesh(cremaGeo, cremaMat);
    this.coffeeCremaMesh.rotation.x = -Math.PI / 2;
    this.coffeeCremaMesh.position.y = 0.81;
    carafeGroup.add(this.coffeeCremaMesh);

    this.coffeeGroup.add(carafeGroup);

    // --- D. Gooseneck Kettle ---
    const kettleGroup = new THREE.Group();
    kettleGroup.position.set(-2.4, 3.4, -0.2);
    kettleGroup.rotation.z = -0.32;
    kettleGroup.rotation.y = 0.4;

    const kettleMat = new THREE.MeshStandardMaterial({
      color: 0x282624, // Matte Black with brass trim
      roughness: 0.35,
      metalness: 0.75
    });

    const kettleBodyGeo = new THREE.CylinderGeometry(0.65, 0.95, 1.4, 32);
    const kettleBody = new THREE.Mesh(kettleBodyGeo, kettleMat);
    kettleBody.castShadow = true;
    kettleGroup.add(kettleBody);

    // Gooseneck Spout (Slender S-curve)
    const gooseneckCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.5, -0.4, 0),
      new THREE.Vector3(1.1, 0.1, 0.1),
      new THREE.Vector3(1.6, 1.0, 0.15),
      new THREE.Vector3(2.1, 0.6, 0.2)
    ]);
    const gooseneckGeo = new THREE.TubeGeometry(gooseneckCurve, 32, 0.055, 16, false);
    const gooseneck = new THREE.Mesh(gooseneckGeo, kettleMat);
    gooseneck.castShadow = true;
    kettleGroup.add(gooseneck);

    this.coffeeGroup.add(kettleGroup);
    this.kettleGroup = kettleGroup;

    // --- E. Pour Stream for Coffee ---
    const coffeeStreamCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.8, 3.3, 0),
      new THREE.Vector3(-0.4, 2.7, 0),
      new THREE.Vector3(0, 2.45, 0)
    );
    const coffeeStreamGeo = new THREE.TubeGeometry(coffeeStreamCurve, 20, 0.04, 8, false);
    const coffeeStreamMat = new THREE.MeshStandardMaterial({
      color: 0x3d1d0c,
      roughness: 0.1,
      metalness: 0.3
    });
    this.coffeeStreamMesh = new THREE.Mesh(coffeeStreamGeo, coffeeStreamMat);
    this.coffeeStreamMesh.visible = false;
    this.coffeeGroup.add(this.coffeeStreamMesh);

    // --- F. Falling 3D Coffee Beans ---
    this.createCoffeeBeans();

    // --- G. Rich Coffee Steam ---
    this.coffeeSteamParticles = this.createSteamParticleSystem(0xffedd8, 100, 0, 2.5, 0);
    this.coffeeGroup.add(this.coffeeSteamParticles);
  }

  createCoffeeBeans() {
    const beanMat = new THREE.MeshStandardMaterial({
      color: 0x3d2314, // Dark roasted sheen
      roughness: 0.4,
      metalness: 0.2
    });

    for (let i = 0; i < 16; i++) {
      const beanGeo = new THREE.SphereGeometry(0.14, 16, 16);
      beanGeo.scale(1.35, 0.85, 0.95);
      const bean = new THREE.Mesh(beanGeo, beanMat);
      bean.castShadow = true;

      // Random starting positions above the dripper
      bean.position.set(
        (Math.random() - 0.5) * 1.0,
        3.2 + Math.random() * 2.2,
        (Math.random() - 0.5) * 1.0
      );
      bean.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      bean.userData = {
        vy: -0.02 - Math.random() * 0.03,
        rotVy: (Math.random() - 0.5) * 0.1,
        initialY: bean.position.y,
        initialX: bean.position.x,
        initialZ: bean.position.z
      };

      this.coffeeGroup.add(bean);
      this.coffeeBeans.push(bean);
    }
  }

  // ==========================================
  // SCENE 3: STEAMING RICE & TEA READY FEAST
  // ==========================================
  buildRiceScene() {
    this.riceGroup = new THREE.Group();
    this.scene.add(this.riceGroup);

    // --- A. Ceremonial Cedar Wood Tray ---
    const trayGeo = new THREE.BoxGeometry(4.6, 0.15, 3.2);
    const trayMat = new THREE.MeshStandardMaterial({
      color: 0x3a2312, // Dark burnt cedar (Shou Sugi Ban)
      roughness: 0.7,
      metalness: 0.05
    });
    const tray = new THREE.Mesh(trayGeo, trayMat);
    tray.position.set(0, 0.08, 0);
    tray.receiveShadow = true;
    this.riceGroup.add(tray);

    // --- B. Traditional Japanese Donburi Rice Bowl ---
    const bowlGroup = new THREE.Group();
    bowlGroup.position.set(-0.65, 0.16, 0.1);

    const stonewareMat = new THREE.MeshStandardMaterial({
      color: 0x2b2d42, // Indigo-black textured stoneware
      roughness: 0.5,
      metalness: 0.1
    });

    const bowlGeo = new THREE.CylinderGeometry(1.35, 0.75, 1.1, 40, 1, true);
    const bowl = new THREE.Mesh(bowlGeo, stonewareMat);
    bowl.position.y = 0.55;
    bowl.castShadow = true;
    bowl.receiveShadow = true;
    bowlGroup.add(bowl);

    const bowlBaseGeo = new THREE.CylinderGeometry(0.75, 0.75, 0.1, 32);
    const bowlBase = new THREE.Mesh(bowlBaseGeo, stonewareMat);
    bowlBase.position.y = 0.05;
    bowlGroup.add(bowlBase);

    // --- C. Mountain of Freshly Steamed Fluffy Rice ---
    const riceMat = new THREE.MeshStandardMaterial({
      color: 0xfdfdfd, // Glistening Pearl White
      roughness: 0.35,
      metalness: 0.05
    });

    const riceMoundGeo = new THREE.SphereGeometry(1.2, 32, 24);
    riceMoundGeo.scale(1.0, 0.55, 1.0);
    const riceMound = new THREE.Mesh(riceMoundGeo, riceMat);
    riceMound.position.y = 0.9;
    riceMound.castShadow = true;
    bowlGroup.add(riceMound);

    // Rice Garnish: Roasted Black Sesame seeds & Nori seaweed flakes
    const sesameMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const noriMat = new THREE.MeshBasicMaterial({ color: 0x1a2e1b });

    for (let i = 0; i < 30; i++) {
      const sesameGeo = new THREE.SphereGeometry(0.025, 8, 8);
      sesameGeo.scale(1.5, 0.6, 0.8);
      const sesame = new THREE.Mesh(sesameGeo, sesameMat);
      const theta = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.65;
      sesame.position.set(Math.cos(theta) * r, 1.15 + Math.random() * 0.05, Math.sin(theta) * r);
      sesame.rotation.set(Math.random(), Math.random(), Math.random());
      bowlGroup.add(sesame);
    }

    // Nori strips (crisp seaweed garnish)
    for (let i = 0; i < 6; i++) {
      const noriGeo = new THREE.PlaneGeometry(0.08, 0.35);
      const nori = new THREE.Mesh(noriGeo, noriMat);
      nori.position.set(
        (Math.random() - 0.5) * 0.7,
        1.18,
        (Math.random() - 0.5) * 0.7
      );
      nori.rotation.set(Math.PI / 2 + Math.random() * 0.2, Math.random() * Math.PI, 0);
      bowlGroup.add(nori);
    }

    // --- D. Authentic Ceramic Donburi Lid (Can lift & hover!) ---
    const lidGroup = new THREE.Group();
    lidGroup.position.set(0, 1.1, 0);

    const lidGeo = new THREE.SphereGeometry(1.4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2.3);
    const lidMat = new THREE.MeshStandardMaterial({
      color: 0x2b2d42,
      roughness: 0.45,
      metalness: 0.15
    });
    const lid = new THREE.Mesh(lidGeo, lidMat);
    lid.rotation.x = Math.PI; // Dome pointing up
    lid.position.y = 0.55;
    lid.castShadow = true;
    lidGroup.add(lid);

    // Gold Finial Knob on Lid
    const goldKnobGeo = new THREE.CylinderGeometry(0.2, 0.15, 0.25, 24);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Polished Brass / Gold
      roughness: 0.2,
      metalness: 0.85
    });
    const goldKnob = new THREE.Mesh(goldKnobGeo, goldMat);
    goldKnob.position.y = 0.65;
    lidGroup.add(goldKnob);

    bowlGroup.add(lidGroup);
    this.riceLidMesh = lidGroup;

    this.riceGroup.add(bowlGroup);

    // --- E. Pair of Elegant Wooden Chopsticks on Hashioki Rest ---
    const chopsticksGroup = new THREE.Group();
    chopsticksGroup.position.set(1.4, 0.22, 0);

    // Hashioki Ceramic Rest
    const restGeo = new THREE.BoxGeometry(0.25, 0.12, 0.7);
    const restMat = new THREE.MeshStandardMaterial({ color: 0xd8c8b8, roughness: 0.3 });
    const rest = new THREE.Mesh(restGeo, restMat);
    rest.position.set(0, 0, 0);
    rest.castShadow = true;
    chopsticksGroup.add(rest);

    // Chopsticks (tapered walnut wood)
    const chopstickGeo = new THREE.CylinderGeometry(0.02, 0.05, 2.8, 12);
    const chopstickMat = new THREE.MeshStandardMaterial({ color: 0x2c1d11, roughness: 0.6 });

    const cs1 = new THREE.Mesh(chopstickGeo, chopstickMat);
    cs1.rotation.x = Math.PI / 2;
    cs1.rotation.z = -0.03;
    cs1.position.set(-0.06, 0.1, 0);
    cs1.castShadow = true;
    chopsticksGroup.add(cs1);

    const cs2 = new THREE.Mesh(chopstickGeo, chopstickMat);
    cs2.rotation.x = Math.PI / 2;
    cs2.rotation.z = 0.03;
    cs2.position.set(0.06, 0.1, 0);
    cs2.castShadow = true;
    chopsticksGroup.add(cs2);

    this.riceGroup.add(chopsticksGroup);
    this.chopsticksGroup = chopsticksGroup;

    // --- F. Side Cup of Steaming Hot Ceremonial Tea ---
    const sideCupGroup = new THREE.Group();
    sideCupGroup.position.set(1.15, 0.16, -0.75);

    const sideCupGeo = new THREE.CylinderGeometry(0.55, 0.42, 0.75, 32);
    const sideCupMat = new THREE.MeshStandardMaterial({
      color: 0xf0ebd8, // Warm Shino Glaze
      roughness: 0.3
    });
    const sideCup = new THREE.Mesh(sideCupGeo, sideCupMat);
    sideCup.position.y = 0.38;
    sideCup.castShadow = true;
    sideCupGroup.add(sideCup);

    // Green tea liquid inside side cup
    const sideLiquidGeo = new THREE.CircleGeometry(0.5, 24);
    const sideLiquidMat = new THREE.MeshStandardMaterial({
      color: 0x588157,
      roughness: 0.1,
      metalness: 0.2
    });
    const sideLiquid = new THREE.Mesh(sideLiquidGeo, sideLiquidMat);
    sideLiquid.rotation.x = -Math.PI / 2;
    sideLiquid.position.y = 0.68;
    sideCupGroup.add(sideLiquid);

    this.riceGroup.add(sideCupGroup);

    // --- G. Billowing Hot Steam from Rice ---
    this.riceSteamParticles = this.createSteamParticleSystem(0xffffff, 120, -0.65, 1.2, 0.1);
    this.riceSteamParticles.visible = false; // Starts under lid!
    this.riceGroup.add(this.riceSteamParticles);

    // --- H. Celebration Golden Sparkles when Feast is Ready ---
    this.createCelebrationParticles();
  }

  createCelebrationParticles() {
    const particleCount = 70;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    const color1 = new THREE.Color(0xd4af37); // Gold
    const color2 = new THREE.Color(0xffe6a7); // Champagne

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 3.5;
      positions[i * 3 + 1] = 0.5 + Math.random() * 3.0;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3.5;

      const c = Math.random() > 0.5 ? color1 : color2;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      scales[i] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle material
    const material = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });

    this.celebrationParticles = new THREE.Points(geometry, material);
    this.celebrationParticles.visible = false;
    this.riceGroup.add(this.celebrationParticles);
  }

  // ==========================================
  // SHARED: VOLUMETRIC STEAM SYSTEM
  // ==========================================
  createSteamParticleSystem(colorHex, count, posX, posY, posZ) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = posX + (Math.random() - 0.5) * 0.4;
      positions[i * 3 + 1] = posY + Math.random() * 1.5;
      positions[i * 3 + 2] = posZ + (Math.random() - 0.5) * 0.4;

      velocities.push({
        vy: 0.008 + Math.random() * 0.014,
        vx: (Math.random() - 0.5) * 0.004,
        vz: (Math.random() - 0.5) * 0.004,
        initialY: posY,
        maxY: posY + 2.2 + Math.random() * 0.8
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Soft procedural circular sprite for realistic steam
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,0.7)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.2)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.45,
      map: texture,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.NormalBlending,
      color: colorHex
    });

    const points = new THREE.Points(geometry, material);
    points.userData = { velocities: velocities, originX: posX, originY: posY, originZ: posZ };
    return points;
  }

  // ==========================================
  // INTERACTIVE CONTROLS & TRIGGERS
  // ==========================================

  switchScene(sceneName, animateCamera = true) {
    this.currentScene = sceneName;

    // Fade/toggle visibility
    this.teaGroup.visible = (sceneName === 'tea');
    this.coffeeGroup.visible = (sceneName === 'coffee');
    this.riceGroup.visible = (sceneName === 'rice');

    if (animateCamera && window.gsap) {
      const preset = this.cameraPositions.cinematic;
      gsap.to(this.camera.position, {
        x: preset.pos.x,
        y: preset.pos.y,
        z: preset.pos.z,
        duration: 1.2,
        ease: "power2.out"
      });
      if (this.controls) {
        gsap.to(this.controls.target, {
          x: preset.target.x,
          y: preset.target.y,
          z: preset.target.z,
          duration: 1.2,
          ease: "power2.out"
        });
      }
    }
  }

  /**
   * Action 1: Trigger Single Tea Drop
   */
  triggerTeaDrop() {
    if (this.isPouringTea) return;
    this.isPouringTea = true;

    // Reset drop position at teapot spout tip
    this.teaDropMesh.position.set(-0.35, 2.7, 0.05);
    this.teaDropMesh.scale.set(0.8, 1.4, 0.8);
    this.teaDropMesh.visible = true;

    // Animate falling drop using GSAP
    if (window.gsap) {
      gsap.to(this.teaDropMesh.position, {
        y: 1.06,
        x: 0,
        z: 0,
        duration: 0.65,
        ease: "power2.in",
        onComplete: () => {
          // Drop hits liquid surface!
          this.teaDropMesh.visible = false;
          this.triggerTeaRipple();

          if (window.zenithAudio) {
            window.zenithAudio.playWaterDrop(1.0);
          }

          // Small rebound bead bounce
          this.triggerReboundBead();

          setTimeout(() => {
            this.isPouringTea = false;
          }, 300);
        }
      });
    }
  }

  triggerTeaRipple() {
    // Find inactive ripple ring
    const ripple = this.rippleRings.find(r => !r.active);
    if (ripple) {
      ripple.active = true;
      ripple.radius = 0.05;
      ripple.alpha = 0.9;
      ripple.mesh.visible = true;
      ripple.mesh.scale.set(1, 1, 1);
      ripple.mesh.material.opacity = 0.9;
    }
  }

  triggerReboundBead() {
    const bead = this.teaDropMesh;
    bead.position.set(0, 1.06, 0);
    bead.scale.set(0.5, 0.5, 0.5);
    bead.visible = true;

    if (window.gsap) {
      gsap.to(bead.position, {
        y: 1.32,
        duration: 0.22,
        ease: "power1.out",
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          bead.visible = false;
        }
      });
    }
  }

  toggleContinuousTeaPour(enable) {
    if (enable) {
      this.teaStreamMesh.visible = true;
      if (window.zenithAudio) window.zenithAudio.startPourSound();
      if (window.zenithAudio) window.zenithAudio.startSteamHiss(0.12);
    } else {
      this.teaStreamMesh.visible = false;
      if (window.zenithAudio) window.zenithAudio.stopPourSound();
      if (window.zenithAudio) window.zenithAudio.stopSteamHiss();
    }
  }

  /**
   * Action 2: Trigger Artisan Coffee Brewing
   */
  triggerCoffeeBrew() {
    if (this.isBrewingCoffee) return;
    this.isBrewingCoffee = true;

    // 1. Tilt Gooseneck kettle
    if (window.gsap && this.kettleGroup) {
      gsap.to(this.kettleGroup.rotation, {
        z: -0.55,
        duration: 0.8,
        ease: "power2.out"
      });
    }

    // 2. Start pour stream & sound
    setTimeout(() => {
      this.coffeeStreamMesh.visible = true;
      if (window.zenithAudio) {
        window.zenithAudio.startPourSound();
        window.zenithAudio.startSteamHiss(0.25);
      }

      // 3. Fall beans
      this.coffeeBeans.forEach((bean, idx) => {
        setTimeout(() => {
          bean.position.set(
            (Math.random() - 0.5) * 0.8,
            3.5,
            (Math.random() - 0.5) * 0.8
          );
        }, idx * 100);
      });

      // 4. Crema Expansion and color rise
      if (window.gsap && this.coffeeCremaMesh) {
        this.coffeeCremaMesh.scale.set(0.1, 0.1, 0.1);
        gsap.to(this.coffeeCremaMesh.scale, {
          x: 1.0,
          y: 1.0,
          z: 1.0,
          duration: 3.5,
          ease: "power1.inOut"
        });
      }

      // 5. Complete brew cycle
      setTimeout(() => {
        this.coffeeStreamMesh.visible = false;
        if (window.zenithAudio) {
          window.zenithAudio.stopPourSound();
          window.zenithAudio.stopSteamHiss();
          window.zenithAudio.playCelebrationChime();
        }

        if (window.gsap && this.kettleGroup) {
          gsap.to(this.kettleGroup.rotation, {
            z: -0.32,
            duration: 0.8,
            ease: "power2.out"
          });
        }
        this.isBrewingCoffee = false;
      }, 4200);

    }, 800);
  }

  /**
   * Action 3: Trigger Rice & Tea Ready Feast
   */
  triggerRiceReady() {
    this.isRiceReady = true;

    // 1. Lift and tilt the Donburi Lid up into the air
    if (window.gsap && this.riceLidMesh) {
      gsap.to(this.riceLidMesh.position, {
        y: 2.8,
        x: -0.4,
        duration: 1.4,
        ease: "back.out(1.4)"
      });
      gsap.to(this.riceLidMesh.rotation, {
        z: 0.28,
        x: 0.15,
        duration: 1.4,
        ease: "power2.out"
      });
    }

    // 2. Unleash billowing steam
    if (this.riceSteamParticles) {
      this.riceSteamParticles.visible = true;
      if (window.gsap) {
        gsap.to(this.riceSteamParticles.material, {
          opacity: 0.65,
          duration: 1.0
        });
      }
    }

    // 3. Audio: Steam hiss followed by Zen celebration chime
    if (window.zenithAudio) {
      window.zenithAudio.startSteamHiss(0.35);
      setTimeout(() => {
        window.zenithAudio.stopSteamHiss();
        window.zenithAudio.playCelebrationChime();
      }, 900);
    }

    // 4. Golden celebration particle burst
    if (this.celebrationParticles) {
      this.celebrationParticles.visible = true;
      if (window.gsap) {
        gsap.to(this.celebrationParticles.material, {
          opacity: 0.95,
          duration: 0.6,
          yoyo: true,
          repeat: 3,
          onComplete: () => {
            gsap.to(this.celebrationParticles.material, { opacity: 0, duration: 1.0 });
          }
        });
      }
    }

    // 5. Gently float chopsticks in celebration
    if (window.gsap && this.chopsticksGroup) {
      gsap.to(this.chopsticksGroup.position, {
        y: 0.45,
        duration: 0.7,
        yoyo: true,
        repeat: 1,
        ease: "power1.inOut"
      });
    }
  }

  resetRiceLid() {
    if (window.gsap && this.riceLidMesh) {
      gsap.to(this.riceLidMesh.position, {
        y: 1.1,
        x: 0,
        duration: 1.0,
        ease: "power2.inOut"
      });
      gsap.to(this.riceLidMesh.rotation, {
        z: 0,
        x: 0,
        duration: 1.0,
        ease: "power2.inOut"
      });
    }
    if (this.riceSteamParticles) {
      this.riceSteamParticles.visible = false;
    }
    this.isRiceReady = false;
  }

  setCameraPreset(presetKey) {
    const preset = this.cameraPositions[presetKey] || this.cameraPositions.cinematic;
    if (window.gsap) {
      gsap.to(this.camera.position, {
        x: preset.pos.x,
        y: preset.pos.y,
        z: preset.pos.z,
        duration: 1.1,
        ease: "power2.out"
      });
      if (this.controls) {
        gsap.to(this.controls.target, {
          x: preset.target.x,
          y: preset.target.y,
          z: preset.target.z,
          duration: 1.1,
          ease: "power2.out"
        });
      }
    }
  }

  setTeaBlendColor(colorHex) {
    if (this.teaLiquidMat) {
      this.teaLiquidMat.color.setHex(colorHex);
    }
    if (this.teaDropMesh) {
      this.teaDropMesh.material.color.setHex(colorHex);
    }
  }

  /**
   * Interactive Lighting Mood Presets
   * 'golden' (Warm studio sunset), 'candle' (Flickering hearth), 'moonlight' (Ethereal cyber night), 'neon' (Tokyo pink & cyan)
   */
  setLightingMood(moodKey) {
    this.lightingMood = moodKey;
    if (!window.gsap) return;

    if (moodKey === 'golden') {
      gsap.to(this.keyLight.color, { r: 1.0, g: 0.95, b: 0.85, duration: 1.2 });
      gsap.to(this.keyLight, { intensity: 1.8, duration: 1.2 });
      gsap.to(this.rimLight.color, { r: 0.67, g: 0.83, b: 0.87, duration: 1.2 });
      gsap.to(this.ambientLight.color, { r: 0.96, g: 0.93, b: 0.86, duration: 1.2 });
      gsap.to(this.trackingSpotlight.color, { r: 1.0, g: 0.93, b: 0.84, duration: 1.2 });
      if (this.sparkParticles) {
        gsap.to(this.sparkParticles.material, { opacity: 0.85, duration: 1.0 });
      }
    } else if (moodKey === 'candle') {
      gsap.to(this.keyLight.color, { r: 0.95, g: 0.6, b: 0.3, duration: 1.2 });
      gsap.to(this.keyLight, { intensity: 0.9, duration: 1.2 });
      gsap.to(this.rimLight.color, { r: 1.0, g: 0.5, b: 0.2, duration: 1.2 });
      gsap.to(this.ambientLight.color, { r: 0.5, g: 0.3, b: 0.15, duration: 1.2 });
      gsap.to(this.trackingSpotlight.color, { r: 1.0, g: 0.7, b: 0.3, duration: 1.2 });
      if (this.sparkParticles) {
        gsap.to(this.sparkParticles.material, { opacity: 1.0, duration: 1.0 });
      }
    } else if (moodKey === 'moonlight') {
      gsap.to(this.keyLight.color, { r: 0.55, g: 0.75, b: 1.0, duration: 1.2 });
      gsap.to(this.keyLight, { intensity: 1.4, duration: 1.2 });
      gsap.to(this.rimLight.color, { r: 0.4, g: 0.95, b: 1.0, duration: 1.2 });
      gsap.to(this.ambientLight.color, { r: 0.2, g: 0.3, b: 0.5, duration: 1.2 });
      gsap.to(this.trackingSpotlight.color, { r: 0.7, g: 0.85, b: 1.0, duration: 1.2 });
      if (this.sparkParticles) {
        gsap.to(this.sparkParticles.material, { opacity: 0.5, duration: 1.0 });
      }
    } else if (moodKey === 'neon') {
      gsap.to(this.keyLight.color, { r: 1.0, g: 0.2, b: 0.55, duration: 1.2 });
      gsap.to(this.keyLight, { intensity: 2.0, duration: 1.2 });
      gsap.to(this.rimLight.color, { r: 0.0, g: 0.9, b: 1.0, duration: 1.2 });
      gsap.to(this.ambientLight.color, { r: 0.4, g: 0.1, b: 0.4, duration: 1.2 });
      gsap.to(this.trackingSpotlight.color, { r: 1.0, g: 0.4, b: 0.8, duration: 1.2 });
      if (this.sparkParticles) {
        gsap.to(this.sparkParticles.material, { opacity: 0.95, duration: 1.0 });
      }
    }
  }

  /**
   * Update spotlight tracking from normalized cursor coordinates (-1 to 1)
   */
  updateCursorLighting(normX, normY) {
    this.cursor3D.x = normX;
    this.cursor3D.y = normY;
  }

  // ==========================================
  // RENDER LOOP & PER-FRAME ANIMATIONS
  // ==========================================
  animate() {
    requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Controls update
    if (this.controls) {
      this.controls.update();
    }

    // 2. Smooth Cursor Light Tracking
    if (this.trackingSpotlight) {
      this.trackingSpotlight.position.x += ((this.cursor3D.x * 5.5) - this.trackingSpotlight.position.x) * 0.05;
      this.trackingSpotlight.position.z += ((4.5 - this.cursor3D.y * 3.0) - this.trackingSpotlight.position.z) * 0.05;
    }

    // 3. Realistic Candlelight / Hearth Flicker
    if (this.hearthFireLight) {
      const flicker = Math.sin(elapsedTime * 8.5) * 0.25 + Math.cos(elapsedTime * 17.1) * 0.15;
      this.hearthFireLight.intensity = (this.lightingMood === 'candle' ? 2.2 : 1.4) + flicker;
    }

    // 4. Floating Glowing Ember Sparks
    if (this.sparkParticles && this.sparkParticles.visible) {
      const positions = this.sparkParticles.geometry.attributes.position.array;
      const velocities = this.sparkParticles.userData.velocities;
      const count = velocities.length;

      for (let i = 0; i < count; i++) {
        const v = velocities[i];
        v.angle += delta * v.swirlSpeed;
        positions[i * 3] += Math.cos(v.angle) * 0.006;
        positions[i * 3 + 1] += v.vy;
        positions[i * 3 + 2] += Math.sin(v.angle) * 0.006;

        if (positions[i * 3 + 1] > v.maxY) {
          positions[i * 3 + 1] = v.initialY;
          positions[i * 3] = (Math.random() - 0.5) * 5.0;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 5.0;
        }
      }
      this.sparkParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Animate Tea Scene Elements
    if (this.teaGroup.visible) {
      // Floating leaves subtle levitation
      this.teaLeaves.forEach(leaf => {
        const u = leaf.userData;
        leaf.position.y = u.baseY + Math.sin(elapsedTime * u.speed + u.angle) * 0.18;
        leaf.rotation.x += u.rotSpeed * delta * 0.5;
        leaf.rotation.y += u.rotSpeed * delta * 0.8;
      });

      // Update concentric ripples
      this.rippleRings.forEach(ripple => {
        if (ripple.active) {
          ripple.radius += delta * 0.8;
          ripple.alpha -= delta * 0.9;
          ripple.mesh.scale.set(ripple.radius * 10, ripple.radius * 10, 1);
          ripple.mesh.material.opacity = Math.max(0, ripple.alpha);

          if (ripple.alpha <= 0 || ripple.radius > 0.85) {
            ripple.active = false;
            ripple.mesh.visible = false;
          }
        }
      });

      // Animate Tea Steam
      this.updateSteam(this.teaSteamParticles, delta);
    }

    // 3. Animate Coffee Scene Elements
    if (this.coffeeGroup.visible) {
      // Animate falling beans
      this.coffeeBeans.forEach(bean => {
        bean.position.y += bean.userData.vy;
        bean.rotation.x += bean.userData.rotVy;
        if (bean.position.y < 2.3) {
          // Landed inside dripper, reset to top
          bean.position.y = 3.6 + Math.random() * 1.5;
          bean.position.x = (Math.random() - 0.5) * 0.8;
          bean.position.z = (Math.random() - 0.5) * 0.8;
        }
      });

      // Slowly rotate crema swirl
      if (this.coffeeCremaMesh) {
        this.coffeeCremaMesh.rotation.z += delta * 0.15;
      }

      // Animate Coffee Steam
      this.updateSteam(this.coffeeSteamParticles, delta);
    }

    // 4. Animate Rice Scene Elements
    if (this.riceGroup.visible) {
      if (this.riceSteamParticles && this.riceSteamParticles.visible) {
        this.updateSteam(this.riceSteamParticles, delta, true);
      }

      // Rotate celebration sparkles
      if (this.celebrationParticles && this.celebrationParticles.visible) {
        this.celebrationParticles.rotation.y += delta * 0.4;
      }
    }

    // 5. Render
    this.renderer.render(this.scene, this.camera);
  }

  updateSteam(steamParticles, delta, isDense = false) {
    if (!steamParticles) return;
    const positions = steamParticles.geometry.attributes.position.array;
    const velocities = steamParticles.userData.velocities;
    const count = velocities.length;

    for (let i = 0; i < count; i++) {
      const v = velocities[i];
      positions[i * 3 + 1] += v.vy * (isDense ? 1.5 : 1.0);
      positions[i * 3] += v.vx + Math.sin(positions[i * 3 + 1] * 3.0) * 0.002;
      positions[i * 3 + 2] += v.vz + Math.cos(positions[i * 3 + 1] * 2.5) * 0.002;

      // Loop particle when reaches max height
      if (positions[i * 3 + 1] > v.maxY) {
        positions[i * 3 + 1] = v.initialY + (Math.random() * 0.1);
        positions[i * 3] = steamParticles.userData.originX + (Math.random() - 0.5) * (isDense ? 0.7 : 0.4);
        positions[i * 3 + 2] = steamParticles.userData.originZ + (Math.random() - 0.5) * (isDense ? 0.7 : 0.4);
      }
    }
    steamParticles.geometry.attributes.position.needsUpdate = true;
  }

  onWindowResize() {
    if (!this.container || !this.camera || !this.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

// Global stage singleton
window.zenithStage = null;
window.initZenith3DStage = function(containerId) {
  window.zenithStage = new Zenith3DStage(containerId);
  return window.zenithStage;
};
