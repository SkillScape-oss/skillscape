// 1. Application State
const state = {
  level: 1,
  xp: 0,
  maxXp: 100,
  sp: 1
};

// ==========================================
// PAN & ZOOM CAMERA ENGINE
// ==========================================
const mapContainer = document.getElementById('map-container');
const mapWorld = document.getElementById('map-world');

let camera = {
  x: 0,
  y: 0,
  zoom: 1,
  minZoom: 0.4,
  maxZoom: 2.5
};

let isDragging = false;
let dragStart = { x: 0, y: 0 };

// Apply current camera state to CSS transform
function updateCameraTransform() {
  mapWorld.style.transform = `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`;
}

// 1. Mouse Dragging (Panning)
mapContainer.addEventListener('mousedown', (e) => {
  // Only pan on left-click on background (ignore clicks originating from nodes)
  if (e.target.closest('.floating-skill')) return;

  isDragging = true;
  dragStart.x = e.clientX - camera.x;
  dragStart.y = e.clientY - camera.y;
  mapContainer.style.cursor = 'grabbing';
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;

  camera.x = e.clientX - dragStart.x;
  camera.y = e.clientY - dragStart.y;
  updateCameraTransform();
});

window.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    mapContainer.style.cursor = 'default';
  }
});

// 2. Mouse Wheel (Zooming toward cursor)
mapContainer.addEventListener('wheel', (e) => {
  e.preventDefault(); // Prevent page scrolling

  const zoomFactor = 0.1;
  const delta = e.deltaY < 0 ? 1 : -1;
  const newZoom = Math.min(Math.max(camera.zoom + delta * zoomFactor, camera.minZoom), camera.maxZoom);

  if (newZoom === camera.zoom) return;

  // Zoom toward cursor location
  const rect = mapContainer.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  camera.x = mouseX - (mouseX - camera.x) * (newZoom / camera.zoom);
  camera.y = mouseY - (mouseY - camera.y) * (newZoom / camera.zoom);
  camera.zoom = newZoom;

  updateCameraTransform();
}, { passive: false });

// 2. Tree Data Architecture
const skillTree = [
  { id: 'origin', name: 'Origin Star', x: 50, y: 48, isOrigin: true, unlocked: true, spCost: 0, connections: ['life', 'physical', 'logic', 'mental', 'creative'] },
  
  // Top Branch
  { id: 'life', name: 'Routines', x: 54, y: 28, unlocked: false, spCost: 1, connections: ['sleep', 'time'] },
  { id: 'sleep', name: 'Consistent Sleep', x: 50, y: 13, unlocked: false, spCost: 1, connections: [] },
  { id: 'time', name: 'Time Boxing', x: 66, y: 15, unlocked: false, spCost: 1, connections: ['biohacking'] },
  { id: 'biohacking', name: 'Biohacking', x: 77, y: 12, unlocked: false, spCost: 2, connections: [] },

  // Right Branch
  { id: 'physical', name: 'Physical Vitality', x: 65, y: 48, unlocked: false, spCost: 1, connections: ['strength', 'cardio'] },
  { id: 'strength', name: 'Strength Training', x: 75, y: 39, unlocked: false, spCost: 1, connections: ['biohacking'] },
  { id: 'cardio', name: 'Cardio Engine', x: 78, y: 58, unlocked: false, spCost: 1, connections: [] },

  // Bottom Right Branch
  { id: 'logic', name: 'Logic & Code', x: 54, y: 67, unlocked: false, spCost: 1, connections: ['system', 'frontend'] },
  { id: 'system', name: 'System Arch', x: 65, y: 78, unlocked: false, spCost: 1, connections: [] },
  { id: 'frontend', name: 'Frontend Canvas', x: 51, y: 88, unlocked: false, spCost: 1, connections: ['gamedesign'] },
  { id: 'gamedesign', name: 'Game Design', x: 38, y: 94, unlocked: false, spCost: 2, connections: [] },

  // Bottom Left Branch
  { id: 'mental', name: 'Mental Clarity', x: 37, y: 60, unlocked: false, spCost: 1, connections: ['emotional', 'deepfocus'] },
  { id: 'emotional', name: 'Emotional Control', x: 21, y: 62, unlocked: false, spCost: 1, connections: [] },
  { id: 'deepfocus', name: 'Deep Focus', x: 33, y: 75, unlocked: false, spCost: 1, connections: ['gamedesign'] },

  // Left Branch
  { id: 'creative', name: 'Creative Flow', x: 37, y: 37, unlocked: false, spCost: 1, connections: ['storytelling', 'design'] },
  { id: 'storytelling', name: 'Storytelling', x: 30, y: 19, unlocked: false, spCost: 1, connections: [] },
  { id: 'design', name: 'Design Systems', x: 24, y: 36, unlocked: false, spCost: 1, connections: [] },

  // Unlinked Satellite / Island Skills (Fixed Position)
  { id: 'intuition', name: 'Raw Intuition', x: 20, y: 20, isSatellite: true, unlocked: false, spCost: 2, connections: [] },
  { id: 'resilience', name: 'Grit & Resilience', x: 82, y: 22, isSatellite: true, unlocked: false, spCost: 2, connections: [] },
  { id: 'flowstate', name: 'Flow Trigger', x: 80, y: 80, isSatellite: true, unlocked: false, spCost: 3, connections: [] }
];

