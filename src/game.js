import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";

const canvas = document.querySelector("#game");
const gameShell = document.querySelector("#game-shell");
const soundtrack = document.querySelector("#soundtrack");
const scoreNode = document.querySelector("#score");
const waveNode = document.querySelector("#wave");
const targetsLeftNode = document.querySelector("#targets-left");
const bestKillsNode = document.querySelector("#best-kills");
const moneyNode = document.querySelector("#money");
const healthFillNode = document.querySelector("#health-fill");
const healthValueNode = document.querySelector("#health-value");
const weaponNameNode = document.querySelector("#weapon-name");
const startPanel = document.querySelector("#start-panel");
const pausePanel = document.querySelector("#pause-panel");
const playButton = document.querySelector("#play-button");
const pauseButton = document.querySelector("#pause-button");
const resumeButton = document.querySelector("#resume-button");
const cameraModeButton = document.querySelector("#camera-mode-button");
const hitMarker = document.querySelector("#hit-marker");
const damageFlash = document.querySelector("#damage-flash");
const shopButtons = Array.from(document.querySelectorAll("[data-weapon]"));
const zombieTypeButtons = Array.from(document.querySelectorAll("[data-zombie-type]"));
const mobileControlsNode = document.querySelector("#mobile-controls");
const mobileLookZone = document.querySelector("#mobile-look-zone");
const moveStick = document.querySelector("#move-stick");
const moveKnob = document.querySelector("#move-knob");
const mobileFireButton = document.querySelector("#mobile-fire");
const mobileSprintButton = document.querySelector("#mobile-sprint");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9dc8df);
scene.fog = new THREE.Fog(0x9dc8df, 44, 156);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  canvas,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const camera = new THREE.PerspectiveCamera(74, 1, 0.1, 230);
camera.position.set(0, 1.72, 11);

const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const worldForward = new THREE.Vector3();
const worldRight = new THREE.Vector3();
const shotRight = new THREE.Vector3();
const shotUp = new THREE.Vector3();
const moveVector = new THREE.Vector3();
const cameraDirection = new THREE.Vector3();
const muzzleWorld = new THREE.Vector3();
const playerPosition = new THREE.Vector3(0, 0, 11);
const cameraTargetPosition = new THREE.Vector3();
const cameraLookAt = new THREE.Vector3();
const avatarMuzzle = new THREE.Object3D();
const yAxis = new THREE.Vector3(0, 1, 0);
const playerVelocity = new THREE.Vector3();
const lookSway = new THREE.Vector2();

const input = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  sprint: false,
  fire: false,
  moveX: 0,
  moveY: 0,
};

const touchControls = {
  enabled:
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(max-width: 820px)").matches ||
    "ontouchstart" in window,
  joystickPointerId: null,
  lookPointerId: null,
  lookX: 0,
  lookY: 0,
};

const player = {
  yaw: 0,
  pitch: 0,
  height: 1.72,
  radius: 0.48,
  speed: 6.4,
  sprintSpeed: 9.4,
};

const cameraState = {
  mode: "first",
};

const WEAPONS = {
  pistol: {
    id: "pistol",
    label: "Пистолет",
    cost: 0,
    damage: 46,
    cooldown: 0.34,
    range: 70,
    spread: 0.004,
    reward: 24,
    auto: false,
  },
  bow: {
    id: "bow",
    label: "Лук",
    cost: 140,
    damage: 135,
    cooldown: 0.82,
    range: 86,
    spread: 0.001,
    reward: 28,
    auto: false,
  },
  sword: {
    id: "sword",
    label: "Меч",
    cost: 240,
    damage: 155,
    cooldown: 0.42,
    range: 3.1,
    reward: 34,
    auto: false,
    melee: true,
    view: [0.34, -0.25, -0.6],
  },
  shotgun: {
    id: "shotgun",
    label: "Дробовик",
    cost: 320,
    damage: 34,
    cooldown: 0.74,
    range: 44,
    spread: 0.085,
    pellets: 7,
    reward: 26,
    auto: false,
    recoil: 1.35,
  },
  rifle: {
    id: "rifle",
    label: "Автомат",
    cost: 360,
    damage: 34,
    cooldown: 0.105,
    range: 82,
    spread: 0.014,
    reward: 24,
    auto: true,
  },
  crossbow: {
    id: "crossbow",
    label: "Арбалет",
    cost: 520,
    damage: 230,
    cooldown: 1.05,
    range: 96,
    spread: 0.001,
    reward: 36,
    auto: false,
    recoil: 1.2,
  },
  sniper: {
    id: "sniper",
    label: "Снайперка",
    cost: 680,
    damage: 360,
    cooldown: 1.16,
    range: 150,
    spread: 0,
    reward: 42,
    auto: false,
    recoil: 1.45,
  },
  machinegun: {
    id: "machinegun",
    label: "Пулемет",
    cost: 760,
    damage: 28,
    cooldown: 0.058,
    range: 88,
    spread: 0.025,
    reward: 22,
    auto: true,
  },
  railgun: {
    id: "railgun",
    label: "Рельса",
    cost: 1250,
    damage: 420,
    cooldown: 0.94,
    range: 160,
    spread: 0.001,
    reward: 48,
    auto: false,
    pierce: true,
    maxPierce: 4,
    recoil: 1.5,
  },
  minigun: {
    id: "minigun",
    label: "Миниган",
    cost: 1500,
    damage: 36,
    cooldown: 0.036,
    range: 96,
    spread: 0.032,
    reward: 24,
    auto: true,
    recoil: 0.65,
  },
};

const WEAPON_ORDER = [
  "pistol",
  "bow",
  "sword",
  "shotgun",
  "rifle",
  "crossbow",
  "sniper",
  "machinegun",
  "railgun",
  "minigun",
];

const ZOMBIE_TYPES = [
  { id: "math", label: "Математика", src: "./download.png", fallbackSrc: "./assets/zombie-cover.png" },
  { id: "physics", label: "Физика", src: "./assets/ege-physics.png" },
  { id: "russian", label: "Русский", src: "./assets/ege-russian.png" },
  { id: "social", label: "Общество", src: "./assets/ege-social.png" },
  { id: "chemistry", label: "Химия", src: "./assets/ege-chemistry.png" },
  { id: "biology", label: "Биология", src: "./assets/ege-biology.png" },
  { id: "english", label: "Английский", src: "./assets/ege-english.png" },
];

const weapon = {
  root: new THREE.Group(),
  basePosition: new THREE.Vector3(0.34, -0.31, -0.68),
  recoil: 0,
  nextAttackAt: 0,
};

const playerAvatar = new THREE.Group();
const BEST_KILLS_KEY = "wasd-range-best-zombie-kills";

const bounds = {
  minX: -96,
  maxX: 96,
  minZ: -102,
  maxZ: 90,
};

const game = {
  score: 0,
  streak: 0,
  wave: 0,
  health: 100,
  maxHealth: 100,
  kills: 0,
  bestKills: readBestKills(),
  money: 0,
  weaponId: "pistol",
  unlockedWeapons: new Set(["pistol"]),
  started: false,
  paused: false,
  musicStarted: false,
  over: false,
  zombieTypeId: "math",
  targets: [],
  targetMeshes: [],
  shots: [],
  particles: [],
};

const zombieCoverTexture = createFallbackCoverTexture();
const zombieTextureCache = new Map();

