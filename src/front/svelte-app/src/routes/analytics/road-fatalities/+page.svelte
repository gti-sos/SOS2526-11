<script lang="ts">
    import { onMount, tick } from 'svelte';
    import Highcharts from 'highcharts';
    import * as echarts from 'echarts';

    let error = $state("");
    let loading = $state(true);
    let mastodonData: any = $state(null);
    let fedexData: any = $state(null);
    let copernicusData: any = $state(null);
    let sos12Data: any = $state(null);
    let sos14Data: any = $state(null);
    let sos20Data: any = $state(null);
    let sos21Data: any = $state(null);
    let sos27Data: any = $state(null);

    function renderSos12Radar(d: any) {
        const el = document.getElementById('sos12-radar');
        if (!el || !d?.chartData?.metrics) return;
        const chart = echarts.init(el);
        const m = d.chartData.metrics;
        chart.setOption({
            backgroundColor: 'transparent',
            title: { text: 'Tasas medias nacimiento/muerte/crecimiento', textStyle: { color: '#e5c07b' } },
            tooltip: {
                trigger: 'item',
                formatter: () =>
                    '<b>SOS2526-12 birth-death-growth-rates</b><br/>' +
                    'API externa de alumno SOS de otro grupo<br/>' +
                    'Proxy propio: /api/integrations/jfm/sos12-birth-death-growth<br/>' +
                    'Datos JSON agregados para radar<br/>' +
                    `Birth rate media: <b>${m.avgBirthRate}</b><br/>` +
                    `Death rate media: <b>${m.avgDeathRate}</b><br/>` +
                    `Growth rate media: <b>${m.avgGrowthRate}</b>`
            },
            radar: {
                indicator: [
                    { name: 'Birth rate', max: Math.max(40, m.avgBirthRate * 1.4) },
                    { name: 'Death rate', max: Math.max(20, m.avgDeathRate * 1.4) },
                    { name: 'Growth rate', max: Math.max(5, Math.abs(m.avgGrowthRate) * 1.8) }
                ],
                axisName: { color: '#abb2bf' }
            },
            series: [{ type: 'radar', data: [{ value: [m.avgBirthRate, m.avgDeathRate, m.avgGrowthRate], name: 'Media SOS2526-12' }] }]
        });
        window.addEventListener('resize', () => chart.resize());
    }

    function renderSos14Treemap(d: any) {
        const el = document.getElementById('sos14-treemap');
        if (!el || !d?.chartData?.countries?.length) return;
        const chart = echarts.init(el);
        chart.setOption({
            backgroundColor: 'transparent',
            title: { text: 'Meteoritos por país (top 15)', textStyle: { color: '#e5c07b' } },
            tooltip: {
                formatter: (info: any) => {
                    const v = info.data;
                    return `<b>${v.name}</b><br/>` +
                        `Meteoritos: <b>${v.value}</b><br/>` +
                        `Masa total aprox: <b>${v.totalMass?.toLocaleString() ?? 'N/A'} g</b><br/>` +
                        `API: SOS2526-14 meteorite-landings<br/>` +
                        `Proxy: /api/integrations/jfm/sos14-meteorite-landings<br/>` +
                        `Widget: ECharts treemap`;
                }
            },
            series: [{
                type: 'treemap',
                data: d.chartData.countries,
                label: { show: true, formatter: '{b}' },
                upperLabel: { show: true },
                itemStyle: { borderColor: '#282c34', borderWidth: 2 }
            }]
        });
        window.addEventListener('resize', () => chart.resize());
    }

    function renderSos20Sunburst(d: any) {
        const el = document.getElementById('sos20-sunburst');
        if (!el || !d?.chartData?.tree?.length) return;
        const chart = echarts.init(el);
        chart.setOption({
            backgroundColor: 'transparent',
            title: { text: 'Especias por área y producto', textStyle: { color: '#e5c07b' } },
            tooltip: {
                formatter: (info: any) => {
                    const v = info.data;
                    return `<b>${v.name}</b><br/>` +
                        `Valor: <b>${v.value ?? 'N/A'}</b><br/>` +
                        `API: SOS2526-20 spice-stats<br/>` +
                        `Proxy: /api/integrations/jfm/sos20-spice-stats<br/>` +
                        `Widget: ECharts sunburst`;
                }
            },
            series: [{
                type: 'sunburst',
                data: d.chartData.tree,
                radius: ['15%', '90%'],
                label: { rotate: 'radial', fontSize: 10 },
                itemStyle: { borderWidth: 1 }
            }]
        });
        window.addEventListener('resize', () => chart.resize());
    }

    function renderSos21Heatmap(d: any) {
        const el = document.getElementById('sos21-heatmap');
        if (!el || !d?.chartData?.data?.length) return;
        const chart = echarts.init(el);
        const cd = d.chartData;
        const maxVal = Math.max(...cd.data.map((p: any) => p[2]));
        chart.setOption({
            backgroundColor: 'transparent',
            title: { text: 'Muertes VIH/SIDA por año y grupo de edad', textStyle: { color: '#e5c07b' } },
            tooltip: {
                position: 'top',
                formatter: (info: any) => {
                    const [yi, ai, val] = info.data;
                    return `Año: <b>${cd.years[yi]}</b><br/>` +
                        `Grupo: <b>${cd.ageGroups[ai]}</b><br/>` +
                        `Muertes: <b>${val?.toLocaleString() ?? 0}</b><br/>` +
                        `API: SOS2526-21 aids-deaths-stats<br/>` +
                        `Proxy: /api/integrations/jfm/sos21-aids-deaths-stats<br/>` +
                        `Widget: ECharts heatmap`;
                }
            },
            grid: { top: '10%', bottom: '15%', left: '18%', right: '5%' },
            xAxis: { type: 'category', data: cd.years, axisLabel: { color: '#abb2bf', rotate: 45 } },
            yAxis: { type: 'category', data: cd.ageGroups, axisLabel: { color: '#abb2bf' } },
            visualMap: {
                min: 0, max: maxVal, calculable: true,
                orient: 'horizontal', left: 'center', bottom: 0,
                inRange: { color: ['#1c1f24', '#e06c75'] },
                textStyle: { color: '#abb2bf' }
            },
            series: [{ type: 'heatmap', data: cd.data, label: { show: false }, emphasis: { itemStyle: { shadowBlur: 10 } } }]
        });
        window.addEventListener('resize', () => chart.resize());
    }

    function renderSos27Scatter(d: any) {
        const el = document.getElementById('sos27-scatter');
        if (!el || !d?.chartData?.data?.length) return;
        const chart = echarts.init(el);
        const pts = d.chartData.data;
        chart.setOption({
            backgroundColor: 'transparent',
            title: { text: 'Plantas hidroeléctricas: capacidad vs. salto', textStyle: { color: '#e5c07b' } },
            tooltip: {
                trigger: 'item',
                formatter: (info: any) => {
                    const v = info.data;
                    return `<b>${v.name}</b><br/>` +
                        `País: <b>${v.country}</b><br/>` +
                        `Capacidad: <b>${v.capacity_mw} MW</b><br/>` +
                        `Salto (head): <b>${v.head_m} m</b><br/>` +
                        `Río: <b>${v.river}</b><br/>` +
                        `Presa: <b>${v.dam_name}</b><br/>` +
                        `API: SOS2526-27 world-hydroelectric-plants<br/>` +
                        `Proxy: /api/integrations/jfm/sos27-world-hydroelectric-plants<br/>` +
                        `Widget: ECharts scatter`;
                }
            },
            xAxis: { name: 'Capacidad (MW)', nameTextStyle: { color: '#abb2bf' }, axisLabel: { color: '#abb2bf' } },
            yAxis: { name: 'Salto/Head (m)', nameTextStyle: { color: '#abb2bf' }, axisLabel: { color: '#abb2bf' } },
            series: [{
                type: 'scatter',
                data: pts.map((p: any) => ({ value: [p.x, p.y], name: p.name, country: p.country, river: p.river, dam_name: p.dam_name, capacity_mw: p.capacity_mw, head_m: p.head_m })),
                symbolSize: 8,
                itemStyle: { color: '#61afef', opacity: 0.7 }
            }]
        });
        window.addEventListener('resize', () => chart.resize());
    }

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
        // Fuentes: Mastodon aporta posts por hashtag; road-fatalities-v2 aporta avgDeathRate.
        // Fórmula: weightedScore = posts_por_hashtag × avg_population_death_rate
        fetch('/api/integrations/jfm/mastodon-fatalities').then(async r => {
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || r.status);

            // Guardamos la respuesta para el bloque explicativo inferior.
            mastodonData = d;

            const postLimit = d?.mastodonContext?.postLimitPerHashtag ?? 80;
            const subtitle = d.dataSource === 'api'
                ? `Posts recientes recuperados de Mastodon por hashtag, hasta ${postLimit} por etiqueta, ponderados con la tasa media vial (${d?.dbContext?.avgDeathRate ?? 'N/A'}) de road-fatalities-v2`
                : `Fallback local: Mastodon no disponible. Se muestran datos derivados de road-fatalities-v2.`;

            Highcharts.chart('oauth-pie', {
                chart: { type: 'pie', backgroundColor: 'transparent' },
                title: { text: 'Mastodon road safety social signal', style: { color: '#e5c07b' } },
                subtitle: { text: subtitle, style: { color: '#abb2bf', fontSize: '11px' } },
                // @ts-ignore
                tooltip: {
                    useHTML: true,
                    formatter: function (this: any) {
                        const p: any = this.point;
                        const avg = p.avgDeathRate ?? 'N/A';
                        const ws = p.weightedScore ?? (avg !== 'N/A' ? Math.round(p.y * avg) : 'N/A');
                        const limitText = p.limitReached
                            ? `<br/><em>Límite alcanzado: máx. ${postLimit} posts solicitados</em>`
                            : '';
                        const fallbackText = p.dataSource !== 'api'
                            ? `<br/><em style="color:#f87171">Aviso: usando fallback local (Mastodon no respondió)</em>`
                            : '';
                        return `<b>${p.name}</b><br/>` +
                               `Posts recuperados de Mastodon: <b>${p.y}</b> (${this.percentage?.toFixed(1)}%)${limitText}<br/>` +
                               `No representa el total histórico de Mastodon.<br/>` +
                               `<hr style="margin:4px 0;border-color:#374151"/>` +
                               `API propia: <b>road-fatalities-v2</b><br/>` +
                               `Datos propios: <code>population_death_rate</code>, <code>total_death</code>, <code>income_level</code><br/>` +
                               `API externa: <b>Mastodon API</b> mediante OAuth2<br/>` +
                               `Operación: <code>posts_recuperados × avgDeathRate</code><br/>` +
                               `Cálculo: ${p.y} × ${avg} = <b>${ws}</b>${fallbackText}`;
                    },
                },
                series: [{
                    name: 'Posts recuperados',
                    colorByPoint: true,
                    data: d.hashtags.map((h: any) => ({
                        name: h.tag,
                        y: h.count,
                        limitReached: h.limitReached,
                        weightedScore: h.weightedScore,
                        avgDeathRate: d?.dbContext?.avgDeathRate,
                        dataSource: d.dataSource,
                    })),
                }],
                legend: { itemStyle: { color: '#abb2bf' } }
            });
        }).catch(e => console.error('pie:', e.message));

        // 2. Copernicus/ESA -> scatter
        fetch('/api/integrations/jfm/copernicus-fatalities').then(async r => {
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || r.status);

            copernicusData = d;

            const imageCount = d?.dbContext?.imageCount ?? 'N/A';
            const scatterSubtitle = d.dataSource === 'api'
                ? `Copernicus aporta ${imageCount} productos Sentinel-2; road-fatalities-v2 aporta tasas de mortalidad vial`
                : `Fallback local: Copernicus no disponible. Se muestran datos derivados de road-fatalities-v2.`;

            // @ts-ignore
            Highcharts.chart('oauth-scatter', {
                chart: { type: 'scatter', backgroundColor: 'transparent', zoomType: 'xy' },
                title: { text: 'Mortalidad vial ajustada con productos Sentinel-2', style: { color: '#e5c07b' } },
                subtitle: { text: scatterSubtitle, style: { color: '#abb2bf', fontSize: '11px' } },
                xAxis: { title: { text: 'Vehicle death rate', style: { color: '#abb2bf' } }, labels: { style: { color: '#abb2bf' } } },
                yAxis: { title: { text: 'Population death rate (ajustada)', style: { color: '#abb2bf' } }, labels: { style: { color: '#abb2bf' } } },
                // @ts-ignore
                tooltip: {
                    useHTML: true,
                    formatter: function (this: any) {
                        const p: any = this.point;
                        const origPDR = p.originalPopulationDeathRate ?? p.y;
                        const origVDR = p.originalVehicleDeathRate ?? p.x;
                        const ic = imageCount;
                        const adjusted = (Number(origPDR) * (1 + Number(ic) / 200)).toFixed(4);
                        const fallbackText = d.dataSource !== 'api'
                            ? `<br/><em style="color:#f87171">Aviso: usando fallback local (Copernicus no respondió)</em>`
                            : '';
                        return `<b>${p.name}</b><br/>` +
                               `API propia: <b>road-fatalities-v2</b><br/>` +
                               `<code>vehicle_death_rate</code>: <b>${origVDR}</b><br/>` +
                               `<code>population_death_rate</code> original: <b>${origPDR}</b><br/>` +
                               `<hr style="margin:4px 0;border-color:#374151"/>` +
                               `API externa: <b>Copernicus Data Space API</b> mediante OAuth2 password grant<br/>` +
                               `Productos Sentinel-2 usados: <b>${ic}</b><br/>` +
                               `Operación: <code>population_death_rate × (1 + imageCount / 200)</code><br/>` +
                               `Cálculo: ${origPDR} × (1 + ${ic} / 200) = <b>${adjusted}</b>${fallbackText}`;
                    },
                },
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
                    useHTML: true,
                    formatter: function (this: any) {
                        const point = this.point;
                        const year   = d.xCategories?.[point.x] ?? 'N/A';
                        const nation = d.yCategories?.[point.y] ?? 'N/A';
                        const lc = Number(locationCount);
                        const totalDeathApprox = isNaN(lc) ? '?' : Math.round(point.value * lc);
                        const fallbackText = d.dataSource !== 'api'
                            ? `<br/><em style="color:#f87171">Aviso: usando fallback local (FedEx no respondió)</em>`
                            : '';
                        return `<b>${nation}</b> (${year})<br/>` +
                               `Valor representado: <b>${point.value}</b><br/>` +
                               `<hr style="margin:4px 0;border-color:#374151"/>` +
                               `API propia: <b>road-fatalities-v2</b><br/>` +
                               `Datos propios: <code>total_death</code>, <code>nation</code>, <code>year</code><br/>` +
                               `API externa: <b>FedEx Locations API</b> mediante OAuth2<br/>` +
                               `Localizaciones FedEx usadas: <b>${locationCount}</b><br/>` +
                               `Operación: <code>total_death / locationCount</code><br/>` +
                               `Cálculo aprox: ${totalDeathApprox} / ${locationCount} = <b>${point.value}</b>${fallbackText}`;
                    }
                },
                // Los datos vienen del backend: cada punto es [idxAño, idxNación, total_death/locationCount]
                series: [{ name: 'total_death / locationCount', data: d.data, borderWidth: 1 }]
            });
        }).catch(e => console.error('heatmap:', e.message));

        // 4. SOS2526-12 -> birth-death-growth-rates (proxy SOS)
        fetch('/api/integrations/jfm/sos12-birth-death-growth')
            .then(async r => { const d = await r.json(); sos12Data = d; await tick(); renderSos12Radar(d); })
            .catch(e => { sos12Data = { api: 'SOS2526-12', dataSource: 'api-error', apiError: e.message, count: 0, data: [] }; });

        // 5. SOS2526-14 -> meteorite-landings (proxy SOS)
        fetch('/api/integrations/jfm/sos14-meteorite-landings')
            .then(async r => { const d = await r.json(); sos14Data = d; await tick(); renderSos14Treemap(d); })
            .catch(e => { sos14Data = { api: 'SOS2526-14', dataSource: 'api-error', apiError: e.message, count: 0, data: [] }; });

        // 6. SOS2526-20 -> spice-stats (proxy SOS)
        fetch('/api/integrations/jfm/sos20-spice-stats')
            .then(async r => { const d = await r.json(); sos20Data = d; await tick(); renderSos20Sunburst(d); })
            .catch(e => { sos20Data = { api: 'SOS2526-20', dataSource: 'api-error', apiError: e.message, count: 0, data: [] }; });

        // 7. SOS2526-21 -> aids-deaths-stats (proxy SOS)
        fetch('/api/integrations/jfm/sos21-aids-deaths-stats')
            .then(async r => { const d = await r.json(); sos21Data = d; await tick(); renderSos21Heatmap(d); })
            .catch(e => { sos21Data = { api: 'SOS2526-21', dataSource: 'api-error', apiError: e.message, count: 0, data: [] }; });

        // 8. SOS2526-27 -> world-hydroelectric-plants (proxy SOS)
        fetch('/api/integrations/jfm/sos27-world-hydroelectric-plants')
            .then(async r => { const d = await r.json(); sos27Data = d; await tick(); renderSos27Scatter(d); })
            .catch(e => { sos27Data = { api: 'SOS2526-27', dataSource: 'api-error', apiError: e.message, count: 0, data: [] }; });
    });
