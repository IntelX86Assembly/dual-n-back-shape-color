const shapes = [
  "triangle",
  "square",
  "pentagon",
  "hexagon",
  "septagon",
  "octagon",
  "nonagon",
  "circle"
];

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

let config = {
  n: 2,
  rounds: 20,
  speed: 2
};

let game = null;
let timer = null;


/* -----------------------------
   Utility
----------------------------- */

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}


/* -----------------------------
   Stimulus display
----------------------------- */

function setStimulus(stimulus) {
  els.shape.className = `shape ${stimulus.shape}`;

  if (stimulus.shape === "triangle") {
    els.shape.style.background = "transparent";
    els.shape.style.borderBottomColor = colors[stimulus.color];
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


/* -----------------------------
   Buttons
----------------------------- */

function updateButtons(enabled) {
  els.shapeButton.disabled = !enabled;
  els.colorButton.disabled = !enabled;
}

function setStatus(text) {
  els.status.textContent = text;
}


/* -----------------------------
   Start game
----------------------------- */

function startGame() {
  clearTimeout(timer);

  game = {
    index: 0,
    sequence: [],

    // Each response starts as false.
    // true means the user pressed that button.
    responses: [],

    shapeCorrect: 0,
    shapeWrong: 0,

    colorCorrect: 0,
    colorWrong: 0,

    awaitingAnswer: false
  };

  els.results.classList.add("hidden");

  updateButtons(false);

  clearStimulus();

  setStatus("Get ready…");

  // Small delay before first stimulus.
  timer = setTimeout(showNext, 500);
}


/* -----------------------------
   Show next stimulus
----------------------------- */

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

  /*
   * Store whether the user pressed F/J.
   *
   * false = user has not pressed it yet
   * true  = user has pressed it
   */
  game.responses.push({
    shape: false,
    color: false
  });

  setStimulus(stimulus);

  /*
   * The current stimulus is now active.
   *
   * F and J stay enabled for the ENTIRE duration
   * of this stimulus.
   */
  game.awaitingAnswer = true;
  updateButtons(true);

  const displayNumber = game.index + 1;

  els.roundInfo.textContent =
    `Round ${displayNumber} / ${config.rounds}`;

  if (game.index < config.n) {
    setStatus(`Round ${displayNumber}`);
  } else {
    setStatus("Respond if it matches N-back");
  }

  game.index++;

  /*
   * Keep the stimulus visible for the entire round.
   *
   * After the round:
   * 1. Disable F/J
   * 2. CLEAR the shape
   * 3. Score unanswered matches/rejections
   * 4. Wait for the next stimulus
   */
  timer = setTimeout(endCurrentRound, config.speed * 1000);
}


/* -----------------------------
   End current round
----------------------------- */

function endCurrentRound() {
  if (!game) return;

  game.awaitingAnswer = false;

  /*
   * Disable answers AFTER the stimulus disappears.
   */
  updateButtons(false);

  /*
   * IMPORTANT:
   * Clear the stimulus immediately.
   *
   * This prevents the previous shape from remaining
   * on screen during the gap between rounds.
   */
  clearStimulus();

  scoreCurrentRound();

  if (game.index >= config.rounds) {
    finishGame();
    return;
  }

  setStatus("Press space to cancel / continue");

  els.roundInfo.textContent =
    `Next round in ${config.speed}s`;

  /*
   * Wait the configured amount of time before
   * showing the next stimulus.
   */
  timer = setTimeout(showNext, config.speed * 1000);
}


/* -----------------------------
   Score current round
----------------------------- */

function scoreCurrentRound() {
  const currentIndex = game.index - 1;
  const targetIndex = currentIndex - config.n;

  /*
   * The first N rounds cannot have an N-back match.
   * They therefore aren't included in scoring.
   */
  if (targetIndex < 0) {
    return;
  }

  const current = game.sequence[currentIndex];
  const previous = game.sequence[targetIndex];
  const response = game.responses[currentIndex];

  const shapeMatch =
    current.shape === previous.shape;

  const colorMatch =
    current.color === previous.color;

  /*
   * Shape scoring:
   *
   * Match + pressed F       = correct
   * Match + didn't press F  = wrong (miss)
   * No match + pressed F    = wrong
   * No match + didn't press = correct
   */
  if (shapeMatch === response.shape) {
    game.shapeCorrect++;
  } else {
    game.shapeWrong++;
  }

  /*
   * Same logic for color / J.
   */
  if (colorMatch === response.color) {
    game.colorCorrect++;
  } else {
    game.colorWrong++;
  }
}


/* -----------------------------
   Handle F / J answers
----------------------------- */

function answer(type) {
  /*
   * Ignore F/J if there isn't currently
   * an active stimulus.
   */
  if (!game || !game.awaitingAnswer) {
    return;
  }

  const currentIndex = game.index - 1;
  const targetIndex = currentIndex - config.n;

  /*
   * There is no valid N-back comparison yet.
   */
  if (targetIndex < 0) {
    return;
  }

  const response = game.responses[currentIndex];

  /*
   * Only allow one press of each button per round.
   */
  if (response[type]) {
    return;
  }

  response[type] = true;

  /*
   * Give immediate visual feedback,
   * but DON'T hide the stimulus or disable
   * the other button.
   */
  const label =
    type === "shape" ? "Shape" : "Color";

  setStatus(`${label} response recorded`);
}


/* -----------------------------
   Finish game
----------------------------- */

function finishGame() {
  clearTimeout(timer);

  game.awaitingAnswer = false;

  updateButtons(false);

  clearStimulus();

  setStatus("Round complete");

  els.roundInfo.textContent =
    "Press space to start a new game";

  const eligible = Math.max(
    0,
    config.rounds - config.n
  );

  const shapeTotal =
    game.shapeCorrect + game.shapeWrong;

  const colorTotal =
    game.colorCorrect + game.colorWrong;

  const shapePct =
    shapeTotal
      ? Math.round(
          game.shapeCorrect /
          shapeTotal *
          100
        )
      : 0;

  const colorPct =
    colorTotal
      ? Math.round(
          game.colorCorrect /
          colorTotal *
          100
        )
      : 0;

  els.summary.innerHTML = `
    <strong>${config.n}-back complete.</strong>
    ${eligible} stimulus rounds were eligible for scoring.
  `;

  els.shapeResult.innerHTML = `
    <div class="result-box">
      <strong>${shapePct}%</strong><br>
      ${game.shapeCorrect} correct /
      ${game.shapeWrong} wrong
      ${
        shapeTotal
          ? `(${shapeTotal} scored rounds)`
          : "(no scored rounds)"
      }
    </div>
  `;

  els.colorResult.innerHTML = `
    <div class="result-box">
      <strong>${colorPct}%</strong><br>
      ${game.colorCorrect} correct /
      ${game.colorWrong} wrong
      ${
        colorTotal
          ? `(${colorTotal} scored rounds)`
          : "(no scored rounds)"
      }
    </div>
  `;

  els.results.classList.remove("hidden");
}


/* -----------------------------
   Cancel game
----------------------------- */

function cancelGame() {
  clearTimeout(timer);

  game = null;

  updateButtons(false);

  clearStimulus();

  setStatus("Press space to start");

  els.roundInfo.textContent = "Ready";
}


/* -----------------------------
   Space bar
----------------------------- */

function toggleStartCancel() {
  if (game) {
    cancelGame();
  } else {
    startGame();
  }
}


/* -----------------------------
   Settings
----------------------------- */

function applySettings() {
  config.n = Math.max(
    1,
    Math.min(
      20,
      Number(els.nback.value) || 2
    )
  );

  config.rounds = Math.max(
    1,
    Math.min(
      500,
      Number(els.rounds.value) || 20
    )
  );

  config.speed = Math.max(
    0.25,
    Math.min(
      10,
      Number(els.speed.value) || 2
    )
  );

  els.nback.value = config.n;
  els.rounds.value = config.rounds;
  els.speed.value = config.speed;

  els.settings.classList.remove("open");

  els.settings.setAttribute(
    "aria-hidden",
    "true"
  );

  els.menuButton.setAttribute(
    "aria-expanded",
    "false"
  );
}


/* -----------------------------
   Event listeners
----------------------------- */

els.menuButton.addEventListener("click", () => {
  const open =
    els.settings.classList.toggle("open");

  els.settings.setAttribute(
    "aria-hidden",
    String(!open)
  );

  els.menuButton.setAttribute(
    "aria-expanded",
    String(open)
  );
});

els.apply.addEventListener(
  "click",
  applySettings
);

els.shapeButton.addEventListener(
  "click",
  () => answer("shape")
);

els.colorButton.addEventListener(
  "click",
  () => answer("color")
);

els.again.addEventListener(
  "click",
  startGame
);


/* -----------------------------
   Keyboard controls
----------------------------- */

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
    return;
  }

  if (event.key.toLowerCase() === "j") {
    event.preventDefault();
    answer("color");
    return;
  }
});


/* -----------------------------
   Initial state
----------------------------- */

setStatus("Press space to start");

clearStimulus();

updateButtons(false);