const materials = {
  floor: new THREE.MeshStandardMaterial({ color: 0x627668, roughness: 0.86 }),
  grid: new THREE.LineBasicMaterial({ color: 0xd8e3df, transparent: true, opacity: 0.24 }),
  wall: new THREE.MeshStandardMaterial({ color: 0x344047, roughness: 0.76 }),
  wallCap: new THREE.MeshStandardMaterial({ color: 0xbfc5bb, roughness: 0.72 }),
  post: new THREE.MeshStandardMaterial({ color: 0x2f3941, roughness: 0.68 }),
  targetBody: new THREE.MeshStandardMaterial({
    color: 0xd83243,
    emissive: 0x250306,
    roughness: 0.46,
  }),
  targetRing: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.38,
  }),
  targetCore: new THREE.MeshStandardMaterial({
    color: 0xffd86b,
    emissive: 0x4a3100,
    roughness: 0.34,
  }),
  muzzle: new THREE.MeshBasicMaterial({
    color: 0xfff1a8,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  }),
  tracer: new THREE.LineBasicMaterial({
    color: 0x9ee8ff,
    transparent: true,
    opacity: 0.75,
  }),
  particle: new THREE.MeshBasicMaterial({
    color: 0xffd86b,
    transparent: true,
    opacity: 0.95,
  }),
  gunSlide: new THREE.MeshStandardMaterial({
    color: 0x1a2028,
    metalness: 0.55,
    roughness: 0.36,
  }),
  gunBody: new THREE.MeshStandardMaterial({
    color: 0x252f38,
    metalness: 0.25,
    roughness: 0.48,
  }),
  gunGrip: new THREE.MeshStandardMaterial({
    color: 0x17120f,
    roughness: 0.62,
  }),
  gunSight: new THREE.MeshStandardMaterial({
    color: 0x90f0ff,
    emissive: 0x12404a,
    roughness: 0.25,
  }),
  bowWood: new THREE.MeshStandardMaterial({
    color: 0x5a3320,
    roughness: 0.62,
  }),
  blade: new THREE.MeshStandardMaterial({
    color: 0xdfe8ef,
    metalness: 0.62,
    roughness: 0.2,
  }),
  weaponAccent: new THREE.MeshStandardMaterial({
    color: 0xffd86b,
    emissive: 0x3a2600,
    roughness: 0.34,
  }),
  energy: new THREE.MeshBasicMaterial({
    color: 0x7ee7ff,
  }),
  hand: new THREE.MeshStandardMaterial({
    color: 0xd09b72,
    roughness: 0.78,
  }),
  playerSuit: new THREE.MeshStandardMaterial({
    color: 0x2f6f86,
    roughness: 0.58,
  }),
  playerVest: new THREE.MeshStandardMaterial({
    color: 0x1c252d,
    roughness: 0.52,
  }),
  zombieCover: new THREE.MeshStandardMaterial({
    map: zombieCoverTexture,
    roughness: 0.58,
    side: THREE.DoubleSide,
  }),
  zombieBack: new THREE.MeshStandardMaterial({
    color: 0x4b111b,
    roughness: 0.7,
  }),
  zombieLimb: new THREE.MeshStandardMaterial({
    color: 0x283643,
    roughness: 0.74,
  }),
  zombieSkin: new THREE.MeshStandardMaterial({
    color: 0x9fc28f,
    roughness: 0.82,
  }),
  zombieCloth: new THREE.MeshStandardMaterial({
    color: 0x5b1822,
    roughness: 0.72,
  }),
  zombiePants: new THREE.MeshStandardMaterial({
    color: 0x222b38,
    roughness: 0.78,
  }),
  zombieEye: new THREE.MeshBasicMaterial({
    color: 0xffe66d,
  }),
};

loadZombieTextures();

const muzzleFlash = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), materials.muzzle);
muzzleFlash.frustumCulled = false;
createWeapon();
scene.add(camera);

setupLights();
setupArena();
createPlayerAvatar();
syncCameraMode();
spawnWave();
resize();
updateHud();
syncGamePanels();
animate();
initMobileControls();

playButton.addEventListener("click", () => {
  if (game.over) {
    resetGame();
  }

  game.started = true;
  setPaused(false, { requestLock: false });
  startSoundtrack();

  if (touchControls.enabled) {
    startTouchGame();
    return;
  }

  canvas.requestPointerLock();
});

pauseButton.addEventListener("click", (event) => {
  event.stopPropagation();
  togglePause();
});

resumeButton.addEventListener("click", (event) => {
  event.stopPropagation();
  setPaused(false);
});

cameraModeButton.addEventListener("click", (event) => {
  event.stopPropagation();
  if (game.paused) {
    return;
  }

  toggleCameraMode();

  if (!touchControls.enabled && document.pointerLockElement !== canvas) {
    canvas.requestPointerLock();
  }
});

for (const button of shopButtons) {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    buyOrSelectWeapon(button.dataset.weapon);
  });
}

for (const button of zombieTypeButtons) {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    selectZombieType(button.dataset.zombieType);
  });
}

canvas.addEventListener("mousedown", (event) => {
  if (event.button !== 0) {
    return;
  }

  event.preventDefault();
  startSoundtrack();

  if (touchControls.enabled) {
    return;
  }

  if (document.pointerLockElement !== canvas) {
    canvas.requestPointerLock();
    return;
  }

  input.fire = true;
  useCurrentWeapon();
});

window.addEventListener("mouseup", (event) => {
  if (event.button === 0) {
    input.fire = false;
  }
});

document.addEventListener("pointerlockchange", () => {
  const locked = document.pointerLockElement === canvas;
  if (locked) {
    game.started = true;
    setPaused(false, { requestLock: false });
    return;
  }

  if (!touchControls.enabled && game.started && !game.over) {
    setPaused(true, { fromPointerLock: true });
    return;
  }

  if (!locked) {
    clearInput();
  }

  syncGamePanels();
});

window.addEventListener("resize", resize);

window.addEventListener("keydown", (event) => {
  if (event.code.startsWith("Digit")) {
    const index = event.code === "Digit0" ? 9 : Number.parseInt(event.code.slice(5), 10) - 1;
    const weaponId = WEAPON_ORDER[index];
    if (weaponId) {
      event.preventDefault();
      buyOrSelectWeapon(weaponId);
      return;
    }
  }

  if (event.code === "KeyP" && !event.repeat) {
    event.preventDefault();
    togglePause();
    return;
  }

  if (event.code === "KeyV" && !event.repeat) {
    event.preventDefault();
    toggleCameraMode();
    return;
  }

  if (isControlKey(event.code)) {
    event.preventDefault();
  }

  setKey(event.code, true);
});

window.addEventListener("keyup", (event) => {
  if (isControlKey(event.code)) {
    event.preventDefault();
  }

  setKey(event.code, false);
});

window.addEventListener("blur", clearInput);
window.addEventListener("contextmenu", (event) => event.preventDefault());

window.addEventListener("mousemove", (event) => {
  if (document.pointerLockElement !== canvas) {
    return;
  }

  applyLookDelta(event.movementX, event.movementY, 0.00155, 0.00065);
});

function applyLookDelta(dx, dy, sensitivity, swayScale) {
  player.yaw -= dx * sensitivity;
  player.pitch -= dy * sensitivity;
  player.pitch = THREE.MathUtils.clamp(player.pitch, -1.22, 1.18);

  lookSway.x = THREE.MathUtils.clamp(lookSway.x + dx * swayScale, -0.08, 0.08);
  lookSway.y = THREE.MathUtils.clamp(lookSway.y + dy * swayScale, -0.08, 0.08);
}

function isControlKey(code) {
  return (
    code === "KeyW" ||
    code === "KeyA" ||
    code === "KeyS" ||
    code === "KeyD" ||
    code === "ArrowUp" ||
    code === "ArrowDown" ||
    code === "ArrowLeft" ||
    code === "ArrowRight" ||
    code === "ShiftLeft" ||
    code === "ShiftRight"
  );
}

function setKey(code, pressed) {
  if (code === "KeyW" || code === "ArrowUp") input.forward = pressed;
  if (code === "KeyS" || code === "ArrowDown") input.backward = pressed;
  if (code === "KeyA" || code === "ArrowLeft") input.left = pressed;
  if (code === "KeyD" || code === "ArrowRight") input.right = pressed;
  if (code === "ShiftLeft" || code === "ShiftRight") input.sprint = pressed;
}

function clearInput() {
  input.forward = false;
  input.backward = false;
  input.left = false;
  input.right = false;
  input.sprint = false;
  input.fire = false;
  input.moveX = 0;
  input.moveY = 0;
  resetMoveStick();
}

function hasGameControl() {
  return !game.paused && (document.pointerLockElement === canvas || (touchControls.enabled && game.started && !game.over));
}

function startTouchGame() {
  if (game.over) {
    return;
  }

  game.started = true;
  setPaused(false, { requestLock: false });
  startSoundtrack();
  syncGamePanels();
}

function togglePause() {
  if (!game.started || game.over) {
    return;
  }

  setPaused(!game.paused);
}

