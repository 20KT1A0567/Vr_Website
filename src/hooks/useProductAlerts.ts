import { useCallback, useState } from "react";
import { customerApi } from "api/client";

export type AlertType = "back-in-stock" | "price-drop";

interface ProductAlert {
  productId: number;
  type: AlertType;
  email: string;
  targetPrice?: number;
  createdAt: string;
}

const STORAGE_KEY = "vrtech-product-alerts";

function loadAlerts(): ProductAlert[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProductAlert[]) : [];
  } catch {
    return [];
  }
}

function saveAlerts(alerts: ProductAlert[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  } catch {}
}

export function useProductAlerts(productId: number) {
  const [alerts, setAlerts] = useState<ProductAlert[]>(loadAlerts);

  const isAlerted = (type: AlertType) =>
    alerts.some((a) => a.productId === productId && a.type === type);

  const subscribe = useCallback(
    (type: AlertType, email: string, targetPrice?: number) => {
      setAlerts((current) => {
        const filtered = current.filter(
          (a) => !(a.productId === productId && a.type === type)
        );
        const next = [
          ...filtered,
          { productId, type, email, targetPrice, createdAt: new Date().toISOString() }
        ];
        saveAlerts(next);
        return next;
      });
      if (type === "back-in-stock") {
        customerApi.registerBackInStock(productId, email).catch(() => {});
      } else {
        customerApi.createPriceDropAlert(productId, email, targetPrice).catch(() => {});
      }
    },
    [productId]
  );

  const unsubscribe = useCallback(
    (type: AlertType) => {
      setAlerts((current) => {
        const next = current.filter(
          (a) => !(a.productId === productId && a.type === type)
        );
        saveAlerts(next);
        return next;
      });
    },
    [productId]
  );

  return { isAlerted, subscribe, unsubscribe };
}
