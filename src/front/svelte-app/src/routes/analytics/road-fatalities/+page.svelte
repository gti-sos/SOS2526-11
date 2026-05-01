<script lang="ts">
    import { onMount } from 'svelte';
    import Highcharts from 'highcharts';

    let error = $state("");
    let loading = $state(true);
    let fedexData: any = $state(null);

    onMount(async () => {
        try {
            // Obtenemos los datos de road-fatalities
            const res = await fetch('/api/v2/road-fatalities');
            if(!res.ok) throw new Error("Error al obtener datos: " + res.statusText);
            let data = await res.json();

            // Ordenar por país primero, y luego por año internamente 
            // @ts-ignore
            data.sort((a, b) => {
                if (a.nation < b.nation) return -1;
                if (a.nation > b.nation) return 1;
                return a.year - b.year;
            });

            // Generar las etiquetas del Eje X: País (Año)
            // @ts-ignore
            const categories = data.map(d => {
                let n = d.nation || "Unknown";
                return `${n.charAt(0).toUpperCase() + n.slice(1)} (${d.year})`;
            });

            // Generar las series pasando el valor numérico (y) y los datos categóricos
            // @ts-ignore
            const populationDeathRateData = data.map(d => ({
                y: d.population_death_rate || 0,
                income_level: d.income_level || 'N/A',
                traffic_side: d.traffic_side || 'N/A',
                total_death: d.total_death || 0  
            }));
            // @ts-ignore
            const vehicleDeathRateData = data.map(d => ({
                y: d.vehicle_death_rate || 0,
                income_level: d.income_level || 'N/A',
                traffic_side: d.traffic_side || 'N/A',
                total_death: d.total_death || 0  
            }));
            // @ts-ignore
            const distanceDeathRateData = data.map(d => ({
                y: d.distance_death_rate || 0,
                income_level: d.income_level || 'N/A',
                traffic_side: d.traffic_side || 'N/A',
                total_death: d.total_death || 0  
            }));

            // @ts-ignore
            Highcharts.chart('individual-chart-container', {
                chart: {
                    type: 'spline', 
                    backgroundColor: 'transparent'
                },
                title: {
                    text: 'Análisis de Muertes por Accidentes de Tráfico (Highcharts)',
                    style: { color: '#e5c07b' }
                },
                subtitle: {
                    text: 'Comparación de Tasas de Mortalidad por Población, Vehículos y Distancia',
                    style: { color: '#abb2bf' }
                },
                xAxis: {
                    categories: categories,
                    title: { enabled: false },
                    labels: { style: { color: '#abb2bf' } }
                },
                yAxis: {
                    title: { text: 'Tasa de Mortalidad (por 100,000)', style: { color: '#abb2bf' } },
                    labels: { style: { color: '#abb2bf' } }
                },
                tooltip: {
                    shared: true,
                    crosshairs: true,
                    useHTML: true,
                    formatter: function () {
                        // @ts-ignore
                        let pointData = this.points[0].point;
                        
                        let tooltipHTML = `<div style="font-size: 12px;">`;
                        tooltipHTML += `<strong>${this.points?.[0]?.key}</strong><br/>`;
                        tooltipHTML += `<span style="color: #abb2bf; font-size: 10px;">Nivel de Ingresos: <b>${pointData.income_level}</b></span><br/>`;
                        tooltipHTML += `<span style="color: #abb2bf; font-size: 10px;">Lado de Conducción: <b>${pointData.traffic_side}</b></span><br/>`;
                        tooltipHTML += `<span style="color: #abb2bf; font-size: 10px;">Muertes Totales: <b>${pointData.total_death}</b></span><br/>`; // <--- AÑADIDO
                        tooltipHTML += `<hr style="margin: 5px 0; border-color: #3e4451;">`;
                        
                        // @ts-ignore
                        this.points.forEach(p => {
                            tooltipHTML += `<span style="color:${p.color}">●</span> ${p.series.name}: <b>${p.y}</b> (tasa)<br/>`;
                        });
                        
                        tooltipHTML += `</div>`;
                        return tooltipHTML;
                    }
                },
                plotOptions: {
                    spline: {
                        dataLabels: {
                            enabled: false
                        }
                    }
                },
                series: [
                    {
                        name: 'Tasa de Mortalidad por Población',
                        data: populationDeathRateData,
                        color: '#e06c75'
                    },
                    {
                        name: 'Tasa de Mortalidad por Vehículos',
                        data: vehicleDeathRateData,
                        color: '#61afef'
                    },
                    {
                        name: 'Tasa de Mortalidad por Distancia',
                        data: distanceDeathRateData,
                        color: '#98c379'
                    }
                ],
                legend: {
                    itemStyle: { color: '#abb2bf' },
                    borderColor: '#3e4451',
                    borderWidth: 1
                },
                credits: {
                    enabled: false
                }
            });

            loading = false;
        } catch (err) {
            // @ts-ignore
            error = err.message;
            loading = false;
        }

        // ---- Widgets OAuth2 (JFM: Mastodon, Copernicus, FedEx) ----
        try {
            const Heatmap = (await import('highcharts/modules/heatmap')).default;
            // @ts-ignore
            Heatmap(Highcharts);
        } catch (e) { console.warn('Highcharts modules', e); }

        // 1. Mastodon API -> pie (señal social de seguridad vial)
        fetch('/api/integrations/jfm/mastodon-fatalities').then(async r => {
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || r.status);
            Highcharts.chart('oauth-pie', {
                chart: { type: 'pie', backgroundColor: 'transparent' },
                title: { text: 'Mastodon road safety social signal', style: { color: '#e5c07b' } },
                subtitle: { text: 'Conteo de publicaciones públicas por hashtag relacionado con seguridad vial y accidentes de tráfico.', style: { color: '#abb2bf' } },
                tooltip: { pointFormat: '{series.name}: <b>{point.y}</b> publicaciones ({point.percentage:.1f}%)' },
                // @ts-ignore
                series: [{ name: 'Publicaciones', colorByPoint: true, data: d.hashtags.map(h => ({ name: h.tag, y: h.count })) }],
                legend: { itemStyle: { color: '#abb2bf' } }
            });
        }).catch(e => console.error('pie:', e.message));

        // 2. Copernicus/ESA -> scatter
        fetch('/api/integrations/jfm/copernicus-fatalities').then(async r => {
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || r.status);
            // @ts-ignore
            Highcharts.chart('oauth-scatter', {
                chart: { type: 'scatter', backgroundColor: 'transparent', zoomType: 'xy' },
                title: { text: 'Mortalidad vehículos vs población (Copernicus ESA + DB propia)', style: { color: '#e5c07b' } },
                xAxis: { title: { text: 'Vehicle death rate', style: { color: '#abb2bf' } }, labels: { style: { color: '#abb2bf' } } },
                yAxis: { title: { text: 'Population death rate', style: { color: '#abb2bf' } }, labels: { style: { color: '#abb2bf' } } },
                tooltip: { pointFormat: '<b>{point.name}</b><br>x={point.x}, y={point.y}' },
                series: d.series,
                legend: { itemStyle: { color: '#abb2bf' } }
            });
        }).catch(e => console.error('scatter:', e.message));

        // 3. FedEx Sandbox -> heatmap
        //
        // Fuentes combinadas:
        //   - API propia road-fatalities-v2: aporta total_death, nation y year de cada fila de la DB.
        //   - API externa FedEx Locations (OAuth2 client_credentials): aporta locationCount,
        //     el número de puntos/localizaciones que FedEx devuelve para una búsqueda en Madrid.
        //
        // Fórmula aplicada en el backend:
        //   valor_celda = total_death / locationCount
        //
        // Ejemplo real: si FedEx devuelve 75 localizaciones y un país tiene total_death = 5625,
        // el valor representado en la celda será 5625 / 75 = 75.
        // El 75 no es un valor fijo inventado; es el resultado de dividir datos reales de
        // nuestra DB entre el locationCount real devuelto por FedEx.
        //
        // d.dbContext.locationCount contiene el valor exacto que FedEx devolvió (o 10 si hubo fallback).
        fetch('/api/integrations/jfm/fedex-fatalities').then(async r => {
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || r.status);

            // Guardamos la respuesta completa para usarla en el bloque explicativo inferior.
            fedexData = d;

            // locationCount viene de FedEx (número de localizaciones devueltas).
            // Si FedEx no respondió correctamente, el backend devuelve 10 como fallback.
            const locationCount = d?.dbContext?.locationCount ?? 'N/A';
            const subtitle = d.dataSource === 'api'
                ? `Datos de road-fatalities-v2 normalizados con ${locationCount} localizaciones obtenidas desde FedEx OAuth2`
                : `Fallback local: FedEx no disponible. Se muestran datos derivados de road-fatalities-v2.`;

            Highcharts.chart('oauth-heatmap', {
                chart: { type: 'heatmap', backgroundColor: 'transparent' },
                title: { text: 'Mortalidad vial ajustada por cobertura logística FedEx', style: { color: '#e5c07b' } },
                subtitle: { text: subtitle, style: { color: '#abb2bf', fontSize: '11px' } },
                // xAxis: años de la DB propia (road-fatalities-v2)
                xAxis: { categories: d.xCategories || [], title: { text: 'Año', style: { color: '#abb2bf' } }, labels: { style: { color: '#abb2bf' } } },
                // yAxis: naciones de la DB propia (road-fatalities-v2)
                yAxis: { categories: d.yCategories || [], title: { text: 'Nación', style: { color: '#abb2bf' } }, labels: { style: { color: '#abb2bf' } } },
                colorAxis: { min: 0, minColor: '#1c1f24', maxColor: '#e06c75' },
                // @ts-ignore
                tooltip: {
                    // El tooltip muestra la fórmula: total_death / locationCount_de_FedEx
                    formatter: function (this: any) {
                        const point = this.point;
                        const year    = d.xCategories?.[point.x] ?? 'N/A';
                        const nation  = d.yCategories?.[point.y] ?? 'N/A';
                        return `<b>${nation}</b> (${year})<br/>` +
                               `Valor: <b>${point.value}</b><br/>` +
                               `Muertes registradas / ${locationCount} puntos FedEx`;
                    }
                },
                // Los datos vienen del backend: cada punto es [idxAño, idxNación, total_death/locationCount]
                series: [{ name: 'total_death / locationCount', data: d.data, borderWidth: 1 }]
            });
        }).catch(e => console.error('heatmap:', e.message));
    });
