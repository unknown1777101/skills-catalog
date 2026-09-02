/**
 * Client SPA Controller for Antigravity Skills Catalog
 * With Smart Update, Revision Diff, and Markdown Rendering
 */

let skillsData = [];
let systemPaths = { global: '', local: '' };
let currentTarget = 'global';
let selectedSkills = new Set();
let currentFilterCategory = 'all';
let currentSearchQuery = '';
let currentPreviewSkill = null;
let currentModalTab = 'skill';

// DOM Elements
const btnTargetGlobal = document.getElementById('btnTargetGlobal');
const btnTargetLocal = document.getElementById('btnTargetLocal');
const targetPathText = document.getElementById('targetPathText');
const searchInput = document.getElementById('searchInput');
const filterChips = document.getElementById('filterChips');
const skillsGrid = document.getElementById('skillsGrid');
const batchBar = document.getElementById('batchBar');
const selectAllCheckbox = document.getElementById('selectAllCheckbox');
const selectedCountText = document.getElementById('selectedCountText');
const batchInstallCount = document.getElementById('batchInstallCount');
const batchUpdateCount = document.getElementById('batchUpdateCount');
const btnBatchInstall = document.getElementById('btnBatchInstall');
const btnBatchUpdate = document.getElementById('btnBatchUpdate');
const btnBatchUninstall = document.getElementById('btnBatchUninstall');

// Stats Elements
const statTotalSkills = document.getElementById('statTotalSkills');
const statInstalledSkills = document.getElementById('statInstalledSkills');
const statUpdatesAvailable = document.getElementById('statUpdatesAvailable');
const btnQuickUpdateAll = document.getElementById('btnQuickUpdateAll');
const quickUpdateCount = document.getElementById('quickUpdateCount');

// Modal Elements
const previewModal = document.getElementById('previewModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalCloseBottomBtn = document.getElementById('modalCloseBottomBtn');
const modalCategory = document.getElementById('modalCategory');
const modalSkillName = document.getElementById('modalSkillName');
const modalStatusBadge = document.getElementById('modalStatusBadge');
const tabSkillMd = document.getElementById('tabSkillMd');
const tabReadmeMd = document.getElementById('tabReadmeMd');
const tabDiff = document.getElementById('tabDiff');
const modalContent = document.getElementById('modalContent');
const btnCloudSync = document.getElementById('btnCloudSync');
const btnSyncToCatalog = document.getElementById('btnSyncToCatalog');
const modalInstallBtn = document.getElementById('modalInstallBtn');
const modalUpdateBtn = document.getElementById('modalUpdateBtn');
const toastContainer = document.getElementById('toastContainer');

// Init
document.addEventListener('DOMContentLoaded', () => {
  fetchSkills();
  setupEventListeners();
});

function setupEventListeners() {
  // Target toggle
  btnTargetGlobal.addEventListener('click', () => setTarget('global'));
  btnTargetLocal.addEventListener('click', () => setTarget('local'));

  // Sync to Catalog from Target
  if (btnSyncToCatalog) {
    btnSyncToCatalog.addEventListener('click', () => handleSyncToCatalog());
  }

  // Cloud sync from GitHub
  if (btnCloudSync) {
    btnCloudSync.addEventListener('click', () => handleCloudSync());
  }

  // Search input
  searchInput.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value.toLowerCase().trim();
    renderCards();
  });

  // Filter chips
  filterChips.addEventListener('click', (e) => {
    if (e.target.classList.contains('chip')) {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      currentFilterCategory = e.target.dataset.category;
      renderCards();
    }
  });

  // Select all checkbox
  selectAllCheckbox.addEventListener('change', (e) => {
    const visibleSkills = getFilteredSkills();
    if (e.target.checked) {
      visibleSkills.forEach(s => selectedSkills.add(s.name));
    } else {
      visibleSkills.forEach(s => selectedSkills.delete(s.name));
    }
    updateBatchBar();
    renderCards();
  });

  // Quick Update All from stats bar
  if (btnQuickUpdateAll) {
    btnQuickUpdateAll.addEventListener('click', () => {
      const updateSkillsList = skillsData
        .filter(s => s.status && s.status[currentTarget] === 'update-available')
        .map(s => s.name);
      if (updateSkillsList.length > 0) {
        handleUpdateSkills(updateSkillsList);
      }
    });
  }

  // Batch actions
  btnBatchInstall.addEventListener('click', () => {
    if (selectedSkills.size > 0) {
      handleInstallSkills(Array.from(selectedSkills));
    }
  });

  btnBatchUpdate.addEventListener('click', () => {
    if (selectedSkills.size > 0) {
      handleUpdateSkills(Array.from(selectedSkills));
    }
  });

  btnBatchUninstall.addEventListener('click', () => {
    if (selectedSkills.size > 0) {
      handleUninstallSkills(Array.from(selectedSkills));
    }
  });

  // Modal events
  modalCloseBtn.addEventListener('click', closeModal);
  modalCloseBottomBtn.addEventListener('click', closeModal);
  previewModal.addEventListener('click', (e) => {
    if (e.target === previewModal) closeModal();
  });

  tabSkillMd.addEventListener('click', () => switchModalTab('skill'));
  tabReadmeMd.addEventListener('click', () => switchModalTab('readme'));
  tabDiff.addEventListener('click', () => switchModalTab('diff'));

  modalInstallBtn.addEventListener('click', () => {
    if (currentPreviewSkill) {
      if (!currentPreviewSkill.inCatalog || currentPreviewSkill.status === 'not-in-catalog') {
        handleSyncToCatalog([currentPreviewSkill.path || currentPreviewSkill.name]);
      } else {
        handleInstallSkills([currentPreviewSkill.name]);
      }
    }
  });

  modalUpdateBtn.addEventListener('click', () => {
    if (currentPreviewSkill) {
      handleUpdateSkills([currentPreviewSkill.name]);
    }
  });
}

