<script lang="ts">
import PaymentBucket from './lib/PaymentBucket.svelte';
import ReceiverWallet from './lib/ReceiverWallet.svelte';
import UserWallet from './lib/UserWallet.svelte';
import { currencies, ratesFromUSD, type Currency } from './lib/utils';

type Receiver = {
	id: number;
	currency: Currency;
	balance: number;
	sentAmount: number;
};

// All amounts are integers (102 = 1.02)
let userCurrency = $state<Currency>('MXN');
let userHourlyRate = $state(1000); // $10.00
let pendingAmount = $state(0);
let isRunning = $state(false);
let isProcessing = $state(false);

let currentReceiverIndex = $state(0);
let receivers = $state<Receiver[]>([
	{ id: 1, currency: 'MXN', balance: 0, sentAmount: 0 },
	{ id: 2, currency: 'USD', balance: 0, sentAmount: 0 },
	{ id: 3, currency: 'INR', balance: 0, sentAmount: 0 },
]);

let maxMinNeeded = $derived.by(() => {
	if (receivers.length === 0) return 100;
	const needs = receivers.map((r) => getExchangeData(r.currency).minNeeded);
	return Math.max(...needs);
});

let tickInfo = $derived.by(() => {
	const rps = userHourlyRate / 3600;
	const n = Math.max(1, Math.ceil(2 * rps));
	return { amount: n, interval: (n / rps) * 1000 };
});

function getExchangeData(recvCurrency: Currency) {
	const ratio = ratesFromUSD[recvCurrency] / ratesFromUSD[userCurrency];
	const minNeeded = Math.ceil(1 / ratio);
	return { ratio, minNeeded };
}

async function doTick() {
	if (isProcessing) return;

	pendingAmount += tickInfo.amount;

	const recv = receivers[currentReceiverIndex];
	const { ratio, minNeeded } = getExchangeData(recv.currency);

	// Largest multiple of minNeeded we can afford
	const multiplier = Math.floor(pendingAmount / minNeeded);

	if (multiplier >= 1) {
		isProcessing = true;
		await new Promise((r) => setTimeout(r, 800));

		const amountToDeduct = multiplier * minNeeded;
		pendingAmount -= amountToDeduct;

		const receivedValue = Math.floor(amountToDeduct * ratio);

		recv.sentAmount += amountToDeduct;
		recv.balance += receivedValue;

		currentReceiverIndex = (currentReceiverIndex + 1) % receivers.length;
		isProcessing = false;
	}
}

$effect(() => {
	if (isRunning && !isProcessing) {
		const interval = setInterval(doTick, tickInfo.interval);
		return () => clearInterval(interval);
	}
});

function reset() {
	isRunning = false;
	isProcessing = false;
	pendingAmount = 0;
	currentReceiverIndex = 0;
	receivers = receivers.map((r) => ({ ...r, balance: 0, sentAmount: 0 }));
}

let isAddingReceiver = $state(false);
let newReceiverCurrency = $state<Currency>('USD');
function confirmAddReceiver() {
	receivers.push({
		id: Date.now(),
		currency: newReceiverCurrency,
		balance: 0,
		sentAmount: 0,
	});
	isAddingReceiver = false;
}
</script>

