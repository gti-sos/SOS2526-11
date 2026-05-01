<script lang="ts">
    import { onMount } from 'svelte';

    let sos12Data: any = $state(null);
    let sos20Data: any = $state(null);

    function tableHeaders(d: any): string[] {
        if (d?.fieldsShown?.length) return d.fieldsShown;
        if (d?.displayFields?.length) return d.displayFields; // compatibilidad hacia atrás
        if (d?.data?.length && typeof d.data[0] === 'object') return Object.keys(d.data[0]).slice(0, 7);
        return [];
    }

    onMount(() => {
        fetch('/api/integrations/jfm/sos12-birth-death-growth')
            .then(r => r.json())
            .then(d => { sos12Data = d; })
            .catch(e => { sos12Data = { api: 'SOS2526-12 birth-death-growth-rates', group: 'SOS2526-12', integratedBy: 'JFM', dataSource: 'api-error', apiError: e.message, count: 0, fieldsShown: [], data: [] }; });

        fetch('/api/integrations/jfm/sos20-spice-stats')
            .then(r => r.json())
            .then(d => { sos20Data = d; })
            .catch(e => { sos20Data = { api: 'SOS2526-20 spice-stats', group: 'SOS2526-20', integratedBy: 'JFM', dataSource: 'api-error', apiError: e.message, count: 0, fieldsShown: [], data: [] }; });
    });
</script>

<svelte:head>
    <title>Integraciones | SOS2526-11</title>
</svelte:head>

