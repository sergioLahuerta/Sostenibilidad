// ===== SCRIPT UNIFICADO PARA MAPA 2D Y GLOBO 3D =====

// Variables globales compartidas
let map2D;
let earth3D;
let currentMapMode = '2D'; // '2D' o '3D'
let events = [];
let filteredEvents = [];
let markers2D = [];
let markers3D = [];
let currentFilters = {
    category: 'all',
    status: 'open',
    severity: 'all',
    dateRange: 30
};

// Configuración de APIs
const EONET_BASE_URL = 'https://eonet.gsfc.nasa.gov/api/v3';
const WEATHER_APIS = {
    openMeteo: {
        baseUrl: 'https://api.open-meteo.com/v1/forecast'
    }
};

// Iconos de los eventos
const EVENT_ICONS = {
    wildfires: '🔥',
    severeStorms: '⛈️',
    earthquakes: '🌍',
    floods: '🌊',
    volcanoes: '🌋',
    drought: '🏜️',
    landslides: '⛰️',
    dustHaze: '🌫️',
    snow: '❄️',
    tempExtremes: '🌡️',
    seaLakeIce: '🧊',
    manmade: '🏭',
    waterColor: '🌊'
};

// Lista de ciudades
const CITIES = [
    { name: "Madrid", lat: 40.4168, lon: -3.7038 },
    { name: "Barcelona", lat: 41.3874, lon: 2.1686 },
    { name: "New York", lat: 40.7128, lon: -74.0060 },
    { name: "Tokyo", lat: 35.6762, lon: 139.6503 },
    { name: "Berlin", lat: 52.5200, lon: 13.4050 },
    { name: "London", lat: 51.5074, lon: -0.1278 },
    { name: "Paris", lat: 48.8566, lon: 2.3522 },
    { name: "Rome", lat: 41.9028, lon: 12.4964 },
    { name: "Sydney", lat: -33.8688, lon: 151.2093 },
    { name: "Cairo", lat: 30.0444, lon: 31.2357 }
];

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando aplicación...');
    
    // Inicializar mapa 2D primero
    initializeMap2D();
    
    // Inicializar globo 3D después
    setTimeout(() => {
        if (typeof WE !== 'undefined') {
            initializeMap3D();
            console.log('Ambos mapas inicializados');
        } else {
            console.warn('WebGL Earth no disponible, solo mapa 2D');
        }
    }, 1000);
    
    // Configurar event listeners
    setupEventListeners();
    
    // Cargar datos
    loadEvents();
    
    // Auto recarga cada 5 minutos
    setInterval(loadEvents, 300000);
});

// ===== INICIALIZACIÓN MAPA 2D (LEAFLET) =====
function initializeMap2D() {
    console.log('Inicializando mapa 2D...');
    
    map2D = L.map('map').setView([20, 0], 2);

    // Mapa base modo oscuro
    const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19,
    }).addTo(map2D);

    // Capas adicionales
    const osmStandard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    const osmHumanitarian = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png');
    const osmTopo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png');

    // Marcadores de ciudades para 2D
    const cityMarkers2D = CITIES.map(city => {
        return L.marker([city.lat, city.lon]).bindPopup(`
            <div style="color: rgb(var(--foreground)); min-width: 200px; text-align: center;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">${city.name}</h3>
                <div style="margin-bottom: 12px; font-size: 12px; color: rgb(var(--muted-foreground));">
                    📍 ${city.lat.toFixed(2)}, ${city.lon.toFixed(2)}
                </div>
                <button onclick="showWeatherModal('${city.name}', ${city.lat}, ${city.lon})" 
                        style="background: rgb(var(--primary)); color: rgb(var(--primary-foreground)); border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; width: 100%;">
                    🌤️ Ver Clima Completo
                </button>
            </div>
        `);
    });

    const markerLayer = L.layerGroup(cityMarkers2D);

    // Control de capas
    const layerControl = L.control.layers(
        { "Dark": darkLayer, "Estándar": osmStandard, "Humanitario": osmHumanitarian, "Topográfico": osmTopo },
        { "Ciudades": markerLayer }
    );

    map2D.layerControl = layerControl;
    map2D.hasLayerControl = false;
}

