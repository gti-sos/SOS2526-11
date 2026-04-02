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
        font-family: Inter, "Segoe UI", Roboto, sans-serif;
        background: #0f172a;
        color: #e2e8f0;
    }

    h1 {
        text-align: center;
        margin-top: 1rem;
        color: #e2e8f0;
    }

    .message {
        border-radius: 10px;
        padding: 0.8rem 1rem;
        margin: 1rem auto;
        width: min(95%, 600px);
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

    .form-container {
        background: linear-gradient(180deg, #111828 0%, #18244b 100%);
        border: 1px solid #1f2a44;
        border-radius: 1rem;
        padding: 1.25rem;
        margin: 1rem auto;
        box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
        max-width: 600px;
        width: 95%;
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
        border: none;
        border-radius: 0.65rem;
        padding: 0.75rem 1rem;
        font-weight: 600;
        margin-top: 0.8rem;
        cursor: pointer;
        transition: transform 0.2s ease;
    }

    .form-container button[type="button"] {
        background-color: #4b5563;
    }

    .form-container button:hover {
        transform: translateY(-1px);
        opacity: 0.95;
    }
</style>