// 3. DOM References & Lookup Caches
const levelDisplay = document.getElementById('level-display');
const spDisplay = document.getElementById('sp-display');
const xpDisplay = document.getElementById('xp-display');
const xpBarFill = document.getElementById('xp-bar-fill');
const nodesLayer = document.getElementById('nodes-layer');
const svgLayer = document.getElementById('svg-layer');

const domNodes = {};
const svgLines = [];
function updateHUD() {
  levelDisplay.innerText = state.level;
  spDisplay.innerText = state.sp;
  xpDisplay.innerText = `${state.xp} / ${state.maxXp} XP`;
  
  const fillPct = (state.xp / state.maxXp) * 100;
  xpBarFill.style.width = `${fillPct}%`;
}

function isNodeAvailable(node) {
  // Origin node AND unlinked Satellite nodes are always available
  if (node.isOrigin || node.isSatellite) return true;

  // Search for an unlocked connected parent for standard nodes
  return skillTree.some(parent => 
    parent.unlocked && parent.connections.includes(node.id)
  );
}

function gainXp(amount) {
  state.xp += amount;
  
  while (state.xp >= state.maxXp) {
    state.xp -= state.maxXp;
    state.level += 1;
    state.sp += 1; // Award 1 Skill Point on level-up
    state.maxXp = Math.round(state.maxXp * 1.25); // Scale XP target
  }
  
  updateHUD();
}
function initNodes() {
  nodesLayer.innerHTML = '';

  skillTree.forEach((node, idx) => {
    const elem = document.createElement('div');
    // Inside initNodes() skillTree.forEach loop:
elem.className = `floating-skill ${node.isOrigin ? 'origin' : ''} ${node.isSatellite ? 'satellite' : ''} ${node.unlocked ? 'unlocked' : ''}`;
    // 1. Calculate pixel distance from the center (50%, 50%)
    // Node at x: 50, y: 50 will sit at (offsetX: 0, offsetY: 0) -> dead center.
    const offsetX = (node.x - 50) * 8; // Adjust 8 to increase/decrease horizontal spacing
    const offsetY = (node.y - 48) * 6; // Adjust 6 to increase/decrease vertical spacing
    // 2. Position node relative to 50% screen center minus node radius (16px)
    elem.style.left = `calc(50% + ${offsetX}px - 16px)`;
    elem.style.top = `calc(50% + ${offsetY}px - 16px)`;
    elem.style.setProperty('--float-delay', `${(idx * 0.45).toFixed(2)}s`);

    elem.innerHTML = `
      <div class="node-circle"></div>
      <span class="skill-label">${node.name}</span>
    `;

    // Click handler enforcing SP costs
    elem.addEventListener('click', () => {
  // 1. Check if already unlocked
      if (node.unlocked) return;

  // 2. Check if prerequisite parent is unlocked
      if (!isNodeAvailable(node)) {
        alert(`Prerequisites not met! Unlock a connected node first.`);
        return;
  }

  // 3. Check if player has enough SP
      if (state.sp < node.spCost) {
        alert(`Need ${node.spCost} Skill Point(s) to unlock ${node.name}!`);
        return;
  }

  // Deduct SP, unlock node, & grant XP
      state.sp -= node.spCost;
      node.unlocked = true;
      elem.classList.add('unlocked');
  
    gainXp(35);
    updateLineStyles();
    updateNodeAvailabilityVisuals(); // Update visual state of newly available nodes
  });

    nodesLayer.appendChild(elem);
    domNodes[node.id] = elem;
  });
}

