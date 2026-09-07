<script lang="ts">
  import { resizeListener } from "@nucleum/actions/resize.action";
  import appearance from "@nucleum/stores/appearance.store";
  import { retrieveCurrentColors } from "@21n/utils/theme.utils";
  import { truncateString } from "@21n/shared-utils/text.utils";
  import { Graph, GraphEvent, NodeEvent, CanvasEvent } from "@antv/g6";
  import { onMount } from "svelte";

  let {
    data = { nodes: [], edges: [] },
    layout = "force-1",
    onCanvasClick = undefined,
    onRender = undefined,
    onSelect = undefined
  }: {
    data?: { nodes: any[]; edges: any[] };
    layout?: string;
    onCanvasClick?: ((event: any) => void) | undefined;
    onRender?: (() => void) | undefined;
    onSelect?: ((event: any) => void) | undefined;
  } = $props();
  let _data: { nodes: any[]; edges: any[] } = { nodes: [], edges: [] };
  let graph: Graph;
  const currentColors: any = retrieveCurrentColors($appearance);

  onMount(() => {
    preProcessData();
    renderGraph();
  });

  export function rerender() {
    if (!graph) return;
    graph.destroy();
    preProcessData();
    renderGraph();
  }

  async function preProcessData() {
    _data.nodes = data.nodes.map((n) => {
      return {
        id: n.id,
        label: n.label,
        type: n.type ?? "circle",
        style: {
          labelText: truncateString(n.label ?? "", 30),
          innerHTML: n.innerHTML,
          size: n.type === "html" ? [120, 40] : 20,
          icon: n.icon ? true : false,
          iconSrc: n.icon
          // iconFill: currentColors["fgs1"]
          // iconText: "👋"
        }
      };
    });
    _data.edges = [...data.edges];
    // console.log({ _data });
  }

  function resolveLayout(method: string) {
    switch (method) {
      case "force-1":
        return {
          type: "force",
          linkDistance: 200,
          preventOverlap: true
        };
      case "force-2":
        return {
          type: "force",
          linkDistance: 450,
          preventOverlap: true
        };
      case "radial-2":
        return {
          type: "radial",
          linkDistance: 350,
          maxIteration: 1000,
          preventOverlap: true,
          nodeSize: 40,
          manyBody: {},
          x: {},
          y: {}
        };
      case "d3-force":
        return {
          type: "d3-force",
          link: {
            distance: 100
          },
          manyBody: {
            strength: -300,
            distanceMax: 500
          },
          collide: {
            radius: 40,
            strength: 0.8
          },
          center: {
            strength: 0.05
          }
        };
    }
  }

  function renderGraph() {
    graph = new Graph({
      container: "globalgraphcontainer",
      data: _data,
      autoFit: "view",
      animation: false,
      node: {
        // palette: {
        //   type: "group",
        //   field: "cluster"
        // }
        style: {
          size: 10,
          fill: currentColors["fgs2"],
          labelFill: currentColors["fgs3"],
          stroke: currentColors["aps1"]
        },
        state: {
          selected: {
            fill: currentColors["aps1"],
            stroke: currentColors["aps1"],
            haloFill: currentColors["aps1"],
            labelFill: currentColors["aps1"],
            haloStroke: currentColors["aps1"]
          }
        }
      },
      behaviors: [
        "drag-canvas",
        "zoom-canvas",
        "drag-element",
        "click-select",
        {
          type: "hover-activate",
          degree: 1
        }
      ],
      layout: resolveLayout(layout)
    });
    graph.render();
    // graph.draw();
    graph.on(GraphEvent.AFTER_RENDER, handleAfterRender);
    graph.on(CanvasEvent.CLICK, handleCanvasClick);
    graph.on(NodeEvent.CLICK, handleNodeClick);
  }

  function handleCanvasClick(event: any) {
    onCanvasClick?.(event);
  }

  function handleNodeClick(event: any) {
    onSelect?.(event);
  }
  function handleAfterRender() {
    onRender?.();
  }
</script>

<div
  id="globalgraphcontainer"
  use:resizeListener={() => {
    if (graph) {
      graph.resize();
    }
  }}
  class="w-full h-full w--[50rem] h--[50rem]"
/>
