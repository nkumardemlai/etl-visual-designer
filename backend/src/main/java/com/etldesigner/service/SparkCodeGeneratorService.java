package com.etldesigner.service;

import com.etldesigner.model.EdgeConfig;
import com.etldesigner.model.NodeConfig;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class SparkCodeGeneratorService {

    public String generateCode(List<NodeConfig> nodes, List<EdgeConfig> edges) {
        // Build adjacency map: nodeId -> list of child nodeIds
        Map<String, List<String>> childrenMap = new LinkedHashMap<>();
        Map<String, List<String>> parentsMap = new LinkedHashMap<>();
        Map<String, NodeConfig> nodeMap = new LinkedHashMap<>();

        for (NodeConfig node : nodes) {
            nodeMap.put(node.getId(), node);
            childrenMap.put(node.getId(), new ArrayList<>());
            parentsMap.put(node.getId(), new ArrayList<>());
        }

        for (EdgeConfig edge : edges) {
            childrenMap.computeIfAbsent(edge.getSource(), k -> new ArrayList<>()).add(edge.getTarget());
            parentsMap.computeIfAbsent(edge.getTarget(), k -> new ArrayList<>()).add(edge.getSource());
        }

        // Topological sort
        List<String> sorted = topologicalSort(nodeMap.keySet(), childrenMap);

        StringBuilder sb = new StringBuilder();
        sb.append("from pyspark.sql import SparkSession\n\n");
        sb.append("spark = SparkSession.builder.appName(\"ETL_Pipeline\").getOrCreate()\n\n");

        for (String nodeId : sorted) {
            NodeConfig node = nodeMap.get(nodeId);
            if (node == null) continue;

            String safeId = nodeId.replaceAll("[^a-zA-Z0-9_]", "_");
            String viewName = safeId;
            sb.append("# --- Node: ").append(node.getLabel()).append(" ---\n");
            sb.append(generateNodeCode(node, safeId, viewName, parentsMap.get(nodeId), nodeMap));
            sb.append("\n");
        }

        sb.append("spark.stop()\n");
        return sb.toString();
    }

    private List<String> topologicalSort(Set<String> nodeIds, Map<String, List<String>> childrenMap) {
        Map<String, Integer> inDegree = new LinkedHashMap<>();
        for (String id : nodeIds) {
            inDegree.put(id, 0);
        }
        for (Map.Entry<String, List<String>> entry : childrenMap.entrySet()) {
            for (String child : entry.getValue()) {
                inDegree.merge(child, 1, Integer::sum);
            }
        }

        Queue<String> queue = new LinkedList<>();
        for (Map.Entry<String, Integer> entry : inDegree.entrySet()) {
            if (entry.getValue() == 0) {
                queue.add(entry.getKey());
            }
        }

        List<String> result = new ArrayList<>();
        while (!queue.isEmpty()) {
            String current = queue.poll();
            result.add(current);
            List<String> children = childrenMap.getOrDefault(current, Collections.emptyList());
            for (String child : children) {
                int degree = inDegree.merge(child, -1, Integer::sum);
                if (degree == 0) {
                    queue.add(child);
                }
            }
        }

        // Append any nodes not in the sorted result (e.g. cycles or disconnected)
        for (String id : nodeIds) {
            if (!result.contains(id)) {
                result.add(id);
            }
        }
        return result;
    }

    private String generateNodeCode(NodeConfig node, String safeId, String viewName,
                                    List<String> parentIds, Map<String, NodeConfig> nodeMap) {
        Map<String, Object> props = node.getProperties();
        if (props == null) props = Collections.emptyMap();

        String type = node.getType();
        StringBuilder sb = new StringBuilder();

        switch (type) {
            // --- Sources: read data and register as temp view ---
            case "csv_source" -> {
                String path = getStr(props, "filePath", "/data/input.csv");
                String delimiter = getStr(props, "delimiter", ",");
                sb.append("df_").append(safeId).append(" = spark.read")
                  .append(".option(\"header\", \"true\")")
                  .append(".option(\"delimiter\", \"").append(delimiter).append("\")")
                  .append(".csv(\"").append(path).append("\")\n");
                sb.append("df_").append(safeId)
                  .append(".createOrReplaceTempView(\"").append(viewName).append("\")\n");
            }
            case "jdbc_source" -> {
                String url = getStr(props, "url", "jdbc:postgresql://localhost:5432/db");
                String table = getStr(props, "table", "my_table");
                String user = getStr(props, "user", "user");
                String password = getStr(props, "password", "password");
                sb.append("df_").append(safeId).append(" = spark.read")
                  .append(".format(\"jdbc\")")
                  .append(".option(\"url\", \"").append(url).append("\")")
                  .append(".option(\"dbtable\", \"").append(table).append("\")")
                  .append(".option(\"user\", \"").append(user).append("\")")
                  .append(".option(\"password\", \"").append(password).append("\")")
                  .append(".load()\n");
                sb.append("df_").append(safeId)
                  .append(".createOrReplaceTempView(\"").append(viewName).append("\")\n");
            }
            case "kafka_source" -> {
                String servers = getStr(props, "bootstrapServers", "localhost:9092");
                String topic = getStr(props, "topic", "my_topic");
                sb.append("df_").append(safeId).append(" = spark.readStream")
                  .append(".format(\"kafka\")")
                  .append(".option(\"kafka.bootstrap.servers\", \"").append(servers).append("\")")
                  .append(".option(\"subscribe\", \"").append(topic).append("\")")
                  .append(".load()\n");
                sb.append("df_").append(safeId)
                  .append(".createOrReplaceTempView(\"").append(viewName).append("\")\n");
            }

            // --- Transforms: use Spark SQL queries ---
            case "filter" -> {
                String inputView = getInputView(parentIds);
                String condition = getStr(props, "condition", "1=1");
                sb.append("df_").append(safeId)
                  .append(" = spark.sql(\"SELECT * FROM ").append(inputView)
                  .append(" WHERE ").append(condition).append("\")\n");
                sb.append("df_").append(safeId)
                  .append(".createOrReplaceTempView(\"").append(viewName).append("\")\n");
            }
            case "select" -> {
                String inputView = getInputView(parentIds);
                String columns = getStr(props, "columns", "*");
                sb.append("df_").append(safeId)
                  .append(" = spark.sql(\"SELECT ").append(columns)
                  .append(" FROM ").append(inputView).append("\")\n");
                sb.append("df_").append(safeId)
                  .append(".createOrReplaceTempView(\"").append(viewName).append("\")\n");
            }
            case "join" -> {
                String leftView = getInputView(parentIds);
                String rightView = parentIds != null && parentIds.size() > 1
                        ? parentIds.get(1).replaceAll("[^a-zA-Z0-9_]", "_")
                        : "right_table";
                String joinKey = getStr(props, "joinKey", "id");
                String joinType = getStr(props, "joinType", "inner").toUpperCase();
                sb.append("df_").append(safeId)
                  .append(" = spark.sql(\"SELECT * FROM ").append(leftView)
                  .append(" ").append(joinType).append(" JOIN ").append(rightView)
                  .append(" ON ").append(leftView).append(".").append(joinKey)
                  .append(" = ").append(rightView).append(".").append(joinKey)
                  .append("\")\n");
                sb.append("df_").append(safeId)
                  .append(".createOrReplaceTempView(\"").append(viewName).append("\")\n");
            }
            case "group_by" -> {
                String inputView = getInputView(parentIds);
                String groupCols = getStr(props, "groupByColumns", "id");
                String aggregation = getStr(props, "aggregation", "COUNT(*) AS count");
                sb.append("df_").append(safeId)
                  .append(" = spark.sql(\"SELECT ").append(groupCols)
                  .append(", ").append(aggregation)
                  .append(" FROM ").append(inputView)
                  .append(" GROUP BY ").append(groupCols).append("\")\n");
                sb.append("df_").append(safeId)
                  .append(".createOrReplaceTempView(\"").append(viewName).append("\")\n");
            }
            case "rename" -> {
                String inputView = getInputView(parentIds);
                String oldName = getStr(props, "oldName", "old_col");
                String newName = getStr(props, "newName", "new_col");
                sb.append("df_").append(safeId)
                  .append(" = spark.sql(\"SELECT *, ").append(oldName)
                  .append(" AS ").append(newName)
                  .append(" FROM ").append(inputView).append("\")\n");
                sb.append("df_").append(safeId)
                  .append(".createOrReplaceTempView(\"").append(viewName).append("\")\n");
            }

            // --- Sinks: read from temp view via SQL and write output ---
            case "csv_sink" -> {
                String inputView = getInputView(parentIds);
                String outputPath = getStr(props, "outputPath", "/data/output.csv");
                String writeMode = getStr(props, "writeMode", "overwrite");
                sb.append("spark.sql(\"SELECT * FROM ").append(inputView).append("\")")
                  .append(".write.mode(\"").append(writeMode).append("\")")
                  .append(".csv(\"").append(outputPath).append("\")\n");
            }
            case "parquet_sink" -> {
                String inputView = getInputView(parentIds);
                String outputPath = getStr(props, "outputPath", "/data/output.parquet");
                String writeMode = getStr(props, "writeMode", "overwrite");
                sb.append("spark.sql(\"SELECT * FROM ").append(inputView).append("\")")
                  .append(".write.mode(\"").append(writeMode).append("\")")
                  .append(".parquet(\"").append(outputPath).append("\")\n");
            }
            case "jdbc_sink" -> {
                String inputView = getInputView(parentIds);
                String url = getStr(props, "url", "jdbc:postgresql://localhost:5432/db");
                String table = getStr(props, "table", "output_table");
                String user = getStr(props, "user", "user");
                String password = getStr(props, "password", "password");
                String writeMode = getStr(props, "writeMode", "overwrite");
                sb.append("spark.sql(\"SELECT * FROM ").append(inputView).append("\")")
                  .append(".write.format(\"jdbc\")")
                  .append(".option(\"url\", \"").append(url).append("\")")
                  .append(".option(\"dbtable\", \"").append(table).append("\")")
                  .append(".option(\"user\", \"").append(user).append("\")")
                  .append(".option(\"password\", \"").append(password).append("\")")
                  .append(".mode(\"").append(writeMode).append("\")")
                  .append(".save()\n");
            }
            default -> sb.append("# Unsupported node type: ").append(type).append("\n");
        }

        return sb.toString();
    }

    private String getInputView(List<String> parentIds) {
        if (parentIds == null || parentIds.isEmpty()) return "input_table";
        return parentIds.get(0).replaceAll("[^a-zA-Z0-9_]", "_");
    }

    private String getStr(Map<String, Object> props, String key, String defaultValue) {
        Object val = props.get(key);
        if (val == null || val.toString().isBlank()) return defaultValue;
        return val.toString();
    }
}
