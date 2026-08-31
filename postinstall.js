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

function postInstall() {
  try {
    const sourceDir = path.join(__dirname, '.agents', 'skills');
    if (!fs.existsSync(sourceDir)) {
      return;
    }

    const skills = fs.readdirSync(sourceDir).filter(name => {
      return fs.statSync(path.join(sourceDir, name)).isDirectory();
    });

    if (skills.length === 0) return;

    // Check if installed globally (npm_config_global is 'true' during global install)
    const isGlobal = process.env.npm_config_global === 'true' || process.env.npm_config_location === 'global';
    
    // Target base dir
    let targetBaseDir;
    if (isGlobal) {
      targetBaseDir = getGlobalSkillsDir();
    } else {
      // Local installation in a target project: __dirname is inside node_modules/antigravity-roblox-skills
      // Go up two levels to find the project root: node_modules/.. -> project root
      const potentialProjectRoot = path.resolve(__dirname, '..', '..');
      if (path.basename(path.resolve(__dirname, '..')) === 'node_modules') {
        targetBaseDir = path.join(potentialProjectRoot, '.agents', 'skills');
      } else {
        // Fallback to global
        targetBaseDir = getGlobalSkillsDir();
      }
    }

    console.log(`\n${COLORS.bright}=== Antigravity Roblox Skills Auto-Installer ===${COLORS.reset}`);
    console.log(`Installing ${skills.length} skills to: ${COLORS.cyan}${targetBaseDir}${COLORS.reset}...\n`);

    for (const skill of skills) {
      const src = path.join(sourceDir, skill);
      const dest = path.join(targetBaseDir, skill);
      copyFolderRecursiveSync(src, dest);
      console.log(`  ${COLORS.green}[✔ INSTALLED]${COLORS.reset} ${skill}`);
    }

    console.log(`\n${COLORS.bright}${COLORS.green}Done!${COLORS.reset} Skills are now active for Antigravity AI agents.`);
    console.log(`You can run ${COLORS.cyan}npx skills-roblox list${COLORS.reset} to view all installed skills.\n`);
  } catch (err) {
    // Graceful fallback - do not fail npm installation
  }
}

postInstall();
