<script>
// @ts-nocheck

    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    // Variables con $state para reactividad en Svelte 5
    let alcoholData = $state([]);
    let message = $state({ text: '', type: '' }); 
    let showCreateForm = $state(false);
    let newItem = $state({ nation: '', date_year: '', alcohol_litre: '', recorded_consumption: '', unrecorded_consumption: '' });

    // Variables de búsqueda
    let searchParams = $state({ nation: '', date_year: '', from: '', to: '', alcohol_litre: '', recorded_consumption: '', unrecorded_consumption: '', offset: '', limit: '' });

    // Carga inicial
    async function loadInitialData() {
        try {
            const res = await fetch('/api/v2/alcohol-consumptions-per-capita/loadInitialData', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                setMessage('Datos iniciales cargados.', 'success');
                await listAlcoholData();
            } else if (res.status === 400 || res.status === 409) {
                setMessage('Ya existen datos iniciales en el servidor.', 'success');
                await listAlcoholData();
            } else {
                const error = await res.json();
                setMessage(`Error al cargar datos iniciales: ${error.error}`, 'error');
            }
        } catch (err) {
            setMessage('Error de conexión al cargar datos iniciales.', 'error');
        }
    }

    // Listar todos los datos
    async function listAlcoholData() {
        try {
            const res = await fetch('/api/v2/alcohol-consumptions-per-capita', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                alcoholData = await res.json();
                setMessage('Datos listados exitosamente.', 'success');
            } else {
                const error = await res.json();
                setMessage(`Error al listar datos: ${error.error}`, 'error');
            }
        } catch (err) {
            setMessage('Error de conexión al listar datos.', 'error');
        }
    }

    onMount(async () => {
        await listAlcoholData();
    });

    // Crear recurso nuevo
    // @ts-ignore
    async function createAlcoholData(e) {
        if (e) e.preventDefault();
        try {
            const data = {
                nation: newItem.nation,
                date_year: parseInt(newItem.date_year),
                alcohol_litre: parseFloat(newItem.alcohol_litre),
                recorded_consumption: parseFloat(newItem.recorded_consumption),
                unrecorded_consumption: parseFloat(newItem.unrecorded_consumption)
            };
            const res = await fetch('/api/v2/alcohol-consumptions-per-capita', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok || res.status === 201) {
                setMessage('Recurso creado exitosamente.', 'success');
                newItem = { nation: '', date_year: '', alcohol_litre: '', recorded_consumption: '', unrecorded_consumption: '' };
                showCreateForm = false;
                await listAlcoholData();
            } else {
                const error = await res.json();
                setMessage(`Error al crear recurso: ${error.error || 'Ya existe'}`, 'error');
            }
        } catch (err) {
            setMessage('Error de conexión al crear recurso.', 'error');
        }
    }

    // Eliminar todos los recursos
    async function deleteAllAlcoholData() {
        try {
            const res = await fetch('/api/v2/alcohol-consumptions-per-capita', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                setMessage('Todos los recursos han sido eliminados.', 'success');
                alcoholData = [];
            } else {
                const error = await res.json();
                setMessage(`Error al eliminar recursos: ${error.error}`, 'error');
            }
        } catch (err) {
            setMessage('Error de conexión al eliminar recursos.', 'error');
        }
    }

    // Eliminar recurso específico
    // @ts-ignore
    async function deleteAlcoholData(nation, year) {
        try {
            const res = await fetch(`/api/v2/alcohol-consumptions-per-capita/${nation}/${year}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                setMessage('Recurso eliminado exitosamente.', 'success');
                await listAlcoholData();
            } else {
                const error = await res.json();
                setMessage(`Error al eliminar recurso: ${error.error}`, 'error');
            }
        } catch (err) {
            setMessage('Error de conexión al eliminar recurso.', 'error');
        }
    }

    let deleteNation = $state('');
    let deleteYear = $state('');

    async function handleDeleteSpecific() {
        if (!deleteNation || !deleteYear) {
            setMessage('Debes introducir país y año para borrar.', 'error');
            return;
        }
        await deleteAlcoholData(deleteNation.trim(), parseInt(deleteYear, 10));
    }

    // Búsqueda dinámica con filtros
    // async function searchAlcoholData() {
    //     try {
    //         let url = '/api/v2/alcohol-consumptions-per-capita';
    //         let results = [];

    //         if (searchParams.nation && searchParams.nation.trim()) {
    //             const nation = encodeURIComponent(searchParams.nation.trim());
    //             const queryParts = [];
                
    //             if (searchParams.date_year) queryParts.push(`date_year=${searchParams.date_year}`);
    //             if (searchParams.from) queryParts.push(`from=${searchParams.from}`);
    //             if (searchParams.to) queryParts.push(`to=${searchParams.to}`);
    //             if (searchParams.offset) queryParts.push(`offset=${searchParams.offset}`);
    //             if (searchParams.limit) queryParts.push(`limit=${searchParams.limit}`);
                
    //             const query = queryParts.join('&');
    //             url = `/api/v2/alcohol-consumptions-per-capita/${nation}${query ? '?' + query : ''}`;
    //         } else {
    //             const queryParts = [];
    //             if (searchParams.date_year) queryParts.push(`date_year=${searchParams.date_year}`);
    //             // No incluir from/to en búsqueda sin nación - se filtran en frontend
    //             if (searchParams.alcohol_litre) queryParts.push(`alcohol_litre=${searchParams.alcohol_litre}`);
    //             if (searchParams.recorded_consumption) queryParts.push(`recorded_consumption=${searchParams.recorded_consumption}`);
    //             if (searchParams.unrecorded_consumption) queryParts.push(`unrecorded_consumption=${searchParams.unrecorded_consumption}`);
    //             if (searchParams.offset) queryParts.push(`offset=${searchParams.offset}`);
    //             if (searchParams.limit) queryParts.push(`limit=${searchParams.limit}`);
                
    //             const query = queryParts.join('&');
    //             url = `/api/v2/alcohol-consumptions-per-capita${query ? '?' + query : ''}`;
    //         }

    //         const res = await fetch(url);
            
    //         if (res.ok) {
    //             results = await res.json();
                
    //             // Filtrado local para rangos de fechas si no se especifica país (igual que JFM)
    //             if (!searchParams.nation && (searchParams.from || searchParams.to)) {
    //                 // @ts-ignore
    //                 results = results.filter(item => {
    //                     if (searchParams.from && item.date_year < parseInt(searchParams.from)) return false;
    //                     if (searchParams.to && item.date_year > parseInt(searchParams.to)) return false;
    //                     return true;
    //                 });
    //             }
                
    //             alcoholData = results;
    //             if(alcoholData.length > 0) {
    //                 setMessage('Búsqueda realizada exitosamente.', 'success');
    //             } else {
    //                 setMessage('No se encontraron datos para esa búsqueda.', 'error');
    //             }
    //         } else {
    //             const error = await res.json();
    //             setMessage(`Error en la búsqueda: ${error.error || 'No encontrado'}`, 'error');
    //             alcoholData = [];
    //         }
    //     } catch (err) {
    //         setMessage('Error de conexión al buscar.', 'error');
    //     }
    // }
    // Búsqueda dinámica con filtros
    async function searchAlcoholData() {
        try {
            let url = '/api/v2/alcohol-consumptions-per-capita';
            let results = [];
            const queryParts = [];

            // Añadimos TODOS los parámetros a la lista de búsqueda
            if (searchParams.nation && searchParams.nation.trim()) queryParts.push(`nation=${encodeURIComponent(searchParams.nation.trim())}`);
            if (searchParams.date_year) queryParts.push(`date_year=${searchParams.date_year}`);
            if (searchParams.from) queryParts.push(`from=${searchParams.from}`);
            if (searchParams.to) queryParts.push(`to=${searchParams.to}`);
            if (searchParams.alcohol_litre) queryParts.push(`alcohol_litre=${searchParams.alcohol_litre}`);
            if (searchParams.recorded_consumption) queryParts.push(`recorded_consumption=${searchParams.recorded_consumption}`);
            if (searchParams.unrecorded_consumption) queryParts.push(`unrecorded_consumption=${searchParams.unrecorded_consumption}`);
            if (searchParams.offset) queryParts.push(`offset=${searchParams.offset}`);
            if (searchParams.limit) queryParts.push(`limit=${searchParams.limit}`);
            
            // Unimos todo con el símbolo '&'
            const query = queryParts.join('&');
            if (query) {
                url += '?' + query;
            }

            const res = await fetch(url);
            
            if (res.ok) {
                results = await res.json();
                
                // Filtrado local para rangos de fechas (ya que la API base no lo soporta de forma nativa)
                if (searchParams.from || searchParams.to) {
                    results = results.filter(item => {
                        if (searchParams.from && item.date_year < parseInt(searchParams.from)) return false;
                        if (searchParams.to && item.date_year > parseInt(searchParams.to)) return false;
                        return true;
                    });
                }
                
                alcoholData = results;
                if(alcoholData.length > 0) {
                    setMessage('Búsqueda realizada exitosamente.', 'success');
                } else {
                    setMessage('No se encontraron datos para esa búsqueda.', 'error');
                }
            } else {
                // Atrapamos el error de forma segura por si devuelve un HTML en lugar de un JSON
                const text = await res.text();
                try {
                    const error = JSON.parse(text);
                    setMessage(`Error en la búsqueda: ${error.error || 'No encontrado'}`, 'error');
                } catch {
                    setMessage('Error en la búsqueda: No se encontró el recurso.', 'error');
                }
                alcoholData = [];
            }
        } catch (err) {
            setMessage('Error de conexión al buscar.', 'error');
        }
    }

    async function clearSearch() {
        searchParams = { nation: '', date_year: '', from: '', to: '', alcohol_litre: '', recorded_consumption: '', unrecorded_consumption: '', offset: '', limit: '' };
        await listAlcoholData();
    }

    // @ts-ignore
    function setMessage(text, type) {
        message = { text, type };
        setTimeout(() => message = { text: '', type: '' }, 5000);
    }
</script>

<h1>Gestión de Consumo de Alcohol per Cápita</h1>

{#if message.text}
    <div class="message {message.type}" data-testid="message">
        {message.text}
    </div>
{/if}

<div class="actions">
    <button onclick={loadInitialData} data-testid="load-initial-data">Cargar Datos de Alcohol</button>
    <button onclick={listAlcoholData} data-testid="list-alcohol-data">Listar Datos de Alcohol</button>
    <button onclick={() => showCreateForm = !showCreateForm} data-testid="toggle-create-form">Crear Nuevo Recurso</button>
    <button onclick={deleteAllAlcoholData} data-testid="delete-all-resources">Eliminar Todos los Recursos</button>
</div>

<div class="search-container">
    <h3>Buscar Recursos</h3>
    <form onsubmit={(e) => { e.preventDefault(); searchAlcoholData(); }} data-testid="search-form">
        <div class="search-grid">
            <label> País: <input type="text" bind:value={searchParams.nation} data-testid="search-nation" /> </label>
            <label> Año: <input type="number" bind:value={searchParams.date_year} data-testid="search-year" /> </label>
            <label> Desde (año): <input type="number" bind:value={searchParams.from} data-testid="search-from" /> </label>
            <label> Hasta (año): <input type="number" bind:value={searchParams.to} data-testid="search-to" /> </label>
            <label> Litros Totales: <input type="number" step="0.1" bind:value={searchParams.alcohol_litre} data-testid="search-litre" /> </label>
            <label> C. Registrado: <input type="number" step="0.1" bind:value={searchParams.recorded_consumption} data-testid="search-recorded" /> </label>
            <label> C. No Registrado: <input type="number" step="0.1" bind:value={searchParams.unrecorded_consumption} data-testid="search-unrecorded" /> </label>
            <label> Offset: <input type="number" bind:value={searchParams.offset} data-testid="search-offset" /> </label>
            <label> Limit: <input type="number" bind:value={searchParams.limit} data-testid="search-limit" /> </label>
        </div>
        <div class="search-buttons">
            <button type="submit" data-testid="search-submit">Buscar</button>
            <button type="button" onclick={clearSearch} data-testid="search-clear">Limpiar Búsqueda</button>
        </div>
    </form>
</div>

<div class="delete-specific">
    <h3>Eliminar recurso específico</h3>
    <div class="delete-form">
        <input placeholder="País (Nation)" bind:value={deleteNation} data-testid="delete-country" />
        <input type="number" placeholder="Año" bind:value={deleteYear} data-testid="delete-year" />
        <button onclick={handleDeleteSpecific} data-testid="delete-specific-submit">Eliminar recurso</button>
    </div>
</div>

{#if showCreateForm}
    <div class="form-container">
        <h2>Crear Nuevo Recurso</h2>
        <form onsubmit={(e) => { e.preventDefault(); createAlcoholData(e); }} data-testid="create-form">
            <label> País: <input type="text" bind:value={newItem.nation} data-testid="create-nation" required /> </label>
            <label> Año: <input type="number" bind:value={newItem.date_year} data-testid="create-year" required /> </label>
            <label> Litros de Alcohol: <input type="number" step="0.1" bind:value={newItem.alcohol_litre} data-testid="create-litre" required /> </label>
            <label> Consumo Registrado: <input type="number" step="0.1" bind:value={newItem.recorded_consumption} data-testid="create-recorded" required /> </label>
            <label> Consumo No Registrado: <input type="number" step="0.1" bind:value={newItem.unrecorded_consumption} data-testid="create-unrecorded" required /> </label>
            <button type="submit" data-testid="create-submit">Crear</button>
            <button type="button" onclick={() => showCreateForm = false}>Cancelar</button>
        </form>
    </div>
{/if}

{#if alcoholData.length > 0}
    <h2>Lista de Consumo de Alcohol</h2>
    <ul data-testid="alcohol-rates-list">
        {#each alcoholData as item}
            <li data-testid="list-row-{item.nation}-{item.date_year}">
                <strong>{item.nation} ({item.date_year})</strong>: Litros Totales {item.alcohol_litre}, Registrado {item.recorded_consumption}, No Registrado {item.unrecorded_consumption}
                
                <div style="display: inline-block; margin-left: 1rem;">
                    <button style="background-color: #f59e0b; color: white;" onclick={() => goto(`/alcohol-consumptions-per-capita/${encodeURIComponent(item.nation)}/${item.date_year}`)} data-testid="edit-btn-{item.nation}-{item.date_year}">Editar</button>
                    <button style="background-color: #ef4444; color: white;" onclick={() => deleteAlcoholData(item.nation, item.date_year)}>Eliminar</button>
                </div>
            </li>
        {/each}
    </ul>
{/if}

<style>
    :global(body) { margin: 0; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; background: #282c34; color: #abb2bf; }
    h1 { text-align: center; margin-top: 1rem; color: #61afef; text-shadow: none; font-weight: 600; }
    h2, h3 { color: #61afef; font-weight: 600; }
    
    .message { border-radius: 2px; padding: 0.8rem 1rem; margin: 1rem auto; width: min(95%, 1000px); font-size: 0.95rem; box-shadow: none; }
    .message.success { background: #2d5016; border: 1px solid #56b6c2; color: #98c379; }
    .message.error { background: #4c1414; border: 1px solid #e86671; color: #e86671; }
    
    .actions { margin: 1.5rem auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.8rem; max-width: 1000px; width: 95%; }
    .actions button, .form-container button, li button, .search-buttons button { border: 1px solid #3e4451; border-radius: 2px; padding: 0.75rem 1rem; font-weight: 600; cursor: pointer; transition: background-color 0.2s ease; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; }
    .actions button { background-color: #3e4451; color: #abb2bf; }
    .actions button:hover { background-color: #4e5561; border-color: #61afef; }
    
    .form-container, .search-container { background: #2d3139; border: 1px solid #3e4451; border-radius: 2px; padding: 1.25rem; margin: 1rem auto; max-width: 1000px; width: 95%; }
    .form-container label, .search-grid label { display: flex; flex-direction: column; gap: 0.4rem; margin: 0.7rem 0; color: #a6acaf; }
    .form-container input, .search-grid input { background: #21252b; border: 1px solid #3e4451; color: #abb2bf; border-radius: 2px; padding: 0.6rem 0.8rem; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; }
    .form-container button { background-color: #61afef; color: #282c34; margin-top: 0.8rem; }
    .form-container button[type="button"] { background-color: #3e4451; color: #abb2bf; }
    
    .search-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.6rem; }
    .search-buttons { display: flex; gap: 0.8rem; margin-top: 1rem; }
    .search-buttons button[type="submit"] { background-color: #98c379; color: #282c34; }
    .search-buttons button[type="button"] { background-color: #3e4451; color: #abb2bf; }

    .delete-specific { max-width: 1000px; width: 95%; margin: 1rem auto; background: #2d3139; border: 1px solid #3e4451; border-radius: 2px; padding: 1rem; }
    .delete-specific h3 { color: #61afef; }
    .delete-form { display: grid; grid-template-columns: 1fr 1fr auto; gap: 0.6rem; }
    .delete-form input { border: 1px solid #3e4451; border-radius: 2px; padding: 0.6rem 0.7rem; background: #21252b; color: #abb2bf; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; }
    .delete-form button { background-color: #e86671; color: #282c34; border: none; border-radius: 2px; padding: 0.7rem; font-weight: 600; cursor: pointer; }
    .delete-form button:hover { background-color: #d04444; opacity: 0.9; }

    ul { max-width: 1000px; width: 95%; margin: 0.8rem auto 2rem; padding: 0; list-style: none; }
    li { border: 1px solid #3e4451; background: #2d3139; padding: 0.85rem 0.95rem; border-radius: 2px; margin-top: 0.6rem; color: #abb2bf; display: flex; justify-content: space-between; align-items: center; gap: 0.8rem; }
    li button { padding: 0.5rem 0.8rem; font-size: 0.85rem; margin-left: 0.3rem; background-color: #e5c07b; color: #282c34; border: none; border-radius: 2px; font-weight: 600; }
    li button:hover { background-color: #d4ae4f; }

    @media (max-width: 640px) {
        .form-container, .actions, ul, .search-container { width: 98%; }
        li { flex-direction: column; align-items: stretch; }
        li div { margin-left: 0 !important; display: flex; gap: 0.5rem; margin-top: 0.5rem; }
        li button { width: 100%; margin: 0; }
        .search-grid { grid-template-columns: 1fr 1fr; }
        .search-buttons { flex-direction: column; }
    }
</style>