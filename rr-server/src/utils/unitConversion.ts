// Standardiseerime kogused baasühikutesse: g ja ml
export const unitConversion: Record<string, { base: string; factor: number }> = {
    g: { base: 'g', factor: 1 },
    kg: { base: 'g', factor: 1000 },
    ml: { base: 'ml', factor: 1 },
    l: { base: 'ml', factor: 1000 },
    tk: { base: 'tk', factor: 1 },
    prk: { base: 'prk', factor: 1 },
    purk: { base: 'prk', factor: 1 },

  };
  
  export type BaseUnit = 'g' | 'ml' | 'tk' | 'prk' | 'other';
  
  export interface ConvertedAmount {
    baseAmount: number;
    baseUnit: BaseUnit;
    displayAmount: number;
    displayUnit: string;
  }
  
  /**
   * Teisendab koguse baasühikusse (nt kg → g).
   * Samuti tagastab kasutajasõbraliku formaadi (nt 1200g → 1.2kg).
   */
  export function convertAmount(amount: string, unit: string): ConvertedAmount | null {
    const numeric = parseFloat(amount);
    if (isNaN(numeric)) return null;
  
    const conversion = unitConversion[unit];
    if (!conversion) {
      // Pole konverteeritav, tagastame originaalina
      return {
        baseAmount: numeric,
        baseUnit: 'other',
        displayAmount: numeric,
        displayUnit: unit
      };
    }
  
    const baseAmount = numeric * conversion.factor;
  
    // Tagastame loetavas ühikus (g → kg kui >1000)
    if (conversion.base === 'g' && baseAmount >= 1000) {
      return {
        baseAmount,
        baseUnit: 'g',
        displayAmount: parseFloat((baseAmount / 1000).toFixed(2)),
        displayUnit: 'kg'
      };
    }
  
    if (conversion.base === 'ml' && baseAmount >= 1000) {
      return {
        baseAmount,
        baseUnit: 'ml',
        displayAmount: parseFloat((baseAmount / 1000).toFixed(2)),
        displayUnit: 'l'
      };
    }
  
    return {
      baseAmount,
      baseUnit: conversion.base as BaseUnit,
      displayAmount: baseAmount,
      displayUnit: conversion.base
    };
  }
  