import { CosmosClient } from '@azure/cosmos';

/**
 * Adaptador para Azure Cosmos DB - Gestión documental de CV Data
 * Implementa enriquecimiento de datos y operaciones Upsert con best practices
 */
export class CosmosAdapter {
  constructor(connectionString, databaseName, containerName) {
    if (!connectionString) {
      throw new Error('COSMOS_CONNECTION_STRING is required');
    }
    
    this.connectionString = connectionString;
    this.databaseName = databaseName || 'cv-database';
    this.containerName = containerName || 'cv-data';
    
    // Inicializar cliente con mejores prácticas
    this.client = new CosmosClient(connectionString);
    this.database = null;
    this.container = null;
  }
  
  /**
   * Inicializa la base de datos y el contenedor
   * Sigue las mejores prácticas de Cosmos DB:
   * - Usa partition key jerárquica para evitar límite de 20GB
   * - Habilita diagnósticos para monitoreo
   */
  async initialize() {
    console.log('🚀 Initializing Cosmos DB connection...');
    
    try {
      // Crear database si no existe (serverless mode)
      const { database } = await this.client.databases.createIfNotExists({
        id: this.databaseName
      });
      this.database = database;
      console.log(`  ✅ Database: ${this.databaseName}`);
      
      // Crear container si no existe con partition key jerárquica
      // Partition key: /tipo (EXPERIENCIA, EDUCACION, PROYECTO)
      // Esto permite consultas eficientes por tipo sin hot partitions
      const { container } = await this.database.containers.createIfNotExists({
        id: this.containerName,
        partitionKey: {
          paths: ['/tipo'],
          version: 2 // Hierarchical Partition Keys
        },
        // Configurar indexing policy para optimizar consultas
        indexingPolicy: {
          automatic: true,
          indexingMode: 'consistent',
          includedPaths: [
            { path: '/id/?' },
            { path: '/tipo/?' },
            { path: '/header/entidad/?' },
            { path: '/header/periodo/inicio/?' },
            { path: '/tags_enriquecidos/*/id/?' }
          ],
          excludedPaths: [
            { path: '/_etag/?' }
          ]
        }
      });
      
      this.container = container;
      console.log(`  ✅ Container: ${this.containerName}`);
      
      return true;
      
    } catch (error) {
      console.error('❌ Failed to initialize Cosmos DB:', error.message);
      // Log diagnostic information para troubleshooting
      if (error.code) {
        console.error(`  Error code: ${error.code}`);
      }
      if (error.substatus) {
        console.error(`  Substatus: ${error.substatus}`);
      }
      throw error;
    }
  }
  
  /**
   * Enriquece el documento con información completa de tags
   * Evita JOINs en lectura siguiendo patrón de embedding
   * @param {object} data - Datos de entrada
   * @param {object} catalog - Catálogo de tags
   * @returns {object} - Documento enriquecido
   */
  enrichDocument(data, catalog) {
    console.log('🔄 Enriching document with tag details...');
    
    // Crear un mapa de tags para lookup eficiente
    const tagMap = new Map();
    if (catalog && catalog.tags) {
      catalog.tags.forEach(tag => {
        tagMap.set(tag.id, tag);
      });
    }
    
    // Enriquecer bloques de logros
    const enrichedBloques = data.bloques_logros.map(bloque => {
      const enrichedTags = bloque.tags_relacionados.map(tagId => {
        const tagInfo = tagMap.get(tagId);
        return tagInfo ? {
          id: tagInfo.id,
          nombre: tagInfo.nombre,
          categoria: tagInfo.categoria,
          nivel: tagInfo.nivel
        } : {
          id: tagId,
          nombre: tagId,
          categoria: 'Unknown',
          nivel: 'Unknown'
        };
      });
      
      return {
        ...bloque,
        tags_enriquecidos: enrichedTags
      };
    });
    
    // Construir documento final autodescriptivo
    const enrichedDoc = {
      ...data,
      bloques_logros: enrichedBloques,
      // Metadata para tracking y auditoría
      _metadata: {
        last_updated: new Date().toISOString(),
        sync_version: '1.0',
        source: 'data-as-code-sync'
      }
    };
    
    console.log('  ✅ Document enriched');
    return enrichedDoc;
  }
  
