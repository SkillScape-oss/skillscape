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

// Canvas World Transform (Pan & Zoom)
let camera = { x: 0, y: 0, zoom: 1 };
let isDragging = false;
let startPan = { x: 0, y: 0 };
let selectedNode = null;

// Organic Node Definition: Added `magnitude` (size/glow) and `jitter` (organic offsets)
const nodes = [
  // Core Anchor
  { id: 'core', name: 'Origin Star', category: 'Core', desc: 'The center of your sky.', radius: 0, angle: 0, magnitude: 22 },

  // --- RING 1: Domain Anchors (Uneven Angles & Radii) ---
  { id: 'fit_1', name: 'Physical Vitality', category: 'Fitness', desc: 'Daily movement.', radius: 145, angle: 5, magnitude: 15 },
  { id: 'code_1', name: 'Logic & Code', category: 'Craft', desc: 'Programming core.', radius: 165, angle: 78, magnitude: 16 },
  { id: 'mind_1', name: 'Mental Clarity', category: 'Mindset', desc: 'Mindfulness & focus.', radius: 135, angle: 140, magnitude: 15 },
  { id: 'art_1', name: 'Creative Flow', category: 'Art', desc: 'Design & expression.', radius: 170, angle: 222, magnitude: 15 },
  { id: 'life_1', name: 'Life Balance', category: 'Habits', desc: 'Routines & recovery.', radius: 150, angle: 295, magnitude: 15 },

  // --- RING 2: Asymmetric Skill Stars ---
  // Fitness Cluster (Clustered unevenly around 5° angle)
  { id: 'fit_2a', name: 'Strength Training', category: 'Fitness', desc: 'Resistance work.', radius: 270, angle: -18, magnitude: 11 },
  { id: 'fit_2b', name: 'Cardio Engine', category: 'Fitness', desc: 'Stamina building.', radius: 290, angle: 28, magnitude: 10 },

  // Code Cluster (Deeper branch offset)
  { id: 'code_2a', name: 'System Arch', category: 'Craft', desc: 'Backend systems.', radius: 310, angle: 65, magnitude: 12 },
  { id: 'code_2b', name: 'Frontend Canvas', category: 'Craft', desc: 'UI & web canvas.', radius: 260, angle: 102, magnitude: 11 },

  // Mindset Cluster
  { id: 'mind_2a', name: 'Deep Focus', category: 'Mindset', desc: 'Flow state focus.', radius: 255, angle: 128, magnitude: 11 },
  { id: 'mind_2b', name: 'Emotional Control', category: 'Mindset', desc: 'Stoic stability.', radius: 300, angle: 162, magnitude: 10 },

  // Art Cluster
  { id: 'art_2a', name: 'Design Systems', category: 'Art', desc: 'Color & typography.', radius: 285, angle: 208, magnitude: 11 },
  { id: 'art_2b', name: 'Storytelling', category: 'Art', desc: 'Narrative structure.', radius: 250, angle: 248, magnitude: 10 },

  // Habits Cluster
  { id: 'life_2a', name: 'Sleep Mastery', category: 'Habits', desc: 'Sleep environment.', radius: 265, angle: 280, magnitude: 11 },
  { id: 'life_2b', name: 'Time Boxing', category: 'Habits', desc: 'Structured blocks.', radius: 320, angle: 318, magnitude: 10 },

  // Hybrids (Bridging space gap between clusters)
  { id: 'hyb_game_dev', name: 'Game Design', category: 'Hybrid', desc: 'Code + Focus.', radius: 295, angle: 116, magnitude: 13 },
  { id: 'hyb_biohack', name: 'Biohacking', category: 'Hybrid', desc: 'Fitness + Sleep.', radius: 310, angle: 348, magnitude: 13 }
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

  { from: 'code_1', to: 'hyb_game_dev' },
  { from: 'mind_2a', to: 'hyb_game_dev' },
  { from: 'fit_2a', to: 'hyb_biohack' },
  { from: 'life_2a', to: 'hyb_biohack' }
];

// Resize canvas dynamically
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  draw();
}
window.addEventListener('resize', resizeCanvas);

// Helper: Convert Radial Coordinates to Cartesian with Natural Jitter
function getNodePosition(node) {
  const rad = (node.angle * Math.PI) / 180;
  return {
    x: node.radius * Math.cos(rad),
    y: node.radius * Math.sin(rad)
  };
}

// Main Render Loop
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  // Move context origin to center of screen + apply pan/zoom
  ctx.translate(canvas.width / 2 + camera.x, canvas.height / 2 + camera.y);
  ctx.scale(camera.zoom, camera.zoom);

