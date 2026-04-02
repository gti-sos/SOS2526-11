<style>
    footer {
        background: linear-gradient(90deg, #0f172a 0%, #1a2a4a 100%);
        border-top: 2px solid #334155;
        padding: 2rem;
        margin-top: 3rem;
        color: #cbd5e1;
    }

    .footer-content {
        max-width: 1000px;
        margin: 0 auto;
    }

    .footer-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 2rem;
        margin-bottom: 2rem;
    }

    .footer-section h3 {
        color: #38bdf8;
        margin-bottom: 1rem;
        font-size: 1.1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .footer-section ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .footer-section li {
        margin-bottom: 0.6rem;
        padding-left: 1.2rem;
        position: relative;
    }

    .footer-section li:before {
        content: "▸";
        color: #38bdf8;
        position: absolute;
        left: 0;
    }

    .footer-section a {
        color: #38bdf8;
        text-decoration: none;
        transition: color 0.2s ease;
    }

    .footer-section a:hover {
        color: #7dd3fc;
        text-decoration: underline;
    }

    .footer-bottom {
        border-top: 1px solid #334155;
        padding-top: 1.5rem;
        text-align: center;
        font-size: 0.9rem;
        color: #94a3b8;
    }

    .footer-bottom p {
        margin: 0.5rem 0;
    }

    .team-info {
        display: flex;
        gap: 2rem;
        justify-content: center;
        flex-wrap: wrap;
        margin: 1rem 0;
    }

    .team-member {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.3rem;
    }

    .team-member strong {
        color: #93c5fd;
    }

    .team-member small {
        color: #fbbf24;
        font-weight: 600;
    }

    @media (max-width: 768px) {
        footer {
            padding: 1.5rem;
        }

        .footer-grid {
            gap: 1.5rem;
            grid-template-columns: 1fr;
        }

        .team-info {
            gap: 1rem;
        }
    }

    @media (max-width: 480px) {
        footer {
            padding: 1rem;
            margin-top: 2rem;
        }

        .footer-section h3 {
            font-size: 1rem;
        }

        .footer-grid {
            gap: 1rem;
        }

        .footer-bottom {
            font-size: 0.85rem;
        }

        .team-info {
            gap: 0.8rem;
        }
    }
</style>

<footer>
    <div class="footer-content">
        <div class="footer-grid">
            <div class="footer-section">
                <h3>📚 Sobre el Proyecto</h3>
                <ul>
                    <li><a href="/">Inicio</a></li>
                    <li><a href="/about">Acerca de Nosotros</a></li>
                    <li><a href="https://github.com/gti-sos/SOS2526-11" target="_blank">Repositorio GitHub</a></li>
                    <li><a href="https://sos2526-11.onrender.com" target="_blank">App Desplegada</a></li>
                </ul>
            </div>

            <div class="footer-section">
                <h3>🔗 Recursos</h3>
                <ul>
                    <li><a href="/literacy-rates">Tasas de Alfabetización</a></li>
                    <li><a href="/alcohol-consumptions-per-capita">Consumo de Alcohol</a></li>
                    <li><a href="/road-fatalities">Muertes por Tráfico</a></li>
                </ul>
            </div>

            <div class="footer-section">
                <h3>📖 Documentación</h3>
                <ul>
                    <li><a href="https://documenter.getpostman.com/view/52263638/2sBXijJBnr" target="_blank">API Literacy Rates</a></li>
                    <li><a href="https://documenter.getpostman.com/view/52263638/2sBXigMDfw" target="_blank">API Alcohol Consumptions</a></li>
                    <li><a href="https://documenter.getpostman.com/view/52276616/2sBXijJC24" target="_blank">API Road Fatalities</a></li>
                </ul>
            </div>
        </div>

        <div class="footer-bottom">
            <div class="team-info">
                <div class="team-member">
                    <strong>Tomás Gutiérrez García</strong>
                    <small>literacy-rates</small>
                </div>
                <div class="team-member">
                    <strong>Miguel Ridao Gallardo</strong>
                    <small>alcohol-consumptions-per-capita</small>
                </div>
                <div class="team-member">
                    <strong>José Fernández Montero</strong>
                    <small>road-fatalities</small>
                </div>
            </div>
            <p>&copy; 2024-2026 Grupo 11 - SOS2526. Todos los derechos reservados.</p>
            <p>Análisis Integrado de Datos Socioeconómicos y de Seguridad Vial</p>
        </div>
    </div>
</footer>
