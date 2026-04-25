<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

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
        'mexico': [23.6345, -102.5528]
    };

    // Función asíncrona para obtener coordenadas: intenta en caché, si no, usa API externa
    async function getCoordinates(country) {
        let c = country.toLowerCase().trim();
        if (coordsCache[c]) return coordsCache[c];

        // Fallback: Llamada a restcountries para países creados por el usuario
        try {
            const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(c)}`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0 && data[0].latlng) {
                    coordsCache[c] = data[0].latlng; // Guardamos en caché local para próximas veces
                    return data[0].latlng;
                }
            }
        } catch (e) {
            console.warn(`No se pudo geolocalizar de forma automática: ${country}`);
        }
        return null;
    }

    onMount(async () => {
        if (!browser) return; // Leaflet requiere correr estrictamente en el cliente (browser)

        try {
            // Verificar que el elemento existe
            if (!mapElement) {
                throw new Error("El contenedor del mapa no está disponible");
            }

            // Importar leaflet dinámicamente para que no choque con Server-Side Rendering
            const L = (await import('leaflet')).default;
            // Se debe importar los estilos base de la librería si no están globales
            await import('leaflet/dist/leaflet.css');

            // Reparar icono de leaflet roto dinámicamente
            delete L.Icon.Default.prototype._getIconUrl;
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
            const res = await fetch('/api/v2/literacy-rates');
            if(!res.ok) throw new Error("Error al obtener la lista de datos: " + res.statusText);
            const rawData = await res.json();

            if (!Array.isArray(rawData)) {
                throw new Error("Los datos retornados no son un array válido");
            }

            // Agruparemos por país (mostrando solo el año más reciente de cada uno para no duplicar marcadores)
            let groupedData = {};
            rawData.forEach(item => {
                if (item.country && item.year !== undefined) {
                    let c = item.country.toLowerCase().trim();
                    if (!groupedData[c] || item.year > groupedData[c].year) {
                        groupedData[c] = item;
                    }
                }
            });

            // 4. Dibujar marcadores
            for (const [ctry, item] of Object.entries(groupedData)) {
                let coords = await getCoordinates(ctry);
                if (coords) {
                    let total = parseFloat(item.total) || 0;
                    let male = parseFloat(item.male) || 0;
                    let female = parseFloat(item.female) || 0;
                    let cap = ctry.charAt(0).toUpperCase() + ctry.slice(1);
                    
                    // Elegir un radio dinámico basado en porcentaje de alfabetización
                    let radiusSize = Math.max(Math.min(total / 3, 30), 5); 

                    // Dibujar un CircleMarker para estética analítica
                    L.circleMarker(coords, {
                        color: '#61afef', // borde azul
                        fillColor: '#98c379', // relleno verde
                        fillOpacity: 0.7,
                        radius: radiusSize,
                        weight: 2
                    }).addTo(map)
                      .bindPopup(`
                        <div style="text-align:center; font-size: 12px;">
                            <strong>${cap}</strong> (${item.year})<br/>
                            <hr style="margin:5px 0;">
                            Alfabetización Total: <b>${total.toFixed(2)}%</b><br/>
                            Hombres: ${male.toFixed(2)}%<br/>
                            Mujeres: ${female.toFixed(2)}%<br/>
                            Brecha: ${(parseFloat(item.gender_gap) || 0).toFixed(2)}%
                        </div>
                      `);
                }
            }

            loading = false;
        } catch(err) {
            console.error("Error en mapa de literacy-rates:", err);
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
        color: #98c379;
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
        color: #98c379;
        text-decoration: none;
        border: 1px solid #98c379;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        transition: all 0.3s ease;
    }
    
    .back-btn:hover {
        background: rgba(152, 195, 121, 0.1);
    }
</style>

<svelte:head>
    <title>Mapa Geoespacial | Literacy Rates</title>
</svelte:head>

<main>
    <a href="/literacy-rates" class="back-btn">← Volver a Datos</a>
    
    <h1>Distribución Mundial (Tasas de Alfabetización)</h1>
    
    {#if error}
        <div class="error">{error}</div>
    {/if}

    {#if loading}
        <div class="loading">Cargando ubicaciones y renderizando mapa open-source...</div>
    {/if}

    <div class="map-box" style="display: {loading ? 'none' : 'block'};">
        <!-- El div necesita `bind:this` para entregarlo directamente como elemento DOM a L.map() -->
        <div bind:this={mapElement} class="leaflet-container-box"></div>
    </div>
</main>
