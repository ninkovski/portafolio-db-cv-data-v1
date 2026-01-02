import Airtable from 'airtable';

/**
 * Adaptador para Airtable - Gestión relacional de CV Data
 * Implementa bootstrap de tablas, validación y operaciones Upsert
 */
export class AirtableAdapter {
  constructor(apiKey, baseId) {
    if (!apiKey) {
      throw new Error('AIRTABLE_API_KEY is required');
    }
    if (!baseId) {
      throw new Error('AIRTABLE_BASE_ID is required');
    }
    
    this.apiKey = apiKey;
    this.baseId = baseId;
    this.base = new Airtable({ apiKey }).base(baseId);
    
    // Nombres de las tablas
    this.TABLES = {
      TAGS: 'Catalog_Tags',
      ENTITIES: 'Entities',
      LOGROS: 'Logros'
    };
  }
  
  /**
   * Bootstrap: Verifica y crea tablas si no existen
   * Nota: Airtable API no soporta creación automática de tablas via API pública.
   * Este método verifica que las tablas existan y proporciona instrucciones si no.
   */
  async bootstrap() {
    console.log('🔧 Bootstrapping Airtable tables...');
    
    try {
      // Verificar existencia de cada tabla intentando leer el primer registro
      const tableChecks = await Promise.allSettled([
        this.base(this.TABLES.TAGS).select({ maxRecords: 1 }).firstPage(),
        this.base(this.TABLES.ENTITIES).select({ maxRecords: 1 }).firstPage(),
        this.base(this.TABLES.LOGROS).select({ maxRecords: 1 }).firstPage()
      ]);
      
      const missingTables = [];
      
      tableChecks.forEach((result, index) => {
        const tableName = Object.values(this.TABLES)[index];
        if (result.status === 'rejected') {
          missingTables.push(tableName);
        }
      });
      
      if (missingTables.length > 0) {
        console.error('❌ Missing tables in Airtable:', missingTables.join(', '));
        console.log('\n📋 Please create these tables manually in Airtable with the following structure:');
        console.log('\n1. Catalog_Tags:');
        console.log('   - id (Single line text, Primary)');
        console.log('   - nombre (Single line text)');
        console.log('   - categoria (Single select: Language, Framework, Cloud, Tool, Soft Skill)');
        console.log('   - nivel (Single select: Básico, Intermedio, Avanzado, Expert)');
        console.log('\n2. Entities:');
        console.log('   - id (Single line text, Primary)');
        console.log('   - tipo (Single select: EXPERIENCIA, EDUCACION, PROYECTO)');
        console.log('   - entidad (Single line text)');
        console.log('   - titulo_rol (Single line text)');
        console.log('   - fecha_inicio (Date)');
        console.log('   - fecha_fin (Date)');
        console.log('   - actual (Checkbox)');
        console.log('   - logros (Link to Logros)');
        console.log('\n3. Logros:');
        console.log('   - id (Single line text, Primary)');
        console.log('   - descripcion (Long text)');
        console.log('   - entity (Link to Entities)');
        console.log('   - tags (Link to Catalog_Tags)');
        
        throw new Error('Missing required tables in Airtable');
      }
      
      console.log('✅ All tables exist');
      return true;
      
    } catch (error) {
      console.error('❌ Bootstrap failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Sincroniza el catálogo de tags
   * @param {object} catalog - Catálogo de tags
   */
  async syncCatalog(catalog) {
    console.log('📚 Syncing catalog tags...');
    
    try {
      // Obtener todos los tags existentes
      const existingRecords = await this.base(this.TABLES.TAGS)
        .select({ fields: ['id'] })
        .all();
      
      const existingIds = new Set(existingRecords.map(r => r.get('id')));
      
      // Preparar tags para crear/actualizar
      const tagsToCreate = [];
      const tagsToUpdate = [];
      
      for (const tag of catalog.tags) {
        const recordData = {
          fields: {
            id: tag.id,
            nombre: tag.nombre,
            categoria: tag.categoria,
            nivel: tag.nivel || 'Intermedio'
          }
        };
        
        if (existingIds.has(tag.id)) {
          // Encontrar el record ID de Airtable
          const existingRecord = existingRecords.find(r => r.get('id') === tag.id);
          tagsToUpdate.push({
            id: existingRecord.id,
            fields: recordData.fields
          });
        } else {
          tagsToCreate.push(recordData);
        }
      }
      
      // Crear nuevos tags (batch de 10)
      if (tagsToCreate.length > 0) {
        console.log(`  Creating ${tagsToCreate.length} new tags...`);
        for (let i = 0; i < tagsToCreate.length; i += 10) {
          const batch = tagsToCreate.slice(i, i + 10);
          await this.base(this.TABLES.TAGS).create(batch);
        }
      }
      
      // Actualizar tags existentes (batch de 10)
      if (tagsToUpdate.length > 0) {
        console.log(`  Updating ${tagsToUpdate.length} existing tags...`);
        for (let i = 0; i < tagsToUpdate.length; i += 10) {
          const batch = tagsToUpdate.slice(i, i + 10);
          await this.base(this.TABLES.TAGS).update(batch);
        }
      }
      
      console.log(`✅ Catalog synced: ${tagsToCreate.length} created, ${tagsToUpdate.length} updated`);
      
    } catch (error) {
      console.error('❌ Failed to sync catalog:', error.message);
      throw error;
    }
  }
  
  /**
   * Resuelve IDs de tags a Record IDs de Airtable
   * @param {string[]} tagIds - Array de IDs de tags
   * @returns {Promise<string[]>} - Array de Record IDs de Airtable
   */
  async resolveTagRecordIds(tagIds) {
    if (!tagIds || tagIds.length === 0) return [];
    
    try {
      const records = await this.base(this.TABLES.TAGS)
        .select({
          filterByFormula: `OR(${tagIds.map(id => `{id}='${id}'`).join(',')})`,
          fields: ['id']
        })
        .all();
      
      return records.map(r => r.id);
      
    } catch (error) {
      console.error('❌ Failed to resolve tag record IDs:', error.message);
      return [];
    }
  }
  
  /**
   * Upsert de una entidad
   * @param {object} transformedData - Datos transformados para Airtable
   */
  async upsertEntity(transformedData) {
    console.log(`📝 Upserting entity: ${transformedData.id}`);
    
    try {
      // Buscar si ya existe
      const existingRecords = await this.base(this.TABLES.ENTITIES)
        .select({
          filterByFormula: `{id}='${transformedData.id}'`,
          maxRecords: 1
        })
        .firstPage();
      
      const entityData = {
        id: transformedData.id,
        tipo: transformedData.tipo,
        entidad: transformedData.entidad,
        titulo_rol: transformedData.titulo_rol,
        fecha_inicio: transformedData.fecha_inicio,
        fecha_fin: transformedData.fecha_fin,
        actual: transformedData.actual
      };
      
      let entityRecordId;
      
      if (existingRecords.length > 0) {
        // Actualizar
        console.log('  Updating existing entity...');
        const updated = await this.base(this.TABLES.ENTITIES).update([
          {
            id: existingRecords[0].id,
            fields: entityData
          }
        ]);
        entityRecordId = updated[0].id;
      } else {
        // Crear
        console.log('  Creating new entity...');
        const created = await this.base(this.TABLES.ENTITIES).create([
          { fields: entityData }
        ]);
        entityRecordId = created[0].id;
      }
      
      // Sincronizar logros
      await this.syncLogros(entityRecordId, transformedData.id, transformedData.logros);
      
      console.log(`✅ Entity synced: ${transformedData.id}`);
      
    } catch (error) {
      console.error('❌ Failed to upsert entity:', error.message);
      throw error;
    }
  }
  
  /**
   * Sincroniza los logros de una entidad
   * @param {string} entityRecordId - Record ID de la entidad en Airtable
   * @param {string} entityId - ID de la entidad
   * @param {array} logros - Array de logros transformados
   */
  async syncLogros(entityRecordId, entityId, logros) {
    if (!logros || logros.length === 0) return;
    
    console.log(`  Syncing ${logros.length} logros...`);
    
    try {
      // Obtener logros existentes de esta entidad
      const existingLogros = await this.base(this.TABLES.LOGROS)
        .select({
          filterByFormula: `SEARCH('${entityRecordId}', ARRAYJOIN({entity}))`,
          fields: ['id']
        })
        .all();
      
      const existingLogroIds = new Set(existingLogros.map(r => r.get('id')));
      
      for (const logro of logros) {
        // Resolver tags a Record IDs
        const tagRecordIds = await this.resolveTagRecordIds(logro.tags_relacionados);
        
        const logroData = {
          id: logro.id,
          descripcion: logro.descripcion,
          entity: [entityRecordId],
          tags: tagRecordIds
        };
        
        if (existingLogroIds.has(logro.id)) {
          // Actualizar
          const existingRecord = existingLogros.find(r => r.get('id') === logro.id);
          await this.base(this.TABLES.LOGROS).update([
            {
              id: existingRecord.id,
              fields: logroData
            }
          ]);
        } else {
          // Crear
          await this.base(this.TABLES.LOGROS).create([
            { fields: logroData }
          ]);
        }
      }
      
      console.log(`  ✅ Logros synced`);
      
    } catch (error) {
      console.error('❌ Failed to sync logros:', error.message);
      throw error;
    }
  }
  
  /**
   * Sincroniza una entidad completa (método principal)
   * @param {object} transformedData - Datos transformados
   */
  async sync(transformedData) {
    await this.upsertEntity(transformedData);
  }
}
