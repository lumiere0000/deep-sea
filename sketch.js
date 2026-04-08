const simulator = document.getElementById("simulator");
const oceanBg = document.getElementById("ocean-bg");
const oceanParticles = document.getElementById("ocean-particles");
const terrainLayer = document.getElementById("terrain-layer");
const miningLayer = document.getElementById("mining-layer");
const debrisLayer = document.getElementById("debris-layer");
const marineLayer = document.getElementById("marine-layer");
const fishSchoolLayer = document.getElementById("fish-school-layer");
const jellyfishLayer = document.getElementById("jellyfish-layer");
const combJellyLayer = document.getElementById("comb-jelly-layer");

const depthValue = document.getElementById("depthValue");
const zoneName = document.getElementById("zoneName");
const visibilityValue = document.getElementById("visibilityValue");
const pressureValue = document.getElementById("pressureValue");
const bioValue = document.getElementById("bioValue");
const tempValue = document.getElementById("tempValue");
const floodState = document.getElementById("floodState");
const oxygenValue = document.getElementById("oxygenValue");
const oxygenFill = document.getElementById("oxygenFill");
const oxygenMode = document.getElementById("oxygenMode");

const debrisPercent = document.getElementById("debrisPercent");
const glowPercent = document.getElementById("glowPercent");
const energyText = document.getElementById("energyText");

const secretCard = document.getElementById("secretCard");

const whiteModeBtn = document.getElementById("whiteModeBtn");
const offModeBtn = document.getElementById("offModeBtn");
const redModeBtn = document.getElementById("redModeBtn");

const depthTrack = document.getElementById("depthTrack");

const infoButtons = document.querySelectorAll(".info-btn");
const infoPopup = document.getElementById("infoPopup");
const infoPopupTitle = document.getElementById("infoPopupTitle");
const infoPopupBody = document.getElementById("infoPopupBody");
const closeInfoPopup = document.getElementById("closeInfoPopup");

const miningPopupOverlay = document.getElementById("miningPopupOverlay");
const miningPopupBody = document.getElementById("miningPopupBody");
const closeMiningPopup = document.getElementById("closeMiningPopup");

const miningAlarmBtn = document.getElementById("miningAlarmBtn");
const alarmQuickBtn = document.getElementById("alarmQuickBtn");
const miningBlip = document.getElementById("miningBlip");

let maxDepth = 11000;
let currentDepth = 0;
let currentMode = "white";
let redObservationActive = false;
let redObservationTimeout = null;

let miningSystemBuilt = false;
let miningAlertActive = false;
let miningVisible = false;
let miningCycleStart = performance.now();
let miningPassInterval = 10000;
let miningPassDuration = 3500;
let miningDirection = 1;
let previousMiningVisible = false;

const infoText = {
  bio: {
    title: "Bio Activity",
    body: "This shows how much bioluminescent behavior is visible around the vehicle in the current zone."
  },
  temp: {
    title: "Temp",
    body: "This shows the surrounding water temperature around the submersible."
  },
  light: {
    title: "Floodlight",
    body: "White light is bright, Off keeps the scene dark, and Red helps observation with less disturbance."
  }
};

const miningSummaryHTML = `
  <p><strong>Direct harm to marine life:</strong> Heavy mining machines can kill slow-moving deep-sea animals by crushing them. They also make thick sediment clouds that can cover and suffocate living things. Hot or polluted wastewater may also poison or overheat marine life.</p>
  <p><strong>Long-term damage:</strong> Deep-sea mining adds strong noise and bright light to a place that is naturally dark and quiet. This can disturb feeding and breeding. Some deep-sea species grow very slowly, so if their habitat is removed, they may never recover.</p>
  <p><strong>Risk to fishing and food security:</strong> Waste from mining ships may spread far beyond the mining site. That could harm fish and other animals important to ocean food webs and fisheries.</p>
  <p><strong>Social and fairness risks:</strong> Mining would still need coastal facilities on land, which can affect communities that depend on marine resources. There are also concerns that profits may mostly benefit wealthy countries or mining companies.</p>
  <p><strong>Climate risk:</strong> The ocean helps store carbon. Damaging deep-sea ecosystems may weaken part of the ocean’s natural role in regulating climate.</p>
`;

const zoneData = [
  {
    name: "Sunlight Zone",
    min: 0,
    max: 200,
    visibility: "Very High",
    bio: "Low",
    temp: "18°C",
    oxygen: 98,
    gradient: "radial-gradient(circle at 50% 12%, rgba(255,255,255,0.22), transparent 30%), linear-gradient(to bottom, #9be5ff 0%, #6fccff 30%, #2d8dd3 68%, #0d3d73 100%)"
  },
  {
    name: "Twilight Zone",
    min: 200,
    max: 1000,
    visibility: "Medium",
    bio: "Low",
    temp: "12°C",
    oxygen: 88,
    gradient: "radial-gradient(circle at 50% 10%, rgba(255,255,255,0.14), transparent 24%), linear-gradient(to bottom, #5cbdf7 0%, #2d7fcb 36%, #12467d 68%, #081e3f 100%)"
  },
  {
    name: "Midnight Zone",
    min: 1000,
    max: 4000,
    visibility: "Low",
    bio: "Medium",
    temp: "6°C",
    oxygen: 62,
    gradient: "radial-gradient(circle at 50% 8%, rgba(255,255,255,0.08), transparent 18%), linear-gradient(to bottom, #214f97 0%, #0f2b5c 34%, #07152f 70%, #010713 100%)"
  },
  {
    name: "Abyssal Zone",
    min: 4000,
    max: 6000,
    visibility: "Very Low",
    bio: "High",
    temp: "3°C",
    oxygen: 41,
    gradient: "radial-gradient(circle at 50% 7%, rgba(255,255,255,0.04), transparent 14%), linear-gradient(to bottom, #102750 0%, #06152d 35%, #010811 72%, #000000 100%)"
  },
  {
    name: "Hadal Zone",
    min: 6000,
    max: 11000,
    visibility: "Minimal",
    bio: "Extreme",
    temp: "2°C",
    oxygen: 22,
    gradient: "radial-gradient(circle at 50% 6%, rgba(84,247,255,0.04), transparent 14%), linear-gradient(to bottom, #07152e 0%, #020814 32%, #000000 100%)"
  }
];

function setActiveModeButton(mode) {
  [whiteModeBtn, offModeBtn, redModeBtn].forEach((btn) => btn.classList.remove("active"));

  if (mode === "white") whiteModeBtn.classList.add("active");
  if (mode === "off") offModeBtn.classList.add("active");
  if (mode === "red") redModeBtn.classList.add("active");
}

