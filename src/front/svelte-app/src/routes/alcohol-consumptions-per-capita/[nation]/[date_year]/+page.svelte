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

    onMount(async () => {
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
                headers: { 'Content-Type': 'application/json' },
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
    :global(body) { margin: 0; font-family: Inter, sans-serif; background: #0f172a; color: #e2e8f0; }
    h1 { text-align: center; margin-top: 1rem; color: #e2e8f0; }
    .message { border-radius: 10px; padding: 0.8rem 1rem; margin: 1rem auto; width: min(95%, 600px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35); }
    .message.success { background: #0f5132; border: 1px solid #21c28a; color: #a7f3d0; }
    .message.error { background: #5f1f1f; border: 1px solid #f87171; color: #fee2e2; }
    .form-container { background: linear-gradient(180deg, #111828 0%, #18244b 100%); border: 1px solid #1f2a44; border-radius: 1rem; padding: 1.25rem; margin: 1rem auto; max-width: 600px; width: 95%; }
    .form-container label { display: flex; flex-direction: column; gap: 0.4rem; margin: 0.7rem 0; color: #cbd5e1; }
    .form-container input { background: #0b1222; border: 1px solid #334155; color: #e2e8f0; border-radius: 0.5rem; padding: 0.6rem 0.8rem; }
    .form-container input:disabled { opacity: 0.5; cursor: not-allowed; }
    .form-container button { background-color: #2563eb; color: #fff; border: none; border-radius: 0.65rem; padding: 0.75rem 1rem; font-weight: 600; margin-top: 0.8rem; cursor: pointer; }
    .form-container button[type="button"] { background-color: #4b5563; }
</style>