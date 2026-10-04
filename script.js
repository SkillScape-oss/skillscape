const canvas = document.getElementById('skill-canvas');
const ctx = canvas.getContext('2d');

// UI Elements
const inspector = document.getElementById('inspector');
const closeInspector = document.getElementById('close-inspector');
const nodeTitle = document.getElementById('node-title');
const nodeCategory = document.getElementById('node-category');
const nodeDesc = document.getElementById('node-desc');
const unlockBtn = document.getElementById('unlock-btn');
const nodeProgress = document.getElementById('node-progress');
const levelDisplay = document.getElementById('level-display');
const xpDisplay = document.getElementById('xp-display');
const xpBarFill = document.getElementById('xp-bar-fill');
const resetBtn = document.getElementById('reset-btn');

// Search & Filter UI Elements
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const searchKbd = document.querySelector('.search-kbd');
const filterPills = document.querySelectorAll('.pill');

// LocalStorage Configuration
const STORAGE_KEY = 'constellation_skill_tree_save';

const defaultState = {
  xp: 0,
  level: 1,
  unlockedNodes: ['core']
};

let userState = loadState();
let searchQuery = '';
let activeCategory = 'ALL';

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userState));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        xp: typeof parsed.xp === 'number' ? parsed.xp : defaultState.xp,
        level: typeof parsed.level === 'number' ? parsed.level : defaultState.level,
        unlockedNodes: Array.isArray(parsed.unlockedNodes) ? parsed.unlockedNodes : defaultState.unlockedNodes
      };
    }
  } catch (e) {
    console.error('Failed to load state:', e);
  }
  return { ...defaultState };
}

// Camera & Drag State
let camera = { x: 0, y: 0, zoom: 1 };
let isDragging = false;
let startPan = { x: 0, y: 0 };
let dragDistance = 0;
let selectedNode = null;

// Background Starfield Particles
const particles = [];
const PARTICLE_COUNT = 140;

function initParticles() {
  particles.length = 0;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: (Math.random() - 0.5) * 3200,
      y: (Math.random() - 0.5) * 3200,
      size: Math.random() * 1.6 + 0.4,
      alpha: Math.random() * 0.7 + 0.2,
      pulseSpeed: Math.random() * 0.02 + 0.005
    });
  }
}

// Skill Topology
const nodes = [
  { id: 'core', name: 'Origin Star', category: 'Core', desc: 'The starting center of your sky.', radius: 0, angle: 0, magnitude: 18 },

  // Ring 1: Main Domains
  { id: 'fit_1', name: 'Physical Vitality', category: 'Fitness', desc: 'Daily movement foundation.', radius: 140, angle: 0, magnitude: 14 },
  { id: 'code_1', name: 'Logic & Code', category: 'Craft', desc: 'Programming core.', radius: 140, angle: 72, magnitude: 14 },
  { id: 'mind_1', name: 'Mental Clarity', category: 'Mindset', desc: 'Mindfulness & focus.', radius: 140, angle: 144, magnitude: 14 },
  { id: 'art_1', name: 'Creative Flow', category: 'Art', desc: 'Design & expression.', radius: 140, angle: 216, magnitude: 14 },
  { id: 'life_1', name: 'Life Balance', category: 'Habits', desc: 'Routines & recovery.', radius: 140, angle: 288, magnitude: 14 },

  // Ring 2: Sub-skills
  { id: 'fit_2a', name: 'Strength Training', category: 'Fitness', desc: 'Resistance work.', radius: 240, angle: -15, magnitude: 11 },
  { id: 'fit_2b', name: 'Cardio Engine', category: 'Fitness', desc: 'Stamina building.', radius: 270, angle: 15, magnitude: 10 },

  { id: 'code_2a', name: 'System Arch', category: 'Craft', desc: 'Backend systems.', radius: 250, angle: 57, magnitude: 11 },
  { id: 'code_2b', name: 'Frontend Canvas', category: 'Craft', desc: 'UI & web canvas.', radius: 280, angle: 87, magnitude: 10 },

  { id: 'mind_2a', name: 'Deep Focus', category: 'Mindset', desc: 'Flow state focus.', radius: 240, angle: 129, magnitude: 11 },
  { id: 'mind_2b', name: 'Emotional Control', category: 'Mindset', desc: 'Stoic stability.', radius: 275, angle: 159, magnitude: 10 },

  { id: 'art_2a', name: 'Design Systems', category: 'Art', desc: 'Color & typography.', radius: 250, angle: 201, magnitude: 11 },
  { id: 'art_2b', name: 'Storytelling', category: 'Art', desc: 'Narrative structure.', radius: 280, angle: 231, magnitude: 10 },

  { id: 'life_2a', name: 'Sleep Mastery', category: 'Habits', desc: 'Sleep environment.', radius: 240, angle: 273, magnitude: 11 },
  { id: 'life_2b', name: 'Time Boxing', category: 'Habits', desc: 'Structured blocks.', radius: 275, angle: 303, magnitude: 10 },

  // Hybrids
  { id: 'hyb_game_dev', name: 'Game Design', category: 'Hybrid', desc: 'Requires Code AND Focus.', radius: 340, angle: 108, magnitude: 12 },
  { id: 'hyb_biohack', name: 'Biohacking', category: 'Hybrid', desc: 'Requires Fitness AND Sleep Mastery.', radius: 340, angle: -45, magnitude: 12 }
];

