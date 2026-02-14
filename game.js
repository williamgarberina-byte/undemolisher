const GRID_SIZE = 64;
const INITIAL_TIME = 45;
const INITIAL_LIVES = 3;
const SPAWN_INTERVAL_MS = 700;

const grid = document.getElementById('grid');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const timeEl = document.getElementById('time');
const messageEl = document.getElementById('message');
const startBtn = document.getElementById('start');
const restartBtn = document.getElementById('restart');

let blocks = [];
let score = 0;
let lives = INITIAL_LIVES;
let timeLeft = INITIAL_TIME;
let ticking;
let spawning;
let isRunning = false;

function buildGrid() {
  grid.innerHTML = '';
  blocks = [];
  for (let i = 0; i < GRID_SIZE; i += 1) {
    const button = document.createElement('button');
    button.className = 'block';
    button.type = 'button';
    button.ariaLabel = `Block ${i + 1}`;
    button.dataset.state = 'normal';

    button.addEventListener('click', () => {
      if (!isRunning) return;
      if (button.dataset.state === 'unstable') {
        button.dataset.state = 'repaired';
        button.classList.remove('unstable');
        button.classList.add('repaired');
        score += 10;
        scoreEl.textContent = String(score);
      }
    });

    blocks.push(button);
    grid.appendChild(button);
  }
}

function setMessage(text) {
  messageEl.textContent = text;
}

function randomBlock() {
  return blocks[Math.floor(Math.random() * blocks.length)];
}

function spawnUnstable() {
  const target = randomBlock();
  if (target.dataset.state === 'unstable') {
    lives -= 1;
    livesEl.textContent = String(lives);
    if (lives <= 0) {
      endGame('The city collapsed. You ran out of lives.');
      return;
    }
  }

  target.dataset.state = 'unstable';
  target.classList.remove('repaired');
  target.classList.add('unstable');
}

function tick() {
  timeLeft -= 1;
  timeEl.textContent = String(timeLeft);

  if (timeLeft <= 0) {
    const result = score >= 300
      ? `You saved the city! Final score: ${score}`
      : `Time's up. Final score: ${score}. Reach 300 to win.`;
    endGame(result);
  }
}

function clearLoops() {
  clearInterval(ticking);
  clearInterval(spawning);
}

function resetState() {
  clearLoops();
  score = 0;
  lives = INITIAL_LIVES;
  timeLeft = INITIAL_TIME;
  scoreEl.textContent = '0';
  livesEl.textContent = String(INITIAL_LIVES);
  timeEl.textContent = String(INITIAL_TIME);
  blocks.forEach((block) => {
    block.dataset.state = 'normal';
    block.classList.remove('unstable', 'repaired');
  });
}

function endGame(text) {
  clearLoops();
  isRunning = false;
  setMessage(text);
  startBtn.disabled = false;
  restartBtn.disabled = false;
}

function startGame() {
  resetState();
  isRunning = true;
  setMessage('Repair red blocks before they stack up.');
  startBtn.disabled = true;
  restartBtn.disabled = false;

  spawnUnstable();
  ticking = setInterval(tick, 1000);
  spawning = setInterval(spawnUnstable, SPAWN_INTERVAL_MS);
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

buildGrid();
