<script lang="ts">
import rough from 'roughjs';
import { formatCurrency } from './utils';

let {
	pendingAmount,
	currency,
	isRunning = $bindable(),
	tickAmount,
	interval,
	maxCapacity = 100,
} = $props();

let svg: SVGSVGElement | undefined = $state();
$effect(() => {
	if (svg) {
		const rc = rough.svg(svg);
		svg.innerHTML = '';

		// Draw the U-shaped bucket
		svg.appendChild(
			rc.linearPath(
				[
					[10, 10],
					[10, 130],
					[140, 130],
					[140, 10],
				],
				{
					strokeWidth: 2,
					roughness: 1.5,
				},
			),
		);

		// Calculate fill level: 120px is max height.
		// 100% full when pendingAmount reaches maxCapacity.
		const fillLevel = Math.min((pendingAmount / maxCapacity) * 120, 120);

		if (fillLevel > 0) {
			svg.appendChild(
				rc.rectangle(12, 130 - fillLevel, 126, fillLevel, {
					fill: '#f1c40f',
					fillStyle: 'zigzag',
					stroke: 'none',
					fillWeight: 2,
					hachureGap: 3,
				}),
			);
		}
	}
});
</script>

<div class="bucket-container">
	<h2>Payment Bucket</h2>

	<div class="info">
		＋{formatCurrency(tickAmount / 100, currency)}
		every {interval.toFixed(1)}s
	</div>
	<div class="info">
		Capacity: {formatCurrency(maxCapacity / 100, currency)}
	</div>

	<div class="visual">
		<svg bind:this={svg} viewBox="0 0 150 140" aria-hidden="true"></svg>

		<div class="amount-display">
			<small>{currency}</small>
			<strong>{(pendingAmount / 100).toFixed(2)}</strong>
		</div>
	</div>
</div>

<style>
.bucket-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	position: relative;
	width: 100%;
	padding: 1rem;
	gap: 0.2rem;
}

.visual {
	position: relative;
	width: 100%;
}

h2 {
	font-size: 1.1rem;
	text-decoration: underline;
	text-underline-offset: 4px;
}

.amount-display {
	position: absolute;
	bottom: 20px;
	left: 50%;
	transform: translateX(-50%);
	background: white;
	border: 1px solid #333;
	padding: 2px 8px;
	display: flex;
	flex-direction: column;
	align-items: center;
	line-height: 1;
}
.amount-display small {
	font-size: 0.6rem;
	color: #666;
}

.info {
	font-size: 0.7rem;
	line-height: 1.5;
	color: #666;
	background: #eee;
	padding: 4px;
	border-radius: 4px;
}

@media screen and (max-width: 26rem) {
	.bucket-container {
		padding: 0.5rem;
	}

	.visual {
		width: 75%;
	}

	h2 {
		font-size: 1rem;
	}
}
</style>