function setPaused(paused, options = {}) {
  if (game.over) {
    game.paused = false;
    syncGamePanels();
    return;
  }

  if (!game.started && paused) {
    return;
  }

  game.paused = paused;
  clearInput();

  if (paused) {
    if (soundtrack && !soundtrack.paused) {
      soundtrack.pause();
      gameShell?.classList.remove("is-playing");
    }

    if (!options.fromPointerLock && document.pointerLockElement === canvas) {
      document.exitPointerLock();
    }
  } else if (game.started) {
    resumeSoundtrack();

    if (!touchControls.enabled && options.requestLock !== false && document.pointerLockElement !== canvas) {
      canvas.requestPointerLock();
    }
  }

  syncGamePanels();
}

function syncGamePanels() {
  const menuOpen = !game.started || game.over;
  startPanel.classList.toggle("hidden", game.started && !game.over);
  pausePanel.classList.toggle("hidden", !game.paused || game.over);
  gameShell?.classList.toggle("is-menu", menuOpen);
  gameShell?.classList.toggle("is-paused", game.paused && !game.over);
  pauseButton.disabled = !game.started || game.over;
  pauseButton.textContent = game.paused ? "▶" : "⏸";
}

function startSoundtrack() {
  if (!soundtrack || game.musicStarted) {
    return;
  }

  soundtrack.volume = 0.45;
  const playPromise = soundtrack.play();
  game.musicStarted = true;
  gameShell?.classList.add("is-playing");

  if (playPromise) {
    playPromise.catch(() => {
      game.musicStarted = false;
      gameShell?.classList.remove("is-playing");
    });
  }
}

function stopSoundtrack() {
  if (!soundtrack) {
    return;
  }

  soundtrack.pause();
  soundtrack.currentTime = 0;
  game.musicStarted = false;
  gameShell?.classList.remove("is-playing");
}

function resumeSoundtrack() {
  if (!soundtrack || !game.musicStarted) {
    return;
  }

  const playPromise = soundtrack.play();
  gameShell?.classList.add("is-playing");

  if (playPromise) {
    playPromise.catch(() => {
      gameShell?.classList.remove("is-playing");
    });
  }
}

function initMobileControls() {
  if (!mobileControlsNode || !moveStick || !moveKnob || !mobileLookZone || !mobileFireButton || !mobileSprintButton) {
    return;
  }

  mobileControlsNode.hidden = !touchControls.enabled;

  moveStick.addEventListener("pointerdown", handleMoveStart);
  moveStick.addEventListener("pointermove", handleMoveDrag);
  moveStick.addEventListener("pointerup", handleMoveEnd);
  moveStick.addEventListener("pointercancel", handleMoveEnd);

  mobileLookZone.addEventListener("pointerdown", handleLookStart);
  mobileLookZone.addEventListener("pointermove", handleLookDrag);
  mobileLookZone.addEventListener("pointerup", handleLookEnd);
  mobileLookZone.addEventListener("pointercancel", handleLookEnd);

  mobileFireButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    startTouchGame();
    input.fire = true;
    mobileFireButton.setPointerCapture(event.pointerId);
    useCurrentWeapon();
  });
  mobileFireButton.addEventListener("pointerup", stopTouchFire);
  mobileFireButton.addEventListener("pointercancel", stopTouchFire);

  mobileSprintButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    startTouchGame();
    input.sprint = true;
    mobileSprintButton.setPointerCapture(event.pointerId);
  });
  mobileSprintButton.addEventListener("pointerup", stopTouchSprint);
  mobileSprintButton.addEventListener("pointercancel", stopTouchSprint);
}

function handleMoveStart(event) {
  event.preventDefault();
  startTouchGame();
  touchControls.joystickPointerId = event.pointerId;
  moveStick.setPointerCapture(event.pointerId);
  updateMoveStick(event);
}

function handleMoveDrag(event) {
  if (event.pointerId !== touchControls.joystickPointerId) {
    return;
  }

  event.preventDefault();
  updateMoveStick(event);
}

function handleMoveEnd(event) {
  if (event.pointerId !== touchControls.joystickPointerId) {
    return;
  }

  event.preventDefault();
  touchControls.joystickPointerId = null;
  input.moveX = 0;
  input.moveY = 0;
  resetMoveStick();
}

function updateMoveStick(event) {
  const rect = moveStick.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const maxDistance = rect.width * 0.34;
  let dx = event.clientX - centerX;
  let dy = event.clientY - centerY;
  const distance = Math.hypot(dx, dy);

  if (distance > maxDistance) {
    dx = (dx / distance) * maxDistance;
    dy = (dy / distance) * maxDistance;
  }

  input.moveX = THREE.MathUtils.clamp(dx / maxDistance, -1, 1);
  input.moveY = THREE.MathUtils.clamp(-dy / maxDistance, -1, 1);
  moveKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}

function resetMoveStick() {
  if (moveKnob) {
    moveKnob.style.transform = "translate(-50%, -50%)";
  }
}

function handleLookStart(event) {
  if (!touchControls.enabled || event.target !== mobileLookZone) {
    return;
  }

  event.preventDefault();
  startTouchGame();
  touchControls.lookPointerId = event.pointerId;
  touchControls.lookX = event.clientX;
  touchControls.lookY = event.clientY;
  mobileLookZone.setPointerCapture(event.pointerId);
}

function handleLookDrag(event) {
  if (event.pointerId !== touchControls.lookPointerId) {
    return;
  }

  event.preventDefault();
  const dx = event.clientX - touchControls.lookX;
  const dy = event.clientY - touchControls.lookY;
  touchControls.lookX = event.clientX;
  touchControls.lookY = event.clientY;
  applyLookDelta(dx, dy, 0.0032, 0.0011);
}

function handleLookEnd(event) {
  if (event.pointerId !== touchControls.lookPointerId) {
    return;
  }

  event.preventDefault();
  touchControls.lookPointerId = null;
}

function stopTouchFire(event) {
  event.preventDefault();
  input.fire = false;
}

function stopTouchSprint(event) {
  event.preventDefault();
  input.sprint = false;
}

function toggleCameraMode() {
  cameraState.mode = cameraState.mode === "first" ? "third" : "first";
  syncCameraMode();
}

function syncCameraMode() {
  const firstPerson = cameraState.mode === "first";
  weapon.root.visible = firstPerson;
  playerAvatar.visible = !firstPerson;
  cameraModeButton.textContent = firstPerson ? "3-е лицо" : "1-е лицо";

  if (firstPerson) {
    weapon.root.add(muzzleFlash);
    muzzleFlash.position.set(0.02, 0.04, -0.9);
  } else {
    avatarMuzzle.add(muzzleFlash);
    muzzleFlash.position.set(0, 0, 0);
  }
}

function currentWeapon() {
  return WEAPONS[game.weaponId] ?? WEAPONS.pistol;
}

function buyOrSelectWeapon(weaponId) {
  const item = WEAPONS[weaponId];
  if (!item) {
    return;
  }

  if (!game.unlockedWeapons.has(weaponId)) {
    if (game.money < item.cost) {
      updateHud();
      return;
    }

    game.money -= item.cost;
    game.unlockedWeapons.add(weaponId);
  }

  game.weaponId = weaponId;
  updateWeaponModel();
  updateHud();
}

function updateWeaponModel() {
  const weaponId = game.weaponId;
  const item = currentWeapon();
  const pistolVisible = weaponId === "pistol";

  for (const part of weapon.root.userData.pistolParts ?? []) {
    part.visible = pistolVisible;
  }

  const visuals = weapon.root.userData.weaponVisuals ?? {};
  for (const [id, model] of Object.entries(visuals)) {
    model.visible = id === weaponId;
  }

  const view = item.view ?? [0.34, -0.31, -0.68];
  weapon.basePosition.set(view[0], view[1], view[2]);
}

function readBestKills() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KILLS_KEY) ?? "0", 10) || 0;
  } catch {
    return 0;
  }
}

function saveBestKills(value) {
  try {
    window.localStorage.setItem(BEST_KILLS_KEY, String(value));
  } catch {
  }
}

function selectedZombieType() {
  return ZOMBIE_TYPES.find((type) => type.id === game.zombieTypeId) ?? ZOMBIE_TYPES[0];
}

function selectZombieType(typeId) {
  if (game.started && !game.over) {
    return;
  }

  if (!ZOMBIE_TYPES.some((type) => type.id === typeId)) {
    return;
  }

  game.zombieTypeId = typeId;
  updateZombieTypeButtons();
  applySelectedZombieTexture();
}

