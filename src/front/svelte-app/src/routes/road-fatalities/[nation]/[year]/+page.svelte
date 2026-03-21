<script>
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation'; // Para volver atrás automáticamente

    // Obtenemos el país y año de la URL dinámica
    let nation = $page.params.nation;
    let year = $page.params.year;

    let message = $state({ text: '', type: '' });
    
    // Objeto para los datos que vamos a editar
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

    // Al cargar la página, pedimos los datos concretos de ese recurso
    onMount(async () => {
        try {
            const res = await fetch(`/api/v2/road-fatalities/${nation}/${year}`);
            if (res.ok) {
                const data = await res.json();
                record = { ...data }; // Rellenamos el formulario con los datos de la BD
            } else if (res.status === 404) {
                setMessage(`No hemos encontrado los datos de ${nation} en el año ${year}.`, 'error');
            }
        } catch (error) {
            setMessage('Error de conexión al intentar cargar los datos.', 'error');
        }
    });

    // Función para enviar los datos actualizados (El PUT)
    // @ts-ignore
    async function updateRecord(event) {
        event.preventDefault();
        try {
            const dataToUpdate = {
                nation: record.nation, // No se puede cambiar porque es la clave
                year: parseInt(record.year, 10), // No se puede cambiar porque es la clave
                population_death_rate: parseFloat(record.population_death_rate),
                vehicle_death_rate: record.vehicle_death_rate ? parseFloat(record.vehicle_death_rate) : null,
                distance_death_rate: record.distance_death_rate ? parseFloat(record.distance_death_rate) : null,
                total_death: parseInt(record.total_death, 10),
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
                // Redirigimos a la tabla principal después de 2 segundos
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

<h1>Modificar datos de {nation?.toUpperCase()} ({year})</h1>

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
    /* Estilos */
    :global(body) {
        margin: 0;
        font-family: Inter, "Segoe UI", Roboto, sans-serif;
        background: #0f172a;
        color: #e2e8f0;
    }

    h1, h2 {
        text-align: center;
        margin-top: 1rem;
        color: #e2e8f0;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
    }

    .message {
        border-radius: 10px;
        padding: 0.8rem 1rem;
        margin: 1rem auto;
        width: min(95%, 1000px);
        font-size: 0.95rem;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
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

    .actions {
        margin: 1.5rem auto;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 0.8rem;
        max-width: 1000px;
        width: 95%;
    }

    .actions button,
    .form-container button,
    .delete-form button {
        border: 1px solid transparent;
        border-radius: 0.65rem;
        padding: 0.75rem 1rem;
        font-weight: 600;
        letter-spacing: 0.02em;
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.25);
        cursor: pointer;
        transition: transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
    }

    .actions button {
        background-color: #2f3a56;
        color: #f8fafc;
    }

    .actions button:hover {
        transform: translateY(-1px);
        border-color: #7c3aed;
    }

    .form-container {
        background: linear-gradient(180deg, #111828 0%, #18244b 100%);
        border: 1px solid #1f2a44;
        border-radius: 1rem;
        padding: 1.25rem;
        margin: 1rem auto;
        box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
        max-width: 1000px;
        width: 95%;
    }

    .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
    }

    .form-container label {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        color: #cbd5e1;
    }

    .form-container input, .form-container select {
        background: #0b1222;
        border: 1px solid #334155;
        color: #e2e8f0;
        border-radius: 0.5rem;
        padding: 0.6rem 0.8rem;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .form-container input:focus, .form-container select:focus {
        outline: none;
        border-color: #7c3aed;
        box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.3);
    }

    .form-container button[type="submit"] { background-color: #2563eb; color: #fff; }
    .form-container button[type="button"] { background-color: #4b5563; color: #fff; }

    .delete-specific {
        max-width: 1000px;
        width: 95%;
        margin: 1rem auto;
        background: #111a30;
        border: 1px solid #2f3b54;
        border-radius: 0.75rem;
        padding: 1rem;
    }

    .delete-specific h3 { margin: 0 0 0.5rem; color: #cbd5e1; }

    .delete-form {
        display: grid;
        grid-template-columns: 1fr 1fr auto;
        gap: 0.6rem;
    }

    .delete-form input {
        border: 1px solid #334155;
        border-radius: 0.5rem;
        padding: 0.6rem 0.7rem;
        background: #0b1222;
        color: #e2e8f0;
    }

    .delete-form button { background-color: #ef4444; color: #fff; }
    .delete-form button:hover { background-color: #dc2626; transform: translateY(-1px); }

    ul {
        max-width: 1000px;
        width: 95%;
        margin: 0.8rem auto 2rem;
        padding: 0;
        list-style: none;
    }

    li {
        border: 1px solid #334155;
        background: linear-gradient(180deg, #181f33 0%, #1d2a44 100%);
        padding: 0.85rem 0.95rem;
        border-radius: 0.75rem;
        margin-top: 0.6rem;
        color: #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.8rem;
    }

    .record-info { flex-grow: 1; }

    .record-actions {
        display: flex;
        gap: 8px;
    }

    /* Estilos compartidos para los botones de la lista */
    .btn-edit, .btn-delete {
        border: 1px solid transparent;
        border-radius: 0.65rem;
        padding: 0.6rem 1rem;
        font-weight: 600;
        letter-spacing: 0.02em;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
        cursor: pointer;
        transition: transform 0.2s ease, background-color 0.2s ease;
        text-decoration: none; /* Quita el subrayado del enlace */
        font-size: 0.9rem;
    }

    .btn-edit {
        background-color: #3b82f6; /* Azul */
        color: #fff;
    }
    
    .btn-edit:hover { background-color: #2563eb; transform: translateY(-1px); }

    .btn-delete {
        background-color: #ef4444; /* Rojo */
        color: #fff;
    }

    .btn-delete:hover { background-color: #dc2626; transform: translateY(-1px); }

    @media (max-width: 640px) {
        .delete-form { grid-template-columns: 1fr; }
        li { flex-direction: column; align-items: stretch; text-align: center; }
        .record-actions { flex-direction: column; }
        .btn-edit, .btn-delete { width: 100%; text-align: center; }
    }
</style>