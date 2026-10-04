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

// Initial Skill Nodes Data (Radial Constellation Structure)
const nodes = [
  // ==========================================
  // GENERATION 0: Core Origin
  // ==========================================
  { id: 'core', name: 'Origin Star', category: 'Core', desc: 'The starting center of your life universe.', radius: 0, angle: 0 },

  // ==========================================
  // GENERATION 1: Primary Domains (Radius: 140px)
  // ==========================================
  { id: 'fit_1', name: 'Physical Vitality', category: 'Fitness', desc: 'Daily movement and exercise foundation.', radius: 140, angle: 0 },
  { id: 'code_1', name: 'Logic & Code', category: 'Craft', desc: 'Fundamentals of programming and problem solving.', radius: 140, angle: 72 },
  { id: 'mind_1', name: 'Mental Clarity', category: 'Mindset', desc: 'Meditation, mindfulness, and mental health.', radius: 140, angle: 144 },
  { id: 'art_1', name: 'Creative Flow', category: 'Art', desc: 'Visual design, writing, and creative output.', radius: 140, angle: 216 },
  { id: 'life_1', name: 'Life Balance', category: 'Habits', desc: 'Daily routines, organization, and recovery.', radius: 140, angle: 288 },

  // ==========================================
  // GENERATION 2: Intermediate Specializations (Radius: 260px)
  // ==========================================
  // Fitness Branch
  { id: 'fit_2a', name: 'Strength Training', category: 'Fitness', desc: 'Resistance training and muscle development.', radius: 260, angle: -15 },
  { id: 'fit_2b', name: 'Cardio Engine', category: 'Fitness', desc: 'Building aerobic endurance and stamina.', radius: 260, angle: 15 },

  // Code Branch
  { id: 'code_2a', name: 'System Architecture', category: 'Craft', desc: 'Building scalable backend systems and APIs.', radius: 260, angle: 57 },
  { id: 'code_2b', name: 'Frontend Canvas', category: 'Craft', desc: 'UI/UX layout, animations, and interactive web apps.', radius: 260, angle: 87 },

  // Mindset Branch
  { id: 'mind_2a', name: 'Deep Focus', category: 'Mindset', desc: 'Sustained concentration without digital distraction.', radius: 260, angle: 129 },
  { id: 'mind_2b', name: 'Emotional Control', category: 'Mindset', desc: 'Stoic reflection and emotional regulation.', radius: 260, angle: 159 },

  // Creative Branch
  { id: 'art_2a', name: 'Design Systems', category: 'Art', desc: 'Color theory, typography, and UI aesthetics.', radius: 260, angle: 201 },
  { id: 'art_2b', name: 'Storytelling', category: 'Art', desc: 'Narrative structure and compelling communication.', radius: 260, angle: 231 },

  // Habits Branch
  { id: 'life_2a', name: 'Sleep Mastery', category: 'Habits', desc: 'Optimizing sleep environment and sleep hygiene.', radius: 260, angle: 273 },
  { id: 'life_2b', name: 'Time Boxing', category: 'Habits', desc: 'Structuring days with time blocks and priority queues.', radius: 260, angle: 303 },

  // ==========================================
  // GENERATION 3: Advanced Mastery Skills (Radius: 380px)
  // ==========================================
  { id: 'fit_3', name: 'Athletic Peak', category: 'Fitness', desc: 'Advanced metabolic conditioning and peak physical output.', radius: 380, angle: 0 },
  { id: 'code_3', name: 'Full-Stack Mastery', category: 'Craft', desc: 'Deploying autonomous microservices and AI systems.', radius: 380, angle: 72 },
  { id: 'mind_3', name: 'Flow State Control', category: 'Mindset', desc: 'Triggering peak performance and effortless work output.', radius: 380, angle: 144 },
  { id: 'art_3', name: '3D & Generative Art', category: 'Art', desc: 'Creating procedural worlds and shaders.', radius: 380, angle: 216 },
  { id: 'life_3', name: 'Circadian Optimization', category: 'Habits', desc: 'Synchronizing light exposure, nutrition, and recovery cycles.', radius: 380, angle: 288 }
];

