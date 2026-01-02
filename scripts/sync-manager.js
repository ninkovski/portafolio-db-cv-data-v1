#!/usr/bin/env node

/**
 * Sync Manager - Motor de Sincronización "Data-as-Code"
 * Orquesta la sincronización de CV Data desde Git a Airtable y Cosmos DB
 * 
 * Implementa el patrón Adapter para máxima flexibilidad y mantenibilidad
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateFile, loadCatalog } from './utils/validator.js';
import { toAirtable, toCosmos, createExecutiveSummary } from './transformers.js';
import { AirtableAdapter } from './adapters/airtable.js';
import { CosmosAdapter } from './adapters/cosmos.js';

// Resolver __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Clase base para adaptadores (patrón Adapter)
 */
class BaseAdapter {
  async sync(data) {
    throw new Error('sync() must be implemented by subclass');
  }
}

/**
 * Configuración del manager
 */
class SyncManager {
  constructor() {
    this.config = this.loadConfig();
    this.version = this.loadVersion();
    this.catalog = null;
    this.adapters = [];
    this.processedFiles = [];
    this.errors = [];
  }
  
  /**
   * Carga la versión desde package.json
   */
  loadVersion() {
    try {
      const packagePath = path.resolve(__dirname, '../package.json');
      const content = fs.readFileSync(packagePath, 'utf-8');
      const pkg = JSON.parse(content);
      return pkg.version;
    } catch (error) {
      return 'unknown';
    }
  }
  
