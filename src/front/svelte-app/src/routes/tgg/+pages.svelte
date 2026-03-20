<script>
    // @ts-ignore
    let literacyRates = $state([]);
    async function getLiteracyRates() {
        const res = await fetch('/api/v1/literacy-rates', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();
        literacyRates = data;
    }
</script>

<button onclick={getLiteracyRates}>Load Literacy Rates</button>
{#if literacyRates.length > 0}
    <table>
        <thead>
            <tr>
                <th>Country</th>
                <th>Literacy Rate (%)</th>
            </tr>
        </thead>
        <tbody>
            {#each literacyRates as rate}
                <tr>
                    <td>{rate.country}</td>
                    <td>{rate.literacy_rate}</td>
                </tr>
            {/each}
        </tbody>
    </table>
{:else}
    <p>No literacy rates available.</p>
{/if}