// ===== INICIALIZACIÓN GLOBO 3D (WEBGL EARTH) =====
function initializeMap3D() {
    console.log('Inicializando globo 3D...');
    
    try {
        earth3D = new WE.map('earth', {
            zoom: 2,
            center: [20, 0],
            sky: true,
            atmosphere: true,
            lighting: false
        });

        // Capa base
        const darkLayer3D = WE.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  subdomains: 'abcd',
  attribution: '&copy; OpenStreetMap contributors & CartoDB'
}).addTo(earth3D);
earth3D.setBaseLayer(darkLayer3D);

        // Marcadores de ciudades para 3D
        CITIES.forEach(city => {
            const marker = WE.marker([city.lat, city.lon], createSimpleCityIcon(), 24, 24)
                .addTo(earth3D);

            marker.bindPopup(`
                <div style="color: #333; min-width: 200px; text-align: center; background: white; padding: 10px; border-radius: 8px;">
                    <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold; color: #333;">${city.name}</h3>
                    <div style="margin-bottom: 12px; font-size: 12px; color: #666;">
                        📍 ${city.lat.toFixed(2)}, ${city.lon.toFixed(2)}
                    </div>
                    <button onclick="showWeatherModal('${city.name}', ${city.lat}, ${city.lon})" 
                            style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; width: 100%;">
                        🌤️ Ver Clima Completo
                    </button>
                </div>
            `, {maxWidth: 250});
        });

        console.log('Globo 3D inicializado correctamente');
        
    } catch (error) {
        console.error('Error inicializando globo 3D:', error);
    }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Filtros
    const categoryFilter = document.getElementById('category-filter');
    const statusFilter = document.getElementById('status-filter');
    const severityFilter = document.getElementById('severity-filter');
    const dateFilter = document.getElementById('date-filter');
    
    if (categoryFilter) categoryFilter.addEventListener('change', handleFilterChange);
    if (statusFilter) statusFilter.addEventListener('change', handleFilterChange);
    if (severityFilter) severityFilter.addEventListener('change', handleFilterChange);
    if (dateFilter) dateFilter.addEventListener('change', handleFilterChange);
    
    // Buscador
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.addEventListener('input', handleSearch);
    
    // Botón refrescar
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) refreshBtn.addEventListener('click', loadEvents);
    
    // Controles del mapa
    const centerBtn = document.getElementById('center-map');
    if (centerBtn) {
        centerBtn.addEventListener('click', () => {
            if (currentMapMode === '2D' && map2D) {
                map2D.setView([20, 0], 2);
            } else if (currentMapMode === '3D' && earth3D) {
                earth3D.setView([20, 0], 3, {animate: true});
            }
        });
    }
    
    // Toggle layers
    const toggleBtn = document.getElementById('toggle-layers');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            if (currentMapMode === '2D' && map2D) {
                if (map2D.hasLayerControl) {
                    map2D.removeControl(map2D.layerControl);
                    map2D.hasLayerControl = false;
                } else {
                    map2D.layerControl.addTo(map2D);
                    map2D.hasLayerControl = true;
                }
            }
        });
    }
    
    // Modal
    const closeModalBtn = document.getElementById('close-modal');
    const eventModal = document.getElementById('event-modal');
    
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (eventModal) {
        eventModal.addEventListener('click', (e) => {
            if (e.target.id === 'event-modal') closeModal();
        });
    }
    
    // Categorías sidebar
    document.querySelectorAll('[data-category]').forEach(item => {
        item.addEventListener('click', (e) => {
            const category = e.currentTarget.dataset.category;
            if (categoryFilter) {
                categoryFilter.value = category;
                handleFilterChange();
            }
        });
    });
}

// ===== CARGA DE DATOS =====
async function loadEvents() {
    try {
        showLoading();
        
        const params = new URLSearchParams({
            status: currentFilters.status === 'all' ? 'open' : currentFilters.status,
            limit: '100'
        });
        
        if (currentFilters.category !== 'all') {
            params.append('category', currentFilters.category);
        }
        
        if (currentFilters.dateRange) {
            params.append('days', currentFilters.dateRange.toString());
        }
        
        const response = await fetch(`${EONET_BASE_URL}/events?${params.toString()}`);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        events = data.events.map(transformEvent);
        
        applyFilters();
        updateUI();
        updateLastUpdated();
        hideError();
        
    } catch (error) {
        console.error('Error loading events:', error);
        showError(`Failed to load events: ${error.message}`);
    }
}

