<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SOS2526 - Grupo 11</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            background: #282c34;
            color: #abb2bf;
            line-height: 1.6;
            min-height: 100vh;
        }

        .container {
            max-width: 1000px;
            width: 95%;
            margin: 0 auto;
            padding: 2rem 0;
        }

        h2 {
            color: #61afef;
            margin-top: 1.5rem;
            margin-bottom: 1rem;
            font-size: 1.5rem;
            border-bottom: 1px solid #3e4451;
            padding-bottom: 0.5rem;
            font-weight: 600;
        }

        h3 {
            color: #a6acaf;
            margin-top: 1rem;
            margin-bottom: 0.8rem;
            font-size: 1.1rem;
            font-weight: 500;
        }

        section {
            background: #2d3139;
            border: 1px solid #3e4451;
            border-radius: 2px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            box-shadow: none;
            transition: background 0.2s ease;
        }

        section:hover {
            background: #323a42;
            box-shadow: none;
        }

        ul {
            list-style: none;
            margin-left: 0;
        }

        li {
            padding: 0.8rem 0;
            border-bottom: 1px solid #3e4451;
            display: flex;
            align-items: center;
            gap: 0.8rem;
        }

        li:last-child {
            border-bottom: none;
        }

        li:before {
            content: "▸";
            color: #56b6c2;
            font-size: 1.2rem;
            flex-shrink: 0;
        }

        a {
            color: #61afef;
            text-decoration: none;
            font-weight: normal;
            transition: color 0.2s ease;
            word-break: break-word;
        }

        a:hover {
            color: #98c379;
            text-decoration: underline;
        }

        .label {
            color: #282c34;
            background: #e5c07b;
            padding: 0.2rem 0.6rem;
            border-radius: 2px;
            font-size: 0.9rem;
            font-weight: 600;
            white-space: nowrap;
        }

        h2 {
            color: #61afef;
            margin-top: 1.5rem;
            margin-bottom: 1rem;
            font-size: 1.5rem;
            border-bottom: 1px solid #3e4451;
            padding-bottom: 0.5rem;
            font-weight: 600;
        }

        h3 {
            color: #a6acaf;
            margin-top: 1rem;
            margin-bottom: 0.8rem;
            font-size: 1.1rem;
            font-weight: 500;
        }

        section {
            background: #2d3139;
            border: 1px solid #3e4451;
            border-radius: 2px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            box-shadow: none;
            transition: background 0.2s ease;
        }

        section:hover {
            background: #323a42;
            box-shadow: none;
        }

        ul {
            list-style: none;
            margin-left: 0;
        }

        li {
            padding: 0.8rem 0;
            border-bottom: 1px solid #3e4451;
            display: flex;
            align-items: center;
            gap: 0.8rem;
        }

        li:last-child {
            border-bottom: none;
        }

        li:before {
            content: "▸";
            color: #56b6c2;
            font-size: 1.2rem;
            flex-shrink: 0;
        }

        a {
            color: #61afef;
            text-decoration: none;
            font-weight: normal;
            transition: color 0.2s ease;
            word-break: break-word;
        }

        a:hover {
            color: #98c379;
            text-decoration: underline;
        }

        .label {
            color: #282c34;
            background: #e5c07b;
            padding: 0.2rem 0.6rem;
            border-radius: 2px;
            font-size: 0.9rem;
            font-weight: 600;
            white-space: nowrap;
        }

        .team-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }

        .team-member {
            background: #3e4451;
            border: 1px solid #4e5561;
            border-radius: 2px;
            padding: 1rem;
            text-align: center;
            transition: background 0.2s ease;
        }

        .team-member:hover {
            background: #4e5561;
        }

        .team-member p {
            margin-bottom: 0.5rem;
        }

        .hero {
            text-align: center;
            margin-bottom: 2rem;
        }

        .hero-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }

        hr {
            border: none;
            height: 1px;
            background: #3e4451;
            margin: 2rem 0;
        }

        @media (max-width: 768px) {
            h1 {
                font-size: 2rem;
            }

            h2 {
                font-size: 1.3rem;
            }

            .container {
                width: 98%;
                padding: 1rem 0;
            }

            section {
                padding: 1rem;
                margin-bottom: 1rem;
                border-radius: 2px;
            }

            .team-grid {
                grid-template-columns: 1fr;
            }

            li {
                font-size: 0.95rem;
            }
        }

        @media (max-width: 480px) {
            h1 {
                font-size: 1.5rem;
            }

            h2 {
                font-size: 1.1rem;
            }

            .subtitle {
                font-size: 1rem;
            }

            .container {
                padding: 0.5rem 0;
            }

            section {
                border-radius: 2px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="hero">
            <div class="hero-icon">📊</div>
            <h1>SOS2526 - Grupo 11</h1>
            <p class="subtitle">Análisis integrado de tasas de mortalidad por tráfico, consumo de alcohol y alfabetización</p>
        </div>

        <section>
            <h2>🎥 Vídeos D03</h2>
            <ul>
                <li><a href="REEMPLAZAR_CON_URL_YOUTUBE_MRG" target="_blank" rel="noopener">Vídeo de Miguel Ridao Gallardo (MRG)</a> - <span class="label">alcohol-consumptions-per-capita</span></li>
                <li><a href="REEMPLAZAR_CON_URL_YOUTUBE_TGG" target="_blank" rel="noopener">Vídeo de Tomás Gutiérrez García (TGG)</a> - <span class="label">literacy-rates</span></li>
                <li><a href="REEMPLAZAR_CON_URL_YOUTUBE_JFM" target="_blank" rel="noopener">Vídeo de José Fernández Montero (JFM)</a> - <span class="label">road-fatalities</span></li>
                <li><a href="/about">Ver todos en la página /about</a></li>
            </ul>
        </section>

        <section>
            <h2>🔗 Interfaces de Gestión</h2>
            <ul>
                <li><a href="/literacy-rates">Tasas de Alfabetización</a> - <span class="label">literacy-rates</span></li>
                <li><a href="/alcohol-consumptions-per-capita">Consumo de Alcohol per Cápita</a> - <span class="label">alcohol-consumptions-per-capita</span></li>
                <li><a href="/road-fatalities">Muertes por Accidentes de Tráfico</a> - <span class="label">road-fatalities</span></li>
            </ul>
        </section>

        <section>
            <h2>📊 Analíticas e Visualizaciones</h2>
            <h3>Dashboard Global (Integrado)</h3>
            <ul>
                <li><a href="/analytics">Dashboard Integrado</a> - Comparativa de los 3 recursos (Column Chart)</li>
            </ul>
            <h3>Gráficos Individuales</h3>
            <ul>
                <li><a href="/analytics/literacy-rates">Tasas de Alfabetización - Gráfico Individual</a> (TGG) - <span class="label">Bar Chart</span></li>
                <li><a href="/analytics/alcohol-consumptions-per-capita">Consumo de Alcohol - Gráfico Individual</a> (MRG) - <span class="label">Area Chart</span></li>
                <li><a href="/analytics/road-fatalities">Muertes por Accidentes de Tráfico - Gráfico Individual</a> (JFM) - <span class="label">Spline Chart</span></li>
            </ul>
            <h3>Mapas Geoespaciales</h3>
            <ul>
                <li><a href="/analytics/literacy-rates/map">Tasas de Alfabetización - Mapa Interactivo</a> (TGG) - Distribución mundial</li>
                <li><a href="/analytics/alcohol-consumptions-per-capita/map">Consumo de Alcohol - Mapa Interactivo</a> (MRG) - Distribución mundial</li>
                <li><a href="/analytics/road-fatalities/map">Muertes por Accidentes de Tráfico - Mapa Interactivo</a> (JFM) - Distribución mundial</li>
            </ul>
        </section>

        <section>
            <h2>🌐 APIs del Proyecto</h2>
            <h3>Versión 1</h3>
            <ul>
                <li><a href="https://sos2526-11.onrender.com/api/v1/alcohol-consumptions-per-capita">/api/v1/alcohol-consumptions-per-capita</a></li>
                <li><a href="https://sos2526-11.onrender.com/api/v1/literacy-rates">/api/v1/literacy-rates</a></li>
                <li><a href="https://sos2526-11.onrender.com/api/v1/road-fatalities">/api/v1/road-fatalities</a></li>
            </ul>
            <h3>Versión 2</h3>
            <ul>
                <li><a href="https://sos2526-11.onrender.com/api/v2/alcohol-consumptions-per-capita">/api/v2/alcohol-consumptions-per-capita</a></li>
                <li><a href="https://sos2526-11.onrender.com/api/v2/literacy-rates">/api/v2/literacy-rates</a></li>
                <li><a href="https://sos2526-11.onrender.com/api/v2/road-fatalities">/api/v2/road-fatalities</a></li>
            </ul>
        </section>

        <section>
            <h2>📚 Documentación Postman</h2>
            <h3>Versión 1</h3>
            <ul>
                <li><a href="https://documenter.getpostman.com/view/52276603/2sBXigNZJ5" target="_blank">Documentación - Alcohol Consumptions per Capita</a></li>
                <li><a href="https://documenter.getpostman.com/view/52263638/2sBXigMDfw" target="_blank">Documentación - Literacy Rates</a></li>
                <li><a href="https://documenter.getpostman.com/view/52276616/2sBXigMDg4" target="_blank">Documentación - Road Fatalities</a></li>
            </ul>
            <h3>Versión 2</h3>
            <ul>
                <li><a href="https://documenter.getpostman.com/view/52276603/2sBXijJBwi" target="_blank">Documentación - Alcohol Consumptions per Capita</a></li>
                <li><a href="https://documenter.getpostman.com/view/52263638/2sBXijJBnr" target="_blank">Documentación - Literacy Rates</a></li>
                <li><a href="https://documenter.getpostman.com/view/52276616/2sBXijJC24" target="_blank">Documentación - Road Fatalities</a></li>
            </ul>
        </section>

        <section>
            <h2>👥 Equipo del Proyecto</h2>
            <div class="team-grid">
                <div class="team-member">
                    <p><strong>Tomás Gutiérrez García</strong></p>
                    <p><span class="label">literacy-rates</span></p>
                </div>
                <div class="team-member">
                    <p><strong>Miguel Ridao Gallardo</strong></p>
                    <p><span class="label">alcohol-consumptions-per-capita</span></p>
                </div>
                <div class="team-member">
                    <p><strong>José Fernández Montero</strong></p>
                    <p><span class="label">road-fatalities</span></p>
                </div>
            </div>
        </section>

        <section>
            <h2>🔧 Enlaces Útiles</h2>
            <ul>
                <li><a href="https://github.com/gti-sos/SOS2526-11" target="_blank">Repositorio GitHub del Proyecto</a></li>
                <li><a href="https://sos2526-11.onrender.com" target="_blank">Aplicación Desplegada en Render</a></li>
            </ul>
        </section>
    </div>
</body>
</html>