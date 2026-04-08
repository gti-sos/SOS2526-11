<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';

    let literacyRate = $state({});
    let message = $state({ text: '', type: '' });
    let isLoading = $state(true);

    let country = $derived($page.params.country);
    let year = $derived($page.params.year);

    async function loadLiteracyRate() {
        try {
            const res = await fetch(`/api/v2/literacy-rates/${country}/${year}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (res.ok) {
                literacyRate = await res.json();
                isLoading = false;
            } else {
                const error = await res.json();
                setMessage(`Error al cargar recurso: ${error.error}`, 'error');
                isLoading = false;
            }
        } catch (err) {
            setMessage('Error de conexión al cargar recurso.', 'error');
            isLoading = false;
        }
    }

    onMount(async () => {
        await loadLiteracyRate();
    });

    async function updateLiteracyRate() {
        try {
            const data = {
                country: literacyRate.country,
                year: parseInt(literacyRate.year),
                total: parseFloat(literacyRate.total),
                male: parseFloat(literacyRate.male),
                female: parseFloat(literacyRate.female),
                gender_gap: parseFloat(literacyRate.gender_gap)
            };
            const res = await fetch(`/api/v2/literacy-rates/${country}/${year}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                setMessage('Recurso actualizado exitosamente.', 'success');
                // Navegar de vuelta a la lista
                setTimeout(() => goto('/literacy-rates'), 2000);
            } else {
                const error = await res.json();
                setMessage(`Error al actualizar recurso: ${error.error}`, 'error');
            }
        } catch (err) {
            setMessage('Error de conexión al actualizar recurso.', 'error');
        }
    }

    function setMessage(text, type) {
        message = { text, type };
        // No auto-clear, or longer timeout
        setTimeout(() => message = { text: '', type: '' }, 10000);
    }
</script>

<h1>Editar Tasa de Alfabetización: {country} ({year})</h1>

{#if message.text}
    <div class="message {message.type}">
        {message.text}
    </div>
{/if}

{#if isLoading}
    <p>Cargando...</p>
{:else}
    <div class="form-container">
        <form onsubmit={(e) => { e.preventDefault(); updateLiteracyRate(); }}>
            <label>
                País: <input type="text" bind:value={literacyRate.country} required />
            </label>
            <label>
                Año: <input type="number" bind:value={literacyRate.year} required />
            </label>
            <label>
                Total: <input type="number" step="0.1" bind:value={literacyRate.total} required />
            </label>
            <label>
                Hombres: <input type="number" step="0.1" bind:value={literacyRate.male} required />
            </label>
            <label>
                Mujeres: <input type="number" step="0.1" bind:value={literacyRate.female} required />
            </label>
            <label>
                Brecha de Género: <input type="number" step="0.1" bind:value={literacyRate.gender_gap} required />
            </label>
            <button type="submit">Actualizar</button>
            <button type="button" onclick={() => goto('/literacy-rates')}>Cancelar</button>
        </form>
    </div>
{/if}

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
        font-weight: 600;
    }

    .message {
        border-radius: 2px;
        padding: 0.8rem 1rem;
        margin: 1rem auto;
        width: min(95%, 600px);
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

    .form-container {
        background: #2d3139;
        border: 1px solid #3e4451;
        border-radius: 2px;
        padding: 1.25rem;
        margin: 1rem auto;
        box-shadow: none;
        max-width: 600px;
        width: 95%;
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
        border: 1px solid #3e4451;
        border-radius: 2px;
        padding: 0.75rem 1rem;
        font-weight: 600;
        margin-top: 0.8rem;
        cursor: pointer;
        transition: background-color 0.2s ease;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    }

    .form-container button[type="button"] {
        background-color: #3e4451;
        color: #abb2bf;
    }

    .form-container button:hover {
        opacity: 0.9;
    }
</style>