import 'ol/ol.css';
import GeoJSON from 'ol/format/GeoJSON';
import Map from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import View from 'ol/View';
import sync from 'ol-hashed';
import DragAndDrop from 'ol/interaction/DragAndDrop';
import Modify from 'ol/interaction/Modify';
import Draw from 'ol/interaction/Draw';
import Snap from 'ol/interaction/Snap';
import { Style, Fill, Stroke } from 'ol/style';
import { getArea } from 'ol/sphere';
import colormap from 'colormap';

const map = new Map({
  target: 'map-container',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

const source = new VectorSource({
  format: new GeoJSON(),
  url: './data/countries.json'
});

const min = 1e8;
const max = 2e13;
const steps = 50;
const ramp = colormap({
  colormap: 'blackbody',
  nshades: steps,
});

function clamp(value, low, high) {
  return Math.max(low, Math.min(value, high));
}

function getColor(feature) {
  const area = getArea(feature.getGeometry());
  const f = Math.pow(clamp((area - min) / (max - min), 0, 1), 1/2);
  const index = Math.round(f * (steps - 1));
  return ramp[index];
}

const layer = new VectorLayer({
  source,
  style: function(feature) {
    return new Style({
      fill: new Fill({
        color: getColor(feature),
      }),
      stroke: new Stroke({
        color: 'rgba(255,255,255,0.8)',
      }),
    });
  },
});

map.addLayer(layer);

map.addInteraction(new DragAndDrop({
  source: source,
  formatConstructors: [GeoJSON],
}));

sync(map);

map.addInteraction(new Modify({ source }));
map.addInteraction(new Draw({
  type: 'Polygon',
  source: source,
}));
map.addInteraction(new Snap({ source }));

const clear = document.getElementById('clear');
clear.addEventListener('click', () => source.clear());

const format = new GeoJSON({ featureProjection: 'EPSG:3857' });
const download = document.getElementById('download');
source.on('change', () => {
  const features = source.getFeatures();
  const json = format.writeFeatures(features);
  download.href = 'data.text/json;charset=utf-8,' + json;
});
