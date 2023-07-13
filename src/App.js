import React, { useState, useEffect } from 'react';
import axios from 'axios';
import L from 'leaflet';
import * as shapefile from 'shapefile';

function App() {
  const [geoLayer, setGeoLayer] = useState(null);
  const [map, setMap] = useState(null);

  useEffect(() => {
    // Initialize map
    const mymap = L.map('mapid').setView([34.0522, -118.2437], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(mymap);
    setMap(mymap);

    // Load shapefile
    shapefile
      .read('http://localhost:8003/test_react/data/LACity')
      .then(function ({ features }) {
        const newGeoLayer = L.geoJSON(features, {
          style: function (feature) {
            const value = feature.properties.POP;
            const color = getColor(value);
            return {
              fillColor: color,
              color: '#000',
              fillOpacity: 0.5,
            };
          },
          onEachFeature: function (feature, layer) {
            layer.on('click', function (e) {
              if (geoLayer) {
                geoLayer.setStyle({ fillOpacity: 0.5 }); // Reset opacity for all features
                layer.setStyle({ fillOpacity: 1 }); // Highlight the clicked feature
              }
            });

            const tooltipContent = `Tract: ${feature.properties.TRACTCE10}\nTotal Population: ${feature.properties.POP}`;
            layer.bindTooltip(tooltipContent).openTooltip();
          },
        }).addTo(mymap);

        setGeoLayer(newGeoLayer); // Save a reference to the GeoJSON layer
      })
      .catch(function (error) {
        console.log('Error loading shapefile:', error);
      });
  }, []);

  function fetchData() {
    axios
      .get('http://localhost:8000/api/endpoint', {
        params: {
          file_name: "LACity.shp",
          disname: 'households',
          minName: 'pop_16up',
          minLow: 0,
          minHigh: 3000,
          maxName: '',
          maxLow: 0,
          maxHigh: 99999,
          avgName: 'employed',
          avgLow: 1000,
          avgHigh: 4000,
          sumName: 'pop2010',
          sumLow: 20000,
          sumHigh: 99999,
          countLow: -99999,
          countHigh: 99999,
        },
      })
      .then((response) => {
        const labels = response.data.labels;

        // Create a mapping from labels to colors
        const labelColorMap = {};
        labels.forEach((label) => {
          if (!labelColorMap[label]) {
            labelColorMap[label] = getRandomColor();
          }
        });

        if (geoLayer) {
          let labelIndex = 0;
          geoLayer.eachLayer(function (layer) {
            const label = labels[labelIndex];
            const color = labelColorMap[label];
            layer.setStyle({ fillColor: color });
            layer.bindTooltip(`${label}`);
            labelIndex += 1;
          });
          
        }

        // Update legend
        const legend = L.control({ position: 'bottomright' });
        legend.onAdd = function (map) {
          const div = L.DomUtil.create('div', 'info legend');
          div.innerHTML += '<h4>Data</h4>';
          for (let label in labelColorMap) {
            div.innerHTML +=
              '<i style="background:' +
              labelColorMap[label] +
              '"></i> ' +
              label +
              '<br>';
          }
          return div;
        };
        legend.addTo(map);
      })
      .catch((error) => {
        console.log('Error fetching data:', error);
      });
  }

  function getColor(value) {
    // Update this function based on your specific logic
    // to map region labels or other values to colors
    // Example: return value === 'A' ? '#800026' : value === 'B' ? '#000' : '#FED976';
    return '#000';
  }

  function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  return (
    <div className='App'>
      <button onClick={fetchData}>Fetch Data</button>
      <div id='mapid' style={{ height: '600px' }}></div>
    </div>
  );
}

export default App;
