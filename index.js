const express = require('express');
const cors = require("cors");
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.set('trust proxy', true);
const PORT = process.env.PORT || 3000;

// Load reasons from JSON
const reasons = JSON.parse(fs.readFileSync(path.join(__dirname, 'reasons.json'), 'utf-8'));

// Rate limiter: 120 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  keyGenerator: (req, res) => {
    return req.headers['cf-connecting-ip'] || req.ip;
  },
  message: { error: "Too many requests, please try again later. (120 reqs/min/IP)" }
});

app.use(limiter);

// Random rejection reason endpoint (API)
app.get('/no', (req, res) => {
  const reason = reasons[Math.floor(Math.random() * reasons.length)];
  res.json({ reason });
});

// InspiroBot proxy endpoint
app.get('/api/inspiro', async (req, res) => {
  try {
    const response = await fetch('https://inspirobot.me/api/?generate=true');
    const imageUrl = await response.text();
    res.json({ imageUrl: imageUrl.trim() });
  } catch (error) {
    res.json({ imageUrl: 'https://inspirobot.me/api/?generate=true', error: 'Failed to fetch' });
  }
});

// Minimal dark homepage
app.get('/', (req, res) => {
  const reason = reasons[Math.floor(Math.random() * reasons.length)];
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>nope</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      min-height: 100vh;
      background: #0a0a0a;
      font-family: 'Space Mono', monospace;
      overflow-x: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .container {
      max-width: 600px;
      text-align: center;
    }
    
    .message {
      font-size: 1.4rem;
      color: #e0e0e0;
      line-height: 1.8;
      margin-bottom: 50px;
      padding: 30px;
      background: rgba(255,255,255,0.03);
      border-radius: 10px;
      border-left: 3px solid #ff6b6b;
    }
    
    .inspiro-img {
      max-width: 100%;
      border-radius: 8px;
      opacity: 0.9;
      transition: opacity 0.3s;
      clip-path: circle(0% at 50% 50%);
    }
    
    .inspiro-img.reveal {
      animation: waveReveal 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    }
    
    @keyframes waveReveal {
      0% {
        clip-path: circle(0% at 50% 50%);
        filter: blur(10px);
        transform: scale(1.1);
      }
      50% {
        filter: blur(3px);
      }
      100% {
        clip-path: circle(75% at 50% 50%);
        filter: blur(0);
        transform: scale(1);
      }
    }
    
    .inspiro-img:hover {
      opacity: 1;
    }
    
    .img-container {
      width: 100%;
      max-width: 600px;
      height: 600px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      background: #111;
    }
    
    .loader {
      height: 15px;
      aspect-ratio: 4;
      --_g: no-repeat radial-gradient(farthest-side,#666 90%,#0000);
      background: var(--_g) left, var(--_g) right;
      background-size: 25% 100%;
      display: flex;
    }
    
    .loader:before {
      content: "";
      flex: 1;
      background: inherit;
      animation: l50 2s infinite;
    }
    
    @keyframes l50 {
      0%     { transform: translate( 37.5%) rotate(0); }
      16.67% { transform: translate( 37.5%) rotate(90deg); }
      33.33% { transform: translate(-37.5%) rotate(90deg); }
      50%    { transform: translate(-37.5%) rotate(180deg); }
      66.67% { transform: translate(-37.5%) rotate(270deg); }
      83.33% { transform: translate( 37.5%) rotate(270deg); }
      100%   { transform: translate( 37.5%) rotate(360deg); }
    }
    
    .floating-emojis {
      position: fixed;
      font-size: 1.5rem;
      animation: fall linear infinite;
      pointer-events: none;
      z-index: -1;
      opacity: 0.5;
    }
    
    @keyframes fall {
      0% { transform: translateY(-100vh) rotate(0deg); opacity: 0.5; }
      100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
    }
  </style>
</head>
<body>
  <div id="floating-container"></div>
  
  <div class="container">
    <p class="message">${reason}</p>
    <div id="inspiroContainer" class="img-container">
      <div class="loader"></div>
    </div>
  </div>
  
  <script>
    const sillyEmojis = ['🙅', '🚫', '❌', '🤷', '😅', '🐔', '🦆', '💀', '🤡', '🎭', '🙈', '🌚', '🍕', '🦄', '👻', '🤪', '😱', '🙃', '🎪', '🤯', '🥴', '🫠', '🤌', '💅', '🐸'];
    
    function createFloatingEmoji() {
      const container = document.getElementById('floating-container');
      const emoji = document.createElement('div');
      emoji.className = 'floating-emojis';
      emoji.textContent = sillyEmojis[Math.floor(Math.random() * sillyEmojis.length)];
      emoji.style.left = Math.random() * 100 + 'vw';
      emoji.style.animationDuration = (Math.random() * 5 + 5) + 's';
      emoji.style.animationDelay = Math.random() * 5 + 's';
      container.appendChild(emoji);
      setTimeout(() => emoji.remove(), 10000);
    }
    
    setInterval(createFloatingEmoji, 1000);
    for (let i = 0; i < 8; i++) createFloatingEmoji();
    
    async function loadInspiro() {
      try {
        const response = await fetch('/api/inspiro');
        const data = await response.json();
        const img = new Image();
        img.onload = function() {
          img.className = 'inspiro-img';
          const container = document.getElementById('inspiroContainer');
          container.innerHTML = '';
          container.appendChild(img);
          // Trigger reflow then add reveal animation
          img.offsetHeight;
          img.classList.add('reveal');
        };
        img.src = data.imageUrl;
      } catch (error) {
        document.getElementById('inspiroContainer').innerHTML = '';
      }
    }
    
    loadInspiro();
  </script>
</body>
</html>
  `;
  
  res.send(html);
});

// Start server (for local dev)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
  });
}

// Export for Vercel
module.exports = app;
