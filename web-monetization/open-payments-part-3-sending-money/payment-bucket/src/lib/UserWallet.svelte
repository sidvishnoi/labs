<script lang="ts">
import rough from 'roughjs';
import { currencies, formatCurrency } from './utils';

let {
	currency = $bindable(),
	hourlyRate = $bindable(),
	onchange = () => {},
} = $props();

// Convert the range input (float) to internal integer units
let displayRate = $state(hourlyRate / 100);
$effect(() => {
	hourlyRate = Math.round(displayRate * 100);
});

let svg: SVGSVGElement | undefined = $state();
$effect(() => {
	if (svg) {
		const rc = rough.svg(svg);
		svg.innerHTML = '';
		svg.appendChild(rc.rectangle(2, 2, 215, 135, { roughness: 1.5 }));
	}
});
</script>

<div class="wallet">
	<svg bind:this={svg} viewBox="0 0 220 140" aria-hidden="true"></svg>
	<div class="content">
		<h2>User's Wallet</h2>
		<div class="field">
			<select bind:value={currency} {onchange}>
				{#each currencies as c}
					<option>{c}</option>
				{/each}
			</select>
		</div>
		<div class="field">
			<div class="label-row">
				<label for="rate-of-pay">Hourly rate</label>
				<span class="value">{formatCurrency(displayRate, currency)}</span>
			</div>
			<input
				type="range"
				min="0.01"
				max="80.00"
				step="0.01"
				id="rate-of-pay"
				bind:value={displayRate}
			>
		</div>
	</div>
</div>

<style>
.wallet {
	position: relative;
	width: 100%;
	aspect-ratio: 220 / 140;
}

svg {
	position: absolute;
	top: 0;
	left: 0;
	z-index: 0;
}

.content {
	position: relative;
	z-index: 1;
	padding: 12px 15px;
	display: flex;
	flex-direction: column;
	gap: 8px;
}

h2 {
	font-size: 1.1rem;
	text-decoration: underline;
	text-underline-offset: 4px;
}

.field {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.label-row {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
}

label {
	font-size: 0.75rem;
	color: #444;
	font-weight: bold;
}

.value {
	font-size: 0.85rem;
	font-weight: bold;
}

select {
	padding: 2px;
	font-family: inherit;
	background: transparent;
	border: 1px solid #999;
	outline: none;
	font-size: 0.9rem;
}

input[type="range"] {
	width: 100%;
	cursor: pointer;
	accent-color: #333;
	margin: 4px 0;
}

@media screen and (max-width: 26rem) {
	h2 {
		font-size: 1rem;
	}

	.content {
		padding: 0.5rem;
	}

	.wallet {
		aspect-ratio: auto;
	}
}
</style>
