function renderNavbar(activeTab) {
  return `
    <nav class="navbar">
      <div class="navbar-brand" onclick="switchTab('home')">HkimX</div>
      <div class="navbar-links">
        <button class="nav-link${activeTab === "home" ? " active" : ""}" onclick="switchTab('home')">首页</button>
        <button class="nav-link${activeTab === "fun" ? " active" : ""}" onclick="switchTab('fun')">好玩的</button>
        <div class="nav-indicator" id="nav-indicator"></div>
      </div>
    </nav>
  `;
}

function renderHero(modsCount) {
  return `
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">HkimX</h1>
        <p class="hero-subtitle">${modsCount} 个 Minecraft 项目</p>
      </div>
      <div class="hero-scroll">
        <span>向下滚动</span>
        <div class="hero-scroll-arrow"></div>
      </div>
    </section>
  `;
}

function renderModCard(mod) {
  return `
    <div class="mod-card" data-mod-id="${mod.id}">
      <div class="mod-card-header">
        <img class="mod-card-icon" src="${mod.icon}" alt="${mod.name}"
          onerror="this.src='/assets/icon.png'">
        <div class="mod-card-name">${mod.name}</div>
      </div>
      <p class="mod-card-summary">${mod.summary}</p>
      <div class="mod-card-meta">
        ${mod.mcVersions.map((v) => `<span class="tag tag-version">${v}</span>`).join("")}
        ${mod.loaders.map((l) => `<span class="tag tag-loader">${l}</span>`).join("")}
      </div>
    </div>
  `;
}

function renderModGrid(mods) {
  return `
    <section class="section" id="mod-grid">
      <h2 class="section-title">模组项目</h2>
      <p class="section-subtitle">点击卡片查看详情</p>
      <div class="mod-grid">
        ${mods.map(renderModCard).join("")}
      </div>
    </section>
  `;
}

function renderModalDetail(mod) {
  const gallery = mod.screenshots?.length
    ? `<div class="modal-gallery">${mod.screenshots
        .map((s) => `<img src="${s}" alt="screenshot" onerror="this.style.display='none'">`)
        .join("")}</div>`
    : "";

  return `
    <div class="modal-overlay" id="modal-overlay" onclick="closeModal(event)">
      <div class="modal-window" onclick="event.stopPropagation()">
        <button class="modal-close" onclick="closeModal()">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M4 4l8 8M12 4l-8 8"/>
          </svg>
        </button>

        <div class="modal-header">
          <img class="modal-icon" src="${mod.icon}" alt="${mod.name}"
            onerror="this.src='/assets/icon.png'">
          <div>
            <div class="modal-info-name">${mod.name}</div>
            <div class="modal-info-version">v${mod.version}</div>
            <div class="modal-actions">
              <a class="btn btn-github" href="${mod.github}" target="_blank" rel="noopener">GitHub</a>
            </div>
          </div>
        </div>

        ${gallery}

        <div class="modal-section">
          <h3>介绍</h3>
          <div class="modal-description">${mod.description}</div>
        </div>

        <div class="modal-section">
          <h3>兼容性</h3>
          <div class="compat-block">
            <div class="compat-chip">
              <span class="compat-chip-label">Minecraft</span>
              ${mod.mcVersions.map((v) => `<span class="tag tag-version">${v}</span>`).join("")}
            </div>
            <div class="compat-chip">
              <span class="compat-chip-label">加载器</span>
              ${mod.loaders.map((l) => `<span class="tag tag-loader">${l}</span>`).join("")}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderFunTab() {
  const types = ['PANES', 'RUBIX', 'NUMBERS', 'STARTS_WITH', 'SELECT', 'MELODY'];
  return `
    <section class="section">
      <h2 class="section-title">SkyBlock Terminals</h2>
      <p class="section-subtitle">选择一个终端</p>
      <div class="term-btn-grid">
        ${types.map(id => `
          <button class="term-btn" onclick="openTerminal('${id}')">
            <span class="term-btn-id">${id}</span>
            <span class="term-btn-size">${TERMINAL_DEFS[id].rows}×${TERMINAL_DEFS[id].cols}</span>
          </button>
        `).join('')}
      </div>
    </section>
  `;
}

function renderFooter() {
  return `
    <footer class="footer">
      <p class="footer-copy">&copy; ${new Date().getFullYear()} SMxNcn — <a href="https://github.com/SMxNcn/NcKim-Server" target="_blank" rel="noopener">GitHub</a></p>
      <p class="footer-icp"><a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">沪ICP备xxxxxx号-1</a></p>
    </footer>
  `;
}
