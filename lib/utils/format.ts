// lib/utils/format.ts
export function formatMoney(value: number): string {
    return value.toLocaleString('it-IT', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }