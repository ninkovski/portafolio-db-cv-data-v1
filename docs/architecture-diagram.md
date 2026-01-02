# Diagrama de Arquitectura - Motor de Sincronización Data-as-Code

## Flujo Principal de Sincronización

```mermaid
graph TB
    subgraph "📂 Git Repository"
        A[inputs/*.json<br/>Input Universal] 
        B[catalog-tags.json<br/>Catálogo Maestro]
        C[data-master/<br/>Archivos Procesados]
    end
    
    subgraph "⚙️ GitHub Actions"
        D[Workflow Trigger<br/>on: push inputs/*.json]
        E[Setup Node.js 20]
        F[Install Dependencies<br/>npm ci]
    end
    
    subgraph "🎯 Sync Manager"
        G[Load Configuration<br/>ENV Variables]
        H[Initialize Adapters]
        I[Load Catalog]
        J{Validate JSON<br/>Schema Check}
        K[Transform Data]
        L{Sync Success?}
    end
    
    subgraph "🔄 Adapters Layer"
        M[Airtable Adapter<br/>Bootstrap & Upsert]
        N[Cosmos Adapter<br/>Enrich & Upsert]
    end
    
    subgraph "💾 Data Stores"
        O[(Airtable Base<br/>Relational)]
        P[(Azure Cosmos DB<br/>Document Store)]
    end
    
    subgraph "📋 Post Processing"
        Q[Move to data-master/]
        R[Git Commit & Push<br/>skip ci]
    end
    
    %% Flow connections
    A -->|Push Event| D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    B --> I
    I --> J
    J -->|Invalid| S[❌ Fail & Log Errors]
    J -->|Valid| K
    K --> M
    K --> N
    M --> O
    N --> P
    M --> L
    N --> L
    L -->|Success| Q
    L -->|Failure| S
    Q --> R
    R --> C
    
    %% Styling
    classDef gitClass fill:#f9f,stroke:#333,stroke-width:2px
    classDef actionClass fill:#9cf,stroke:#333,stroke-width:2px
    classDef syncClass fill:#fc9,stroke:#333,stroke-width:2px
    classDef adapterClass fill:#9f9,stroke:#333,stroke-width:2px
    classDef dataClass fill:#f99,stroke:#333,stroke-width:2px
    classDef errorClass fill:#f66,stroke:#333,stroke-width:2px
    
    class A,B,C gitClass
    class D,E,F actionClass
    class G,H,I,J,K,L syncClass
    class M,N adapterClass
    class O,P dataClass
    class S errorClass
```

## Patrón Adapter - Vista Detallada

```mermaid
classDiagram
    class SyncManager {
        +config: Config
        +catalog: Catalog
        +adapters: Adapter[]
        +run() void
        +initializeAdapters() void
        +processFile(path) boolean
    }
    
    class BaseAdapter {
        <<interface>>
        +sync(data) void
    }
    
    class AirtableAdapter {
        -apiKey: string
        -baseId: string
        -base: AirtableBase
        +bootstrap() void
        +syncCatalog(catalog) void
        +upsertEntity(data) void
        +resolveTagRecordIds(ids) string[]
        +syncLogros(entityId, logros) void
    }
    
    class CosmosAdapter {
        -connectionString: string
        -databaseName: string
        -containerName: string
        -client: CosmosClient
        +initialize() void
        +enrichDocument(data, catalog) object
        +upsert(document) void
        +queryByType(tipo) array
    }
    
    class Validator {
        +validateEntity(entity, catalog) ValidationResult
        +validateFile(path, catalog) ValidationResult
        +loadCatalog(path) Catalog
    }
    
    class Transformers {
        +toAirtable(input) object
        +toCosmos(input) object
        +extractUniqueTagIds(input) string[]
        +createExecutiveSummary(input) object
    }
    
    SyncManager --> BaseAdapter : uses
    BaseAdapter <|-- AirtableAdapter : implements
    BaseAdapter <|-- CosmosAdapter : implements
    SyncManager --> Validator : uses
    SyncManager --> Transformers : uses
    AirtableAdapter --> Transformers : uses toAirtable()
    CosmosAdapter --> Transformers : uses toCosmos()
```

## Flujo de Transformación de Datos

```mermaid
flowchart LR
    subgraph "Input Universal"
        A[JSON File<br/>experiencia-ntt.json]
    end
    
    subgraph "Validation"
        B{Schema Valid?}
        C{Tags in Catalog?}
    end
    
    subgraph "Transformation"
        D[toAirtable<br/>Flatten Structure]
        E[toCosmos<br/>Enrich with Metadata]
    end
    
    subgraph "Airtable Format"
        F[Entity Record<br/>id, tipo, entidad, rol]
        G[Logros Records<br/>descripcion, tags links]
    end
    
    subgraph "Cosmos Format"
        H[Document<br/>Hierarchical Structure]
        I[Enriched Tags<br/>Full Tag Objects]
        J[Metadata<br/>timestamps, durations]
    end
    
    A --> B
    B -->|Yes| C
    B -->|No| K[❌ Reject]
    C -->|Yes| D
    C -->|No| K
    C --> E
    D --> F
    D --> G
    E --> H
    E --> I
    E --> J
```

## Modelo de Datos - Relacional vs Documental