</script>

<style>
    main {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
        color: #abb2bf;
    }

    .mastodon-proof {
        margin-bottom: 1rem;
    }

    .copernicus-proof {
        margin-bottom: 1rem;
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

    .sos-integration-section {
        margin-top: 2rem;
    }

    .sos-integration-card {
        background: #111827;
        color: #d1d5db;
        border-left: 4px solid #60a5fa;
        border-radius: 8px;
        padding: 1rem;
        margin-top: 1rem;
    }

    .sos-integration-card h2 {
        color: #e5c07b;
        margin-top: 0;
        font-size: 1.2rem;
    }

    .sos-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1rem;
        font-size: 0.85rem;
    }

    .sos-table th,
    .sos-table td {
        border: 1px solid #374151;
        padding: 0.5rem;
        text-align: left;
    }

    .sos-table th {
        background: #1f2937;
        color: #fbbf24;
    }

    .sos-table td {
        color: #e5e7eb;
    }

    .api-error {
        color: #f87171;
        font-weight: 600;
    }

    .sos-table-scroll {
        overflow-x: auto;
        margin-top: 0.4rem;
    }

    .echarts-sos-chart {
        width: 100%;
        height: 430px;
        margin-top: 1rem;
    }

    .sos-table-details {
        margin-top: 1rem;
    }

    .sos-table-details summary {
        cursor: pointer;
        color: #60a5fa;
        font-size: 0.85rem;
        padding: 0.3rem 0;
        user-select: none;
    }

    .sos-table-details summary:hover {
        color: #93c5fd;
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

    <!--
      Nota para la corrección:
      Este bloque explica la integración real entre la API propia y Mastodon.
      Mastodon aporta el número de publicaciones públicas por hashtag.
      La API propia aporta la tasa media de mortalidad, usada para calcular weightedScore.
    -->
    {#if mastodonData}
    <div class="integration-proof mastodon-proof">
        <strong>Integración:</strong>
        <code>road-fatalities-v2</code> aporta <code>population_death_rate</code>, <code>total_death</code> e <code>income_level</code>.
        <code>Mastodon API</code> aporta posts recientes por hashtag mediante OAuth2
        (máx. <code>{mastodonData?.mastodonContext?.postLimitPerHashtag ?? 80}</code> por etiqueta).
        El valor combinado es <code>posts_recuperados × avgDeathRate</code>
        (<code>{mastodonData?.dbContext?.avgDeathRate ?? "N/A"}</code> de tasa media en la DB propia).
    </div>
    {/if}

    <div class="chart-box"><div id="oauth-scatter" class="oauth-chart"></div></div>

    {#if copernicusData}
    <div class="integration-proof copernicus-proof">
        <strong>Integración:</strong>
        <code>road-fatalities-v2</code> aporta <code>vehicle_death_rate</code> y <code>population_death_rate</code>.
        <code>Copernicus Data Space API</code> aporta <code>{copernicusData?.dbContext?.imageCount ?? 'N/A'}</code> productos Sentinel-2 mediante OAuth2 (password grant).
        La tasa Y se ajusta con la fórmula <code>population_death_rate × (1 + imageCount / 200)</code>.
        {#if copernicusData?.integrationEvidence?.tokenOk}
            Token Copernicus obtenido correctamente.
        {/if}
    </div>
    {/if}

    <div class="chart-box"><div id="oauth-heatmap" class="oauth-chart"></div></div>

    {#if fedexData}
    <div class="integration-proof compact">
        <strong>Integración:</strong>
        <code>road-fatalities-v2</code> aporta <code>total_death</code>, <code>nation</code> y <code>year</code>.
        <code>FedEx Locations API</code> aporta <code>{fedexData?.dbContext?.locationCount ?? "N/A"}</code> localizaciones mediante OAuth2.
        El valor representado es <code>total_death / locationCount</code>.
    </div>
    {/if}

    <!-- ================================================================
         Integraciones con APIs SOS de otros grupos (JFM)
         ================================================================ -->
    <h1 style="margin-top: 3rem;">Integraciones con APIs SOS de otros grupos</h1>

    <section class="sos-integration-section">

        {#if sos12Data}
        <div class="sos-integration-card">
            <h2>{sos12Data.api}</h2>
            <p><strong>Grupo:</strong> {sos12Data.group} &nbsp;|&nbsp; <strong>Integrado por:</strong> {sos12Data.integratedBy}</p>
            <p><strong>Fuente:</strong> {sos12Data.dataSource === 'api' ? 'API SOS real' : 'Error al consultar API'} &nbsp;|&nbsp; <strong>Registros:</strong> {sos12Data.count}</p>
            <p><strong>URL externa:</strong> <code>{sos12Data.sourceUrl}</code></p>
            <p><strong>Widget:</strong> ECharts radar</p>
            <p>{sos12Data.explanation}</p>
            {#if sos12Data.apiError}
                <p class="api-error">Error: {sos12Data.apiError}</p>
            {/if}
            {#if sos12Data.dataSource === 'api'}
                <div id="sos12-radar" class="echarts-sos-chart"></div>
            {/if}
            {#if sos12Data.data?.length}
                {@const headers12 = sos12Data.fieldsShown?.length ? sos12Data.fieldsShown : Object.keys(sos12Data.data[0]).slice(0, 6)}
                <details class="sos-table-details">
                    <summary>Ver tabla de datos ({sos12Data.data.length} de {sos12Data.count} registros)</summary>
                    <div class="sos-table-scroll">
                        <table class="sos-table">
                            <thead><tr>{#each headers12 as key}<th>{key}</th>{/each}</tr></thead>
                            <tbody>{#each sos12Data.data as row}<tr>{#each headers12 as key}<td>{row[key] ?? '—'}</td>{/each}</tr>{/each}</tbody>
                        </table>
                    </div>
                </details>
            {/if}
        </div>
        {/if}

        {#if sos14Data}
        <div class="sos-integration-card">
            <h2>{sos14Data.api}</h2>
            <p><strong>Grupo:</strong> {sos14Data.group} &nbsp;|&nbsp; <strong>Integrado por:</strong> {sos14Data.integratedBy}</p>
            <p><strong>Fuente:</strong> {sos14Data.dataSource === 'api' ? 'API SOS real' : 'Error al consultar API'} &nbsp;|&nbsp; <strong>Registros:</strong> {sos14Data.count}</p>
            <p><strong>URL externa:</strong> <code>{sos14Data.sourceUrl}</code></p>
            <p><strong>Widget:</strong> ECharts treemap</p>
            <p>{sos14Data.explanation}</p>
            {#if sos14Data.apiError}
                <p class="api-error">Error: {sos14Data.apiError}</p>
            {/if}
            {#if sos14Data.dataSource === 'api'}
                <div id="sos14-treemap" class="echarts-sos-chart"></div>
            {/if}
            {#if sos14Data.data?.length}
                {@const headers14 = sos14Data.fieldsShown?.length ? sos14Data.fieldsShown : Object.keys(sos14Data.data[0]).slice(0, 6)}
                <details class="sos-table-details">
                    <summary>Ver tabla de datos ({sos14Data.data.length} de {sos14Data.count} registros)</summary>
                    <div class="sos-table-scroll">
                        <table class="sos-table">
                            <thead><tr>{#each headers14 as key}<th>{key}</th>{/each}</tr></thead>
                            <tbody>{#each sos14Data.data as row}<tr>{#each headers14 as key}<td>{row[key] ?? 'N/A'}</td>{/each}</tr>{/each}</tbody>
                        </table>
                    </div>
                </details>
            {/if}
        </div>
        {/if}

        {#if sos20Data}
        <div class="sos-integration-card">
            <h2>{sos20Data.api}</h2>
            <p><strong>Grupo:</strong> {sos20Data.group} &nbsp;|&nbsp; <strong>Integrado por:</strong> {sos20Data.integratedBy}</p>
            <p><strong>Fuente:</strong> {sos20Data.dataSource === 'api' ? 'API SOS real' : 'Error al consultar API'} &nbsp;|&nbsp; <strong>Registros:</strong> {sos20Data.count}</p>
            <p><strong>URL externa:</strong> <code>{sos20Data.sourceUrl}</code></p>
            <p><strong>Widget:</strong> ECharts sunburst</p>
            <p>{sos20Data.explanation}</p>
            {#if sos20Data.apiError}
                <p class="api-error">Error: {sos20Data.apiError}</p>
            {/if}
            {#if sos20Data.dataSource === 'api'}
                <div id="sos20-sunburst" class="echarts-sos-chart"></div>
            {/if}
            {#if sos20Data.data?.length}
                {@const headers20 = sos20Data.fieldsShown?.length ? sos20Data.fieldsShown : Object.keys(sos20Data.data[0]).slice(0, 7)}
                <details class="sos-table-details">
                    <summary>Ver tabla de datos ({sos20Data.data.length} de {sos20Data.count} registros)</summary>
                    <div class="sos-table-scroll">
                        <table class="sos-table">
                            <thead><tr>{#each headers20 as key}<th>{key}</th>{/each}</tr></thead>
                            <tbody>{#each sos20Data.data as row}<tr>{#each headers20 as key}<td>{row[key] ?? '—'}</td>{/each}</tr>{/each}</tbody>
                        </table>
                    </div>
                </details>
            {/if}
        </div>
        {/if}

        {#if sos21Data}
        <div class="sos-integration-card">
            <h2>{sos21Data.api}</h2>
            <p><strong>Grupo:</strong> {sos21Data.group} &nbsp;|&nbsp; <strong>Integrado por:</strong> {sos21Data.integratedBy}</p>
            <p><strong>Fuente:</strong> {sos21Data.dataSource === 'api' ? 'API SOS real' : 'Error al consultar API'} &nbsp;|&nbsp; <strong>Registros:</strong> {sos21Data.count}</p>
            <p><strong>URL externa:</strong> <code>{sos21Data.sourceUrl}</code></p>
            <p><strong>Widget:</strong> ECharts heatmap</p>
            <p>{sos21Data.explanation}</p>
            {#if sos21Data.apiError}
                <p class="api-error">Error: {sos21Data.apiError}</p>
            {/if}
            {#if sos21Data.dataSource === 'api'}
                <div id="sos21-heatmap" class="echarts-sos-chart"></div>
            {/if}
            {#if sos21Data.data?.length}
                {@const headers21 = sos21Data.fieldsShown?.length ? sos21Data.fieldsShown : Object.keys(sos21Data.data[0]).slice(0, 8)}
                <details class="sos-table-details">
                    <summary>Ver tabla de datos ({sos21Data.data.length} de {sos21Data.count} registros)</summary>
                    <div class="sos-table-scroll">
                        <table class="sos-table">
                            <thead><tr>{#each headers21 as key}<th>{key}</th>{/each}</tr></thead>
                            <tbody>{#each sos21Data.data as row}<tr>{#each headers21 as key}<td>{row[key] ?? '—'}</td>{/each}</tr>{/each}</tbody>
                        </table>
                    </div>
                </details>
            {/if}
        </div>
        {/if}

        {#if sos27Data}
        <div class="sos-integration-card">
            <h2>{sos27Data.api}</h2>
            <p><strong>Grupo:</strong> {sos27Data.group} &nbsp;|&nbsp; <strong>Integrado por:</strong> {sos27Data.integratedBy}</p>
            <p><strong>Fuente:</strong> {sos27Data.dataSource === 'api' ? 'API SOS real' : 'Error al consultar API'} &nbsp;|&nbsp; <strong>Registros:</strong> {sos27Data.count}</p>
            <p><strong>URL externa:</strong> <code>{sos27Data.sourceUrl}</code></p>
            <p><strong>Widget:</strong> ECharts scatter</p>
            <p>{sos27Data.explanation}</p>
            {#if sos27Data.apiError}
                <p class="api-error">Error: {sos27Data.apiError}</p>
            {/if}
            {#if sos27Data.dataSource === 'api'}
                <div id="sos27-scatter" class="echarts-sos-chart"></div>
            {/if}
            {#if sos27Data.data?.length}
                {@const headers27 = sos27Data.fieldsShown?.length ? sos27Data.fieldsShown : Object.keys(sos27Data.data[0]).slice(0, 9)}
                <details class="sos-table-details">
                    <summary>Ver tabla de datos ({sos27Data.data.length} de {sos27Data.count} registros)</summary>
                    <div class="sos-table-scroll">
                        <table class="sos-table">
                            <thead><tr>{#each headers27 as key}<th>{key}</th>{/each}</tr></thead>
                            <tbody>{#each sos27Data.data as row}<tr>{#each headers27 as key}<td>{row[key] ?? 'N/A'}</td>{/each}</tr>{/each}</tbody>
                        </table>
                    </div>
                </details>
            {/if}
        </div>
        {/if}

    </section>
</main>