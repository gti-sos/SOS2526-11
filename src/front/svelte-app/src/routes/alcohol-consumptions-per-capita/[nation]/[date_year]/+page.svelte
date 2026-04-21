<script>
// @ts-nocheck

    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';

    // Obtenemos los parámetros de la URL (ej: /Spain/2024)
    let nation = $page.params.nation;
    let date_year = $page.params.date_year;

    let item = $state({});
    let message = $state({ text: '', type: '' });
    let isLoading = $state(true);

    // Cargar los datos actuales del recurso
    async function loadResource() {
        try {
            const res = await fetch(`/api/v2/alcohol-consumptions-per-capita/${nation}/${date_year}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                item = await res.json();
                isLoading = false;
            } else {
                const error = await res.json();
                setMessage(`Error al cargar recurso: ${error.error || 'No encontrado'}`, 'error');
                isLoading = false;
            }
        } catch (err) {
            setMessage('Error de conexión al cargar recurso.', 'error');
            isLoading = false;
        }
    }

    let token = "";

    async function login() {
        try {
            const res = await fetch('/api/v2/alcohol-consumptions-per-capita/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: "admin", password: "admin" })
            });
            if (res.ok) {
                const data = await res.json();
                token = data.token;
            }
        } catch(e) {}
    }

    onMount(async () => {
        await login();
        await loadResource();
    });

    // Función para guardar los cambios (el PUT)
    async function updateResource() {
        try {
            const data = {
                // @ts-ignore
                nation: item.nation,
                // @ts-ignore
                date_year: parseInt(item.date_year),
                // @ts-ignore
                alcohol_litre: parseFloat(item.alcohol_litre),
                // @ts-ignore
                recorded_consumption: parseFloat(item.recorded_consumption),
                // @ts-ignore
                unrecorded_consumption: parseFloat(item.unrecorded_consumption)
            };

            const res = await fetch(`/api/v2/alcohol-consumptions-per-capita/${nation}/${date_year}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                setMessage('Recurso actualizado exitosamente.', 'success');
                // Al igual que Tomás, esperamos 2 segundos y volvemos a la tabla
                setTimeout(() => goto('/alcohol-consumptions-per-capita'), 2000);
            } else {
                const error = await res.json();
                setMessage(`Error al actualizar recurso: ${error.error || 'Datos inválidos'}`, 'error');
            }
        } catch (err) {
            setMessage('Error de conexión al actualizar recurso.', 'error');
        }
    }

    // @ts-ignore
    function setMessage(text, type) {
        message = { text, type };
        setTimeout(() => message = { text: '', type: '' }, 10000);
    }
</script>

<h1>Editar Consumo de Alcohol: {nation} ({date_year})</h1>

{#if message.text}
    <div class="message {message.type}">
        {message.text}
    </div>
{/if}

{#if isLoading}
    <p style="text-align: center;">Cargando...</p>
{:else}
    <div class="form-container">
        <form onsubmit={(e) => { e.preventDefault(); updateResource(); }}>
            <label> País: <input type="text" bind:value={item.nation} disabled /> </label>
            <label> Año: <input type="number" bind:value={item.date_year} disabled /> </label>
            
            <label> Litros Totales: <input type="number" step="0.1" bind:value={item.alcohol_litre} required /> </label>
            <label> Consumo Registrado: <input type="number" step="0.1" bind:value={item.recorded_consumption} required /> </label>
            <label> Consumo No Registrado: <input type="number" step="0.1" bind:value={item.unrecorded_consumption} required /> </label>
            
            <button type="submit">Actualizar</button>
            <button type="button" onclick={() => goto('/alcohol-consumptions-per-capita')}>Cancelar</button>
        </form>
    </div>
{/if}

<style>
    :global(body) { margin: 0; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; background: #282c34; color: #abb2bf; }
    h1 { text-align: center; margin-top: 1rem; color: #61afef; font-weight: 600; }
    .message { border-radius: 2px; padding: 0.8rem 1rem; margin: 1rem auto; width: min(95%, 600px); box-shadow: none; }
    .message.success { background: #2d5016; border: 1px solid #56b6c2; color: #98c379; }
    .message.error { background: #4c1414; border: 1px solid #e86671; color: #e86671; }
    .form-container { background: #2d3139; border: 1px solid #3e4451; border-radius: 2px; padding: 1.25rem; margin: 1rem auto; max-width: 600px; width: 95%; }
    .form-container label { display: flex; flex-direction: column; gap: 0.4rem; margin: 0.7rem 0; color: #a6acaf; }
    .form-container input { background: #21252b; border: 1px solid #3e4451; color: #abb2bf; border-radius: 2px; padding: 0.6rem 0.8rem; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; }
    .form-container input:disabled { opacity: 0.5; cursor: not-allowed; }
    .form-container input:focus { outline: none; border-color: #61afef; }
    .form-container button { background-color: #61afef; color: #282c34; border: 1px solid #3e4451; border-radius: 2px; padding: 0.75rem 1rem; font-weight: 600; margin-top: 0.8rem; cursor: pointer; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; }
    .form-container button[type="button"] { background-color: #3e4451; color: #abb2bf; }
    .form-container button:hover { opacity: 0.9; }
</style>