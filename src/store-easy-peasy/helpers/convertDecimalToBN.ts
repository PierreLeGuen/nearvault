import BN from 'bn.js';

// Example:
// 0.2 -> 0.2 * 10^24 -> '200000000000000000000000'
// 1.2 -> 1.2 * 10^24 -> '1200000000000000000000000'
export const convertDecimalToBN = (value: number, decimals: number) => {
  const valueAsString = value.toString();

  const parts = valueAsString.split(".");
  const integerPart = parts[0];
  const fractionalPart = parts[1] || "";

  const requiredZeros = decimals - fractionalPart.length;
  const fullNumber = integerPart + fractionalPart + "0".repeat(requiredZeros);

  return new BN(fullNumber).toString();
}