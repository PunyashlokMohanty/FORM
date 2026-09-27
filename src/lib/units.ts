import { WeightUnit } from '../types';

export const LBS_PER_KG = 2.20462262;

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / LBS_PER_KG) * 10) / 10;
}

export function kgToLbs(kg: number): number {
  return Math.round((kg * LBS_PER_KG) * 10) / 10;
}

/**
 * Converts canonical weight (stored in lbs) to user's selected display unit.
 */
export function toDisplayWeight(weightInLbs: number, unit: WeightUnit): number {
  if (unit === 'kg') {
    return lbsToKg(weightInLbs);
  }
  return Math.round(weightInLbs * 10) / 10;
}

/**
 * Converts user input weight in their selected unit back to canonical lbs for storage.
 */
export function toStorageWeight(inputWeight: number, unit: WeightUnit): number {
  if (unit === 'kg') {
    return kgToLbs(inputWeight);
  }
  return Math.round(inputWeight * 10) / 10;
}

export function formatWeight(weightInLbs: number, unit: WeightUnit): string {
  const displayVal = toDisplayWeight(weightInLbs, unit);
  return `${displayVal} ${unit}`;
}
