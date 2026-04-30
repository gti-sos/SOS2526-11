<script>
    import { onMount } from 'svelte';
    import Highcharts from 'highcharts';

    let error = $state("");
    let loading = $state(true);

    onMount(async () => {
        try {
            // Obtenemos solo los datos de MRG
            const res = await fetch('/api/v2/alcohol-consumptions-per-capita');
            let data = await res.json();
            
            if(!res.ok) throw new Error(data.error || "No se encontraron datos");

            // Ordenar por país primero, y luego por año internamente para que la gráfica tenga sentido cronológico
            data.sort((a, b) => {
                if (a.nation < b.nation) return -1;
                if (a.nation > b.nation) return 1;
                return a.date_year - b.date_year;
            });

            // Generar las etiquetas del Eje X: País (Año)
            const categories = data.map(d => {
                let n = d.nation || "Unknown";
                return `${n.charAt(0).toUpperCase() + n.slice(1)} (${d.date_year})`;
            });

            // Generar las series
            const recordedData = data.map(d => d.recorded_consumption || 0);
            const unrecordedData = data.map(d => d.unrecorded_consumption || 0);

            Highcharts.chart('individual-chart-container', {
                chart: {
                    type: 'area', // Distinto a line y column
                    backgroundColor: 'transparent'
                },
                title: {
                    text: 'Análisis de Consumo de Alcohol (Highcharts)',
                    style: { color: '#e5c07b' }
                },
                subtitle: {
                    text: 'Proporción de Consumo Registrado vs Clandestino/No Registrado',
                    style: { color: '#abb2bf' }
                },
                xAxis: {
                    categories: categories,
                    tickmarkPlacement: 'on',
                    title: { enabled: false },
                    labels: { style: { color: '#abb2bf' } }
                },
                yAxis: {
                    title: { text: 'Litros / Capita', style: { color: '#abb2bf' } },
                    labels: { style: { color: '#abb2bf' } }
                },
                tooltip: {
                    shared: true,
                    valueSuffix: ' litros'
                },
                plotOptions: {
                    area: {
                        stacking: 'normal',
                        lineColor: '#666666',
                        lineWidth: 1,
                        marker: {
                            lineWidth: 1,
                            lineColor: '#666666'
                        }
                    }
                },
                series: [
                    {
                        name: 'Consumo No Registrado',
                        data: unrecordedData,
                        color: '#e06c75'
                    },
                    {
                        name: 'Consumo Registrado',
                        data: recordedData,
                        color: '#61afef'
                    }
                ],
                legend: {
                    itemStyle: { color: '#abb2bf' },
                    itemHoverStyle: { color: '#ffffff' }
                }
            });

            loading = false;
        } catch(err) {
            console.error(err);
            error = "Hubo un error cargando el gráfico individual: " + err.message;
            loading = false;
        }

        // ---- Widgets externos (MRG: Nutritionix, USDA, API-Ninjas) ----
        try {
            await import('highcharts/highcharts-more');
            await import('highcharts/modules/treemap');
        } catch (e) { console.warn('Highcharts modules', e); }

        // 1. Nutritionix -> bubble
        fetch('/api/integrations/mrg/nutritionix-activity').then(r => r.json()).then(d => {
            Highcharts.chart('oauth-bubble', {
                chart: { type: 'bubble', backgroundColor: 'transparent', plotBorderWidth: 1, zoomType: 'xy' },
                title: { text: 'Alcohol vs salud (Nutritionix + DB propia)', style: { color: '#e5c07b' } },
                xAxis: { title: { text: 'Consumo alcohol', style: { color: '#abb2bf' } }, labels: { style: { color: '#abb2bf' } } },
                yAxis: { title: { text: 'Esperanza vida (proxy)', style: { color: '#abb2bf' } }, labels: { style: { color: '#abb2bf' } } },
                tooltip: { useHTML: true, pointFormat: '<b>{point.name}</b><br>Alcohol: {point.x}<br>Vida: {point.y}<br>Cal/10: {point.z}' },
                series: d.series,
                legend: { itemStyle: { color: '#abb2bf' } }
            });
        }).catch(e => console.error('bubble', e));

        // 2. USDA FoodData -> treemap
        fetch('/api/integrations/mrg/usda-health').then(r => r.json()).then(d => {
            Highcharts.chart('oauth-treemap', {
                chart: { backgroundColor: 'transparent' },
                title: { text: 'Consumo año/país (USDA + DB propia)', style: { color: '#e5c07b' } },
                tooltip: { pointFormat: '<b>{point.name}</b>: {point.value}' },
                series: [{ type: 'treemap', layoutAlgorithm: 'squarified', allowTraversingTree: true, data: d.data }]
            });
        }).catch(e => console.error('treemap', e));

        // 3. API-Ninjas Nutrition -> packedbubble
        fetch('/api/integrations/mrg/apininjas-nutrition').then(r => r.json()).then(d => {
            Highcharts.chart('oauth-packedbubble', {
                chart: { type: 'packedbubble', backgroundColor: 'transparent' },
                title: { text: 'Consumo agrupado por país (API-Ninjas + DB propia)', style: { color: '#e5c07b' } },
                tooltip: { useHTML: true, pointFormat: '<b>{point.name}</b>: {point.value}' },
                plotOptions: { packedbubble: { minSize: '20%', maxSize: '100%', layoutAlgorithm: { gravitationalConstant: 0.05 } } },
                series: d.series,
                legend: { itemStyle: { color: '#abb2bf' } }
            });
        }).catch(e => console.error('packedbubble', e));
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
        color: #61afef;
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
        color: #98c379;
        font-size: 1.2rem;
        padding: 3rem;
    }
    
    .back-btn {
        display: inline-block;
        margin-bottom: 1rem;
        color: #61afef;
        text-decoration: none;
        border: 1px solid #61afef;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        transition: all 0.3s ease;
    }
    
    .back-btn:hover {
        background: rgba(97, 175, 239, 0.1);
    }
</style>

<svelte:head>
    <title>Analítica Individual | Alcohol</title>
</svelte:head>

<main>
    <a href="/alcohol-consumptions-per-capita" class="back-btn">← Volver a Datos</a>
    
    <h1>Visualización Individual (Alcohol)</h1>
    
    {#if error}
        <div class="error">{error}</div>
    {/if}

    <div class="loading" style="display: {loading && !error ? 'block' : 'none'};">
        Cargando datos de alcohol...
    </div>

    <div class="chart-box" style="display: {loading || error ? 'none' : 'block'};">
        <div id="individual-chart-container"></div>
    </div>

    <h1 style="margin-top: 3rem;">Integraciones OAuth2 (3 APIs externas)</h1>
    <div class="chart-box"><div id="oauth-bubble" class="oauth-chart"></div></div>
    <div class="chart-box"><div id="oauth-treemap" class="oauth-chart"></div></div>
    <div class="chart-box"><div id="oauth-packedbubble" class="oauth-chart"></div></div>
</main>