// Connections between nodes (Parent -> Child)
const connections = [
  // --- Gen 0 -> Gen 1 Connections ---
  { from: 'core', to: 'fit_1' },
  { from: 'core', to: 'code_1' },
  { from: 'core', to: 'mind_1' },
  { from: 'core', to: 'art_1' },
  { from: 'core', to: 'life_1' },

  // --- Gen 1 -> Gen 2 Connections ---
  // Fitness
  { from: 'fit_1', to: 'fit_2a' },
  { from: 'fit_1', to: 'fit_2b' },

  // Code
  { from: 'code_1', to: 'code_2a' },
  { from: 'code_1', to: 'code_2b' },

  // Mindset
  { from: 'mind_1', to: 'mind_2a' },
  { from: 'mind_1', to: 'mind_2b' },

  // Art
  { from: 'art_1', to: 'art_2a' },
  { from: 'art_1', to: 'art_2b' },

  // Life
  { from: 'life_1', to: 'life_2a' },
  { from: 'life_1', to: 'life_2b' },

  // --- Gen 2 -> Gen 3 Connections ---
  { from: 'fit_2a', to: 'fit_3' },
  { from: 'code_2a', to: 'code_3' },
  { from: 'mind_2a', to: 'mind_3' },
  { from: 'art_2a', to: 'art_3' },
  { from: 'life_2a', to: 'life_3' }
];

// Resize canvas dynamically
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  draw();
}
window.addEventListener('resize', resizeCanvas);

// Convert Radial (radius, angle) to Cartesian (x, y)
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

  // 1. Draw Constellation Lines
  connections.forEach(conn => {
    const parent = nodes.find(n => n.id === conn.from);
    const child = nodes.find(n => n.id === conn.to);
    
    if (parent && child) {
      const pPos = getNodePosition(parent);
      const cPos = getNodePosition(child);

      ctx.beginPath();
      ctx.moveTo(pPos.x, pPos.y);
      ctx.lineTo(cPos.x, cPos.y);
      
      const isConnectedUnlocked = parent.unlocked && child.unlocked;
      ctx.strokeStyle = isConnectedUnlocked ? '#00f3ff' : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = isConnectedUnlocked ? 2 : 1;
      
      if (isConnectedUnlocked) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00f3ff';
      } else {
        ctx.shadowBlur = 0;
      }
      
      ctx.stroke();
    }
  });

  // 2. Draw Nodes
  nodes.forEach(node => {
    const pos = getNodePosition(node);
    const isSelected = selectedNode && selectedNode.id === node.id;
    const isUnlocked = userState.unlockedNodes.includes(node.id);
    node.unlocked = isUnlocked;

    ctx.beginPath();
    const nodeRadius = node.id === 'core' ? 18 : 12;
    ctx.arc(pos.x, pos.y, nodeRadius, 0, Math.PI * 2);

    if (isUnlocked) {
      ctx.fillStyle = '#00f3ff';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00f3ff';
    } else {
      ctx.fillStyle = '#1c233d';
      ctx.shadowBlur = 0;
    }

    ctx.fill();
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.strokeStyle = isSelected ? '#ffb700' : (isUnlocked ? '#ffffff' : '#3a4468');
    ctx.stroke();

    // Node Title Label
    ctx.shadowBlur = 0;
    ctx.fillStyle = isUnlocked ? '#ffffff' : '#8a99ad';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(node.name, pos.x, pos.y + nodeRadius + 16);
  });

  ctx.restore();
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
unlockBtn.addEventListener('click', () => {
  if (!selectedNode) return;

  // Find parent connection
  const parentConnection = connections.find(c => c.to === selectedNode.id);
  const isParentUnlocked = !parentConnection || userState.unlockedNodes.includes(parentConnection.from);

  if (!isParentUnlocked) {
    alert('You must unlock the preceding skill node first!');
    return;
  }

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