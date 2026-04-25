<script>
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    onMount(() => {
        goto('/');
    });
</script>

<style>
    :global(body) {
        background: #282c34;
        color: #abb2bf;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    }

    .redirect-message {
        text-align: center;
    }

    .redirect-message h1 {
        color: #61afef;
        margin-bottom: 1rem;
    }

    .redirect-message p {
        color: #abb2bf;
        font-size: 1.1rem;
    }
</style>

<div class="redirect-message">
    <h1>Redirigiendo...</h1>
    <p>Te estamos llevando a la página principal.</p>
</div>