function updateZombieTypeButtons() {
  for (const button of zombieTypeButtons) {
    button.classList.toggle("active", button.dataset.zombieType === game.zombieTypeId);
  }
}

function loadZombieTextures() {
  const loader = new THREE.TextureLoader();

  for (const type of ZOMBIE_TYPES) {
    loader.load(
      type.src,
      (texture) => {
        prepareZombieTexture(texture);
        zombieTextureCache.set(type.id, texture);
        if (type.id === game.zombieTypeId) {
          applySelectedZombieTexture();
        }
      },
      undefined,
      () => {
        if (!type.fallbackSrc) {
          if (type.id === game.zombieTypeId) {
            applySelectedZombieTexture();
          }
          return;
        }

        loader.load(
          type.fallbackSrc,
          (texture) => {
            prepareZombieTexture(texture);
            zombieTextureCache.set(type.id, texture);
            if (type.id === game.zombieTypeId) {
              applySelectedZombieTexture();
            }
          },
          undefined,
          () => {
            if (type.id === game.zombieTypeId) {
              applySelectedZombieTexture();
            }
          },
        );
      },
    );
  }

  updateZombieTypeButtons();
  applySelectedZombieTexture();
}

function applySelectedZombieTexture() {
  const texture = zombieTextureCache.get(game.zombieTypeId) ?? zombieCoverTexture;
  materials.zombieCover.map = texture;
  materials.zombieCover.needsUpdate = true;
}

function prepareZombieTexture(texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.x = -1;
  texture.offset.x = 1;
  texture.needsUpdate = true;
}

function createFallbackCoverTexture() {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 512;
  textureCanvas.height = 768;
  const ctx = textureCanvas.getContext("2d");

  ctx.fillStyle = "#f7f7f2";
  ctx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);

  ctx.fillStyle = "#d9002f";
  ctx.fillRect(38, 28, 436, 210);
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 154px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ЕГЭ", 256, 182);

  ctx.fillStyle = "#0b3157";
  ctx.fillRect(0, 270, 512, 140);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(70, 302, 372, 68);
  ctx.fillStyle = "#111111";
  ctx.font = "700 24px Arial, sans-serif";
  ctx.fillText("ЕДИНЫЙ ГОСУДАРСТВЕННЫЙ", 256, 332);
  ctx.fillText("ЭКЗАМЕН", 256, 360);

  ctx.fillStyle = "#d9002f";
  ctx.fillRect(38, 402, 436, 110);
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 66px Arial, sans-serif";
  ctx.fillText("МАТЕМАТИКА", 256, 478);

  ctx.fillStyle = "#f4f0e6";
  ctx.fillRect(82, 530, 348, 68);
  ctx.fillStyle = "#111111";
  ctx.font = "700 30px Arial, sans-serif";
  ctx.fillText("ПРОФИЛЬ", 256, 575);

  ctx.fillStyle = "#d9002f";
  ctx.fillRect(0, 626, 512, 142);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(256, 676, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d9002f";
  ctx.font = "900 52px Arial, sans-serif";
  ctx.fillText("10", 256, 694);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(58, 638, 78, 78);
  ctx.fillStyle = "#111111";
  for (let y = 0; y < 7; y += 1) {
    for (let x = 0; x < 7; x += 1) {
      if ((x * 3 + y * 5) % 4 < 2) {
        ctx.fillRect(66 + x * 9, 646 + y * 9, 7, 7);
      }
    }
  }

  const texture = new THREE.CanvasTexture(textureCanvas);
  prepareZombieTexture(texture);
  return texture;
}

function setupLights() {
  const hemi = new THREE.HemisphereLight(0xe7f7ff, 0x596349, 1.9);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(-12, 22, 10);
  sun.castShadow = true;
  sun.shadow.camera.left = -92;
  sun.shadow.camera.right = 92;
  sun.shadow.camera.top = 92;
  sun.shadow.camera.bottom = -92;
  sun.shadow.mapSize.set(2048, 2048);
  scene.add(sun);
}

function setupArena() {
  const arenaWidth = bounds.maxX - bounds.minX;
  const arenaDepth = bounds.maxZ - bounds.minZ;
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;
  const floorSize = Math.max(arenaWidth, arenaDepth) + 16;

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(floorSize, floorSize), materials.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(centerX, 0, centerZ);
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(floorSize, 96, 0xffffff, 0xffffff);
  grid.position.set(centerX, 0.012, centerZ);
  grid.material = materials.grid;
  scene.add(grid);

  const laneMaterial = new THREE.MeshStandardMaterial({ color: 0xc2d265, roughness: 0.7 });
  for (let x = bounds.minX + 16; x <= bounds.maxX - 16; x += 16) {
    const lane = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, arenaDepth - 16), laneMaterial);
    lane.position.set(x, 0.025, centerZ);
    lane.receiveShadow = true;
    scene.add(lane);
  }

  addWall(centerX, 1.1, bounds.minZ - 4, arenaWidth + 8, 2.2, 0.9);
  addWall(centerX, 1.1, bounds.maxZ + 4, arenaWidth + 8, 2.2, 0.9);
  addWall(bounds.minX - 4, 1.1, centerZ, 0.9, 2.2, arenaDepth + 8);
  addWall(bounds.maxX + 4, 1.1, centerZ, 0.9, 2.2, arenaDepth + 8);

  for (let i = bounds.minX + 24; i <= bounds.maxX - 24; i += 14) {
    const block = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.62, 2.8), materials.wallCap);
    block.position.set(i, 0.31, centerZ - 18 - Math.abs(i) * 0.04);
    block.castShadow = true;
    block.receiveShadow = true;
    scene.add(block);
  }

  for (let index = 0; index < 34; index += 1) {
    const block = new THREE.Mesh(new THREE.BoxGeometry(3 + Math.random() * 3, 0.72, 2 + Math.random() * 3), materials.wallCap);
    block.position.set(
      THREE.MathUtils.lerp(bounds.minX + 8, bounds.maxX - 8, Math.random()),
      0.36,
      THREE.MathUtils.lerp(bounds.minZ + 8, bounds.maxZ - 8, Math.random()),
    );
    if (Math.hypot(block.position.x - playerPosition.x, block.position.z - playerPosition.z) < 12) {
      block.position.x += 16;
    }
    block.castShadow = true;
    block.receiveShadow = true;
    scene.add(block);
  }
}

function addWall(x, y, z, width, height, depth) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), materials.wall);
  wall.position.set(x, y, z);
  wall.castShadow = true;
  wall.receiveShadow = true;
  scene.add(wall);
}

function createWeapon() {
  weapon.root.position.copy(weapon.basePosition);
  weapon.root.rotation.set(-0.05, -0.03, 0.035);
  camera.add(weapon.root);

  const slide = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.58), materials.gunSlide);
  slide.position.set(0.02, 0.02, -0.29);
  weapon.root.add(slide);

  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.4), materials.gunBody);
  frame.position.set(0.02, -0.08, -0.18);
  weapon.root.add(frame);

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.46, 18), materials.gunBody);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0.02, 0.04, -0.62);
  weapon.root.add(barrel);

  const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.035, 18), materials.gunSlide);
  muzzle.rotation.x = Math.PI / 2;
  muzzle.position.set(0.02, 0.04, -0.86);
  weapon.root.add(muzzle);

  const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.045, 0.035), materials.gunSight);
  frontSight.position.set(0.02, 0.13, -0.62);
  weapon.root.add(frontSight);

  const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.045, 0.04), materials.gunSight);
  rearSight.position.set(0.02, 0.13, -0.04);
  weapon.root.add(rearSight);

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.36, 0.18), materials.gunGrip);
  grip.position.set(-0.02, -0.28, 0.02);
  grip.rotation.x = -0.22;
  weapon.root.add(grip);

  const triggerGuard = new THREE.Mesh(new THREE.TorusGeometry(0.088, 0.015, 8, 20), materials.gunBody);
  triggerGuard.position.set(0.02, -0.18, -0.12);
  triggerGuard.rotation.set(Math.PI / 2, 0, 0);
  triggerGuard.scale.set(0.75, 1, 1.25);
  weapon.root.add(triggerGuard);

  const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.12, 0.025), materials.gunSlide);
  trigger.position.set(0.02, -0.19, -0.12);
  trigger.rotation.x = -0.35;
  weapon.root.add(trigger);

  const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 12), materials.hand);
  rightHand.position.set(-0.05, -0.34, 0.02);
  rightHand.scale.set(0.95, 0.76, 1.1);
  weapon.root.add(rightHand);

  const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.14, 18, 12), materials.hand);
  leftHand.position.set(-0.18, -0.28, -0.28);
  leftHand.scale.set(1.2, 0.68, 0.9);
  leftHand.rotation.z = -0.25;
  weapon.root.add(leftHand);

  const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.42, 14), materials.hand);
  forearm.position.set(-0.31, -0.42, -0.08);
  forearm.rotation.set(1.15, 0.12, -0.55);
  weapon.root.add(forearm);

  muzzleFlash.position.set(0.02, 0.04, -0.9);
  weapon.root.add(muzzleFlash);
  weapon.root.userData.pistolParts = weapon.root.children.filter((child) => child !== muzzleFlash);
  createAlternateWeaponModels();
  updateWeaponModel();
}

