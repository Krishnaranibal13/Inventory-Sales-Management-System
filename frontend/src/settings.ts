export type AppSettings = {
  businessName: string;
  currency: string;
  dateFormat: string;
  lowStockThreshold: number;
  theme: "dark" | "system";
  density: "comfortable" | "compact";
  lowStockAlerts: boolean;
  salesNotifications: boolean;
  purchaseNotifications: boolean;
  systemNotifications: boolean;
  confirmDelete: boolean;
};

export const SETTINGS_KEY = "inventory-pro-settings";

export const DEFAULT_APP_SETTINGS: AppSettings = {
  businessName: "Inventory Pro",
  currency: "INR",
  dateFormat: "DD/MM/YYYY",
  lowStockThreshold: 10,
  theme: "dark",
  density: "comfortable",
  lowStockAlerts: true,
  salesNotifications: true,
  purchaseNotifications: true,
  systemNotifications: true,
  confirmDelete: true,
};

export type AppNotification = {
  id: string;
  type: "sale" | "purchase" | "low-stock" | "system";
  title: string;
  message: string;
  createdAt: number;
};

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_APP_SETTINGS;
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved
      ? { ...DEFAULT_APP_SETTINGS, ...JSON.parse(saved) }
      : DEFAULT_APP_SETTINGS;
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(
    new CustomEvent<AppSettings>("inventory-settings-changed", {
      detail: settings,
    })
  );
}

export function emitNotification(
  notification: Omit<AppNotification, "id" | "createdAt">
) {
  window.dispatchEvent(
    new CustomEvent<AppNotification>("inventory-notification", {
      detail: {
        ...notification,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        createdAt: Date.now(),
      },
    })
  );
}

export function formatCurrency(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);
  } catch {
    return `₹${(Number(value) || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  }
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function formatDate(value: string | Date, dateFormat: string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();

  if (dateFormat === "MM/DD/YYYY") return `${month}/${day}/${year}`;
  if (dateFormat === "YYYY-MM-DD") return `${year}-${month}-${day}`;
  return `${day}/${month}/${year}`;
}

export function formatDateTime(value: string | Date, dateFormat: string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const datePart = formatDate(date, dateFormat);
  const timePart = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} ${timePart}`;
}
