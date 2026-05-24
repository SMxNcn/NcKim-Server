let termState = null;
let termType = null;
let termStartedAt = null;
let melodyTimer = null;
let termCloseTimer = null;

function termTitle(typeId, state) {
  switch (typeId) {
    case 'PANES': return 'Correct all the panes!';
    case 'RUBIX': return 'Change all to same color!';
    case 'NUMBERS': return 'Click in order!';
    case 'STARTS_WITH': return `What starts with: '${state.targetLetter}'?`;
    case 'SELECT': return `Select all the ${state.targetColor} items!`;
    case 'MELODY': return 'Click the button on time!';
    default: return typeId;
  }
}

function openTerminal(typeId) {
  closeTerminal();

  const game = TERMINAL_GAMES[typeId];
  if (!game) return;

  termType = typeId;
  termState = game.init();
  termStartedAt = Date.now();

  const def = TERMINAL_DEFS[typeId];

  const content = `
    <div class="term-overlay" id="term-overlay" onclick="closeTerminal(event)">
      <div class="term-window" onclick="event.stopPropagation()">
        <div class="term-header">
          <span class="term-title" id="term-title">${termTitle(typeId, termState)}</span>
          <button class="term-close-btn" onclick="closeTerminal()">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M4 4l8 8M12 4l-8 8"/>
            </svg>
          </button>
        </div>
        <div class="term-body">
          <div class="term-grid" id="term-grid">${game.render(termState)}</div>
        </div>
      </div>
    </div>
  `;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = content;
  const overlay = wrapper.firstElementChild;

  termScrollPos = window.scrollY;
  document.body.style.overflow = 'hidden';

  document.body.appendChild(overlay);
  void overlay.offsetHeight;
  overlay.classList.add('active');

  const gridEl = document.getElementById('term-grid');
  gridEl.addEventListener('click', onGridClick);
  gridEl.addEventListener('contextmenu', onGridContextMenu);
  gridEl.addEventListener('auxclick', e => e.preventDefault());

  if (typeId === 'MELODY') {
    startMelodyTick();
  }
}

let termScrollPos = 0;

function closeTerminal(event) {
  if (event && event.target && event.target.id !== 'term-overlay') return;
  const overlay = document.getElementById('term-overlay');
  if (!overlay) return;

  if (termCloseTimer) {
    clearTimeout(termCloseTimer);
    termCloseTimer = null;
  }

  if (melodyTimer) {
    clearInterval(melodyTimer);
    melodyTimer = null;
  }

  overlay.classList.remove('active');
  // Strip IDs so getElementById in openTerminal finds only the new overlay
  overlay.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
  overlay.removeAttribute('id');
  setTimeout(() => {
    overlay.remove();
    document.body.style.overflow = '';
    window.scrollTo(0, termScrollPos);
  }, 350);
}

function onGridClick(e) {
  const btn = e.target.closest('.term-cell');
  if (!btn) return;
  const r = parseInt(btn.dataset.r);
  const c = parseInt(btn.dataset.c);
  if (isNaN(r) || isNaN(c)) return;

  const game = TERMINAL_GAMES[termType];
  if (!game) return;

  const newState = game.click(termState, r, c, 'left');
  if (newState === termState) return;

  termState = newState;

  const gridEl = document.getElementById('term-grid');
  if (gridEl) {
    if (termType === 'PANES') {
      // Targeted class toggle preserves DOM element for CSS transition
      const cell = gridEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
      if (cell) {
        cell.className = `term-cell pane-${termState.grid[r][c] ? 'green' : 'red'}`;
      }
    } else {
      gridEl.innerHTML = game.render(termState);
    }
  }

  if (game.checkWin(termState)) {
    onTermWin();
    return;
  }

  if (termState.failed) {
    setTimeout(() => {
      termState = { ...termState, failed: false };
      const gridEl2 = document.getElementById('term-grid');
      if (gridEl2) {
        gridEl2.innerHTML = game.render(termState);
      }
    }, 400);
  }
}

function onGridContextMenu(e) {
  e.preventDefault();
  if (termType !== 'RUBIX') return;

  const btn = e.target.closest('.term-cell');
  if (!btn) return;
  const r = parseInt(btn.dataset.r);
  const c = parseInt(btn.dataset.c);
  if (isNaN(r) || isNaN(c)) return;

  const game = TERMINAL_GAMES[termType];
  const newState = game.click(termState, r, c, 'right');
  if (newState === termState) return;

  termState = newState;

  const gridEl = document.getElementById('term-grid');
  if (gridEl) {
    gridEl.innerHTML = game.render(termState);
  }

  if (game.checkWin(termState)) {
    onTermWin();
  }
}

function startMelodyTick() {
  let tickAcc = 0;
  melodyTimer = setInterval(() => {
    tickAcc++;
    if (tickAcc % 1 !== 0) return;

    const game = TERMINAL_GAMES['MELODY'];
    const prevGreen = termState.greenCol;
    const newState = game.tick(termState);
    if (newState === termState) return;

    const prevRow = termState.currentRow;
    termState = newState;

    // Targeted class update to preserve DOM elements (avoids button hover flicker)
    const gridEl = document.getElementById('term-grid');
    if (gridEl && prevGreen !== termState.greenCol) {
      const rowEl = gridEl.children[prevRow];
      if (rowEl) {
        rowEl.children[prevGreen].className = 'term-cell melody-slot';
        rowEl.children[termState.greenCol].className = 'term-cell melody-green';
      }
    }
  }, 500);
}

function onTermWin() {
  const elapsed = ((Date.now() - termStartedAt) / 1000).toFixed(1);

  if (melodyTimer) {
    clearInterval(melodyTimer);
    melodyTimer = null;
  }

  const titleEl = document.getElementById('term-title');
  if (titleEl) {
    titleEl.textContent = `Completed in ${elapsed}s`;
  }

  const gridEl = document.getElementById('term-grid');
  if (gridEl) {
    gridEl.querySelectorAll('button').forEach(btn => btn.disabled = true);
  }

  termCloseTimer = setTimeout(() => {
    termCloseTimer = null;
    closeTerminal();
  }, 1000);
}

// Expose globals for inline onclick
window.openTerminal = openTerminal;
window.closeTerminal = closeTerminal;