function createAlternateWeaponModels() {
  weapon.root.userData.weaponVisuals = {
    bow: createBowModel(),
    shotgun: createShotgunModel(),
    rifle: createRifleModel(false),
    sword: createSwordModel(),
    crossbow: createCrossbowModel(),
    sniper: createSniperModel(),
    machinegun: createRifleModel(true),
    railgun: createRailgunModel(),
    minigun: createMinigunModel(),
  };

  for (const model of Object.values(weapon.root.userData.weaponVisuals)) {
    model.visible = false;
    weapon.root.add(model);
  }
}

function createBowModel() {
  const group = new THREE.Group();
  group.position.set(-0.03, -0.02, -0.14);

  const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.026, 0.68, 10), materials.bowWood);
  upper.position.set(-0.18, 0.16, -0.26);
  upper.rotation.set(0.32, 0.18, -0.28);
  group.add(upper);

  const lower = upper.clone();
  lower.position.y = -0.24;
  lower.rotation.z = 0.28;
  group.add(lower);

  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.22, 12), materials.gunGrip);
  grip.position.set(-0.12, -0.04, -0.25);
  grip.rotation.z = 0.05;
  group.add(grip);

  const stringGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-0.23, 0.48, -0.28),
    new THREE.Vector3(-0.04, -0.04, -0.25),
    new THREE.Vector3(-0.23, -0.56, -0.28),
  ]);
  group.add(new THREE.Line(stringGeometry, new THREE.LineBasicMaterial({ color: 0xf7f4e8 })));

  const arrow = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.62, 8), materials.blade);
  arrow.position.set(0.05, -0.04, -0.42);
  arrow.rotation.x = Math.PI / 2;
  group.add(arrow);

  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.1, 10), materials.weaponAccent);
  tip.position.set(0.05, -0.04, -0.78);
  tip.rotation.x = -Math.PI / 2;
  group.add(tip);

  return group;
}

function createRifleModel(isHeavy) {
  const group = new THREE.Group();
  group.position.set(-0.02, -0.01, isHeavy ? -0.08 : -0.12);

  const body = new THREE.Mesh(new THREE.BoxGeometry(isHeavy ? 0.42 : 0.34, 0.16, isHeavy ? 0.82 : 0.68), materials.gunBody);
  body.position.set(0.02, -0.02, -0.28);
  group.add(body);

  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.26), materials.gunGrip);
  stock.position.set(0.02, -0.04, 0.18);
  stock.rotation.x = -0.2;
  group.add(stock);

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(isHeavy ? 0.038 : 0.026, isHeavy ? 0.038 : 0.026, isHeavy ? 0.9 : 0.72, 16), materials.gunSlide);
  barrel.position.set(0.02, 0.02, isHeavy ? -0.92 : -0.78);
  barrel.rotation.x = Math.PI / 2;
  group.add(barrel);

  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.15, isHeavy ? 0.32 : 0.26, 0.16), materials.gunGrip);
  mag.position.set(0.02, -0.25, -0.22);
  mag.rotation.x = 0.12;
  group.add(mag);

  if (isHeavy) {
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.13, 22), materials.gunGrip);
    drum.position.set(0.02, -0.14, -0.16);
    drum.rotation.z = Math.PI / 2;
    group.add(drum);
  }

  return group;
}

function createShotgunModel() {
  const group = new THREE.Group();
  group.position.set(-0.02, -0.02, -0.1);

  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.54), materials.gunBody);
  receiver.position.set(0.02, -0.02, -0.24);
  group.add(receiver);

  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.34), materials.gunGrip);
  stock.position.set(0.02, -0.05, 0.18);
  stock.rotation.x = -0.24;
  group.add(stock);

  const barrelA = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.82, 16), materials.gunSlide);
  barrelA.position.set(-0.04, 0.04, -0.78);
  barrelA.rotation.x = Math.PI / 2;
  group.add(barrelA);

  const barrelB = barrelA.clone();
  barrelB.position.x = 0.08;
  group.add(barrelB);

  const pump = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.28), materials.gunGrip);
  pump.position.set(0.02, -0.12, -0.58);
  group.add(pump);

  return group;
}

function createCrossbowModel() {
  const group = new THREE.Group();
  group.position.set(-0.04, -0.02, -0.18);

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.1, 0.7), materials.gunBody);
  body.position.set(0.02, -0.04, -0.34);
  group.add(body);

  const limb = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.04, 0.08), materials.bowWood);
  limb.position.set(0.02, 0.02, -0.54);
  limb.rotation.z = 0.05;
  group.add(limb);

  const stringGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-0.38, 0.02, -0.58),
    new THREE.Vector3(0.02, -0.02, -0.28),
    new THREE.Vector3(0.42, 0.02, -0.58),
  ]);
  group.add(new THREE.Line(stringGeometry, new THREE.LineBasicMaterial({ color: 0xf7f4e8 })));

  const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.62, 8), materials.blade);
  bolt.position.set(0.02, 0, -0.48);
  bolt.rotation.x = Math.PI / 2;
  group.add(bolt);

  return group;
}

function createSniperModel() {
  const group = createRifleModel(false);
  group.position.set(-0.02, -0.02, -0.06);

  const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.34, 16), materials.gunSlide);
  scope.position.set(0.02, 0.12, -0.24);
  scope.rotation.x = Math.PI / 2;
  group.add(scope);

  const longBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.92, 14), materials.gunSlide);
  longBarrel.position.set(0.02, 0.02, -1.12);
  longBarrel.rotation.x = Math.PI / 2;
  group.add(longBarrel);

  const bipod = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.035, 0.04), materials.gunGrip);
  bipod.position.set(0.02, -0.16, -0.74);
  bipod.rotation.z = 0.1;
  group.add(bipod);

  return group;
}

function createRailgunModel() {
  const group = new THREE.Group();
  group.position.set(-0.03, -0.02, -0.08);

  const core = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.78), materials.gunBody);
  core.position.set(0.02, -0.02, -0.34);
  group.add(core);

  for (const x of [-0.1, 0.14]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, 1.08), materials.energy);
    rail.position.set(x, 0.05, -0.58);
    group.add(rail);
  }

  const coil = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.018, 8, 20), materials.weaponAccent);
  coil.position.set(0.02, 0.02, -0.74);
  coil.rotation.x = Math.PI / 2;
  group.add(coil);

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.26, 0.14), materials.gunGrip);
  grip.position.set(0.02, -0.25, -0.1);
  grip.rotation.x = -0.2;
  group.add(grip);

  return group;
}

function createMinigunModel() {
  const group = new THREE.Group();
  group.position.set(-0.04, -0.02, -0.08);

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.5), materials.gunBody);
  body.position.set(0.02, -0.02, -0.22);
  group.add(body);

  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.16, 22), materials.gunGrip);
  drum.position.set(0.02, -0.14, -0.1);
  drum.rotation.z = Math.PI / 2;
  group.add(drum);

  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * Math.PI * 2;
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.78, 10), materials.gunSlide);
    barrel.position.set(0.02 + Math.cos(angle) * 0.07, 0.02 + Math.sin(angle) * 0.07, -0.78);
    barrel.rotation.x = Math.PI / 2;
    group.add(barrel);
  }

  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.1), materials.weaponAccent);
  handle.position.set(0.02, 0.16, -0.26);
  group.add(handle);

  return group;
}

