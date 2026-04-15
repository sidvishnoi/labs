<script lang="ts">
import rough from 'roughjs';
import { formatCurrency, ratesFromUSD, type Currency } from './utils';

interface Props {
	id: number;
	currency: ReturnType<typeof $bindable<Currency>>;
	userCurrency: Currency;
	balance: number;
	sentAmount: number;
	isCurrent: boolean;
	isReceiving: boolean;
	canRemove?: boolean;
	onRemove: () => void;
}

const currenies = Object.keys(ratesFromUSD);

let {
	id,
	currency = $bindable(),
	userCurrency,
	balance,
	sentAmount,
	isCurrent,
	isReceiving,
	canRemove = false,
	onRemove,
}: Props = $props();

let minNeeded = $derived.by(() => {
	const ratio = ratesFromUSD[currency] / ratesFromUSD[userCurrency];
	return Math.ceil(1 / ratio);
});

let svg: SVGSVGElement | undefined = $state();
$effect(() => {
	if (svg) {
		const rc = rough.svg(svg);
		svg.innerHTML = '';
		svg.appendChild(
			rc.rectangle(2, 2, 185, 115, {
				roughness: isReceiving ? 4 : isCurrent ? 2 : 1,
				stroke: isReceiving ? '#f1c40f' : isCurrent ? '#2ecc71' : '#444',
				fill: isReceiving ? '#fff9c4' : isCurrent ? '#f9fff9' : '#ffffff',
				fillStyle: 'solid',
			}),
		);
	}
});
</script>

<div class="receiver-card">
	<svg bind:this={svg} viewBox="0 0 190 120" aria-hidden="true"></svg>

	<div class="content">
		<div class="header">
			<span>Wallet #{id} ({currency})</span>
			<button
				type="button"
				class="remove-btn"
				disabled={!canRemove}
				onclick={onRemove}
				aria-label="Remove receiver"
				title="Remove receiver"
			>
				✗
			</button>
		</div>
		<div class="balances">
			<div class="main-val">{formatCurrency(balance / 100, currency)}</div>
			<div class="sent-val">
				({formatCurrency(sentAmount / 100, userCurrency)})
			</div>
		</div>
		<div class="footer">
			<code>minSendAmount</code>:
			{formatCurrency(minNeeded / 100, userCurrency)}
		</div>
	</div>
</div>

<style>
.receiver-card {
	position: relative;
	width: 100%;
	aspect-ratio: 3 / 2;
	padding: 0.5rem;
}

svg {
	position: absolute;
	top: 0;
	left: 0;
}

.content {
	position: relative;
	z-index: 1;
	padding: 1rem;
	display: flex;
	flex-direction: column;
	height: 100%;
	box-sizing: border-box;
}

.header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.balances {
	flex-grow: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}
.main-val {
	font-size: 1.5rem;
	font-weight: bold;
	color: #2ecc71;
	line-height: 1;
}

.sent-val {
	font-size: 0.7rem;
	color: #666;
	margin-top: 4px;
}
.footer {
	font-size: 0.65rem;
	color: #999;
	border-top: 1px dashed #ddd;
	padding-top: 4px;
	text-align: center;
}

.remove-btn {
	border: none;
	background: none;
	color: #e74c3c;
	cursor: pointer;
	font-size: large;
	position: absolute;
	right: 0.5rem;
	top: 0.25rem;
	padding: 0.25rem;
}
@media screen and (max-width: 26rem) {
	.receiver-card {
		aspect-ratio: 5 / 3;
	}

	.content {
		gap: 0.25rem;
		padding: 0.5rem;
	}

	.main-val {
		font-size: 1.2rem;
	}

	.header {
		font-size: small;
	}
}
</style>
