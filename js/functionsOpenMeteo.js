// ===== FUNCIONES AUXILIARES PARA OPEN-METEO =====

function getWeatherDescription(weatherCode) {
    const descriptions = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Fog',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        56: 'Light freezing drizzle',
        57: 'Dense freezing drizzle',
        61: 'Moderate rain',
        63: 'Slight rain',
        65: 'Heavy rain',
        66: 'Light freezing rain',
        67: 'Heavy freezing rain',
        71: 'Slight snow fall',
        73: 'Moderate snow fall',
        75: 'Heavy snow fall',
        77: 'Snow grains',
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Heavy rain showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with slight hail',
        99: 'Thunderstorm with heavy hail'
    };
    return descriptions[weatherCode] || 'Unknown Conditions';
}

function getOpenMeteoIcon(weatherCode, isDay) {
    const iconMap = {
        0: isDay ? '☀️' : '🌙',
        1: isDay ? '🌤️' : '🌙',
        2: '⛅',
        3: '☁️',
        45: '🌫️',
        48: '🌫️',
        51: '🌦️',
        53: '🌦️',
        55: '🌧️',
        56: '🌧️',
        57: '🌧️',
        61: '🌧️',
        63: '🌧️',
        65: '🌧️',
        66: '🌧️',
        67: '🌧️',
        71: '❄️',
        73: '❄️',
        75: '❄️',
        77: '❄️',
        80: '🌦️',
        81: '🌧️',
        82: '🌧️',
        95: '⛈️',
        96: '⛈️',
        99: '⛈️'
    };
    return iconMap[weatherCode] || (isDay ? '🌤️' : '🌙');
}

// ===== FUNCIÓN PRINCIPAL PARA OBTENER DATOS COMPLETOS =====

