# 📌 Guía de Versionamiento y Changelog

## Descripción General

El sistema de versionamiento está diseñado para mantener un control completo del flujo de sincronización de datos CV. Cada cambio se registra automáticamente con:

- 📦 **Versión semántica** (Major.Minor.Patch)
- 📝 **Changelog automático** con descripción de cambios
- 📂 **Tracking de archivos** en cada versión
- ⏱️ **Timestamps** para auditoría completa

## 🎯 Flujo de Trabajo Completo

### 1️⃣ Verificar Versión Actual

```bash
npm run version:check
```

**Output**:
```
📦 VERSION INFORMATION

📌 Current Version: 1.0.0
📚 Total Version History: 1 versions

📁 Input Files (to be synced):
  ✓ experiencia-ntt.json

📝 Recent Versions:
  - v1.0.0 (2026-01-01): Experience: Senior Software Developer

💡 Commands:
  npm run version:bump     - Increment version and generate changelog
  npm run changelog:view   - View current changelog
  npm run changelog:generate - Regenerate changelog
```

### 2️⃣ Crear Nuevo Archivo de Experiencia

```bash
# Crear archivo en inputs/
cat > inputs/experiencia-pandero.json << 'EOF'
{
  "id": "exp-pandero-001",
  "tipo": "EXPERIENCIA",
  "header": {
    "entidad": "Pandero",
    "titulo_rol": "Software Developer",
    "periodo": {
      "inicio": "2023-01",
      "fin": "2024-10",
      "actual": false
    }
  },
  "bloques_logros": [
    {
      "id": "l-pan-01",
      "descripcion": "Desarrollo de aplicaciones web con React y TypeScript",
      "tags_relacionados": ["t-react", "t-typescript"]
    }
  ]
}
EOF
```

### 3️⃣ Incrementar Versión

```bash
# Para patch (bug fixes)
npm run version:bump

# Para minor (nuevas características)
npm run version:bump minor

# Para major (cambios significativos)
npm run version:bump major
```

**Output**:
```
🚀 VERSION BUMP: 1.0.0 → 1.1.0

✅ Updated package.json
✅ Updated version log
✅ Generated CHANGELOG.md

📌 New Version: v1.1.0
📝 Files included: 2
Experiencia: Senior Software Developer, Experiencia: Software Developer

✨ Next step: git commit -m "chore: bump version to v1.1.0"
```

### 4️⃣ Ver Changelog

```bash
npm run changelog:view
```

**Output**:
```
# Changelog

All notable changes to CV Master Data Sync project...

## [1.1.0] - 2026-01-02

**Description**: Experience: Senior Software Developer, Experience: Software Developer

**Files Included**:
- `experiencia-ntt.json`
- `experiencia-pandero.json`

---
```

### 5️⃣ Commit y Push

```bash
git add inputs/
git commit -m "feat: add Pandero experience"
git add package.json CHANGELOG.md .version-log.json
git commit -m "chore: bump version to v1.1.0"
git push origin main
```

### 6️⃣ Sincronización Automática

GitHub Actions se ejecutará automáticamente:

```
🚀 CV DATA SYNC MANAGER - Data-as-Code Pipeline
📌 Version: v1.1.0
============================================================

🔧 Initializing adapters...
✅ Airtable ready
✅ Cosmos DB ready

📂 Found 2 file(s) to process:
  - experiencia-ntt.json
  - experiencia-pandero.json

⚙️ PROCESSING FILES

✅ SYNC COMPLETED SUCCESSFULLY

📊 Summary:
  - Files processed: 2
  - Adapters used: 2
  - Duration: 3.45s
  - Errors: 0
```

## 📊 Archivos de Versionamiento

### `package.json`
Contiene la versión actual del proyecto:
```json
{
  "version": "1.1.0",
  "description": "Motor de Sincronización Data-as-Code para CV Maestro"
}
```

### `.version-log.json`
Registro completo de todas las versiones:
```json
{
  "versions": [
    {
      "version": "1.0.0",
      "date": "2026-01-01",
      "type": "patch",
      "description": "Initial release - Complete Data-as-Code CV synchronization system",
      "files": ["experiencia-ntt.json"],
      "timestamp": "2026-01-01T00:00:00.000Z"
    },
    {
      "version": "1.1.0",
      "date": "2026-01-02",
      "type": "minor",
      "description": "Experience: Senior Software Developer, Experience: Software Developer",
      "files": ["experiencia-ntt.json", "experiencia-pandero.json"],
      "timestamp": "2026-01-02T10:30:00.000Z"
    }
  ]
}
```

