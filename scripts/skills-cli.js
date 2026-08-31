#!/usr/bin/env node

/**
 * Universal Antigravity Skills Catalog CLI Manager
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
  purple: '\x1b[35m',
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
  return findSkillsRecursive(sourceDir);
}

function getSkillMeta(relPath) {
  const sourceDir = getSourceSkillsDir();
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

  if (!category && relPath.includes('/')) {
    const top = relPath.split('/')[0];
    category = top.charAt(0).toUpperCase() + top.slice(1);
  }

  return { name, relPath, category, description };
}

function handleList() {
  const skills = getAvailableSkills();
  const globalBase = getGlobalSkillsDir();
  const localBase = getLocalSkillsDir();

  console.log(`\n${COLORS.bright}=== 🪐 Antigravity Skills Catalog ===${COLORS.reset}`);
  console.log(`Available modular skills in this repository:\n`);

  skills.forEach((skillRelPath, idx) => {
    const meta = getSkillMeta(skillRelPath);
    const isGlobal = fs.existsSync(path.join(globalBase, skillRelPath)) || fs.existsSync(path.join(globalBase, meta.name));
    const isLocal = fs.existsSync(path.join(localBase, skillRelPath)) || fs.existsSync(path.join(localBase, meta.name));

    let statusTag = `${COLORS.gray}[Not Installed]${COLORS.reset}`;
    if (isGlobal && isLocal) statusTag = `${COLORS.green}[Installed: Global & Local]${COLORS.reset}`;
    else if (isGlobal) statusTag = `${COLORS.cyan}[Installed: Global]${COLORS.reset}`;
    else if (isLocal) statusTag = `${COLORS.purple}[Installed: Local]${COLORS.reset}`;

    const catBadge = meta.category ? `${COLORS.yellow}[${meta.category}]${COLORS.reset} ` : '';
    console.log(`  ${COLORS.bright}${idx + 1}. ${meta.name}${COLORS.reset} ${catBadge}${statusTag}`);
    console.log(`     ${COLORS.gray}Path: ${skillRelPath}${COLORS.reset}`);
    if (meta.description) {
      console.log(`     ${COLORS.gray}${meta.description}${COLORS.reset}`);
    }
  });

  console.log(`\n${COLORS.gray}Total: ${skills.length} skills available.${COLORS.reset}`);
  console.log(`Tip: Launch Web GUI via ${COLORS.cyan}skills-catalog ui${COLORS.reset}\n`);
}


function executeInstall(selectedSkills, targetType) {
  const sourceDir = getSourceSkillsDir();
  const targetBaseDir = targetType === 'global' ? getGlobalSkillsDir() : getLocalSkillsDir();
  const targetLabel = targetType === 'global' ? `Global (${targetBaseDir})` : `Local Workspace (${targetBaseDir})`;

  console.log(`\n${COLORS.bright}=== Installing Selected Skills ===${COLORS.reset}`);
  console.log(`Target: ${COLORS.cyan}${targetLabel}${COLORS.reset}\n`);

  for (const skill of selectedSkills) {
    const src = path.join(sourceDir, skill);
    const dest = path.join(targetBaseDir, skill);

    if (fs.existsSync(src)) {
      copyFolderRecursiveSync(src, dest);
      console.log(`  ${COLORS.green}[✔ INSTALLED]${COLORS.reset} ${skill} ➔ ${COLORS.gray}${dest}${COLORS.reset}`);
    } else {
      console.log(`  ${COLORS.red}[✖ NOT FOUND]${COLORS.reset} ${skill}`);
    }
  }

  console.log(`\n${COLORS.bright}${COLORS.green}Success!${COLORS.reset} ${selectedSkills.length} skill(s) installed.\n`);
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
    console.log(`  ${COLORS.bright}${idx + 1})${COLORS.reset} ${skill}`);
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

  // Filter out flags from args to see if specific skill names were passed
  const specifiedSkills = args.filter(a => !a.startsWith('-') && a !== 'install');

  if (specifiedSkills.length > 0) {
    // Specific skills passed directly in command
    const matched = specifiedSkills.filter(s => skills.includes(s));
    if (matched.length === 0) {
      console.log(`${COLORS.red}None of the specified skills were found.${COLORS.reset}`);
      return;
    }
    executeInstall(matched, isLocal ? 'local' : 'global');
  } else if (isAll) {
    executeInstall(skills, isLocal ? 'local' : 'global');
  } else {
    // Interactive selection prompt
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
    const dest = path.join(targetBaseDir, skill);
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { recursive: true, force: true });
      console.log(`  ${COLORS.red}[✔ REMOVED]${COLORS.reset} ${skill}`);
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

Usage:
  skills-catalog <command> [options]

Commands:
  ${COLORS.cyan}ui / web${COLORS.reset}                       Launch the Web GUI Dashboard in browser
  ${COLORS.cyan}list${COLORS.reset}                           List all skills and their installation status
  ${COLORS.cyan}install${COLORS.reset}                        Interactive multi-skill selector & installer
  ${COLORS.cyan}install [skill...] [--global|-g]${COLORS.reset} Install specific skill(s) directly to Global
  ${COLORS.cyan}install [skill...] [--local|-l]${COLORS.reset}  Install specific skill(s) directly to Local Workspace
  ${COLORS.cyan}install --all [--global|--local]${COLORS.reset} Install all available skills at once
  ${COLORS.cyan}uninstall [skill...]${COLORS.reset}            Remove skills from Global or Local
  ${COLORS.cyan}help${COLORS.reset}                           Display this help manual
`);
}

function main() {
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
    case 'install':
      handleInstall(args.slice(1));
      break;
    case 'uninstall':
      handleUninstall(args.slice(1));
      break;
    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;
    default:
      // If someone runs `skills-catalog roblox-knit-arch`, treat as install
      if (getAvailableSkills().includes(command)) {
        handleInstall(args);
      } else {
        console.log(`${COLORS.red}Unknown command: ${command}${COLORS.reset}`);
        printHelp();
      }
  }
}

main();