function triggerRedObservation() {
  redObservationActive = true;
  secretCard.classList.remove("show");

  clearTimeout(redObservationTimeout);

  updateEnvironment(getScrollProgress());

  redObservationTimeout = setTimeout(() => {
    redObservationActive = false;
    secretCard.classList.remove("show");
    updateEnvironment(getScrollProgress());
  }, 1000);
}

function setMode(mode) {
  currentMode = mode;
  simulator.classList.remove("mode-white", "mode-off", "mode-red");
  simulator.classList.add(`mode-${mode}`);
  setActiveModeButton(mode);

  if (mode === "white") floodState.textContent = "WHITE";
  if (mode === "off") floodState.textContent = "OFF";
  if (mode === "red") floodState.textContent = "RED";

  updateEnvironment(getScrollProgress());
}

whiteModeBtn.addEventListener("click", () => {
  setMode("white");
});

offModeBtn.addEventListener("click", () => {
  setMode("off");
});

redModeBtn.addEventListener("click", () => {
  setMode("red");
  triggerRedObservation();
});

infoButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.info;
    infoPopupTitle.textContent = infoText[key].title;
    infoPopupBody.textContent = infoText[key].body;
    infoPopup.classList.remove("hidden");
  });
});

closeInfoPopup.addEventListener("click", () => {
  infoPopup.classList.add("hidden");
});

closeMiningPopup.addEventListener("click", () => {
  miningPopupOverlay.classList.add("hidden");
});

function getScrollProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) return 0;
  return Math.max(0, Math.min(window.scrollY / maxScroll, 1));
}

/* DEPTH TICKS */
function buildDepthTicks() {
  depthTrack.innerHTML = "";
  const totalTicks = 21;

  for (let i = 0; i < totalTicks; i++) {
    const tick = document.createElement("div");
    tick.className = "tick";
    if (i % 5 === 0) tick.classList.add("major");
    tick.dataset.index = i;
    depthTrack.appendChild(tick);
  }
}

function updateDepthTicks(progress) {
  const ticks = [...depthTrack.querySelectorAll(".tick")];
  const center = (ticks.length - 1) / 2;
  const floatShift = progress * 220;

  ticks.forEach((tick, i) => {
    const y = (i - center) * 18 + 84 - (floatShift % 18);
    tick.style.top = `${y}px`;

    const dist = Math.abs(y - 150);
    const fade = Math.min(dist / 150, 1);

    tick.style.opacity = `${1 - fade * 0.85}`;
    tick.style.transform = `translateX(-50%) scale(${1 - fade * 0.16})`;

    if (y < -20 || y > 300) {
      tick.classList.add("hidden");
    } else {
      tick.classList.remove("hidden");
    }
  });
}

/* BUBBLES */
function createBubbles() {
  oceanParticles.innerHTML = "";
  for (let i = 0; i < 48; i++) {
    const b = document.createElement("div");
    b.className = "bubble";
    resetBubble(b, true);
    oceanParticles.appendChild(b);
  }
}

function resetBubble(el, randomY = false) {
  el.style.left = `${Math.random() * 100}%`;
  el.style.top = randomY ? `${Math.random() * 100}%` : `${100 + Math.random() * 10}%`;
  el.dataset.speed = (0.08 + Math.random() * 0.22).toFixed(3);

  const size = (2 + Math.random() * 3).toFixed(2);
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.opacity = (0.14 + Math.random() * 0.35).toFixed(2);
}

function animateParticles() {
  const bubbles = document.querySelectorAll(".bubble");

  bubbles.forEach((b) => {
    const currentTop = parseFloat(b.style.top);
    const speed = parseFloat(b.dataset.speed);
    b.style.top = `${currentTop - speed}%`;

    if (currentTop < -5) {
      resetBubble(b, false);
    }
  });

  requestAnimationFrame(animateParticles);
}

/* TERRAIN */
function updateTerrain(depth) {
  terrainLayer.innerHTML = "";
  const depthProgress = depth / maxDepth;
  const ridgeCount = Math.floor(3 + depthProgress * 8);

  for (let i = 0; i < ridgeCount; i++) {
    const ridge = document.createElement("div");
    ridge.className = "terrain-ridge";

    const width = 180 + Math.random() * 260 - depthProgress * 50;
    const height = 60 + Math.random() * 90 + depthProgress * 80;
    const left = (i / ridgeCount) * 100 + (Math.random() * 8 - 4);

    ridge.style.width = `${Math.max(100, width)}px`;
    ridge.style.height = `${height}px`;
    ridge.style.left = `calc(${left}% - ${width / 2}px)`;
    ridge.style.opacity = `${0.16 + depthProgress * 0.36}`;

    terrainLayer.appendChild(ridge);
  }
}

/* DEBRIS */
function updateDebris(depth) {
  debrisLayer.innerHTML = "";

  const depthProgress = depth / maxDepth;
  const debrisValue = Math.min(89, Math.floor(depthProgress * 100));
  debrisPercent.textContent = `${debrisValue}%`;
}