const connections = [
  { from: 'core', to: 'fit_1' },
  { from: 'core', to: 'code_1' },
  { from: 'core', to: 'mind_1' },
  { from: 'core', to: 'art_1' },
  { from: 'core', to: 'life_1' },

  { from: 'fit_1', to: 'fit_2a' },
  { from: 'fit_1', to: 'fit_2b' },
  { from: 'code_1', to: 'code_2a' },
  { from: 'code_1', to: 'code_2b' },
  { from: 'mind_1', to: 'mind_2a' },
  { from: 'mind_1', to: 'mind_2b' },
  { from: 'art_1', to: 'art_2a' },
  { from: 'art_1', to: 'art_2b' },
  { from: 'life_1', to: 'life_2a' },
  { from: 'life_1', to: 'life_2b' },

  { from: 'code_2b', to: 'hyb_game_dev' },
  { from: 'mind_2a', to: 'hyb_game_dev' },
  { from: 'fit_2a', to: 'hyb_biohack' },
  { from: 'life_2b', to: 'hyb_biohack' }
];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);

function getNodePosition(node) {
  const rad = (node.angle * Math.PI) / 180;
  return {
    x: node.radius * Math.cos(rad),
    y: node.radius * Math.sin(rad)
  };
}

function isNodeMatchingSearch(node) {
  const matchesCategory = activeCategory === 'ALL' || node.category.toLowerCase() === activeCategory.toLowerCase();
  const matchesSearch = !searchQuery || node.name.toLowerCase().includes(searchQuery) || node.category.toLowerCase().includes(searchQuery);
  return matchesCategory && matchesSearch;
}

function updateUI() {
  levelDisplay.innerText = userState.level;
  xpDisplay.innerText = `${userState.xp} / 100 XP`;
  xpBarFill.style.width = `${userState.xp}%`;
}