function createSwordModel() {
  const group = new THREE.Group();
  group.position.set(0.05, -0.04, -0.15);
  group.rotation.set(-0.42, -0.24, -0.38);

  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.035, 1.02), materials.blade);
  blade.position.set(0.02, 0.05, -0.54);
  group.add(blade);

  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.058, 0.16, 4), materials.blade);
  tip.position.set(0.02, 0.05, -1.13);
  tip.rotation.z = Math.PI / 4;
  tip.rotation.x = -Math.PI / 2;
  group.add(tip);

  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.05, 0.08), materials.weaponAccent);
  guard.position.set(0.02, 0.02, -0.02);
  group.add(guard);

  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 12), materials.gunGrip);
  handle.position.set(0.02, -0.02, 0.16);
  handle.rotation.x = Math.PI / 2;
  group.add(handle);

  return group;
}

function createPlayerAvatar() {
  playerAvatar.visible = false;
  scene.add(playerAvatar);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.72, 6, 14), materials.playerSuit);
  torso.position.set(0, 1.04, 0);
  torso.castShadow = true;
  playerAvatar.add(torso);

  const vest = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.58, 0.28), materials.playerVest);
  vest.position.set(0, 1.08, -0.02);
  vest.castShadow = true;
  playerAvatar.add(vest);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 14), materials.hand);
  head.position.set(0, 1.62, 0);
  head.castShadow = true;
  playerAvatar.add(head);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.14, 14), materials.hand);
  neck.position.set(0, 1.42, 0);
  neck.castShadow = true;
  playerAvatar.add(neck);

  const leftArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.58, 5, 10), materials.hand);
  leftArm.position.set(-0.27, 1.16, -0.28);
  leftArm.rotation.set(1.08, -0.18, 0.16);
  leftArm.castShadow = true;
  playerAvatar.add(leftArm);

  const rightArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.62, 5, 10), materials.hand);
  rightArm.position.set(0.27, 1.16, -0.28);
  rightArm.rotation.set(1.08, 0.18, -0.16);
  rightArm.castShadow = true;
  playerAvatar.add(rightArm);

  const leftLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.62, 5, 10), materials.playerSuit);
  leftLeg.position.set(-0.12, 0.42, 0);
  leftLeg.castShadow = true;
  playerAvatar.add(leftLeg);
  playerAvatar.userData.leftLeg = leftLeg;

  const rightLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.62, 5, 10), materials.playerSuit);
  rightLeg.position.set(0.12, 0.42, 0);
  rightLeg.castShadow = true;
  playerAvatar.add(rightLeg);
  playerAvatar.userData.rightLeg = rightLeg;

  const avatarGun = new THREE.Group();
  avatarGun.position.set(0.2, 1.18, -0.58);
  avatarGun.rotation.x = -0.03;
  playerAvatar.add(avatarGun);

  const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.42), materials.gunSlide);
  gunBody.castShadow = true;
  avatarGun.add(gunBody);

  const gunGrip = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.2, 0.1), materials.gunGrip);
  gunGrip.position.set(0, -0.14, 0.1);
  gunGrip.rotation.x = -0.22;
  gunGrip.castShadow = true;
  avatarGun.add(gunGrip);

  avatarMuzzle.position.set(0, 0.02, -0.26);
  avatarGun.add(avatarMuzzle);
}

function spawnWave() {
  if (game.over) {
    return;
  }

  game.wave += 1;
  clearTargets();

  const count = Math.min(6 + game.wave * 3, 42);
  const positions = createTargetPositions(count);
  for (let index = 0; index < count; index += 1) {
    const position = positions[index];
    const target = createTarget(position.x, position.z, 0);
    target.userData.targetId = game.targets.length;
    scene.add(target);
    game.targetMeshes.push(...target.userData.hitMeshes);
    game.targets.push({
      group: target,
      alive: true,
      hp: 78 + game.wave * 20,
      maxHp: 78 + game.wave * 20,
      baseY: target.position.y,
      phase: Math.random() * Math.PI * 2,
      speed: 4.8 + Math.min(game.wave * 0.42, 4.9) + Math.random() * 1.15,
      attackTimer: 0.4 + Math.random() * 0.4,
    });
  }

  updateHud();
}

function createTargetPositions(count) {
  const positions = [];
  let attempts = 0;

  while (positions.length < count && attempts < 1400) {
    attempts += 1;
    const angle = Math.random() * Math.PI * 2;
    const radius = 26 + Math.random() * 62;
    const x = THREE.MathUtils.clamp(playerPosition.x + Math.cos(angle) * radius, bounds.minX + 4, bounds.maxX - 4);
    const z = THREE.MathUtils.clamp(playerPosition.z + Math.sin(angle) * radius, bounds.minZ + 4, bounds.maxZ - 4);
    const farFromPlayer = Math.hypot(playerPosition.x - x, playerPosition.z - z) > 20;
    const farEnough = farFromPlayer && positions.every((p) => Math.hypot(p.x - x, p.z - z) > 3.5);

    if (farEnough) {
      positions.push({ x, z });
    }
  }

  return positions;
}

function createTarget(x, z, y) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const photo = new THREE.Mesh(new THREE.PlaneGeometry(2.25, 3), materials.zombieCover);
  photo.position.set(0, 1.55, 0);
  photo.rotation.y = Math.PI;
  photo.castShadow = true;
  photo.receiveShadow = true;
  group.add(photo);

  group.userData.photo = photo;
  group.userData.hitMeshes = [photo];
  return group;
}

function clearTargets() {
  for (const target of game.targets) {
    scene.remove(target.group);
    disposeObject(target.group);
  }

  game.targets.length = 0;
  game.targetMeshes.length = 0;
}

