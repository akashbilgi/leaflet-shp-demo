import React, { useState, useEffect } from 'react';
import axios from 'axios';
import L from 'leaflet';
import * as shapefile from 'shapefile';

function App() {
  const [data, setData] = useState(null);
  const [map, setMap] = useState(null);

  useEffect(() => {
    // Initialize map
    const mymap = L.map('mapid').setView([34.0522, -118.2437], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(mymap);
    setMap(mymap);

    // Load shapefile
    shapefile.read('http://localhost:8003/test_react/data/LACity')
      .then(function ({ features }) {
        const geoLayer = L.geoJSON(features, {
          style: function (feature) {
            return {
              fillColor: getRandomColor(),
              color: '#000',
              fillOpacity: 0.5
            };
          },
          onEachFeature: function (feature, layer) {
            layer.bindPopup(JSON.stringify(feature.properties));
          }
        }).addTo(mymap);
      })
      .catch(function (error) {
        console.log('Error loading shapefile:', error);
      });
  }, []);

  useEffect(() => {
    if (data && map) {
      // Update map style based on data
      const geoLayer = map.getPane('overlayPane').querySelector('.leaflet-geojson');
      if (geoLayer) {
        geoLayer.eachLayer(function (layer) {
          const label = layer.feature.properties.NAME;
          const value = data[label];
          const color = getColor(value);
          layer.setStyle({ fillColor: color });
          layer.bindTooltip(`${label}: ${value}`).openTooltip();
        });
      }

      // Update legend
      const legend = L.control({ position: 'bottomright' });
      legend.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'info legend');
        const grades = Object.keys(data);
        div.innerHTML += '<h4>Data</h4>';
        for (let i = 0; i < grades.length; i++) {
          div.innerHTML +=
            '<i style="background:' +
            getColor(grades[i]) +
            '"></i> ' +
            grades[i] +
            '<br>';
        }
        return div;
      };
      legend.addTo(map);
    }
  }, [data, map]);

  function getColor(value) {
    // Define color scale based on data range
    // Example: return value > 100 ? '#800026' : value > 50 ? '#BD0026' : value > 20 ? '#E31A1C' : value > 10 ? '#FC4E2A' : value > 5 ? '#FD8D3C' : value > 2 ? '#FEB24C' : value > 0 ? '#FED976' : '#fff';
    return '#800026';
  }

  function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  function fetchData() {
    axios
      .get('http://localhost:8000')
      .then((response) => {
        setData(response.data);
      })
      .catch((error) => {
        console.log('Error fetching data:', error);
        const numberOfFeatures = 2000; // Specify the number of features to generate

        // Generate random data
        const randomData = {};
        for (let i = 0; i < numberOfFeatures; i++) {
          const label = `Feature ${i + 1}`;
          const value = Math.floor(Math.random() * 100); // Generate a random value between 0 and 100
          randomData[label] = value;
        }

        setData(randomData);
      });
  }

  return (
    <div className='App'>
      <button onClick={fetchData}>Fetch Data</button>
      <div id='mapid' style={{ height: '600px' }}></div>
    </div>
  );
}

export default App;
