# 📂 Project Structure Visual Guide

## Complete Directory Tree

```
portafolio-db-cv-data-v1/
│
├── 📄 README.md                                  ← Start here
├── 📄 CHANGELOG.md                              ← Version history
├── 📄 REORGANIZATION-COMPLETE.md                ← What's new
│
├── 🔐 Environment & Config
│   ├── .env.example
│   ├── .gitignore
│   ├── .versionrc                               ← Version config
│   ├── .version-log.json                        ← Internal version log
│   └── package.json                             ← Dependencies & scripts
│
├── 📚 Documentation
│   └── docs/
│       ├── INDEX.md                             ← 📑 Documentation hub
│       ├── QUICK-REFERENCE.md                   ← ⚡ Common operations
│       ├── DATA-STRUCTURE.md                    ← 📂 Data organization
│       ├── SYSTEM-STATUS.md                     ← ✅ Implementation status
│       ├── VERSIONING.md                        ← 🔖 Version management
│       └── architecture-diagram.md              ← 📊 Mermaid diagrams
│
├── 💾 Data & Schemas
│   └── inputs/
│       ├── schemas/                             ← 📋 DEFINITIONS
│       │   ├── experiencia-schema.json          (Experience structure)
│       │   ├── educacion-schema.json            (Education structure)
│       │   └── proyecto-schema.json             (Project structure)
│       │
│       ├── data/                                ← 📈 DATA (Incremental)
│       │   ├── exp-nttdata.json                 (11 logros)
│       │   ├── edu-pucp.json                    (3 detalles)
│       │   └── proj-pandero.json                (5 logros)
│       │
│       └── experiencia-ntt.json                 ⚠️ OLD (remove after migration)
│
├── 📦 Processed Files
│   └── data-master/                             ← Auto-backup of synced files
│
├── 🔄 Synchronization
│   └── .github/
│       └── workflows/
│           └── sync-data.yml                    ← GitHub Actions (trigger: inputs/data/)
│
└── 🔧 Scripts
    └── scripts/
        ├── sync-manager.js                      ← Main orchestrator
        ├── version-manager.js                   ← Version CLI
        ├── transformers.js                      ← Data transformation
        ├── adapters/
        │   ├── airtable.js                      ← Airtable adapter
        │   └── cosmos.js                        ← Cosmos DB adapter
        └── utils/
            └── validator.js                     ← Schema validator
```

## 📊 Schemas Folder Detail

```
inputs/schemas/
│
├── experiencia-schema.json
│   ├── id: exp-{name}-001
│   ├── tipo: EXPERIENCIA
│   ├── header
│   │   ├── entidad
│   │   ├── titulo_rol
│   │   └── periodo
│   └── bloques_logros[]
│       ├── id: l-{source}-01
│       ├── descripcion
│       └── tags_relacionados[]
│
├── educacion-schema.json
│   ├── id: edu-{name}-001
│   ├── tipo: EDUCACION
│   ├── header
│   │   ├── institucion
│   │   ├── titulo_grado
│   │   └── periodo
│   └── detalles[]
│       ├── id: det-{source}-01
│       ├── descripcion
│       └── tags_relacionados[]
│
└── proyecto-schema.json
    ├── id: proj-{name}-001
    ├── tipo: PROYECTO
    ├── header
    │   ├── nombre
    │   ├── descripcion_general
    │   └── periodo
    └── bloques_logros[]
        ├── id: l-{source}-01
        ├── descripcion
        └── tags_relacionados[]
```

## 📁 Data Folder Detail

```
inputs/data/
│
├── exp-nttdata.json
│   └── Experiencia: NTT Data (11 logros)
│       ├── l-ntt-01: Microservicios Java/Spring
│       ├── l-ntt-02: Azure Functions serverless
│       ├── l-ntt-03: APIs RESTful
│       ├── l-ntt-04: Cosmos DB integration
│       ├── l-ntt-05: CI/CD Azure DevOps
│       ├── l-ntt-06: Technical leadership
│       ├── l-ntt-07: Unit testing JUnit/Mockito
│       ├── l-ntt-08: SQL/Oracle optimization
│       ├── l-ntt-09: Resilience patterns
│       ├── l-ntt-10: Mentoring
│       └── l-ntt-11: Additional achievement
│
├── edu-pucp.json
│   └── Educación: PUCP (3 detalles)
│       ├── det-pucp-01: Software engineering specialty
│       ├── det-pucp-02: Java/Spring projects
│       └── det-pucp-03: Agile & leadership
│
└── proj-pandero.json
    └── Proyecto: Plataforma Pandero (5 logros)
        ├── l-proj-pan-01: React/TypeScript frontend
        ├── l-proj-pan-02: Node.js/Express backend
        ├── l-proj-pan-03: MongoDB integration
        ├── l-proj-pan-04: CI/CD Docker/GitHub Actions
        └── l-proj-pan-05: Payment API integration
```

