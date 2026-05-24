// Each game exports: { init, click, checkWin, render }

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickN(arr, n) {
  return shuffle(arr).slice(0, n);
}

const RUBIX_COLORS = [
  { name: 'orange', hex: '#c68a33' },
  { name: 'yellow', hex: '#c6ae33' },
  { name: 'green',  hex: '#4db84d' },
  { name: 'blue',   hex: '#6277c9' },
  { name: 'red',    hex: '#ba3652' },
];

const MC_ITEMS = [
  'APPLE', 'ARROW', 'ANVIL', 'AXE',
  'BOW', 'BONE', 'BREAD', 'BEACON', 'BLAZE', 'BEDROCK', 'BUCKET',
  'CHEST', 'COAL', 'CACTUS', 'COMPASS',
  'DIAMOND', 'DRAGON',
  'EMERALD', 'ENDER', 'EYE',
  'FEATHER', 'FURNACE', 'FLINT',
  'GOLD', 'GRASS', 'GLASS',
  'HONEY', 'HEART',
  'IRON', 'INK',
  'JUKEBOX',
  'LAPIS', 'LAVA', 'LEATHER', 'LEVER',
  'MELON', 'MOSS', 'MUSHROOM',
  'NETHERITE', 'NETHER',
  'OBSIDIAN',
  'PAPER', 'PUMPKIN', 'PEARL',
  'QUARTZ',
  'REDSTONE', 'RAIL',
  'SLIME', 'SNOW', 'STRING', 'STICK', 'SWORD',
  'TNT', 'TORCH', 'TRIDENT',
  'VINE',
  'WATER', 'WHEAT', 'WOOL', 'WOOD',
  'ZOMBIE',
];

const COLOR_ITEMS = {
  RED:    ['REDSTONE', 'APPLE', 'BRICK', 'BLAZE', 'POPPY', 'RED_TULIP', 'RED_MUSHROOM', 'NETHER_WART'],
  BLUE:   ['LAPIS_LAZULI', 'CORNFLOWER', 'BLUE_ORCHID', 'DIAMOND'],
  GREEN:  ['EMERALD', 'SLIME_BALL', 'CACTUS', 'MOSS_BLOCK', 'VINE', 'LIME_WOOL'],
  YELLOW: ['GOLD_INGOT', 'SUNFLOWER', 'DANDELION', 'HONEYCOMB'],
  PURPLE: ['SHULKER_SHELL', 'CHORUS_FRUIT', 'PURPUR_BLOCK', 'AMETHYST'],
  ORANGE: ['PUMPKIN', 'CARROT', 'ORANGE_TULIP', 'BLAZE_POWDER'],
  WHITE:  ['BONE', 'FEATHER', 'SNOWBALL', 'SUGAR', 'WHITE_WOOL', 'BONE_MEAL'],
  BLACK:  ['OBSIDIAN', 'COAL', 'INK_SAC', 'GUNPOWDER', 'BLACK_WOOL', 'WITHER_ROSE'],
};

const COLOR_NAMES = Object.keys(COLOR_ITEMS);

const PANES = {
  init() {
    const total = 15;
    const redCount = randInt(5, 12);
    const flat = Array(total).fill(true);
    const indices = shuffle([...Array(total).keys()]).slice(0, redCount);
    indices.forEach(i => { flat[i] = false; });
    const grid = [];
    for (let r = 0; r < 3; r++) {
      grid.push(flat.slice(r * 5, (r + 1) * 5));
    }
    return { grid, phase: 'playing' };
  },

  click(state, r, c) {
    if (state.phase !== 'playing') return state;
    const grid = state.grid.map(row => [...row]);
    grid[r][c] = !grid[r][c];
    return { ...state, grid };
  },

  checkWin(state) {
    return state.grid.every(row => row.every(cell => cell === true));
  },

  render(state) {
    return state.grid.map((row, r) =>
      `<div class="term-row">` +
      row.map((cell, c) =>
        `<button class="term-cell pane-${cell ? 'green' : 'red'}" data-r="${r}" data-c="${c}"></button>`
      ).join('') +
      `</div>`
    ).join('');
  },
};

