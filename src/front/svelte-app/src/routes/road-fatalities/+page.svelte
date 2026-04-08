<script>
    import { onMount } from 'svelte';
    // @ts-ignore
    let roadFatalities = $state([]);
    let message = $state({ text: '', type: '' }); // type: 'success' or 'error'
    let showCreateForm = $state(false);
    
    // Estructura de road-fatalities
    let newItem = $state({ 
        nation: '', 
        year: '', 
        population_death_rate: '', 
        vehicle_death_rate: '', 
        distance_death_rate: '', 
        total_death: '',
        income_level: '',
        traffic_side: ''
    });

    // Variables de busqueda
    let searchParams = $state({
        nation: '', year: '', from: '', to: '', income_level: '', traffic_side: '', offset: '', limit: ''
    });

    // Carga inicial de datos
    async function loadInitialData() {
        try {
            const res = await fetch('/api/v2/road-fatalities/loadInitialData', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (res.ok) {
                setMessage('Datos iniciales de accidentes cargados correctamente.', 'success');
                await listRoadFatalities();
            } else if (res.status === 400) {
                setMessage('Los datos de accidentes ya estaban cargados en el sistema.', 'success');
                await listRoadFatalities();
            } else {
                setMessage('Ocurrió un error al intentar cargar los datos iniciales.', 'error');
            }
        } catch (err) {
            setMessage('Error de conexión con el servidor al cargar los datos.', 'error');
        }
    }

    // Listar todos los recursos
    async function listRoadFatalities() {
        try {
            const res = await fetch('/api/v2/road-fatalities', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (res.ok) {
                roadFatalities = await res.json();
                setMessage('Lista de accidentes actualizada.', 'success');
            } else {
                setMessage('No se pudieron obtener los registros de accidentes.', 'error');
            }
        } catch (err) {
            setMessage('Error de conexión al obtener la lista de datos.', 'error');
        }
    }

    onMount(async () => {
        await listRoadFatalities();
    });

    // Crear un nuevo recurso
    async function createRoadFatality() {
        try {
            // Formateo estricto de los datos 
            const data = {
                nation: newItem.nation.trim().toLowerCase(), // Convertimos a minúscula como en el backend
                year: parseInt(newItem.year, 10),
                population_death_rate: parseFloat(newItem.population_death_rate),
                vehicle_death_rate: newItem.vehicle_death_rate ? parseFloat(newItem.vehicle_death_rate) : null,
                distance_death_rate: newItem.distance_death_rate ? parseFloat(newItem.distance_death_rate) : null,
                total_death: parseInt(newItem.total_death, 10),
                income_level: newItem.income_level,
                traffic_side: newItem.traffic_side
            };

            const res = await fetch('/api/v2/road-fatalities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (res.ok || res.status === 201) {
                setMessage(`El registro para ${data.nation} ha sido creado con éxito.`, 'success');
                // Limpiamos el formulario
                newItem = { nation: '', year: '', population_death_rate: '', vehicle_death_rate: '', distance_death_rate: '', total_death: '', income_level: '', traffic_side: '' };
                showCreateForm = false;
                await listRoadFatalities();
            } else if (res.status === 409) {
                setMessage(`Ya existe un registro de accidentes para el país '${data.nation}' en el año ${data.year}.`, 'error');
            } else if (res.status === 400) {
                setMessage('Faltan campos por rellenar o los datos introducidos no tienen el formato correcto.', 'error');
            } else {
                setMessage('Error desconocido al intentar guardar el registro.', 'error');
            }
        } catch (err) {
            setMessage('Error de red al intentar crear el registro.', 'error');
        }
    }

    // Borrar TODOS los recursos
    async function deleteAllRoadFatalities() {
        if (!confirm("¿Estás completamente seguro de que quieres eliminar TODOS los registros de accidentes?")) return;

        try {
            const res = await fetch('/api/v2/road-fatalities', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (res.ok) {
                setMessage('Todos los registros de accidentes han sido eliminados de la base de datos.', 'success');
                roadFatalities = [];
            } else {
                setMessage('Hubo un problema al intentar vaciar la base de datos.', 'error');
            }
        } catch (err) {
            setMessage('Error de conexión al intentar eliminar todos los datos.', 'error');
        }
    }

    // Borrar un recurso específico
    // @ts-ignore
    async function deleteRoadFatality(nation, year) {
        try {
            const res = await fetch(`/api/v2/road-fatalities/${nation}/${year}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (res.ok) {
                setMessage(`El registro de ${nation} en el año ${year} se ha eliminado correctamente.`, 'success');
                await listRoadFatalities();
            } else if (res.status === 404) {
                setMessage(`No se encontró ningún registro para ${nation} en el año ${year} para eliminar.`, 'error');
            } else {
                setMessage(`Error inesperado al eliminar el registro de ${nation}.`, 'error');
            }
        } catch (err) {
            setMessage('Error de conexión al intentar eliminar el registro.', 'error');
        }
    }

    // Variables para el formulario de borrado específico
    // svelte-ignore non_reactive_update
    let deleteNation = $state('');
    // svelte-ignore non_reactive_update
    let deleteYear = $state('');

    async function handleDeleteSpecific() {
        if (!deleteNation || !deleteYear) {
            setMessage('Por favor, introduce el nombre del país y el año para poder eliminar el registro.', 'error');
            return;
        }
        await deleteRoadFatality(deleteNation.trim(), parseInt(deleteYear, 10));
    }

    // Funciones de busqueda 
    async function searchRoadFatalities() {
        try {
            let url = '/api/v2/road-fatalities';
            const queryParts = [];
            
            if (searchParams.nation && searchParams.nation.trim()) {
                url += `/${encodeURIComponent(searchParams.nation.trim().toLowerCase())}`;
            }

            if (searchParams.year) queryParts.push(`year=${searchParams.year}`);
            if (searchParams.from) queryParts.push(`from=${searchParams.from}`);
            if (searchParams.to) queryParts.push(`to=${searchParams.to}`);
            if (searchParams.income_level) queryParts.push(`income_level=${searchParams.income_level}`);
            if (searchParams.traffic_side) queryParts.push(`traffic_side=${searchParams.traffic_side}`);
            if (searchParams.offset) queryParts.push(`offset=${searchParams.offset}`);
            if (searchParams.limit) queryParts.push(`limit=${searchParams.limit}`);
            
            const query = queryParts.join('&');
            if (query) url += `?${query}`;

            const res = await fetch(url);
            if (res.ok) {
                const results = await res.json();
                roadFatalities = Array.isArray(results) ? results : [results];
                setMessage('Búsqueda realizada con éxito.', 'success');
            } else if (res.status === 404) {
                setMessage('No se encontraron registros con esos criterios.', 'error');
                roadFatalities = [];
            } else {
                setMessage(`Error en la búsqueda. Revisa los parámetros.`, 'error');
            }
        } catch (err) {
            setMessage('Error de conexión al buscar.', 'error');
        }
    }

    async function clearSearch() {
        searchParams = { nation: '', year: '', from: '', to: '', income_level: '', traffic_side: '', offset: '', limit: '' };
        await listRoadFatalities();
    }

    // Sistema de notificaciones
    // @ts-ignore
    function setMessage(text, type) {
        message = { text, type };
        setTimeout(() => message = { text: '', type: '' }, 10000); // 10 segundos para que el usuario pueda leer bien
    }
</script>

<h1>Gestión de Accidentes de Tráfico</h1>

{#if message.text}
    <div class="message {message.type}" data-testid="message">
        {message.text}
    </div>
{/if}

<div class="actions">
    <button onclick={loadInitialData} data-testid="load-initial-data">Cargar Accidentes de Tráfico</button>
    <button onclick={listRoadFatalities} data-testid="list-road-fatalities">Listar Accidentes de Tráfico</button>
    <button onclick={() => showCreateForm = !showCreateForm} data-testid="toggle-create-form">Crear Nuevo Recurso</button>
    <button onclick={deleteAllRoadFatalities} data-testid="delete-all-resources" style="background-color: #991b1b;">Eliminar Todos los Recursos</button>
</div>

<div class="search-container form-container">
    <h2>Buscar Registros</h2>
    <form onsubmit={(e) => { e.preventDefault(); searchRoadFatalities(); }} data-testid="search-form">
        <div class="form-grid">
            <label>País: <input type="text" bind:value={searchParams.nation} data-testid="search-nation" /></label>
            <label>Año (Exacto): <input type="number" bind:value={searchParams.year} data-testid="search-year" /></label>
            <label>Desde (Año): <input type="number" bind:value={searchParams.from} data-testid="search-from" /></label>
            <label>Hasta (Año): <input type="number" bind:value={searchParams.to} data-testid="search-to" /></label>
            <label>Nivel de Ingresos:
                <select bind:value={searchParams.income_level} data-testid="search-income-level">
                    <option value="">Cualquiera</option>
                    <option value="high">Alto</option>
                    <option value="middle">Medio</option>
                    <option value="low">Bajo</option>
                </select>
            </label>
            <label>Lado de Conducción:
                <select bind:value={searchParams.traffic_side} data-testid="search-traffic-side">
                    <option value="">Cualquiera</option>
                    <option value="right">Derecha</option>
                    <option value="left">Izquierda</option>
                </select>
            </label>
            <label>Límite (Paginación): <input type="number" bind:value={searchParams.limit} data-testid="search-limit" /></label>
            <label>Offset: <input type="number" bind:value={searchParams.offset} data-testid="search-offset" /></label>
        </div>
        <div style="margin-top: 1.5rem; display: flex; gap: 10px;">
            <button type="submit" data-testid="search-submit" style="background-color: #059669; color: white;">Buscar</button>
            <button type="button" data-testid="search-clear" onclick={clearSearch} style="background-color: #4b5563; color: white;">Limpiar Búsqueda</button>
        </div>
    </form>
</div>

<div class="delete-specific">
    <h3>Eliminar un registro concreto</h3>
    <div class="delete-form" data-testid="delete-specific-form">
        <input type="text" placeholder="País (ej. spain)" bind:value={deleteNation} data-testid="delete-nation" />
        <input type="number" placeholder="Año" bind:value={deleteYear} data-testid="delete-year" />
        <button onclick={handleDeleteSpecific} data-testid="delete-specific-submit">Eliminar registro</button>
    </div>
</div>

{#if showCreateForm}
    <div class="form-container">
        <h2>Añadir Nuevo Registro de Accidentes</h2>
        <form onsubmit={(e) => { e.preventDefault(); createRoadFatality(); }} data-testid="create-form">
            <div class="form-grid">
                <label>País: <input type="text" placeholder="ej. italy" bind:value={newItem.nation} data-testid="create-nation" required /></label>
                <label>Año: <input type="number" bind:value={newItem.year} data-testid="create-year" required /></label>
                <label>Muertes Totales: <input type="number" bind:value={newItem.total_death} data-testid="create-total-death" required /></label>
                <label>Nivel de Ingresos: 
                    <select bind:value={newItem.income_level} data-testid="create-income-level" required>
                        <option value="" disabled selected>Selecciona nivel</option>
                        <option value="high">Alto</option>
                        <option value="middle">Medio</option>
                        <option value="low">Bajo</option>
                    </select>
                </label>
                <label>Lado de Conducción: 
                    <select bind:value={newItem.traffic_side} data-testid="create-traffic-side" required>
                        <option value="" disabled selected>Selecciona lado</option>
                        <option value="right">Derecha</option>
                        <option value="left">Izquierda</option>
                    </select>
                </label>
                <label>Mortalidad / Población: <input type="number" step="0.1" bind:value={newItem.population_death_rate} data-testid="create-population-death-rate" required /></label>
                <label>Mortalidad / Vehículos: <input type="number" step="0.1" bind:value={newItem.vehicle_death_rate} data-testid="create-vehicle-death-rate" /></label>
                <label>Mortalidad / Distancia: <input type="number" step="0.1" bind:value={newItem.distance_death_rate} data-testid="create-distance-death-rate" /></label>
            </div>
            
            <div style="margin-top: 1.5rem; display: flex; gap: 10px;">
                <button type="submit" data-testid="create-submit">Guardar Datos</button>
                <button type="button" data-testid="create-cancel" onclick={() => showCreateForm = false}>Cancelar</button>
            </div>
        </form>
    </div>
{/if}

{#if roadFatalities.length > 0}
    <h2>Registros Guardados</h2>
    <ul data-testid="road-fatalities-table">
        {#each roadFatalities as record}
            <li data-testid="table-row-{record.nation}-{record.year}">
                <div class="record-info">
                    <strong>{record.nation.toUpperCase()} ({record.year})</strong> - 
                    Total fallecidos: {record.total_death} | 
                    Nivel de ingresos: {record.income_level} | 
                    Conducción por la {record.traffic_side === 'right' ? 'derecha' : 'izquierda'}
                </div>
                <div class="record-actions">
                    <a href="/road-fatalities/{record.nation}/{record.year}" class="btn-edit" data-testid="edit-btn-{record.nation}-{record.year}">
                        Editar
                    </a>
                    <button class="btn-delete" data-testid="delete-btn-{record.nation}-{record.year}" onclick={() => deleteRoadFatality(record.nation, record.year)}>Eliminar</button>
                </div>
            </li>
        {/each}
    </ul>
{/if}

<style>
    /* Estilos - Atom IDE Theme */
    :global(body) {
        margin: 0;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        background: #282c34;
        color: #abb2bf;
    }

    h1, h2 {
        text-align: center;
        margin-top: 1rem;
        color: #61afef;
        text-shadow: none;
        font-weight: 600;
    }

    .message {
        border-radius: 2px;
        padding: 0.8rem 1rem;
        margin: 1rem auto;
        width: min(95%, 1000px);
        font-size: 0.95rem;
        box-shadow: none;
        text-align: center;
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
        border: 1px solid #3e4451;
        border-radius: 2px;
        padding: 0.75rem 1rem;
        font-weight: 600;
        letter-spacing: 0.02em;
        box-shadow: none;
        cursor: pointer;
        transition: background-color 0.2s ease, border-color 0.2s ease;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    }

    .actions button {
        background-color: #3e4451;
        color: #abb2bf;
    }

    .actions button:hover {
        background-color: #4e5561;
        border-color: #61afef;
    }

    .form-container {
        background: #2d3139;
        border: 1px solid #3e4451;
        border-radius: 2px;
        padding: 1.25rem;
        margin: 1rem auto;
        box-shadow: none;
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
        color: #a6acaf;
    }

    .form-container input, .form-container select {
        background: #21252b;
        border: 1px solid #3e4451;
        color: #abb2bf;
        border-radius: 2px;
        padding: 0.6rem 0.8rem;
        transition: border-color 0.2s ease;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    }

    .form-container input:focus, .form-container select:focus {
        outline: none;
        border-color: #61afef;
        box-shadow: none;
    }

    .form-container button[type="submit"] { background-color: #61afef; color: #282c34; }
    .form-container button[type="button"] { background-color: #3e4451; color: #abb2bf; }

    .delete-specific {
        max-width: 1000px;
        width: 95%;
        margin: 1rem auto;
        background: #2d3139;
        border: 1px solid #3e4451;
        border-radius: 2px;
        padding: 1rem;
    }

    .delete-specific h3 { margin: 0 0 0.5rem; color: #61afef; font-weight: 600; }

    .delete-form {
        display: grid;
        grid-template-columns: 1fr 1fr auto;
        gap: 0.6rem;
    }

    .delete-form input {
        border: 1px solid #3e4451;
        border-radius: 2px;
        padding: 0.6rem 0.7rem;
        background: #21252b;
        color: #abb2bf;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    }

    .delete-form button { background-color: #e86671; color: #282c34; }
    .delete-form button:hover { background-color: #d04444; opacity: 0.9; }

    ul {
        max-width: 1000px;
        width: 95%;
        margin: 0.8rem auto 2rem;
        padding: 0;
        list-style: none;
    }

    li {
        border: 1px solid #3e4451;
        background: #2d3139;
        padding: 0.85rem 0.95rem;
        border-radius: 2px;
        margin-top: 0.6rem;
        color: #abb2bf;
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

    .btn-edit, .btn-delete {
        border: 1px solid #3e4451;
        border-radius: 2px;
        padding: 0.6rem 1rem;
        font-weight: 600;
        letter-spacing: 0.02em;
        box-shadow: none;
        cursor: pointer;
        transition: background-color 0.2s ease;
        text-decoration: none;
        font-size: 0.9rem;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    }

    .btn-edit {
        background-color: #61afef;
        color: #282c34;
    }
    
    .btn-edit:hover { background-color: #4fa3e0; }

    .btn-delete {
        background-color: #e86671;
        color: #282c34;
    }

    .btn-delete:hover { background-color: #d04444; }

    @media (max-width: 640px) {
        .delete-form { grid-template-columns: 1fr; }
        li { flex-direction: column; align-items: stretch; text-align: center; }
        .record-actions { flex-direction: column; }
        .btn-edit, .btn-delete { width: 100%; text-align: center; box-sizing: border-box; }
    }
</style>