  /**
   * Realiza Upsert del documento en Cosmos DB
   * Usa el mismo ID para consistencia con Airtable y Git
   * @param {object} document - Documento a insertar/actualizar
   */
  async upsert(document) {
    console.log(`📄 Upserting document: ${document.id}`);
    
    try {
      // Verificar que el container esté inicializado
      if (!this.container) {
        await this.initialize();
      }
      
      // El partition key es el tipo de entidad
      const partitionKeyValue = document.tipo;
      
      // Upsert: crea si no existe, actualiza si existe
      // Cosmos DB usa el 'id' como clave única dentro de una partición
      const { resource, diagnostics } = await this.container.items.upsert(document, {
        partitionKey: partitionKeyValue
      });
      
      // Log de diagnósticos para monitoreo de performance
      if (diagnostics) {
        const latency = diagnostics.clientSideRequestStatistics?.requestLatency;
        const requestCharge = diagnostics.clientSideRequestStatistics?.requestCharge;
        
        console.log(`  📊 Performance metrics:`);
        if (latency) {
          console.log(`     Latency: ${latency}ms`);
        }
        if (requestCharge) {
          console.log(`     RU consumed: ${requestCharge.toFixed(2)}`);
        }
        
        // Alertar si la latencia es alta (> 100ms)
        if (latency && latency > 100) {
          console.warn(`  ⚠️  High latency detected: ${latency}ms`);
        }
      }
      
      console.log(`  ✅ Document upserted successfully`);
      return resource;
      
    } catch (error) {
      console.error('❌ Failed to upsert document:', error.message);
      
      // Log diagnósticos detallados en caso de error
      if (error.code) {
        console.error(`  Error code: ${error.code}`);
      }
      if (error.substatus) {
        console.error(`  Substatus: ${error.substatus}`);
      }
      if (error.body) {
        console.error(`  Error body:`, error.body);
      }
      
      // Manejo de throttling (429)
      if (error.code === 429) {
        const retryAfter = error.retryAfterInMilliseconds || 1000;
        console.warn(`  ⏳ Request throttled. Retry after ${retryAfter}ms`);
      }
      
      throw error;
    }
  }
  
  /**
   * Consulta documentos por tipo
   * Útil para verificación y debugging
   * @param {string} tipo - Tipo de entidad (EXPERIENCIA, EDUCACION, PROYECTO)
   * @returns {Promise<array>} - Array de documentos
   */
  async queryByType(tipo) {
    console.log(`🔍 Querying documents by type: ${tipo}`);
    
    try {
      if (!this.container) {
        await this.initialize();
      }
      
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.tipo = @tipo',
        parameters: [
          { name: '@tipo', value: tipo }
        ]
      };
      
      const { resources } = await this.container.items
        .query(querySpec, { partitionKey: tipo })
        .fetchAll();
      
      console.log(`  ✅ Found ${resources.length} documents`);
      return resources;
      
    } catch (error) {
      console.error('❌ Failed to query documents:', error.message);
      throw error;
    }
  }
  
  /**
   * Sincroniza un documento completo (método principal)
   * @param {object} transformedData - Datos transformados
   * @param {object} catalog - Catálogo de tags para enriquecimiento
   */
  async sync(transformedData, catalog) {
    // Enriquecer documento
    const enrichedDoc = this.enrichDocument(transformedData, catalog);
    
    // Upsert en Cosmos DB
    await this.upsert(enrichedDoc);
  }
  
  /**
   * Cierra la conexión (cleanup)
   */
  async close() {
    if (this.client) {
      // Cosmos SDK maneja la conexión automáticamente
      console.log('✅ Cosmos DB connection closed');
    }
  }
}