const RUBIX = {
  init() {
    const grid = [];
    for (let r = 0; r < 3; r++) {
      const row = [];
      for (let c = 0; c < 3; c++) row.push(randInt(0, 4));
      grid.push(row);
    }
    return { grid, phase: 'playing' };
  },

  click(state, r, c, action) {
    if (state.phase !== 'playing') return state;
    const grid = state.grid.map(row => [...row]);
    grid[r][c] = (grid[r][c] + (action === 'right' ? 4 : 1)) % 5;
    return { ...state, grid };
  },

  checkWin(state) {
    const flat = state.grid.flat();
    return flat.every(v => v === flat[0]);
  },

  render(state) {
    const grid = state.grid;
    // Find target color that minimizes total clicks
    let bestTarget = 0, bestScore = Infinity;
    for (let t = 0; t < 5; t++) {
      let score = 0;
      for (const row of grid)
        for (const ci of row)
          score += Math.min((t - ci + 5) % 5, (ci - t + 5) % 5);
      if (score < bestScore) { bestScore = score; bestTarget = t; }
    }
    return grid.map((row, r) =>
      `<div class="term-row">` +
      row.map((ci, c) => {
        const left = (bestTarget - ci + 5) % 5;
        const right = (ci - bestTarget + 5) % 5;
        let display, cls = 'term-cell rubix-cell';
        if (left === 0) { display = ''; cls += ' rubix-done'; }
        else if (left <= right) { display = left; }
        else { display = -right; }
        return `<button class="${cls}" data-r="${r}" data-c="${c}" style="background:${RUBIX_COLORS[ci].hex}">${display}</button>`;
      }).join('') +
      `</div>`
    ).join('');
  },
};

const NUMBERS = {
  init() {
    const values = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
    return {
      grid: [values.slice(0, 7), values.slice(7, 14)],
      clicked: [[false, false, false, false, false, false, false],
                [false, false, false, false, false, false, false]],
      nextExpected: 1,
      phase: 'playing',
      failed: false,
    };
  },

  click(state, r, c) {
    if (state.phase !== 'playing') return state;
    if (state.grid[r][c] === state.nextExpected) {
      const newClicked = state.clicked.map(row => [...row]);
      newClicked[r][c] = true;
      const next = state.nextExpected + 1;
      return {
        ...state,
        clicked: newClicked,
        nextExpected: next,
        phase: next > 14 ? 'won' : 'playing',
        failed: false,
      };
    }
    return { ...state, failed: true };
  },

  checkWin(state) {
    return state.phase === 'won';
  },

  render(state) {
    const fail = state.failed;
    const { nextExpected } = state;
    return state.grid.map((row, r) =>
      `<div class="term-row">` +
      row.map((val, c) => {
        const done = state.clicked[r][c];
        let cls = 'term-cell num-cell';
        if (done) cls += ' num-done';
        else if (val === nextExpected) cls += ' num-current';
        else if (val === nextExpected + 1) cls += ' num-next';
        else if (val === nextExpected + 2) cls += ' num-next2';
        if (fail && !done) cls += ' num-shake';
        return `<button class="${cls}" data-r="${r}" data-c="${c}"${done ? ' disabled' : ''}>${val}</button>`;
      }).join('') +
      `</div>`
    ).join('');
  },
};