function animate() {
  const delta = Math.min(clock.getDelta(), 0.033);
  if (!game.paused) {
    updatePlayer(delta);
    updateWeapon(delta);
    updateCombat();
    updateTargets(clock.elapsedTime, delta);
    updateShots(delta);
    updateParticles(delta);
    updateMuzzle(delta);
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function updatePlayer(delta) {
  moveVector.set(0, 0, 0);

  if (hasGameControl()) {
    setFlatForward(worldForward);
    worldRight.crossVectors(worldForward, yAxis).normalize();

    const keyboardX = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const keyboardY = (input.forward ? 1 : 0) - (input.backward ? 1 : 0);
    const moveX = Math.abs(input.moveX) > 0.04 ? input.moveX : keyboardX;
    const moveY = Math.abs(input.moveY) > 0.04 ? input.moveY : keyboardY;

    moveVector.addScaledVector(worldForward, moveY);
    moveVector.addScaledVector(worldRight, moveX);
  }

  const targetSpeed = input.sprint ? player.sprintSpeed : player.speed;
  if (moveVector.lengthSq() > 0) {
    moveVector.normalize().multiplyScalar(targetSpeed);
  }

  const acceleration = moveVector.lengthSq() > 0 ? 24 : 13;
  playerVelocity.x = THREE.MathUtils.damp(playerVelocity.x, moveVector.x, acceleration, delta);
  playerVelocity.z = THREE.MathUtils.damp(playerVelocity.z, moveVector.z, acceleration, delta);

  playerPosition.x += playerVelocity.x * delta;
  playerPosition.z += playerVelocity.z * delta;
  playerPosition.x = THREE.MathUtils.clamp(playerPosition.x, bounds.minX, bounds.maxX);
  playerPosition.z = THREE.MathUtils.clamp(playerPosition.z, bounds.minZ, bounds.maxZ);

  const headBob = Math.sin(clock.elapsedTime * 10.8) * Math.min(playerVelocity.length() * 0.0032, 0.022);
  updatePlayerAvatar(headBob);

  if (cameraState.mode === "first") {
    updateFirstPersonCamera(headBob);
  } else {
    updateThirdPersonCamera(delta, headBob);
  }
}

function setFlatForward(target) {
  return target.set(0, 0, -1).applyAxisAngle(yAxis, player.yaw).normalize();
}

function updateFirstPersonCamera(headBob) {
  camera.position.set(playerPosition.x, player.height + headBob, playerPosition.z);
  camera.rotation.order = "YXZ";
  camera.rotation.set(player.pitch, player.yaw, 0);
}

function updateThirdPersonCamera(delta, headBob) {
  setFlatForward(worldForward);
  worldRight.crossVectors(worldForward, yAxis).normalize();

  cameraTargetPosition
    .set(playerPosition.x, 2.25 + Math.max(-player.pitch, 0) * 0.8 + headBob, playerPosition.z)
    .addScaledVector(worldForward, -5.4)
    .addScaledVector(worldRight, 0.7);

  camera.position.x = THREE.MathUtils.damp(camera.position.x, cameraTargetPosition.x, 10, delta);
  camera.position.y = THREE.MathUtils.damp(camera.position.y, cameraTargetPosition.y, 10, delta);
  camera.position.z = THREE.MathUtils.damp(camera.position.z, cameraTargetPosition.z, 10, delta);

  const aimHeight = THREE.MathUtils.clamp(1.36 + player.pitch * 2.4, 0.35, 4.2);
  cameraLookAt
    .set(playerPosition.x, aimHeight, playerPosition.z)
    .addScaledVector(worldForward, 7.5);
  camera.lookAt(cameraLookAt);
}

function updatePlayerAvatar(headBob) {
  playerAvatar.position.set(playerPosition.x, headBob * 0.4, playerPosition.z);
  playerAvatar.rotation.y = player.yaw;

  const speed = playerVelocity.length();
  const moving = speed > 0.2 && hasGameControl();
  const stride = clock.elapsedTime * (input.sprint ? 13.5 : 10.5);
  const legSwing = moving ? Math.sin(stride) * 0.36 : 0;

  const leftLeg = playerAvatar.userData.leftLeg;
  const rightLeg = playerAvatar.userData.rightLeg;
  if (leftLeg && rightLeg) {
    leftLeg.rotation.x = legSwing;
    rightLeg.rotation.x = -legSwing;
  }
}

function updateWeapon(delta) {
  const speed = playerVelocity.length();
  const moving = speed > 0.2 && hasGameControl();
  const stride = clock.elapsedTime * (input.sprint ? 13.5 : 10.5);
  const bobX = moving ? Math.sin(stride) * 0.016 : 0;
  const bobY = moving ? Math.abs(Math.cos(stride)) * 0.018 : 0;
  const sprintDrop = input.sprint && moving ? -0.035 : 0;

  lookSway.x = THREE.MathUtils.damp(lookSway.x, 0, 9, delta);
  lookSway.y = THREE.MathUtils.damp(lookSway.y, 0, 9, delta);
  weapon.recoil = THREE.MathUtils.damp(weapon.recoil, 0, 18, delta);

  weapon.root.position.x = THREE.MathUtils.damp(
    weapon.root.position.x,
    weapon.basePosition.x - lookSway.x * 0.55 + bobX,
    18,
    delta,
  );
  weapon.root.position.y = THREE.MathUtils.damp(
    weapon.root.position.y,
    weapon.basePosition.y - lookSway.y * 0.28 + bobY + sprintDrop - weapon.recoil * 0.035,
    18,
    delta,
  );
  weapon.root.position.z = THREE.MathUtils.damp(
    weapon.root.position.z,
    weapon.basePosition.z + weapon.recoil * 0.12,
    22,
    delta,
  );

  weapon.root.rotation.x = THREE.MathUtils.damp(weapon.root.rotation.x, -0.05 - lookSway.y * 0.55 - weapon.recoil * 0.18, 18, delta);
  weapon.root.rotation.y = THREE.MathUtils.damp(weapon.root.rotation.y, -0.03 - lookSway.x * 0.9, 18, delta);
  weapon.root.rotation.z = THREE.MathUtils.damp(weapon.root.rotation.z, 0.035 - lookSway.x * 0.45 + bobX * 0.7, 18, delta);
}

function updateTargets(time, delta) {
  for (const target of game.targets) {
    if (!target.alive) {
      continue;
    }

    const dx = playerPosition.x - target.group.position.x;
    const dz = playerPosition.z - target.group.position.z;
    const distance = Math.hypot(dx, dz);
    const dirX = distance > 0.001 ? dx / distance : 0;
    const dirZ = distance > 0.001 ? dz / distance : 0;
    const shamble = Math.sin(time * 6.4 + target.phase);

    target.group.position.y = target.baseY + Math.abs(shamble) * 0.08;
    target.group.lookAt(playerPosition.x, target.group.position.y, playerPosition.z);

    if (distance > 1.15) {
      const slowNearPlayer = distance < 4 ? THREE.MathUtils.mapLinear(distance, 1.15, 4, 0.65, 1) : 1;
      target.group.position.x += dirX * target.speed * slowNearPlayer * delta;
      target.group.position.z += dirZ * target.speed * slowNearPlayer * delta;
      target.group.position.x = THREE.MathUtils.clamp(target.group.position.x, bounds.minX + 1, bounds.maxX - 1);
      target.group.position.z = THREE.MathUtils.clamp(target.group.position.z, bounds.minZ + 1, bounds.maxZ - 1);
    }

    target.attackTimer -= delta;
    if (distance <= 1.45 && target.attackTimer <= 0) {
      damagePlayer(10 + Math.min(game.wave, 8));
      target.attackTimer = Math.max(0.55, 0.95 - game.wave * 0.025);
    }

    const photo = target.group.userData.photo;
    if (photo) {
      photo.position.y = 1.55 + Math.abs(shamble) * 0.12;
      photo.rotation.z = shamble * 0.035;
    }
  }
}

function updateCombat() {
  const item = currentWeapon();
  if (input.fire && item.auto && hasGameControl()) {
    useCurrentWeapon();
  }
}

function useCurrentWeapon() {
  if (game.over || game.paused || !game.started) {
    return;
  }

  const now = clock.elapsedTime;
  const item = currentWeapon();
  if (now < weapon.nextAttackAt) {
    return;
  }

  weapon.nextAttackAt = now + item.cooldown;
  if (item.melee) {
    swingSword(item);
    return;
  }

  shoot(item);
}

function shoot(item) {
  materials.muzzle.opacity = 1;
  weapon.recoil = Math.min(weapon.recoil + (item.recoil ?? (item.auto ? 0.5 : 1)), 1.65);
  muzzleFlash.getWorldPosition(muzzleWorld);

  const pelletCount = item.pellets ?? 1;
  let hits = 0;

  for (let pellet = 0; pellet < pelletCount; pellet += 1) {
    getShotDirection(item.spread ?? 0);
    raycaster.set(camera.position, cameraDirection);
    raycaster.far = item.range;

    const intersections = raycaster.intersectObjects(game.targetMeshes, false);
    const firstHit = intersections[0];
    const end = firstHit
      ? firstHit.point.clone()
      : camera.position.clone().add(cameraDirection.clone().multiplyScalar(item.range));

    addTracer(muzzleWorld.clone(), end);

    if (!firstHit) {
      continue;
    }

    if (item.pierce) {
      const piercedTargets = new Set();
      for (const hit of intersections) {
        const targetId = hit.object.parent.userData.targetId;
        if (piercedTargets.has(targetId)) {
          continue;
        }

        const target = game.targets[targetId];
        if (!target || !target.alive) {
          continue;
        }

        piercedTargets.add(targetId);
        damageTarget(target, item.damage, hit.point, hit.face?.normal ?? cameraDirection, item);
        hits += 1;

        if (piercedTargets.size >= (item.maxPierce ?? 3)) {
          break;
        }
      }
      continue;
    }

    const targetId = firstHit.object.parent.userData.targetId;
    const target = game.targets[targetId];
    if (!target || !target.alive) {
      continue;
    }

    damageTarget(target, item.damage, firstHit.point, firstHit.face?.normal ?? cameraDirection, item);
    hits += 1;
  }

  if (hits === 0) {
    game.streak = 0;
    updateHud();
  }
}

function getShotDirection(spread) {
  camera.getWorldDirection(cameraDirection);

  if (spread <= 0) {
    return cameraDirection.normalize();
  }

  shotRight.crossVectors(cameraDirection, yAxis).normalize();
  shotUp.crossVectors(shotRight, cameraDirection).normalize();
  cameraDirection
    .addScaledVector(shotRight, (Math.random() - 0.5) * spread)
    .addScaledVector(shotUp, (Math.random() - 0.5) * spread)
    .normalize();

  return cameraDirection;
}

function swingSword(item) {
  weapon.recoil = Math.min(weapon.recoil + 1.2, 1.35);
  setFlatForward(worldForward);
  let hits = 0;

  for (const target of game.targets) {
    if (!target.alive) {
      continue;
    }

    const dx = target.group.position.x - playerPosition.x;
    const dz = target.group.position.z - playerPosition.z;
    const distance = Math.hypot(dx, dz);
    if (distance > item.range) {
      continue;
    }

    const dot = (dx / Math.max(distance, 0.001)) * worldForward.x + (dz / Math.max(distance, 0.001)) * worldForward.z;
    if (dot < 0.32) {
      continue;
    }

    const point = target.group.position.clone().add(new THREE.Vector3(0, 1.45, 0));
    damageTarget(target, item.damage, point, worldForward, item);
    hits += 1;
  }

  const slashEnd = playerPosition.clone().addScaledVector(worldForward, item.range);
  slashEnd.y = player.height * 0.75;
  addTracer(new THREE.Vector3(playerPosition.x, player.height * 0.75, playerPosition.z), slashEnd);

  if (hits === 0) {
    game.streak = 0;
    updateHud();
  }
}

function damageTarget(target, amount, point, normal, item) {
  target.hp -= amount;
  spawnHitParticles(point, normal);
  showHitMarker();

  if (target.hp > 0) {
    target.group.scale.setScalar(1 + Math.min(amount / Math.max(target.maxHp, 1), 0.35) * 0.18);
    target.group.userData.hitPulse = 0.12;
    return;
  }

  target.alive = false;
  game.kills += 1;
  if (game.kills > game.bestKills) {
    game.bestKills = game.kills;
    saveBestKills(game.bestKills);
  }

  game.money += (item?.reward ?? 24) + Math.min(game.wave * 3, 36);
  game.score += 100 + game.streak * 20;
  game.streak += 1;

  target.group.scale.setScalar(1);
  target.group.userData.dying = 0.001;
  game.targetMeshes = game.targetMeshes.filter((mesh) => mesh.parent !== target.group);

  const remaining = game.targets.filter((item) => item.alive).length;
  if (remaining === 0 && !game.over) {
    game.money += 45 + game.wave * 12;
    game.health = Math.min(game.maxHealth, game.health + 8);
    setTimeout(() => {
      if (!game.over) {
        spawnWave();
      }
    }, 900);
  }

  updateHud();
}

function addTracer(start, end) {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    start.add(new THREE.Vector3(0, -0.08, 0)),
    end,
  ]);
  const line = new THREE.Line(geometry, materials.tracer.clone());
  line.userData.life = 0.09;
  scene.add(line);
  game.shots.push(line);
}