```mermaid
erDiagram
    CATALOG_TAGS ||--o{ LOGROS : references
    ENTITIES ||--o{ LOGROS : contains
    
    CATALOG_TAGS {
        string id PK
        string nombre
        string categoria
        string nivel
    }
    
    ENTITIES {
        string id PK
        string tipo
        string entidad
        string titulo_rol
        date fecha_inicio
        date fecha_fin
        boolean actual
    }
    
    LOGROS {
        string id PK
        string descripcion
        string entity_id FK
        string[] tag_ids FK
    }
```

### Cosmos DB Document Structure

```mermaid
graph LR
    A[Document Root] --> B[id: string]
    A --> C[tipo: EXPERIENCIA]
    A --> D[header: object]
    A --> E[bloques_logros: array]
    A --> F[_metadata: object]
    
    D --> D1[entidad]
    D --> D2[titulo_rol]
    D --> D3[periodo]
    
    E --> E1[Logro 1]
    E --> E2[Logro 2]
    E --> E3[Logro N]
    
    E1 --> E1A[id]
    E1 --> E1B[descripcion]
    E1 --> E1C[tags_enriquecidos]
    
    E1C --> T1[Tag Object 1]
    E1C --> T2[Tag Object 2]
    
    T1 --> T1A[id: t-java11]
    T1 --> T1B[nombre: Java 11]
    T1 --> T1C[categoria: Language]
    T1 --> T1D[nivel: Avanzado]
    
    F --> F1[last_updated]
    F --> F2[sync_version]
    F --> F3[source]
```

## Secuencia de Sincronización Completa

```mermaid
sequenceDiagram
    actor Dev as Developer
    participant Git as Git Repository
    participant GHA as GitHub Actions
    participant SM as Sync Manager
    participant Val as Validator
    participant AT as Airtable Adapter
    participant CD as Cosmos Adapter
    participant AIR as Airtable
    participant COS as Cosmos DB
    
    Dev->>Git: git push inputs/experiencia.json
    Git->>GHA: Trigger workflow
    
    GHA->>GHA: Setup Node.js
    GHA->>GHA: npm ci
    GHA->>SM: node sync-manager.js
    
    SM->>SM: Load configuration
    SM->>AT: Initialize adapter
    SM->>CD: Initialize adapter
    
    AT->>AIR: Verify tables exist
    AIR-->>AT: Tables OK
    AT->>AIR: Sync catalog tags
    
    CD->>COS: Create DB & Container
    COS-->>CD: Ready
    
    SM->>Val: Validate experiencia.json
    Val->>Val: Check schema
    Val->>Val: Verify tags in catalog
    Val-->>SM: ✓ Valid
    
    SM->>AT: Transform to Airtable format
    AT->>AIR: Upsert Entity
    AT->>AIR: Upsert Logros
    AIR-->>AT: Success
    
    SM->>CD: Transform to Cosmos format
    CD->>CD: Enrich with tags
    CD->>COS: Upsert document
    COS-->>CD: Success (RU: 10.5)
    
    SM-->>GHA: ✓ Sync completed
    
    GHA->>Git: mv inputs/ → data-master/
    GHA->>Git: git commit & push
    
    Git-->>Dev: ✓ Pipeline completed
```

## Estrategia de Particionamiento en Cosmos DB

```mermaid
graph TB
    subgraph "Partition Strategy"
        A[Partition Key: /tipo]
    end
    
    subgraph "Physical Partitions"
        B[Partition: EXPERIENCIA<br/>20GB limit per logical partition]
        C[Partition: EDUCACION<br/>20GB limit per logical partition]
        D[Partition: PROYECTO<br/>20GB limit per logical partition]
    end
    
    subgraph "Benefits"
        E[Even Distribution]
        F[Efficient Queries]
        G[No Hot Partitions]
        H[Scalable]
    end
    
    A --> B
    A --> C
    A --> D
    B --> E
    C --> F
    D --> G
    E --> H
    F --> H
    G --> H
```

## Diagrama de Componentes del Sistema

```mermaid
graph TB
    subgraph "Frontend Layer (Future)"
        UI[Web Dashboard<br/>Visualization]
    end
    
    subgraph "Data Sources"
        GIT[Git Repository<br/>Source of Truth]
        AT[Airtable<br/>Human Interface]
        CD[Cosmos DB<br/>API Backend]
    end
    
    subgraph "Sync Engine"
        SM[Sync Manager]
        VAL[Validator]
        TRANS[Transformers]
        ADA[Adapters]
    end
    
    subgraph "Automation"
        GHA[GitHub Actions<br/>CI/CD Pipeline]
    end
    
    subgraph "Catalog"
        CAT[catalog-tags.json<br/>Master Data]
    end
    
    GIT -->|Triggers| GHA
    GHA -->|Executes| SM
    CAT -->|Loads| SM
    SM --> VAL
    SM --> TRANS
    SM --> ADA
    ADA -->|Sync| AT
    ADA -->|Sync| CD
    AT -.->|Future| UI
    CD -.->|Future| UI
```

---

## Leyenda de Símbolos

- 🔄 **Adapters**: Conectores específicos para cada plataforma
- ✅ **Validator**: Verificación de esquemas y datos
- 🔀 **Transformers**: Mapeo entre formatos
- 📊 **Catalog**: Diccionario maestro de tags
- 💾 **Data Stores**: Bases de datos destino
- ⚙️ **Automation**: GitHub Actions
- 📂 **Git**: Sistema de versionamiento

## Referencias

- [Azure Cosmos DB Best Practices](https://learn.microsoft.com/azure/cosmos-db/)
- [Airtable API Documentation](https://airtable.com/developers/web/api/introduction)
- [GitHub Actions Workflow Syntax](https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions)
