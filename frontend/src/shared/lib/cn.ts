import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Conditional class utility for better readability
 * @param condition - Boolean condition
 * @param trueClasses - Classes to apply when condition is true
 * @param falseClasses - Classes to apply when condition is false
 * @returns Conditional classes
 */
export function conditionalClass(
  condition: boolean,
  trueClasses: string,
  falseClasses: string = ''
) {
  return condition ? trueClasses : falseClasses
}

/**
 * Variant utility for component variants
 * @param variants - Object with variant keys and class values
 * @param activeVariant - Currently active variant
 * @returns Classes for active variant
 */
export function variantClass<T extends string>(
  variants: Record<T, string>,
  activeVariant: T
) {
  return variants[activeVariant] || ''
} 