function updateNodeAvailabilityVisuals() {
  skillTree.forEach(node => {
    const elem = domNodes[node.id];
    if (!elem) return;

    if (node.unlocked) {
      elem.classList.remove('locked', 'available');
      elem.classList.add('unlocked');
    } else if (isNodeAvailable(node)) {
      elem.classList.remove('locked');
      elem.classList.add('available');
    } else {
      elem.classList.remove('available');
      elem.classList.add('locked');
    }
  });
}

// Call inside initNodes() at page start

function initSvgLines() {
  svgLayer.innerHTML = '';
  svgLines.length = 0;

  skillTree.forEach(node => {
    node.connections.forEach(targetId => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.classList.add('connection-line');
      
      // Keeps line width crisp and 1:1 pixel sharp no matter how far you zoom in
      line.setAttribute('vector-effect', 'non-scaling-stroke');
      
      svgLayer.appendChild(line);
      svgLines.push({
        element: line,
        fromId: node.id,
        toId: targetId
      });
    });
  });

  updateLineStyles();
}

function updateLineStyles() {
  svgLines.forEach(line => {
    const fromNode = skillTree.find(n => n.id === line.fromId);
    const toNode = skillTree.find(n => n.id === line.toId);

    if (fromNode.unlocked && toNode.unlocked) {
      line.element.classList.add('active');
    } else {
      line.element.classList.remove('active');
    }
  });
}
// Replace your old syncLines function and animation call with this:
function syncLines() {
  const mapRect = svgLayer.getBoundingClientRect();

  svgLines.forEach(line => {
    const fromElem = domNodes[line.fromId]?.querySelector('.node-circle');
    const toElem = domNodes[line.toId]?.querySelector('.node-circle');

    if (fromElem && toElem) {
      const r1 = fromElem.getBoundingClientRect();
      const r2 = toElem.getBoundingClientRect();

      const x1 = r1.left + r1.width / 2 - mapRect.left;
      const y1 = r1.top + r1.height / 2 - mapRect.top;
      const x2 = r2.left + r2.width / 2 - mapRect.left;
      const y2 = r2.top + r2.height / 2 - mapRect.top;

      line.element.setAttribute('x1', x1);
      line.element.setAttribute('y1', y1);
      line.element.setAttribute('x2', x2);
      line.element.setAttribute('y2', y2);
    }
  });
}

function syncLines() {
  const worldRect = mapWorld.getBoundingClientRect();

  svgLines.forEach(line => {
    const fromElem = domNodes[line.fromId]?.querySelector('.node-circle');
    const toElem = domNodes[line.toId]?.querySelector('.node-circle');

    if (fromElem && toElem) {
      const r1 = fromElem.getBoundingClientRect();
      const r2 = toElem.getBoundingClientRect();

      // Divide by camera.zoom so line coordinates remain accurate at any scale
      const x1 = (r1.left + r1.width / 2 - worldRect.left) / camera.zoom;
      const y1 = (r1.top + r1.height / 2 - worldRect.top) / camera.zoom;
      const x2 = (r2.left + r2.width / 2 - worldRect.left) / camera.zoom;
      const y2 = (r2.top + r2.height / 2 - worldRect.top) / camera.zoom;

      line.element.setAttribute('x1', x1);
      line.element.setAttribute('y1', y1);
      line.element.setAttribute('x2', x2);
      line.element.setAttribute('y2', y2);
    }
  });
}

// --- Starfield Particle Engine ---
const canvas = document.getElementById('starfield-canvas');
const ctx = canvas.getContext('2d');

let stars = [];
const STAR_COUNT = 120;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initStars();
}

function initStars() {
  stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random(),
      speed: Math.random() * 0.015 + 0.005,
      direction: Math.random() < 0.5 ? 1 : -1
    });
  }
}

function animateStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  stars.forEach(star => {
    // Twinkle effect (oscillate opacity)
    star.alpha += star.speed * star.direction;
    if (star.alpha >= 1 || star.alpha <= 0.1) {
      star.direction *= -1;
    }

    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha.toFixed(2)})`;
    ctx.shadowBlur = star.radius > 1.2 ? 6 : 0;
    ctx.shadowColor = '#00f0ff';
    ctx.fill();
  });

  requestAnimationFrame(animateStars);
}


// Initial Bootup (runs syncLines once, plus on window resize)
updateHUD();
initNodes();
initSvgLines();
syncLines();

window.addEventListener('resize', syncLines);
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
requestAnimationFrame(animateStars);