function setTarget(target) {
  currentTarget = target;
  if (target === 'global') {
    btnTargetGlobal.classList.add('active');
    btnTargetLocal.classList.remove('active');
    targetPathText.textContent = systemPaths.global || '~/.gemini/config/skills/';
  } else {
    btnTargetLocal.classList.add('active');
    btnTargetGlobal.classList.remove('active');
    targetPathText.textContent = systemPaths.local || '.agents/skills/';
  }
  updateStats();
  renderCards();
}

async function fetchSkills() {
  try {
    const res = await fetch('/api/skills');
    const data = await res.json();
    skillsData = data.skills || [];
    systemPaths = data.paths || { global: '', local: '' };
    renderCategoryChips();
    updateStats();
    setTarget(currentTarget);
  } catch (err) {
    showToast('Failed to load skills catalog from local server', 'error');
  }
}

function updateStats() {
  const total = skillsData.filter(s => s.inCatalog !== false).length;
  let installed = 0;
  let updates = 0;
  let targetOnly = 0;

  skillsData.forEach(skill => {
    const st = skill.status ? skill.status[currentTarget] : 'not-installed';
    if (st === 'up-to-date') installed++;
    else if (st === 'update-available') {
      installed++;
      updates++;
    } else if (st === 'not-in-catalog' || skill.inCatalog === false) {
      targetOnly++;
    }
  });

  if (statTotalSkills) statTotalSkills.textContent = total;
  if (statInstalledSkills) statInstalledSkills.textContent = installed;
  if (statUpdatesAvailable) statUpdatesAvailable.textContent = updates;

  if (btnQuickUpdateAll && quickUpdateCount) {
    if (updates > 0) {
      btnQuickUpdateAll.style.display = 'flex';
      quickUpdateCount.textContent = updates;
    } else {
      btnQuickUpdateAll.style.display = 'none';
    }
  }
}

const CATEGORY_ICONS = {
  'Roblox': '🟥',
  'Unity': '🟦',
  'Git': '🟩',
  'Dev Tools': '🟨',
  'Skill Creator': '🛠️',
  'Web': '⚛️',
  'Python': '🐍',
};

