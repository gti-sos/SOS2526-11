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
                <li>Geoapify Places (API key) → <b>pie</b></li>
                <li>HERE Traffic (Client Credentials) → <b>scatter</b></li>
                <li>TomTom Traffic → <b>heatmap</b></li>
            </ul>
            <a class="btn" href="/analytics/road-fatalities">Ver widgets →</a>
        </article>

        <article class="card">
            <h2>MRG — Alcohol Consumption</h2>
            <p class="who">Miguel Ridao</p>
            <ul>
                <li>Nutritionix (API key) → <b>bubble</b></li>
                <li>USDA FoodData Central (API key) → <b>treemap</b></li>
                <li>API-Ninjas Nutrition (API key) → <b>packedbubble</b></li>
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
            <li><code>GET /api/integrations/jfm/geoapify-fatalities</code></li>
            <li><code>GET /api/integrations/jfm/here-traffic</code></li>
            <li><code>GET /api/integrations/jfm/tomtom-traffic</code></li>
            <li><code>GET /api/integrations/mrg/nutritionix-activity</code></li>
            <li><code>GET /api/integrations/mrg/usda-health</code></li>
            <li><code>GET /api/integrations/mrg/apininjas-nutrition</code></li>
            <li><code>GET /api/integrations/tgg/newsapi-education</code></li>
            <li><code>GET /api/integrations/tgg/google-literacy</code></li>
            <li><code>GET /api/integrations/tgg/linkedin-edu</code></li>
        </ul>
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
</style>
