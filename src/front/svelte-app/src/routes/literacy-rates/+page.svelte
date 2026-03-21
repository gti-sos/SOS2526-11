<script>
    import { onMount } from 'svelte';
    // @ts-ignore
    let literacyRates = $state([]);
    let message = $state({ text: '', type: '' }); // type: 'success' or 'error'
    let showCreateForm = $state(false);
    let newItem = $state({ country: '', year: '', total: '', male: '', female: '', gender_gap: '' });

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

    async function listLiteracyRates() {
        try {
            const res = await fetch('/api/v2/literacy-rates', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
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

    // @ts-ignore
    function setMessage(text, type) {
        message = { text, type };
        setTimeout(() => message = { text: '', type: '' }, 5000); // Clear after 5 seconds
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

{#if literacyRates.length > 0}
    <h2>Lista de Tasas de Alfabetización</h2>
    <ul>
        {#each literacyRates as rate}
            <li>
                <strong>{rate.country} ({rate.year})</strong>: Total {rate.total}%, Hombres {rate.male}%, Mujeres {rate.female}%, Brecha {rate.gender_gap}%
                <button onclick={() => deleteLiteracyRate(rate.country, rate.year)}>Eliminar</button>
            </li>
        {/each}
    </ul>
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
    .form-container button,
    li button {
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

    li button {
        background-color: #f59e0b;
        color: #0f172a;
    }

    li button:hover {
        background-color: #d97706;
    }

    li button:last-child {
        background-color: #ef4444;
        color: #fff;
    }

    li button:last-child:hover {
        background-color: #dc2626;
    }

    @media (max-width: 640px) {
        .form-container,
        .actions,
        ul {
            width: 98%;
        }

        li {
            flex-direction: column;
            align-items: stretch;
        }

        li button {
            width: 100%;
            margin-top: 0.5rem;
        }
    }
</style>