<main>
    <h1>Integraciones del grupo</h1>
    <p class="intro">
        Punto de acceso a todas las integraciones con APIs externas (OAuth2) y los widgets que las visualizan.
        Cada integrante consume 3 APIs distintas y combina los datos con su propia base de datos.
    </p>

    <section class="grid">
        <article class="card">
            <h2>JFM — Road Fatalities</h2>
            <p class="who">José Fernández Montero</p>
            <ul>
                <li>Mastodon API (OAuth2 Client Credentials) → <b>pie</b></li>
                <li>Copernicus/ESA Data Space (OAuth2 Client Credentials) → <b>scatter</b></li>
                <li>FedEx Sandbox API (OAuth2 Client Credentials) → <b>heatmap</b></li>
            </ul>
            <p class="signal-note">
                Mastodon se usa como señal social externa relacionada con accidentes de tráfico, seguridad vial y movilidad.
                La integración consulta hashtags públicos como RoadSafety, TrafficAccident, CarCrash, TrafficSafety,
                RoadAccident, AccidentesTrafico, SeguridadVial y SiniestroVial.
                El número de publicaciones encontradas por hashtag se usa como factor contextual en la gráfica pie de road fatalities.
                No es una fuente oficial de fallecidos.
            </p>
            <a class="btn" href="/analytics/road-fatalities">Ver widgets →</a>
        </article>

        <article class="card">
            <h2>MRG — Alcohol Consumption</h2>
            <p class="who">Miguel Ridao</p>
            <ul>
                <li>Vimeo (Client Credentials) → <b>bubble</b></li>
                <li>Dailymotion (Client Credentials) → <b>treemap</b></li>
                <li>Discord (Client Credentials) → <b>packedbubble</b></li>
            </ul>
            <a class="btn" href="/analytics/alcohol-consumptions-per-capita">Ver widgets →</a>
        </article>

        <article class="card">
            <h2>TGG — Literacy Rates</h2>
            <p class="who">Tomás Gutiérrez García</p>
            <ul>
                <li>NewsAPI (API key) → <b>funnel</b></li>
                <li>Google Public Data (Client Credentials) → <b>pyramid</b></li>
                <li>LinkedIn (Refresh Token) → <b>variablepie</b></li>
            </ul>
            <a class="btn" href="/analytics/literacy-rates">Ver widgets →</a>
        </article>
    </section>

    <section class="endpoints">
        <h2>Endpoints proxy disponibles</h2>
        <ul>
            <li><code>GET /api/integrations/jfm/mastodon-fatalities</code></li>
            <li><code>GET /api/integrations/jfm/copernicus-fatalities</code></li>
            <li><code>GET /api/integrations/jfm/fedex-fatalities</code></li>
            <li><code>GET /api/integrations/jfm/sos12-birth-death-growth</code></li>
            <li><code>GET /api/integrations/jfm/sos20-spice-stats</code></li>
            <li><code>GET /api/integrations/mrg/vimeo-alcohol</code></li>
            <li><code>GET /api/integrations/mrg/dailymotion-alcohol</code></li>
            <li><code>GET /api/integrations/mrg/discord-alcohol</code></li>
            <li><code>GET /api/integrations/tgg/newsapi-education</code></li>
            <li><code>GET /api/integrations/tgg/google-literacy</code></li>
            <li><code>GET /api/integrations/tgg/linkedin-edu</code></li>
        </ul>
    </section>

    <!-- ================================================================
         Integraciones con APIs SOS de otros grupos — datos en vivo
         ================================================================ -->
    <section class="sos-section">
        <h2 class="sos-title">Integraciones con APIs SOS de otros grupos</h2>
        <p class="sos-intro">
            Datos obtenidos en tiempo real mediante proxy propio:
            <code>frontend → /api/integrations/jfm/... → API SOS externa</code>.
            No se muestra JSON crudo; los datos se renderizan en tablas HTML.
        </p>

        {#if !sos12Data && !sos20Data}
            <p class="sos-loading">Cargando integraciones SOS… (puede tardar si el servidor externo está en cold start)</p>
        {/if}

        {#if sos12Data}
        <div class="sos-card">
            <div class="sos-card-header">
                <h3>{sos12Data.api}</h3>
                <span class="sos-badge {sos12Data.dataSource === 'api' ? 'badge-ok' : 'badge-err'}">
                    {sos12Data.dataSource === 'api' ? '✓ API real' : '✗ Error de conexión'}
                </span>
            </div>
            <div class="sos-meta">
                <span><strong>Grupo:</strong> {sos12Data.group}</span>
                <span><strong>Integrado por:</strong> {sos12Data.integratedBy}</span>
                <span><strong>Registros:</strong> {sos12Data.count}</span>
            </div>
            <p class="sos-source">Fuente: <code>{sos12Data.sourceUrl}</code></p>
            <p class="sos-desc">{sos12Data.explanation}</p>

            {#if sos12Data.apiError}
                <p class="sos-error">Error: {sos12Data.apiError}</p>
            {/if}

            {#if sos12Data.data?.length}
                {@const headers = tableHeaders(sos12Data)}
                <div class="sos-table-wrap">
                    <table class="sos-table">
                        <thead>
                            <tr>{#each headers as h}<th>{h}</th>{/each}</tr>
                        </thead>
                        <tbody>
                            {#each sos12Data.data.slice(0, 5) as row}
                                <tr>{#each headers as h}<td>{row[h] ?? '—'}</td>{/each}</tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}
        </div>
        {/if}

        {#if sos20Data}
        <div class="sos-card">
            <div class="sos-card-header">
                <h3>{sos20Data.api}</h3>
                <span class="sos-badge {sos20Data.dataSource === 'api' ? 'badge-ok' : 'badge-err'}">
                    {sos20Data.dataSource === 'api' ? '✓ API real' : '✗ Error de conexión'}
                </span>
            </div>
            <div class="sos-meta">
                <span><strong>Grupo:</strong> {sos20Data.group}</span>
                <span><strong>Integrado por:</strong> {sos20Data.integratedBy}</span>
                <span><strong>Registros:</strong> {sos20Data.count}</span>
            </div>
            <p class="sos-source">Fuente: <code>{sos20Data.sourceUrl}</code></p>
            <p class="sos-desc">{sos20Data.explanation}</p>

            {#if sos20Data.apiError}
                <p class="sos-error">Error: {sos20Data.apiError}</p>
            {/if}

            {#if sos20Data.data?.length}
                {@const headers = tableHeaders(sos20Data)}
                <div class="sos-table-wrap">
                    <table class="sos-table">
                        <thead>
                            <tr>{#each headers as h}<th>{h}</th>{/each}</tr>
                        </thead>
                        <tbody>
                            {#each sos20Data.data.slice(0, 5) as row}
                                <tr>{#each headers as h}<td>{row[h] ?? '—'}</td>{/each}</tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}
        </div>
        {/if}
    </section>
</main>

<style>
    main {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
        color: #abb2bf;
        font-family: 'Inter', sans-serif;
    }
    h1 {
        text-align: center;
        color: #61afef;
        margin-bottom: 1rem;
    }
    .intro {
        text-align: center;
        max-width: 800px;
        margin: 0 auto 2rem;
        color: #abb2bf;
    }
    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        margin-bottom: 3rem;
    }
    .card {
        background: #282c34;
        border: 1px solid #3e4451;
        border-radius: 8px;
        padding: 1.25rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        display: flex;
        flex-direction: column;
    }
    .card h2 {
        color: #e5c07b;
        margin: 0 0 0.25rem;
    }
    .who {
        color: #98c379;
        font-size: 0.9rem;
        margin: 0 0 1rem;
    }
    .card ul {
        flex-grow: 1;
        padding-left: 1.2rem;
        line-height: 1.6;
    }
    .signal-note {
        font-size: 0.78rem;
        color: #7f848e;
        margin-top: 0.75rem;
        line-height: 1.5;
        border-top: 1px solid #3e4451;
        padding-top: 0.6rem;
    }
    .btn {
        display: inline-block;
        margin-top: 1rem;
        text-align: center;
        background: #61afef;
        color: #282c34;
        padding: 0.6rem 1rem;
        border-radius: 4px;
        text-decoration: none;
        font-weight: 600;
        transition: background 0.2s;
    }
    .btn:hover { background: #82c0ff; }
    .endpoints {
        background: #282c34;
        border: 1px solid #3e4451;
        border-radius: 8px;
        padding: 1.25rem;
    }
    .endpoints h2 {
        color: #e5c07b;
        margin-top: 0;
    }
    .endpoints code {
        background: #1c1f24;
        padding: 0.15rem 0.4rem;
        border-radius: 3px;
        color: #98c379;
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 0.85rem;
    }
    .endpoints li { margin: 0.4rem 0; }

    /* ── SOS integrations ── */
    .sos-section {
        margin-top: 3rem;
    }
    .sos-title {
        color: #61afef;
        margin-bottom: 0.5rem;
    }
    .sos-intro {
        color: #abb2bf;
        margin-bottom: 1.5rem;
        font-size: 0.9rem;
    }
    .sos-intro code {
        background: #1c1f24;
        padding: 0.1rem 0.4rem;
        border-radius: 3px;
        color: #98c379;
        font-size: 0.82rem;
    }
    .sos-loading {
        color: #7f848e;
        font-style: italic;
        padding: 1rem 0;
    }
    .sos-card {
        background: #111827;
        border-left: 4px solid #60a5fa;
        border-radius: 8px;
        padding: 1.25rem;
        margin-bottom: 1.5rem;
        color: #d1d5db;
    }
    .sos-card-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 0.75rem;
    }
    .sos-card-header h3 {
        color: #e5c07b;
        margin: 0;
        font-size: 1.1rem;
    }
    .sos-badge {
        font-size: 0.78rem;
        font-weight: 600;
        padding: 0.2rem 0.6rem;
        border-radius: 4px;
    }
    .badge-ok  { background: #14532d; color: #86efac; }
    .badge-err { background: #450a0a; color: #fca5a5; }
    .sos-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        font-size: 0.88rem;
        margin-bottom: 0.6rem;
        color: #9ca3af;
    }
    .sos-source {
        font-size: 0.82rem;
        color: #6b7280;
        margin: 0.25rem 0 0.5rem;
        word-break: break-all;
    }
    .sos-source code {
        color: #60a5fa;
        background: transparent;
    }
    .sos-desc {
        font-size: 0.9rem;
        margin: 0.4rem 0 0.75rem;
        line-height: 1.5;
    }
    .sos-error {
        color: #f87171;
        font-weight: 600;
        font-size: 0.88rem;
    }
    .sos-table-wrap {
        overflow-x: auto;
        margin-top: 0.75rem;
    }
    .sos-table {
        width: 100%;
        min-width: 700px;
        border-collapse: collapse;
        font-size: 0.83rem;
    }
    .sos-table th {
        background: #1f2937;
        color: #fbbf24;
        padding: 0.5rem 0.75rem;
        text-align: left;
        border: 1px solid #374151;
        white-space: nowrap;
    }
    .sos-table td {
        color: #e5e7eb;
        padding: 0.45rem 0.75rem;
        border: 1px solid #374151;
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .sos-table tbody tr:hover td {
        background: #1f2937;
    }
</style>
