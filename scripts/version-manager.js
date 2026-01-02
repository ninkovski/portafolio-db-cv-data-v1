#!/usr/bin/env node

/**
 * Version Manager - Gestión de versiones y cambios del CV Data
 * Maneja:
 * - Versionamiento semántico (major.minor.patch)
 * - Generación de changelog
 * - Tracking de cambios por tipo
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const PACKAGE_JSON = path.join(PROJECT_ROOT, 'package.json');
const CHANGELOG_FILE = path.join(PROJECT_ROOT, 'CHANGELOG.md');
const VERSION_LOG = path.join(PROJECT_ROOT, '.version-log.json');

/**
 * Lee el package.json
 */
function readPackageJson() {
  const content = fs.readFileSync(PACKAGE_JSON, 'utf-8');
  return JSON.parse(content);
}

/**
 * Escribe el package.json
 */
function writePackageJson(pkg) {
  fs.writeFileSync(PACKAGE_JSON, JSON.stringify(pkg, null, 2) + '\n');
}

/**
 * Lee el archivo de log de versiones
 */
function readVersionLog() {
  if (!fs.existsSync(VERSION_LOG)) {
    return {
      versions: [],
      entries: []
    };
  }
  const content = fs.readFileSync(VERSION_LOG, 'utf-8');
  return JSON.parse(content);
}

/**
 * Escribe el archivo de log de versiones
 */
function writeVersionLog(log) {
  fs.writeFileSync(VERSION_LOG, JSON.stringify(log, null, 2) + '\n');
}

/**
 * Obtiene los archivos JSON de entrada y sus versiones
 */
function getInputFiles() {
  const inputDir = path.join(PROJECT_ROOT, 'inputs');
  if (!fs.existsSync(inputDir)) return [];
  
  return fs.readdirSync(inputDir)
    .filter(file => file.endsWith('.json'))
    .map(file => ({
      name: file,
      path: path.join(inputDir, file)
    }));
}

/**
 * Obtiene el hash de contenido de un archivo
 */
function getFileHash(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  // Simple hash basado en contenido
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 8);
}

/**
 * Incrementa la versión
 */
