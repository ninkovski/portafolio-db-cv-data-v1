# 🚀 Quick Reference - Data Structure

## 📂 Carpeta Actual: `inputs/`

```
inputs/
├── schemas/                    ← ESQUEMAS (Definiciones)
│   ├── experiencia-schema.json
│   ├── educacion-schema.json
│   └── proyecto-schema.json
│
└── data/                       ← DATOS (Instancias)
    ├── exp-nttdata.json       ✅ (11 logros)
    ├── edu-pucp.json          ✅ (3 detalles)
    └── proj-pandero.json      ✅ (5 logros)
```

## 🎯 Operaciones Comunes

### ➕ Agregar nuevo Logro a Experiencia

**Archivo:** `inputs/data/exp-nttdata.json`

```bash
# 1. Editar el archivo
# 2. Agregar objeto a array "bloques_logros"
# 3. Commit y Push
git add inputs/data/exp-nttdata.json
git commit -m "feat(exp-nttdata): add new achievement"
git push
# ✅ GitHub Actions sincroniza automáticamente
```

### ➕ Agregar nuevo Detalle a Educación

**Archivo:** `inputs/data/edu-pucp.json`

```bash
# 1. Editar el archivo
# 2. Agregar objeto a array "detalles"
git add inputs/data/edu-pucp.json
git commit -m "feat(edu-pucp): add education detail"
git push
# ✅ GitHub Actions sincroniza automáticamente
```

### ➕ Crear Nueva Experiencia

**Nuevo archivo:** `inputs/data/exp-[empresa].json`

```bash
# Basarse en experiencia-schema.json
# Seguir patrón de exp-nttdata.json
# Asegurar id: "exp-[nombreempresa]-001"
git add inputs/data/exp-[empresa].json
git commit -m "feat: add new experience"
git push
```

## 📝 Patrones de ID

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| **Experiencia** | `exp-[nombre]-001` | `exp-nttdata-001` |
| **Educación** | `edu-[nombre]-001` | `edu-pucp-001` |
| **Proyecto** | `proj-[nombre]-001` | `proj-pandero-001` |
| **Logro** | `l-[source]-001` | `l-ntt-001` |
| **Detalle** | `det-[source]-01` | `det-pucp-01` |
| **Tag** | `t-[nombre]` | `t-java11`, `t-springboot` |

## 📚 Esquemas Disponibles

### experiencia-schema.json
```json
{
  "properties": {
    "id": { "pattern": "^exp-" },
    "tipo": "EXPERIENCIA",
    "header": { "empresa", "cargo", "periodo" },
    "bloques_logros": [ { "id", "descripcion", "tags_relacionados" } ]
  }
}
```

### educacion-schema.json
```json
{
  "properties": {
    "id": { "pattern": "^edu-" },
    "tipo": "EDUCACION",
    "header": { "institucion", "titulo_grado", "periodo" },
    "detalles": [ { "id", "descripcion", "tags_relacionados" } ]
  }
}
```

### proyecto-schema.json
```json
{
  "properties": {
    "id": { "pattern": "^proj-" },
    "tipo": "PROYECTO",
    "header": { "nombre", "descripcion_general", "periodo" },
    "bloques_logros": [ { "id", "descripcion", "tags_relacionados" } ]
  }
}
```

## 🏷️ Tags Disponibles (40 total)

```
Lenguajes: t-java11, t-python3, t-javascript, t-typescript, ...
Frameworks: t-springboot, t-react, t-nodejs, ...
Cloud: t-azure-functions, t-cosmos-db, ...
Tools: t-docker, t-git, t-ci-cd, ...
Soft Skills: t-leadership, t-teamwork, ...
```

👉 [Ver catálogo completo: catalog-tags.json](../catalog-tags.json)

## ✅ Validación

```bash
# Validar todos los datos
npm run validate

# El sistema valida automáticamente:
# ✓ Tipo de dato correcto
# ✓ Campos requeridos presentes
# ✓ Patrones de ID válidos
# ✓ Tags existen en catálogo
# ✓ Fechas en formato ISO 8601
```

## 🔄 Sincronización Automática

**Trigger:** Push a `inputs/data/*.json`

```
inputs/data/exp-nttdata.json (MODIFICADO)
    ↓
GitHub Actions
    ├─ Validar (contra schemas/)
    ├─ Transformar
    ├─ Airtable ✅
    ├─ Cosmos DB ✅
    └─ Mover a data-master/
```

## 🔖 Versionado

```bash
# Verificar versión
npm run version:check

# Bump version
npm run version:bump minor

# Ver changelog
npm run changelog:view
```

## 📖 Documentación

| Documento | Propósito |
|-----------|-----------|
| [DATA-STRUCTURE.md](../docs/DATA-STRUCTURE.md) | Guía completa de estructura |
| [VERSIONING.md](../docs/VERSIONING.md) | Guía de versionado semántico |
| [architecture-diagram.md](../docs/architecture-diagram.md) | Diagramas Mermaid |

---

**💡 Tip:** Siempre editar archivos en `inputs/data/` (no en `inputs/schemas/`)