  /**
   * Carga la configuración desde variables de entorno
   */
  loadConfig() {
    const config = {
      // Directorios
      inputDir: path.resolve(__dirname, '../inputs'),
      catalogPath: path.resolve(__dirname, '../catalog-tags.json'),
      
      // Airtable
      airtable: {
        apiKey: process.env.AIRTABLE_API_KEY,
        baseId: process.env.AIRTABLE_BASE_ID
      },
      
      // Cosmos DB
      cosmos: {
        connectionString: process.env.COSMOS_CONNECTION_STRING,
        databaseName: process.env.COSMOS_DATABASE_NAME || 'cv-database',
        containerName: process.env.COSMOS_CONTAINER_NAME || 'cv-data'
      }
    };
    
    // Validar configuración requerida
    const requiredVars = [
      'AIRTABLE_API_KEY',
      'AIRTABLE_BASE_ID',
      'COSMOS_CONNECTION_STRING'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    
    return config;
  }
  
  /**
   * Inicializa los adaptadores
   */
  async initializeAdapters() {
    console.log('\n🔧 Initializing adapters...\n');
    
    try {
      // Cargar catálogo de tags
      console.log('📚 Loading catalog...');
      this.catalog = loadCatalog(this.config.catalogPath);
      
      if (!this.catalog) {
        throw new Error('Failed to load catalog. Please ensure catalog-tags.json exists.');
      }
      console.log(`  ✅ Loaded ${this.catalog.tags.length} tags\n`);
      
      // Inicializar Airtable Adapter
      console.log('🔗 Initializing Airtable adapter...');
      const airtableAdapter = new AirtableAdapter(
        this.config.airtable.apiKey,
        this.config.airtable.baseId
      );
      
      // Bootstrap de Airtable (verificar tablas)
      await airtableAdapter.bootstrap();
      
      // Sincronizar catálogo de tags
      await airtableAdapter.syncCatalog(this.catalog);
      
      this.adapters.push({
        name: 'Airtable',
        adapter: airtableAdapter,
        transform: toAirtable
      });
      console.log('  ✅ Airtable ready\n');
      
      // Inicializar Cosmos DB Adapter
      console.log('🌐 Initializing Cosmos DB adapter...');
      const cosmosAdapter = new CosmosAdapter(
        this.config.cosmos.connectionString,
        this.config.cosmos.databaseName,
        this.config.cosmos.containerName
      );
      
      await cosmosAdapter.initialize();
      
      this.adapters.push({
        name: 'CosmosDB',
        adapter: cosmosAdapter,
        transform: toCosmos
      });
      console.log('  ✅ Cosmos DB ready\n');
      
      console.log(`✅ ${this.adapters.length} adapters initialized successfully\n`);
      
    } catch (error) {
      console.error('❌ Failed to initialize adapters:', error.message);
      throw error;
    }
  }
  
  /**
   * Obtiene la lista de archivos JSON a procesar
   * Lee desde inputs/data/ (solo archivos de datos, no esquemas)
   */
  getInputFiles() {
    try {
      const dataDir = path.join(this.config.inputDir, 'data');
      
      if (!fs.existsSync(dataDir)) {
        console.log('⚠️  Data directory does not exist. Creating...');
        fs.mkdirSync(dataDir, { recursive: true });
        return [];
      }
      
      const files = fs.readdirSync(dataDir)
        .filter(file => file.endsWith('.json'))
        .map(file => path.join(dataDir, file));
      
      return files;
      
    } catch (error) {
      console.error('❌ Failed to read data directory:', error.message);
      return [];
    }
  }
  
  /**
   * Procesa un archivo de entrada
   */
  async processFile(filePath) {
    const fileName = path.basename(filePath);
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📄 Processing: ${fileName}`);
    console.log('='.repeat(60));
    
    try {
      // 1. Validar archivo
      console.log('\n1️⃣  Validating file...');
      const validation = validateFile(filePath, this.catalog);
      
      if (!validation.valid) {
        console.error('❌ Validation failed:');
        validation.errors.forEach(error => console.error(`  - ${error}`));
        this.errors.push({ file: fileName, errors: validation.errors });
        return false;
      }
      
      console.log('  ✅ Validation passed');
      
      const inputData = validation.data;
      
      // Mostrar resumen ejecutivo
      const summary = createExecutiveSummary(inputData);
      console.log('\n📊 Executive Summary:');
      console.log(`  - ${summary.titulo}`);
      console.log(`  - ${summary.periodo}`);
      console.log(`  - ${summary.total_logros} logros`);
      console.log(`  - ${summary.tecnologias_count} tecnologías`);
      
      // 2. Sincronizar con cada adapter
      console.log('\n2️⃣  Syncing with adapters...\n');
      
      for (const { name, adapter, transform } of this.adapters) {
        try {
          console.log(`🔄 Syncing with ${name}...`);
          
          // Transformar datos según el formato del adapter
          const transformedData = transform(inputData);
          
          // Sincronizar
          if (name === 'CosmosDB') {
            // Cosmos necesita el catálogo para enriquecimiento
            await adapter.sync(transformedData, this.catalog);
          } else {
            await adapter.sync(transformedData);
          }
          
          console.log(`  ✅ ${name} sync completed\n`);
          
        } catch (adapterError) {
          console.error(`  ❌ ${name} sync failed:`, adapterError.message);
          this.errors.push({
            file: fileName,
            adapter: name,
            error: adapterError.message
          });
          throw adapterError; // Propagar para detener el proceso
        }
      }
      
      this.processedFiles.push(fileName);
      console.log(`\n✅ File processed successfully: ${fileName}`);
      return true;
      
    } catch (error) {
      console.error(`\n❌ Failed to process file ${fileName}:`, error.message);
      this.errors.push({
        file: fileName,
        error: error.message
      });
      return false;
    }
  }
  
  /**
   * Ejecuta el proceso de sincronización completo
   */
  async run() {
    const startTime = Date.now();
    
    console.log('\n' + '='.repeat(60));
    console.log('🚀 CV DATA SYNC MANAGER - Data-as-Code Pipeline');
    console.log(`📌 Version: v${this.version}`);
    console.log('='.repeat(60));
    
    try {
      // 1. Inicializar adaptadores
      await this.initializeAdapters();
      
      // 2. Obtener archivos de entrada
      const inputFiles = this.getInputFiles();
      
      if (inputFiles.length === 0) {
        console.log('\n⚠️  No input files found to process.');
        console.log('   Place JSON files in the inputs/ directory to sync.\n');
        return;
      }
      
      console.log(`\n📂 Found ${inputFiles.length} file(s) to process:\n`);
      inputFiles.forEach(file => console.log(`  - ${path.basename(file)}`));
      
      // 3. Procesar cada archivo
      console.log('\n' + '='.repeat(60));
      console.log('⚙️  PROCESSING FILES');
      console.log('='.repeat(60));
      
      for (const file of inputFiles) {
        const success = await this.processFile(file);
        
        if (!success) {
          throw new Error(`Failed to process ${path.basename(file)}`);
        }
      }
      
      // 4. Resumen final
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.log('\n' + '='.repeat(60));
      console.log('✅ SYNC COMPLETED SUCCESSFULLY');
      console.log('='.repeat(60));
      console.log(`\n📊 Summary:`);
      console.log(`  - Files processed: ${this.processedFiles.length}`);
      console.log(`  - Adapters used: ${this.adapters.length}`);
      console.log(`  - Duration: ${duration}s`);
      console.log(`  - Errors: ${this.errors.length}`);
      
      if (this.processedFiles.length > 0) {
        console.log(`\n📁 Processed files:`);
        this.processedFiles.forEach(file => console.log(`  ✓ ${file}`));
      }
      
      console.log('\n📌 To manage versions:');
      console.log('  npm run version:check     - View current version');
      console.log('  npm run version:bump      - Bump version (patch|minor|major)');
      console.log('  npm run changelog:view    - View changelog');
      console.log('\n💡 Next step: Files will be moved to data-master/ by GitHub Actions\n');
      
    } catch (error) {
      console.error('\n' + '='.repeat(60));
      console.error('❌ SYNC FAILED');
      console.error('='.repeat(60));
      console.error(`\nError: ${error.message}\n`);
      
      if (this.errors.length > 0) {
        console.error('Detailed errors:');
        this.errors.forEach((err, index) => {
          console.error(`\n${index + 1}. ${err.file}`);
          if (err.adapter) {
            console.error(`   Adapter: ${err.adapter}`);
          }
          if (err.errors) {
            err.errors.forEach(e => console.error(`   - ${e}`));
          } else if (err.error) {
            console.error(`   - ${err.error}`);
          }
        });
      }
      
      console.error('');
      process.exit(1);
    }
  }
}

// Ejecutar el manager
const manager = new SyncManager();
manager.run();
