type CartCountItem = {
  quantity?: number | null;
};

export function getCartItemCount(items: readonly unknown[]) {
  return items.length;
}

export function getCartQuantityCount(items: readonly CartCountItem[]) {
  return items.reduce((sum, item) => sum + Math.max(0, item.quantity ?? 0), 0);
}

export function formatCartItemCount(count: number) {
  return `${count} item${count === 1 ? "" : "s"}`;
}

export function formatCartProductCount(count: number) {
  return `${count} product${count === 1 ? "" : "s"}`;
}

export function formatCartUnitCount(count: number) {
  return `${count} unit${count === 1 ? "" : "s"}`;
}
