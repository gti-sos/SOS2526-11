<script>
    import { onMount } from 'svelte';
    import Highcharts from 'highcharts';

    let error = $state("");
    let loading = $state(true);

    onMount(async () => {
        try {
            // Obtenemos solo los datos de TGG (Literacy Rates)
            const res = await fetch('/api/v2/literacy-rates');
            let data = await res.json();
            
            if(!res.ok) throw new Error(data.error || "No se encontraron datos");

            // Ordenar por país primero, y luego por año internamente
            data.sort((a, b) => {
                if (a.country < b.country) return -1;
                if (a.country > b.country) return 1;
                return a.year - b.year;
            });

            // Generar las etiquetas del Eje X: País (Año)
            const categories = data.map(d => {
                let c = d.country || "Unknown";
                return `${c.charAt(0).toUpperCase() + c.slice(1)} (${d.year})`;
            });

            // Generar las series
            const totalData = data.map(d => d.total || 0);
            const maleData = data.map(d => d.male || 0);
            const femaleData = data.map(d => d.female || 0);

            Highcharts.chart('individual-chart-container', {
                chart: {
                    type: 'bar', // Distinto a line, column y area
                    backgroundColor: 'transparent'
                },
                title: {
                    text: 'Análisis de Tasas de Alfabetización (Highcharts)',
                    style: { color: '#e5c07b' }
                },
                subtitle: {
                    text: 'Comparación de Alfabetización Total, Masculina y Femenina',
                    style: { color: '#abb2bf' }
                },
                xAxis: {
                    categories: categories,
                    title: { enabled: false },
                    labels: { style: { color: '#abb2bf' } }
                },
                yAxis: {
                    title: { text: 'Porcentaje (%)', style: { color: '#abb2bf' } },
                    labels: { style: { color: '#abb2bf' } }
                },
                tooltip: {
                    shared: true,
                    valueSuffix: ' %'
                },
                plotOptions: {
                    bar: {
                        dataLabels: {
                            enabled: false
                        }
                    }
                },
                series: [
                    {
                        name: 'Alfabetización Femenina',
                        data: femaleData,
                        color: '#e06c75'
                    },
                    {
                        name: 'Alfabetización Total',
                        data: totalData,
                        color: '#98c379'
                    },
                    {
                        name: 'Alfabetización Masculina',
                        data: maleData,
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

        // ---- Widgets OAuth2 (TGG: NewsAPI, Google, LinkedIn) ----
        try {
            const Funnel = (await import('highcharts/modules/funnel')).default;
            const VariablePie = (await import('highcharts/modules/variable-pie')).default;
            Funnel(Highcharts);
            VariablePie(Highcharts);
        } catch (e) { console.warn('Highcharts modules', e); }

        // 1. NewsAPI -> funnel
        fetch('/api/integrations/tgg/newsapi-education').then(async r => {
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || r.status);
            Highcharts.chart('oauth-funnel', {
                chart: { type: 'funnel', backgroundColor: 'transparent' },
                title: { text: 'Embudo educativo (NewsAPI + DB propia)', style: { color: '#e5c07b' } },
                tooltip: { pointFormat: '<b>{point.name}</b>: {point.y}' },
                plotOptions: { series: { dataLabels: { enabled: true, format: '<b>{point.name}</b> ({point.y})', style: { color: '#abb2bf' } }, neckWidth: '30%', neckHeight: '25%' } },
                series: d.series,
                legend: { itemStyle: { color: '#abb2bf' } }
            });
        }).catch(e => console.error('funnel:', e.message));

        // 2. Google -> pyramid
        fetch('/api/integrations/tgg/google-literacy').then(async r => {
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || r.status);
            Highcharts.chart('oauth-pyramid', {
                chart: { type: 'pyramid', backgroundColor: 'transparent' },
                title: { text: 'Alfabetización por tramos (Google + DB propia)', style: { color: '#e5c07b' } },
                tooltip: { pointFormat: '<b>{point.name}</b>: {point.y}' },
                plotOptions: { series: { dataLabels: { enabled: true, format: '<b>{point.name}</b> ({point.y})', style: { color: '#abb2bf' } } } },
                series: d.series,
                legend: { itemStyle: { color: '#abb2bf' } }
            });
        }).catch(e => console.error('pyramid:', e.message));

        // 3. LinkedIn -> variablepie
        fetch('/api/integrations/tgg/linkedin-edu').then(async r => {
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || r.status);
            Highcharts.chart('oauth-variablepie', {
                chart: { type: 'variablepie', backgroundColor: 'transparent' },
                title: { text: 'Alfabetización + brecha (LinkedIn + DB propia)', style: { color: '#e5c07b' } },
                tooltip: { headerFormat: '', pointFormat: '<b>{point.name}</b><br>Total: {point.y}<br>Inverso brecha: {point.z}' },
                series: [{ minPointSize: 10, innerSize: '20%', zMin: 0, name: 'Países', data: d.series[0].data }],
                legend: { itemStyle: { color: '#abb2bf' } }
            });
        }).catch(e => console.error('variablepie:', e.message));
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
    <title>Analítica Individual | Literacy Rates</title>
</svelte:head>

<main>
    <a href="/literacy-rates" class="back-btn">← Volver a Datos</a>
    
    <h1>Visualización Individual (Literacy Rates)</h1>
    
    {#if error}
        <div class="error">{error}</div>
    {/if}

    <div class="loading" style="display: {loading && !error ? 'block' : 'none'};">
        Cargando datos de alfabetización...
    </div>

    <div class="chart-box" style="display: {loading || error ? 'none' : 'block'};">
        <div id="individual-chart-container"></div>
    </div>

    <h1 style="margin-top: 3rem;">Integraciones OAuth2 (3 APIs externas)</h1>
    <div class="chart-box"><div id="oauth-funnel" class="oauth-chart"></div></div>
    <div class="chart-box"><div id="oauth-pyramid" class="oauth-chart"></div></div>
    <div class="chart-box"><div id="oauth-variablepie" class="oauth-chart"></div></div>
</main>
