# ⚡ ETL Visual Designer

A full-stack web application for visually designing ETL pipelines using drag-and-drop, configuring properties on each node, and generating **Apache Spark (PySpark)** code from the pipeline.

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | JavaScript, React, React Flow |
| **Backend** | Java 17, Spring Boot 3.x |
| **Code Generation** | Java-based PySpark code generator |
| **Build Tools** | Maven (backend), Vite + npm (frontend) |

## Prerequisites

- Java 17+
- Node.js 18+
- Maven 3.8+

## Project Structure

```
etl-visual-designer/
├── backend/                          # Spring Boot Java backend
│   ├── pom.xml
│   └── src/main/java/com/etldesigner/
│       ├── EtlDesignerApplication.java
│       ├── controller/PipelineController.java
│       ├── model/
│       │   ├── PipelineRequest.java
│       │   ├── NodeConfig.java
│       │   └── EdgeConfig.java
│       └── service/SparkCodeGeneratorService.java
└── frontend/                         # React frontend
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── App.css
        ├── components/
        │   ├── Sidebar.jsx
        │   ├── Canvas.jsx
        │   ├── PropertiesPanel.jsx
        │   ├── CodeModal.jsx
        │   └── nodes/
        │       ├── SourceNode.jsx
        │       ├── TransformNode.jsx
        │       └── SinkNode.jsx
        └── services/api.js
```

## Setup & Running

### 1. Start the Backend

```bash
cd backend
mvn spring-boot:run
```

The backend will start on **http://localhost:8080**.

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on **http://localhost:5173**.

## How to Use

1. **Drag nodes** from the left sidebar onto the canvas (Sources, Transforms, Sinks)
2. **Connect nodes** by dragging from one node's output handle to another's input handle
3. **Click a node** to select it and edit its properties in the right panel
4. **Click "🚀 Generate Spark Code"** in the top bar to call the backend and view the generated PySpark code in a modal
5. **Copy** the generated code using the Copy button

## Supported Node Types

### Sources
| Type | Description |
|---|---|
| `csv_source` | Read CSV files from a path |
| `jdbc_source` | Read from a JDBC database |
| `kafka_source` | Read from a Kafka topic |

### Transforms
| Type | Description |
|---|---|
| `filter` | Filter rows by condition |
| `select` | Select specific columns |
| `join` | Join two DataFrames |
| `group_by` | Group and aggregate |
| `rename` | Rename a column |

### Sinks
| Type | Description |
|---|---|
| `csv_sink` | Write to CSV |
| `parquet_sink` | Write to Parquet |
| `jdbc_sink` | Write to a JDBC database |

## Example Generated PySpark Code

```python
from pyspark.sql import SparkSession
from pyspark.sql import functions as F

spark = SparkSession.builder.appName("ETL_Pipeline").getOrCreate()

# --- Node: CSV Source ---
df_node_1 = spark.read.option("header", "true").option("delimiter", ",").csv("/data/input.csv")

# --- Node: Filter ---
df_node_2 = df_node_1.filter("age > 18")

# --- Node: CSV Sink ---
df_node_2.write.mode("overwrite").csv("/data/output.csv")

spark.stop()
```

## API Endpoints

| Method | URL | Description |
|---|---|---|
| `POST` | `/api/pipeline/generate` | Generate PySpark code from pipeline |
| `GET` | `/api/pipeline/node-types` | Get available node types and metadata |
