/** Rounds a number to the requested number of fractional digits. */
export function roundOffToNdigitsAfterDecimal(number: number, n: number) {
  return Math.round(number * Math.pow(10, n)) / Math.pow(10, n);
}
