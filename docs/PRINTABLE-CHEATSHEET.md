# 📌 Quick Cheatsheet (Printable)

## 🚀 One-Page Reference

### 📂 Folder Structure
```
inputs/
├── schemas/           ← Definitions (DON'T EDIT)
│   ├── experiencia-schema.json
│   ├── educacion-schema.json
│   └── proyecto-schema.json
└── data/              ← Data (EDIT HERE)
    ├── exp-*.json
    ├── edu-*.json
    └── proj-*.json
```

### 🎯 ID Patterns
```
exp-XXXXX             Experience:    exp-nttdata-001
edu-XXXXX             Education:     edu-pucp-001
proj-XXXXX            Project:       proj-pandero-001
l-XXXXX               Logro:         l-ntt-001
det-XXXXX             Detail:        det-pucp-01
t-XXXXX               Tag:           t-java11
```

### 📝 File Names
```
✅ CORRECT:           ❌ WRONG:
exp-nttdata.json      experiencia-ntt.json
edu-pucp.json         education-pucp.json
proj-pandero.json     project-pandero.json
```

### 📊 Data Structures

#### Experience File
```json
{
  "id": "exp-company-001",
  "tipo": "EXPERIENCIA",
  "header": {
    "entidad": "Company Name",
    "titulo_rol": "Role Title",
    "periodo": { "inicio": "2020-01", "fin": "2021-12" }
  },
  "bloques_logros": [
    {
      "id": "l-comp-01",
      "descripcion": "Achievement description",
      "tags_relacionados": ["t-java11", "t-springboot"]
    }
  ]
}
```

#### Education File
```json
{
  "id": "edu-school-001",
  "tipo": "EDUCACION",
  "header": {
    "institucion": "School/University",
    "titulo_grado": "Degree Title",
    "periodo": { "inicio": "2016-08", "fin": "2020-12" }
  },
  "detalles": [
    {
      "id": "det-school-01",
      "descripcion": "Detail description",
      "tags_relacionados": ["t-java11"]
    }
  ]
}
```

#### Project File
```json
{
  "id": "proj-projectname-001",
  "tipo": "PROYECTO",
  "header": {
    "nombre": "Project Name",
    "descripcion_general": "General description",
    "periodo": { "inicio": "2023-01", "fin": "2024-10" }
  },
  "bloques_logros": [
    {
      "id": "l-proj-01",
      "descripcion": "Achievement description",
      "tags_relacionados": ["t-react", "t-nodejs"]
    }
  ]
}
```

### 🔄 Git Workflow

```bash
# 1. Edit file
nano inputs/data/exp-company.json

# 2. Validate (optional)
npm run validate

# 3. Commit
git add inputs/data/exp-company.json
git commit -m "feat(exp-company): add achievement"

# 4. Push
git push

# ✅ GitHub Actions auto-syncs to Airtable + Cosmos DB
```

### 🔖 Version Commands

```bash
# Check version
npm run version:check

# Bump version
npm run version:bump minor

# View changelog
npm run changelog:view

# Generate changelog
npm run changelog:generate
```

### 📋 Common Operations

#### Add Achievement to Experience
1. Open `inputs/data/exp-XXXXX.json`
2. Add item to `bloques_logros` array
3. Use ID: `l-source-XX`
4. Add `tags_relacionados`
5. Commit and push

#### Add Detail to Education
1. Open `inputs/data/edu-XXXXX.json`
2. Add item to `detalles` array
3. Use ID: `det-source-XX`
4. Add `tags_relacionados`
5. Commit and push

#### Create New Experience
1. Create: `inputs/data/exp-company.json`
2. Use schema: `inputs/schemas/experiencia-schema.json`
3. Fill all required fields
4. Add `bloques_logros`
5. Commit and push

#### Create New Project
1. Create: `inputs/data/proj-projectname.json`
2. Use schema: `inputs/schemas/proyecto-schema.json`
3. Fill all required fields
4. Add `bloques_logros`
5. Commit and push

### 📚 Documentation Quick Links

| Need | Read This |
|------|-----------|
| Quick answers | QUICK-REFERENCE.md |
| How to organize | DATA-STRUCTURE.md |
| System overview | README.md |
| Folder guide | FOLDER-STRUCTURE.md |
| Architecture | architecture-diagram.md |
| Versioning | VERSIONING.md |
| Status check | SYSTEM-STATUS.md |
| Start here | docs/INDEX.md |

### ✅ Validation Checklist

Before pushing, verify:
```
☐ File in inputs/data/ (not inputs/ root)
☐ Correct file name pattern: [type]-[name].json
☐ Correct id pattern: [type]-[source]-001
☐ JSON is valid (no syntax errors)
☐ ID starts with correct prefix (exp-, edu-, proj-)
☐ All tags exist in catalog-tags.json
☐ Dates in ISO format (YYYY-MM)
☐ Required fields filled
```

### 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| File not synced | Check if in inputs/data/ |
| Validation error | Check against schema in inputs/schemas/ |
| Tag error | Verify tag exists in catalog-tags.json |
| ID error | Use pattern: [type]-[source]-001 |
| JSON error | Validate JSON syntax (use online validator) |

### 📞 Emergency Contacts

```
❓ How do I...?
→ Check QUICK-REFERENCE.md

❓ Where should this go?
→ Check FOLDER-STRUCTURE.md or DATA-STRUCTURE.md

❓ What's the format?
→ Look at example file in inputs/data/

❓ Did I break something?
→ Run: npm run validate
→ Check: Git commit history
```

### ⏱️ Time Estimates

| Task | Time |
|------|------|
| Add 1 achievement | 2 min |
| Add new experience | 10 min |
| Create new project | 15 min |
| Fix validation error | 5 min |
| Bump version | 1 min |
| First-time setup | 30 min |

### 📊 40 Available Tags

```
Languages:
t-java11, t-python3, t-javascript, t-typescript, 
t-csharp, t-sql

Frameworks:
t-springboot, t-react, t-nodejs, t-angular,
t-dotnet, t-azure-functions

Cloud:
t-azure-cosmosdb, t-azure-devops, t-aws,
t-docker, t-kubernetes

Tools:
t-git, t-ci-cd, t-agile, t-tdd

Soft Skills:
t-leadership, t-teamwork, t-communication,
t-problem-solving, t-architecture

[See catalog-tags.json for complete list]
```

### 🎯 Current Data

```
📍 exp-nttdata.json
   - NTT Data experience
   - 11+ logros
   - Java, Spring, Azure

📍 edu-pucp.json
   - PUCP education
   - 3 detalles
   - Software Engineering

📍 proj-pandero.json
   - Pandero project
   - 5+ logros
   - React, Node.js, MongoDB
```

### 🔐 GitHub Secrets Needed

```
AIRTABLE_API_KEY          (Your Airtable token)
AIRTABLE_BASE_ID          (Your Airtable base)
COSMOS_CONNECTION_STRING  (Your Cosmos connection)
```

### 📝 Git Commit Messages

```
✅ GOOD:
feat(exp-company): add leadership achievement
fix(edu-pucp): correct degree title
chore(catalog): add new tag

❌ BAD:
update
fixed
data

Pattern: [type](component): description
```

---

## 🖨️ Print Tips

- **Page Size**: A3 for best readability
- **Format**: Landscape orientation
- **Laminate**: For repeated use
- **Update**: Monthly as system evolves

---

**Keep this sheet at your desk for quick reference!**

Version 1.0.0 | 2024