function updateShots(delta) {
  for (let index = game.shots.length - 1; index >= 0; index -= 1) {
    const shot = game.shots[index];
    shot.userData.life -= delta;
    shot.material.opacity = Math.max(shot.userData.life / 0.09, 0);

    if (shot.userData.life <= 0) {
      scene.remove(shot);
      shot.geometry.dispose();
      shot.material.dispose();
      game.shots.splice(index, 1);
    }
  }

  for (const target of game.targets) {
    if (target.group.userData.hitPulse) {
      target.group.userData.hitPulse -= delta;
      target.group.scale.setScalar(1 + Math.max(target.group.userData.hitPulse, 0) * 1.4);
      if (target.group.userData.hitPulse <= 0) {
        target.group.userData.hitPulse = 0;
        target.group.scale.setScalar(1);
      }
    }

    if (!target.group.userData.dying) {
      continue;
    }

    target.group.userData.dying += delta * 4.2;
    const t = target.group.userData.dying;
    target.group.scale.setScalar(Math.max(1 - t, 0.01));
    target.group.rotation.z += delta * 8;

    if (t >= 1) {
      scene.remove(target.group);
      disposeObject(target.group);
      target.group.userData.dying = 0;
    }
  }
}

function spawnHitParticles(point, normal) {
  const normalVector = normal.clone().normalize();

  for (let index = 0; index < 10; index += 1) {
    const particle = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.055, 0.055), materials.particle.clone());
    particle.position.copy(point);
    particle.userData.life = 0.42 + Math.random() * 0.18;
    particle.userData.velocity = normalVector
      .clone()
      .multiplyScalar(2.8 + Math.random() * 2.5)
      .add(
        new THREE.Vector3(
          (Math.random() - 0.5) * 3.8,
          (Math.random() - 0.15) * 3.2,
          (Math.random() - 0.5) * 3.8,
        ),
      );
    scene.add(particle);
    game.particles.push(particle);
  }
}

function updateParticles(delta) {
  for (let index = game.particles.length - 1; index >= 0; index -= 1) {
    const particle = game.particles[index];
    particle.userData.life -= delta;
    particle.userData.velocity.y -= 8.6 * delta;
    particle.position.addScaledVector(particle.userData.velocity, delta);
    particle.rotation.x += delta * 8;
    particle.rotation.y += delta * 9;
    particle.material.opacity = Math.max(particle.userData.life / 0.55, 0);

    if (particle.userData.life <= 0) {
      scene.remove(particle);
      particle.geometry.dispose();
      particle.material.dispose();
      game.particles.splice(index, 1);
    }
  }
}

function updateMuzzle(delta) {
  materials.muzzle.opacity = THREE.MathUtils.damp(materials.muzzle.opacity, 0, 30, delta);
  muzzleFlash.scale.setScalar(1 + materials.muzzle.opacity * 4);
}

function showHitMarker() {
  hitMarker.classList.remove("active");
  void hitMarker.offsetWidth;
  hitMarker.classList.add("active");
}

function damagePlayer(amount) {
  if (game.over) {
    return;
  }

  game.health = Math.max(0, game.health - amount);
  damageFlash.classList.remove("active");
  void damageFlash.offsetWidth;
  damageFlash.classList.add("active");

  if (game.health <= 0) {
    endGame();
  }

  updateHud();
}

function endGame() {
  game.over = true;
  game.started = false;
  game.paused = false;
  stopSoundtrack();
  clearInput();
  playerVelocity.set(0, 0, 0);
  playButton.textContent = "Заново";
  syncGamePanels();

  if (document.pointerLockElement === canvas) {
    document.exitPointerLock();
  } else {
    syncGamePanels();
  }
}

function resetGame() {
  clearTargets();
  game.score = 0;
  game.streak = 0;
  game.wave = 0;
  game.health = game.maxHealth;
  game.kills = 0;
  game.money = 0;
  game.weaponId = "pistol";
  game.unlockedWeapons = new Set(["pistol"]);
  game.started = false;
  game.paused = false;
  game.over = false;
  playerPosition.set(0, 0, 11);
  playerVelocity.set(0, 0, 0);
  player.yaw = 0;
  player.pitch = 0;
  weapon.nextAttackAt = 0;
  playButton.textContent = "Начать";
  updateWeaponModel();
  applySelectedZombieTexture();
  spawnWave();
  updateHud();
  syncGamePanels();
}

function updateHud() {
  const item = currentWeapon();
  scoreNode.textContent = String(game.kills);
  waveNode.textContent = String(Math.max(game.wave, 1));
  targetsLeftNode.textContent = String(game.targets.filter((target) => target.alive).length);
  bestKillsNode.textContent = String(game.bestKills);
  moneyNode.textContent = `$${game.money}`;
  weaponNameNode.textContent = item.label;
  healthValueNode.textContent = String(Math.ceil(game.health));
  healthFillNode.style.width = `${THREE.MathUtils.clamp((game.health / game.maxHealth) * 100, 0, 100)}%`;
  healthFillNode.style.background =
    game.health > 55 ? "linear-gradient(90deg, #51d66d, #ffd86b)" : game.health > 25 ? "#ffd86b" : "#dc1e30";

  for (const button of shopButtons) {
    const weaponId = button.dataset.weapon;
    const shopItem = WEAPONS[weaponId];
    const unlocked = game.unlockedWeapons.has(weaponId);
    const selected = game.weaponId === weaponId;
    const hotkey = weaponHotkeyLabel(WEAPON_ORDER.indexOf(weaponId));
    button.classList.toggle("active", selected);
    button.classList.toggle("locked", !unlocked);
    button.disabled = !unlocked && game.money < shopItem.cost;
    button.textContent = unlocked
      ? `${hotkey} ${shopItem.label}${selected ? " ✓" : ""}`
      : `${hotkey} ${shopItem.label} $${shopItem.cost}`;
  }
}

function weaponHotkeyLabel(index) {
  return index === 9 ? "0" : String(index + 1);
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }
  });
}