function renderCategoryChips() {
  const categoryCounts = {};
  skillsData.forEach(skill => {
    const cat = skill.category || 'General';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const uniqueCategories = Object.keys(categoryCounts).sort();

  if (currentFilterCategory !== 'all' && !categoryCounts[currentFilterCategory]) {
    currentFilterCategory = 'all';
  }

  let html = `
    <button class="chip ${currentFilterCategory === 'all' ? 'active' : ''}" data-category="all">
      All Skills (${skillsData.length})
    </button>
  `;

  uniqueCategories.forEach(cat => {
    const icon = CATEGORY_ICONS[cat] || '🏷️';
    const count = categoryCounts[cat];
    html += `
      <button class="chip ${currentFilterCategory === cat ? 'active' : ''}" data-category="${cat}">
        ${icon} ${cat} (${count})
      </button>
    `;
  });

  filterChips.innerHTML = html;
}

function getFilteredSkills() {
  return skillsData.filter(skill => {
    const matchesCategory = currentFilterCategory === 'all' || skill.category === currentFilterCategory;
    const matchesSearch = !currentSearchQuery || 
      skill.name.toLowerCase().includes(currentSearchQuery) ||
      skill.description.toLowerCase().includes(currentSearchQuery) ||
      skill.category.toLowerCase().includes(currentSearchQuery);

    return matchesCategory && matchesSearch;
  });
}

function renderCards() {
  const filtered = getFilteredSkills();
  skillsGrid.innerHTML = '';

  if (filtered.length === 0) {
    skillsGrid.innerHTML = `
      <div class="loading-state">
        <p>No skills found matching your filter criteria.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(skill => {
    const skillStatus = skill.status ? skill.status[currentTarget] : 'not-installed';
    const isInstalled = skillStatus !== 'not-installed';
    const isUpdateAvailable = skillStatus === 'update-available';
    const isNotInCatalog = skillStatus === 'not-in-catalog' || skill.inCatalog === false;
    const isSelected = selectedSkills.has(skill.name);
    const categoryClass = (skill.category || 'General').toLowerCase().replace(/\s+/g, '');

    const card = document.createElement('div');
    card.className = `skill-card ${isSelected ? 'selected' : ''} ${isUpdateAvailable ? 'has-update' : ''} ${isNotInCatalog ? 'is-target-only' : ''}`;
    
    let statusBadgeHtml = '';
    if (skillStatus === 'up-to-date') {
      statusBadgeHtml = `
        <div class="status-badge installed">
          <span class="status-dot"></span>
          Up to Date ✔
        </div>
      `;
    } else if (skillStatus === 'update-available') {
      statusBadgeHtml = `
        <div class="status-badge update-available">
          <span class="status-dot pulsing"></span>
          Update Available 🔄
        </div>
      `;
    } else if (isNotInCatalog) {
      statusBadgeHtml = `
        <div class="status-badge" style="color: var(--accent-purple);">
          <span class="status-dot pulsing" style="background: var(--accent-purple); box-shadow: 0 0 8px var(--accent-purple);"></span>
          Not in Catalog ✨
        </div>
      `;
    } else {
      statusBadgeHtml = `
        <div class="status-badge not-installed">
          <span class="status-dot"></span>
          Not Installed
        </div>
      `;
    }

    let actionButtonsHtml = '';
    if (isNotInCatalog) {
      actionButtonsHtml = `
        <button class="btn btn-primary btn-sync-single" data-skill="${skill.path || skill.name}" title="Import this skill into the central catalog repository">
          📥 Add to Catalog
        </button>
        <button class="btn btn-secondary btn-preview" data-skill="${skill.name}">
          👁️
        </button>
      `;
    } else if (isUpdateAvailable) {
      actionButtonsHtml = `
        <button class="btn btn-warning btn-update" data-skill="${skill.name}" title="Update to latest catalog version">
          🔄 Update
        </button>
        <button class="btn btn-secondary btn-preview" data-skill="${skill.name}">
          👁️
        </button>
        <button class="btn btn-danger btn-uninstall" data-skill="${skill.name}" title="Uninstall skill">
          🗑️
        </button>
      `;
    } else if (isInstalled) {
      actionButtonsHtml = `
        <button class="btn btn-secondary btn-preview" data-skill="${skill.name}">
          👁️ Preview
        </button>
        <button class="btn btn-danger btn-uninstall" data-skill="${skill.name}" title="Uninstall skill">
          🗑️
        </button>
      `;
    } else {
      actionButtonsHtml = `
        <button class="btn btn-secondary btn-preview" data-skill="${skill.name}">
          👁️ Preview
        </button>
        <button class="btn btn-primary btn-install" data-skill="${skill.name}">
          📥 Install
        </button>
      `;
    }

    card.innerHTML = `
      <div>
        <div class="card-top">
          <label class="checkbox-label card-checkbox">
            <input type="checkbox" data-skill="${skill.name}" ${isSelected ? 'checked' : ''}>
            <span class="custom-check"></span>
          </label>
          <span class="category-tag ${categoryClass}">${skill.category || 'General'}</span>
        </div>
        <h3 class="card-name">${skill.name}</h3>
        <p class="card-desc">${skill.description || 'No description provided.'}</p>
      </div>

      <div class="card-bottom">
        ${statusBadgeHtml}
        <div class="card-actions">
          ${actionButtonsHtml}
        </div>
      </div>
    `;

    // Checkbox event
    const checkbox = card.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        selectedSkills.add(skill.name);
      } else {
        selectedSkills.delete(skill.name);
      }
      card.classList.toggle('selected', e.target.checked);
      updateBatchBar();
    });

    // Preview event
    card.querySelector('.btn-preview').addEventListener('click', () => {
      openPreviewModal(skill.name);
    });

    // Action button events
    const btnSyncSingle = card.querySelector('.btn-sync-single');
    if (btnSyncSingle) {
      btnSyncSingle.addEventListener('click', () => handleSyncToCatalog([skill.path || skill.name]));
    }

    const btnInstall = card.querySelector('.btn-install');
    if (btnInstall) {
      btnInstall.addEventListener('click', () => handleInstallSkills([skill.name]));
    }

    const btnUpdate = card.querySelector('.btn-update');
    if (btnUpdate) {
      btnUpdate.addEventListener('click', () => handleUpdateSkills([skill.name]));
    }

    const btnUninstall = card.querySelector('.btn-uninstall');
    if (btnUninstall) {
      btnUninstall.addEventListener('click', () => handleUninstallSkills([skill.name]));
    }

    skillsGrid.appendChild(card);
  });

  updateBatchBar();
}

function updateBatchBar() {
  const count = selectedSkills.size;
  if (count > 0) {
    batchBar.classList.add('show');
    selectedCountText.textContent = `${count} skill${count > 1 ? 's' : ''} selected`;
    batchInstallCount.textContent = count;

    // Check how many of the selected have updates
    const updateCount = Array.from(selectedSkills).filter(name => {
      const found = skillsData.find(s => s.name === name);
      return found && found.status && found.status[currentTarget] === 'update-available';
    }).length;

    batchUpdateCount.textContent = updateCount;
    btnBatchUpdate.style.display = updateCount > 0 ? 'inline-flex' : 'none';
  } else {
    batchBar.classList.remove('show');
    selectAllCheckbox.checked = false;
  }
}

async function handleInstallSkills(names) {
  showToast(`Installing ${names.length} skill(s) to ${currentTarget}...`, 'info');
  try {
    const res = await fetch('/api/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skills: names,
        target: currentTarget,
      }),
    });
    const result = await res.json();
    if (result.success) {
      showToast(`Successfully installed ${names.length} skill(s)!`, 'success');
      selectedSkills.clear();
      await fetchSkills();
      if (previewModal.classList.contains('show')) closeModal();
    } else {
      showToast(result.error || 'Installation failed', 'error');
    }
  } catch (err) {
    showToast('Failed to connect to installer server', 'error');
  }
}

async function handleUpdateSkills(names) {
  showToast(`Updating ${names.length} skill(s) in ${currentTarget}...`, 'info');
  try {
    const res = await fetch('/api/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skills: names,
        target: currentTarget,
      }),
    });
    const result = await res.json();
    if (result.success) {
      showToast(`Successfully updated ${names.length} skill(s) to latest version!`, 'success');
      selectedSkills.clear();
      await fetchSkills();
      if (previewModal.classList.contains('show')) closeModal();
    } else {
      showToast(result.error || 'Update failed', 'error');
    }
  } catch (err) {
    showToast('Failed to connect to installer server', 'error');
  }
}

async function handleSyncToCatalog(names) {
  const label = currentTarget === 'global' ? 'Global Config' : 'Local Workspace';
  showToast(`Syncing revisions & new skills from ${label} to catalog...`, 'info');
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skills: names || [],
        source: currentTarget,
      }),
    });
    const result = await res.json();
    if (result.success) {
      const added = result.addedCount || 0;
      const updated = result.updatedCount || (result.results ? result.results.length - added : 0);
      showToast(`Successfully synced to catalog! (${added} new skills added, ${updated} updated)`, 'success');
      selectedSkills.clear();
      await fetchSkills();
      if (previewModal.classList.contains('show')) closeModal();
    } else {
      showToast(result.error || 'Sync failed', 'error');
    }
  } catch (err) {
    showToast('Failed to connect to installer server', 'error');
  }
}

async function handleCloudSync() {
  showToast(`Connecting to GitHub Cloud and fetching latest revisions...`, 'info');
  try {
    const res = await fetch('/api/remote/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target: currentTarget,
      }),
    });
    const result = await res.json();
    if (result.success) {
      showToast(`Successfully downloaded & synced skills directly from GitHub!`, 'success');
      selectedSkills.clear();
      await fetchSkills();
    } else {
      showToast(result.error || 'Cloud sync failed', 'error');
    }
  } catch (err) {
    showToast('Failed to connect to GitHub Cloud', 'error');
  }
}

async function handleUninstallSkills(names) {
  showToast(`Removing ${names.length} skill(s) from ${currentTarget}...`, 'info');
  try {
    const res = await fetch('/api/uninstall', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skills: names,
        target: currentTarget,
      }),
    });
    const result = await res.json();
    if (result.success) {
      showToast(`Successfully removed ${names.length} skill(s)!`, 'success');
      selectedSkills.clear();
      await fetchSkills();
      if (previewModal.classList.contains('show')) closeModal();
    } else {
      showToast(result.error || 'Uninstall failed', 'error');
    }
  } catch (err) {
    showToast('Failed to connect to installer server', 'error');
  }
}

function parseMarkdown(md) {
  if (typeof window.marked !== 'undefined' && typeof window.marked.parse === 'function') {
    return window.marked.parse(md);
  }
  // Lightweight internal markdown parser fallback
  let html = md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/\n\n/gim, '<p></p>')
    .replace(/\n/gim, '<br />');
  return html;
}

async function openPreviewModal(skillName) {
  modalContent.innerHTML = '<div class="spinner"></div><p>Loading skill documentation & checking diff...</p>';
  previewModal.classList.add('show');
  modalSkillName.textContent = skillName;

  try {
    const res = await fetch(`/api/skill/${encodeURIComponent(skillName)}?target=${currentTarget}`);
    currentPreviewSkill = await res.json();
    modalCategory.textContent = currentPreviewSkill.category || 'Skill';

    const skillStatus = currentPreviewSkill.status ? currentPreviewSkill.status[currentTarget] : 'not-installed';
    if (skillStatus === 'up-to-date') {
      modalStatusBadge.textContent = 'Up to Date ✔';
      modalStatusBadge.className = 'status-pill pill-green';
      modalUpdateBtn.style.display = 'none';
      modalInstallBtn.style.display = 'none';
    } else if (skillStatus === 'update-available') {
      modalStatusBadge.textContent = 'Update Available 🔄';
      modalStatusBadge.className = 'status-pill pill-orange';
      modalUpdateBtn.style.display = 'inline-flex';
      modalInstallBtn.style.display = 'none';
    } else if (skillStatus === 'not-in-catalog' || currentPreviewSkill.inCatalog === false) {
      modalStatusBadge.textContent = 'Not in Catalog (New) ✨';
      modalStatusBadge.className = 'status-pill pill-purple';
      modalUpdateBtn.style.display = 'none';
      modalInstallBtn.style.display = 'inline-flex';
      modalInstallBtn.textContent = '📥 Add to Catalog';
    } else {
      modalStatusBadge.textContent = 'Not Installed';
      modalStatusBadge.className = 'status-pill pill-gray';
      modalUpdateBtn.style.display = 'none';
      modalInstallBtn.style.display = 'inline-flex';
      modalInstallBtn.textContent = '📥 Install This Skill';
    }

    switchModalTab(currentModalTab || 'skill');
  } catch (err) {
    modalContent.innerHTML = '<p class="color-red">Failed to load skill documentation.</p>';
  }
}

function switchModalTab(tab) {
  if (!currentPreviewSkill) return;
  currentModalTab = tab;

  tabSkillMd.classList.toggle('active', tab === 'skill');
  tabReadmeMd.classList.toggle('active', tab === 'readme');
  tabDiff.classList.toggle('active', tab === 'diff');

  if (tab === 'skill') {
    const content = currentPreviewSkill.skillMd || 'No SKILL.md found.';
    modalContent.innerHTML = `<div class="rendered-markdown">${parseMarkdown(content)}</div>`;
  } else if (tab === 'readme') {
    const content = currentPreviewSkill.readmeMd || 'No README.md found.';
    modalContent.innerHTML = `<div class="rendered-markdown">${parseMarkdown(content)}</div>`;
  } else if (tab === 'diff') {
    renderDiffTab();
  }
}

function renderDiffTab() {
  const catalogMd = currentPreviewSkill.skillMd || '';
  const installedMd = currentPreviewSkill.installedSkillMd;

  if (!installedMd) {
    modalContent.innerHTML = `
      <div class="diff-notice">
        <span class="diff-icon">ℹ️</span>
        <p>This skill is <strong>not currently installed</strong> in <code>${currentTarget === 'global' ? 'Global Config' : 'Local Workspace'}</code>.<br>
        Installing will place the master catalog version into your workspace.</p>
      </div>
    `;
    return;
  }

  if (catalogMd.trim() === installedMd.trim()) {
    modalContent.innerHTML = `
      <div class="diff-notice success">
        <span class="diff-icon">✅</span>
        <p>Your installed version in <code>${currentTarget === 'global' ? 'Global Config' : 'Local Workspace'}</code> is <strong>identical and 100% up-to-date</strong> with the central catalog.</p>
      </div>
    `;
    return;
  }

  // Generate line-by-line diff comparison
  const catLines = catalogMd.split(/\r?\n/);
  const instLines = installedMd.split(/\r?\n/);

  let diffHtml = `
    <div class="diff-notice warning">
      <span class="diff-icon">🔄</span>
      <p>Differences detected between central catalog (latest) and your installed version in <code>${currentTarget}</code>.</p>
    </div>
    <div class="diff-container">
      <div class="diff-col">
        <h4>📦 Central Catalog (Latest)</h4>
        <pre class="diff-code"><code>${escapeHtml(catalogMd)}</code></pre>
      </div>
      <div class="diff-col">
        <h4>📁 Your Installed Version (${currentTarget})</h4>
        <pre class="diff-code"><code>${escapeHtml(installedMd)}</code></pre>
      </div>
    </div>
  `;

  modalContent.innerHTML = diffHtml;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function closeModal() {
  previewModal.classList.remove('show');
  currentPreviewSkill = null;
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
    <span>${message}</span>
  `;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = '0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

