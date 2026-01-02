/**
 * Transformadores de datos
 * Convierte el Input Universal a formatos específicos para Airtable y Cosmos DB
 */

/**
 * Convierte fecha YYYY-MM a formato ISO para Airtable
 * @param {string} dateStr - Fecha en formato YYYY-MM
 * @returns {string|null} - Fecha en formato YYYY-MM-DD o null
 */
function formatDateForAirtable(dateStr) {
  if (!dateStr) return null;
  
  // Airtable espera formato YYYY-MM-DD
  // Si tenemos YYYY-MM, añadimos -01 para el primer día del mes
  if (/^\d{4}-\d{2}$/.test(dateStr)) {
    return `${dateStr}-01`;
  }
  
  return dateStr;
}

/**
 * Transforma el Input Universal al formato de Airtable
 * Aplana la estructura jerárquica para columnas relacionales
 * @param {object} input - Datos de entrada en formato universal
 * @returns {object} - Datos transformados para Airtable
 */
export function toAirtable(input) {
  console.log('🔄 Transforming to Airtable format...');
  
  // Extraer header
  const { header, bloques_logros } = input;
  
  // Transformar entidad principal
  const entityData = {
    id: input.id,
    tipo: input.tipo,
    entidad: header.entidad,
    titulo_rol: header.titulo_rol,
    fecha_inicio: formatDateForAirtable(header.periodo.inicio),
    fecha_fin: header.periodo.actual ? null : formatDateForAirtable(header.periodo.fin),
    actual: header.periodo.actual || false,
    // Los logros se vincularán después mediante record IDs
    logros: bloques_logros.map(bloque => ({
      id: bloque.id,
      descripcion: bloque.descripcion,
      tags_relacionados: bloque.tags_relacionados || []
    }))
  };
  
  console.log(`  ✅ Transformed entity: ${entityData.id}`);
  console.log(`     - ${bloques_logros.length} logros`);
  
  return entityData;
}

/**
 * Transforma el Input Universal al formato de Cosmos DB
 * Mantiene estructura jerárquica y añade metadata
 * @param {object} input - Datos de entrada en formato universal
 * @returns {object} - Datos transformados para Cosmos DB
 */
export function toCosmos(input) {
  console.log('🔄 Transforming to Cosmos DB format...');
  
  // Para Cosmos DB, mantenemos la estructura original pero añadimos campos adicionales
  const cosmosDoc = {
    // ID único (mismo que Airtable y Git)
    id: input.id,
    
    // Partition key (tipo de entidad)
    tipo: input.tipo,
    
    // Header con metadata de la entidad
    header: {
      ...input.header,
      // Normalizar el periodo
      periodo: {
        inicio: input.header.periodo.inicio,
        fin: input.header.periodo.fin,
        actual: input.header.periodo.actual || false,
        // Calcular duración en meses
        duracion_meses: calculateDurationMonths(
          input.header.periodo.inicio,
          input.header.periodo.fin || new Date().toISOString().substring(0, 7)
        )
      }
    },
    
    // Bloques de logros (se enriquecerán con tags completos en el adapter)
    bloques_logros: input.bloques_logros.map(bloque => ({
      id: bloque.id,
      descripcion: bloque.descripcion,
      tags_relacionados: bloque.tags_relacionados || [],
      // Metadata del logro
      palabra_clave_count: bloque.descripcion.split(' ').length,
      tiene_metricas: /\d+%|\d+x|aument[oó]|reduj[oó]|mejor[oó]/i.test(bloque.descripcion)
    })),
    
    // Timestamp de última actualización
    last_updated: new Date().toISOString(),
    
    // Version tracking
    data_version: '1.0',
    
    // Source tracking
    source: 'git-data-as-code'
  };
  
  console.log(`  ✅ Transformed document: ${cosmosDoc.id}`);
  console.log(`     - Partition key: ${cosmosDoc.tipo}`);
  console.log(`     - ${input.bloques_logros.length} bloques de logros`);
  
  return cosmosDoc;
}

/**
 * Calcula la duración en meses entre dos fechas
 * @param {string} startDate - Fecha inicio (YYYY-MM)
 * @param {string} endDate - Fecha fin (YYYY-MM)
 * @returns {number} - Duración en meses
 */
function calculateDurationMonths(startDate, endDate) {
  if (!startDate) return 0;
  
  try {
    const [startYear, startMonth] = startDate.split('-').map(Number);
    const [endYear, endMonth] = endDate.split('-').map(Number);
    
    const months = (endYear - startYear) * 12 + (endMonth - startMonth);
    return Math.max(0, months + 1); // +1 para incluir el mes actual
    
  } catch (error) {
    console.warn('⚠️  Failed to calculate duration:', error.message);
    return 0;
  }
}

/**
 * Valida que los datos transformados tengan los campos requeridos
 * @param {object} data - Datos transformados
 * @param {string} format - Formato de destino ('airtable' o 'cosmos')
 * @returns {object} - { valid: boolean, errors: string[] }
 */
export function validateTransformedData(data, format) {
  const errors = [];
  
  if (format === 'airtable') {
    if (!data.id) errors.push('Missing required field: id');
    if (!data.tipo) errors.push('Missing required field: tipo');
    if (!data.entidad) errors.push('Missing required field: entidad');
    if (!data.titulo_rol) errors.push('Missing required field: titulo_rol');
    if (!Array.isArray(data.logros)) errors.push('logros must be an array');
    
  } else if (format === 'cosmos') {
    if (!data.id) errors.push('Missing required field: id');
    if (!data.tipo) errors.push('Missing required field: tipo');
    if (!data.header) errors.push('Missing required field: header');
    if (!Array.isArray(data.bloques_logros)) errors.push('bloques_logros must be an array');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Extrae todos los IDs de tags únicos de una entidad
 * Útil para pre-cargar información de tags
 * @param {object} input - Datos de entrada
 * @returns {string[]} - Array de IDs de tags únicos
 */
export function extractUniqueTagIds(input) {
  const tagIds = new Set();
  
  if (input.bloques_logros) {
    input.bloques_logros.forEach(bloque => {
      if (bloque.tags_relacionados) {
        bloque.tags_relacionados.forEach(tagId => {
          tagIds.add(tagId);
        });
      }
    });
  }
  
  return Array.from(tagIds);
}

/**
 * Crea un resumen ejecutivo de la entidad
 * Útil para dashboards y vistas rápidas
 * @param {object} input - Datos de entrada
 * @returns {object} - Resumen ejecutivo
 */
export function createExecutiveSummary(input) {
  const uniqueTags = extractUniqueTagIds(input);
  const totalLogros = input.bloques_logros?.length || 0;
  
  // Calcular duración
  const duration = calculateDurationMonths(
    input.header.periodo.inicio,
    input.header.periodo.fin || new Date().toISOString().substring(0, 7)
  );
  
  return {
    id: input.id,
    tipo: input.tipo,
    titulo: `${input.header.titulo_rol} en ${input.header.entidad}`,
    periodo: input.header.periodo.actual ? 
      `${input.header.periodo.inicio} - Presente (${duration} meses)` :
      `${input.header.periodo.inicio} - ${input.header.periodo.fin} (${duration} meses)`,
    total_logros: totalLogros,
    tecnologias_count: uniqueTags.length,
    principales_tecnologias: uniqueTags.slice(0, 5)
  };
}
