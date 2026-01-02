import fs from 'fs';
import path from 'path';

/**
 * Validador de esquemas para entidades de evidencia (CV Data)
 * Valida que los archivos JSON cumplan con el modelo "Input Universal"
 */

// Tipos de entidades permitidos
const VALID_ENTITY_TYPES = ['EXPERIENCIA', 'EDUCACION', 'PROYECTO'];

/**
 * Esquema base para una entidad de evidencia
 */
const ENTITY_SCHEMA = {
  id: 'string',
  tipo: 'string',
  header: {
    entidad: 'string',
    titulo_rol: 'string',
    periodo: {
      inicio: 'string',
      fin: 'string|null',
      actual: 'boolean'
    }
  },
  bloques_logros: 'array'
};

/**
 * Valida si un valor es de un tipo específico
 * @param {*} value - Valor a validar
 * @param {string} type - Tipo esperado (ej: 'string', 'number', 'boolean', 'array', 'object')
 * @returns {boolean}
 */
function isValidType(value, type) {
  if (type.includes('|')) {
    // Manejar tipos alternativos (ej: 'string|null')
    const types = type.split('|');
    return types.some(t => isValidType(value, t.trim()));
  }
  
  if (type === 'null') return value === null;
  if (type === 'array') return Array.isArray(value);
  if (type === 'object') return typeof value === 'object' && value !== null && !Array.isArray(value);
  
  return typeof value === type;
}

/**
 * Valida la estructura de un objeto contra un esquema
 * @param {object} data - Datos a validar
 * @param {object} schema - Esquema de validación
 * @param {string} path - Ruta actual en el objeto (para mensajes de error)
 * @returns {object} - { valid: boolean, errors: string[] }
 */
