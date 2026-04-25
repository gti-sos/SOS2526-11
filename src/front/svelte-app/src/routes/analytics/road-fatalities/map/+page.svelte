<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    // @ts-ignore
    let mapElement;
    let map;
    let error = $state("");
    let loading = $state(true);

    // Diccionario de caché local (ultra-rápido) para los países por defecto
    const coordsCache = {
        'albania': [41.1533, 20.1683],
        'angola': [-11.2027, 17.8739],
        'argentina': [-38.4161, -63.6167],
        'armenia': [40.0691, 45.0382],
        'australia': [-25.2744, 133.7751],
        'austria': [47.5162, 14.5501],
        'belgium': [50.5039, 4.4699],
        'brazil': [-14.2350, -51.9253],
        'canada': [56.1304, -106.3468],
        'chile': [-35.6751, -71.5430],
        'spain': [40.4637, -3.7492],
        'mexico': [23.6345, -102.5528],
        'germany': [51.1657, 10.4515],
        'france': [46.2276, 2.2137],
        'italy': [41.8719, 12.5674],
        'united kingdom': [55.3781, -3.4360],
        'japan': [36.2048, 138.2529],
        'south korea': [35.9078, 127.7669],
        'india': [20.5937, 78.9629],
        'china': [35.8617, 104.1954],
        'russia': [61.5240, 105.3188],
        'united states': [37.0902, -95.7129],
        'new zealand': [-40.9006, 174.8860],
        'south africa': [-30.5595, 22.9375],
        'egypt': [26.8206, 30.8025],
        'nigeria': [9.0820, 8.6753],
        'thailand': [15.8700, 100.9925],
        // @ts-ignore
        'india': [20.5937, 78.9629]
    };

    // Función asíncrona para obtener coordenadas: intenta en caché, si no, usa API externa
    // @ts-ignore
    async function getCoordinates(nation) {
        let n = nation.toLowerCase().trim();
        // @ts-ignore
        if (coordsCache[n]) return coordsCache[n];

        // Fallback: Llamada a restcountries para países creados por el usuario
        try {
            const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(n)}`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0 && data[0].latlng) {
                    // @ts-ignore
                    coordsCache[n] = data[0].latlng; // Guardamos en caché local para próximas veces
                    return data[0].latlng;
                }
            }
        } catch (e) {
            console.warn(`No se pudo geolocalizar de forma automática: ${nation}`);
        }
        return null;
    }

    onMount(async () => {
        if (!browser) return; // Leaflet requiere correr estrictamente en el cliente (browser)

        try {
            // Verificar que el elemento existe
            // @ts-ignore
            if (!mapElement) {
                throw new Error("El contenedor del mapa no está disponible");
            }

            // Importar leaflet dinámicamente para que no choque con Server-Side Rendering
            // @ts-ignore
            const L = (await import('leaflet')).default;
            // Se debe importar los estilos base de la librería si no están globales
            await import('leaflet/dist/leaflet.css');

            // Reparar icono de leaflet roto dinámicamente
            // @ts-ignore
            delete L.Icon.Default.prototype._getIconUrl;
            // @ts-ignore
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            });

            // 1. Instanciamos el mapa
            map = L.map(mapElement).setView([20, 0], 2);

            // 2. Cargamos tiles libres de OpenStreetMap
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18
            }).addTo(map);

            // 3. Obtenemos nuestros datos de la API v2
            const res = await fetch('/api/v2/road-fatalities');
            if(!res.ok) throw new Error("Error al obtener la lista de datos: " + res.statusText);
            const rawData = await res.json();

            if (!Array.isArray(rawData)) {
                throw new Error("Los datos retornados no son un array válido");
            }

            // Agruparemos por país (mostrando solo el año más reciente de cada uno para no duplicar marcadores)
            let groupedData = {};
            rawData.forEach(item => {
                if (item.nation && item.year !== undefined) {
                    let n = item.nation.toLowerCase().trim();
                    // @ts-ignore
                    if (!groupedData[n] || item.year > groupedData[n].year) {
                        // @ts-ignore
                        groupedData[n] = item;
                    }
                }
            });

            // 4. Dibujar marcadores
            for (const [nat, item] of Object.entries(groupedData)) {
                let coords = await getCoordinates(nat);
                if (coords) {
                    let totalDeath = parseInt(item.total_death) || 0;
                    let popDeathRate = parseFloat(item.population_death_rate) || 0;
                    let vehDeathRate = parseFloat(item.vehicle_death_rate) || 0;
                    let distDeathRate = parseFloat(item.distance_death_rate) || 0;
                    let cap = nat.charAt(0).toUpperCase() + nat.slice(1);
                    
                    // Elegir un radio dinámico basado en total de muertes
                    let radiusSize = Math.max(Math.min(totalDeath / 50, 30), 5); 

                    // Dibujar un CircleMarker para estética analítica
                    L.circleMarker(coords, {
                        color: '#e06c75', // borde rojo
                        fillColor: '#c41e3a', // relleno rojo oscuro
                        fillOpacity: 0.7,
                        radius: radiusSize,
                        weight: 2
                    }).addTo(map)
                      .bindPopup(`
                        <div style="text-align:center; font-size: 12px;">
                            <strong>${cap}</strong> (${item.year})<br/>
                            <hr style="margin:5px 0;">
                            Muertes Totales: <b>${totalDeath}</b><br/>
                            Tasa por Población: ${popDeathRate.toFixed(2)}<br/>
                            Tasa por Vehículos: ${vehDeathRate.toFixed(2)}<br/>
                            Tasa por Distancia: ${distDeathRate.toFixed(2)}<br/>
                            Nivel Ingreso: ${item.income_level || 'N/A'}<br/>
                            Lado Tráfico: ${item.traffic_side || 'N/A'}
                        </div>
                      `);
                }
            }

            loading = false;
        } catch(err) {
            console.error("Error en mapa de road-fatalities:", err);
            // @ts-ignore
            error = "Hubo un error inicializando el mapa: " + err.message;
            loading = false;
        }
    });
</script>

<style>
    main {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
        color: #abb2bf;
    }

    h1 {
        text-align: center;
        color: #e06c75;
        margin-bottom: 2rem;
        font-family: 'Inter', sans-serif;
    }

    .map-box {
        background: #282c34;
        border-radius: 8px;
        padding: 1rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        margin-top: 20px;
    }

    /* Contenedor central obligatorio de leaflet */
    .leaflet-container-box {
        width: 100%;
        height: 60vh;
        min-height: 500px;
        border-radius: 4px;
        z-index: 1; /* Previene overrides de header en algunos casos */
    }

    .error {
        color: #e06c75;
        text-align: center;
        background: rgba(224, 108, 117, 0.1);
        padding: 1rem;
        border-radius: 4px;
        border: 1px solid #e06c75;
    }

    .loading {
        text-align: center;
        color: #61afef;
        font-size: 1.2rem;
        padding: 3rem;
    }
    
    .back-btn {
        display: inline-block;
        margin-bottom: 1rem;
        color: #e06c75;
        text-decoration: none;
        border: 1px solid #e06c75;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        transition: all 0.3s ease;
    }
    
    .back-btn:hover {
        background: rgba(224, 108, 117, 0.1);
    }
</style>

<svelte:head>
    <title>Mapa Geoespacial | Muertes por Accidentes de Tráfico</title>
</svelte:head>

<main>
    <a href="/road-fatalities" class="back-btn">← Volver a Datos</a>
    
    <h1>Distribución Mundial de Muertes por Accidentes de Tráfico</h1>
    
    {#if error}
        <div class="error">{error}</div>
    {/if}

    {#if loading}
        <div class="loading">Cargando mapa...</div>
    {/if}
    
    <div class="map-box">
        <div bind:this={mapElement} class="leaflet-container-box"></div>
    </div>
</main>
