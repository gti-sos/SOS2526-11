<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    // @ts-ignore
    let literacyRates = $state([]);
    let message = $state({ text: '', type: '' }); // type: 'success' or 'error'
    let showCreateForm = $state(false);
    let newItem = $state({ country: '', year: '', total: '', male: '', female: '', gender_gap: '' });

    // Búsqueda
    let searchParams = $state({ country: '', year: '', from: '', to: '', total: '', male: '', female: '', gender_gap: '', offset: '', limit: '' });

    // Carga inicial - para poblar si la DB está vacía
    async function loadInitialData() {
        try {
            const res = await fetch('/api/v2/literacy-rates/loadInitialData', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (res.ok) {
                setMessage('Datos iniciales cargados.', 'success');
                await listLiteracyRates();
            } else if (res.status === 400) {
                setMessage('Ya existen datos iniciales en el servidor.', 'success');
                await listLiteracyRates();
            } else {
                const error = await res.json();
                setMessage(`Error al cargar datos iniciales: ${error.error}`, 'error');
            }
        } catch (err) {
            setMessage('Error de conexión al cargar datos iniciales.', 'error');
        }
    }

    async function listLiteracyRates(params = {}) {
        try {
            const query = new URLSearchParams(params).toString();
            const url = query ? `/api/v2/literacy-rates?${query}` : '/api/v2/literacy-rates';
            const res = await fetch(url);
            if (res.ok) {
                literacyRates = await res.json();
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
        await loadInitialData();
    });

    async function createLiteracyRate() {
        try {
            const data = {
                country: newItem.country,
                year: parseInt(newItem.year),
                total: parseFloat(newItem.total),
                male: parseFloat(newItem.male),
                female: parseFloat(newItem.female),
                gender_gap: parseFloat(newItem.gender_gap)
            };
            const res = await fetch('/api/v2/literacy-rates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                setMessage('Recurso creado exitosamente.', 'success');
                newItem = { country: '', year: '', total: '', male: '', female: '', gender_gap: '' };
                showCreateForm = false;
                await listLiteracyRates();
            } else {
                const error = await res.json();
                setMessage(`Error al crear recurso: ${error.error}`, 'error');
            }
        } catch (err) {
            setMessage('Error de conexión al crear recurso.', 'error');
        }
    }

    async function deleteAllLiteracyRates() {
        try {
            const res = await fetch('/api/v2/literacy-rates', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (res.ok) {
                setMessage('Todos los recursos han sido eliminados.', 'success');
                literacyRates = [];
            } else {
                const error = await res.json();
                setMessage(`Error al eliminar recursos: ${error.error}`, 'error');
            }
        } catch (err) {
            setMessage('Error de conexión al eliminar recursos.', 'error');
        }
    }

    // @ts-ignore
    async function deleteLiteracyRate(country, year) {
        try {
            const res = await fetch(`/api/v2/literacy-rates/${country}/${year}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (res.ok) {
                setMessage('Recurso eliminado exitosamente.', 'success');
                await listLiteracyRates();
            } else {
                const error = await res.json();
                setMessage(`Error al eliminar recurso: ${error.error}`, 'error');
            }
        } catch (err) {
            setMessage('Error de conexión al eliminar recurso.', 'error');
        }
    }

    // svelte-ignore non_reactive_update
        let deleteCountry = $state('');
    // svelte-ignore non_reactive_update
        let deleteYear = $state('');

    async function handleDeleteSpecific() {
        if (!deleteCountry || !deleteYear) {
            setMessage('Debes introducir país y año para borrar.', 'error');
            return;
        }

        await deleteLiteracyRate(deleteCountry.trim(), parseInt(deleteYear, 10));
    }

    async function searchLiteracyRates() {
        try {
            let url = '/api/v2/literacy-rates';
            let results = [];

            // Si se especifica país
            if (searchParams.country && searchParams.country.trim()) {
                const country = encodeURIComponent(searchParams.country.trim());
                const queryParts = [];
                
                if (searchParams.year) queryParts.push(`year=${searchParams.year}`);
                if (searchParams.from) queryParts.push(`from=${searchParams.from}`);
                if (searchParams.to) queryParts.push(`to=${searchParams.to}`);
                if (searchParams.offset) queryParts.push(`offset=${searchParams.offset}`);
                if (searchParams.limit) queryParts.push(`limit=${searchParams.limit}`);
                
                const query = queryParts.join('&');
                url = `/api/v2/literacy-rates/${country}${query ? '?' + query : ''}`;
            } else {
                // Sin país: obtiene todos y filtra en frontend
                const queryParts = [];
                if (searchParams.year) queryParts.push(`year=${searchParams.year}`);
                if (searchParams.total) queryParts.push(`total=${searchParams.total}`);
                if (searchParams.male) queryParts.push(`male=${searchParams.male}`);
                if (searchParams.female) queryParts.push(`female=${searchParams.female}`);
                if (searchParams.gender_gap) queryParts.push(`gender_gap=${searchParams.gender_gap}`);
                if (searchParams.offset) queryParts.push(`offset=${searchParams.offset}`);
                if (searchParams.limit) queryParts.push(`limit=${searchParams.limit}`);
                
                const query = queryParts.join('&');
                url = `/api/v2/literacy-rates${query ? '?' + query : ''}`;
            }

            const res = await fetch(url);
            if (res.ok) {
                results = await res.json();
                
                // Filtrar por rango de años en frontend si no hay país
                if (!searchParams.country && (searchParams.from || searchParams.to)) {
                    // @ts-ignore
                    results = results.filter(rate => {
                        if (searchParams.from && rate.year < parseInt(searchParams.from)) return false;
                        if (searchParams.to && rate.year > parseInt(searchParams.to)) return false;
                        return true;
                    });
                }
                
                literacyRates = results;
                setMessage('Búsqueda realizada exitosamente.', 'success');
            } else {
                const error = await res.json();
                setMessage(`Error en la búsqueda: ${error.error}`, 'error');
            }
        } catch (err) {
            setMessage('Error de conexión.', 'error');
        }
    }

    async function clearSearch() {
        searchParams = { country: '', year: '', from: '', to: '', total: '', male: '', female: '', gender_gap: '', offset: '', limit: '' };
        await listLiteracyRates();
    }

    // @ts-ignore
    function setMessage(text, type) {
        message = { text, type };
        setTimeout(() => message = { text: '', type: '' }, 10000); // Increased to 10 seconds
    }
</script>

<!-- HTML -->
<!-- HTML -->
<!-- HTML -->
<!-- HTML -->

<h1>Gestión de Tasas de Alfabetización</h1>

{#if message.text}
    <div class="message {message.type}" data-testid="message">
        {message.text}
    </div>
{/if}

<div class="actions">
    <button onclick={loadInitialData} data-testid="load-initial-data">Cargar Tasas de Alfabetización</button>
    <button onclick={listLiteracyRates} data-testid="list-literacy-rates">Listar Tasas de Alfabetización</button>
    <button onclick={() => showCreateForm = !showCreateForm} data-testid="toggle-create-form">Crear Nuevo Recurso</button>
    <button onclick={deleteAllLiteracyRates} data-testid="delete-all-resources">Eliminar Todos los Recursos</button>
</div>

<div class="search-container">
    <h3>Buscar Recursos</h3>
    <form onsubmit={(e) => { e.preventDefault(); searchLiteracyRates(); }} data-testid="search-form">
        <div class="search-grid">
            <label>
                País: <input type="text" bind:value={searchParams.country} data-testid="search-country" />
            </label>
            <label>
                Año: <input type="number" bind:value={searchParams.year} data-testid="search-year" />
            </label>
            <label>
                Desde (año): <input type="number" bind:value={searchParams.from} data-testid="search-from" />
            </label>
            <label>
                Hasta (año): <input type="number" bind:value={searchParams.to} data-testid="search-to" />
            </label>
            <label>
                Total (%): <input type="number" step="0.1" bind:value={searchParams.total} data-testid="search-total" />
            </label>
            <label>
                Hombres (%): <input type="number" step="0.1" bind:value={searchParams.male} data-testid="search-male" />
            </label>
            <label>
                Mujeres (%): <input type="number" step="0.1" bind:value={searchParams.female} data-testid="search-female" />
            </label>
            <label>
                Brecha de Género (%): <input type="number" step="0.1" bind:value={searchParams.gender_gap} data-testid="search-gender-gap" />
            </label>
            <label>
                Offset: <input type="number" bind:value={searchParams.offset} data-testid="search-offset" />
            </label>
            <label>
                Limit: <input type="number" bind:value={searchParams.limit} data-testid="search-limit" />
            </label>
        </div>
        <div class="search-buttons">
            <button type="submit" data-testid="search-submit">Buscar</button>
            <button type="button" onclick={clearSearch} data-testid="search-clear">Limpiar Búsqueda</button>
        </div>
    </form>
</div>

<div class="delete-specific">
    <h3>Eliminar recurso específico</h3>
    <div class="delete-form" data-testid="delete-specific-form">
        <input placeholder="País" bind:value={deleteCountry} data-testid="delete-country" />
        <input type="number" placeholder="Año" bind:value={deleteYear} data-testid="delete-year" />
        <button onclick={handleDeleteSpecific} data-testid="delete-specific-submit">Eliminar recurso</button>
    </div>
</div>

{#if showCreateForm}
    <div class="form-container">
        <h2>Crear Nuevo Recurso</h2>
        <form onsubmit={(e) => { e.preventDefault(); createLiteracyRate(); }} data-testid="create-form">
            <label>
                País: <input type="text" bind:value={newItem.country} data-testid="create-country" required />
            </label>
            <label>
                Año: <input type="number" bind:value={newItem.year} data-testid="create-year" required />
            </label>
            <label>
                Total: <input type="number" step="0.1" bind:value={newItem.total} data-testid="create-total" required />
            </label>
            <label>
                Hombres: <input type="number" step="0.1" bind:value={newItem.male} data-testid="create-male" required />
            </label>
            <label>
                Mujeres: <input type="number" step="0.1" bind:value={newItem.female} data-testid="create-female" required />
            </label>
            <label>
                Brecha de Género: <input type="number" step="0.1" bind:value={newItem.gender_gap} data-testid="create-gender-gap" required />
            </label>
            <button type="submit" data-testid="create-submit">Crear</button>
            <button type="button" onclick={() => showCreateForm = false} data-testid="create-cancel">Cancelar</button>
        </form>
    </div>
{/if}
<h2>Lista de Tasas de Alfabetización</h2>
{#if literacyRates.length > 0}
    
    <table data-testid="literacy-rates-table">
        <thead>
            <tr>
                <th>País</th>
                <th>Año</th>
                <th>Total (%)</th>
                <th>Hombres (%)</th>
                <th>Mujeres (%)</th>
                <th>Brecha de Género (%)</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody>
            {#each literacyRates as rate}
                <tr data-testid="table-row-{rate.country}-{rate.year}">
                    <td>{rate.country}</td>
                    <td>{rate.year}</td>
                    <td>{rate.total}</td>
                    <td>{rate.male}</td>
                    <td>{rate.female}</td>
                    <td>{rate.gender_gap}</td>
                    <td>
                        <button onclick={() => goto(`/literacy-rates/${encodeURIComponent(rate.country)}/${rate.year}`)} data-testid="edit-btn-{rate.country}-{rate.year}">Editar</button>
                        <button onclick={() => deleteLiteracyRate(rate.country, rate.year)} data-testid="delete-btn-{rate.country}-{rate.year}">Eliminar</button>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
{/if}

<!-- CSS -->
<!-- CSS -->
<!-- CSS -->
<!-- CSS -->
<style>
    :global(body) {
        margin: 0;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        background: #282c34;
        color: #abb2bf;
    }

    h1 {
        text-align: center;
        margin-top: 1rem;
        color: #61afef;
        text-shadow: none;
        font-weight: 600;
    }

    h2 {
        text-align: center;
        color: #61afef;
        margin-top: 1.5rem;
        font-weight: 600;
    }

    .message {
        border-radius: 2px;
        padding: 0.8rem 1rem;
        margin: 1rem auto;
        width: min(95%, 1000px);
        font-size: 0.95rem;
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

    .actions {
        margin: 1.5rem auto;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 0.8rem;
        max-width: 1000px;
        width: 95%;
    }

    .actions button,
    .form-container button {
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

    .form-container h2 {
        margin: 0 0 1rem;
        color: #61afef;
        font-weight: 600;
    }

    .form-container label {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        margin: 0.7rem 0;
        color: #a6acaf;
    }

    .form-container input {
        background: #21252b;
        border: 1px solid #3e4451;
        color: #abb2bf;
        border-radius: 2px;
        padding: 0.6rem 0.8rem;
        transition: border-color 0.2s ease;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    }

    .form-container input:focus {
        outline: none;
        border-color: #61afef;
        box-shadow: none;
    }

    .form-container button {
        background-color: #61afef;
        color: #282c34;
        margin-top: 0.8rem;
        font-weight: 600;
    }

    .form-container button[type="button"] {
        background-color: #3e4451;
        color: #abb2bf;
    }

    .form-container button:hover {
        opacity: 0.9;
    }

    .delete-specific {
        max-width: 1000px;
        width: 95%;
        margin: 1rem auto;
        background: #2d3139;
        border: 1px solid #3e4451;
        border-radius: 2px;
        padding: 1rem;
    }

    .delete-specific h3 {
        margin: 0 0 0.5rem;
        color: #61afef;
        font-weight: 600;
    }

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

    .delete-form button {
        background-color: #e86671;
        color: #282c34;
        border: none;
        border-radius: 2px;
        padding: 0.7rem;
        font-weight: 600;
        cursor: pointer;
    }

    .delete-form button:hover {
        background-color: #d04444;
        opacity: 0.9;
    }

    .search-container {
        max-width: 1000px;
        width: 95%;
        margin: 1rem auto;
        background: #2d3139;
        border: 1px solid #3e4451;
        border-radius: 2px;
        padding: 1rem;
    }

    .search-container h3 {
        margin: 0 0 0.5rem;
        color: #61afef;
        font-weight: 600;
    }

    .search-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 0.8rem;
    }

    .search-grid label {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        color: #a6acaf;
    }

    .search-grid input {
        border: 1px solid #3e4451;
        border-radius: 2px;
        padding: 0.6rem 0.7rem;
        background: #21252b;
        color: #abb2bf;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    }

    .search-buttons {
        display: flex;
        gap: 0.8rem;
        margin-top: 1rem;
    }

    .search-buttons button {
        background-color: #98c379;
        color: #282c34;
        border: none;
        border-radius: 2px;
        padding: 0.7rem;
        font-weight: 600;
        cursor: pointer;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    }

    .search-buttons button:hover {
        background-color: #7a9c5f;
        opacity: 0.9;
    }

    .search-buttons button[type="button"] {
        background-color: #3e4451;
        color: #abb2bf;
    }

    .search-buttons button[type="button"]:hover {
        background-color: #4e5561;
    }

    table {
        max-width: 1000px;
        width: 95%;
        margin: 0.8rem auto 2rem;
        border-collapse: collapse;
        background: #2d3139;
        border-radius: 2px;
        overflow: hidden;
        box-shadow: none;
        border: 1px solid #3e4451;
    }

    th, td {
        padding: 0.85rem 0.95rem;
        text-align: left;
        color: #abb2bf;
    }

    th {
        background: #21252b;
        font-weight: 600;
        border-bottom: 1px solid #3e4451;
        color: #61afef;
    }

    td {
        border-bottom: 1px solid #3e4451;
    }

    tr:last-child td {
        border-bottom: none;
    }

    td button {
        margin-right: 0.5rem;
        padding: 0.5rem 0.8rem;
        font-size: 0.85rem;
        font-weight: 600;
        border: 1px solid #3e4451;
        border-radius: 2px;
        cursor: pointer;
        transition: background-color 0.2s ease;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    }

    td button:first-child {
        background-color: #61afef;
        color: #282c34;
    }

    td button:first-child:hover {
        background-color: #4fa3e0;
        opacity: 0.9;
    }

    td button:last-child {
        background-color: #e86671;
        color: #282c34;
    }

    td button:last-child:hover {
        background-color: #d04444;
        opacity: 0.9;
    }

    @media (max-width: 640px) {
        .form-container,
        .actions,
        table,
        .search-container {
            width: 98%;
        }

        .search-grid {
            grid-template-columns: 1fr;
        }

        .search-buttons {
            flex-direction: column;
        }

        table {
            font-size: 0.9rem;
        }

        th, td {
            padding: 0.6rem 0.7rem;
        }
    }
</style>