# Changelog

All notable changes to CV Master Data Sync project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-01

**Description**: Initial release - Complete Data-as-Code CV synchronization system

**Major Features**:
- ✨ Input Universal format for CV data (JSON)
- 🔄 Adapter pattern for multiple database targets
- 🔗 Airtable integration with bootstrap and upsert
- 🌐 Azure Cosmos DB integration with document enrichment
- ✅ Schema validation with tag catalog support
- 🎯 GitHub Actions workflow automation
- 📚 Complete documentation with Mermaid diagrams
- 🏗️ Modular architecture for easy extension

**Files Included**:
- `experiencia-ntt.json` - NTT Data experience record

---

## Version Guidelines

### Major Version (X.0.0)
Use for breaking changes or significant architectural updates
```bash
npm run version:bump major
```

### Minor Version (1.X.0)
Use for new features or significant enhancements
```bash
npm run version:bump minor
```

### Patch Version (1.0.X)
Use for bug fixes, optimizations, or minor improvements (default)
```bash
npm run version:bump
```

## How to Use

### Check Current Version
```bash
npm run version:check
```

Shows:
- Current version number
- Version history
- Input files to be synced
- Recent version entries

### Bump Version
```bash
npm run version:bump [patch|minor|major]
```

Automatically:
- Updates `package.json` version
- Records version in `.version-log.json`
- Generates/updates `CHANGELOG.md`
- Detects input files and includes in changelog

### View Changelog
```bash
npm run changelog:view
```

Displays the complete changelog in the terminal.

### Generate Changelog (Manual)
```bash
npm run changelog:generate
```

Useful if you manually edited `.version-log.json`.

## Workflow Example

### 1. Add New Experience
```bash
# Create new file in inputs/
cat > inputs/experiencia-pandero.json << 'EOF'
{
  "id": "exp-pandero-001",
  "tipo": "EXPERIENCIA",
  ...
}
EOF
```

### 2. Check Version Status
```bash
npm run version:check

# Output:
# 📌 Current Version: 1.0.0
# 📁 Input Files (to be synced):
#   ✓ experiencia-ntt.json
#   ✓ experiencia-pandero.json
```

### 3. Bump Version
```bash
npm run version:bump minor

# Output:
# 🚀 VERSION BUMP: 1.0.0 → 1.1.0
# ✅ Updated package.json
# ✅ Updated version log
# ✅ Generated CHANGELOG.md
```

### 4. Commit and Push
```bash
git add package.json CHANGELOG.md .version-log.json inputs/
git commit -m "chore: bump version to v1.1.0"
git push origin main
```

### 5. Trigger Sync
The GitHub Actions workflow will automatically:
- Validate all JSON files in `inputs/`
- Sync with Airtable
- Sync with Cosmos DB
- Move files to `data-master/`
- Update repository

## Version Log File

The `.version-log.json` file tracks all version information:

```json
{
  "versions": [
    {
      "version": "1.0.0",
      "date": "2026-01-01",
      "type": "patch",
      "description": "Experience: Senior Software Developer",
      "files": ["experiencia-ntt.json"],
      "timestamp": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

## Best Practices

1. **Version Before Sync**: Always bump version before syncing new data
2. **Meaningful Descriptions**: Add context to version descriptions
3. **Regular Commits**: Commit version changes with input files
4. **Changelog Reviews**: Keep changelog updated for transparency
5. **Semantic Versioning**: Follow semver conventions

## Future Enhancements

- [ ] Automated version bumping based on commit messages
- [ ] Semantic versioning enforcement in CI/CD
- [ ] Release notes generation
- [ ] Version tagging on GitHub
- [ ] Automated changelog from git history
- [ ] Version comparison tools
- [ ] Rollback capabilities

---

**Last Updated**: 2026-01-01  
**Current Version**: 1.0.0
