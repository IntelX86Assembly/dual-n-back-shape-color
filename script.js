const shapes = ["triangle", "square", "pentagon", "hexagon", "septagon", "octagon", "nonagon", "circle"];
const colors = {
  purple: "#c9b6ff",
  blue: "#a9d8ff",
  green: "#b9e8c2",
  yellow: "#fff0a8",
  orange: "#ffc58f",
  red: "#ffaaa9",
  pink: "#ffb8d2",
  white: "#f5f4ef"
};
const colorNames = Object.keys(colors);

const els = {
  menuButton: document.getElementById("menuButton"),
  settings: document.getElementById("settings"),
  nback: document.getElementById("nbackInput"),
  rounds: document.getElementById("roundsInput"),
  speed: document.getElementById("speedInput"),
  apply: document.getElementById("applyButton"),
  status: document.getElementById("status"),
  shape: document.getElementById("shape"),
  shapeButton: document.getElementById("shapeButton"),
  colorButton: document.getElementById("colorButton"),
  roundInfo: document.getElementById("roundInfo"),
  results: document.getElementById("results"),
  summary: document.getElementById("summary"),
  shapeResult: document.getElementById("shapeResult"),
  colorResult: document.getElementById("colorResult"),
  again: document.getElementById("againButton")
};

let config = { n: 2, rounds: 20, speed: 2 };
let game = null;
let timer = null;

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function setStimulus(stimulus) {
  els.shape.className = `shape ${stimulus.shape}`;
  if (stimulus.shape === "triangle") {
    els.shape.style.borderBottomColor = colors[stimulus.color];
    els.shape.style.background = "transparent";
  } else {
    els.shape.style.background = colors[stimulus.color];
    els.shape.style.borderBottomColor = "";
  }
}

function clearStimulus() {
  els.shape.className = "shape";
  els.shape.style.background = "transparent";
  els.shape.style.borderBottomColor = "";
}

function updateButtons(enabled) {
  els.shapeButton.disabled = !enabled;
  els.colorButton.disabled = !enabled;
}

function setStatus(text) {
  els.status.textContent = text;
}

function startGame() {
  clearTimeout(timer);
  game = {
    index: 0,
    sequence: [],
    responses: [],
    shapeCorrect: 0,
    shapeWrong: 0,
    colorCorrect: 0,
    colorWrong: 0,
    awaitingAnswer: false
  };
  els.results.classList.add("hidden");
  updateButtons(false);
  setStatus("Get ready…");
  showNext();
}

function showNext() {
  if (!game) return;

  if (game.index >= config.rounds) {
    finishGame();
    return;
  }

  const stimulus = {
    shape: randomItem(shapes),
    color: randomItem(colorNames)
  };

  game.sequence.push(stimulus);
  game.responses.push({ shape: null, color: null });

  setStimulus(stimulus);
  game.awaitingAnswer = true;
  updateButtons(true);

  const displayNumber = game.index + 1;
  els.roundInfo.textContent = `Round ${displayNumber} / ${config.rounds}`;
  setStatus(game.index < config.n ? `Round ${displayNumber}` : "Respond if it matches N-back");

  game.index++;

  timer = setTimeout(() => {
    game.awaitingAnswer = false;
    updateButtons(false);
    clearStimulus();

    if (game.index >= config.rounds) {
      finishGame();
    } else {
      setStatus("Press space to cancel / continue");
      els.roundInfo.textContent = `Next round in ${config.speed}s`;
      timer = setTimeout(showNext, config.speed * 1000);
    }
  }, config.speed * 1000);
}

function answer(type) {
  if (!game || !game.awaitingAnswer) return;

  const currentIndex = game.index - 1;
  const targetIndex = currentIndex - config.n;
  if (targetIndex < 0) return;

  const expected = game.sequence[currentIndex][type] === game.sequence[targetIndex][type];
  const response = game.responses[currentIndex];

  if (response[type] !== null) return;
  response[type] = true;

  if (type === "shape") {
    expected ? game.shapeCorrect++ : game.shapeWrong++;
  } else {
    expected ? game.colorCorrect++ : game.colorWrong++;
  }

  // Brief feedback without interrupting the stimulus.
  els.status.textContent = expected
    ? `${type === "shape" ? "Shape" : "Color"}: correct`
    : `${type === "shape" ? "Shape" : "Color"}: wrong`;
}

function finishGame() {
  clearTimeout(timer);
  game.awaitingAnswer = false;
  updateButtons(false);
  clearStimulus();
  setStatus("Round complete");
  els.roundInfo.textContent = "Press space to start a new game";

  const eligible = Math.max(0, config.rounds - config.n);
  const shapeTotal = game.shapeCorrect + game.shapeWrong;
  const colorTotal = game.colorCorrect + game.colorWrong;
  const shapePct = shapeTotal ? Math.round(game.shapeCorrect / shapeTotal * 100) : 0;
  const colorPct = colorTotal ? Math.round(game.colorCorrect / colorTotal * 100) : 0;

  els.summary.innerHTML = `
    <strong>${config.n}-back complete.</strong>
    ${eligible} stimulus rounds were eligible for matching.
  `;

  els.shapeResult.innerHTML = `
    <div class="result-box">
      <strong>${shapePct}%</strong><br>
      ${game.shapeCorrect} correct / ${game.shapeWrong} wrong
      ${shapeTotal ? `(${shapeTotal} responses)` : "(no responses)"}
    </div>
  `;

  els.colorResult.innerHTML = `
    <div class="result-box">
      <strong>${colorPct}%</strong><br>
      ${game.colorCorrect} correct / ${game.colorWrong} wrong
      ${colorTotal ? `(${colorTotal} responses)` : "(no responses)"}
    </div>
  `;

  els.results.classList.remove("hidden");
}

function cancelGame() {
  clearTimeout(timer);
  game = null;
  updateButtons(false);
  clearStimulus();
  setStatus("Press space to start");
  els.roundInfo.textContent = "Ready";
}

function toggleStartCancel() {
  if (game) cancelGame();
  else startGame();
}

function applySettings() {
  config.n = Math.max(1, Math.min(20, Number(els.nback.value) || 2));
  config.rounds = Math.max(1, Math.min(500, Number(els.rounds.value) || 20));
  config.speed = Math.max(0.25, Math.min(10, Number(els.speed.value) || 2));
  els.nback.value = config.n;
  els.rounds.value = config.rounds;
  els.speed.value = config.speed;
  els.settings.classList.remove("open");
  els.settings.setAttribute("aria-hidden", "true");
  els.menuButton.setAttribute("aria-expanded", "false");
}

els.menuButton.addEventListener("click", () => {
  const open = els.settings.classList.toggle("open");
  els.settings.setAttribute("aria-hidden", String(!open));
  els.menuButton.setAttribute("aria-expanded", String(open));
});

els.apply.addEventListener("click", applySettings);
els.shapeButton.addEventListener("click", () => answer("shape"));
els.colorButton.addEventListener("click", () => answer("color"));
els.again.addEventListener("click", startGame);

document.addEventListener("keydown", (event) => {
  if (event.repeat) return;

  if (event.code === "Space") {
    event.preventDefault();
    toggleStartCancel();
    return;
  }

  if (event.key.toLowerCase() === "f") {
    event.preventDefault();
    answer("shape");
  }

  if (event.key.toLowerCase() === "j") {
    event.preventDefault();
    answer("color");
  }
});

setStatus("Press space to start");
clearStimulus();