/* MARINE */
function spawnMarine(depth, mode) {
  marineLayer.innerHTML = "";

  let creatureCount = 0;
  let bioCount = 0;
  let showLoosejaw = false;

  if (depth > 400) creatureCount = 4;
  if (depth > 1200) creatureCount = 7;
  if (depth > 4000) creatureCount = 10;

  if (mode === "off") {
    if (depth > 800) bioCount = 8;
    if (depth > 2500) bioCount = 14;
    if (depth > 6000) bioCount = 18;
  }

  if (mode === "red") {
    if (depth > 800) bioCount = 10;
    if (depth > 2500) bioCount = 16;
    if (depth > 6000) bioCount = 20;
  }

  if (mode === "white") {
    if (depth > 800) bioCount = 4;
    if (depth > 2500) bioCount = 8;
    if (depth > 6000) bioCount = 10;
  }

  if (mode === "red" && redObservationActive && depth > 2500) {
    showLoosejaw = true;
  }

  const zone = getZone(depth);
  const oxygenFactor = Math.max(0.25, zone.oxygen / 100);
  const glowStrength = mode === "white" ? oxygenFactor * 0.7 : oxygenFactor;

  for (let i = 0; i < creatureCount; i++) {
    const c = document.createElement("div");
    c.className = "creature";

    const w = 14 + Math.random() * 44;
    const h = 6 + Math.random() * 18;

    c.style.width = `${w}px`;
    c.style.height = `${h}px`;
    c.style.left = `${10 + Math.random() * 80}%`;
    c.style.top = `${18 + Math.random() * 56}%`;
    c.style.opacity = mode === "white"
      ? (0.06 + Math.random() * 0.08).toFixed(2)
      : (0.14 + Math.random() * 0.14).toFixed(2);

    marineLayer.appendChild(c);
  }

  for (let i = 0; i < bioCount; i++) {
    const p = document.createElement("div");
    p.className = "bio-pulse";
    p.style.left = `${10 + Math.random() * 80}%`;
    p.style.top = `${14 + Math.random() * 62}%`;

    const duration = (2 + (1 - oxygenFactor) * 4 + Math.random() * 2).toFixed(2);
    p.style.animation = `bioBlink ${duration}s ease-in-out ${Math.random() * 3}s infinite`;
    p.style.opacity = `${0.15 + glowStrength * 0.4}`;
    p.style.transform = `scale(${0.7 + glowStrength * 0.5})`;

    if (mode === "red") {
      p.style.background = "rgba(255,90,90,0.95)";
      p.style.boxShadow = "0 0 12px rgba(255,90,90,0.7), 0 0 24px rgba(255,90,90,0.22)";
    }

    marineLayer.appendChild(p);
  }

  if (showLoosejaw) {
    const loosejaw = document.createElement("div");
    loosejaw.className = "loosejaw-secret";
    loosejaw.style.left = "58%";
    loosejaw.style.top = "46%";
    loosejaw.style.opacity = "1";
    marineLayer.appendChild(loosejaw);
    secretCard.classList.add("show");
  } else {
    secretCard.classList.remove("show");
  }
}

/* BACKGROUND FISH SCHOOL */
function buildFishSchool() {
    if (!fishSchoolLayer) return;
  
    fishSchoolLayer.innerHTML = "";
  
    const viewportHeight = window.innerHeight;
  
    // keep fish clearly above cockpit / radar
    const safeBottomPx = viewportHeight - 330;
    const safeBottomPercent = Math.max(20, (safeBottomPx / viewportHeight) * 100);
  
    // fixed swim lanes so groups don't pile up
    const lanes = [
      12,
      20,
      28,
      36,
      44,
      Math.min(52, safeBottomPercent - 10)
    ];
  
    const formations = [
      { count: 1, lane: lanes[0], depth: "far", direction: "left" },
      { count: 2, lane: lanes[1], depth: "mid", direction: "right" },
      { count: 1, lane: lanes[2], depth: "mid", direction: "left" },
      { count: 3, lane: lanes[3], depth: "far", direction: "right" },
      { count: 2, lane: lanes[4], depth: "near", direction: "left" },
      { count: 1, lane: lanes[5], depth: "mid", direction: "right" }
    ];
  
    formations.forEach((group, index) => {
      spawnPlannedGroup({
        count: group.count,
        laneTop: group.lane,
        depthClass: group.depth,
        direction: group.direction,
        groupIndex: index
      });
    });
  }
  
  function spawnPlannedGroup({ count, laneTop, depthClass, direction, groupIndex }) {
    let offsets = [0];
  
    if (count === 2) offsets = [-1.8, 1.8];
    if (count === 3) offsets = [-3, 0, 3];
    if (count === 4) offsets = [-4.2, -1.4, 1.4, 4.2];
    if (count === 5) offsets = [-5.2, -2.6, 0, 2.6, 5.2];
  
    offsets.forEach((offset, i) => {
      const fish = createSchoolFish({
        top: laneTop + offset,
        size: getFishSize(depthClass) * randomRange(0.94, 1.04),
        duration: getFishDuration(depthClass) + randomRange(-1.4, 1.4),
        delay: getNegativeDelay(12, 30) - i * 1.1 - groupIndex * 0.5,
        depthClass,
        direction
      });
  
      fishSchoolLayer.appendChild(fish);
    });
  }
  
  function createSchoolFish({ top, size, duration, delay, depthClass, direction }) {
    const wrapper = document.createElement("div");
    wrapper.className = `school-fish ${depthClass} ${direction === "right" ? "use-right" : "use-left"}`;
  
    wrapper.style.top = `${top}%`;
    wrapper.style.width = `${size}px`;
    wrapper.style.height = `${size * 0.44}px`;
    wrapper.style.animationDuration = `${duration}s`;
    wrapper.style.animationDelay = `${delay}s`;
  
    if (depthClass === "far") {
      wrapper.style.opacity = `${0.05 + Math.random() * 0.02}`;
      wrapper.style.filter = `blur(1px) brightness(${0.78 + Math.random() * 0.08})`;
    } else if (depthClass === "near") {
      wrapper.style.opacity = `${0.14 + Math.random() * 0.04}`;
      wrapper.style.filter = `blur(0.15px) brightness(${0.9 + Math.random() * 0.1})`;
    } else {
      wrapper.style.opacity = `${0.09 + Math.random() * 0.03}`;
      wrapper.style.filter = `blur(0.45px) brightness(${0.84 + Math.random() * 0.1})`;
    }
  
    wrapper.innerHTML = `
      <svg viewBox="0 0 235 104" aria-hidden="true">
        <g class="fish-body">
          <use href="#fish-symbol"></use>
        </g>
      </svg>
    `;
  
    return wrapper;
  }
  
  function getFishSize(depthClass) {
    if (depthClass === "far") return randomRange(34, 48);
    if (depthClass === "near") return randomRange(84, 112);
    return randomRange(56, 72);
  }
  
  function getFishDuration(depthClass) {
    if (depthClass === "far") return randomRange(24, 30);
    if (depthClass === "near") return randomRange(15, 20);
    return randomRange(18, 24);
  }
  
  function getNegativeDelay(minDuration, maxDuration) {
    return -randomRange(minDuration, maxDuration);
  }
  
  function randomRange(min, max) {
    return min + Math.random() * (max - min);
  }


/* JELLYFISH - MOVING SUNLIGHT ZONE ONLY */
let jellyCtx = null;
let jellyfish = [];
let jellyAnimId = null;

function setupJellyfishLayer() {
  if (!jellyfishLayer) return;
  jellyCtx = jellyfishLayer.getContext("2d", { alpha: true });
  resizeJellyfishCanvas();
  createJellyfishSet();

  if (!jellyAnimId) {
    jellyAnimId = requestAnimationFrame(animateJellyfish);
  }
}