<main class="demo-container">
	<div class="controls">
		<button
			type="button"
			onclick={() => (isRunning = !isRunning)}
			class:active={isRunning}
			aria-label={isRunning ? "Pause" : "Play"}
			title={isRunning ? "Pause" : "Play"}
		>
			{isRunning ? "⏸" : "▶"}
		</button>
		<button
			type="button"
			onclick={doTick}
			disabled={isRunning || isProcessing}
			aria-label="Next"
			title="Next"
		>
			⏭
		</button>
	</div>

	<div class="top-row">
		<UserWallet
			bind:currency={userCurrency}
			bind:hourlyRate={userHourlyRate}
			onchange={reset}
		/>
		<PaymentBucket
			{pendingAmount}
			bind:isRunning
			currency={userCurrency}
			tickAmount={tickInfo.amount}
			interval={tickInfo.interval / 1000}
			maxCapacity={maxMinNeeded}
		/>

		<!-- Visual indicator shows who just got paid -->
		<div class="status-bar">
			{#if isProcessing}
				<p class="paying-msg" role="alert">
					Sending ➔ Receiver {currentReceiverIndex + 1}...
				</p>
			{:else}
				<p>Next receiver: Wallet #{currentReceiverIndex + 1}</p>
			{/if}
		</div>
	</div>

	<section class="receivers-section">
		<h2>Receivers</h2>
		<div class="receivers-grid">
			{#each receivers as r, i (r.id)}
				<ReceiverWallet
					id={i + 1}
					{userCurrency}
					bind:currency={r.currency}
					balance={r.balance}
					sentAmount={r.sentAmount}
					isCurrent={i === currentReceiverIndex}
					isReceiving={isProcessing && i === currentReceiverIndex}
					canRemove={receivers.length > 1 &&
                        !isRunning &&
                        pendingAmount === 0}
					onRemove={() => {
                        receivers = receivers.filter((x) => x.id !== r.id);
                        if (currentReceiverIndex >= receivers.length) {
                            currentReceiverIndex = 0;
                        }
                    }}
				/>
			{/each}

			{#if !isAddingReceiver}
				<button
					type="button"
					onclick={() => (isAddingReceiver = true)}
					disabled={receivers.length >= 3 ||
                        isRunning ||
                        pendingAmount > 0}
					class="add-btn"
				>
					+ New Receiver
				</button>
			{:else}
				<form class="add-form" onsubmit={(ev) => ev.preventDefault()}>
					<label for="new-receiver-currency">Receiver currency</label>

					<div>
						<select
							name="new-receiver-currency"
							bind:value={newReceiverCurrency}
						>
							{#each currencies as c}
								<option>{c}</option>
							{/each}
						</select>
						<button
							type="submit"
							onclick={confirmAddReceiver}
							aria-label="Confirm Add"
							class="confirm-btn"
						>
							➕
						</button>
						<button
							type="button"
							onclick={() => (isAddingReceiver = false)}
							aria-label="Cancel"
							class="cancel-btn"
						>
							✗
						</button>
					</div>
				</form>
			{/if}
		</div>
	</section>
</main>

<style>
.demo-container {
	display: grid;
	grid-template-columns: auto 1fr;
	width: 100%;
	justify-content: center;
	gap: 2rem;
	padding: 2rem;
	font-family:
		"Segoe Print", "Bradley Hand", Chilanka, TSCu_Comic, casual, cursive;
	max-width: 700px;
	margin: 0 auto;
}

.top-row {
	display: grid;
	grid-template-rows: auto 1fr;
	align-items: center;
	gap: 1rem;
	margin-top: 1.5rem;
}

.receivers-section {
	text-align: center;
}

.receivers-grid {
	display: grid;
	gap: 1rem;
	justify-content: center;
	align-items: center;
}

h2 {
	font-size: 1.1rem;
	text-decoration: underline;
	text-underline-offset: 4px;
}

.status-bar {
	display: flex;
	justify-content: center;
	align-items: center;
	font-size: 0.8rem;
	font-weight: bold;
	margin-top: -2.5rem;
	color: #27ae60;
}

.paying-msg {
	color: #f1c40f;
	animation: blink 0.5s infinite;
}

@keyframes blink {
	0% {
		opacity: 1;
	}
	50% {
		opacity: 0.5;
	}
	100% {
		opacity: 1;
	}
}

.controls {
	display: inline-flex;
	z-index: 1;
	gap: 0.5rem;
	width: fit-content;
	position: absolute;
	right: 1rem;
	top: 1rem;
	align-items: center;
}
.controls button {
	font-weight: bold;
	padding: 0.5rem;
	cursor: pointer;
	background: white;
	border: 2px solid #333;
	box-shadow: 3px 3px 0 #333;
}
.controls button:active {
	transform: translate(1px, 1px);
	box-shadow: 2px 2px 0 #333;
}
.controls button.active {
	background: #fff9c4;
	border-color: #fbc02d;
}
.controls button:disabled {
	opacity: 0.5;
}

.add-form {
	background: #f0f0f0;
	padding: 1rem 0.5rem;
	border: 2px dashed #333;
	width: fit-content;
}

.add-form label {
	display: block;
}

.add-form div {
	display: flex;
	gap: 0.5rem;
	align-items: center;
}

.add-form select {
	padding: 0.5rem;
	border: 2px solid #333;
}

.confirm-btn {
	background: #2ecc71;
	color: white;
	border: 2px solid #27ae60;
	padding: 0.5rem;
	cursor: pointer;
	font-family: inherit;
	box-shadow: 2px 2px 0 #27ae60;
}

.cancel-btn {
	background: #e74c3c;
	color: white;
	border: 2px solid #c0392b;
	padding: 0.5rem;
	cursor: pointer;
	font-family: inherit;
	box-shadow: 2px 2px 0 #c0392b;
}

.add-btn {
	background: #3498db;
	color: white;
	border: 2px solid #2980b9;
	padding: 0.5rem 1rem;
	cursor: pointer;
	font-family: inherit;
	box-shadow: 3px 3px 0 #2980b9;
	align-self: start;
	justify-self: start;
}

.add-btn:disabled {
	filter: grayscale(1);
	opacity: 0.5;
	cursor: not-allowed;
}

@media screen and (max-width: 26rem) {
	.demo-container {
		gap: 0.5rem;
		padding: 2rem 0;
	}

	.controls {
		left: 50%;
		transform: translateX(-50%);
	}

	.controls button {
		padding: 0.3rem;
	}

	.top-row {
		margin-top: 0.3rem;
	}

	.receivers-grid {
		gap: 0.5rem;
	}

	h2 {
		font-size: 1rem;
	}
}
</style>
