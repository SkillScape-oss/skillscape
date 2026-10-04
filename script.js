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

// User Progress State
let userState = {
  xp: 0,
  level: 1,
  unlockedNodes: ['core']
};

// Camera & Drag State
let camera = { x: 0, y: 0, zoom: 1 };
let isDragging = false;
let startPan = { x: 0, y: 0 };
let dragDistance = 0;
let selectedNode = null;

// Clean Non-Overlapping Node Topology
const nodes = [
  { id: 'core', name: 'Origin Star', category: 'Core', desc: 'The starting center of your sky.', radius: 0, angle: 0, magnitude: 18 },

  // Ring 1: Main Domains
  { id: 'fit_1', name: 'Physical Vitality', category: 'Fitness', desc: 'Daily movement foundation.', radius: 140, angle: 0, magnitude: 14 },
  { id: 'code_1', name: 'Logic & Code', category: 'Craft', desc: 'Programming core.', radius: 140, angle: 72, magnitude: 14 },
  { id: 'mind_1', name: 'Mental Clarity', category: 'Mindset', desc: 'Mindfulness & focus.', radius: 140, angle: 144, magnitude: 14 },
  { id: 'art_1', name: 'Creative Flow', category: 'Art', desc: 'Design & expression.', radius: 140, angle: 216, magnitude: 14 },
  { id: 'life_1', name: 'Life Balance', category: 'Habits', desc: 'Routines & recovery.', radius: 140, angle: 288, magnitude: 14 },

  // Ring 2: Sub-skills (Angled so adjacent sectors stay clear)
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

  // Hybrids: Positioned in open spaces between parents
  { id: 'hyb_game_dev', name: 'Game Design', category: 'Hybrid', desc: 'Requires Code AND Focus.', radius: 340, angle: 108, magnitude: 12 },
  { id: 'hyb_biohack', name: 'Biohacking', category: 'Hybrid', desc: 'Requires Fitness AND Sleep Mastery.', radius: 340, angle: -45, magnitude: 12 }
];

const connections = [
  // Core connections
  { from: 'core', to: 'fit_1' },
  { from: 'core', to: 'code_1' },
  { from: 'core', to: 'mind_1' },
  { from: 'core', to: 'art_1' },
  { from: 'core', to: 'life_1' },

  // Domain to Sub-skill connections
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

  // Hybrid connections (Adjacent endpoints only — no sector cross-overs)
  { from: 'code_2b', to: 'hyb_game_dev' },
  { from: 'mind_2a', to: 'hyb_game_dev' },
  { from: 'fit_2a', to: 'hyb_biohack' },
  { from: 'life_2b', to: 'hyb_biohack' }
];

// Resize canvas pixel dimensions to match display window
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  draw();
}
window.addEventListener('resize', resizeCanvas);

function getNodePosition(node) {
  const rad = (node.angle * Math.PI) / 180;
  return {
    x: node.radius * Math.cos(rad),
    y: node.radius * Math.sin(rad)
  };
}

// Draw Function
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvas.width / 2 + camera.x, canvas.height / 2 + camera.y);
  ctx.scale(camera.zoom, camera.zoom);

  // Draw Connections
  connections.forEach(conn => {
    const parent = nodes.find(n => n.id === conn.from);
    const child = nodes.find(n => n.id === conn.to);
    
    if (parent && child) {
      const pPos = getNodePosition(parent);
      const cPos = getNodePosition(child);

      const isConnectedUnlocked = userState.unlockedNodes.includes(parent.id) && userState.unlockedNodes.includes(child.id);

      ctx.beginPath();
      ctx.moveTo(pPos.x, pPos.y);
      ctx.lineTo(cPos.x, cPos.y);

      ctx.strokeStyle = isConnectedUnlocked ? '#00f3ff' : 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = isConnectedUnlocked ? 2 : 1;
      ctx.stroke();
    }
  });

  // Draw Nodes
  nodes.forEach(node => {
    const pos = getNodePosition(node);
    const isSelected = selectedNode && selectedNode.id === node.id;
    const isUnlocked = userState.unlockedNodes.includes(node.id);

    const radius = node.magnitude || 10;

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);

    if (isUnlocked) {
      ctx.fillStyle = node.category === 'Hybrid' ? '#ffb700' : '#00f3ff';
      ctx.shadowBlur = 12;
      ctx.shadowColor = ctx.fillStyle;
    } else {
      ctx.fillStyle = '#11172a';
      ctx.shadowBlur = 0;
    }

    ctx.fill();
    ctx.lineWidth = isSelected ? 3 : 1.5;
    ctx.strokeStyle = isSelected ? '#ffffff' : (isUnlocked ? '#ffffff' : '#2e3856');
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = isUnlocked ? '#ffffff' : 'rgba(255, 255, 255, 0.5)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(node.name, pos.x, pos.y + radius + 14);
  });

  ctx.restore();
}

// Mouse Controls (Pan & Click separation)
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
    draw();
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
  draw();
}, { passive: false });

canvas.addEventListener('click', (e) => {
  if (dragDistance > 5) return; // Ignore click events if user was panning

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
  draw();
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
  draw();
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
    openInspectorPanel(selectedNode);
    draw();
  }
});

function addXP(amount) {
  userState.xp += amount;
  if (userState.xp >= 100) {
    userState.level += 1;
    userState.xp -= 100;
  }
  levelDisplay.innerText = `LVL ${userState.level}`;
  xpDisplay.innerText = `XP: ${userState.xp} / 100`;
}

// Initial Canvas setup and rendering
resizeCanvas();