// --- DRAW ORGANIC CURVED CONNECTIONS ---
  connections.forEach(conn => {
    const parent = nodes.find(n => n.id === conn.from);
    const child = nodes.find(n => n.id === conn.to);
    
    if (parent && child) {
      const pPos = getNodePosition(parent);
      const cPos = getNodePosition(child);

      const isConnectedUnlocked = parent.unlocked && child.unlocked;
      const isRelatedToSelection = selectedNode && (conn.from === selectedNode.id || conn.to === selectedNode.id);

      // Midpoint with subtle perpendicular offset for organic arc curvature
      const midX = (pPos.x + cPos.x) / 2;
      const midY = (pPos.y + cPos.y) / 2;
      const controlX = midX + (cPos.y - pPos.y) * 0.12;
      const controlY = midY - (cPos.x - pPos.x) * 0.12;

      ctx.beginPath();
      ctx.moveTo(pPos.x, pPos.y);
      ctx.quadraticCurveTo(controlX, controlY, cPos.x, cPos.y);

      if (selectedNode) {
        ctx.strokeStyle = isRelatedToSelection ? '#00f3ff' : 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = isRelatedToSelection ? 2.5 : 0.6;
      } else {
        ctx.strokeStyle = isConnectedUnlocked ? 'rgba(0, 243, 255, 0.8)' : 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = isConnectedUnlocked ? 1.8 : 0.8;
      }

      ctx.stroke();
    }
  });

  // --- DRAW ORGANIC STAR NODES ---
  nodes.forEach(node => {
    const pos = getNodePosition(node);
    const isSelected = selectedNode && selectedNode.id === node.id;
    const isUnlocked = userState.unlockedNodes.includes(node.id);
    node.unlocked = isUnlocked;

    const baseRadius = node.magnitude || 10;

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, baseRadius, 0, Math.PI * 2);

    if (isUnlocked) {
      ctx.fillStyle = node.category === 'Hybrid' ? '#ffb700' : '#00f3ff';
      ctx.shadowBlur = isSelected ? 22 : 12;
      ctx.shadowColor = ctx.fillStyle;
    } else {
      ctx.fillStyle = '#0f1526';
      ctx.shadowBlur = 0;
    }

    ctx.fill();
    ctx.lineWidth = isSelected ? 2.5 : 1.5;
    ctx.strokeStyle = isSelected ? '#ffffff' : (isUnlocked ? '#ffffff' : '#283350');
    ctx.stroke();

    // Star Label
    ctx.shadowBlur = 0;
    ctx.fillStyle = isUnlocked ? '#ffffff' : 'rgba(255, 255, 255, 0.45)';
    ctx.font = node.id === 'core' ? 'bold 13px sans-serif' : '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(node.name, pos.x, pos.y + baseRadius + 14);
  });
}

// Interactivity: Pan & Zoom
canvas.addEventListener('mousedown', (e) => {
  isDragging = true;
  startPan = { x: e.clientX - camera.x, y: e.clientY - camera.y };
});

window.addEventListener('mousemove', (e) => {
  if (isDragging) {
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

// Node Click Detection
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left - canvas.width / 2 - camera.x;
  const mouseY = e.clientY - rect.top - canvas.height / 2 - camera.y;

  let clickedNode = null;

  nodes.forEach(node => {
    const pos = getNodePosition(node);
    // Adjusted position accounting for camera zoom
    const worldX = pos.x * camera.zoom;
    const worldY = pos.y * camera.zoom;
    
    const dist = Math.hypot(mouseX - worldX, mouseY - worldY);
    if (dist < 20 * camera.zoom) {
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

// UI Inspector Logic
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

// Unlock Skill Event
// Unlock Skill Event with Multi-Prerequisite Support
unlockBtn.addEventListener('click', () => {
  if (!selectedNode) return;

  // 1. Find ALL parent connections for the selected node
  const parentConnections = connections.filter(c => c.to === selectedNode.id);

  // 2. Check if EVERY parent skill has been unlocked
  const allParentsUnlocked = parentConnections.every(conn => 
    userState.unlockedNodes.includes(conn.from)
  );

  if (!allParentsUnlocked) {
    // Collect the names of required parent nodes for a helpful error message
    const requiredParentNames = parentConnections
      .map(conn => nodes.find(n => n.id === conn.from)?.name)
      .join(' AND ');

    alert(`Locked! You must unlock ALL prerequisite skills first: [${requiredParentNames}]`);
    return;
  }

  // 3. Unlock node if prerequisites are met
  if (!userState.unlockedNodes.includes(selectedNode.id)) {
    userState.unlockedNodes.push(selectedNode.id);
    addXP(25);
    openInspectorPanel(selectedNode);
    draw();
  }
});

// XP & Level System
function addXP(amount) {
  userState.xp += amount;
  if (userState.xp >= 100) {
    userState.level += 1;
    userState.xp -= 100;
  }
  levelDisplay.innerText = `LVL ${userState.level}`;
  xpDisplay.innerText = `XP: ${userState.xp} / 100`;
}

// Initial Launch
resizeCanvas();