function transformEvent(event) {
    const latestGeometry = event.geometry[event.geometry.length - 1];
    const coordinates = latestGeometry.type === 'Point' 
        ? latestGeometry.coordinates 
        : latestGeometry.coordinates[0];
    
    return {
        id: event.id,
        title: event.title,
        description: event.description || '',
        category: event.categories[0]?.id || 'unknown',
        coordinates: [coordinates[1], coordinates[0]], // [lat, lng]
        severity: calculateSeverity(event),
        status: event.closed ? 'closed' : 'open',
        date: latestGeometry.date,
        magnitude: latestGeometry.magnitudeValue 
            ? `${latestGeometry.magnitudeValue} ${latestGeometry.magnitudeUnit || ''}`.trim()
            : null,
        sources: event.sources.map(s => s.id),
        link: event.link,
        closed: event.closed
    };
}

function calculateSeverity(event) {
    const category = event.categories[0]?.id;
    const hasMultipleSources = event.sources.length > 2;
    const isRecent = event.geometry.some(g => {
        const eventDate = new Date(g.date);
        const daysDiff = (Date.now() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff < 7;
    });

    if (category === 'earthquakes' && event.geometry.some(g => g.magnitudeValue && g.magnitudeValue > 7)) {
        return 'critical';
    }
    if (category === 'severeStorms' && hasMultipleSources && isRecent) {
        return 'critical';
    }
    if (category === 'volcanoes' && isRecent) {
        return 'critical';
    }
    if ((category === 'wildfires' || category === 'floods') && hasMultipleSources && isRecent) {
        return 'high';
    }
    if (category === 'earthquakes' && event.geometry.some(g => g.magnitudeValue && g.magnitudeValue > 5)) {
        return 'high';
    }
    if (isRecent && hasMultipleSources) {
        return 'medium';
    }

    return 'low';
}

// ===== FILTROS =====
function applyFilters() {
    filteredEvents = events.filter(event => {
        if (currentFilters.category !== 'all' && event.category !== currentFilters.category) {
            return false;
        }
        if (currentFilters.status !== 'all' && event.status !== currentFilters.status) {
            return false;
        }
        if (currentFilters.severity !== 'all' && event.severity !== currentFilters.severity) {
            return false;
        }
        return true;
    });
}

function handleFilterChange() {
    const categoryFilter = document.getElementById('category-filter');
    const statusFilter = document.getElementById('status-filter');
    const severityFilter = document.getElementById('severity-filter');
    const dateFilter = document.getElementById('date-filter');
    
    if (categoryFilter) currentFilters.category = categoryFilter.value;
    if (statusFilter) currentFilters.status = statusFilter.value;
    if (severityFilter) currentFilters.severity = severityFilter.value;
    if (dateFilter) currentFilters.dateRange = parseInt(dateFilter.value);
    
    applyFilters();
    updateUI();
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    if (searchTerm === '') {
        applyFilters();
    } else {
        filteredEvents = events.filter(event => 
            event.title.toLowerCase().includes(searchTerm) ||
            event.category.toLowerCase().includes(searchTerm) ||
            event.description.toLowerCase().includes(searchTerm)
        );
    }
    
    updateUI();
}

// ===== ACTUALIZACIÓN UI =====
function updateUI() {
    updateMetrics();
    updateMaps();
    updateEventList();
    updateCategoryCounts();
}

function updateMaps() {
    updateMap2D();
    if (earth3D) updateMap3D();
}

function updateMap2D() {
    // Limpiar marcadores existentes
    markers2D.forEach(marker => map2D.removeLayer(marker));
    markers2D = [];
    
    filteredEvents.forEach(event => {
        if (event.coordinates && event.coordinates.length === 2) {
            const icon = EVENT_ICONS[event.category] || '📍';
            const severityColor = getSeverityColor(event.severity);
            
            const marker = L.marker(event.coordinates, {
                icon: L.divIcon({
                    html: `<div style="background-color: ${severityColor}; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white;">${icon}</div>`,
                    className: 'custom-marker',
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                })
            }).addTo(map2D);
            
            marker.bindPopup(`
                <div style="color: rgb(var(--foreground)); min-width: 200px;">
                    <h3 style="margin: 0 0 8px 0; font-size: 16px;">${event.title}</h3>
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: rgb(var(--muted-foreground));">
                        <strong>Category:</strong> ${event.category}<br>
                        <strong>Severity:</strong> <span class="severity-${event.severity}">${event.severity}</span><br>
                        <strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}<br>
                        ${event.magnitude ? `<strong>Magnitude:</strong> ${event.magnitude}<br>` : ''}
                        <strong>Status:</strong> ${event.status}
                    </p>
                    <button onclick="showEventDetails('${event.id}')" style="background: rgb(var(--primary)); color: rgb(var(--primary-foreground)); border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">View Details</button>
                </div>
            `);
            
            markers2D.push(marker);
        }
    });
}

function updateMap3D() {
    // Limpiar marcadores existentes
    markers3D.forEach(marker => earth3D.removeMarker(marker));
    markers3D = [];
    
    filteredEvents.forEach(event => {
        if (event.coordinates && event.coordinates.length === 2) {
            const icon = EVENT_ICONS[event.category] || '📍';
            const severityColor = getSeverityColor(event.severity);
            
            const marker = WE.marker(
                [event.coordinates[0], event.coordinates[1]], 
                createMarkerIcon(icon, severityColor),
                32, 32
            ).addTo(earth3D);
            
            marker.bindPopup(`
                <div style="color: #333; min-width: 200px; background: white; padding: 12px; border-radius: 8px;">
                    <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #333;">${event.title}</h3>
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">
                        <strong>Category:</strong> ${event.category}<br>
                        <strong>Severity:</strong> <span style="color: ${severityColor};">${event.severity}</span><br>
                        <strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}<br>
                        ${event.magnitude ? `<strong>Magnitude:</strong> ${event.magnitude}<br>` : ''}
                        <strong>Status:</strong> ${event.status}
                    </p>
                    <button onclick="showEventDetails('${event.id}')" 
                            style="background: #3b82f6; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        View Details
                    </button>
                </div>
            `);
            
            markers3D.push(marker);
        }
    });
}

// ===== FUNCIONES AUXILIARES =====
function getSeverityColor(severity) {
    switch (severity) {
        case 'critical': return `rgb(var(--nasa-purple))`;
        case 'high': return `rgb(var(--nasa-red))`;
        case 'medium': return `rgb(var(--nasa-orange))`;
        case 'low': return `rgb(var(--nasa-green))`;
        default: return `rgb(var(--nasa-blue))`;
    }
}

function createSimpleCityIcon() {
    const canvas = document.createElement('canvas');
    canvas.width = 24;
    canvas.height = 24;
    const ctx = canvas.getContext('2d');
    
    ctx.beginPath();
    ctx.arc(12, 12, 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#3b82f6';
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(12, 12, 4, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    
    return canvas.toDataURL();
}

function createMarkerIcon(emoji, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    ctx.beginPath();
    ctx.arc(16, 16, 14, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';
    ctx.fillText(emoji, 16, 16);
    
    return canvas.toDataURL();
}

// ===== RESTO DE FUNCIONES UI =====
function updateMetrics() {
    const totalEvents = filteredEvents.length;
    const criticalEvents = filteredEvents.filter(e => e.severity === 'critical').length;
    const wildfireEvents = filteredEvents.filter(e => e.category === 'wildfires').length;
    const earthquakeEvents = filteredEvents.filter(e => e.category === 'earthquakes').length;
    
    const updateElement = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };
    
    updateElement('total-events', totalEvents);
    updateElement('critical-events', criticalEvents);
    updateElement('wildfire-events', wildfireEvents);
    updateElement('earthquake-events', earthquakeEvents);
    updateElement('total-change', `${totalEvents} active events`);
    updateElement('critical-change', `${criticalEvents} critical alerts`);
    updateElement('wildfire-change', `${wildfireEvents} active fires`);
    updateElement('earthquake-change', `${earthquakeEvents} recent quakes`);
}

function updateEventList() {
    const eventList = document.getElementById('event-list');
    if (!eventList) return;
    
    if (filteredEvents.length === 0) {
        eventList.innerHTML = '<div class="loading">No events found matching current filters.</div>';
        return;
    }
    
    const sortedEvents = filteredEvents
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 20);
    
    eventList.innerHTML = sortedEvents.map(event => `
        <div class="event-item" onclick="showEventDetails('${event.id}')">
            <div class="event-header">
                <div class="event-title">${event.title}</div>
                <div class="event-severity severity-${event.severity}">${event.severity}</div>
            </div>
            <div class="event-meta">
                <span class="event-category">${EVENT_ICONS[event.category] || '📍'} ${event.category}</span>
                <span>${new Date(event.date).toLocaleDateString()}</span>
                <span>${event.status}</span>
            </div>
        </div>
    `).join('');
}

function updateCategoryCounts() {
    const counts = {};
    events.forEach(event => {
        counts[event.category] = (counts[event.category] || 0) + 1;
    });
    
    const updateCount = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value || 0;
    };
    
    updateCount('wildfires-count', counts.wildfires);
    updateCount('storms-count', counts.severeStorms);
    updateCount('earthquakes-count', counts.earthquakes);
    updateCount('floods-count', counts.floods);
    updateCount('volcanoes-count', counts.volcanoes);
}

function showEventDetails(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const eventModal = document.getElementById('event-modal');
    
    if (modalTitle) modalTitle.textContent = event.title;
    
    if (modalBody) {
        modalBody.innerHTML = `
            <div>
                <h4 style="font-weight: 600; margin-bottom: 8px;">Event Information</h4>
                <p><strong>Category:</strong> ${EVENT_ICONS[event.category] || '📍'} ${event.category}</p>
                <p><strong>Severity:</strong> <span class="severity-${event.severity}">${event.severity}</span></p>
                <p><strong>Status:</strong> ${event.status}</p>
                <p><strong>Date:</strong> ${new Date(event.date).toLocaleString()}</p>
                ${event.magnitude ? `<p><strong>Magnitude:</strong> ${event.magnitude}</p>` : ''}
                ${event.closed ? `<p><strong>Closed:</strong> ${new Date(event.closed).toLocaleString()}</p>` : ''}
                
                ${event.description ? `
                    <h4 style="font-weight: 600; margin: 16px 0 8px 0;">Description</h4>
                    <p>${event.description}</p>
                ` : ''}
                
                <h4 style="font-weight: 600; margin: 16px 0 8px 0;">Location</h4>
                <p><strong>Coordinates:</strong> ${event.coordinates[0].toFixed(4)}, ${event.coordinates[1].toFixed(4)}</p>
                
                <h4 style="font-weight: 600; margin: 16px 0 8px 0;">Sources</h4>
                <p>${event.sources.join(', ')}</p>
                
                <div style="margin-top: 16px;">
                    <a href="${event.link}" target="_blank" style="color: rgb(var(--primary)); text-decoration: none;">
                        View on NASA EONET →
                    </a>
                </div>
            </div>
        `;
    }
    
    if (eventModal) eventModal.classList.add('show');
}

function closeModal() {
    const eventModal = document.getElementById('event-modal');
    if (eventModal) eventModal.classList.remove('show');
}

function showLoading() {
    const eventList = document.getElementById('event-list');
    if (eventList) {
        eventList.innerHTML = '<div class="loading">Loading events...</div>';
    }
}

function showError(message) {
    const errorDiv = document.getElementById('error-display');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

function hideError() {
    const errorDiv = document.getElementById('error-display');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

function updateLastUpdated() {
    const now = new Date();
    const lastUpdatedEl = document.getElementById('last-updated');
    if (lastUpdatedEl) {
        lastUpdatedEl.textContent = `Last updated: ${now.toLocaleTimeString()}`;
    }
}

