package com.etldesigner.model;

import java.util.List;

public class PipelineRequest {
    private List<NodeConfig> nodes;
    private List<EdgeConfig> edges;

    public List<NodeConfig> getNodes() {
        return nodes;
    }

    public void setNodes(List<NodeConfig> nodes) {
        this.nodes = nodes;
    }

    public List<EdgeConfig> getEdges() {
        return edges;
    }

    public void setEdges(List<EdgeConfig> edges) {
        this.edges = edges;
    }
}
