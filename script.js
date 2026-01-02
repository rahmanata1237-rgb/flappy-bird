const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resize();
addEventListener("resize", resize);

// Assets
const birdImg = new Image();
birdImg.src = "assets/bird.png";
const pipeImg = new Image();
pipeImg.src = "assets/pipe.png";

const jumpSound = new Audio("assets/jump.mp3");
const crashSound = new Audio("assets/crash.mp3");

// Screens
const startScreen = document.getElementById("startScreen");
const settingsScreen = document.getElementById("settingsScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

// UI
const startBtn = document.getElementById("startBtn");
const settingsBtn = document.getElementById("settingsBtn");
const backBtn = document.getElementById("backBtn");
const restartBtn = document.getElementById("restartBtn");

const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const finalScore = document.getElementById("finalScore");

const soundBtn = document.getElementById("soundBtn");
const themeBtn = document.getElementById("themeBtn");
const fpsSelect = document.getElementById("fpsSelect");
const levelSelect = document.getElementById("levelSelect");

// LEVEL SETTINGS
const LEVELS = {
  easy:       { gap: 180, speed: 2.2, gravity: 0.42 },
  medium:     { gap: 150, speed: 2.6, gravity: 0.45 },
  hard:       { gap: 125, speed: 3.1, gravity: 0.52 },
  impossible: { gap: 100, speed: 3.8, gravity: 0.60 }
};

let level = LEVELS.medium;

// State
let bird, pipes, score;
let running = false;

// Settings
let soundOn = true;
let isNight = false;

// FPS
let fps = 60;
let fpsInterval = 1000 / fps;
let lastTime = 0;

// High score
let highScore = localStorage.getItem("flappyHigh") || 0;
highScoreEl.textContent = "HIGH: " + highScore;

function init() {
  bird = {
    x: canvas.width * 0.25,
    y: canvas.height * 0.4,
    w: 40,
    h: 30,
    vel: 0
  };

  pipes = [createPipe()];
  score = 0;
  running = true;
  scoreEl.textContent = "0";
}

function createPipe() {
  const margin = 70;
  const maxTop = canvas.height - level.gap - margin;
  return {
    x: canvas.width,
    top: Math.random() * (maxTop - margin) + margin,
    passed: false
  };
}

function update(time) {
  if (!running) return;

  if (time - lastTime < fpsInterval) {
    requestAnimationFrame(update);
    return;
  }
  lastTime = time;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Bird physics
  bird.vel += level.gravity;
  bird.y += bird.vel;

  // Pipes
  pipes.forEach(p => p.x -= level.speed);

  if (pipes[0].x + 70 < 0) {
    pipes.shift();
    pipes.push(createPipe());
  }

  draw();
  checkCollision();

  requestAnimationFrame(update);
}

function draw() {
  ctx.drawImage(birdImg, bird.x, bird.y, bird.w, bird.h);

  pipes.forEach(p => {
    // Top
    ctx.save();
    ctx.scale(1, -1);
    ctx.drawImage(pipeImg, p.x, -p.top, 70, p.top);
    ctx.restore();

    // Bottom
    ctx.drawImage(
      pipeImg,
      p.x,
      p.top + level.gap,
      70,
      canvas.height
    );

    // Score
    if (!p.passed && p.x + 70 < bird.x) {
      p.passed = true;
      score++;
      scoreEl.textContent = score;
    }
  });
}

function checkCollision() {
  if (bird.y < 0 || bird.y + bird.h > canvas.height) endGame();

  pipes.forEach(p => {
    const hitX =
      bird.x < p.x + 70 &&
      bird.x + bird.w > p.x;

    const hitTop = bird.y < p.top;
    const hitBottom = bird.y + bird.h > p.top + level.gap;

    if (hitX && (hitTop || hitBottom)) endGame();
  });
}

function endGame() {
  if (!running) return;
  running = false;

  if (soundOn) crashSound.play();
  if (navigator.vibrate) navigator.vibrate(150);

  gameOverScreen.style.display = "flex";
  finalScore.textContent = "SCORE: " + score;

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("flappyHigh", highScore);
    highScoreEl.textContent = "HIGH: " + highScore;
  }
}

// Input (game only)
canvas.addEventListener("touchstart", (e) => {
  if (!running) return;
  e.preventDefault();
  bird.vel = -8;
  if (soundOn) {
    jumpSound.currentTime = 0;
    jumpSound.play();
  }
}, { passive: false });

// UI
startBtn.onclick = () => {
  startScreen.style.display = "none";
  init();
  lastTime = 0;
  requestAnimationFrame(update);
};

restartBtn.onclick = () => {
  gameOverScreen.style.display = "none";
  init();
  lastTime = 0;
  requestAnimationFrame(update);
};

settingsBtn.onclick = () => {
  startScreen.style.display = "none";
  settingsScreen.style.display = "flex";
};

backBtn.onclick = () => {
  settingsScreen.style.display = "none";
  startScreen.style.display = "flex";
};

// Settings
soundBtn.onclick = () => {
  soundOn = !soundOn;
  soundBtn.textContent = "SOUND: " + (soundOn ? "ON" : "OFF");
};

themeBtn.onclick = () => {
  isNight = !isNight;
  document.body.className = isNight ? "night" : "day";
  themeBtn.textContent = "THEME: " + (isNight ? "NIGHT" : "DAY");
};

fpsSelect.onchange = () => {
  fps = Number(fpsSelect.value);
  fpsInterval = 1000 / fps;
};

levelSelect.onchange = () => {
  level = LEVELS[levelSelect.value];
};