function incrementVersion(version, type = 'patch') {
  const [major, minor, patch] = version.split('.').map(Number);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

/**
 * Comando: Verificar versión actual
 */
function checkVersion() {
  const pkg = readPackageJson();
  const versionLog = readVersionLog();
  const inputFiles = getInputFiles();
  
  console.log('\n📦 VERSION INFORMATION\n');
  console.log(`📌 Current Version: ${pkg.version}`);
  console.log(`📚 Total Version History: ${versionLog.versions.length} versions\n`);
  
  console.log('📁 Input Files (to be synced):');
  inputFiles.forEach(file => {
    console.log(`  ✓ ${file.name}`);
  });
  
  if (versionLog.versions.length > 0) {
    console.log('\n📝 Recent Versions:');
    versionLog.versions.slice(-3).reverse().forEach(entry => {
      console.log(`  - v${entry.version} (${entry.date}): ${entry.description}`);
    });
  }
  
  console.log('\n💡 Commands:');
  console.log('  npm run version:bump     - Increment version and generate changelog');
  console.log('  npm run changelog:view   - View current changelog');
  console.log('  npm run changelog:generate - Regenerate changelog\n');
}

/**
 * Comando: Bumper de versión
 */
function bumpVersion(type = 'patch') {
  const pkg = readPackageJson();
  const versionLog = readVersionLog();
  const inputFiles = getInputFiles();
  const oldVersion = pkg.version;
  const newVersion = incrementVersion(oldVersion, type);
  const now = new Date().toISOString().split('T')[0];
  
  console.log(`\n🚀 VERSION BUMP: ${oldVersion} → ${newVersion}\n`);
  
  // Actualizar package.json
  pkg.version = newVersion;
  writePackageJson(pkg);
  console.log('✅ Updated package.json');
  
  // Crear entrada en el log
  const versionEntry = {
    version: newVersion,
    date: now,
    type: type,
    description: getVersionDescription(inputFiles),
    files: inputFiles.map(f => f.name),
    timestamp: new Date().toISOString()
  };
  
  versionLog.versions.push(versionEntry);
  writeVersionLog(versionLog);
  console.log('✅ Updated version log');
  
  // Generar changelog
  generateChangelog(versionLog);
  console.log('✅ Generated CHANGELOG.md');
  
  console.log(`\n📌 New Version: v${newVersion}`);
  console.log(`📝 Files included: ${inputFiles.length}`);
  console.log('\n✨ Next step: git commit -m "chore: bump version to v' + newVersion + '"\n');
}

/**
 * Genera descripción automática de versión
 */
function getVersionDescription(files) {
  if (files.length === 0) return 'Version sync without changes';
  
  const types = {
    'EXPERIENCIA': 'Experience',
    'EDUCACION': 'Education',
    'PROYECTO': 'Project'
  };
  
  const descriptions = [];
  for (const file of files) {
    try {
      const content = JSON.parse(fs.readFileSync(file.path, 'utf-8'));
      const type = types[content.tipo] || content.tipo;
      descriptions.push(`${type}: ${content.header.titulo_rol}`);
    } catch (e) {
      descriptions.push(`File: ${file.name}`);
    }
  }
  
  return descriptions.join(', ');
}

/**
 * Genera el changelog
 */
function generateChangelog(versionLog) {
  let content = `# Changelog

All notable changes to CV Master Data Sync project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Version History

`;
  
  // Agrupar por tipo de versión
  const grouped = {
    major: [],
    minor: [],
    patch: []
  };
  
  versionLog.versions.forEach(v => {
    grouped[v.type]?.push(v) || grouped.patch.push(v);
  });
  
  // Major releases
  if (grouped.major.length > 0) {
    content += '### Major Releases\n\n';
    grouped.major.reverse().forEach(v => {
      content += generateVersionEntry(v);
    });
  }
  
  // Minor releases
  if (grouped.minor.length > 0) {
    content += '### Minor Releases\n\n';
    grouped.minor.reverse().forEach(v => {
      content += generateVersionEntry(v);
    });
  }
  
  // Patch releases
  if (grouped.patch.length > 0) {
    content += '### Patch Releases\n\n';
    grouped.patch.reverse().forEach(v => {
      content += generateVersionEntry(v);
    });
  }
  
  // Agregar footer
  content += `
## Guidelines for Version Bumping

- **MAJOR**: Breaking changes, new major features
  - \`npm run version:bump -- major\`
  
- **MINOR**: New features, enhancements
  - \`npm run version:bump -- minor\`
  
- **PATCH**: Bug fixes, minor improvements
  - \`npm run version:bump\`

## Data Sync Format

Each version can include:
- **EXPERIENCIA**: Professional experience entries
- **EDUCACION**: Education records
- **PROYECTO**: Project portfolio entries

All entries follow the Universal Input format defined in README.md
`;
  
  fs.writeFileSync(CHANGELOG_FILE, content);
}

/**
 * Genera una entrada de versión en formato markdown
 */
function generateVersionEntry(versionEntry) {
  const { version, date, description, files } = versionEntry;
  
  let entry = `## [${version}] - ${date}\n\n`;
  
  entry += `**Description**: ${description}\n\n`;
  
  if (files && files.length > 0) {
    entry += `**Files Included**:\n`;
    files.forEach(file => {
      entry += `- \`${file}\`\n`;
    });
    entry += '\n';
  }
  
  entry += '---\n\n';
  
  return entry;
}

/**
 * Comando: Ver changelog
 */
function viewChangelog() {
  if (!fs.existsSync(CHANGELOG_FILE)) {
    console.log('\n⚠️  CHANGELOG.md not found. Generate it first:\n');
    console.log('  npm run changelog:generate\n');
    return;
  }
  
  const content = fs.readFileSync(CHANGELOG_FILE, 'utf-8');
  console.log('\n' + content);
}

/**
 * Comando: Generar changelog
 */
function generateChangelogCommand() {
  const versionLog = readVersionLog();
  generateChangelog(versionLog);
  console.log('\n✅ CHANGELOG.md generated successfully\n');
}

/**
 * Comando principal
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'check';
  const subArg = args[1] || 'patch';
  
  try {
    switch (command) {
      case 'check':
        checkVersion();
        break;
      case 'bump':
        bumpVersion(subArg);
        break;
      case 'changelog':
        generateChangelogCommand();
        break;
      case 'view':
        viewChangelog();
        break;
      default:
        console.log(`\n❌ Unknown command: ${command}\n`);
        console.log('Available commands:');
        console.log('  check     - Show current version and history');
        console.log('  bump      - Bump version (patch|minor|major)');
        console.log('  changelog - Generate CHANGELOG.md');
        console.log('  view      - View CHANGELOG.md\n');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
