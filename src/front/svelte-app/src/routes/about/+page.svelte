<svelte:head>
    <title>Sobre nosotros | SOS2526-11</title>
</svelte:head>

<main>
    <h1>Sobre el proyecto</h1>
    <p class="intro">
        SOS2526-11 es un proyecto del Grado en Ingeniería Informática (ETSII Sevilla) para la asignatura
        de Sistemas Orientados a Servicios. El equipo está formado por tres alumnos, cada uno responsable
        de un recurso distinto: alcohol consumption, literacy rates y road fatalities.
    </p>

    <section class="videos">
        <h2>Vídeos de presentación (D03)</h2>
        <p class="sub">
            Cada miembro del equipo presenta en un vídeo (&lt;5 min, narrado) las funcionalidades del entregable D03.
        </p>

        <div class="grid">
            <article class="card">
                <h3>Miguel Ridao Gallardo</h3>
                <p class="who">MRG — alcohol-consumptions-per-capita</p>
                <a class="btn" href="REEMPLAZAR_CON_URL_YOUTUBE_MRG" target="_blank" rel="noopener">
                    Ver vídeo D03 →
                </a>
            </article>

            <article class="card">
                <h3>Tomás Gutiérrez García</h3>
                <p class="who">TGG — literacy-rates</p>
                <a class="btn" href="REEMPLAZAR_CON_URL_YOUTUBE_TGG" target="_blank" rel="noopener">
                    Ver vídeo D03 →
                </a>
            </article>

            <article class="card">
                <h3>José Fernández Montero</h3>
                <p class="who">JFM — road-fatalities</p>
                <a class="btn" href="REEMPLAZAR_CON_URL_YOUTUBE_JFM" target="_blank" rel="noopener">
                    Ver vídeo D03 →
                </a>
            </article>
        </div>
    </section>

    <section class="links">
        <h2>Enlaces del proyecto</h2>
        <ul>
            <li><a href="https://github.com/gti-sos/SOS2526-11" target="_blank" rel="noopener">Repositorio en GitHub</a></li>
            <li><a href="/integrations">Vista de integraciones (D03.B)</a></li>
            <li><a href="/analytics">Dashboard global integrado</a></li>
            <li><a href="/">Volver a la página principal</a></li>
        </ul>
    </section>
</main>

<style>
    main {
        padding: 2rem;
        max-width: 1100px;
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
    .videos h2,
    .links h2 {
        color: #e5c07b;
        margin-bottom: 0.5rem;
    }
    .sub {
        color: #7f848e;
        margin-bottom: 1.5rem;
    }
    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
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
        align-items: flex-start;
    }
    .card h3 {
        color: #e5c07b;
        margin: 0 0 0.25rem;
    }
    .who {
        color: #98c379;
        font-size: 0.9rem;
        margin: 0 0 1rem;
    }
    .btn {
        display: inline-block;
        margin-top: auto;
        background: #61afef;
        color: #282c34;
        padding: 0.6rem 1rem;
        border-radius: 4px;
        text-decoration: none;
        font-weight: 600;
        transition: background 0.2s;
    }
    .btn:hover {
        background: #82c0ff;
    }
    .links {
        background: #282c34;
        border: 1px solid #3e4451;
        border-radius: 8px;
        padding: 1.25rem;
    }
    .links ul {
        margin: 0;
        padding-left: 1.2rem;
        line-height: 1.8;
    }
    .links a {
        color: #61afef;
        text-decoration: none;
    }
    .links a:hover {
        color: #98c379;
        text-decoration: underline;
    }
</style>