function resizeJellyfishCanvas() {
  if (!jellyfishLayer || !jellyCtx) return;

  const w = window.innerWidth;
  const h = window.innerHeight;

  jellyfishLayer.width = w;
  jellyfishLayer.height = h;
  jellyfishLayer.style.width = `${w}px`;
  jellyfishLayer.style.height = `${h}px`;
}

function createJellyfishSet() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  jellyfish = [
    makeJelly({
      startX: -140,
      startY: h * 0.18,
      scale: 0.60,
      depth: "far",
      speed: 0.22,
      lane: h * 0.18,
      drift: 10
    }),
    makeJelly({
      startX: w + 120,
      startY: h * 0.28,
      scale: 0.82,
      depth: "mid",
      speed: -0.34,
      lane: h * 0.28,
      drift: 14
    }),
    makeJelly({
      startX: -220,
      startY: h * 0.40,
      scale: 1.12,
      depth: "near",
      speed: 0.48,
      lane: h * 0.40,
      drift: 18
    }),
    makeJelly({
      startX: w + 160,
      startY: h * 0.14,
      scale: 0.52,
      depth: "far",
      speed: -0.18,
      lane: h * 0.14,
      drift: 8
    })
  ];
}

function makeJelly({ startX, startY, scale, depth, speed, lane, drift }) {
    const size = 25 * scale;
  
    return {
      x: startX,
      y: startY,
      baseY: lane,
      scale,
      depth,
      speed,
      drift,
      phase: Math.random() * Math.PI * 2,
      pulse: Math.random() * Math.PI * 2,
      tilt: Math.random() * Math.PI * 2,
      size,
      alpha: depth === "near" ? 0.56 : depth === "mid" ? 0.40 : 0.26,
      lineWidth: depth === "near" ? 1.6 : depth === "mid" ? 1.2 : 0.9,
      tentacles: depth === "near" ? 10 : depth === "mid" ? 9 : 8
    };
}

function animateJellyfish(time) {
  if (!jellyCtx || !jellyfishLayer) {
    jellyAnimId = requestAnimationFrame(animateJellyfish);
    return;
  }

  const w = jellyfishLayer.width;
  const h = jellyfishLayer.height;

  jellyCtx.clearRect(0, 0, w, h);

  if (currentDepth <= 200) {
    for (const j of jellyfish) {
      j.x += j.speed;
      j.y = j.baseY + Math.sin(time * 0.0012 + j.phase) * j.drift;

      if (j.speed > 0 && j.x > w + 220) {
        j.x = -220;
        j.baseY = randomRange(h * 0.10, h * 0.46);
      }

      if (j.speed < 0 && j.x < -220) {
        j.x = w + 220;
        j.baseY = randomRange(h * 0.10, h * 0.46);
      }

      drawBetterJellyfish(jellyCtx, j, time, currentMode);
    }
  }

  jellyAnimId = requestAnimationFrame(animateJellyfish);
}

