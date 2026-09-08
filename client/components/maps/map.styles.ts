export const mapTileStyles = {
  demo: "https://demotiles.maplibre.org/style.json",
  osm: {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }
    },
    layers: [
      {
        id: "osm",
        type: "raster",
        source: "osm"
      }
    ]
  },
  osmMinimal: {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256
      }
    },
    layers: [
      {
        id: "osm",
        type: "raster",
        source: "osm",
        paint: {
          "raster-saturation": -1,
          "raster-opacity": 0.7
        }
      }
    ]
  },
  stamenTerrain: {
    version: 8,
    sources: {
      stamen: {
        type: "raster",
        tiles: [
          "https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg"
        ],
        tileSize: 256,
        attribution:
          'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> — Map data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }
    },
    layers: [{ id: "stamen", type: "raster", source: "stamen" }]
  },
  cartodbDark: {
    version: 8,
    sources: {
      cartodb: {
        type: "raster",
        tiles: [
          "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        ],
        tileSize: 256,
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'
      }
    },
    layers: [{ id: "cartodb", type: "raster", source: "cartodb" }]
  },
  cartodbLight: {
    version: 8,
    sources: {
      cartodb: {
        type: "raster",
        tiles: [
          "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        ],
        tileSize: 256,
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'
      }
    },
    layers: [{ id: "cartodb", type: "raster", source: "cartodb" }]
  }
};
