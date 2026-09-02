#!/usr/bin/env node

/**
 * Antigravity Skills Catalog - Local Web GUI Server
 * Zero-dependency native Node.js HTTP server.
 * With Smart Update, Status Diff, Reverse Sync, and GitHub Cloud Sync APIs.
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { exec } = require('child_process');

const DEFAULT_PORT = 3700;
const PUBLIC_DIR = path.join(__dirname, 'public');
const ROOT_DIR = path.join(__dirname, '..');
const SOURCE_SKILLS_DIR = path.join(ROOT_DIR, '.agents', 'skills');

const GITHUB_REPO = 'unknown1777101/skills-catalog';
const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/`;

function getGlobalSkillsDir() {
  return path.join(os.homedir(), '.gemini', 'config', 'skills');
}

function getLocalSkillsDir(cwd) {
  return path.join(cwd || process.cwd(), '.agents', 'skills');
}

function fetchHttps(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'antigravity-skills-catalog-server',
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

function getAvailableSkills(localCwd) {
  if (!fs.existsSync(SOURCE_SKILLS_DIR)) return [];

  const catalogSkillRelPaths = findSkillsRecursive(SOURCE_SKILLS_DIR);
  const globalBase = getGlobalSkillsDir();
  const localBase = getLocalSkillsDir(localCwd);

  const globalSkillRelPaths = fs.existsSync(globalBase) ? findSkillsRecursive(globalBase) : [];
  const localSkillRelPaths = fs.existsSync(localBase) ? findSkillsRecursive(localBase) : [];

  const allRelPathsMap = new Map();

  for (const relPath of catalogSkillRelPaths) {
    allRelPathsMap.set(relPath, { inCatalog: true, relPath, basePath: SOURCE_SKILLS_DIR });
  }

  for (const relPath of globalSkillRelPaths) {
    if (!allRelPathsMap.has(relPath)) {
      allRelPathsMap.set(relPath, { inCatalog: false, relPath, basePath: globalBase, source: 'global' });
    }
  }

  for (const relPath of localSkillRelPaths) {
    if (!allRelPathsMap.has(relPath)) {
      allRelPathsMap.set(relPath, { inCatalog: false, relPath, basePath: localBase, source: 'local' });
    }
  }

  return Array.from(allRelPathsMap.values()).map(item => {
    const { relPath, inCatalog, basePath } = item;
    const skillPath = path.join(basePath, relPath);
    const skillMdPath = path.join(skillPath, 'SKILL.md');
    let name = path.basename(relPath);
    let description = '';
    let category = '';

    if (fs.existsSync(skillMdPath)) {
      const content = fs.readFileSync(skillMdPath, 'utf8');

      // 1. Extract name
      const nameMatch = content.match(/^name:\s*([^\n\r]+)/m);
      if (nameMatch) {
        name = nameMatch[1].trim().replace(/^['"]|['"]$/g, '');
      }
      
      // 2. Check explicit YAML frontmatter 'category: ...'
      const catMatch = content.match(/^category:\s*([^\n\r]+)/m);
      if (catMatch) {
        category = catMatch[1].trim().replace(/^['"]|['"]$/g, '');
      }

      // 3. Extract description
      const descMatch = content.match(/^description:\s*([^\n\r]+)/m);
      if (descMatch) {
        description = descMatch[1].trim();
      }
    }

    // 4. Fallback: Auto-infer category from parent folder or name prefix
    if (!category) {
      if (relPath.includes('/')) {
        const topFolder = relPath.split('/')[0];
        category = topFolder.charAt(0).toUpperCase() + topFolder.slice(1);
      } else if (name.startsWith('roblox-')) category = 'Roblox';
      else if (name.startsWith('unity-')) category = 'Unity';
      else if (name.startsWith('git-')) category = 'Git';
      else if (name.startsWith('dev-tool')) category = 'Dev Tools';
      else {
        const parts = name.split('-');
        category = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      }
    }

    // Status check for Global
    const globalDestNested = path.join(globalBase, relPath);
    const globalDestFlat = path.join(globalBase, name);
    let globalActualDest = null;
    if (fs.existsSync(globalDestNested)) globalActualDest = globalDestNested;
    else if (fs.existsSync(globalDestFlat)) globalActualDest = globalDestFlat;

    const isInstalledGlobal = !!globalActualDest;
    let globalStatus = 'not-installed';
    if (isInstalledGlobal) {
      if (!inCatalog) {
        globalStatus = 'not-in-catalog';
      } else {
        const srcHash = getFolderHash(path.join(SOURCE_SKILLS_DIR, relPath));
        const destHash = getFolderHash(globalActualDest);
        globalStatus = (srcHash && destHash && srcHash === destHash) ? 'up-to-date' : 'update-available';
      }
    }

    // Status check for Local
    const localDestNested = path.join(localBase, relPath);
    const localDestFlat = path.join(localBase, name);
    let localActualDest = null;
    if (fs.existsSync(localDestNested)) localActualDest = localDestNested;
    else if (fs.existsSync(localDestFlat)) localActualDest = localDestFlat;

    const isInstalledLocal = !!localActualDest;
    let localStatus = 'not-installed';
    if (isInstalledLocal) {
      if (!inCatalog) {
        localStatus = 'not-in-catalog';
      } else {
        const srcHash = getFolderHash(path.join(SOURCE_SKILLS_DIR, relPath));
        const destHash = getFolderHash(localActualDest);
        localStatus = (srcHash && destHash && srcHash === destHash) ? 'up-to-date' : 'update-available';
      }
    }

    return {
      name,
      path: relPath,
      category,
      description,
      inCatalog,
      installed: {
        global: isInstalledGlobal,
        local: isInstalledLocal,
      },
      status: {
        global: globalStatus,
        local: localStatus,
      },
    };
  });
}

function getSkillDetail(skillKey, targetType = 'global', localCwd) {
  const allSkills = getAvailableSkills(localCwd);
  const found = allSkills.find(s => s.name === skillKey || s.path === skillKey || s.path.endsWith('/' + skillKey));
  
  const skillRelPath = found ? found.path : skillKey;
  const globalBase = getGlobalSkillsDir();
  const localBase = getLocalSkillsDir(localCwd);

  let skillPath = path.join(SOURCE_SKILLS_DIR, skillRelPath);
  if (!fs.existsSync(skillPath)) {
    const globalPath = path.join(globalBase, skillRelPath);
    const localPath = path.join(localBase, skillRelPath);
    if (fs.existsSync(globalPath)) skillPath = globalPath;
    else if (fs.existsSync(localPath)) skillPath = localPath;
    else return null;
  }

  let skillMd = '';
  let readmeMd = '';
  let installedSkillMd = null;

  const skillMdPath = path.join(skillPath, 'SKILL.md');
  const readmeMdPath = path.join(skillPath, 'README.md');

  if (fs.existsSync(skillMdPath)) skillMd = fs.readFileSync(skillMdPath, 'utf8');
  if (fs.existsSync(readmeMdPath)) readmeMd = fs.readFileSync(readmeMdPath, 'utf8');

  // Check installed content for diffing
  const targetBaseDir = targetType === 'local' ? getLocalSkillsDir(localCwd) : getGlobalSkillsDir();
  const destNested = path.join(targetBaseDir, skillRelPath, 'SKILL.md');
  const destFlat = path.join(targetBaseDir, found ? found.name : path.basename(skillRelPath), 'SKILL.md');

  if (fs.existsSync(destNested)) {
    installedSkillMd = fs.readFileSync(destNested, 'utf8');
  } else if (fs.existsSync(destFlat)) {
    installedSkillMd = fs.readFileSync(destFlat, 'utf8');
  }

  return {
    name: found ? found.name : path.basename(skillRelPath),
    path: skillRelPath,
    category: found ? found.category : 'General',
    description: found ? found.description : '',
    inCatalog: found ? found.inCatalog : true,
    status: found ? found.status : { global: 'not-installed', local: 'not-installed' },
    installed: found ? found.installed : { global: false, local: false },
    skillMd,
    readmeMd,
    installedSkillMd,
  };
}

function installSkills(skillKeys, targetType, customPath, isUpdate = false) {
  let targetBaseDir;
  if (targetType === 'global') {
    targetBaseDir = getGlobalSkillsDir();
  } else if (targetType === 'local') {
    targetBaseDir = getLocalSkillsDir();
  } else if (customPath) {
    targetBaseDir = customPath;
  } else {
    targetBaseDir = getGlobalSkillsDir();
  }

  const allSkills = getAvailableSkills();
  const results = [];

  const targets = (skillKeys && skillKeys.length > 0) ? skillKeys : allSkills.map(s => s.name);

  for (const key of targets) {
    const found = allSkills.find(s => s.name === key || s.path === key || s.path.endsWith('/' + key));
    const relPath = found ? found.path : key;
    const src = path.join(SOURCE_SKILLS_DIR, relPath);
    const dest = path.join(targetBaseDir, relPath);

    if (fs.existsSync(src)) {
      if (fs.existsSync(dest)) {
        fs.rmSync(dest, { recursive: true, force: true });
      }
      copyFolderRecursiveSync(src, dest);
      results.push({ name: found ? found.name : key, path: relPath, status: isUpdate ? 'updated' : 'success', destPath: dest });
    } else {
      results.push({ name: key, status: 'not_found' });
    }
  }

  return { success: true, targetPath: targetBaseDir, results, isUpdate };
}

async function downloadSkillsFromGitHub(skillKeys, targetType, customPath) {
  let targetBaseDir;
  if (targetType === 'global') {
    targetBaseDir = getGlobalSkillsDir();
  } else if (targetType === 'local') {
    targetBaseDir = getLocalSkillsDir();
  } else if (customPath) {
    targetBaseDir = customPath;
  } else {
    targetBaseDir = getGlobalSkillsDir();
  }

  const allSkills = getAvailableSkills();
  const results = [];
  const targets = (skillKeys && skillKeys.length > 0) ? skillKeys : allSkills.map(s => s.name);

  for (const key of targets) {
    const found = allSkills.find(s => s.name === key || s.path === key || s.path.endsWith('/' + key));
    const relPath = found ? found.path : key;
    const targetDir = path.join(targetBaseDir, relPath);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    try {
      const skillMdUrl = `${GITHUB_RAW_BASE}.agents/skills/${relPath}/SKILL.md`;
      const skillMdContent = await fetchHttps(skillMdUrl);
      fs.writeFileSync(path.join(targetDir, 'SKILL.md'), skillMdContent, 'utf8');

      try {
        const readmeUrl = `${GITHUB_RAW_BASE}.agents/skills/${relPath}/README.md`;
        const readmeContent = await fetchHttps(readmeUrl);
        fs.writeFileSync(path.join(targetDir, 'README.md'), readmeContent, 'utf8');
      } catch (e) {}

      results.push({ name: found ? found.name : key, path: relPath, status: 'cloud_updated', destPath: targetDir });
    } catch (err) {
      results.push({ name: key, status: 'error', error: err.message });
    }
  }

  return { success: true, targetPath: targetBaseDir, results, cloud: true };
}

function syncSkillsToCatalog(skillKeys, sourceTargetType, customPath) {
  let sourceBaseDir;
  if (customPath) {
    if (fs.existsSync(path.join(customPath, '.agents', 'skills'))) {
      sourceBaseDir = path.join(customPath, '.agents', 'skills');
    } else {
      sourceBaseDir = customPath;
    }
  } else if (sourceTargetType === 'local') {
    sourceBaseDir = getLocalSkillsDir();
  } else {
    sourceBaseDir = getGlobalSkillsDir();
  }

  if (!fs.existsSync(sourceBaseDir)) {
    return { success: false, error: `Source directory not found: ${sourceBaseDir}` };
  }

  const sourceFoundSkills = findSkillsRecursive(sourceBaseDir);
  const catalogSkills = getAvailableSkills();
  const results = [];
  let addedCount = 0;
  let updatedCount = 0;

  const itemsToSync = [];

  if (skillKeys && skillKeys.length > 0) {
    for (const key of skillKeys) {
      const matchInSource = sourceFoundSkills.find(s => s === key || s.endsWith('/' + key) || path.basename(s) === key);
      if (matchInSource) {
        itemsToSync.push({ relPath: matchInSource, sourcePath: path.join(sourceBaseDir, matchInSource) });
      } else {
        const directPath = path.join(sourceBaseDir, key);
        if (fs.existsSync(path.join(directPath, 'SKILL.md'))) {
          itemsToSync.push({ relPath: key, sourcePath: directPath });
        } else {
          const foundInCatalog = catalogSkills.find(s => s.name === key || s.path === key || s.path.endsWith('/' + key));
          if (foundInCatalog) {
            const srcNested = path.join(sourceBaseDir, foundInCatalog.path);
            const srcFlat = path.join(sourceBaseDir, foundInCatalog.name);
            if (fs.existsSync(srcNested)) itemsToSync.push({ relPath: foundInCatalog.path, sourcePath: srcNested });
            else if (fs.existsSync(srcFlat)) itemsToSync.push({ relPath: foundInCatalog.path, sourcePath: srcFlat });
            else results.push({ name: key, status: 'not_found' });
          } else {
            results.push({ name: key, status: 'not_found' });
          }
        }
      }
    }
  } else {
    for (const s of sourceFoundSkills) {
      itemsToSync.push({ relPath: s, sourcePath: path.join(sourceBaseDir, s) });
    }
  }

  for (const item of itemsToSync) {
    let destRelPath = item.relPath;
    const dest = path.join(SOURCE_SKILLS_DIR, destRelPath);
    const isNew = !fs.existsSync(dest);

    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { recursive: true, force: true });
    }
    copyFolderRecursiveSync(item.sourcePath, dest);

    if (isNew) addedCount++;
    else updatedCount++;

    results.push({
      name: path.basename(destRelPath),
      path: destRelPath,
      status: isNew ? 'added' : 'synced',
      isNew,
      destPath: dest
    });
  }

  return { success: true, sourcePath: sourceBaseDir, results, addedCount, updatedCount };
}

function uninstallSkills(skillKeys, targetType, customPath) {
  let targetBaseDir;
  if (targetType === 'global') {
    targetBaseDir = getGlobalSkillsDir();
  } else if (targetType === 'local') {
    targetBaseDir = getLocalSkillsDir();
  } else if (customPath) {
    targetBaseDir = customPath;
  } else {
    targetBaseDir = getGlobalSkillsDir();
  }

  const allSkills = getAvailableSkills();
  const results = [];

  for (const key of skillKeys) {
    const found = allSkills.find(s => s.name === key || s.path === key || s.path.endsWith('/' + key));
    const relPath = found ? found.path : key;
    const destNested = path.join(targetBaseDir, relPath);
    const destFlat = found ? path.join(targetBaseDir, found.name) : destNested;

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
      results.push({ name: found ? found.name : key, status: 'removed' });
    } else {
      results.push({ name: key, status: 'not_installed' });
    }
  }

  return { success: true, targetPath: targetBaseDir, results };
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function serveStatic(req, res, filePath) {
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'text/plain';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

function createServer(port) {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);
    const pathname = url.pathname;

    // CORS Headers for local development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // API Routes
    if (pathname === '/api/skills' && req.method === 'GET') {
      const skills = getAvailableSkills();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        skills,
        paths: {
          global: getGlobalSkillsDir(),
          local: getLocalSkillsDir(),
        }
      }));
      return;
    }

    if (pathname.startsWith('/api/skill/') && req.method === 'GET') {
      const skillName = decodeURIComponent(pathname.replace('/api/skill/', ''));
      const target = url.searchParams.get('target') || 'global';
      const detail = getSkillDetail(skillName, target);
      if (!detail) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Skill not found' }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(detail));
      }
      return;
    }

    if (pathname === '/api/install' && req.method === 'POST') {
      try {
        const body = await parseJsonBody(req);
        const { skills, target, customPath } = body;
        const result = installSkills(skills || [], target || 'global', customPath, false);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    if (pathname === '/api/update' && req.method === 'POST') {
      try {
        const body = await parseJsonBody(req);
        const { skills, target, customPath, remote } = body;
        let result;
        if (remote) {
          result = await downloadSkillsFromGitHub(skills || [], target || 'global', customPath);
        } else {
          result = installSkills(skills || [], target || 'global', customPath, true);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    if (pathname === '/api/remote/update' && req.method === 'POST') {
      try {
        const body = await parseJsonBody(req);
        const { skills, target, customPath } = body;
        const result = await downloadSkillsFromGitHub(skills || [], target || 'global', customPath);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    if (pathname === '/api/sync' && req.method === 'POST') {
      try {
        const body = await parseJsonBody(req);
        const { skills, source, customPath } = body;
        const result = syncSkillsToCatalog(skills || [], source || 'global', customPath);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    if (pathname === '/api/uninstall' && req.method === 'POST') {
      try {
        const body = await parseJsonBody(req);
        const { skills, target, customPath } = body;
        const result = uninstallSkills(skills || [], target || 'global', customPath);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    // Static Frontend Serving
    let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }
    serveStatic(req, res, filePath);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is in use, trying port ${port + 1}...`);
      createServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });

  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`\n======================================================`);
    console.log(`🚀 Antigravity Skills Catalog Web GUI running at:`);
    console.log(`👉 \x1b[36m\x1b[1m${url}\x1b[0m`);
    console.log(`======================================================\n`);

    const startCmd = process.platform === 'win32' ? `start ${url}` :
                     process.platform === 'darwin' ? `open ${url}` : `xdg-open ${url}`;
    exec(startCmd);
  });
}

function start() {
  const port = parseInt(process.env.PORT || DEFAULT_PORT, 10);
  createServer(port);
}

if (require.main === module) {
  start();
}

module.exports = { start, getAvailableSkills, installSkills, syncSkillsToCatalog, uninstallSkills };

