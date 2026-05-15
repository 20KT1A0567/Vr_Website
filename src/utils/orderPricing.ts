import type { DeliveryType, SiteSettings } from "types";

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function parseRuleState(value?: string) {
  return value?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
}

export function getGstRatePercent(settings?: SiteSettings) {
  if (!settings?.gstEnabled) {
    return 0;
  }
  const rate = Number(settings.gstRate ?? 0);
  return Number.isFinite(rate) ? rate : 0;
}

export function calculateTaxAmount(settings: SiteSettings | undefined, taxableAmount: number) {
  const safeTaxableAmount = Math.max(0, taxableAmount);
  const rate = getGstRatePercent(settings);
  if (rate <= 0) {
    return 0;
  }
  return roundCurrency((safeTaxableAmount * rate) / 100);
}

export function resolveStateDeliveryCharge(settings: SiteSettings | undefined, deliveryState?: string) {
  const rules = settings?.stateDeliveryCharges?.trim();
  const targetState = parseRuleState(deliveryState);
  if (!rules || !targetState) {
    return undefined;
  }

  const entries = rules.split(/\r?\n|;/);
  for (const entry of entries) {
    const [rawState, rawValue] = entry.split("=", 2);
    if (!rawState || !rawValue || parseRuleState(rawState) !== targetState) {
      continue;
    }
    const parsed = Number(rawValue.trim());
    if (Number.isFinite(parsed)) {
      return roundCurrency(Math.max(0, parsed));
    }
  }

  return undefined;
}

export function calculateDeliveryCharge(
  settings: SiteSettings | undefined,
  deliveryType: DeliveryType,
  subtotalAfterDiscount: number,
  deliveryState?: string
) {
  if (!settings || deliveryType !== "DELIVERY") {
    return 0;
  }

  const threshold = Number(settings.freeDeliveryThreshold ?? 0);
  if (Number.isFinite(threshold) && threshold > 0 && subtotalAfterDiscount >= threshold) {
    return 0;
  }

  const stateCharge = resolveStateDeliveryCharge(settings, deliveryState);
  if (typeof stateCharge === "number") {
    return stateCharge;
  }

  const standardCharge = Number(settings.standardDeliveryCharge ?? 0);
  return Number.isFinite(standardCharge) ? roundCurrency(Math.max(0, standardCharge)) : 0;
}

export function getEstimatedDeliveryLabel(settings?: SiteSettings) {
  const days = Number(settings?.estimatedDeliveryDays ?? 0);
  if (!Number.isFinite(days) || days <= 0) {
    return "Delivery timeline confirmed after store approval";
  }
  return `${days} business day${days === 1 ? "" : "s"} estimate`;
}
