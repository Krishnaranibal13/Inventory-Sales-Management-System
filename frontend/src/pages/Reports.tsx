import { useEffect, useMemo, useState } from "react";
import { formatCurrency, formatDate, formatDateTime, type AppSettings } from "../settings";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  ChevronRight,
  IndianRupee,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

type Product = {
  product_id: number;
  name: string;
  category: string;
  price: number;
  quantity: number;
  reorder_level: number;
  supplier?: string | null;
};

type Sale = {
  sale_id: number;
  customer_name: string | null;
  total_amount: number;
  sale_date: string;
};

type Purchase = {
  purchase_id: number;
  supplier_id: number;
  supplier: string;
  total_amount: number;
  purchase_date: string;
};

type TransactionItem = {
  item_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

type TransactionDetail = {
  type: "sale" | "purchase";
  id: number;
  party: string;
  total_amount: number;
  date: string;
  items: TransactionItem[];
};

type ReportsProps = {
  globalSearch?: string;
  appSettings: AppSettings;
};

const API_BASE = "http://127.0.0.1:8000";

function Reports({ globalSearch = "", appSettings }: ReportsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionDetail | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [sectionDetails, setSectionDetails] = useState<
    "sales" | "purchases" | null
  >(null);

  const search = globalSearch.trim().toLowerCase();

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");

      const [productsResponse, salesResponse, purchasesResponse] =
        await Promise.all([
          fetch(`${API_BASE}/api/products`),
          fetch(`${API_BASE}/api/sales`),
          fetch(`${API_BASE}/api/purchases`),
        ]);

      const [productsData, salesData, purchasesData] = await Promise.all([
        productsResponse.json(),
        salesResponse.json(),
        purchasesResponse.json(),
      ]);

      if (productsData.success) {
        setProducts(productsData.products || []);
      }

      if (salesData.success) {
        setSales(salesData.sales || []);
      }

      if (purchasesData.success) {
        setPurchases(purchasesData.purchases || []);
      }
    } catch {
      setError("Unable to load report data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!search) return products;

    return products.filter((product) =>
      [product.name, product.category, product.supplier]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    );
  }, [products, search]);

  const filteredSales = useMemo(() => {
    if (!search) return sales;

    return sales.filter((sale) => {
      const saleId = `sale #${sale.sale_id}`;
      const customer = sale.customer_name || "walk-in customer";

      return (
        saleId.toLowerCase().includes(search) ||
        customer.toLowerCase().includes(search)
      );
    });
  }, [sales, search]);

  const filteredPurchases = useMemo(() => {
    if (!search) return purchases;

    return purchases.filter((purchase) => {
      const purchaseId = `purchase #${purchase.purchase_id}`;

      return (
        purchaseId.toLowerCase().includes(search) ||
        purchase.supplier.toLowerCase().includes(search)
      );
    });
  }, [purchases, search]);

  const totalRevenue = sales.reduce(
    (sum, sale) => sum + Number(sale.total_amount || 0),
    0
  );

  const totalPurchases = purchases.reduce(
    (sum, purchase) => sum + Number(purchase.total_amount || 0),
    0
  );

  const inventoryValue = products.reduce(
    (sum, product) =>
      sum + Number(product.price || 0) * Number(product.quantity || 0),
    0
  );

  const lowStockProducts = products.filter(
    (product) => product.quantity <= appSettings.lowStockThreshold
  );

  const outOfStockProducts = products.filter(
    (product) => product.quantity === 0
  );

  const profitEstimate = totalRevenue - totalPurchases;

  const monthlyRevenue = useMemo(() => {
    const now = new Date();

    return sales
      .filter((sale) => {
        const date = new Date(sale.sale_date);
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0);
  }, [sales]);

  const monthlyPurchases = useMemo(() => {
    const now = new Date();

    return purchases
      .filter((purchase) => {
        const date = new Date(purchase.purchase_date);
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      })
      .reduce(
        (sum, purchase) => sum + Number(purchase.total_amount || 0),
        0
      );
  }, [purchases]);

  const categorySummary = useMemo(() => {
    const grouped = new Map<
      string,
      { products: number; units: number; value: number }
    >();

    filteredProducts.forEach((product) => {
      const current = grouped.get(product.category) || {
        products: 0,
        units: 0,
        value: 0,
      };

      current.products += 1;
      current.units += Number(product.quantity || 0);
      current.value +=
        Number(product.price || 0) * Number(product.quantity || 0);

      grouped.set(product.category, current);
    });

    return Array.from(grouped.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.value - a.value);
  }, [filteredProducts]);

  const maxCategoryValue = Math.max(
    ...categorySummary.map((category) => category.value),
    1
  );

  const recentSales = [...filteredSales]
    .sort(
      (a, b) =>
        new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime()
    )
    .slice(0, 5);

  const recentPurchases = [...filteredPurchases]
    .sort(
      (a, b) =>
        new Date(b.purchase_date).getTime() -
        new Date(a.purchase_date).getTime()
    )
    .slice(0, 5);

  const openTransactionDetails = async (
    type: "sale" | "purchase",
    id: number
  ) => {
    try {
      setDetailsLoading(true);
      setError("");

      const endpoint =
        type === "sale"
          ? `${API_BASE}/api/sales/${id}`
          : `${API_BASE}/api/purchases/${id}`;

      const response = await fetch(endpoint);
      const data = await response.json();

      if (!data.success) {
        setError(data.message || "Unable to load details.");
        return;
      }

      const source = type === "sale" ? data.sale : data.purchase;

      setSelectedTransaction({
        type,
        id,
        party:
          type === "sale"
            ? source.customer_name || "Walk-in Customer"
            : source.supplier,
        total_amount: Number(source.total_amount || 0),
        date: source.sale_date || source.purchase_date,
        items: (source.items || []).map(
          (item: {
            sale_item_id?: number;
            purchase_item_id?: number;
            product_id: number;
            product_name: string;
            quantity: number;
            unit_price?: number;
            unit_cost?: number;
            subtotal: number;
          }) => ({
          item_id:
            item.sale_item_id ?? item.purchase_item_id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price:
            item.unit_price ?? item.unit_cost,
          subtotal: item.subtotal,
          })
        ),
      });
    } catch {
      setError("Unable to load transaction details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-sky-400">
            Business Intelligence
          </p>
          <h1 className="mt-1 text-3xl font-bold text-white">Reports</h1>
          <p className="mt-1 text-sm text-slate-400">
            Monitor revenue, purchases, inventory health and business activity
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="flex h-13 w-13 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/70 text-slate-300 transition hover:border-slate-700 hover:text-white"
          title="Refresh reports"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <ReportCard
          label="Revenue"
          value={formatCurrency(totalRevenue, appSettings.currency)}
          caption={`${sales.length} sales recorded`}
          icon={<TrendingUp size={22} />}
        />
        <ReportCard
          label="Purchase Spend"
          value={formatCurrency(totalPurchases, appSettings.currency)}
          caption={`${purchases.length} purchase orders`}
          icon={<ShoppingCart size={22} />}
        />
        <ReportCard
          label="Inventory Value"
          value={formatCurrency(inventoryValue, appSettings.currency)}
          caption={`${products.length} products tracked`}
          icon={<Package size={22} />}
        />
        <ReportCard
          label="Estimated Margin"
          value={formatCurrency(profitEstimate, appSettings.currency)}
          caption="Revenue minus purchase spend"
          icon={<IndianRupee size={22} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Monthly Performance
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Current month revenue and purchasing activity
              </p>
            </div>
            <CalendarDays className="text-slate-500" size={22} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <PerformanceCard
              label="Sales Revenue"
              value={formatCurrency(monthlyRevenue, appSettings.currency)}
              icon={<TrendingUp size={18} />}
            />
            <PerformanceCard
              label="Purchase Spend"
              value={formatCurrency(monthlyPurchases, appSettings.currency)}
              icon={<TrendingDown size={18} />}
            />
          </div>

          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/50 p-5">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-slate-400">Revenue vs Purchase Spend</span>
              <span className="font-semibold text-white">
                {monthlyPurchases
                  ? `${((monthlyRevenue / monthlyPurchases) * 100).toFixed(0)}%`
                  : "—"}
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500"
                style={{
                  width: `${Math.min(
                    monthlyPurchases
                      ? (monthlyRevenue / monthlyPurchases) * 100
                      : monthlyRevenue > 0
                      ? 100
                      : 0,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Inventory Health
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Current stock condition
              </p>
            </div>
            <AlertTriangle className="text-amber-400" size={22} />
          </div>

          <div className="mt-6 space-y-3">
            <HealthRow
              label="Total Products"
              value={products.length}
              icon={<Package size={17} />}
            />
            <HealthRow
              label="Low Stock"
              value={lowStockProducts.length}
              warning
              icon={<AlertTriangle size={17} />}
            />
            <HealthRow
              label="Out of Stock"
              value={outOfStockProducts.length}
              danger
              icon={<TrendingDown size={17} />}
            />
          </div>

          <div className="mt-5 rounded-xl border border-amber-500/15 bg-amber-500/5 p-4">
            <p className="text-xs text-slate-500">Action Needed</p>
            <p className="mt-1 text-sm font-medium text-amber-300">
              {lowStockProducts.length
                ? `${lowStockProducts.length} product${
                    lowStockProducts.length === 1 ? "" : "s"
                  } need stock attention.`
                : "All products are above their reorder levels."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Inventory by Category
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Current stock value by category
              </p>
            </div>
            <BarChart3 className="text-violet-400" size={22} />
          </div>

          <div className="mt-6 space-y-5">
            {loading ? (
              <p className="text-sm text-slate-500">Loading report...</p>
            ) : categorySummary.length === 0 ? (
              <p className="text-sm text-slate-500">No category data found.</p>
            ) : (
              categorySummary.slice(0, 6).map((category) => (
                <div key={category.category}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-300">
                      {category.category}
                    </span>
                    <span className="text-slate-500">
                      {formatCurrency(category.value, appSettings.currency)}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-violet-500"
                      style={{
                        width: `${(category.value / maxCategoryValue) * 100}%`,
                      }}
                    />
                  </div>

                  <p className="mt-1 text-xs text-slate-600">
                    {category.products} products · {category.units} units
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Low Stock Report
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Products at or below reorder level
              </p>
            </div>
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
              {lowStockProducts.length} items
            </span>
          </div>

          <div className="mt-5 space-y-2">
            {lowStockProducts.length === 0 ? (
              <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 px-4 py-5 text-sm text-emerald-300">
                No low-stock products right now.
              </div>
            ) : (
              lowStockProducts.slice(0, 6).map((product) => (
                <div
                  key={product.product_id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {product.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Reorder at {product.reorder_level}
                    </p>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        product.quantity === 0
                          ? "text-red-400"
                          : "text-amber-400"
                      }`}
                    >
                      {product.quantity} left
                    </p>
                    <p className="text-xs text-slate-600">
                      {product.category}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <TransactionPanel
          title="Recent Sales"
          subtitle="Latest customer orders"
          emptyText="No sales recorded yet."
          onViewAll={() => setSectionDetails("sales")}
          items={recentSales.map((sale) => ({
            id: `sale-${sale.sale_id}`,
            title: `Sale #${sale.sale_id}`,
            subtitle: sale.customer_name || "Walk-in Customer",
            amount: formatCurrency(Number(sale.total_amount), appSettings.currency),
            date: formatDate(sale.sale_date, appSettings.dateFormat),
            onClick: () => openTransactionDetails("sale", sale.sale_id),
          }))}
        />

        <TransactionPanel
          title="Recent Purchases"
          subtitle="Latest supplier orders"
          emptyText="No purchases recorded yet."
          onViewAll={() => setSectionDetails("sales")}
          items={recentPurchases.map((purchase) => ({
            id: `purchase-${purchase.purchase_id}`,
            title: `Purchase #${purchase.purchase_id}`,
            subtitle: purchase.supplier,
            amount: formatCurrency(Number(purchase.total_amount), appSettings.currency),
            date: formatDate(purchase.purchase_date, appSettings.dateFormat),
            onClick: () =>
              openTransactionDetails("purchase", purchase.purchase_id),
          }))}
        />
      </div>
      {sectionDetails && (
        <SectionDetailsModal
          type={sectionDetails}
          sales={recentSales}
          purchases={recentPurchases}
          appSettings={appSettings}
          onClose={() => setSectionDetails(null)}
          onOpenTransaction={(type, id) => {
            setSectionDetails(null);
            openTransactionDetails(type, id);
          }}
        />
      )}

      <TransactionDetailsModal
        transaction={selectedTransaction}
        loading={detailsLoading}
        appSettings={appSettings}
        onClose={() => setSelectedTransaction(null)}
      />
    </div>
  );
}

function ReportCard({
  label,
  value,
  caption,
  icon,
}: {
  label: string;
  value: string;
  caption: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{caption}</p>
        </div>
        <div className="flex h-13 w-13 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
          {icon}
        </div>
      </div>
    </div>
  );
}

function PerformanceCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
          {icon}
        </div>
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function HealthRow({
  label,
  value,
  icon,
  warning = false,
  danger = false,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  warning?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
      <div className="flex items-center gap-3">
        <span
          className={
            danger
              ? "text-red-400"
              : warning
              ? "text-amber-400"
              : "text-slate-500"
          }
        >
          {icon}
        </span>
        <span className="text-sm text-slate-300">{label}</span>
      </div>
      <span
        className={`text-sm font-semibold ${
          danger
            ? "text-red-400"
            : warning
            ? "text-amber-400"
            : "text-white"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function TransactionPanel({
  title,
  subtitle,
  emptyText,
  items,
  onViewAll,
}: {
  title: string;
  subtitle: string;
  emptyText: string;
  onViewAll: () => void;
  items: {
    id: string;
    title: string;
    subtitle: string;
    amount: string;
    date: string;
    onClick: () => void;
  }[];
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          title={`View ${title.toLowerCase()}`}
          className="rounded-lg p-1 text-slate-600 transition hover:bg-slate-800 hover:text-white"
        >
          <ChevronRight size={19} />
        </button>
      </div>

      <div className="mt-5 space-y-2">
        {items.length === 0 ? (
          <p className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-5 text-sm text-slate-500">
            {emptyText}
          </p>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-left transition hover:border-slate-700 hover:bg-slate-900"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{item.title}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {item.subtitle} · {item.date}
                </p>
              </div>
              <p className="ml-4 text-sm font-semibold text-emerald-400">
                {item.amount}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function SectionDetailsModal({
  type,
  sales,
  purchases,
  appSettings,
  onClose,
  onOpenTransaction,
}: {
  type: "sales" | "purchases";
  sales: Sale[];
  purchases: Purchase[];
  appSettings: AppSettings;
  onClose: () => void;
  onOpenTransaction: (type: "sale" | "purchase", id: number) => void;
}) {
  const isSales = type === "sales";
  const items = isSales ? sales : purchases;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-violet-400">
              Reports
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">
              {isSales ? "Recent Sales" : "Recent Purchases"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="space-y-2 p-6">
          {items.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-8 text-center text-sm text-slate-500">
              No {isSales ? "sales" : "purchases"} recorded yet.
            </div>
          ) : (
            items.map((item) => {
              const id = isSales
                ? (item as Sale).sale_id
                : (item as Purchase).purchase_id;
              const amount = isSales
                ? Number((item as Sale).total_amount)
                : Number((item as Purchase).total_amount);
              const party = isSales
                ? (item as Sale).customer_name || "Walk-in Customer"
                : (item as Purchase).supplier;
              const date = isSales
                ? (item as Sale).sale_date
                : (item as Purchase).purchase_date;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    onOpenTransaction(isSales ? "sale" : "purchase", id)
                  }
                  className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-4 text-left transition hover:border-slate-700 hover:bg-slate-800/60"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {isSales ? `Sale #${id}` : `Purchase #${id}`}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {party} · {formatDate(date, appSettings.dateFormat)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-emerald-400">
                      {formatCurrency(amount, appSettings.currency)}
                    </span>
                    <ChevronRight size={17} className="text-slate-600" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function TransactionDetailsModal({
  transaction,
  loading,
  appSettings,
  onClose,
}: {
  transaction: TransactionDetail | null;
  loading: boolean;
  appSettings: AppSettings;
  onClose: () => void;
}) {
  if (!transaction && !loading) return null;

  const isSale = transaction?.type === "sale";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-violet-400">
              {isSale ? "Customer Sale" : "Supplier Purchase"}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">
              {transaction
                ? `${isSale ? "Sale" : "Purchase"} #${transaction.id}`
                : "Loading details..."}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {loading || !transaction ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Loading details...
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                  <p className="text-xs text-slate-500">
                    {isSale ? "Customer" : "Supplier"}
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {transaction.party}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                  <p className="text-xs text-slate-500">Date</p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {formatDateTime(transaction.date, appSettings.dateFormat)}
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-800">
                <div className="grid grid-cols-[1fr_80px_120px_120px] border-b border-slate-800 bg-slate-950/50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span>Product</span>
                  <span>Qty</span>
                  <span>{isSale ? "Unit Price" : "Unit Cost"}</span>
                  <span className="text-right">Subtotal</span>
                </div>

                {transaction.items.map((item) => (
                  <div
                    key={item.item_id}
                    className="grid grid-cols-[1fr_80px_120px_120px] border-b border-slate-800/70 px-4 py-4 text-sm last:border-b-0"
                  >
                    <span className="font-medium text-white">
                      {item.product_name}
                    </span>
                    <span className="text-slate-400">{item.quantity}</span>
                    <span className="text-slate-400">
                      {formatCurrency(Number(item.unit_price), appSettings.currency)}
                    </span>
                    <span className="text-right font-semibold text-emerald-400">
                      {formatCurrency(Number(item.subtotal), appSettings.currency)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-5 py-4">
                <span className="text-sm text-slate-500">Total Amount</span>
                <span className="text-2xl font-bold text-white">
                  {formatCurrency(Number(transaction.total_amount), appSettings.currency)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


export default Reports;
