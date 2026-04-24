<script>
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    let username = $state('');
    let password = $state('');
    let errorMessage = $state('');

    onMount(() => {
        // Redirigir si ya está logueado
        if (typeof window !== 'undefined' && sessionStorage.getItem('token')) {
            goto('/alcohol-consumptions-per-capita');
        }
    });

    async function handleLogin(e) {
        if (e) e.preventDefault();
        errorMessage = "";
        
        try {
            const res = await fetch('/api/v2/alcohol-consumptions-per-capita/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (res.ok) {
                const data = await res.json();
                if (typeof window !== 'undefined') {
                    sessionStorage.setItem('token', data.token);
                }
                goto('/alcohol-consumptions-per-capita');
            } else {
                const errorData = await res.json();
                errorMessage = errorData.error || "Credenciales incorrectas.";
            }
        } catch (error) {
            errorMessage = "Error de conexión con el servidor.";
            console.error(error);
        }
    }
</script>

<div class="login-container">
    <div class="login-box">
        <h1>Iniciar Sesión</h1>
        <p>Por favor, introduce tus credenciales.</p>
        
        {#if errorMessage}
            <div class="error-message" data-testid="login-error-message">
                {errorMessage}
            </div>
        {/if}

        <form onsubmit={handleLogin}>
            <div class="input-group">
                <label for="username">Usuario</label>
                <input 
                    id="username"
                    type="text" 
                    bind:value={username} 
                    data-testid="login-username" 
                    required 
                    autocomplete="username"
                />
            </div>
            
            <div class="input-group">
                <label for="password">Contraseña</label>
                <input 
                    id="password"
                    type="password" 
                    bind:value={password} 
                    data-testid="login-password" 
                    required 
                    autocomplete="current-password"
                />
            </div>

            <button type="submit" data-testid="login-submit">Entrar</button>
        </form>
    </div>
</div>

<style>
    :global(body) { 
        margin: 0; 
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; 
        background: #282c34; 
        color: #abb2bf; 
    }
    
    .login-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: calc(100vh - 150px);
        padding: 2rem;
    }

    .login-box {
        background: #2d3139;
        border: 1px solid #3e4451;
        border-radius: 4px;
        padding: 2.5rem;
        width: 100%;
        max-width: 400px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    h1 { 
        text-align: center; 
        margin-top: 0;
        margin-bottom: 0.5rem;
        color: #61afef; 
        font-weight: 600; 
    }

    p {
        text-align: center;
        color: #a6acaf;
        margin-bottom: 2rem;
        font-size: 0.9rem;
    }

    .error-message { 
        background: #4c1414; 
        border: 1px solid #e86671; 
        color: #e86671; 
        border-radius: 2px; 
        padding: 0.8rem 1rem; 
        margin-bottom: 1.5rem; 
        font-size: 0.95rem; 
        text-align: center;
    }

    .input-group {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        margin-bottom: 1.5rem;
    }

    .input-group label {
        color: #a6acaf;
        font-size: 0.95rem;
    }

    .input-group input { 
        background: #21252b; 
        border: 1px solid #3e4451; 
        color: #abb2bf; 
        border-radius: 2px; 
        padding: 0.8rem; 
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; 
        font-size: 1rem;
    }

    .input-group input:focus {
        outline: none;
        border-color: #61afef;
    }

    button { 
        width: 100%;
        background-color: #61afef; 
        color: #282c34; 
        border: 1px solid #3e4451; 
        border-radius: 2px; 
        padding: 0.9rem; 
        font-weight: 600; 
        font-size: 1rem;
        cursor: pointer; 
        transition: background-color 0.2s ease; 
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; 
        margin-top: 0.5rem;
    }

    button:hover { 
        opacity: 0.9;
    }
</style>
