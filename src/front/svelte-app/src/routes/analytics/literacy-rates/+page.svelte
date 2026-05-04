<script>
    import { onMount } from 'svelte';
    import Highcharts from 'highcharts';
    import c3 from 'c3';
    import 'c3/c3.css';

    let error = $state("");
    let loading = $state(true);

    onMount(async () => {
        try {
            const res = await fetch('/api/v2/literacy-rates');
            let data = await res.json();
            
            if(!res.ok) throw new Error(data.error || "No se encontraron datos");

            // @ts-ignore
            data.sort((a, b) => {
                if (a.country < b.country) return -1;
                if (a.country > b.country) return 1;
                return a.year - b.year;
            });

            // @ts-ignore
            const categories = data.map(d => {
                let c = d.country || "Unknown";
                return `${c.charAt(0).toUpperCase() + c.slice(1)} (${d.year})`;
            });

            // @ts-ignore
            const totalData = data.map(d => d.total || 0);
            // @ts-ignore
            const maleData = data.map(d => d.male || 0);
            // @ts-ignore
            const femaleData = data.map(d => d.female || 0);

            Highcharts.chart('individual-chart-container', {
                chart: {
                    type: 'bar',
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
                series: [
                    { name: 'Alfabetización Femenina', data: femaleData, color: '#e06c75' },
                    { name: 'Alfabetización Total', data: totalData, color: '#98c379' },
                    { name: 'Alfabetización Masculina', data: maleData, color: '#61afef' }
                ]
            });

            loading = false;
        } catch(err) {
            console.error(err);
            // @ts-ignore
            error = "Hubo un error cargando el gráfico individual: " + err.message;
            loading = false;
        }

        // ---- Cargar módulos ----
        try {
            const Funnel = (await import('highcharts/modules/funnel')).default;
            const VariablePie = (await import('highcharts/modules/variable-pie')).default;
            // @ts-ignore
            Funnel(Highcharts);
            // @ts-ignore
            VariablePie(Highcharts);
        } catch (e) { 
            console.warn('Highcharts modules', e); 
        }

        // ---- OAuth charts ----

        // 1. NewsAPI
        fetch('/api/integrations/tgg/newsapi-education')
        .then(async r => {
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || r.status);

            Highcharts.chart('oauth-funnel', {
                chart: { type: 'funnel', backgroundColor: 'transparent' },
                title: { text: 'Embudo educativo (NewsAPI + DB propia)', style: { color: '#e5c07b' } },
                series: d.series
            });
        })
        .catch(e => console.error('funnel:', e.message));


        // 2. Spotify
        fetch('/api/integrations/tgg/spotify-literacy')
        .then(async r => {
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || r.status);

            Highcharts.chart('oauth-pyramid', {
                chart: { type: 'pyramid', backgroundColor: 'transparent' },
                title: { text: 'Spotify vs Literacy', style: { color: '#e5c07b' } },
                series: d.series
            });
        })
        .catch(e => console.error('spotify:', e.message));


        // 3. GitHub
        fetch('/api/integrations/tgg/github-literacy')
        .then(async r => {
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || r.status);

            Highcharts.chart('oauth-variablepie', {
                chart: { type: 'column', backgroundColor: 'transparent' },
                title: { text: 'GitHub vs Literacy', style: { color: '#e5c07b' } },
                xAxis: { categories: d.categories },
                series: d.series
            });
        })
        .catch(e => console.error('github:', e.message));

        // 4. SOS2526-14 Active Satellites → C3.js donut
        fetch('/api/integrations/tgg/sos14-satellites')
        .then(async r => {
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || r.status);

            c3.generate({
                bindto: '#c3-sos14-donut',
                data: {
                    columns: d.columns,
                    type: 'donut'
                },
                donut: {
                    title: `${d.totalSatellites} satélites`
                },
                color: {
                    pattern: ['#98c379', '#61afef', '#e06c75', '#e5c07b']
                }
            });
        })
        .catch(e => console.error('sos14-satellites:', e.message));

        // 5. SOS2526-20 Coffee Stats → C3.js bar
        fetch('/api/integrations/tgg/sos20-coffee')
        .then(async r => {
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || r.status);

            c3.generate({
                bindto: '#c3-sos20-bar',
                data: {
                    columns: d.columns,
                    type: 'bar'
                },
                axis: {
                    x: {
                        type: 'category',
                        categories: d.categories
                    },
                    y: {
                        label: { text: 'Valor', position: 'outer-middle' }
                    }
                },
                color: {
                    pattern: ['#98c379', '#e5c07b']
                }
            });
        })
        .catch(e => console.error('sos20-coffee:', e.message));

        // 6. soporte-sos Cholera Stats → C3.js pie
        fetch('/api/integrations/tgg/cholera-stats')
        .then(async r => {
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || r.status);

            c3.generate({
                bindto: '#c3-cholera-pie',
                data: {
                    columns: d.columns,
                    type: 'pie'
                },
                color: {
                    pattern: ['#98c379', '#61afef', '#e06c75', '#c678dd']
                }
            });
        })
        .catch(e => console.error('cholera-stats:', e.message));

        // 7. SOS2526-12 Fertility Rates → C3.js scatter
        fetch('/api/integrations/tgg/sos12-fertility')
        .then(async r => {
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || r.status);

            c3.generate({
                bindto: '#c3-fertility-scatter',
                data: {
                    xs: d.xs,
                    columns: d.columns,
                    type: 'scatter'
                },
                axis: {
                    x: { label: { text: 'Índice', position: 'outer-center' } },
                    y: { label: { text: 'Valor', position: 'outer-middle' } }
                },
                color: {
                    pattern: ['#e5c07b', '#56b6c2']
                }
            });
        })
        .catch(e => console.error('sos12-fertility:', e.message));
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

    .c3-chart {
        width: 100%;
        height: 420px;
    }

    .chart-label {
        color: #98c379;
        font-size: 0.9rem;
        margin: 0 0 0.5rem 0.5rem;
        font-family: 'Monaco', 'Menlo', monospace;
    }

    :global(.c3 text) { fill: #abb2bf; }
    :global(.c3 .c3-axis path, .c3 .c3-axis line) { stroke: #4b5263; }
    :global(.c3-tooltip) { background: #282c34; border-color: #3e4451; color: #abb2bf; }
    :global(.c3-tooltip td) { border-color: #3e4451; }
    :global(.c3-legend-item text) { fill: #abb2bf; }
    :global(.c3-donut-title) { fill: #e5c07b; }
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

    <div class="chart-box">
        <div id="oauth-funnel" class="oauth-chart"></div>
    </div>

    <div class="chart-box">
        <div id="oauth-pyramid" class="oauth-chart"></div>
    </div>

    <div class="chart-box">
        <div id="oauth-variablepie" class="oauth-chart"></div>
    </div>

    <h1 style="margin-top: 3rem;">Integraciones APIs de compañeros SOS (C3.js)</h1>

    <div class="chart-box">
        <p class="chart-label">SOS2526-14 — Satélites activos · C3.js donut</p>
        <div id="c3-sos14-donut" class="c3-chart"></div>
    </div>

    <div class="chart-box">
        <p class="chart-label">SOS2526-20 — Coffee stats · C3.js bar</p>
        <div id="c3-sos20-bar" class="c3-chart"></div>
    </div>

    <div class="chart-box">
        <p class="chart-label">soporte-sos — Cholera stats · C3.js pie</p>
        <div id="c3-cholera-pie" class="c3-chart"></div>
    </div>

    <div class="chart-box">
        <p class="chart-label">SOS2526-12 — Age-specific fertility rates · C3.js scatter</p>
        <div id="c3-fertility-scatter" class="c3-chart"></div>
    </div>
</main>