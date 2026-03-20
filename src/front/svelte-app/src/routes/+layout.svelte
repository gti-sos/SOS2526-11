<script>
	import favicon from '$lib/assets/favicon.svg';
	import Footer from './footer.svelte';
	import Header from './header.svelte';
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Header />
<hr>
{@render children()}
<hr>
<Footer />