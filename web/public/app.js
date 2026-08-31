/**
 * Client SPA Controller for Antigravity Skills Catalog
 */

let skillsData = [];
let systemPaths = { global: '', local: '' };
let currentTarget = 'global';
let selectedSkills = new Set();
let currentFilterCategory = 'all';
let currentSearchQuery = '';
let currentPreviewSkill = null;

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
const btnBatchInstall = document.getElementById('btnBatchInstall');
const btnBatchUninstall = document.getElementById('btnBatchUninstall');

// Modal Elements
const previewModal = document.getElementById('previewModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalCloseBottomBtn = document.getElementById('modalCloseBottomBtn');
const modalCategory = document.getElementById('modalCategory');
const modalSkillName = document.getElementById('modalSkillName');
const tabSkillMd = document.getElementById('tabSkillMd');
const tabReadmeMd = document.getElementById('tabReadmeMd');
const modalContent = document.getElementById('modalContent');
const modalInstallBtn = document.getElementById('modalInstallBtn');
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

  // Batch actions
  btnBatchInstall.addEventListener('click', () => {
    if (selectedSkills.size > 0) {
      handleInstallSkills(Array.from(selectedSkills));
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

  modalInstallBtn.addEventListener('click', () => {
    if (currentPreviewSkill) {
      handleInstallSkills([currentPreviewSkill.name]);
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
  renderCards();
}

async function fetchSkills() {
  try {
    const res = await fetch('/api/skills');
    const data = await res.json();
    skillsData = data.skills || [];
    systemPaths = data.paths || { global: '', local: '' };
    renderCategoryChips();
    setTarget(currentTarget);
  } catch (err) {
    showToast('Failed to load skills catalog from local server', 'error');
  }
}

const CATEGORY_ICONS = {
  'Roblox': '🟥',
  'Unity': '🟦',
  'Git': '🟩',
  'Dev Tools': '🟨',
  'Web': '⚛️',
  'Python': '🐍',
  '3D': '🎨',
};

function renderCategoryChips() {
  const categoryCounts = {};
  skillsData.forEach(skill => {
    const cat = skill.category || 'General';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const uniqueCategories = Object.keys(categoryCounts).sort();

  // If active filter is not valid anymore, reset to 'all'
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
    const isInstalled = currentTarget === 'global' ? skill.installed.global : skill.installed.local;
    const isSelected = selectedSkills.has(skill.name);
    const categoryClass = skill.category.toLowerCase().replace(/\s+/g, '');

    const card = document.createElement('div');
    card.className = `skill-card ${isSelected ? 'selected' : ''}`;
    card.innerHTML = `
      <div>
        <div class="card-top">
          <label class="checkbox-label card-checkbox">
            <input type="checkbox" data-skill="${skill.name}" ${isSelected ? 'checked' : ''}>
            <span class="custom-check"></span>
          </label>
          <span class="category-tag ${categoryClass}">${skill.category}</span>
        </div>
        <h3 class="card-name">${skill.name}</h3>
        <p class="card-desc">${skill.description || 'No description provided.'}</p>
      </div>

      <div class="card-bottom">
        <div class="status-badge ${isInstalled ? 'installed' : 'not-installed'}">
          <span class="status-dot"></span>
          ${isInstalled ? `Installed (${currentTarget === 'global' ? 'Global' : 'Local'})` : 'Not Installed'}
        </div>

        <div class="card-actions">
          <button class="btn btn-secondary btn-preview" data-skill="${skill.name}">
            👁️ Preview
          </button>
          ${isInstalled ? `
            <button class="btn btn-danger btn-uninstall" data-skill="${skill.name}">
              🗑️
            </button>
          ` : `
            <button class="btn btn-primary btn-install" data-skill="${skill.name}">
              📥 Install
            </button>
          `}
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

    // Action button event
    const btnInstall = card.querySelector('.btn-install');
    if (btnInstall) {
      btnInstall.addEventListener('click', () => handleInstallSkills([skill.name]));
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
    } else {
      showToast(result.error || 'Uninstall failed', 'error');
    }
  } catch (err) {
    showToast('Failed to connect to installer server', 'error');
  }
}

async function openPreviewModal(skillName) {
  modalContent.textContent = 'Loading skill documentation...';
  previewModal.classList.add('show');
  modalSkillName.textContent = skillName;

  try {
    const res = await fetch(`/api/skill/${encodeURIComponent(skillName)}`);
    currentPreviewSkill = await res.json();
    modalCategory.textContent = skillName.startsWith('roblox-') ? 'Roblox' : 'Skill';
    switchModalTab('skill');
  } catch (err) {
    modalContent.textContent = 'Failed to load skill documentation.';
  }
}

function switchModalTab(tab) {
  if (!currentPreviewSkill) return;

  if (tab === 'skill') {
    tabSkillMd.classList.add('active');
    tabReadmeMd.classList.remove('active');
    modalContent.textContent = currentPreviewSkill.skillMd || 'No SKILL.md found.';
  } else {
    tabReadmeMd.classList.add('active');
    tabSkillMd.classList.remove('active');
    modalContent.textContent = currentPreviewSkill.readmeMd || 'No README.md found.';
  }
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
