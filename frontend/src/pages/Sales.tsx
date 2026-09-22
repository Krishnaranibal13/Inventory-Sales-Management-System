import { useEffect, useMemo, useState } from "react";
import { emitNotification, formatCurrency, formatDateTime, type AppSettings } from "../settings";
import {
  AlertCircle,
  CalendarDays,
  ChevronDown,
  Eye,
  Package,
  Plus,
  RefreshCw,
  ShoppingBag,
  Trash2,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react";

type Sale = {
  sale_id: number;
  customer_name: string | null;
  total_amount: number;
  sale_date: string;
};

type Product = {
  product_id: number;
  name: string;
  category: string;
  price: number;
  quantity: number;
  reorder_level: number;
};

type SaleItem = {
  product_id: number;
  quantity: number;
};

type SaleDetailItem = {
  sale_item_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

type SaleDetail = {
  sale_id: number;
  customer_name: string | null;
  total_amount: number;
  sale_date: string;
  items: SaleDetailItem[];
};

type SalesProps = {
  globalSearch?: string;
  appSettings: AppSettings;
};

const API_BASE = "http://127.0.0.1:8000";

function Sales({ globalSearch = "", appSettings }: SalesProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState(globalSearch);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [items, setItems] = useState<SaleItem[]>([
    { product_id: 0, quantity: 1 },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSearchTerm(globalSearch);
  }, [globalSearch]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [salesResponse, productsResponse] = await Promise.all([
        fetch(`${API_BASE}/api/sales`),
        fetch(`${API_BASE}/api/products`),
      ]);

      const salesData = await salesResponse.json();
      const productsData = await productsResponse.json();

      if (salesData.success) {
        setSales(salesData.sales || []);
      }

      if (productsData.success) {
        setProducts(productsData.products || []);
      }
    } catch {
      setError("Unable to load sales data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredSales = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) return sales;

    return sales.filter((sale) => {
      const id = `sale #${sale.sale_id}`.toLowerCase();
      const customer = (sale.customer_name || "walk-in customer").toLowerCase();
      return id.includes(search) || customer.includes(search);
    });
  }, [sales, searchTerm]);

  const totalRevenue = useMemo(
    () => sales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0),
    [sales]
  );

  const thisMonthRevenue = useMemo(() => {
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

  const averageOrderValue = sales.length
    ? totalRevenue / sales.length
    : 0;

  const selectedProducts = items.map((item) =>
    products.find((product) => product.product_id === item.product_id)
  );

  const createTotal = items.reduce((sum, item, index) => {
    const product = selectedProducts[index];
    return sum + (product ? Number(product.price) * item.quantity : 0);
  }, 0);

  const addItem = () => {
    setItems([...items, { product_id: 0, quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, itemIndex) => itemIndex !== index));
  };

  const updateItem = (
    index: number,
    field: keyof SaleItem,
    value: number
  ) => {
    setItems(
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  };

  const resetCreateForm = () => {
    setCustomerName("");
    setItems([{ product_id: 0, quantity: 1 }]);
    setError("");
  };

  const createSale = async () => {
    setError("");

    const invalidItem = items.find(
      (item) => !item.product_id || item.quantity <= 0
    );

    if (invalidItem) {
      setError("Select a product and enter a valid quantity.");
      return;
    }

    const duplicateIds = new Set<number>();
    for (const item of items) {
      if (duplicateIds.has(item.product_id)) {
        setError("The same product cannot be added twice.");
        return;
      }
      duplicateIds.add(item.product_id);

      const product = products.find(
        (candidate) => candidate.product_id === item.product_id
      );

      if (!product) {
        setError("One of the selected products no longer exists.");
        return;
      }

      if (item.quantity > product.quantity) {
        setError(
          `Insufficient stock for ${product.name}. Available: ${product.quantity}.`
        );
        return;
      }
    }

    try {
      setSaving(true);

      const response = await fetch(`${API_BASE}/api/sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName.trim() || null,
          items,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message || "Failed to create sale.");
        return;
      }

      setShowCreate(false);
      resetCreateForm();
      emitNotification({
        type: "sale",
        title: "Sale created",
        message: `Sale #${data.sale_id} was recorded successfully.`,
      });
      await fetchData();
    } catch {
      setError("Unable to create sale.");
    } finally {
      setSaving(false);
    }
  };

  const viewDetails = async (saleId: number) => {
    try {
      const response = await fetch(`${API_BASE}/api/sales/${saleId}`);
      const data = await response.json();

      if (!data.success) {
        setError(data.message || "Sale not found.");
        return;
      }

      setSelectedSale(data.sale);
      setShowDetails(true);
    } catch {
      setError("Unable to load sale details.");
    }
  };

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-sky-400">Inventory Management</p>
          <h1 className="mt-1 text-3xl font-bold text-white">Sales</h1>
          <p className="mt-1 text-sm text-slate-400">
            Record customer sales and reduce stock automatically
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex h-13 w-13 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/70 text-slate-300 transition hover:border-slate-700 hover:text-white"
            title="Refresh"
          >
            <RefreshCw size={20} />
          </button>

          <button
            onClick={() => {
              resetCreateForm();
              setShowCreate(true);
            }}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/20 transition hover:brightness-110"
          >
            <Plus size={19} />
            New Sale
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Sales"
          value={sales.length.toLocaleString("en-IN")}
          caption="Orders recorded"
          icon={<ShoppingBag size={22} />}
        />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(totalRevenue, appSettings.currency)}
          caption="Across all sales"
          icon={<TrendingUp size={22} />}
        />
        <StatCard
          label="This Month"
          value={formatCurrency(thisMonthRevenue, appSettings.currency)}
          caption="Current month revenue"
          icon={<CalendarDays size={22} />}
        />
        <StatCard
          label="Avg. Order Value"
          value={formatCurrency(averageOrderValue, appSettings.currency)}
          caption="Revenue per order"
          icon={<Package size={22} />}
        />
      </div>

      {error && !showCreate && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle size={17} />
          {error}
          <button
            onClick={() => setError("")}
            className="ml-auto text-red-300 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
        <div className="flex items-center justify-between border-b border-slate-800 px-7 py-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Sales History</h2>
            <p className="mt-1 text-sm text-slate-500">
              Customer orders and inventory deductions
            </p>
          </div>
          <span className="text-sm text-slate-500">
            {filteredSales.length} {filteredSales.length === 1 ? "result" : "results"}
          </span>
        </div>

        <div className="grid grid-cols-[1.25fr_1fr_1fr_1.2fr_110px] border-b border-slate-800 px-7 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>Sale</span>
          <span>Customer</span>
          <span>Amount</span>
          <span>Date</span>
          <span className="text-right">Action</span>
        </div>

        {loading ? (
          <div className="px-7 py-12 text-center text-sm text-slate-500">
            Loading sales...
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="px-7 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-500">
              <ShoppingBag size={25} />
            </div>
            <p className="mt-4 font-medium text-slate-300">No sales found</p>
            <p className="mt-1 text-sm text-slate-500">
              Create a sale to see it here.
            </p>
          </div>
        ) : (
          filteredSales.map((sale) => (
            <div
              key={sale.sale_id}
              className="grid grid-cols-[1.25fr_1fr_1fr_1.2fr_110px] items-center border-b border-slate-800/80 px-7 py-5 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <p className="font-semibold text-white">
                    Sale #{sale.sale_id}
                  </p>
                  <p className="text-xs text-slate-500">Customer order</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-300">
                <UserRound size={16} className="text-slate-500" />
                {sale.customer_name || "Walk-in Customer"}
              </div>

              <div className="font-semibold text-emerald-400">
                {formatCurrency(Number(sale.total_amount), appSettings.currency)}
              </div>

              <div className="text-sm text-slate-400">
                {formatDateTime(sale.sale_date, appSettings.dateFormat)}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => viewDetails(sale.sale_id)}
                  className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-600 hover:text-white"
                >
                  <Eye size={16} />
                  Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreate && (
        <Modal title="Create New Sale" onClose={() => setShowCreate(false)}>
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Customer Name
              </label>
              <input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Walk-in customer"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-500"
              />
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300">
                  Products
                </label>
                <button
                  onClick={addItem}
                  className="flex items-center gap-1.5 text-sm font-medium text-violet-400 hover:text-violet-300"
                >
                  <Plus size={16} />
                  Add Product
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => {
                  const product = products.find(
                    (candidate) => candidate.product_id === item.product_id
                  );

                  return (
                    <div
                      key={`${index}-${item.product_id}`}
                      className="grid grid-cols-[1fr_120px_120px_42px] items-end gap-3"
                    >
                      <div>
                        <label className="mb-1.5 block text-xs text-slate-500">
                          Product
                        </label>
                        <div className="relative">
                          <select
                            value={item.product_id}
                            onChange={(event) =>
                              updateItem(
                                index,
                                "product_id",
                                Number(event.target.value)
                              )
                            }
                            className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 pr-9 text-sm text-white outline-none focus:border-violet-500"
                          >
                            <option value={0}>Select product</option>
                            {products
                              .filter(
                                (candidate) =>
                                  candidate.quantity > 0 ||
                                  candidate.product_id === item.product_id
                              )
                              .map((candidate) => (
                                <option
                                  key={candidate.product_id}
                                  value={candidate.product_id}
                                >
                                  {candidate.name} — {formatCurrency(Number(candidate.price), appSettings.currency)}
                                </option>
                              ))}
                          </select>
                          <ChevronDown
                            size={16}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                          />
                        </div>
                        {product && (
                          <p className="mt-1 text-xs text-slate-500">
                            Available stock: {product.quantity}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs text-slate-500">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={product?.quantity || undefined}
                          value={item.quantity}
                          onChange={(event) =>
                            updateItem(
                              index,
                              "quantity",
                              Number(event.target.value)
                            )
                          }
                          className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs text-slate-500">
                          Subtotal
                        </label>
                        <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-semibold text-emerald-400">
                          {formatCurrency(
                            product
                              ? Number(product.price) * item.quantity
                              : 0,
                            appSettings.currency
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                        className="mb-0.5 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-800 text-slate-500 transition hover:border-red-500/30 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
                        title="Remove product"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <AlertCircle size={17} />
                {error}
              </div>
            )}

            <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 px-5 py-4">
              <div>
                <p className="text-sm text-slate-500">Sale Total</p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {formatCurrency(createTotal, appSettings.currency)}
                </p>
              </div>

              <button
                onClick={createSale}
                disabled={saving}
                className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Creating..." : "Create Sale"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showDetails && selectedSale && (
        <Modal
          title={`Sale #${selectedSale.sale_id}`}
          onClose={() => {
            setShowDetails(false);
            setSelectedSale(null);
          }}
        >
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <InfoCard
                label="Customer"
                value={selectedSale.customer_name || "Walk-in Customer"}
              />
              <InfoCard
                label="Date"
                value={formatDateTime(selectedSale.sale_date, appSettings.dateFormat)}
              />
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-800">
              <div className="grid grid-cols-[1fr_90px_120px_120px] border-b border-slate-800 bg-slate-950/50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>Product</span>
                <span>Qty</span>
                <span>Unit Price</span>
                <span className="text-right">Subtotal</span>
              </div>

              {selectedSale.items.map((item) => (
                <div
                  key={item.sale_item_id}
                  className="grid grid-cols-[1fr_90px_120px_120px] border-b border-slate-800/70 px-4 py-4 text-sm last:border-b-0"
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
                {formatCurrency(Number(selectedSale.total_amount), appSettings.currency)}
              </span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StatCard({
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

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-5">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default Sales;