const STARTS_WITH = {
  init() {
    const total = 21;
    const letterCount = {};
    MC_ITEMS.forEach(w => { letterCount[w[0]] = (letterCount[w[0]] || 0) + 1; });
    const validLetters = Object.keys(letterCount).filter(ch => letterCount[ch] >= 2);
    const targetLetter = validLetters[randInt(0, validLetters.length - 1)];

    const matching = MC_ITEMS.filter(w => w[0] === targetLetter);
    const nonMatching = MC_ITEMS.filter(w => w[0] !== targetLetter);
    const maxMatch = Math.min(matching.length, total - 4);
    const matchCount = randInt(2, maxMatch);

    const picked = shuffle([...pickN(matching, matchCount), ...pickN(nonMatching, total - matchCount)]);
    const grid = [];
    for (let r = 0; r < 3; r++) {
      const row = [];
      for (let c = 0; c < 7; c++) {
        const word = picked[r * 7 + c];
        row.push({ word, isTarget: word[0] === targetLetter, clicked: false });
      }
      grid.push(row);
    }
    return { grid, targetLetter, phase: 'playing', failed: false };
  },

  click(state, r, c) {
    if (state.phase !== 'playing') return state;
    const cell = state.grid[r][c];
    if (cell.clicked) return state;

    if (cell.isTarget) {
      const grid = state.grid.map(row => row.map(c => ({ ...c })));
      grid[r][c].clicked = true;
      return { ...state, grid, failed: false };
    }
    const grid = state.grid.map(row => row.map(c => ({ ...c, clicked: false })));
    return { ...state, grid, failed: true };
  },

  checkWin(state) {
    return state.grid.every(row => row.every(c => !c.isTarget || c.clicked));
  },

  render(state) {
    return state.grid.map((row, r) =>
      `<div class="term-row">` +
      row.map((cell, c) => {
        let cls = 'term-cell sw-cell';
        if (cell.isTarget) cls += ' sw-target';
        if (cell.clicked) cls += ' sw-done';
        if (state.failed) cls += ' sw-shake';
        return `<button class="${cls}" data-r="${r}" data-c="${c}"${cell.clicked ? ' disabled' : ''}></button>`;
      }).join('') +
      `</div>`
    ).join('');
  },
};

const SELECT_GAME = {
  init() {
    const rows = 4, cols = 7, total = 28;
    const targetColor = COLOR_NAMES[randInt(0, COLOR_NAMES.length - 1)];

    const pool = [];
    COLOR_NAMES.forEach(color => {
      COLOR_ITEMS[color].forEach(item => {
        pool.push({ item, color, isTarget: color === targetColor });
      });
    });

    while (pool.filter(x => x.isTarget).length < 3) {
      COLOR_ITEMS[targetColor].forEach(item => {
        pool.push({ item, color: targetColor, isTarget: true });
      });
    }

    const shuffled = shuffle(pool);
    const picked = shuffled.slice(0, total);

    let targetCount = picked.filter(x => x.isTarget).length;
    const extras = shuffled.slice(total).filter(x => x.isTarget);
    for (let i = 0; i < total && targetCount < 3 && extras.length > 0; i++) {
      if (!picked[i].isTarget) {
        picked[i] = extras.pop();
        targetCount++;
      }
    }

    const grid = [];
    for (let r = 0; r < rows; r++) {
      grid.push(picked.slice(r * cols, (r + 1) * cols).map(x => ({ ...x, clicked: false })));
    }
    return { grid, targetColor, phase: 'playing', failed: false };
  },

  click(state, r, c) {
    if (state.phase !== 'playing') return state;
    const cell = state.grid[r][c];
    if (cell.clicked) return state;

    if (cell.isTarget) {
      const grid = state.grid.map(row => row.map(c => ({ ...c })));
      grid[r][c].clicked = true;
      return { ...state, grid, failed: false };
    }
    const grid = state.grid.map(row => row.map(c => ({ ...c, clicked: false })));
    return { ...state, grid, failed: true };
  },

  checkWin(state) {
    return state.grid.every(row => row.every(c => !c.isTarget || c.clicked));
  },

  render(state) {
    return state.grid.map((row, r) =>
      `<div class="term-row">` +
      row.map((cell, c) => {
        let cls = 'term-cell sel-cell';
        if (cell.isTarget) cls += ' sel-target';
        if (cell.clicked) cls += ' sel-done';
        if (state.failed) cls += ' sel-shake';
        return `<button class="${cls}" data-r="${r}" data-c="${c}"${cell.clicked ? ' disabled' : ''}></button>`;
      }).join('') +
      `</div>`
    ).join('');
  },
};

