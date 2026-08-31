#!/usr/bin/env node

/**
 * Antigravity Skills Catalog - Local Web GUI Server
 * Zero-dependency native Node.js HTTP server.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

const DEFAULT_PORT = 3700;
const PUBLIC_DIR = path.join(__dirname, 'public');
const ROOT_DIR = path.join(__dirname, '..');
const SOURCE_SKILLS_DIR = path.join(ROOT_DIR, '.agents', 'skills');

function getGlobalSkillsDir() {
  return path.join(os.homedir(), '.gemini', 'config', 'skills');
}

function getLocalSkillsDir(cwd) {
  return path.join(cwd || process.cwd(), '.agents', 'skills');
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

  const skillRelPaths = findSkillsRecursive(SOURCE_SKILLS_DIR);
  const globalBase = getGlobalSkillsDir();
  const localBase = getLocalSkillsDir(localCwd);

  return skillRelPaths.map(relPath => {
    const skillPath = path.join(SOURCE_SKILLS_DIR, relPath);
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

    const isInstalledGlobal = fs.existsSync(path.join(globalBase, relPath)) || fs.existsSync(path.join(globalBase, name));
    const isInstalledLocal = fs.existsSync(path.join(localBase, relPath)) || fs.existsSync(path.join(localBase, name));

    return {
      name,
      path: relPath,
      category,
      description,
      installed: {
        global: isInstalledGlobal,
        local: isInstalledLocal,
      },
    };
  });
}

function getSkillDetail(skillKey) {
  const allSkills = getAvailableSkills();
  const found = allSkills.find(s => s.name === skillKey || s.path === skillKey || s.path.endsWith('/' + skillKey));
  
  const skillRelPath = found ? found.path : skillKey;
  const skillPath = path.join(SOURCE_SKILLS_DIR, skillRelPath);
  if (!fs.existsSync(skillPath)) return null;

  let skillMd = '';
  let readmeMd = '';

  const skillMdPath = path.join(skillPath, 'SKILL.md');
  const readmeMdPath = path.join(skillPath, 'README.md');

  if (fs.existsSync(skillMdPath)) skillMd = fs.readFileSync(skillMdPath, 'utf8');
  if (fs.existsSync(readmeMdPath)) readmeMd = fs.readFileSync(readmeMdPath, 'utf8');

  return {
    name: found ? found.name : path.basename(skillRelPath),
    path: skillRelPath,
    category: found ? found.category : 'General',
    description: found ? found.description : '',
    skillMd,
    readmeMd,
  };
}

function installSkills(skillKeys, targetType, customPath) {
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
    const found = allSkills.find(s => s.name === key || s.path === key);
    const relPath = found ? found.path : key;
    const src = path.join(SOURCE_SKILLS_DIR, relPath);
    const dest = path.join(targetBaseDir, relPath);

    if (fs.existsSync(src)) {
      copyFolderRecursiveSync(src, dest);
      results.push({ name: found ? found.name : key, path: relPath, status: 'success', destPath: dest });
    } else {
      results.push({ name: key, status: 'not_found' });
    }
  }

  return { success: true, targetPath: targetBaseDir, results };
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
    const found = allSkills.find(s => s.name === key || s.path === key);
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
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
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
      const detail = getSkillDetail(skillName);
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
        const result = installSkills(skills || [], target || 'global', customPath);
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

    // Open browser automatically
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

module.exports = { start, getAvailableSkills, installSkills, uninstallSkills };
