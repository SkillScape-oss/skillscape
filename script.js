const canvas = document.getElementById('skill-canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth * 0.8;
canvas.height = window.innerHeight * 0.7;

// Draw a glowing central node
ctx.beginPath();
ctx.arc(canvas.width / 2, canvas.height / 2, 20, 0, Math.PI * 2);
ctx.fillStyle = '#00f3ff';
ctx.shadowBlur = 15;
ctx.shadowColor = '#00f3ff';
ctx.fill();