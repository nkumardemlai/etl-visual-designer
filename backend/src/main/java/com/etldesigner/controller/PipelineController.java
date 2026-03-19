package com.etldesigner.controller;

import com.etldesigner.model.PipelineRequest;
import com.etldesigner.service.SparkCodeGeneratorService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/pipeline")
public class PipelineController {

    private final SparkCodeGeneratorService codeGeneratorService;

    public PipelineController(SparkCodeGeneratorService codeGeneratorService) {
        this.codeGeneratorService = codeGeneratorService;
    }

    @PostMapping(value = "/generate", produces = MediaType.TEXT_PLAIN_VALUE)
    public String generateCode(@RequestBody PipelineRequest request) {
        return codeGeneratorService.generateCode(request.getNodes(), request.getEdges());
    }

    @GetMapping("/node-types")
    public List<Map<String, Object>> getNodeTypes() {
        List<Map<String, Object>> nodeTypes = new ArrayList<>();

        // Sources
        nodeTypes.add(buildNodeType("csv_source", "CSV Source", "source", "📄",
                List.of(
                        buildProp("filePath", "File Path", "text"),
                        buildProp("delimiter", "Delimiter", "text")
                )));
        nodeTypes.add(buildNodeType("jdbc_source", "JDBC Source", "source", "🗄️",
                List.of(
                        buildProp("url", "JDBC URL", "text"),
                        buildProp("table", "Table", "text"),
                        buildProp("user", "User", "text"),
                        buildProp("password", "Password", "password")
                )));
        nodeTypes.add(buildNodeType("kafka_source", "Kafka Source", "source", "📨",
                List.of(
                        buildProp("bootstrapServers", "Bootstrap Servers", "text"),
                        buildProp("topic", "Topic", "text")
                )));

        // Transforms
        nodeTypes.add(buildNodeType("filter", "Filter", "transform", "🔍",
                List.of(buildProp("condition", "Condition", "text"))));
        nodeTypes.add(buildNodeType("select", "Select", "transform", "✅",
                List.of(buildProp("columns", "Columns (comma-separated)", "text"))));
        nodeTypes.add(buildNodeType("join", "Join", "transform", "🔗",
                List.of(
                        buildProp("joinKey", "Join Key", "text"),
                        buildProp("joinType", "Join Type", "text")
                )));
        nodeTypes.add(buildNodeType("group_by", "Group By", "transform", "📊",
                List.of(
                        buildProp("groupByColumns", "Group By Columns", "text"),
                        buildProp("aggregation", "Aggregation", "text")
                )));
        nodeTypes.add(buildNodeType("rename", "Rename", "transform", "✏️",
                List.of(
                        buildProp("oldName", "Old Column Name", "text"),
                        buildProp("newName", "New Column Name", "text")
                )));

        // Sinks
        nodeTypes.add(buildNodeType("csv_sink", "CSV Sink", "sink", "💾",
                List.of(
                        buildProp("outputPath", "Output Path", "text"),
                        buildProp("writeMode", "Write Mode", "text")
                )));
        nodeTypes.add(buildNodeType("parquet_sink", "Parquet Sink", "sink", "🗜️",
                List.of(
                        buildProp("outputPath", "Output Path", "text"),
                        buildProp("writeMode", "Write Mode", "text")
                )));
        nodeTypes.add(buildNodeType("jdbc_sink", "JDBC Sink", "sink", "🏦",
                List.of(
                        buildProp("url", "JDBC URL", "text"),
                        buildProp("table", "Table", "text"),
                        buildProp("user", "User", "text"),
                        buildProp("password", "Password", "password"),
                        buildProp("writeMode", "Write Mode", "text")
                )));

        return nodeTypes;
    }

    private Map<String, Object> buildNodeType(String id, String label, String category,
                                              String icon, List<Map<String, String>> properties) {
        Map<String, Object> nodeType = new LinkedHashMap<>();
        nodeType.put("id", id);
        nodeType.put("label", label);
        nodeType.put("category", category);
        nodeType.put("icon", icon);
        nodeType.put("properties", properties);
        return nodeType;
    }

    private Map<String, String> buildProp(String name, String label, String type) {
        Map<String, String> prop = new LinkedHashMap<>();
        prop.put("name", name);
        prop.put("label", label);
        prop.put("type", type);
        return prop;
    }
}
