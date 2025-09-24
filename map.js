const map = L.map('map').setView([20, 0], 2); // Centrado en lat=20, lon=0, zoom 2
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    
}).addTo(map);

// Cambiar cursor a pointer cuando está sobre el mapa
const mapContainer = document.getElementById('map');
map.getContainer().style.cursor = 'pointer';
mapContainer.style.width = '1910px';
mapContainer.style.height = '600px';
