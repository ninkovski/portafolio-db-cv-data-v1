# 📁 Data Structure Guide

## Overview

El proyecto utiliza una **separación clara entre esquemas y datos** para máxima flexibilidad y mantenibilidad:

```
inputs/
├── schemas/          ← Definiciones de estructura (JSON Schemas)
│   ├── experiencia-schema.json
│   ├── educacion-schema.json
│   └── proyecto-schema.json
└── data/            ← Datos incremental (instancias reales)
    ├── exp-nttdata.json
    ├── edu-pucp.json
    └── proj-pandero.json
```

## 1. Carpeta `/schemas/` - Definiciones de Estructura

Los **esquemas** definen la estructura y validación de cada tipo de entidad. Son **referencias estables** que raramente cambian.

### Características:
- 📋 **Basados en JSON Schema Draft 7**
- 🔍 **Validación automática** (tipos, patrones, requeridos)
- 🏠 **Single source of truth** para estructura
- ✅ **Versionado independiente** de los datos

### Tipos de Esquemas:

#### `experiencia-schema.json`
Define estructura para experiencias laborales.

```json
{
  "properties": {
    "id": { "pattern": "^exp-" },
    "tipo": { "enum": ["EXPERIENCIA"] },
    "header": { ... },
    "bloques_logros": { "type": "array", "items": { ... } }
  }
}
```

#### `educacion-schema.json`
Define estructura para formación académica.

```json
{
  "properties": {
    "id": { "pattern": "^edu-" },
    "tipo": { "enum": ["EDUCACION"] },
    "header": { ... },
    "detalles": { "type": "array", "items": { ... } }
  }
}
```

#### `proyecto-schema.json`
Define estructura para proyectos.

```json
{
  "properties": {
    "id": { "pattern": "^proj-" },
    "tipo": { "enum": ["PROYECTO"] },
    "header": { ... },
    "bloques_logros": { "type": "array", "items": { ... } }
  }
}
```

## 2. Carpeta `/data/` - Datos Incrementales

Los **datos** contienen instancias reales que **crecen incrementalmente**. Cada archivo representa una entidad.

### Características:
- 📈 **Crecimiento incremental** - Agrega logros/detalles sin modificar estructura
- ✨ **Validación automática** contra esquema correspondiente
- 🔄 **Sincronización automática** a Airtable y Cosmos DB
- 📝 **Un archivo = Una entidad**

### Convención de Nombres:

```
[tipo]-[nombre-corto].json

Ejemplos:
- exp-nttdata.json       (Experiencia en NTT Data)
- edu-pucp.json          (Educación en PUCP)
- proj-pandero.json      (Proyecto Pandero)
```

### Estructura de un Archivo de Datos:

```json
{
  "id": "exp-nttdata-001",
  "tipo": "EXPERIENCIA",
  "header": {
    "empresa": "NTT Data",
    "cargo": "Software Engineer Senior",
    "periodo": { "inicio": "2020-01", "fin": "2023-12" }
  },
  "bloques_logros": [
    {
      "id": "l-ntt-001",
      "descripcion": "Logro 1...",
      "tags_relacionados": ["t-java11", "t-springboot"]
    },
    // ... más logros
  ]
}
```

## 3. Flujo de Incremento de Datos

### Ejemplo: Agregar un logro a una experiencia

**Paso 1:** Editar `inputs/data/exp-nttdata.json`
```json
{
  "id": "exp-nttdata-001",
  "bloques_logros": [
    // ... 10 logros existentes ...
    {
      "id": "l-ntt-011",
      "descripcion": "Nuevo logro agregado",
      "tags_relacionados": ["t-arquitectura"]
    }
  ]
}
```

**Paso 2:** Push a Git
```bash
git add inputs/data/exp-nttdata.json
git commit -m "feat(exp-nttdata): add new achievement"
git push
```

**Paso 3:** GitHub Actions Automáticamente:
- ✅ Valida contra `inputs/schemas/experiencia-schema.json`
- ✅ Sincroniza a Airtable (tabla Experiencias, tabla Logros)
- ✅ Sincroniza a Cosmos DB (enriquecido con tags, metricas)
- ✅ Mueve archivo a `data-master/` como backup

## 4. Patrones de ID

