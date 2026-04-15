export type Currency = keyof typeof ratesFromUSD;

export const ratesFromUSD = { USD: 1, EUR: 0.85, MXN: 17.0, INR: 93.0 };
export const currencies = Object.keys(ratesFromUSD) as Currency[];

const currencyFormatters = Object.fromEntries(
	currencies.map((currency) => [
		currency,
		new Intl.NumberFormat([], {
			style: 'currency',
			currency,
			currencyDisplay: 'symbol',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}),
	]),
);

export function formatCurrency(amount: number, currency: Currency) {
	return currencyFormatters[currency].format(amount);
}
