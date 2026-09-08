<script lang="ts">
  import { mount, onMount, onDestroy } from "svelte";
  import maplibregl from "maplibre-gl";
  import "maplibre-gl/dist/maplibre-gl.css";
  import MapItem from "@nucleum/application/overview/MapItem.svelte";
  import { mapTileStyles } from "@nucleum/components/maps/map.styles";

  interface MapDataPoint {
    id: string;
    label: string;
    latitude: number;
    longitude: number;
    contentType: string;
    createdAt: string;
    url?: string;
    metadata: any;
  }

  let {
    data = [],
    isShowHeatmap = false
  }: {
    data?: MapDataPoint[];
    isShowHeatmap?: boolean;
  } = $props();

  let mapContainer = $state<HTMLDivElement | null>(null);
  let map = $state<maplibregl.Map | null>(null);

  onMount(() => {
    initializeMap();
  });

  onDestroy(() => {
    if (map) {
      map.remove();
    }
  });

  $effect(() => {
    if (map && data) {
      updateMapData(isShowHeatmap);
    }
  });

  function initializeMap() {
    try {
      if (!mapContainer) {
        return;
      }
      map = new maplibregl.Map({
        container: mapContainer,
        style: mapTileStyles.osm as any,
        center: [0, 0],
        zoom: 2
      });

      map.on("load", () => {
        try {
          updateMapData(isShowHeatmap);
        } catch (error) {
          console.error("Error updating map data on load:", error);
        }
      });
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  }

  function updateMapData(isShowHeatmap: boolean) {
    try {
      const mapInstance = map;
      if (!mapInstance || !data || data.length === 0) return;

      if (mapInstance.getSource("nodes")) {
        try {
          if (mapInstance.getLayer("nodes-layer"))
            mapInstance.removeLayer("nodes-layer");
          if (mapInstance.getLayer("heatmap-layer"))
            mapInstance.removeLayer("heatmap-layer");
          mapInstance.removeSource("nodes");
        } catch (error) {
          console.error("Error removing existing map layers/sources:", error);
        }
      }

      const geojsonData: maplibregl.GeoJSONSourceSpecification["data"] = {
        type: "FeatureCollection" as const,
        features: data
          .map((point) => {
            if (
              typeof point.latitude !== "number" ||
              typeof point.longitude !== "number"
            ) {
              console.warn("Invalid coordinates for point:", point);
              return null;
            }
            return {
              type: "Feature" as const,
              geometry: {
                type: "Point" as const,
                coordinates: [point.longitude, point.latitude]
              },
              properties: {
                id: point.id,
                label: point.label,
                contentType: point.contentType,
                createdAt: point.createdAt,
                url: point.url || "",
                weight: 1
              }
            };
          })
          .filter(
            (feature): feature is NonNullable<typeof feature> =>
              feature !== null
          )
      };

      mapInstance.addSource("nodes", {
        type: "geojson",
        data: geojsonData
      });

      if (isShowHeatmap) {
        mapInstance.addLayer({
          id: "heatmap-layer",
          type: "heatmap",
          source: "nodes",
          maxzoom: 15,
          paint: {
            "heatmap-weight": [
              "interpolate",
              ["linear"],
              ["get", "weight"],
              0,
              0,
              6,
              1
            ],
            "heatmap-intensity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              1,
              15,
              3
            ],
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(33,102,172,0)",
              0.2,
              "rgb(103,169,207)",
              0.4,
              "rgb(209,229,240)",
              0.6,
              "rgb(253,219,199)",
              0.8,
              "rgb(239,138,98)",
              1,
              "rgb(178,24,43)"
            ],
            "heatmap-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              2,
              15,
              20
            ],
            "heatmap-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              7,
              1,
              15,
              0
            ]
          }
        });

        mapInstance.addLayer({
          id: "nodes-layer",
          type: "circle",
          source: "nodes",
          minzoom: 14,
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 7, 1, 16, 5],
            "circle-color": "#1890ff",
            "circle-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              7,
              0,
              15,
              1
            ],
            "circle-stroke-width": 1,
            "circle-stroke-color": "#fff"
          }
        });
      } else {
        mapInstance.addLayer({
          id: "nodes-layer",
          type: "circle",
          source: "nodes",
          paint: {
            "circle-radius": 8,
            "circle-color": "#1890ff",
            "circle-opacity": 0.8,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#fff"
          }
        });
      }

      mapInstance.on("click", "nodes-layer", (e) => {
        try {
          if (!e.features || !e.features[0]) return;

          const feature = e.features[0];
          if (feature.geometry.type !== "Point") return;

          const coordinates = [...feature.geometry.coordinates] as [
            number,
            number
          ];
          const properties = feature.properties;

          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          const popupContainer = document.createElement("div");

          const mapItemData = {
            id: properties?.id || "",
            label: properties?.label || "Untitled",
            contentType: properties?.contentType || "",
            createdAt: properties?.createdAt || "",
            url: properties?.url || "",
            metadata: properties?.metadata || {}
          };

          mount(MapItem, {
            target: popupContainer,
            props: {
              data: mapItemData
            }
          });

          new maplibregl.Popup()
            .setLngLat(coordinates)
            .setDOMContent(popupContainer)
            .addTo(mapInstance);
        } catch (error) {
          console.error("Error handling map click:", error);
        }
      });

      mapInstance.on("mouseenter", "nodes-layer", () => {
        try {
          mapInstance.getCanvas().style.cursor = "pointer";
        } catch (error) {
          console.error("Error setting cursor:", error);
        }
      });

      mapInstance.on("mouseleave", "nodes-layer", () => {
        try {
          mapInstance.getCanvas().style.cursor = "";
        } catch (error) {
          console.error("Error resetting cursor:", error);
        }
      });

      if (data.length > 0) {
        try {
          const bounds = new maplibregl.LngLatBounds();
          data.forEach((point) => {
            if (
              typeof point.latitude === "number" &&
              typeof point.longitude === "number"
            ) {
              bounds.extend([point.longitude, point.latitude]);
            }
          });

          mapInstance.fitBounds(bounds, {
            padding: 50,
            maxZoom: 10
          });
        } catch (error) {
          console.error("Error fitting bounds:", error);
        }
      }
    } catch (error) {
      console.error("Error updating map data:", error);
    }
  }
</script>

<div class="relative w-full h-full min-h-[400px] rounded-md overflow-hidden">
  <div bind:this={mapContainer} class="w-full h-full"></div>
</div>

<style>
  :global(.maplibregl-popup) {
    max-width: 400px !important;
    min-width: 300px !important;
  }
  :global(.maplibregl-popup-content) {
    background: rgba(var(--colors-bgs1), 1) !important;
    border: 1px solid rgba(var(--colors-bgs3), 1) !important;
    border-radius: 8px !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    padding: 0 !important;
  }

  :global(.maplibregl-popup-tip) {
    border-top-color: rgba(var(--colors-bgs1), 1) !important;
  }

  :global(.maplibregl-popup-close-button) {
    font-size: 16px !important;
    padding: 4px 8px !important;
    background: rgba(var(--colors-ars1), 1) !important;
    color: rgba(var(--colors-bgs1), 1) !important;
  }
</style>