Cada entidad y subelemento tiene un **patrón de ID único**:

```
exp-XXXXXX     → Experiencias      (exp-nttdata-001)
edu-XXXXXX     → Educación         (edu-pucp-001)
proj-XXXXXX    → Proyectos         (proj-pandero-001)

l-XXXXXX       → Logros            (l-ntt-001)
det-XXXXXX     → Detalles          (det-pucp-01)

t-XXXXXX       → Tags (catálogo)   (t-java11, t-springboot)
```

## 5. Validación Automática

Todos los datos en `/data/` se validan automáticamente:

### A. Por Tipo de Archivo
```
exp-*.json  → Valida contra experiencia-schema.json
edu-*.json  → Valida contra educacion-schema.json
proj-*.json → Valida contra proyecto-schema.json
```

### B. Reglas Validadas
- ✅ Tipo de dato correcto
- ✅ Campos requeridos presentes
- ✅ Patrones de ID válidos
- ✅ IDs de tags existen en `catalog-tags.json`
- ✅ Fechas en formato ISO 8601

### C. Ejecución Manual
```bash
npm run validate
```

## 6. Versionado de Esquemas vs. Datos

### Cuando hacer Bump Version

| Cambio | Tipo | Archivo |
|--------|------|---------|
| Nuevo campo requerido en esquema | **MAJOR** | schemas/*.json |
| Nuevo campo opcional en esquema | **MINOR** | schemas/*.json |
| Agregar logro/detalle a datos | **PATCH** | data/*.json |
| Corrección de typo en datos | **PATCH** | data/*.json |
| Cambio de empresa/institución | **MINOR** | data/*.json |

## 7. Estructura Completa en Acción

### Sincronización Automática

```
inputs/data/exp-nttdata.json (MODIFICADO)
           ↓
           └─→ GitHub Actions Trigger
               ├─→ Validación (contra schemas/)
               ├─→ Transformación
               ├─→ Airtable Sync
               │   ├─ Tabla: Experiencias
               │   ├─ Tabla: Logros
               │   └─ Tabla: Tags (catálogo)
               ├─→ Cosmos DB Sync
               │   ├─ Documento enriquecido
               │   ├─ Tags flattened
               │   └─ Metricas calculadas
               └─→ Movimiento a data-master/
```

## 8. Directorios Relacionados

```
project-root/
├── inputs/
│   ├── schemas/          ← JSON Schemas (Definiciones)
│   └── data/             ← Datos Incrementales (Instancias)
├── data-master/          ← Respaldo de archivos procesados
├── scripts/
│   ├── sync-manager.js   ← Lee de inputs/data/
│   ├── version-manager.js
│   ├── validators.js     ← Valida contra schemas/
│   ├── transformers.js
│   └── adapters/
├── .github/workflows/
│   └── sync-data.yml     ← Trigger en inputs/data/
├── catalog-tags.json     ← Master de tags
└── README.md
```

## 9. Ejemplos Prácticos

### Agregar nueva experiencia:

1. Crear `inputs/data/exp-empresa-nueva.json` basado en `experiencia-schema.json`
2. Push a Git
3. GitHub Actions sincroniza automáticamente

### Actualizar educación:

1. Editar `inputs/data/edu-pucp.json`
2. Agregar nuevos `detalles` array items
3. Push a Git
4. Sistema valida y sincroniza

### Crear nuevo proyecto:

1. Crear `inputs/data/proj-nombre.json` basado en `proyecto-schema.json`
2. Agregar `bloques_logros` con logros específicos
3. Push a Git
4. Sincronización automática

## 10. Troubleshooting

### "Validation failed"
→ Verificar que el archivo cumple con el esquema correspondiente

### "File not recognized"
→ Revisar que el nombre sigue patrón `[tipo]-[nombre].json`

### "Tag not found in catalog"
→ Verificar que los tags en `tags_relacionados` existen en `catalog-tags.json`

---

**Beneficios de esta estructura:**
✅ Separación clara: estructura vs. contenido  
✅ Escalabilidad: datos crecen sin afectar esquemas  
✅ Validación automática: confiabilidad  
✅ Sincronización automática: CI/CD  
✅ Mantenimiento fácil: cambios centralizados  
