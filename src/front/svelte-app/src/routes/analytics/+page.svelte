<script>
    import { onMount } from 'svelte';
    import Highcharts from 'highcharts';

    let error = $state("");
    let loading = $state(true);

    onMount(async () => {
        try {
            let dataMRG = [];
            let dataTGG = [];
            let dataJFM = [];

            // Peticiones aisladas: Si la API de un compañero se cae, no bloquea el resto
            try { const r1 = await fetch('/api/v2/alcohol-consumptions-per-capita'); if(r1.ok) dataMRG = await r1.json(); } catch(e){ console.warn("API alcohol fallida"); }
            try { const r2 = await fetch('/api/v2/literacy-rates'); if(r2.ok) dataTGG = await r2.json(); } catch(e){ console.warn("API literacy fallida"); }
            try { const r3 = await fetch('/api/v2/road-fatalities'); if(r3.ok) dataJFM = await r3.json(); } catch(e){ console.warn("API road fallida"); }

            // Mapa para cruzar datos usando el nombre del país como pivote
            const countriesMap = {};

            // Procesar datos de Alcohol (Miguel)
            if (Array.isArray(dataMRG)) {
                dataMRG.forEach(d => {
                    const c = (d.nation || "").toLowerCase();
                    if(!countriesMap[c]) countriesMap[c] = { alcohol: 0, literacy: 0, road: 0 };
                    // Recogemos la primera instancia que encontremos, o un total sumatorio
                    countriesMap[c].alcohol = d.alcohol_litre || 0;
                });
            }

            // Procesar datos de Alfabetización (Tomás)
            if (Array.isArray(dataTGG)) {
                dataTGG.forEach(d => {
                    const c = (d.country || "").toLowerCase();
                    if(!countriesMap[c]) countriesMap[c] = { alcohol: 0, literacy: 0, road: 0 };
                    countriesMap[c].literacy = d.total || 0;
                });
            }

            // Procesar datos de Tráfico (José)
            if (Array.isArray(dataJFM)) {
                dataJFM.forEach(d => {
                    const c = (d.nation || "").toLowerCase();
                    if(!countriesMap[c]) countriesMap[c] = { alcohol: 0, literacy: 0, road: 0 };
                    countriesMap[c].road = d.population_death_rate || 0;
                });
            }

            // Limpiar claves vacías por si acaso y extraer los datos mapeados
            const categories = Object.keys(countriesMap).filter(k => k.trim() !== "");
            
            const alcoholData = categories.map(c => countriesMap[c].alcohol);
            const literacyData = categories.map(c => countriesMap[c].literacy);
            const roadData = categories.map(c => countriesMap[c].road);

            // Nombres capitalizados para el Eje X
            const categoriesNames = categories.map(c => c.charAt(0).toUpperCase() + c.slice(1));

            Highcharts.chart('chart-container', {
                chart: {
                    type: 'column',
                    backgroundColor: 'transparent'
                },
                title: {
                    text: 'Análisis Integrado de Datos Mundiales (SOS2526-11)',
                    style: { color: '#e5c07b' }
                },
                subtitle: {
                    text: 'Comparación de Alcohol, Alfabetización y Siniestralidad Vial',
                    style: { color: '#abb2bf' }
                },
                xAxis: {
                    categories: categoriesNames,
                    crosshair: true,
                    labels: { style: { color: '#abb2bf' } }
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: 'Valores',
                        style: { color: '#abb2bf' }
                    },
                    labels: { style: { color: '#abb2bf' } }
                },
                tooltip: {
                    headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                    pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                        '<td style="padding:0"><b>{point.y:.1f}</b></td></tr>',
                    footerFormat: '</table>',
                    shared: true,
                    useHTML: true
                },
                plotOptions: {
                    column: {
                        pointPadding: 0.2,
                        borderWidth: 0,
                        borderRadius: 4
                    }
                },
                series: [
                    { name: 'Alcohol (Litros/capita)', data: alcoholData, color: '#e06c75' },
                    { name: 'Alfabetización (Total %)', data: literacyData, color: '#98c379' },
                    { name: 'Tráfico (Tasa Mortalidad)', data: roadData, color: '#61afef' }
                ],
                legend: {
                    itemStyle: { color: '#abb2bf' },
                    itemHoverStyle: { color: '#ffffff' }
                }
            });

            loading = false;
        } catch(err) {
            console.error(err);
            error = "Hubo un error cargando los datos integrados: " + err.message;
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

    #chart-container {
        width: 100%;
        height: 600px;
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
</style>

<svelte:head>
    <title>Analíticas Integradas | SOS2526-11</title>
</svelte:head>

<main>
    <h1>Visualización Global</h1>
    
    {#if error}
        <div class="error">{error}</div>
    {/if}

    {#if loading}
        <div class="loading">Cargando datos globales de las 3 APIs...</div>
    {:else}
        <div class="chart-box">
            <div id="chart-container"></div>
        </div>
    {/if}
</main>
