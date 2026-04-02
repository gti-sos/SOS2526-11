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
        await listLiteracyRates();
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
        let deleteCountry = '';
    // svelte-ignore non_reactive_update
        let deleteYear = '';

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

<h1>Gestión de Tasas de Alfabetización</h1>

{#if message.text}
    <div class="message {message.type}">
        {message.text}
    </div>
{/if}

<div class="actions">
    <button onclick={loadInitialData}>Cargar Tasas de Alfabetización</button>
    <button onclick={listLiteracyRates}>Listar Tasas de Alfabetización</button>
    <button onclick={() => showCreateForm = !showCreateForm}>Crear Nuevo Recurso</button>
    <button onclick={deleteAllLiteracyRates}>Eliminar Todos los Recursos</button>
</div>

<div class="search-container">
    <h3>Buscar Recursos</h3>
    <form onsubmit={(e) => { e.preventDefault(); searchLiteracyRates(); }}>
        <div class="search-grid">
            <label>
                País: <input type="text" bind:value={searchParams.country} />
            </label>
            <label>
                Año: <input type="number" bind:value={searchParams.year} />
            </label>
            <label>
                Desde (año): <input type="number" bind:value={searchParams.from} />
            </label>
            <label>
                Hasta (año): <input type="number" bind:value={searchParams.to} />
            </label>
            <label>
                Total (%): <input type="number" step="0.1" bind:value={searchParams.total} />
            </label>
            <label>
                Hombres (%): <input type="number" step="0.1" bind:value={searchParams.male} />
            </label>
            <label>
                Mujeres (%): <input type="number" step="0.1" bind:value={searchParams.female} />
            </label>
            <label>
                Brecha de Género (%): <input type="number" step="0.1" bind:value={searchParams.gender_gap} />
            </label>
            <label>
                Offset: <input type="number" bind:value={searchParams.offset} />
            </label>
            <label>
                Limit: <input type="number" bind:value={searchParams.limit} />
            </label>
        </div>
        <div class="search-buttons">
            <button type="submit">Buscar</button>
            <button type="button" onclick={clearSearch}>Limpiar Búsqueda</button>
        </div>
    </form>
</div>

<div class="delete-specific">
    <h3>Eliminar recurso específico</h3>
    <div class="delete-form">
        <input placeholder="País" bind:value={deleteCountry} />
        <input type="number" placeholder="Año" bind:value={deleteYear} />
        <button onclick={handleDeleteSpecific}>Eliminar recurso</button>
    </div>
</div>

{#if showCreateForm}
    <div class="form-container">
        <h2>Crear Nuevo Recurso</h2>
        <form onsubmit={createLiteracyRate}>
            <label>
                País: <input type="text" bind:value={newItem.country} required />
            </label>
            <label>
                Año: <input type="number" bind:value={newItem.year} required />
            </label>
            <label>
                Total: <input type="number" step="0.1" bind:value={newItem.total} required />
            </label>
            <label>
                Hombres: <input type="number" step="0.1" bind:value={newItem.male} required />
            </label>
            <label>
                Mujeres: <input type="number" step="0.1" bind:value={newItem.female} required />
            </label>
            <label>
                Brecha de Género: <input type="number" step="0.1" bind:value={newItem.gender_gap} required />
            </label>
            <button type="submit">Crear</button>
            <button type="button" onclick={() => showCreateForm = false}>Cancelar</button>
        </form>
    </div>
{/if}
<h2>Lista de Tasas de Alfabetización</h2>
{#if literacyRates.length > 0}
    
    <table>
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
                <tr>
                    <td>{rate.country}</td>
                    <td>{rate.year}</td>
                    <td>{rate.total}</td>
                    <td>{rate.male}</td>
                    <td>{rate.female}</td>
                    <td>{rate.gender_gap}</td>
                    <td>
                        <button onclick={() => goto(`/literacy-rates/${encodeURIComponent(rate.country)}/${rate.year}`)}>Editar</button>
                        <button onclick={() => deleteLiteracyRate(rate.country, rate.year)}>Eliminar</button>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
{/if}

<style>
    :global(body) {
        margin: 0;
        font-family: Inter, "Segoe UI", Roboto, sans-serif;
        background: #0f172a;
        color: #e2e8f0;
    }

    h1 {
        text-align: center;
        margin-top: 1rem;
        color: #e2e8f0;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
    }

    h2 {
        text-align: center;
        color: #e2e8f0;
        margin-top: 1.5rem;
    }

    .message {
        border-radius: 10px;
        padding: 0.8rem 1rem;
        margin: 1rem auto;
        width: min(95%, 1000px);
        font-size: 0.95rem;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
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
    .form-container button {
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

    .form-container h2 {
        margin: 0 0 1rem;
        color: #cbd5e1;
    }

    .form-container label {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        margin: 0.7rem 0;
        color: #cbd5e1;
    }

    .form-container input {
        background: #0b1222;
        border: 1px solid #334155;
        color: #e2e8f0;
        border-radius: 0.5rem;
        padding: 0.6rem 0.8rem;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .form-container input:focus {
        outline: none;
        border-color: #7c3aed;
        box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.3);
    }

    .form-container button {
        background-color: #2563eb;
        color: #fff;
        margin-top: 0.8rem;
    }

    .form-container button[type="button"] {
        background-color: #4b5563;
    }

    .form-container button:hover {
        transform: translateY(-1px);
        opacity: 0.95;
    }

    .delete-specific {
        max-width: 1000px;
        width: 95%;
        margin: 1rem auto;
        background: #111a30;
        border: 1px solid #2f3b54;
        border-radius: 0.75rem;
        padding: 1rem;
    }

    .delete-specific h3 {
        margin: 0 0 0.5rem;
        color: #cbd5e1;
    }

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

    .delete-form button {
        background-color: #ef4444;
        color: #fff;
        border: none;
        border-radius: 0.6rem;
        padding: 0.7rem;
        font-weight: 600;
    }

    .delete-form button:hover {
        background-color: #dc2626;
        transform: translateY(-1px);
    }

    .search-container {
        max-width: 1000px;
        width: 95%;
        margin: 1rem auto;
        background: #111a30;
        border: 1px solid #2f3b54;
        border-radius: 0.75rem;
        padding: 1rem;
    }

    .search-container h3 {
        margin: 0 0 0.5rem;
        color: #cbd5e1;
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
        color: #cbd5e1;
    }

    .search-grid input {
        border: 1px solid #334155;
        border-radius: 0.5rem;
        padding: 0.6rem 0.7rem;
        background: #0b1222;
        color: #e2e8f0;
    }

    .search-buttons {
        display: flex;
        gap: 0.8rem;
        margin-top: 1rem;
    }

    .search-buttons button {
        background-color: #059669;
        color: #fff;
        border: none;
        border-radius: 0.6rem;
        padding: 0.7rem;
        font-weight: 600;
        cursor: pointer;
    }

    .search-buttons button:hover {
        background-color: #047857;
        transform: translateY(-1px);
    }

    .search-buttons button[type="button"] {
        background-color: #6b7280;
    }

    .search-buttons button[type="button"]:hover {
        background-color: #4b5563;
    }

    table {
        max-width: 1000px;
        width: 95%;
        margin: 0.8rem auto 2rem;
        border-collapse: collapse;
        background: linear-gradient(180deg, #181f33 0%, #1d2a44 100%);
        border-radius: 0.75rem;
        overflow: hidden;
        box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
    }

    th, td {
        padding: 0.85rem 0.95rem;
        text-align: left;
        color: #e2e8f0;
    }

    th {
        background: #0f172a;
        font-weight: 600;
        border-bottom: 1px solid #334155;
    }

    td {
        border-bottom: 1px solid #334155;
    }

    tr:last-child td {
        border-bottom: none;
    }

    td button {
        margin-right: 0.5rem;
        padding: 0.5rem 0.8rem;
        font-size: 0.85rem;
        font-weight: 600;
        border: none;
        border-radius: 0.4rem;
        cursor: pointer;
        transition: transform 0.2s ease, opacity 0.2s ease, background-color 0.2s ease;
    }

    td button:first-child {
        background-color: #2563eb;
        color: #fff;
    }

    td button:first-child:hover {
        background-color: #1d4ed8;
        transform: translateY(-1px);
    }

    td button:last-child {
        background-color: #ef4444;
        color: #fff;
    }

    td button:last-child:hover {
        background-color: #dc2626;
        transform: translateY(-1px);
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