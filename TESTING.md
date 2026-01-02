# Testing Guide - Quick Start

## En GitHub Codespaces

### 1. Configurar Secretos
En tu repositorio GitHub → Settings → Secrets and variables → Actions

Agrega:
- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`
- `COSMOS_CONNECTION_STRING`

### 2. Prueba Local en Codespaces

```bash
# Instalar dependencias (automático al abrir Codespaces)
npm install

# Crear .env para pruebas locales
cp .env.example .env
# Edita .env con tus credenciales reales

# Probar validación
npm run validate

# Probar sync local (sin GitHub Actions)
npm run sync
```

### 3. Probar GitHub Actions

```bash
# Edita un archivo en inputs/data/
nano inputs/data/exp-nttdata.json
# Agrega un nuevo logro

# Commit y push
git add inputs/data/
git commit -m "test: add new achievement"
git push

# Ve a GitHub → Actions tab
# Verás el workflow ejecutándose
```

## Verificar Resultados

1. **Airtable**: Abre tu base y verifica las tablas
2. **Cosmos DB**: Usa Azure Portal o SDK para ver documentos
3. **GitHub Actions**: Ve logs en el tab Actions

## Troubleshooting

- Error de validación → Revisa el schema en `inputs/schemas/`
- Error de Airtable → Verifica API key y Base ID
- Error de Cosmos → Verifica connection string
- Ver logs completos en GitHub Actions

## Comandos Útiles

```bash
npm run version:check      # Ver versión actual
npm run version:bump       # Incrementar versión
npm run changelog:view     # Ver changelog
npm test                   # Test básico
```
