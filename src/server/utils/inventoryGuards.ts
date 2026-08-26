import { BloodGroup } from '@prisma/client';

/**
 * Validates that an inventory adjustment or set operation will never result in a negative quantity.
 * Throws a formatted Error if the proposed quantity is less than zero.
 */
export function validateNonNegativeInventory(
  currentQuantity: number,
  delta: number,
  bloodGroup: BloodGroup
): number {
  const newQuantity = currentQuantity + delta;
  if (newQuantity < 0) {
    throw new Error(
      `Inventory violation: Cannot reduce ${bloodGroup} stock by ${Math.abs(delta)} units. Available stock is ${currentQuantity} units.`
    );
  }
  return newQuantity;
}

/**
 * Validates direct quantity setter for inventory.
 */
export function validateDirectStockQuantity(quantity: number, bloodGroup: BloodGroup): number {
  if (quantity < 0 || !Number.isInteger(quantity)) {
    throw new Error(
      `Inventory violation: Invalid quantity ${quantity} for ${bloodGroup}. Blood stock must be a non-negative integer.`
    );
  }
  return quantity;
}