async function getCompleteWeatherData(lat, lon) {
    const url = `${WEATHER_APIS.openMeteo.baseUrl}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`Open-Meteo Error: ${response.statusText}`);
        }
        
        const current = data.current;
        const daily = data.daily;
        
        return {
            source: 'Open-Meteo',
            current: {
                temperature: Math.round(current.temperature_2m),
                feelsLike: Math.round(current.apparent_temperature),
                humidity: current.relative_humidity_2m,
                windSpeed: Math.round(current.wind_speed_10m * 3.6), // m/s to km/h
                windGusts: Math.round(current.wind_gusts_10m * 3.6),
                windDirection: current.wind_direction_10m,
                pressure: Math.round(current.pressure_msl),
                cloudCover: current.cloud_cover,
                precipitation: current.precipitation,
                rain: current.rain,
                snow: current.snowfall,
                weatherCode: current.weather_code,
                description: getWeatherDescription(current.weather_code),
                icon: getOpenMeteoIcon(current.weather_code, current.is_day),
                isDay: current.is_day,
                timestamp: new Date(current.time)
            },
            forecast: {
                today: {
                    max: Math.round(daily.temperature_2m_max[0]),
                    min: Math.round(daily.temperature_2m_min[0]),
                    precipitation: daily.precipitation_sum[0],
                    weatherCode: daily.weather_code[0]
                },
                tomorrow: {
                    max: Math.round(daily.temperature_2m_max[1]),
                    min: Math.round(daily.temperature_2m_min[1]),
                    precipitation: daily.precipitation_sum[1],
                    weatherCode: daily.weather_code[1]
                }
            }
        };
    } catch (error) {
        console.error('Error with Open-Meteo:', error);
        throw error;
    }
}

// ===== FUNCIÓN PARA OBTENER DIRECCIÓN DEL VIENTO =====
function getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

// ===== FUNCIÓN PARA MOSTRAR EL MODAL METEOROLÓGICO =====
async function showWeatherModal(cityName, lat, lon) {
    // Crear el modal si no existe
    let weatherModal = document.querySelector('#weather-modal');
    if (!weatherModal) {
        weatherModal = document.createElement('div');
        weatherModal.id = 'weather-modal';
        weatherModal.className = 'modal';
        document.body.appendChild(weatherModal);
    }
    
    // Mostrar modal con loading
    weatherModal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <div class="modal-title">🌤️ Weather ${cityName}</div>
                <button class="close-btn" onclick="closeWeatherModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 18px; margin-bottom: 8px;">⏳ Loading meteo data</div>
                    <div style="font-size: 12px; color: rgb(var(--muted-foreground));">Getting data</div>
                </div>
            </div>
        </div>
    `;
    
    weatherModal.classList.add('show');
    
    try {
        // Obtener datos completos del clima
        const weatherData = await getCompleteWeatherData(lat, lon);
        const current = weatherData.current;
        const forecast = weatherData.forecast;
        
        // Actualizar el contenido del modal con todos los datos
        weatherModal.innerHTML = `
            <div class="modal-content" style="max-width: 650px;">
                <div class="modal-header">
                    <div class="modal-title">🌤️ Weather ${cityName}</div>
                    <button class="close-btn" onclick="closeWeatherModal()">&times;</button>
                </div>
                <div class="modal-body" style="padding: 0 20px 20px 20px;">
                    
                    <!-- Current Conditions -->
                    <div style="background: rgba(var(--nasa-blue), 0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <h3 style="margin: 0; font-size: 18px;">Current Conditions</h3>
                            <span style="font-size: 10px; color: rgb(var(--muted-foreground));">Source: ${weatherData.source}</span>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 16px;">
                            <div style="text-align: center;">
                                <div style="font-size: 48px; margin-bottom: 8px;">${current.icon}</div>
                                <div style="font-size: 32px; font-weight: bold; margin-bottom: 4px;">${current.temperature}°C</div>
                                <div style="font-size: 14px; color: rgb(var(--muted-foreground)); margin-bottom: 4px;">Temperature feels like: ${current.feelsLike}°C</div>
                                <div style="font-size: 14px;">${current.description}</div>
                            </div>
                            
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <div style="display: flex; justify-content: space-between;">
                                    <span>💧 Humidity:</span>
                                    <span><strong>${current.humidity}%</strong></span>
                                </div>
                                <div style="display: flex; justify-content: space-between;">
                                    <span>🌬️ Wind:</span>
                                    <span><strong>${current.windSpeed} km/h ${getWindDirection(current.windDirection)}</strong></span>
                                </div>
                                <div style="display: flex; justify-content: space-between;">
                                    <span>💨 Gusts:</span>
                                    <span><strong>${current.windGusts} km/h</strong></span>
                                </div>
                                <div style="display: flex; justify-content: space-between;">
                                    <span>📊 Pressure:</span>
                                    <span><strong>${current.pressure} mb</strong></span>
                                </div>
                                <div style="display: flex; justify-content: space-between;">
                                    <span>☁️ Visibility:</span>
                                    <span><strong>${current.cloudCover}%</strong></span>
                                </div>
                            </div>
                        </div>
                        
                        ${current.precipitation > 0 || current.rain > 0 || current.snow > 0 ? `
                        <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">
                            <h4 style="margin: 0 0 8px 0; font-size: 14px;">Precipitation</h4>
                            <div style="display: flex; gap: 16px; font-size: 12px;">
                                ${current.precipitation > 0 ? `<span>🌧️ Total: ${current.precipitation} mm</span>` : ''}
                                ${current.rain > 0 ? `<span>🌧️ Lluvia: ${current.rain} mm</span>` : ''}
                                ${current.snow > 0 ? `<span>❄️ Nieve: ${current.snow} mm</span>` : ''}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    
                    <!-- Pronóstico -->
                    <div style="background: rgba(var(--nasa-purple), 0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                        <h3 style="margin: 0 0 16px 0; font-size: 18px;">Forecast</h3>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <!-- Hoy -->
                            <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;">
                                <div style="text-align: center; margin-bottom: 8px;">
                                    <div style="font-weight: bold; margin-bottom: 4px;">Today</div>
                                    <div style="font-size: 24px; margin-bottom: 4px;">${getOpenMeteoIcon(forecast.today.weatherCode, true)}</div>
                                </div>
                                <div style="display: flex; justify-content: space-between; font-size: 14px;">
                                    <span>Max: <strong>${forecast.today.max}°C</strong></span>
                                    <span>Min: <strong>${forecast.today.min}°C</strong></span>
                                </div>
                                ${forecast.today.precipitation > 0 ? `
                                <div style="text-align: center; margin-top: 4px; font-size: 12px; color: rgb(var(--nasa-blue));">
                                    🌧️ ${forecast.today.precipitation} mm
                                </div>
                                ` : ''}
                            </div>
                            
                            <!-- Mañana -->
                            <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;">
                                <div style="text-align: center; margin-bottom: 8px;">
                                    <div style="font-weight: bold; margin-bottom: 4px;">Tomorrow</div>
                                    <div style="font-size: 24px; margin-bottom: 4px;">${getOpenMeteoIcon(forecast.tomorrow.weatherCode, true)}</div>
                                </div>
                                <div style="display: flex; justify-content: space-between; font-size: 14px;">
                                    <span>Max: <strong>${forecast.tomorrow.max}°C</strong></span>
                                    <span>Min: <strong>${forecast.tomorrow.min}°C</strong></span>
                                </div>
                                ${forecast.tomorrow.precipitation > 0 ? `
                                <div style="text-align: center; margin-top: 4px; font-size: 12px; color: rgb(var(--nasa-blue));">
                                    🌧️ ${forecast.tomorrow.precipitation} mm
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Información adicional -->
                    <div style="background: rgba(var(--nasa-green), 0.1); border-radius: 12px; padding: 16px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12px;">
                            <div>
                                <strong>📍 Coordinates:</strong><br>
                                ${lat.toFixed(4)}, ${lon.toFixed(4)}
                            </div>
                            <div>
                                <strong>🕐 Updated:</strong><br>
                                ${current.timestamp.toLocaleTimeString()}
                            </div>
                        </div>
                        
                        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
                            <span style="font-size: 10px; color: rgb(var(--muted-foreground));">
                                Data provided by Open-Meteo | Updated every hour
                            </span>
                        </div>
                    </div>
                    
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Error loading weather data:', error);
        weatherModal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <div class="modal-title">⚠️ Error - ${cityName}</div>
                    <button class="close-btn" onclick="closeWeatherModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; padding: 40px;">
                        <div style="font-size: 48px; margin-bottom: 16px;">😔</div>
                        <div style="font-size: 18px; margin-bottom: 8px; color: rgb(var(--nasa-red));">Data can not be displayed</div>
                        <div style="font-size: 14px; color: rgb(var(--muted-foreground)); margin-bottom: 20px;">
                            Error: ${error.message}
                        </div>
                        <button onclick="showWeatherModal('${cityName}', ${lat}, ${lon})" class="btn btn-primary">
                            🔄 Retry
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

// ===== FUNCIÓN PARA CERRAR EL MODAL =====
function closeWeatherModal() {
    const weatherModal = document.querySelector('#weather-modal');
    if (weatherModal) {
        weatherModal.classList.remove('show');
    }
}

// ===== MODIFICAR LA FUNCIÓN initializeMap PARA INTEGRAR EL MODAL =====
function initializeMap() {
    map = L.map('map').setView([20, 0], 2);

    // Mapa base modo oscuro por defecto
    const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19,
    }).addTo(map);

    // Capas base adicionales
    const osmStandard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    const osmHumanitarian = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png');
    const osmTopo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png');

    // Lista de ciudades con coordenadas
    const cities = [
        { name: "Madrid", lat: 40.4168, lon: -3.7038 },
        { name: "Barcelona", lat: 41.3874, lon: 2.1686 },
        { name: "Šibenik", lat: 43.7369, lon: 15.89 },
        { name: "New York", lat: 40.7128, lon: -74.0060 },
        { name: "Tokyo", lat: 35.6762, lon: 139.6503 },
        { name: "El Cairo", lat: 30.0444, lon: 31.2357 },
        { name: "Mascate", lat: 23.5880, lon: 58.3829 },
        { name: "Kuwait", lat: 29.3759, lon: 47.9774 },
        { name: "Timbuktu", lat: 16.7666, lon: -3.0026 },
        { name: "Abuja", lat: 9.0579, lon: 7.4951 },
        { name: "Johannesburg", lat: -26.2041, lon: 28.0473 },
        { name: "Cape Town", lat: -33.9249, lon: 18.4241 },
        { name: "Antananarivo", lat: -18.8792, lon: 47.5079 },
        { name: "Saint-Denis", lat: -20.8821, lon: 55.4504 },
        { name: "Nueva Delhi", lat: 28.6139, lon: 77.2090 },
        { name: "St Petersburg", lat: 59.9343, lon: 30.3351 },
        { name: "Riga", lat: 56.9496, lon: 24.1052 },
        { name: "Bucarest", lat: 44.4268, lon: 26.1025 },
        { name: "Praga", lat: 50.0755, lon: 14.4378 },
        { name: "Monaco", lat: 43.7384, lon: 7.4246 },
        { name: "Rome", lat: 41.9028, lon: 12.4964 },
        { name: "Athens", lat: 37.9838, lon: 23.7275 },
        { name: "San Diego", lat: 32.7157, lon: -117.1611 },
        { name: "Houston", lat: 29.7604, lon: -95.3698 },
        { name: "Seattle", lat: 47.6062, lon: -122.3321 },
        { name: "Wichita", lat: 37.6922, lon: -97.3375 },
        { name: "Nashville", lat: 36.1627, lon: -86.7816 },
        { name: "Lima", lat: -12.0464, lon: -77.0428 },
        { name: "San Jose del Cabo", lat: 23.0572, lon: -109.7020 },
        { name: "Oranjestad", lat: 12.5186, lon: -70.0358 },
        { name: "Bridgetown", lat: 13.0975, lon: -59.6167 },
        { name: "Saint George", lat: 12.0561, lon: -61.7486 },
        { name: "Nassau", lat: 25.0343, lon: -77.3963 },
        { name: "Asmara", lat: 15.3229, lon: 38.9251 },
        { name: "Berlin", lat: 52.5200, lon: 13.4050 },
        { name: "Tiraspol", lat: 46.8413, lon: 29.6283 },
        { name: "Melbourne", lat: -37.8136, lon: 144.9631 },
        { name: "Devonport", lat: -41.1800, lon: 146.3500 },
        { name: "Flying Fish Cove", lat: -10.4211, lon: 105.6797 },
        { name: "Yakarta", lat: -6.1751, lon: 106.8650 },
        { name: "Bandar Seri Begawan", lat: 4.9031, lon: 114.9398 },
        { name: "Auckland", lat: -36.8485, lon: 174.7633 }
    ];

    // Crear marcadores con onClick para abrir el modal meteorológico
    const cityMarkers = cities.map((city) => {
        const marker = L.marker([city.lat, city.lon]).bindPopup(`
            <div class="container-modal-cities">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">${city.name}</h3>
                <div style="margin-bottom: 12px; font-size: 12px; color: rgb(var(--muted-foreground));">
                    📍 ${city.lat.toFixed(2)}, ${city.lon.toFixed(2)}
                </div>
                <button class="button-modal-cities" onclick="showWeatherModal('${city.name}', ${city.lat}, ${city.lon})">
                    🌤️ Show more
                </button>
            </div>
        `);

        return marker;
    });

    // Crear capa de marcadores de ciudades
    const markerLayer = L.layerGroup(cityMarkers);

    // Crear control de capas
    layerControl = L.control.layers(
        { "Dark": darkLayer, "Estándar": osmStandard, "Humanitario": osmHumanitarian, "Topográfico": osmTopo },
        { "Ciudades": markerLayer }
    );

    // Añadir capa por defecto
    darkLayer.addTo(map);
    map.hasLayerControl = false;

    // Botón toggle para capas
    const toggleBtn = document.getElementById("toggle-layers");
    if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
            if (map.hasLayerControl) {
                map.removeControl(layerControl);
                map.hasLayerControl = false;
            } else {
                layerControl.addTo(map);
                map.hasLayerControl = true;
            }
        });
    }
}

// ===== CERRAR MODAL CON ESC =====
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeWeatherModal();
    }
});

// ===== CERRAR MODAL CLICANDO FUERA =====
document.addEventListener('click', (e) => {
    const weatherModal = document.querySelector('#weather-modal');
    if (weatherModal && e.target === weatherModal) {
        closeWeatherModal();
    }
});

console.log("Abriendo modal", cityName, lat, lon);