function drawBetterJellyfish(ctx, j, time, mode) {
    const pulse = 1 + Math.sin(time * 0.003 + j.pulse) * 0.05;
    const r = j.size * pulse;
    const facingRight = j.speed > 0;
    const dir = facingRight ? 1 : -1;
    const tilt = Math.sin(time * 0.0013 + j.tilt) * 0.10;
  
    ctx.save();
    ctx.translate(j.x, j.y);
    ctx.scale(dir, 1);
    ctx.rotate(tilt);
    ctx.globalAlpha = j.alpha;
  
    const capHalfW = r * 1.22;
    const capTopY = -r * 0.92;
    const capBottomY = r * 0.08;
  
   /* outer glow ONLY in dark/red */
if (mode === "off") {
    const glow = ctx.createRadialGradient(0, -r * 0.05, 0, 0, -r * 0.05, r * 1.5);
    glow.addColorStop(0, "rgba(240,245,255,0.92)");
    glow.addColorStop(0.2, "rgba(185,220,255,0.24)");
    glow.addColorStop(0.55, "rgba(80,130,200,0.10)");
    glow.addColorStop(1, "rgba(40,70,120,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.35, 0, Math.PI * 2);
    ctx.fill();
  }
  
    /* dome fill */
    const domeGrad = ctx.createLinearGradient(0, capTopY, 0, capBottomY);
    domeGrad.addColorStop(0, "rgba(245,248,255,0.18)");
    domeGrad.addColorStop(0.35, "rgba(145,195,245,0.12)");
    domeGrad.addColorStop(0.75, "rgba(45,85,145,0.10)");
    domeGrad.addColorStop(1, "rgba(20,45,85,0.02)");
    ctx.fillStyle = domeGrad;
  
    ctx.beginPath();
    ctx.moveTo(-capHalfW, capBottomY);
    ctx.quadraticCurveTo(-capHalfW * 0.82, capTopY, 0, capTopY);
    ctx.quadraticCurveTo(capHalfW * 0.82, capTopY, capHalfW, capBottomY);
    ctx.quadraticCurveTo(0, capBottomY + r * 0.34, -capHalfW, capBottomY);
    ctx.closePath();
    ctx.fill();
  
    const core = ctx.createRadialGradient(0, -r * 0.02, 0, 0, -r * 0.02, r * 0.48);

if (mode === "off") {
  // glow version (deep sea)
  core.addColorStop(0, "rgba(245,248,255,0.9)");
  core.addColorStop(0.25, "rgba(165,205,245,0.45)");
  core.addColorStop(0.6, "rgba(38,78,130,0.35)");
  core.addColorStop(1, "rgba(18,40,78,0)");
} else {
  // non-glow version (white + red)
  core.addColorStop(0, "rgba(160,190,230,0.35)");
  core.addColorStop(0.4, "rgba(60,100,160,0.25)");
  core.addColorStop(1, "rgba(20,40,80,0)");
}

ctx.fillStyle = core;
  
    /* dome outline */
    ctx.lineWidth = j.lineWidth;
    ctx.strokeStyle = "rgba(215,232,255,0.20)";
    ctx.beginPath();
    ctx.moveTo(-capHalfW, capBottomY);
    ctx.quadraticCurveTo(-capHalfW * 0.82, capTopY, 0, capTopY);
    ctx.quadraticCurveTo(capHalfW * 0.82, capTopY, capHalfW, capBottomY);
    ctx.stroke();
  
    /* underside closing line */
    ctx.strokeStyle = "rgba(205,226,255,0.18)";
    ctx.beginPath();
    ctx.moveTo(-capHalfW * 0.98, capBottomY);
    ctx.lineTo(capHalfW * 0.98, capBottomY);
    ctx.stroke();
  
    /* outer shell bands */
    for (let i = 1; i <= 4; i++) {
      const s = 1 + i * 0.16;
      ctx.beginPath();
      ctx.strokeStyle = i % 2 === 0
        ? "rgba(90,145,205,0.11)"
        : "rgba(220,236,255,0.11)";
      ctx.moveTo(-capHalfW * s, capBottomY);
      ctx.quadraticCurveTo(-capHalfW * 0.82 * s, capTopY - r * 0.02 * i, 0, capTopY - r * 0.02 * i);
      ctx.quadraticCurveTo(capHalfW * 0.82 * s, capTopY - r * 0.02 * i, capHalfW * s, capBottomY);
      ctx.stroke();
    }
  
    /* inner ribs */
    const ribCount = 7;
    for (let i = 0; i < ribCount; i++) {
      const spread = -0.84 + (i / (ribCount - 1)) * 1.68;
      const endX = spread * capHalfW * 0.92;
  
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.04);
      ctx.quadraticCurveTo(
        spread * r * 0.34,
        capTopY * 0.92,
        endX,
        capBottomY
      );
      ctx.strokeStyle = i % 2 === 0
        ? "rgba(225,240,255,0.10)"
        : "rgba(80,135,195,0.10)";
      ctx.lineWidth = Math.max(0.7, j.lineWidth * 0.9);
      ctx.stroke();
    }
  
    /* fuller tentacle curtain */
    const tentacleCount = j.tentacles;
    const tentacleSpread = capHalfW * 0.92;
  
    for (let i = 0; i < tentacleCount; i++) {
      const t = tentacleCount === 1 ? 0.5 : i / (tentacleCount - 1);
      const spread = -1 + t * 2;
  
      const startX = spread * tentacleSpread * 0.62;
      const startY = capBottomY + r * 0.04;
  
      const swayA = Math.sin(time * 0.0017 + j.phase + i * 0.32) * r * 0.10;
      const swayB = Math.cos(time * 0.00125 + j.phase + i * 0.27) * r * 0.08;
  
      const len = r * (2.45 + t * 0.55);
  
      const c1x = startX + swayA * 0.25;
      const c1y = startY + len * 0.28;
  
      const c2x = startX + swayA * 0.65 + swayB * 0.4;
      const c2y = startY + len * 0.62;
  
      const endX = startX + swayA + swayB * 0.65;
      const endY = startY + len;
  
      const grad = ctx.createLinearGradient(startX, startY, endX, endY);
      grad.addColorStop(0, i % 2 === 0
        ? "rgba(245,247,255,0.34)"
        : "rgba(120,175,230,0.28)");
      grad.addColorStop(0.45, i % 2 === 0
        ? "rgba(220,230,245,0.18)"
        : "rgba(75,120,175,0.18)");
      grad.addColorStop(1, "rgba(22,44,82,0)");
  
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.bezierCurveTo(c1x, c1y, c2x, c2y, endX, endY);
      ctx.strokeStyle = grad;
      ctx.lineWidth = i % 2 === 0 ? j.lineWidth : Math.max(0.75, j.lineWidth * 0.92);
      ctx.stroke();
    }
  
    /* a few longer outer drifts */
    for (let i = 0; i < 3; i++) {
      const side = i === 0 ? -1 : i === 1 ? 0 : 1;
      const startX = side * capHalfW * 0.24;
      const startY = capBottomY + r * 0.10;
      const drift = Math.sin(time * 0.0014 + j.phase + i) * r * 0.18;
  
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.bezierCurveTo(
        startX + drift * 0.4,
        startY + r * 0.8,
        startX + drift,
        startY + r * 1.7,
        startX + drift * 1.5,
        startY + r * 2.9
      );
      ctx.strokeStyle = "rgba(80,120,170,0.10)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  
    ctx.restore();
  }

/* COMB JELLIES - CANVAS VERSION */
let combCtx = null;
let combJellies = [];
let combAnimId = null;

function setupCombJellyLayer() {
  if (!combJellyLayer) return;

  combCtx = combJellyLayer.getContext("2d", { alpha: true });
  resizeCombJellyCanvas();
  createCombJellies();

  if (!combAnimId) {
    combAnimId = requestAnimationFrame(animateCombJellies);
  }
}

function resizeCombJellyCanvas() {
  if (!combJellyLayer || !combCtx) return;

  const w = window.innerWidth;
  const h = window.innerHeight;

  combJellyLayer.width = w;
  combJellyLayer.height = h;
  combJellyLayer.style.width = `${w}px`;
  combJellyLayer.style.height = `${h}px`;
}

function createCombJellies() {
    const w = window.innerWidth;
    const h = window.innerHeight;
  
    combJellies = [
      makeCombJelly({
        x: w * 0.12,          // starts already visible
        y: h * 0.14,          // a bit higher so it's not too close to jellyfish
        scale: 0.32,
        speed: 0.22,
        drift: 8,
        ribCount: 8,
        particleCount: 10,
        depth: "far"
      }),
      makeCombJelly({
        x: w * 0.78,          // starts visible on the right side
        y: h * 0.22,          // spaced away vertically
        scale: 0.46,
        speed: -0.30,
        drift: 10,
        ribCount: 10,
        particleCount: 14,
        depth: "mid"
      }),
      makeCombJelly({
        x: w * 0.32,          // starts visible near middle-left
        y: h * 0.30,          // separated from the others
        scale: 0.62,
        speed: 0.40,
        drift: 14,
        ribCount: 12,
        particleCount: 18,
        depth: "near"
      })
    ];
}

function makeCombJelly({ x, y, scale, speed, drift, ribCount, particleCount, depth }) {
  const baseHeight = 120 * scale;
  const baseWidth = 42 * scale;

  const glowPalette = [
    "rgba(120, 255, 255, 0.6)", // cyan
    "rgba(90, 170, 255, 0.6)",  // electric blue
    "rgba(190, 255, 230, 0.6)", // pale mint
    "rgba(210, 180, 255, 0.6)"  // soft violet
  ];

  const jelly = {
    x,
    y,
    baseY: y,
    scale,
    speed,
    drift,
    ribCount,
    particleCount,
    depth,
    phase: Math.random() * Math.PI * 2,
    spin: Math.random() * Math.PI * 2,
    baseHeight,
    baseWidth,
    particles: []
  };

  for (let i = 0; i < particleCount; i++) {
    jelly.particles.push({
      ribIndex: Math.floor(Math.random() * ribCount),
      t: Math.random(),
      speed: 0.003 + Math.random() * 0.004,
      size: 2 + Math.random() * 3, // 2px to 5px
      color: glowPalette[Math.floor(Math.random() * glowPalette.length)],
      alphaPhase: Math.random() * Math.PI * 2
    });
  }

  return jelly;
}

function animateCombJellies(time) {
  if (!combCtx || !combJellyLayer) {
    combAnimId = requestAnimationFrame(animateCombJellies);
    return;
  }

  const w = combJellyLayer.width;
  const h = combJellyLayer.height;

  combCtx.clearRect(0, 0, w, h);

  if (currentDepth <= 200) {
    for (const jelly of combJellies) {
      updateCombJelly(jelly, w, h);
      drawCombJelly(combCtx, jelly, time);
    }
  }

  combAnimId = requestAnimationFrame(animateCombJellies);
}

function updateCombJelly(jelly, w, h) {
  jelly.x += jelly.speed;
  jelly.y = jelly.baseY + Math.sin(performance.now() * 0.0012 + jelly.phase) * jelly.drift;

  const respawnOffset = 40; // much closer to screen edge

  if (jelly.speed > 0 && jelly.x > w + respawnOffset) {
    jelly.x = -respawnOffset;
    jelly.baseY = randomRange(h * 0.10, h * 0.32);
  }

  if (jelly.speed < 0 && jelly.x < -respawnOffset) {
    jelly.x = w + respawnOffset;
    jelly.baseY = randomRange(h * 0.10, h * 0.32);
  }

  for (const particle of jelly.particles) {
    particle.t += particle.speed;

    if (particle.t > 1) {
      particle.t = 0;
      particle.ribIndex = Math.floor(Math.random() * jelly.ribCount);
      particle.speed = 0.003 + Math.random() * 0.004;
      particle.size = 2 + Math.random() * 3;
    }
  }
}

function drawCombJelly(ctx, jelly, time) {
    const frame = time * 0.03 + jelly.phase * 30;
    const pulse = Math.pow(Math.sin(frame * 0.018), 2);
  
    const restHeight = jelly.baseHeight;
    const minHeight = restHeight * 0.32;
    const maxHeight = restHeight * 1.5;
  
    const h = maxHeight - (maxHeight - minHeight) * pulse;
  
    const squashRatio = 1 - (h / maxHeight);
    const widthBoost = 1 + squashRatio * 1.8;
    const w = jelly.baseWidth * widthBoost;
  
    const centerY = jelly.y;
  
    const top = {
      x: jelly.x,
      y: centerY - h * 0.5
    };
  
    const bottom = {
      x: jelly.x,
      y: centerY + h * 0.5
    };
  
    const ribs = [];
    for (let i = 0; i < jelly.ribCount; i++) {
      ribs.push(getCombRibGeometry(jelly, i, top, bottom, h, w, frame, pulse));
    }
  
    ribs.sort((a, b) => a.depth - b.depth);
  
    // LIGHT STATE
    const lightMode = getCombJellyLightMode();
  
    let ribAlpha = 0.06;         // almost invisible when no light
    let ribColor = "180, 220, 255";
    let ribLineWidth = jelly.depth === "near" ? 1 : 0.5;
    let particleBoost = 1.0;
    let particleGlow = 15;
  
    if (lightMode === "white") {
      ribAlpha = 0.30;
      ribColor = "235, 245, 255";
      ribLineWidth = jelly.depth === "near" ? 1.2 : 0.8;
      particleBoost = 1.6;
      particleGlow = 32;
    } else if (lightMode === "red") {
      ribAlpha = 0.22;
      ribColor = "255, 210, 210";
      ribLineWidth = jelly.depth === "near" ? 1.1 : 0.7;
      particleBoost = 1.6;
      particleGlow = 32;
    }
  
    // ribs
    ctx.save();
    ctx.strokeStyle = `rgba(${ribColor}, ${ribAlpha})`;
    ctx.lineWidth = ribLineWidth;
  
    for (const rib of ribs) {
      ctx.beginPath();
      ctx.moveTo(rib.top.x, rib.top.y);
      ctx.bezierCurveTo(
        rib.c1.x, rib.c1.y,
        rib.c2.x, rib.c2.y,
        rib.bottom.x, rib.bottom.y
      );
      ctx.stroke();
    }
    ctx.restore();
  
    // particles
    ctx.save();
ctx.shadowBlur = lightMode === "white" ? 28 : lightMode === "red" ? 20 : 15;
ctx.shadowColor =
  lightMode === "red"
    ? "rgba(255,120,120,0.9)"
    : "rgba(255,255,255,0.95)";

for (const particle of jelly.particles) {
  const rib = ribs[particle.ribIndex % ribs.length];

  const pt = cubicBezierPoint(
    rib.top.x, rib.top.y,
    rib.c1.x, rib.c1.y,
    rib.c2.x, rib.c2.y,
    rib.bottom.x, rib.bottom.y,
    particle.t
  );

  const fade = 0.35 + 0.35 * Math.sin((particle.t * Math.PI * 2) + particle.alphaPhase);
  let alpha = Math.max(0.12, Math.min(0.6, fade));
  alpha = Math.min(0.95, alpha * particleBoost);

  const color = brightenCombParticleColor(particle.color, alpha, lightMode);

  // ✅ LIGHTWEIGHT rib highlight (NO loops)
  if (lightMode === "white" || lightMode === "red") {
    const ahead = Math.min(1, particle.t + 0.06);

    const pt2 = cubicBezierPoint(
      rib.top.x, rib.top.y,
      rib.c1.x, rib.c1.y,
      rib.c2.x, rib.c2.y,
      rib.bottom.x, rib.bottom.y,
      ahead
    );

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lightMode === "white" ? 2 : 1.5;
    ctx.globalAlpha = 0.5;

    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
    ctx.lineTo(pt2.x, pt2.y);
    ctx.stroke();

    ctx.restore();
  }

  // particle core
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(pt.x, pt.y, particle.size * 0.5, 0, Math.PI * 2);
  ctx.fill();
}

ctx.restore();

}


function getCombRibGeometry(jelly, ribIndex, top, bottom, h, w, frame, pulse) {
    const angle = (ribIndex / jelly.ribCount) * Math.PI * 2;
    const depth = Math.cos(angle);
    const side = Math.sin(angle);
  
    const squashAmount = pulse;
  
    const visibleWidth = w * (0.2 + 0.8 * Math.abs(depth));
    const phaseLag = ribIndex * 0.22;
    const ripple = Math.sin(frame * 0.08 + phaseLag) * w * 0.04 * (1 - squashAmount * 0.7);
    const lean = Math.sin(frame * 0.03 + jelly.spin) * w * 0.05 * (1 - squashAmount * 0.75);
    const frontBias = depth * w * 0.06;
  
    const offsetX = side * visibleWidth;
  
    const cY1 = jelly.y - h * 0.18 * (1 - squashAmount * 0.9);
    const cY2 = jelly.y + h * 0.18 * (1 - squashAmount * 0.9);
  
    return {
      top,
      bottom,
      c1: {
        x: jelly.x + offsetX + ripple + lean + frontBias,
        y: cY1
      },
      c2: {
        x: jelly.x + offsetX - ripple + lean + frontBias,
        y: cY2
      },
      depth
    };
}

function cubicBezierPoint(x1, y1, cx1, cy1, cx2, cy2, x2, y2, t) {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;

  return {
    x:
      mt2 * mt * x1 +
      3 * mt2 * t * cx1 +
      3 * mt * t2 * cx2 +
      t2 * t * x2,
    y:
      mt2 * mt * y1 +
      3 * mt2 * t * cy1 +
      3 * mt * t2 * cy2 +
      t2 * t * y2
  };
}

function getCombJellyLightMode() {
    // Adjust this to match however your site stores the current light mode.
    // This version supports a few common setups safely.
  
    if (typeof currentMode !== "undefined") {
      if (currentMode === "white" || currentMode === "red") return currentMode;
      return "off";
    }
  
    if (typeof mode !== "undefined") {
      if (mode === "white" || mode === "red") return mode;
      return "off";
    }
  
    const bodyMode =
      document.body.dataset.mode ||
      document.body.getAttribute("data-mode") ||
      document.documentElement.dataset.mode ||
      document.documentElement.getAttribute("data-mode");
  
    if (bodyMode === "white" || bodyMode === "red") return bodyMode;
  
    return "off";
}

function brightenCombParticleColor(baseColor, alpha, lightMode) {
    // default (light OFF) → keep original look
    let color = baseColor.replace(/[\d.]+\)\s*$/, `${alpha})`);
  
    if (lightMode === "white") {
      // MUCH brighter, more saturated bioluminescence
      if (baseColor.includes("120, 255, 255")) {
        color = `rgba(180, 255, 255, ${alpha})`; // intense cyan
      }
      else if (baseColor.includes("90, 170, 255")) {
        color = `rgba(120, 210, 255, ${alpha})`; // strong electric blue
      }
      else if (baseColor.includes("190, 255, 230")) {
        color = `rgba(220, 255, 240, ${alpha})`; // glowing mint
      }
      else if (baseColor.includes("210, 180, 255")) {
        color = `rgba(235, 200, 255, ${alpha})`; // brighter violet
      }
    }
  
    if (lightMode === "red") {
      // Slight warmth, but keep original bioluminescence visible
      if (baseColor.includes("120, 255, 255")) {
        color = `rgba(160, 255, 240, ${alpha})`;
      }
      else if (baseColor.includes("90, 170, 255")) {
        color = `rgba(130, 190, 255, ${alpha})`;
      }
      else if (baseColor.includes("190, 255, 230")) {
        color = `rgba(230, 255, 235, ${alpha})`;
      }
      else if (baseColor.includes("210, 180, 255")) {
        color = `rgba(240, 190, 255, ${alpha})`;
      }
    }
  
    return color;
}

