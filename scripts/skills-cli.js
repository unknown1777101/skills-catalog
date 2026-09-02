#!/usr/bin/env node

/**
 * Universal Antigravity Skills Catalog CLI Manager
 * With Smart Update, Status Diff, Sync, and Cloud Remote Auto-Fetch
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const crypto = require('crypto');
const readline = require('readline');

const GITHUB_REPO = 'unknown1777101/skills-catalog';
const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/`;

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
  purple: '\x1b[35m',
  orange: '\x1b[38;5;208m',
};

function getGlobalSkillsDir() {
  return path.join(os.homedir(), '.gemini', 'config', 'skills');
}

function getLocalSkillsDir(cwd) {
  return path.join(cwd || process.cwd(), '.agents', 'skills');
}

function getSourceSkillsDir() {
  return path.join(__dirname, '..', '.agents', 'skills');
}

function fetchHttps(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'antigravity-skills-catalog-cli',
      },
    };
    https.get(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchHttps(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
      }
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function copyFolderRecursiveSync(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const files = fs.readdirSync(source);
  for (const file of files) {
    const srcPath = path.join(source, file);
    const tgtPath = path.join(target, file);

    if (fs.statSync(srcPath).isDirectory()) {
      copyFolderRecursiveSync(srcPath, tgtPath);
    } else {
      fs.copyFileSync(srcPath, tgtPath);
    }
  }
}

function getFolderHash(dir) {
  if (!fs.existsSync(dir)) return null;
  const hash = crypto.createHash('sha256');

  function hashDir(currentDir) {
    const files = fs.readdirSync(currentDir).sort();
    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        hashDir(fullPath);
      } else {
        hash.update(path.relative(dir, fullPath));
        hash.update(fs.readFileSync(fullPath));
      }
    }
  }

  try {
    hashDir(dir);
    return hash.digest('hex');
  } catch (err) {
    return null;
  }
}

function findSkillsRecursive(dir, baseDir = dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  if (dir !== baseDir && fs.existsSync(path.join(dir, 'SKILL.md'))) {
    const relPath = path.relative(baseDir, dir).replace(/\\/g, '/');
    results.push(relPath);
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const fullPath = path.join(dir, entry.name);
      results = results.concat(findSkillsRecursive(fullPath, baseDir));
    }
  }

  return results;
}

function getAvailableSkills() {
  const sourceDir = getSourceSkillsDir();
  if (fs.existsSync(sourceDir)) {
    const found = findSkillsRecursive(sourceDir);
    if (found.length > 0) return found;
  }

  // Fallback list of known catalog skills if source dir is not available
  return [
    'roblox/animation-system',
    'roblox/indicator-system',
    'roblox/knit-arch',
    'roblox/object-pooling',
    'roblox/responsive-ui',
  ];
}

function getSkillMeta(relPath, baseDir) {
  const sourceDir = baseDir || getSourceSkillsDir();
  const skillPath = path.join(sourceDir, relPath);
  const skillMdPath = path.join(skillPath, 'SKILL.md');
  let name = path.basename(relPath);
  let description = '';
  let category = '';

  if (fs.existsSync(skillMdPath)) {
    const content = fs.readFileSync(skillMdPath, 'utf8');
    const nameMatch = content.match(/^name:\s*([^\n\r]+)/m);
    if (nameMatch) name = nameMatch[1].trim().replace(/^['"]|['"]$/g, '');

    const catMatch = content.match(/^category:\s*([^\n\r]+)/m);
    if (catMatch) category = catMatch[1].trim().replace(/^['"]|['"]$/g, '');

    const descMatch = content.match(/^description:\s*([^\n\r]+)/m);
    if (descMatch) description = descMatch[1].trim();
  }

  if (!category) {
    if (relPath.includes('/')) {
      const top = relPath.split('/')[0];
      category = top.charAt(0).toUpperCase() + top.slice(1);
    } else if (name.startsWith('roblox-')) category = 'Roblox';
    else if (name.startsWith('unity-')) category = 'Unity';
    else if (name.startsWith('git-')) category = 'Git';
    else if (name.startsWith('dev-tool')) category = 'Dev Tools';
    else category = 'General';
  }

  return { name, relPath, category, description };
}

function getSkillStatus(relPath, targetBaseDir) {
  const sourceDir = getSourceSkillsDir();
  const srcPath = path.join(sourceDir, relPath);
  const destPath = path.join(targetBaseDir, relPath);
  const altDestPath = path.join(targetBaseDir, path.basename(relPath));

  let actualDest = null;
  if (fs.existsSync(destPath)) actualDest = destPath;
  else if (fs.existsSync(altDestPath)) actualDest = altDestPath;

  if (!actualDest) return { installed: false, status: 'not-installed', dest: null };

  const srcHash = getFolderHash(srcPath);
  const destHash = getFolderHash(actualDest);

  if (srcHash && destHash && srcHash === destHash) {
    return { installed: true, status: 'up-to-date', dest: actualDest };
  } else {
    return { installed: true, status: 'update-available', dest: actualDest };
  }
}

function handleList() {
  const skills = getAvailableSkills();
  const globalBase = getGlobalSkillsDir();
  const localBase = getLocalSkillsDir();

  console.log(`\n${COLORS.bright}=== 🪐 Antigravity Skills Catalog ===${COLORS.reset}`);
  console.log(`Available modular skills in this repository:\n`);

  skills.forEach((skillRelPath, idx) => {
    const meta = getSkillMeta(skillRelPath);
    const globalStatus = getSkillStatus(skillRelPath, globalBase);
    const localStatus = getSkillStatus(skillRelPath, localBase);

    let statusTag = `${COLORS.gray}[Not Installed]${COLORS.reset}`;
    if (globalStatus.installed && localStatus.installed) {
      const gBadge = globalStatus.status === 'update-available' ? `${COLORS.yellow}Global: Update Available 🔄${COLORS.reset}` : `${COLORS.green}Global: Up to date ✔${COLORS.reset}`;
      const lBadge = localStatus.status === 'update-available' ? `${COLORS.yellow}Local: Update Available 🔄${COLORS.reset}` : `${COLORS.purple}Local: Up to date ✔${COLORS.reset}`;
      statusTag = `[${gBadge} | ${lBadge}]`;
    } else if (globalStatus.installed) {
      statusTag = globalStatus.status === 'update-available'
        ? `${COLORS.yellow}[Global: Update Available 🔄]${COLORS.reset}`
        : `${COLORS.cyan}[Global: Up to date ✔]${COLORS.reset}`;
    } else if (localStatus.installed) {
      statusTag = localStatus.status === 'update-available'
        ? `${COLORS.yellow}[Local: Update Available 🔄]${COLORS.reset}`
        : `${COLORS.purple}[Local: Up to date ✔]${COLORS.reset}`;
    }

    const catBadge = meta.category ? `${COLORS.yellow}[${meta.category}]${COLORS.reset} ` : '';
    console.log(`  ${COLORS.bright}${idx + 1}. ${meta.name}${COLORS.reset} ${catBadge}${statusTag}`);
    console.log(`     ${COLORS.gray}Path: ${skillRelPath}${COLORS.reset}`);
    if (meta.description) {
      console.log(`     ${COLORS.gray}${meta.description}${COLORS.reset}`);
    }
  });

  console.log(`\n${COLORS.gray}Total: ${skills.length} skills in catalog.${COLORS.reset}`);
  console.log(`Tips:`);
  console.log(`  - Run ${COLORS.cyan}skills-catalog update --local${COLORS.reset} to update all skills in local project`);
  console.log(`  - Run ${COLORS.cyan}skills-catalog update --remote${COLORS.reset} to pull directly from GitHub`);
  console.log(`  - Launch Web GUI via ${COLORS.cyan}skills-catalog ui${COLORS.reset}\n`);
}

function handleStatus(args) {
  const isGlobal = args.includes('--global') || args.includes('-g');
  const targetType = isGlobal ? 'global' : 'local';
  const targetBaseDir = isGlobal ? getGlobalSkillsDir() : getLocalSkillsDir();
  const targetLabel = isGlobal ? `Global (~/.gemini/config/skills/)` : `Local Workspace (.agents/skills/)`;

  const skills = getAvailableSkills();
  console.log(`\n${COLORS.bright}=== 🔍 Antigravity Skills Status Check ===${COLORS.reset}`);
  console.log(`Target Destination: ${COLORS.cyan}${targetLabel}${COLORS.reset}\n`);

  let upToDateCount = 0;
  let updateAvailableCount = 0;
  let notInstalledCount = 0;

  skills.forEach((skillRelPath, idx) => {
    const meta = getSkillMeta(skillRelPath);
    const status = getSkillStatus(skillRelPath, targetBaseDir);

    let statusBadge = '';
    if (status.status === 'up-to-date') {
      statusBadge = `${COLORS.green}[✔ Up to Date]${COLORS.reset}`;
      upToDateCount++;
    } else if (status.status === 'update-available') {
      statusBadge = `${COLORS.yellow}[🔄 Update Available]${COLORS.reset}`;
      updateAvailableCount++;
    } else {
      statusBadge = `${COLORS.gray}[⚪ Not Installed]${COLORS.reset}`;
      notInstalledCount++;
    }

    console.log(`  ${COLORS.bright}${meta.name}${COLORS.reset} ${statusBadge}`);
    console.log(`     ${COLORS.gray}Path: ${skillRelPath}${status.dest ? ` (at ${status.dest})` : ''}${COLORS.reset}`);
  });

  // Check for skills existing in targetBaseDir that are NOT in catalog
  const targetFoundSkills = fs.existsSync(targetBaseDir) ? findSkillsRecursive(targetBaseDir) : [];
  const targetOnlySkills = targetFoundSkills.filter(s => {
    const match = skills.find(cat => cat === s || cat.endsWith('/' + s) || path.basename(cat) === s);
    return !match;
  });

  if (targetOnlySkills.length > 0) {
    console.log(`\n${COLORS.bright}✨ New Skills in Target (Not yet in Catalog):${COLORS.reset}`);
    targetOnlySkills.forEach(s => {
      const meta = getSkillMeta(s, targetBaseDir);
      console.log(`  ${COLORS.purple}[➕ Target Only]${COLORS.reset} ${COLORS.bright}${meta.name}${COLORS.reset} (${s})`);
    });
    console.log(`💡 Run ${COLORS.cyan}skills-catalog sync-${isGlobal ? 'from-global' : 'from-local'}${COLORS.reset} to import these new skills into the catalog repository.`);
  }

  console.log(`\n${COLORS.bright}Summary:${COLORS.reset}`);
  console.log(`  - Up to Date: ${COLORS.green}${upToDateCount}${COLORS.reset}`);
  console.log(`  - Updates Available: ${updateAvailableCount > 0 ? `${COLORS.yellow}${updateAvailableCount}${COLORS.reset}` : '0'}`);
  console.log(`  - Not Installed: ${COLORS.gray}${notInstalledCount}${COLORS.reset}`);
  if (targetOnlySkills.length > 0) {
    console.log(`  - Target Only (New): ${COLORS.purple}${targetOnlySkills.length}${COLORS.reset}`);
  }
  console.log('');

  if (updateAvailableCount > 0) {
    console.log(`💡 Run ${COLORS.cyan}skills-catalog update ${isGlobal ? '--global' : '--local'}${COLORS.reset} to apply updates.\n`);
  }
}

function handleSearch(query) {
  if (!query) {
    console.log(`${COLORS.yellow}Please provide a search keyword. Example: skills-catalog search knit${COLORS.reset}\n`);
    return;
  }

  const q = query.toLowerCase();
  const skills = getAvailableSkills();
  const matches = skills.filter(relPath => {
    const meta = getSkillMeta(relPath);
    return meta.name.toLowerCase().includes(q) ||
           meta.description.toLowerCase().includes(q) ||
           meta.category.toLowerCase().includes(q) ||
           relPath.toLowerCase().includes(q);
  });

  console.log(`\n${COLORS.bright}=== 🔍 Search Results for "${query}" ===${COLORS.reset}\n`);
  if (matches.length === 0) {
    console.log(`  ${COLORS.gray}No matching skills found.${COLORS.reset}\n`);
    return;
  }

  matches.forEach((skillRelPath, idx) => {
    const meta = getSkillMeta(skillRelPath);
    console.log(`  ${COLORS.bright}${idx + 1}. ${meta.name}${COLORS.reset} ${COLORS.yellow}[${meta.category}]${COLORS.reset}`);
    console.log(`     ${COLORS.gray}Path: ${skillRelPath}${COLORS.reset}`);
    if (meta.description) {
      console.log(`     ${COLORS.gray}${meta.description}${COLORS.reset}`);
    }
  });
  console.log(`\n${COLORS.gray}Found ${matches.length} matching skill(s).${COLORS.reset}\n`);
}

function executeInstall(selectedSkills, targetType, isUpdate = false) {
  const sourceDir = getSourceSkillsDir();
  const targetBaseDir = targetType === 'global' ? getGlobalSkillsDir() : getLocalSkillsDir();
  const targetLabel = targetType === 'global' ? `Global (${targetBaseDir})` : `Local Workspace (${targetBaseDir})`;

  const actionTitle = isUpdate ? 'Updating Skills' : 'Installing Selected Skills';
  console.log(`\n${COLORS.bright}=== ${actionTitle} ===${COLORS.reset}`);
  console.log(`Target: ${COLORS.cyan}${targetLabel}${COLORS.reset}\n`);

  let count = 0;
  for (const skill of selectedSkills) {
    const src = path.join(sourceDir, skill);
    const dest = path.join(targetBaseDir, skill);

    if (fs.existsSync(src)) {
      if (fs.existsSync(dest)) {
        fs.rmSync(dest, { recursive: true, force: true });
      }
      copyFolderRecursiveSync(src, dest);
      const tag = isUpdate ? `${COLORS.yellow}[✔ UPDATED]` : `${COLORS.green}[✔ INSTALLED]`;
      console.log(`  ${tag}${COLORS.reset} ${skill} ➔ ${COLORS.gray}${dest}${COLORS.reset}`);
      count++;
    } else {
      console.log(`  ${COLORS.red}[✖ NOT FOUND]${COLORS.reset} ${skill}`);
    }
  }

  console.log(`\n${COLORS.bright}${COLORS.green}Success!${COLORS.reset} ${count} skill(s) ${isUpdate ? 'updated' : 'installed'}.\n`);
}

async function executeRemoteUpdate(selectedSkills, targetType) {
  const targetBaseDir = targetType === 'global' ? getGlobalSkillsDir() : getLocalSkillsDir();
  const targetLabel = targetType === 'global' ? `Global (${targetBaseDir})` : `Local Workspace (${targetBaseDir})`;

  console.log(`\n${COLORS.bright}=== ☁️ Fetching & Updating Skills from GitHub Cloud ===${COLORS.reset}`);
  console.log(`Repository: ${COLORS.cyan}https://github.com/${GITHUB_REPO}${COLORS.reset}`);
  console.log(`Target: ${COLORS.cyan}${targetLabel}${COLORS.reset}\n`);

  let count = 0;
  for (const skill of selectedSkills) {
    const targetDir = path.join(targetBaseDir, skill);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    try {
      // Download SKILL.md directly from GitHub raw
      const skillMdUrl = `${GITHUB_RAW_BASE}.agents/skills/${skill}/SKILL.md`;
      const skillMdContent = await fetchHttps(skillMdUrl);
      fs.writeFileSync(path.join(targetDir, 'SKILL.md'), skillMdContent, 'utf8');

      // Optionally fetch README.md
      try {
        const readmeUrl = `${GITHUB_RAW_BASE}.agents/skills/${skill}/README.md`;
        const readmeContent = await fetchHttps(readmeUrl);
        fs.writeFileSync(path.join(targetDir, 'README.md'), readmeContent, 'utf8');
      } catch (e) {
        // README is optional
      }

      console.log(`  ${COLORS.green}[✔ CLOUD UPDATED]${COLORS.reset} ${skill} ➔ ${COLORS.gray}${targetDir}${COLORS.reset}`);
      count++;
    } catch (err) {
      console.log(`  ${COLORS.red}[✖ CLOUD ERROR]${COLORS.reset} ${skill} (${err.message})`);
    }
  }

  console.log(`\n${COLORS.bright}${COLORS.green}Cloud Update Complete!${COLORS.reset} ${count} skill(s) updated directly from GitHub.\n`);
}

async function handleUpdate(args) {
  const skills = getAvailableSkills();
  const isGlobal = args.includes('--global') || args.includes('-g');
  const isRemote = args.includes('--remote') || args.includes('-r') || args.includes('--cloud');
  const targetType = isGlobal ? 'global' : 'local';
  const targetBaseDir = isGlobal ? getGlobalSkillsDir() : getLocalSkillsDir();

  const specifiedSkills = args.filter(a => !a.startsWith('-') && a !== 'update' && a !== 'pull' && a !== 'fetch');

  let toUpdate = [];

  if (specifiedSkills.length > 0) {
    toUpdate = specifiedSkills.filter(s => skills.includes(s) || skills.some(rel => rel.endsWith('/' + s) || getSkillMeta(rel).name === s));
    toUpdate = toUpdate.map(name => {
      const match = skills.find(rel => rel === name || rel.endsWith('/' + name) || getSkillMeta(rel).name === name);
      return match || name;
    });
  } else {
    // Auto-detect which skills are currently installed in target
    toUpdate = skills.filter(skillRelPath => {
      const status = getSkillStatus(skillRelPath, targetBaseDir);
      return status.installed;
    });
  }

  if (toUpdate.length === 0) {
    console.log(`\n${COLORS.yellow}No installed skills found in ${isGlobal ? 'Global' : 'Local Workspace'} to update.${COLORS.reset}`);
    console.log(`To install all skills, run: ${COLORS.cyan}skills-catalog install --all ${isGlobal ? '--global' : '--local'}${COLORS.reset}\n`);
    return;
  }

  if (isRemote) {
    await executeRemoteUpdate(toUpdate, targetType);
  } else {
    executeInstall(toUpdate, targetType, true);
  }
}

function handleSync(args, direction = 'from-global') {
  const sourceSkillsDir = getSourceSkillsDir();

  let customFrom = null;
  const fromIdx = args.indexOf('--from') !== -1 ? args.indexOf('--from') : args.indexOf('--path');
  if (fromIdx !== -1 && args[fromIdx + 1]) {
    customFrom = path.resolve(args[fromIdx + 1]);
  }

  const isFromGlobal = !customFrom && (direction === 'from-global' || args.includes('--global') || args.includes('-g'));
  
  let targetBaseDir;
  let label;

  if (customFrom) {
    if (fs.existsSync(path.join(customFrom, '.agents', 'skills'))) {
      targetBaseDir = path.join(customFrom, '.agents', 'skills');
    } else {
      targetBaseDir = customFrom;
    }
    label = `Project Workspace (${targetBaseDir})`;
  } else if (isFromGlobal) {
    targetBaseDir = getGlobalSkillsDir();
    label = `Global (~/.gemini/config/skills/)`;
  } else {
    targetBaseDir = getLocalSkillsDir();
    label = `Current Workspace (${targetBaseDir})`;
  }

  console.log(`\n${COLORS.bright}=== 🔄 Syncing Revisions & Skills Back to Catalog ===${COLORS.reset}`);
  console.log(`Source: ${COLORS.cyan}${label}${COLORS.reset}`);
  console.log(`Destination Catalog: ${COLORS.cyan}${sourceSkillsDir}${COLORS.reset}\n`);

  if (!fs.existsSync(targetBaseDir)) {
    console.log(`${COLORS.red}Source directory not found:${COLORS.reset} ${targetBaseDir}`);
    console.log(`Tip: Pass project path via: ${COLORS.cyan}skills-catalog sync-from-local --from "D:\\path\\to\\project"${COLORS.reset}\n`);
    return;
  }

  const flagsToIgnore = new Set(['sync', 'sync-from-global', 'sync-from-local', 'sync-from-project', '--global', '-g', '--local', '-l', '--from', '--path']);
  const specifiedSkills = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--from' || args[i] === '--path') {
      i++;
      continue;
    }
    if (!flagsToIgnore.has(args[i]) && !args[i].startsWith('-')) {
      specifiedSkills.push(args[i]);
    }
  }

  const sourceFoundSkills = findSkillsRecursive(targetBaseDir);
  const catalogSkills = getAvailableSkills();

  const itemsToSync = [];

  if (specifiedSkills.length > 0) {
    for (const spec of specifiedSkills) {
      // 1. Try finding in sourceFoundSkills
      const matchInSource = sourceFoundSkills.find(s => s === spec || s.endsWith('/' + spec) || path.basename(s) === spec || getSkillMeta(s, targetBaseDir).name === spec);
      if (matchInSource) {
        itemsToSync.push({ relPath: matchInSource, sourcePath: path.join(targetBaseDir, matchInSource) });
      } else {
        // 2. Check direct path in targetBaseDir
        const directPath = path.join(targetBaseDir, spec);
        if (fs.existsSync(path.join(directPath, 'SKILL.md'))) {
          itemsToSync.push({ relPath: spec, sourcePath: directPath });
        } else {
          // 3. Check catalog match
          const matchInCatalog = catalogSkills.find(s => s === spec || s.endsWith('/' + spec) || getSkillMeta(s).name === spec);
          if (matchInCatalog) {
            const src1 = path.join(targetBaseDir, matchInCatalog);
            const src2 = path.join(targetBaseDir, path.basename(matchInCatalog));
            if (fs.existsSync(src1)) itemsToSync.push({ relPath: matchInCatalog, sourcePath: src1 });
            else if (fs.existsSync(src2)) itemsToSync.push({ relPath: matchInCatalog, sourcePath: src2 });
            else console.log(`  ${COLORS.yellow}[!] Skill '${spec}' not found in source:${COLORS.reset} ${targetBaseDir}`);
          } else {
            console.log(`  ${COLORS.yellow}[!] Skill '${spec}' not found in source:${COLORS.reset} ${targetBaseDir}`);
          }
        }
      }
    }
  } else {
    // Sync all found skills in source targetBaseDir
    for (const s of sourceFoundSkills) {
      itemsToSync.push({ relPath: s, sourcePath: path.join(targetBaseDir, s) });
    }
  }

  if (itemsToSync.length === 0) {
    console.log(`  ${COLORS.yellow}No skills found in ${targetBaseDir} to sync.${COLORS.reset}\n`);
    return;
  }

  let syncedCount = 0;
  let addedCount = 0;
  let updatedCount = 0;
  let upToDateCount = 0;

  for (const item of itemsToSync) {
    const meta = getSkillMeta(item.relPath, targetBaseDir);
    
    // Determine standard catalog destination relative path
    let destRelPath = item.relPath;
    const destCatalogPath = path.join(sourceSkillsDir, destRelPath);
    const isNew = !fs.existsSync(destCatalogPath);

    const srcHash = getFolderHash(item.sourcePath);
    const destHash = isNew ? null : getFolderHash(destCatalogPath);

    if (!isNew && srcHash && destHash && srcHash === destHash) {
      console.log(`  ${COLORS.gray}[✔ UP-TO-DATE]${COLORS.reset} ${destRelPath}`);
      upToDateCount++;
      syncedCount++;
      continue;
    }

    if (fs.existsSync(destCatalogPath)) {
      fs.rmSync(destCatalogPath, { recursive: true, force: true });
    }
    copyFolderRecursiveSync(item.sourcePath, destCatalogPath);

    if (isNew) {
      console.log(`  ${COLORS.bright}${COLORS.green}[✨ NEW ADDED]${COLORS.reset} ${destRelPath} ➔ ${COLORS.gray}${destCatalogPath}${COLORS.reset}`);
      addedCount++;
    } else {
      console.log(`  ${COLORS.green}[✔ UPDATED]${COLORS.reset} ${destRelPath} ➔ ${COLORS.gray}${destCatalogPath}${COLORS.reset}`);
      updatedCount++;
    }
    syncedCount++;
  }

  console.log(`\n${COLORS.bright}${COLORS.green}Sync Complete!${COLORS.reset} ${syncedCount} skill(s) processed (${addedCount} newly added, ${updatedCount} updated, ${upToDateCount} up-to-date).`);
  console.log(`💡 Next step: Review changes with ${COLORS.cyan}git status${COLORS.reset} and commit with ${COLORS.cyan}git commit${COLORS.reset}\n`);
}

function promptInteractiveInstall() {
  const skills = getAvailableSkills();
  if (skills.length === 0) {
    console.log(`${COLORS.yellow}No skills found in catalog.${COLORS.reset}`);
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(`\n${COLORS.bright}=== Interactive Skill Selector ===${COLORS.reset}`);
  console.log(`Select the skills you wish to install:\n`);
  console.log(`  ${COLORS.cyan}0) [ALL SKILLS] (Install all ${skills.length} skills)${COLORS.reset}`);
  skills.forEach((skill, idx) => {
    const meta = getSkillMeta(skill);
    console.log(`  ${COLORS.bright}${idx + 1})${COLORS.reset} ${meta.name} ${COLORS.gray}(${skill})${COLORS.reset}`);
  });

  rl.question(`\nEnter numbers separated by commas (e.g. 1, 3, 4) or 0 for all: `, (answer) => {
    const trimmed = answer.trim();
    let selected = [];

    if (trimmed === '0' || trimmed.toLowerCase() === 'all') {
      selected = skills;
    } else {
      const parts = trimmed.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
      parts.forEach(num => {
        if (num >= 1 && num <= skills.length) {
          selected.push(skills[num - 1]);
        }
      });
    }

    if (selected.length === 0) {
      console.log(`${COLORS.yellow}No valid skills selected. Aborting.${COLORS.reset}\n`);
      rl.close();
      return;
    }

    console.log(`\nWhere would you like to install the selected skills?`);
    console.log(`  1) (Recommended) Global Antigravity Config (~/.gemini/config/skills/)`);
    console.log(`  2) Local Project Workspace (.agents/skills/ in current folder)`);

    rl.question(`\nSelect target destination (1 or 2): `, (targetAns) => {
      const isLocal = targetAns.trim() === '2';
      executeInstall(selected, isLocal ? 'local' : 'global');
      rl.close();
    });
  });
}

function handleInstall(args) {
  const skills = getAvailableSkills();
  const isGlobal = args.includes('--global') || args.includes('-g');
  const isLocal = args.includes('--local') || args.includes('-l');
  const isAll = args.includes('--all');

  const specifiedSkills = args.filter(a => !a.startsWith('-') && a !== 'install');

  if (specifiedSkills.length > 0) {
    const matched = [];
    for (const name of specifiedSkills) {
      const match = skills.find(s => s === name || s.endsWith('/' + name) || getSkillMeta(s).name === name);
      if (match) matched.push(match);
    }

    if (matched.length === 0) {
      console.log(`${COLORS.red}None of the specified skills were found.${COLORS.reset}`);
      return;
    }
    executeInstall(matched, isLocal ? 'local' : 'global');
  } else if (isAll) {
    executeInstall(skills, isLocal ? 'local' : 'global');
  } else {
    promptInteractiveInstall();
  }
}

function handleUninstall(args) {
  const skills = getAvailableSkills();
  const isGlobal = args.includes('--global') || args.includes('-g');
  const isLocal = args.includes('--local') || args.includes('-l');
  const targetBaseDir = isLocal ? getLocalSkillsDir() : getGlobalSkillsDir();

  const specifiedSkills = args.filter(a => !a.startsWith('-') && a !== 'uninstall');
  const targets = specifiedSkills.length > 0 ? specifiedSkills : skills;

  console.log(`\n${COLORS.bright}=== Uninstalling Skills ===${COLORS.reset}`);
  console.log(`Target: ${COLORS.cyan}${targetBaseDir}${COLORS.reset}\n`);

  for (const skill of targets) {
    const match = skills.find(s => s === skill || s.endsWith('/' + skill) || getSkillMeta(s).name === skill);
    const relPath = match || skill;

    const destNested = path.join(targetBaseDir, relPath);
    const destFlat = path.join(targetBaseDir, path.basename(relPath));

    let removed = false;
    if (fs.existsSync(destNested)) {
      fs.rmSync(destNested, { recursive: true, force: true });
      removed = true;
    }
    if (fs.existsSync(destFlat)) {
      fs.rmSync(destFlat, { recursive: true, force: true });
      removed = true;
    }

    if (removed) {
      console.log(`  ${COLORS.red}[✔ REMOVED]${COLORS.reset} ${relPath}`);
    }
  }

  console.log(`\n${COLORS.green}Uninstall complete.${COLORS.reset}\n`);
}

function handleUI() {
  const server = require('../web/server.js');
  server.start();
}

function printHelp() {
  console.log(`
${COLORS.bright}🪐 Antigravity Universal Skills Catalog CLI${COLORS.reset}

${COLORS.bright}Usage:${COLORS.reset}
  skills-catalog <command> [options]

${COLORS.bright}Web GUI Dashboard:${COLORS.reset}
  ${COLORS.cyan}ui / web / dashboard${COLORS.reset}             Launch the Web GUI Dashboard in browser

${COLORS.bright}Cloud Updates (Zero-Clone):${COLORS.reset}
  ${COLORS.cyan}update --remote [--local|-g]${COLORS.reset}     Pull & update skills directly from GitHub Cloud
  ${COLORS.cyan}pull [--global | --local]${COLORS.reset}        Alias for cloud update from GitHub

${COLORS.bright}Status & Search:${COLORS.reset}
  ${COLORS.cyan}list${COLORS.reset}                             List all skills and installation status
  ${COLORS.cyan}status [--global | --local]${COLORS.reset}      Detailed status & revision check for installed skills
  ${COLORS.cyan}search <keyword>${COLORS.reset}                 Search skills by name, category, or description

${COLORS.bright}Installation & Local Updates:${COLORS.reset}
  ${COLORS.cyan}install${COLORS.reset}                          Interactive multi-skill selector & installer
  ${COLORS.cyan}install [skill...] [--global|-g]${COLORS.reset}   Install specific skill(s) directly to Global
  ${COLORS.cyan}install [skill...] [--local|-l]${COLORS.reset}    Install specific skill(s) directly to Local Workspace
  ${COLORS.cyan}install --all [--global|--local]${COLORS.reset}   Install all available skills at once
  ${COLORS.cyan}update [--global | --local]${COLORS.reset}        Update all installed skills to latest catalog revisions
  ${COLORS.cyan}update [skill...] [--global|-l]${COLORS.reset}    Update specific skill(s) to latest revisions

${COLORS.bright}Synchronization (Reverse Sync):${COLORS.reset}
  ${COLORS.cyan}sync-from-global [skill...]${COLORS.reset}      Sync edits made in Global back to Catalog repository
  ${COLORS.cyan}sync-from-local [--from <path>]${COLORS.reset}  Sync edits made in any Project Workspace back to Catalog

${COLORS.bright}Management:${COLORS.reset}
  ${COLORS.cyan}uninstall [skill...]${COLORS.reset}              Remove skills from Global or Local
  ${COLORS.cyan}help${COLORS.reset}                             Display this help manual
`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'ui';

  switch (command) {
    case 'ui':
    case 'web':
    case 'dashboard':
    case 'gui':
      handleUI();
      break;
    case 'list':
      handleList();
      break;
    case 'status':
    case 'diff':
    case 'check':
      handleStatus(args.slice(1));
      break;
    case 'search':
    case 'find':
      handleSearch(args.slice(1).join(' '));
      break;
    case 'update':
    case 'upgrade':
      await handleUpdate(args.slice(1));
      break;
    case 'pull':
    case 'fetch':
      await handleUpdate(['--remote', ...args.slice(1)]);
      break;
    case 'sync':
    case 'sync-from-global':
      handleSync(args.slice(1), 'from-global');
      break;
    case 'sync-from-local':
    case 'sync-from-project':
      handleSync(args.slice(1), 'from-local');
      break;
    case 'install':
      handleInstall(args.slice(1));
      break;
    case 'uninstall':
    case 'remove':
      handleUninstall(args.slice(1));
      break;
    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;
    default:
      if (getAvailableSkills().includes(command) || getAvailableSkills().some(s => s.endsWith('/' + command))) {
        handleInstall(args);
      } else {
        console.log(`${COLORS.red}Unknown command: ${command}${COLORS.reset}`);
        printHelp();
      }
  }
}

main();
