<script>
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    // Uso $derived para que reaccione correctamente a la URL y no dé errores de tipado
    let nation = $derived(String($page.params.nation || ''));
    let year = $derived($page.params.year || '');

    let message = $state({ text: '', type: '' });
    let isLoading = $state(true); // Estado de carga inicializado a true
    
    let record = $state({
        nation: '',
        year: '',
        population_death_rate: '',
        vehicle_death_rate: '',
        distance_death_rate: '',
        total_death: '',
        income_level: '',
        traffic_side: ''
    });

    onMount(async () => {
        // Inicializo los valores bloqueados con los de la URL
        record.nation = nation;
        record.year = year;

        try {
            const res = await fetch(`/api/v2/road-fatalities/${nation}/${year}`);
            if (res.ok) {
                const data = await res.json();
                record = { ...data };
            } else if (res.status === 404) {
                setMessage(`No hemos encontrado los datos de ${nation} en el año ${year}.`, 'error');
            }
        } catch (error) {
            setMessage('Error de conexión al intentar cargar los datos.', 'error');
        } finally {
            isLoading = false; // Finalizamos el estado de carga pase lo que pase (éxito o error)
        }
    });

    // @ts-ignore
    async function updateRoadFatality(event) {
        event.preventDefault();
        try {
            const dataToUpdate = {
                nation: record.nation,
                year: parseInt(String(record.year), 10),
                population_death_rate: parseFloat(record.population_death_rate),
                vehicle_death_rate: record.vehicle_death_rate ? parseFloat(record.vehicle_death_rate) : null,
                distance_death_rate: record.distance_death_rate ? parseFloat(record.distance_death_rate) : null,
                total_death: parseInt(String(record.total_death), 10),
                income_level: record.income_level,
                traffic_side: record.traffic_side
            };

            const res = await fetch(`/api/v2/road-fatalities/${nation}/${year}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToUpdate)
            });

            if (res.ok) {
                setMessage('¡Los datos se han actualizado correctamente! Volviendo a la lista...', 'success');
                setTimeout(() => goto('/road-fatalities'), 2000);
            } else if (res.status === 400) {
                setMessage('Error: Comprueba que todos los campos tienen el formato correcto.', 'error');
            } else {
                setMessage('Ocurrió un error inesperado al intentar guardar los cambios.', 'error');
            }
        } catch (error) {
            setMessage('Error de red al intentar actualizar el registro.', 'error');
        }
    }

    // @ts-ignore
    function setMessage(text, type) {
        message = { text, type };
        setTimeout(() => message = { text: '', type: '' }, 10000);
    }
</script>

<h1 data-testid="edit-title">Modificar datos de {nation.toUpperCase()} ({year})</h1>

{#if message.text}
    <div class="message {message.type}" data-testid="edit-message">
        {message.text}
    </div>
{/if}

{#if isLoading}
    <div class="loading" data-testid="loading-indicator">Cargando datos del accidente...</div>
{:else}
    <div class="form-container">
        <form onsubmit={updateRoadFatality} data-testid="edit-form">
            <div class="form-grid">
                <label>País (No editable): <input type="text" bind:value={record.nation} data-testid="edit-nation" disabled /></label>
                <label>Año (No editable): <input type="number" bind:value={record.year} data-testid="edit-year" disabled /></label>
                <label>Muertes Totales: <input type="number" bind:value={record.total_death} data-testid="edit-total-death" required /></label>
                <label>Nivel de Ingresos: 
                    <select bind:value={record.income_level} data-testid="edit-income-level" required>
                        <option value="high">Alto</option>
                        <option value="middle">Medio</option>
                        <option value="low">Bajo</option>
                    </select>
                </label>
                <label>Lado de Conducción: 
                    <select bind:value={record.traffic_side} data-testid="edit-traffic-side" required>
                        <option value="right">Derecha</option>
                        <option value="left">Izquierda</option>
                    </select>
                </label>
                <label>Mortalidad / Población: <input type="number" step="0.1" bind:value={record.population_death_rate} data-testid="edit-population-death-rate" required /></label>
                <label>Mortalidad / Vehículos: <input type="number" step="0.1" bind:value={record.vehicle_death_rate} data-testid="edit-vehicle-death-rate" /></label>
                <label>Mortalidad / Distancia: <input type="number" step="0.1" bind:value={record.distance_death_rate} data-testid="edit-distance-death-rate" /></label>
            </div>
            
            <div style="margin-top: 1.5rem; display: flex; gap: 10px; justify-content: center;">
                <button type="submit" data-testid="edit-submit" style="background-color: #10b981; color: white;">Guardar Cambios</button>
                <button type="button" data-testid="edit-cancel" style="background-color: #6b7280; color: white;" onclick={() => goto('/road-fatalities')}>Cancelar</button>
            </div>
        </form>
    </div>
{/if}

<style>
    /* Estilo - Atom IDE Theme */
    :global(body) { 
        background: #282c34; 
        color: #abb2bf; 
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; 
    }
    
    h1 { 
        text-align: center; 
        margin-top: 2rem; 
        color: #61afef;
        font-weight: 600;
    }

    .loading {
        text-align: center;
        margin-top: 2rem;
        font-size: 1.2rem;
        color: #a6acaf;
        font-weight: 500;
        animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
    
    .message { 
        border-radius: 2px; 
        padding: 0.8rem 1rem; 
        margin: 1rem auto; 
        width: min(95%, 800px); 
        text-align: center;
        box-shadow: none;
    }
    
    .message.success { 
        background: #2d5016; 
        border: 1px solid #56b6c2; 
        color: #98c379; 
    }
    
    .message.error { 
        background: #4c1414; 
        border: 1px solid #e86671; 
        color: #e86671; 
    }

    .form-container { 
        background: #2d3139; 
        border: 1px solid #3e4451; 
        border-radius: 2px; 
        padding: 1.5rem; 
        margin: 1rem auto; 
        max-width: 800px; 
        width: 95%; 
        box-shadow: none; 
    }
    
    .form-grid { 
        display: grid; 
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
        gap: 15px; 
    }
    
    label { 
        display: flex; 
        flex-direction: column; 
        gap: 0.4rem; 
        color: #a6acaf; 
        font-weight: 500;
    }
    
    input, select { 
        background: #21252b; 
        border: 1px solid #3e4451; 
        color: #abb2bf; 
        border-radius: 2px; 
        padding: 0.6rem 0.8rem;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    }
    
    input:disabled { 
        background: #1a1f26; 
        color: #7d8590; 
        cursor: not-allowed; 
    }

    input:focus, select:focus {
        outline: none;
        border-color: #61afef;
    }
    
    button { 
        border: 1px solid #3e4451; 
        border-radius: 2px; 
        padding: 0.75rem 1.5rem; 
        font-weight: 600; 
        cursor: pointer; 
        transition: background-color 0.2s ease;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    }
    
    button:hover { 
        opacity: 0.9;
    }
</style>