function drawReactiveRibGlow(ctx, rib, tCenter, color, depth, lightMode) {
    const steps = 24;
    const spread = lightMode === "white" ? 0.12 : 0.09; // how much of the rib lights up
    const lineWidth = lightMode === "white"
      ? (depth === "near" ? 2.2 : 1.6)
      : (depth === "near" ? 1.7 : 1.2);
  
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = lineWidth;
    ctx.shadowBlur = lightMode === "white" ? 18 : 10;
    ctx.shadowColor = color;
  
    for (let i = 0; i < steps; i++) {
      const t1 = Math.max(0, tCenter - spread + (i / steps) * (spread * 2));
      const t2 = Math.max(0, tCenter - spread + ((i + 1) / steps) * (spread * 2));
  
      if (t1 > 1 || t2 > 1) continue;
  
      const p1 = cubicBezierPoint(
        rib.top.x, rib.top.y,
        rib.c1.x, rib.c1.y,
        rib.c2.x, rib.c2.y,
        rib.bottom.x, rib.bottom.y,
        t1
      );
  
      const p2 = cubicBezierPoint(
        rib.top.x, rib.top.y,
        rib.c1.x, rib.c1.y,
        rib.c2.x, rib.c2.y,
        rib.bottom.x, rib.bottom.y,
        t2
      );
  
      // strongest at center of the particle, fades toward the ends
      const midT = (t1 + t2) * 0.5;
      const dist = Math.abs(midT - tCenter) / spread;
      const intensity = Math.max(0, 1 - dist);
  
      let segmentAlpha = 0.18 + intensity * 0.55;
      if (lightMode === "white") segmentAlpha += 0.12;
  
      ctx.strokeStyle = applyAlphaToRGBA(color, segmentAlpha);
  
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  
    ctx.restore();
}

function applyAlphaToRGBA(rgbaString, alpha) {
    const match = rgbaString.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
    if (!match) return rgbaString;
    return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`;
}


/* MINING SYSTEM */
function buildMiningSystem() {
  if (miningSystemBuilt) return;

  miningLayer.innerHTML = `
  <div id="miningShadow" class="mining-shadow">
    <div class="mining-shadow-body"></div>
    <div class="mining-shadow-cabin"></div>

    <div class="mining-shadow-track"></div>

    <div class="mining-shadow-arm-left"></div>
    <div class="mining-shadow-arm-right"></div>

    <div class="mining-shadow-drill-column"></div>
    <div class="mining-shadow-drill-bit"></div>

    <div class="mining-shadow-light-left"></div>
    <div class="mining-shadow-light-right"></div>
  </div>

  <div id="miningCloud" class="mining-cloud"></div>
`;

  miningSystemBuilt = true;
}

function openMiningPopup() {
  if (!miningAlertActive) return;
  miningPopupBody.innerHTML = miningSummaryHTML;
  miningPopupOverlay.classList.remove("hidden");
}

function setAlertState(active) {
  miningAlertActive = active;

  if (active) {
    miningAlarmBtn.classList.add("alerting");
    alarmQuickBtn.classList.add("alerting");
    miningBlip.classList.add("active-alert");
  } else {
    miningAlarmBtn.classList.remove("alerting");
    alarmQuickBtn.classList.remove("alerting");
    miningBlip.classList.remove("active-alert");
  }
}

function updateMiningPass(now) {
  buildMiningSystem();

  const miningShadow = document.getElementById("miningShadow");
  const miningCloud = document.getElementById("miningCloud");

  const elapsed = (now - miningCycleStart) % miningPassInterval;
  const deepEnough = currentDepth > 3200;

  if (!deepEnough) {
    miningVisible = false;
    previousMiningVisible = false;
    miningShadow.style.opacity = "0";
    miningCloud.style.opacity = "0";
    miningCloud.classList.remove("lingering");
    setAlertState(false);
    return;
  }

  if (elapsed < miningPassDuration) {
    miningVisible = true;

    if (!previousMiningVisible) {
      miningDirection *= -1;
    }

    const t = elapsed / miningPassDuration;

    let x;
    if (miningDirection === 1) {
      x = -48 + t * 145;
    } else {
      x = 108 - t * 145;
    }

    const y = 17 + Math.sin(t * Math.PI * 1.15) * 5;

    miningShadow.style.left = `${x}%`;
    miningShadow.style.top = `${y}%`;
    miningShadow.style.opacity = "0.86";

    miningCloud.classList.remove("lingering");
    miningCloud.style.left = `${x - 12}%`;
    miningCloud.style.top = `${y + 8}%`;
    miningCloud.style.opacity = "0.48";

    setAlertState(true);

    const angle = t * Math.PI * 2;
    const radarX = 50 + Math.cos(angle) * 24;
    const radarY = 50 + Math.sin(angle) * 16;

    miningBlip.style.left = `${radarX}%`;
    miningBlip.style.top = `${radarY}%`;

    previousMiningVisible = true;
  } else {
    if (miningVisible) {
      const lastX = miningShadow.style.left;
      const lastY = miningShadow.style.top;

      miningCloud.classList.remove("lingering");
      void miningCloud.offsetWidth;
      miningCloud.style.left = `${parseFloat(lastX) - 10}%`;
      miningCloud.style.top = `${parseFloat(lastY) + 10}%`;
      miningCloud.style.opacity = "0.5";
      miningCloud.classList.add("lingering");
    }

    miningVisible = false;
    previousMiningVisible = false;
    miningShadow.style.opacity = "0";
    setAlertState(false);
  }
}

/* ENVIRONMENT */
function getZone(depth) {
  return zoneData.find((z) => depth >= z.min && depth < z.max) || zoneData[zoneData.length - 1];
}

function updateEnvironment(progress) {
  currentDepth = Math.floor(progress * maxDepth);
  depthValue.textContent = currentDepth.toLocaleString();

  const zone = getZone(currentDepth);
  zoneName.textContent = zone.name;
  visibilityValue.textContent = zone.visibility;
  bioValue.textContent = zone.bio;
  tempValue.textContent = zone.temp;

  const pressure = (1 + currentDepth / 10).toFixed(0);
  pressureValue.textContent = `${pressure} atm`;

  oceanBg.style.background = zone.gradient;

  oxygenValue.textContent = `${zone.oxygen}%`;
  oxygenFill.style.width = `${zone.oxygen}%`;

  const glowEnergy = Math.max(18, Math.floor(zone.oxygen * (currentMode === "white" ? 0.74 : 1)));
  glowPercent.textContent = `${glowEnergy}%`;

  if (zone.oxygen > 80) {
    oxygenMode.textContent = "Normal glow behavior / oxygen not yet limiting output.";
    energyText.textContent = "Normal activity. Bioluminescent output is not yet strongly oxygen-limited.";
  } else if (zone.oxygen > 50) {
    oxygenMode.textContent = "Oxygen minimum pressure rising / flashing becomes more selective.";
    energyText.textContent = "Energy conservation beginning. Some organisms reduce glow frequency to preserve metabolism.";
  } else {
    oxygenMode.textContent = "Energy Conservation Mode / metabolic rate suppressed.";
    energyText.textContent = "Energy Conservation Mode: metabolic rate suppressed. Glow pulses dim and slow as oxygen becomes harder to afford.";
  }

  if (fishSchoolLayer) {
    const zoneOpacity =
      currentDepth < 1000 ? 1 :
      currentDepth < 2500 ? 0.45 :
      currentDepth < 4000 ? 0.18 : 0.04;

    fishSchoolLayer.style.opacity = zoneOpacity;
  }

  if (jellyfishLayer) {
    jellyfishLayer.style.opacity = zone.name === "Sunlight Zone" ? "0.82" : "0";
  }

  if (combJellyLayer) {
    combJellyLayer.style.opacity = zone.name === "Sunlight Zone" ? "0.9" : "0";
  }

  updateDepthTicks(progress);
  updateTerrain(currentDepth);
  updateDebris(currentDepth);
  spawnMarine(currentDepth, currentMode);
}

function handleScroll() {
  updateEnvironment(getScrollProgress());
}

/* EVENTS */
miningAlarmBtn.addEventListener("click", openMiningPopup);
alarmQuickBtn.addEventListener("click", openMiningPopup);
miningBlip.addEventListener("click", openMiningPopup);

window.addEventListener("click", (e) => {
  if (e.target === miningPopupOverlay) {
    miningPopupOverlay.classList.add("hidden");
  }
});

/* LOOP */
function animateLoop(now) {
  updateMiningPass(now);
  requestAnimationFrame(animateLoop);
}

/* ANIMATION KEYFRAMES */
const style = document.createElement("style");
style.innerHTML = `
@keyframes bioBlink {
  0%, 100% { opacity: 0.08; transform: scale(0.72); }
  50% { opacity: 1; transform: scale(1.25); }
}
`;
document.head.appendChild(style);

/* INIT */
buildDepthTicks();
createBubbles();
buildMiningSystem();
buildFishSchool();
setupJellyfishLayer();
setupCombJellyLayer();
setMode("white");
handleScroll();
animateParticles();
requestAnimationFrame(animateLoop);

window.addEventListener("scroll", handleScroll);
window.addEventListener("resize", () => {
    handleScroll();
    buildFishSchool();
    resizeJellyfishCanvas();
    createJellyfishSet();
    resizeCombJellyCanvas();
    createCombJellies();
  });