// Render Loop
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvas.width / 2 + camera.x, canvas.height / 2 + camera.y);
  ctx.scale(camera.zoom, camera.zoom);

  // 1. Particle Starfield
  particles.forEach(p => {
    p.alpha += Math.sin(Date.now() * 0.001 + p.x) * p.pulseSpeed * 0.05;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, Math.min(0.7, p.alpha))})`;
    ctx.fill();
  });

  // 2. Connections
  connections.forEach(conn => {
    const parent = nodes.find(n => n.id === conn.from);
    const child = nodes.find(n => n.id === conn.to);
    
    if (parent && child) {
      const pPos = getNodePosition(parent);
      const cPos = getNodePosition(child);

      const isConnectedUnlocked = userState.unlockedNodes.includes(parent.id) && userState.unlockedNodes.includes(child.id);
      const isFilteredOut = !isNodeMatchingSearch(parent) && !isNodeMatchingSearch(child);

      ctx.beginPath();
      ctx.moveTo(pPos.x, pPos.y);
      ctx.lineTo(cPos.x, cPos.y);

      if (isFilteredOut) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
      } else {
        ctx.strokeStyle = isConnectedUnlocked ? '#00f3ff' : 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = isConnectedUnlocked ? 2 : 1;
      }
      ctx.stroke();
    }
  });

  // 3. Nodes
  nodes.forEach(node => {
    const pos = getNodePosition(node);
    const isSelected = selectedNode && selectedNode.id === node.id;
    const isUnlocked = userState.unlockedNodes.includes(node.id);
    const matchesFilter = isNodeMatchingSearch(node);

    const radius = node.magnitude || 10;

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);

    if (matchesFilter) {
      if (isUnlocked) {
        ctx.fillStyle = node.category === 'Hybrid' ? '#ffb700' : '#00f3ff';
        ctx.shadowBlur = isSelected ? 22 : 12;
        ctx.shadowColor = ctx.fillStyle;
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.shadowBlur = 0;
      }
      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.strokeStyle = isSelected ? '#ffffff' : (isUnlocked ? '#ffffff' : '#334155');
    } else {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
    }

    ctx.fill();
    ctx.stroke();

    // Node Title Text
    ctx.shadowBlur = 0;
    if (matchesFilter) {
      ctx.fillStyle = isUnlocked ? '#ffffff' : 'rgba(255, 255, 255, 0.55)';
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    }
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(node.name, pos.x, pos.y + radius + 15);
  });

  ctx.restore();

  requestAnimationFrame(render);
}

// Mouse Pan & Zoom
canvas.addEventListener('mousedown', (e) => {
  isDragging = true;
  dragDistance = 0;
  startPan = { x: e.clientX - camera.x, y: e.clientY - camera.y };
});

window.addEventListener('mousemove', (e) => {
  if (isDragging) {
    dragDistance += Math.abs(e.movementX) + Math.abs(e.movementY);
    camera.x = e.clientX - startPan.x;
    camera.y = e.clientY - startPan.y;
  }
});

window.addEventListener('mouseup', () => {
  isDragging = false;
});

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const zoomFactor = 1.1;
  if (e.deltaY < 0) {
    camera.zoom = Math.min(camera.zoom * zoomFactor, 2.5);
  } else {
    camera.zoom = Math.max(camera.zoom / zoomFactor, 0.4);
  }
}, { passive: false });

canvas.addEventListener('click', (e) => {
  if (dragDistance > 5) return;

  const rect = canvas.getBoundingClientRect();
  const mouseX = (e.clientX - rect.left - canvas.width / 2 - camera.x) / camera.zoom;
  const mouseY = (e.clientY - rect.top - canvas.height / 2 - camera.y) / camera.zoom;

  let clickedNode = null;

  nodes.forEach(node => {
    const pos = getNodePosition(node);
    const dist = Math.hypot(mouseX - pos.x, mouseY - pos.y);
    if (dist < (node.magnitude || 12) + 6) {
      clickedNode = node;
    }
  });

  if (clickedNode) {
    selectedNode = clickedNode;
    openInspectorPanel(clickedNode);
  } else {
    selectedNode = null;
    inspector.classList.add('hidden');
  }
});

// Search & Filter Listeners
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value.toLowerCase().trim();
  if (searchQuery.length > 0) {
    clearSearchBtn.classList.remove('hidden');
    searchKbd.classList.add('hidden');
  } else {
    clearSearchBtn.classList.add('hidden');
    searchKbd.classList.remove('hidden');
  }
});

clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchQuery = '';
  clearSearchBtn.classList.add('hidden');
  searchKbd.classList.remove('hidden');
  searchInput.focus();
});

// Keyboard Shortcut '/' to Search
window.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement !== searchInput) {
    e.preventDefault();
    searchInput.focus();
  }
});

filterPills.forEach(pill => {
  pill.addEventListener('click', () => {
    filterPills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    activeCategory = pill.getAttribute('data-category');
  });
});

function openInspectorPanel(node) {
  nodeTitle.innerText = node.name;
  nodeCategory.innerText = node.category;
  nodeDesc.innerText = node.desc;
  
  const isUnlocked = userState.unlockedNodes.includes(node.id);
  
  if (isUnlocked) {
    unlockBtn.innerText = 'Unlocked';
    unlockBtn.disabled = true;
    nodeProgress.style.width = '100%';
  } else {
    unlockBtn.innerText = 'Unlock Skill (+25 XP)';
    unlockBtn.disabled = false;
    nodeProgress.style.width = '0%';
  }
  
  inspector.classList.remove('hidden');
}

closeInspector.addEventListener('click', () => {
  inspector.classList.add('hidden');
  selectedNode = null;
});

unlockBtn.addEventListener('click', () => {
  if (!selectedNode) return;

  const parentConnections = connections.filter(c => c.to === selectedNode.id);
  const allParentsUnlocked = parentConnections.every(conn => userState.unlockedNodes.includes(conn.from));

  if (!allParentsUnlocked) {
    alert('Unlock the prerequisite skills first!');
    return;
  }

  if (!userState.unlockedNodes.includes(selectedNode.id)) {
    userState.unlockedNodes.push(selectedNode.id);
    addXP(25);
    saveState();
    openInspectorPanel(selectedNode);
  }
});

function addXP(amount) {
  userState.xp += amount;
  if (userState.xp >= 100) {
    userState.level += Math.floor(userState.xp / 100);
    userState.xp = userState.xp % 100;
  }
  updateUI();
  saveState();
}

// Reset Progress
if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all skill tree progress?')) {
      localStorage.removeItem(STORAGE_KEY);
      userState = { ...defaultState };
      selectedNode = null;
      inspector.classList.add('hidden');
      updateUI();
    }
  });
}

// Initialization
initParticles();
updateUI();
resizeCanvas();
requestAnimationFrame(render);