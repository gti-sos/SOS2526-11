<script>
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    // Convierto explícitamente a String para que no aparezca el error rojo de VS Code
    let nation = String($page.params.nation);
    let year = $page.params.year;

    let message = $state({ text: '', type: '' });
    
    let record = $state({
        nation: nation,
        year: year,
        population_death_rate: '',
        vehicle_death_rate: '',
        distance_death_rate: '',
        total_death: '',
        income_level: '',
        traffic_side: ''
    });

    onMount(async () => {
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
        }
    });

    // @ts-ignore
    async function updateRecord(event) {
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
        setTimeout(() => message = { text: '', type: '' }, 4000);
    }
</script>

<h1>Modificar datos de {nation.toUpperCase()} ({year})</h1>

{#if message.text}
    <div class="message {message.type}">
        {message.text}
    </div>
{/if}

<div class="form-container">
    <form onsubmit={updateRecord}>
        <div class="form-grid">
            <label>País (No editable): <input type="text" bind:value={record.nation} disabled /></label>
            <label>Año (No editable): <input type="number" bind:value={record.year} disabled /></label>
            <label>Muertes Totales: <input type="number" bind:value={record.total_death} required /></label>
            <label>Nivel de Ingresos: 
                <select bind:value={record.income_level} required>
                    <option value="high">Alto</option>
                    <option value="middle">Medio</option>
                    <option value="low">Bajo</option>
                </select>
            </label>
            <label>Lado de Conducción: 
                <select bind:value={record.traffic_side} required>
                    <option value="right">Derecha</option>
                    <option value="left">Izquierda</option>
                </select>
            </label>
            <label>Mortalidad / Población: <input type="number" step="0.1" bind:value={record.population_death_rate} required /></label>
            <label>Mortalidad / Vehículos: <input type="number" step="0.1" bind:value={record.vehicle_death_rate} /></label>
            <label>Mortalidad / Distancia: <input type="number" step="0.1" bind:value={record.distance_death_rate} /></label>
        </div>
        
        <div style="margin-top: 1.5rem; display: flex; gap: 10px; justify-content: center;">
            <button type="submit" style="background-color: #10b981; color: white;">Guardar Cambios</button>
            <button type="button" style="background-color: #6b7280; color: white;" onclick={() => goto('/road-fatalities')}>Cancelar</button>
        </div>
    </form>
</div>

<style>
    /* Estilo*/
    :global(body) { 
        background: #0f172a; 
        color: #e2e8f0; 
        font-family: Inter, sans-serif; 
    }
    
    h1 { 
        text-align: center; 
        margin-top: 2rem; 
        color: #e2e8f0; 
    }
    
    .message { 
        border-radius: 10px; 
        padding: 0.8rem 1rem; 
        margin: 1rem auto; 
        width: min(95%, 800px); 
        text-align: center; 
    }
    
    .message.success { 
        background: #0f5132; 
        border: 1px solid #21c28a; 
        color: #a7f3d0; 
    }
    
    .message.error { 
        background: #5f1f1f; 
        border: 1px solid #f87171; 
        color: #fee2e2; 
    }

    .form-container { 
        background: linear-gradient(180deg, #111828 0%, #18244b 100%); 
        border: 1px solid #1f2a44; 
        border-radius: 1rem; 
        padding: 1.5rem; 
        margin: 1rem auto; 
        max-width: 800px; 
        width: 95%; 
        box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4); 
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
        color: #cbd5e1; 
        font-weight: 500;
    }
    
    input, select { 
        background: #0b1222; 
        border: 1px solid #334155; 
        color: #e2e8f0; 
        border-radius: 0.5rem; 
        padding: 0.6rem 0.8rem; 
    }
    
    input:disabled { 
        background: #1e293b; 
        color: #94a3b8; 
        cursor: not-allowed; 
    }
    
    button { 
        border: none; 
        border-radius: 0.65rem; 
        padding: 0.75rem 1.5rem; 
        font-weight: bold; 
        cursor: pointer; 
        transition: transform 0.2s ease; 
    }
    
    button:hover { 
        transform: translateY(-2px); 
    }
</style>