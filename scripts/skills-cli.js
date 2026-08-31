#!/usr/bin/env node

/**
 * CLI Manager for Antigravity Roblox Skills Catalog
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
};

function getGlobalSkillsDir() {
  return path.join(os.homedir(), '.gemini', 'config', 'skills');
}

function getLocalSkillsDir() {
  return path.join(process.cwd(), '.agents', 'skills');
}

function getSourceSkillsDir() {
  return path.join(__dirname, '..', '.agents', 'skills');
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

function getAvailableSkills() {
  const sourceDir = getSourceSkillsDir();
  if (!fs.existsSync(sourceDir)) return [];
  return fs.readdirSync(sourceDir).filter(name => {
    return fs.statSync(path.join(sourceDir, name)).isDirectory();
  });
}

function handleList() {
  const skills = getAvailableSkills();
  console.log(`\n${COLORS.bright}=== Antigravity Roblox Skills Catalog ===${COLORS.reset}`);
  console.log(`Available modular skills in this package:\n`);

  skills.forEach((skill, idx) => {
    console.log(`  ${COLORS.cyan}${idx + 1}. ${skill}${COLORS.reset}`);
    const skillMd = path.join(getSourceSkillsDir(), skill, 'SKILL.md');
    if (fs.existsSync(skillMd)) {
      const content = fs.readFileSync(skillMd, 'utf8');
      const descMatch = content.match(/description:\s*([^\n\r]+)/);
      if (descMatch) {
        console.log(`     ${COLORS.gray}${descMatch[1]}${COLORS.reset}`);
      }
    }
  });
  console.log(`\nTotal: ${skills.length} skills ready to install.\n`);
}

function handleInstall(targetType) {
  const skills = getAvailableSkills();
  const sourceDir = getSourceSkillsDir();

  let targetBaseDir;
  let targetLabel;

  if (targetType === 'global') {
    targetBaseDir = getGlobalSkillsDir();
    targetLabel = `Global Antigravity Config (${targetBaseDir})`;
  } else {
    targetBaseDir = getLocalSkillsDir();
    targetLabel = `Local Project Workspace (${targetBaseDir})`;
  }

  console.log(`\n${COLORS.bright}=== Installing Antigravity Roblox Skills ===${COLORS.reset}`);
  console.log(`Target Destination: ${COLORS.cyan}${targetLabel}${COLORS.reset}\n`);

  for (const skill of skills) {
    const src = path.join(sourceDir, skill);
    const dest = path.join(targetBaseDir, skill);

    copyFolderRecursiveSync(src, dest);
    console.log(`  ${COLORS.green}[✔ INSTALLED]${COLORS.reset} ${skill} ➔ ${COLORS.gray}${dest}${COLORS.reset}`);
  }

  console.log(`\n${COLORS.bright}${COLORS.green}Success!${COLORS.reset} All ${skills.length} skills have been installed.`);
  console.log(`They are now active for Antigravity AI agents!\n`);
}

function handleUninstall(targetType) {
  const skills = getAvailableSkills();
  const targetBaseDir = targetType === 'global' ? getGlobalSkillsDir() : getLocalSkillsDir();

  console.log(`\n${COLORS.bright}=== Uninstalling Antigravity Roblox Skills ===${COLORS.reset}`);
  console.log(`Target Destination: ${COLORS.cyan}${targetBaseDir}${COLORS.reset}\n`);

  for (const skill of skills) {
    const dest = path.join(targetBaseDir, skill);
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { recursive: true, force: true });
      console.log(`  ${COLORS.red}[✔ REMOVED]${COLORS.reset} ${skill}`);
    }
  }

  console.log(`\n${COLORS.green}Cleanup complete.${COLORS.reset}\n`);
}

function printHelp() {
  console.log(`
${COLORS.bright}Antigravity Roblox Skills Catalog CLI${COLORS.reset}

Usage:
  npx skills-roblox <command> [options]

Commands:
  ${COLORS.cyan}list${COLORS.reset}                     List all available skills in this catalog
  ${COLORS.cyan}install --global (-g)${COLORS.reset}    Install skills globally to ~/.gemini/config/skills/
  ${COLORS.cyan}install --local (-l)${COLORS.reset}     Install skills locally to current project's .agents/skills/
  ${COLORS.cyan}uninstall --global${COLORS.reset}       Remove skills from global config
  ${COLORS.cyan}uninstall --local${COLORS.reset}        Remove skills from local project
  ${COLORS.cyan}help${COLORS.reset}                     Display this help message
`);
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';

  switch (command) {
    case 'list':
      handleList();
      break;
    case 'install':
      const isGlobal = args.includes('--global') || args.includes('-g');
      handleInstall(isGlobal ? 'global' : 'local');
      break;
    case 'uninstall':
      const uninstGlobal = args.includes('--global') || args.includes('-g');
      handleUninstall(uninstGlobal ? 'global' : 'local');
      break;
    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;
    default:
      console.log(`${COLORS.red}Unknown command: ${command}${COLORS.reset}`);
      printHelp();
  }
}

main();
