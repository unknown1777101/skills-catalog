#!/usr/bin/env node

/**
 * Post-install script for antigravity-roblox-skills
 * Automatically installs skills into the appropriate Antigravity directory (Global or Local).
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function getGlobalSkillsDir() {
  return path.join(os.homedir(), '.gemini', 'config', 'skills');
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

function postInstall() {
  try {
    const sourceDir = path.join(__dirname, '.agents', 'skills');
    if (!fs.existsSync(sourceDir)) {
      return;
    }

    const skills = findSkillsRecursive(sourceDir);

    if (skills.length === 0) return;

    const isGlobal = process.env.npm_config_global === 'true' || process.env.npm_config_location === 'global';
    
    let targetBaseDir;
    if (isGlobal) {
      targetBaseDir = getGlobalSkillsDir();
    } else {
      const potentialProjectRoot = path.resolve(__dirname, '..', '..');
      if (path.basename(path.resolve(__dirname, '..')) === 'node_modules') {
        targetBaseDir = path.join(potentialProjectRoot, '.agents', 'skills');
      } else {
        targetBaseDir = getGlobalSkillsDir();
      }
    }

    console.log(`\n${COLORS.bright}=== Antigravity Skills Auto-Installer ===${COLORS.reset}`);
    console.log(`Installing ${skills.length} skills to: ${COLORS.cyan}${targetBaseDir}${COLORS.reset}...\n`);

    for (const skill of skills) {
      const src = path.join(sourceDir, skill);
      const dest = path.join(targetBaseDir, skill);
      if (fs.existsSync(dest)) {
        fs.rmSync(dest, { recursive: true, force: true });
      }
      copyFolderRecursiveSync(src, dest);
      console.log(`  ${COLORS.green}[✔ INSTALLED]${COLORS.reset} ${skill}`);
    }

    console.log(`\n${COLORS.bright}${COLORS.green}Done!${COLORS.reset} Skills are now active for Antigravity AI agents.\n`);
  } catch (err) {
    // Graceful fallback
  }
}

postInstall();