### `CHANGELOG.md`
Documento público de cambios:
```markdown
# Changelog

## [1.1.0] - 2026-01-02
**Description**: Experience: Senior Software Developer, Experience: Software Developer
**Files Included**:
- `experiencia-ntt.json`
- `experiencia-pandero.json`

---

## [1.0.0] - 2026-01-01
**Description**: Initial release - Complete Data-as-Code CV synchronization system
**Files Included**:
- `experiencia-ntt.json`
```

## 🔤 Tipos de Versiones

### PATCH (1.0.X)
**Cuándo usar**: Bug fixes, optimizaciones menores

```bash
npm run version:bump
# o
npm run version:bump patch
```

**Ejemplos**:
- Corrección de validación
- Optimización de performance
- Pequeñas mejoras de UX

### MINOR (1.X.0)
**Cuándo usar**: Nuevas características, enhancements

```bash
npm run version:bump minor
```

**Ejemplos**:
- Nuevo tipo de experiencia (EDUCACION, PROYECTO)
- Nuevos adapters
- Mejoras a validación

### MAJOR (X.0.0)
**Cuándo usar**: Cambios significativos o breaking changes

```bash
npm run version:bump major
```

**Ejemplos**:
- Cambio en formato Input Universal
- Restructura completa de archivos
- Cambio de arquitectura

## 📋 Mejores Prácticas

### ✅ HÁGALO

1. **Bump version ANTES de sincronizar**
   ```bash
   npm run version:bump minor
   git add .
   git commit -m "chore: bump version"
   git push
   # Sync se ejecuta automáticamente
   ```

2. **Use descripción clara automática**
   El sistema extrae automáticamente:
   - Tipo de entidad (EXPERIENCIA, EDUCACION, PROYECTO)
   - Rol/Título
   - Organización

3. **Verifique antes de bumping**
   ```bash
   npm run version:check
   # Verifica archivos en inputs/
   ```

4. **Vea el changelog regularmente**
   ```bash
   npm run changelog:view
   ```

### ❌ EVÍTELO

1. **NO editar manualmente .version-log.json**
   - Usar comandos npm run

2. **NO saltarse el bump de versión**
   - Cada sincronización debe tener versión registrada

3. **NO hacer push sin bump**
   - Siempre: version → commit → push

4. **NO usar valores semiónicos incorrectamente**
   - major: solo para breaking changes
   - minor: para nuevas características
   - patch: para fixes (default)

## 🔍 Ejemplos Prácticos

### Caso 1: Agregar una experiencia

```bash
# 1. Crear archivo
echo '{"id": "exp-001", ...}' > inputs/exp-001.json

# 2. Verificar
npm run version:check

# 3. Bump versión (es una nueva característica)
npm run version:bump minor

# 4. Commit
git add .
git commit -m "feat: add new experience"
git push
```

### Caso 2: Corregir un logro

```bash
# 1. Editar archivo en inputs/
# 2. Verificar cambios
npm run version:check

# 3. Bump versión (es un fix)
npm run version:bump

# 4. Commit
git add .
git commit -m "fix: correct achievement description"
git push
```

### Caso 3: Agregar múltiples experiencias

```bash
# 1. Crear múltiples archivos
echo '...' > inputs/exp-002.json
echo '...' > inputs/exp-003.json

# 2. Verificar
npm run version:check
# Output: Found 3 files to be synced

# 3. Bump versión (múltiples características nuevas)
npm run version:bump minor

# 4. Commit todo junto
git add .
git commit -m "feat: add multiple experiences"
git push
```

## 📚 Integración con GitHub Actions

El workflow automáticamente:

1. ✅ Valida archivos JSON en `inputs/`
2. ✅ Sincroniza con Airtable
3. ✅ Sincroniza con Cosmos DB
4. ✅ Mueve archivos a `data-master/`
5. ✅ Auto-commit de cambios

**Salida del workflow**:
```
🚀 CV DATA SYNC MANAGER - Data-as-Code Pipeline
📌 Version: v1.1.0

✅ SYNC COMPLETED SUCCESSFULLY

📊 Summary:
  - Files processed: 2
  - Adapters used: 2
  - Duration: 3.45s
```

## 🆘 Troubleshooting

### Problema: "No input files found to process"
```bash
# Solución: Crear archivos en inputs/
ls -la inputs/
# Si está vacío: crear archivo JSON
```

### Problema: Version sin cambios
```bash
# Solución: Usar version:check primero
npm run version:check
# Verifica que haya archivos en inputs/
```

### Problema: Changelog no se genera
```bash
# Solución: Generar manualmente
npm run changelog:generate
```

### Problema: .version-log.json corrompido
```bash
# Solución: Restaurar del git history
git checkout HEAD -- .version-log.json
```

## 📖 Referencias

- [Keep a Changelog](https://keepachangelog.com/)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**Versión de Guía**: 1.0  
**Última Actualización**: 2026-01-01