const MELODY = {
  init() {
    let greenCol, purpleCol;
    do { greenCol = randInt(0, 4); purpleCol = randInt(0, 4); }
    while (greenCol === purpleCol);
    return { currentRow: 1, greenCol, purpleCol, direction: 1, progress: 0, paused: 0, phase: 'playing' };
  },

  tick(state) {
    if (state.phase !== 'playing') return state;
    if (state.paused > 0) return { ...state, paused: state.paused - 1 };

    let { greenCol, direction } = state;
    greenCol += direction;
    if (greenCol < 0) { greenCol = 1; direction = 1; }
    if (greenCol > 4) { greenCol = 3; direction = -1; }
    return { ...state, greenCol, direction };
  },

  click(state, r, c) {
    if (state.phase !== 'playing') return state;
    if (state.paused > 0) return state;
    if (r !== state.currentRow || c !== 5) return state;

    if (state.greenCol !== state.purpleCol) return { ...state, paused: 4 };

    const newProgress = state.progress + 1;
    if (newProgress >= 4) return { ...state, progress: newProgress, phase: 'won' };

    let newGreen, newPurple;
    do { newGreen = randInt(0, 4); newPurple = randInt(0, 4); }
    while (newGreen === newPurple);

    const newRow = state.currentRow + 1;
    return {
      ...state,
      currentRow: newRow,
      greenCol: newGreen,
      purpleCol: newPurple,
      direction: (newRow % 2 === 0) ? -1 : 1,
      progress: newProgress,
      paused: 0,
    };
  },

  checkWin(state) {
    return state.phase === 'won';
  },

  render(state) {
    const { currentRow, greenCol, purpleCol } = state;
    const rows = [];

    for (let r = 0; r < 6; r++) {
      const cells = [];
      for (let c = 0; c < 6; c++) {
        if (c === 5) {
          if (r >= 1 && r <= 4) {
            if (r < currentRow) {
              cells.push(`<button class="term-cell melody-btn melody-btn-done" disabled>✓</button>`);
            } else if (r === currentRow) {
              cells.push(`<button class="term-cell melody-btn" data-r="${r}" data-c="5">▶</button>`);
            } else {
              cells.push(`<button class="term-cell melody-btn melody-btn-idle" disabled></button>`);
            }
          } else {
            cells.push(`<div class="term-cell melody-empty"></div>`);
          }
          continue;
        }

        if (r === 0 || r === 5) {
          cells.push(c === purpleCol
            ? `<div class="term-cell melody-purple"></div>`
            : `<div class="term-cell melody-empty"></div>`);
        } else if (r === currentRow) {
          cells.push(c === greenCol
            ? `<div class="term-cell melody-green"></div>`
            : `<div class="term-cell melody-slot"></div>`);
        } else if (r < currentRow) {
          cells.push(`<div class="term-cell melody-slot melody-slot-done"></div>`);
        } else {
          cells.push(`<div class="term-cell melody-slot"></div>`);
        }
      }
      rows.push(`<div class="term-row">${cells.join('')}</div>`);
    }
    return rows.join('');
  },
};

const TERMINAL_GAMES = { PANES, RUBIX, NUMBERS, STARTS_WITH, SELECT: SELECT_GAME, MELODY };

const TERMINAL_DEFS = {
  PANES:        { id: 'PANES',        rows: 3, cols: 5 },
  RUBIX:        { id: 'RUBIX',        rows: 3, cols: 3 },
  NUMBERS:      { id: 'NUMBERS',      rows: 2, cols: 7 },
  STARTS_WITH:  { id: 'STARTS_WITH',  rows: 3, cols: 7 },
  SELECT:       { id: 'SELECT',       rows: 4, cols: 7 },
  MELODY:       { id: 'MELODY',       rows: 6, cols: 6 },
};