## 🔄 Synchronization Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Developer Edits inputs/data/*.json                          │
│ git add → git commit → git push                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ GitHub Actions Triggered (paths: inputs/data/*.json)        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ Step 1: Checkout & Setup                                    │
│ ✓ Checkout repository                                       │
│ ✓ Setup Node.js 20                                          │
│ ✓ Install dependencies (npm ci)                             │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ Step 2: Load Environment Variables                          │
│ ✓ AIRTABLE_API_KEY                                          │
│ ✓ AIRTABLE_BASE_ID                                          │
│ ✓ COSMOS_CONNECTION_STRING                                  │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ Step 3: Sync Manager (sync-manager.js)                      │
│                                                              │
│ For each file in inputs/data/:                              │
│ ┌────────────────────────────────────────────────────┐      │
│ │ 1. VALIDATE                                        │      │
│ │    ├─ Load appropriate schema from inputs/schemas/ │      │
│ │    ├─ Check ID pattern (exp-, edu-, proj-)        │      │
│ │    ├─ Verify tags exist in catalog-tags.json      │      │
│ │    ├─ Validate date formats (ISO 8601)            │      │
│ │    └─ Validate required fields                    │      │
│ ├─ If invalid: Report errors and stop               │      │
│ │                                                    │      │
│ │ 2. TRANSFORM                                       │      │
│ │    ├─ Transform to Airtable format (relational)   │      │
│ │    └─ Transform to Cosmos format (document)       │      │
│ │                                                    │      │
│ │ 3. SYNCHRONIZE - AIRTABLE                         │      │
│ │    ├─ Bootstrap tables (create if needed)         │      │
│ │    ├─ Sync catalog (tags)                         │      │
│ │    ├─ Upsert Entity                               │      │
│ │    └─ Upsert Logros/Detalles                      │      │
│ │                                                    │      │
│ │ 4. SYNCHRONIZE - COSMOS DB                        │      │
│ │    ├─ Enrich document (flatten tags, calc metrics)│      │
│ │    └─ Upsert document with diagnostics            │      │
│ │                                                    │      │
│ │ 5. POST-PROCESS                                   │      │
│ │    └─ Move file to data-master/ backup            │      │
│ └────────────────────────────────────────────────────┘      │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ Step 4: Auto-commit                                         │
│ ✓ git add data-master/                                      │
│ ✓ git commit -m "chore: sync completed..."                 │
│ ✓ git push                                                  │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ Step 5: Completion                                          │
│ ✅ Synchronization completed                                │
│ ✅ Data synced to Airtable                                  │
│ ✅ Data synced to Cosmos DB                                 │
│ ✅ Files backed up in data-master/                          │
└──────────────────────────────────────────────────────────────┘
```

## 🗂️ File Organization Principles

### Schemas Folder - REFERENCE DATA
```
Purpose: Contain JSON Schema definitions
Update Frequency: Rarely (schema changes)
Triggers Sync: NO
Versioning: Independent (MAJOR changes = schema updates)
Who Edits: Architects, not daily contributors
```

### Data Folder - INSTANCE DATA  
```
Purpose: Contain actual entity instances
Update Frequency: Often (adding logros, detalles)
Triggers Sync: YES (GitHub Actions)
Versioning: Always incremental (patches, minor bumps)
Who Edits: Daily contributors
```

### Master Catalog
```
Purpose: Master list of all technology tags
Update Frequency: When adding new technologies
Location: /catalog-tags.json (root level)
Synchronization: Synced with Airtable on every workflow
```

## 📈 Data Growth Pattern

```
Initial State:
├── exp-nttdata.json (10 logros)
├── edu-pucp.json (3 detalles)
└── proj-pandero.json (5 logros)

After adding achievements (Week 2):
├── exp-nttdata.json (12 logros) ← Added 2 new
├── edu-pucp.json (3 detalles)    ← No change
└── proj-pandero.json (5 logros)  ← No change

After new project (Month 1):
├── exp-nttdata.json (12 logros)
├── edu-pucp.json (3 detalles)
├── proj-pandero.json (5 logros)
└── proj-newproject.json (3 logros) ← NEW FILE

Schema Folder (NEVER CHANGES):
├── experiencia-schema.json (SAME)
├── educacion-schema.json (SAME)
└── proyecto-schema.json (SAME)
```

## 🔀 Branch Strategy (Optional)

```
main (production)
│
├─ All changes trigger GitHub Actions
├─ Only inputs/data/* changes cause sync
└─ Automatic backup to data-master/

feature/new-experience (development)
├─ Create branch
├─ Add inputs/data/exp-newcompany.json
├─ Test locally (npm run validate)
├─ Create PR
└─ Merge to main → Auto-sync
```

## 🎯 Key Locations

| Item | Location | Trigger |
|------|----------|---------|
| Experience Data | inputs/data/exp-*.json | ✅ Yes |
| Education Data | inputs/data/edu-*.json | ✅ Yes |
| Project Data | inputs/data/proj-*.json | ✅ Yes |
| **Schemas** | **inputs/schemas/\*-schema.json** | **❌ No** |
| **Catalog** | **catalog-tags.json** | **❌ No** |
| Sync Logic | scripts/sync-manager.js | — |
| Workflow | .github/workflows/sync-data.yml | — |

---

**This structure ensures clear separation, easy maintenance, and scalable data growth.**

Version: 1.0.0 | Status: ✅ Complete
