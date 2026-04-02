<style>
    header {
        background: linear-gradient(90deg, #0f172a 0%, #1a2a4a 100%);
        border-bottom: 2px solid #334155;
        padding: 1rem 2rem;
        position: sticky;
        top: 0;
        z-index: 100;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .header-content {
        max-width: 1000px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 2rem;
    }

    .brand {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        text-decoration: none;
    }

    .brand-icon {
        font-size: 1.8rem;
    }

    .brand-text {
        color: #38bdf8;
        font-weight: 700;
        font-size: 1.4rem;
        text-shadow: 0 2px 8px rgba(56, 189, 248, 0.2);
    }

    .brand-text small {
        display: block;
        font-size: 0.7rem;
        color: #cbd5e1;
        text-shadow: none;
        font-weight: 500;
        margin-top: 0.2rem;
    }

    nav {
        display: flex;
        gap: 2rem;
        flex-wrap: wrap;
        justify-content: flex-end;
    }

    nav a {
        color: #cbd5e1;
        text-decoration: none;
        font-weight: 500;
        transition: all 0.3s ease;
        position: relative;
        padding: 0.5rem 0;
    }

    nav a:hover {
        color: #38bdf8;
    }

    nav a::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 0;
        height: 2px;
        background: #38bdf8;
        transition: width 0.3s ease;
    }

    nav a:hover::after {
        width: 100%;
    }

    @media (max-width: 768px) {
        header {
            padding: 1rem;
        }

        .header-content {
            flex-direction: column;
            gap: 1rem;
        }

        .brand-text {
            font-size: 1.2rem;
        }

        nav {
            width: 100%;
            justify-content: center;
            gap: 1.5rem;
        }
    }

    @media (max-width: 480px) {
        header {
            padding: 0.8rem;
        }

        .header-content {
            gap: 0.8rem;
        }

        .brand-text {
            font-size: 1rem;
        }

        .brand-text small {
            display: none;
        }

        nav {
            gap: 1rem;
            font-size: 0.9rem;
        }
    }
</style>

<header>
    <div class="header-content">
        <a href="/" class="brand">
            <span class="brand-icon">📊</span>
            <span class="brand-text">
                SOS2526-11
                <small>Análisis Integrado</small>
            </span>
        </a>
        <nav>
            <a href="/">Inicio</a>
            <a href="/literacy-rates">Alfabetización</a>
            <a href="/alcohol-consumptions-per-capita">Alcohol</a>
            <a href="/road-fatalities">Tráfico</a>
            <a href="/about">Acerca de</a>
        </nav>
    </div>
</header>