function validateSchema(data, schema, currentPath = 'root') {
  const errors = [];
  
  for (const [key, expectedType] of Object.entries(schema)) {
    const fullPath = `${currentPath}.${key}`;
    
    // Verificar si la clave existe
    if (!(key in data)) {
      errors.push(`Missing required field: ${fullPath}`);
      continue;
    }
    
    const value = data[key];
    
    // Si el tipo esperado es un objeto, validar recursivamente
    if (typeof expectedType === 'object' && !Array.isArray(expectedType)) {
      if (!isValidType(value, 'object')) {
        errors.push(`Invalid type for ${fullPath}: expected object, got ${typeof value}`);
      } else {
        const nestedValidation = validateSchema(value, expectedType, fullPath);
        errors.push(...nestedValidation.errors);
      }
    } else {
      // Validar tipo primitivo
      if (!isValidType(value, expectedType)) {
        errors.push(`Invalid type for ${fullPath}: expected ${expectedType}, got ${typeof value}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Valida un bloque de logro
 * @param {object} bloque - Bloque de logro a validar
 * @param {number} index - Índice del bloque
 * @returns {string[]} - Array de errores
 */
function validateLogroBlock(bloque, index) {
  const errors = [];
  const path = `bloques_logros[${index}]`;
  
  if (!bloque.id || typeof bloque.id !== 'string') {
    errors.push(`${path}.id is required and must be a string`);
  }
  
  if (!bloque.descripcion || typeof bloque.descripcion !== 'string') {
    errors.push(`${path}.descripcion is required and must be a string`);
  }
  
  if (!Array.isArray(bloque.tags_relacionados)) {
    errors.push(`${path}.tags_relacionados must be an array`);
  } else {
    bloque.tags_relacionados.forEach((tag, tagIndex) => {
      if (typeof tag !== 'string') {
        errors.push(`${path}.tags_relacionados[${tagIndex}] must be a string`);
      }
    });
  }
  
  return errors;
}

/**
 * Valida que los tags existan en el catálogo maestro
 * @param {string[]} tags - Array de IDs de tags
 * @param {object} catalog - Catálogo de tags
 * @returns {string[]} - Array de tags inválidos
 */
function validateTagsAgainstCatalog(tags, catalog) {
  const catalogIds = new Set(catalog.tags.map(t => t.id));
  return tags.filter(tag => !catalogIds.has(tag));
}

/**
 * Valida una entidad completa
 * @param {object} entity - Entidad a validar
 * @param {object} catalog - Catálogo de tags (opcional)
 * @returns {object} - { valid: boolean, errors: string[] }
 */
export function validateEntity(entity, catalog = null) {
  const errors = [];
  
  // Validar esquema base
  const schemaValidation = validateSchema(entity, ENTITY_SCHEMA);
  errors.push(...schemaValidation.errors);
  
  // Validar tipo de entidad
  if (entity.tipo && !VALID_ENTITY_TYPES.includes(entity.tipo)) {
    errors.push(`Invalid entity type: ${entity.tipo}. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}`);
  }
  
  // Validar bloques de logros
  if (Array.isArray(entity.bloques_logros)) {
    entity.bloques_logros.forEach((bloque, index) => {
      const bloqueErrors = validateLogroBlock(bloque, index);
      errors.push(...bloqueErrors);
    });
    
    // Validar tags contra catálogo si está disponible
    if (catalog) {
      const allTags = entity.bloques_logros.flatMap(b => b.tags_relacionados || []);
      const invalidTags = validateTagsAgainstCatalog(allTags, catalog);
      
      if (invalidTags.length > 0) {
        errors.push(`Invalid tags not found in catalog: ${invalidTags.join(', ')}`);
      }
    }
  }
  
  // Validar formato de fechas (YYYY-MM)
  const dateRegex = /^\d{4}-\d{2}$/;
  if (entity.header?.periodo?.inicio && !dateRegex.test(entity.header.periodo.inicio)) {
    errors.push(`Invalid date format for periodo.inicio: ${entity.header.periodo.inicio}. Expected YYYY-MM`);
  }
  if (entity.header?.periodo?.fin && entity.header.periodo.fin !== null && !dateRegex.test(entity.header.periodo.fin)) {
    errors.push(`Invalid date format for periodo.fin: ${entity.header.periodo.fin}. Expected YYYY-MM or null`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Carga y valida un archivo JSON
 * @param {string} filePath - Ruta del archivo
 * @param {object} catalog - Catálogo de tags (opcional)
 * @returns {object} - { valid: boolean, data: object|null, errors: string[] }
 */
export function validateFile(filePath, catalog = null) {
  try {
    // Verificar que el archivo existe
    if (!fs.existsSync(filePath)) {
      return {
        valid: false,
        data: null,
        errors: [`File not found: ${filePath}`]
      };
    }
    
    // Leer y parsear JSON
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    let data;
    
    try {
      data = JSON.parse(fileContent);
    } catch (parseError) {
      return {
        valid: false,
        data: null,
        errors: [`Invalid JSON format: ${parseError.message}`]
      };
    }
    
    // Validar entidad
    const validation = validateEntity(data, catalog);
    
    return {
      valid: validation.valid,
      data: validation.valid ? data : null,
      errors: validation.errors
    };
    
  } catch (error) {
    return {
      valid: false,
      data: null,
      errors: [`Unexpected error: ${error.message}`]
    };
  }
}

/**
 * Carga el catálogo de tags
 * @param {string} catalogPath - Ruta al archivo catalog-tags.json
 * @returns {object|null} - Catálogo o null si hay error
 */
export function loadCatalog(catalogPath = './catalog-tags.json') {
  try {
    if (!fs.existsSync(catalogPath)) {
      console.warn(`⚠️  Catalog file not found: ${catalogPath}`);
      return null;
    }
    
    const content = fs.readFileSync(catalogPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error loading catalog: ${error.message}`);
    return null;
  }
}

// Si se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node validator.js <file-path> [catalog-path]');
    process.exit(1);
  }
  
  const filePath = args[0];
  const catalogPath = args[1] || './catalog-tags.json';
  
  console.log(`\n🔍 Validating: ${filePath}`);
  
  const catalog = loadCatalog(catalogPath);
  const result = validateFile(filePath, catalog);
  
  if (result.valid) {
    console.log('✅ Validation passed!');
    process.exit(0);
  } else {
    console.log('❌ Validation failed:\n');
    result.errors.forEach(error => console.log(`  - ${error}`));
    process.exit(1);
  }
}