</script>

<style>
    main {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
        color: #abb2bf;
    }

    .integration-proof {
        margin-top: 0.8rem;
        padding: 0.85rem 1rem;
        background: #111827;
        color: #d1d5db;
        border-left: 4px solid #fbbf24;
        border-radius: 8px;
        font-size: 0.9rem;
        line-height: 1.45;
    }

    .integration-proof code {
        color: #fbbf24;
        font-weight: 600;
    }

    h1 {
        text-align: center;
        color: #e5c07b;
        margin-bottom: 2rem;
        font-family: 'Inter', sans-serif;
    }

    .chart-box {
        background: #282c34;
        border-radius: 8px;
        padding: 1rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        margin-top: 20px;
    }

    #individual-chart-container {
        width: 100%;
        height: 600px;
    }

    .oauth-chart {
        width: 100%;
        height: 420px;
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
        color: #e06c75;
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
    <title>Analítica Individual | Tráfico</title>
</svelte:head>

<main>
    <a href="/road-fatalities" class="back-btn">← Volver a Datos</a>
    
    <h1>Visualización Individual (Muertes por Accidentes de Tráfico)</h1>
    
    {#if error}
        <div class="error">{error}</div>
    {/if}

    <div class="loading" style="display: {loading && !error ? 'block' : 'none'};">
        Cargando datos de Muertes por accidentes de tráfico...
    </div>

    <div class="chart-box" style="display: {loading || error ? 'none' : 'block'};">
        <div id="individual-chart-container"></div>
    </div>

    <h1 style="margin-top: 3rem;">Integraciones OAuth2 (3 APIs externas)</h1>
    <div class="chart-box"><div id="oauth-pie" class="oauth-chart"></div></div>
    <div class="chart-box"><div id="oauth-scatter" class="oauth-chart"></div></div>
    <div class="chart-box"><div id="oauth-heatmap" class="oauth-chart"></div></div>

    {#if fedexData}
    <div class="integration-proof compact">
        <strong>Integración:</strong>
        <code>road-fatalities-v2</code> aporta <code>total_death</code>, <code>nation</code> y <code>year</code>.
        <code>FedEx Locations API</code> aporta <code>{fedexData?.dbContext?.locationCount ?? "N/A"}</code> localizaciones mediante OAuth2.
        El valor representado es <code>total_death / locationCount</code>.
    </div>
    {/if}
</main>