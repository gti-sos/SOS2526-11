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
            font-family: 'Inter', 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1a2a4a 100%);
            color: #e2e8f0;
            line-height: 1.8;
            min-height: 100vh;
        }

        .container {
            max-width: 1000px;
            width: 95%;
            margin: 0 auto;
            padding: 2rem 0;
        }

        h1 {
            text-align: center;
            color: #38bdf8;
            margin-bottom: 0.5rem;
            font-size: 2.5rem;
            text-shadow: 0 2px 10px rgba(56, 189, 248, 0.2);
        }

        .subtitle {
            text-align: center;
            color: #cbd5e1;
            margin-bottom: 2rem;
            font-size: 1.1rem;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }

        h2 {
            color: #93c5fd;
            margin-top: 1.5rem;
            margin-bottom: 1rem;
            font-size: 1.5rem;
            border-bottom: 2px solid #334155;
            padding-bottom: 0.5rem;
        }

        h3 {
            color: #cbd5e1;
            margin-top: 1rem;
            margin-bottom: 0.8rem;
            font-size: 1.1rem;
        }

        section {
            background: linear-gradient(180deg, #111827 0%, #1a2a44 100%);
            border: 1px solid #1f2937;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        section:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(56, 189, 248, 0.1);
        }

        ul {
            list-style: none;
            margin-left: 0;
        }

        li {
            padding: 0.8rem 0;
            border-bottom: 1px solid #2d3748;
            display: flex;
            align-items: center;
            gap: 0.8rem;
        }

        li:last-child {
            border-bottom: none;
        }

        li:before {
            content: "▸";
            color: #38bdf8;
            font-size: 1.2rem;
            flex-shrink: 0;
        }

        a {
            color: #38bdf8;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.2s ease;
            word-break: break-word;
        }

        a:hover {
            color: #7dd3fc;
            text-decoration: underline;
        }

        .label {
            color: #fbbf24;
            background: rgba(251, 191, 36, 0.1);
            padding: 0.2rem 0.6rem;
            border-radius: 4px;
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
            background: rgba(56, 189, 248, 0.05);
            border: 1px solid #334155;
            border-radius: 8px;
            padding: 1rem;
            text-align: center;
            transition: background 0.2s ease;
        }

        .team-member:hover {
            background: rgba(56, 189, 248, 0.1);
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
            height: 2px;
            background: linear-gradient(90deg, transparent, #334155, transparent);
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
                border-radius: 8px;
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
            <h2>🔗 Interfaces de Gestión</h2>
            <ul>
                <li><a href="/literacy-rates">Tasas de Alfabetización</a> - <span class="label">literacy-rates</span></li>
                <li><a href="/alcohol-consumptions-per-capita">Consumo de Alcohol per Cápita</a> - <span class="label">alcohol-consumptions-per-capita</span></li>
                <li><a href="/road-fatalities">Muertes por Accidentes de Tráfico</a> - <span class="label">road-fatalities</span></li>
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
                <li><a href="https://documenter.getpostman.com/view/52263638/2sBXigMDfw" target="_blank">Documentación - Alcohol Consumptions per Capita</a></li>
                <li><a href="https://documenter.getpostman.com/view/52263638/2sBXigMDfw" target="_blank">Documentación - Literacy Rates</a></li>
                <li><a href="https://documenter.getpostman.com/view/52276616/2sBXigMDg4" target="_blank">Documentación - Road Fatalities</a></li>
            </ul>
            <h3>Versión 2</h3>
            <ul>
                <li><a href="https://documenter.getpostman.com/view/52263638/2sBXigMDfw" target="_blank">Documentación - Alcohol Consumptions per Capita</a></li>
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