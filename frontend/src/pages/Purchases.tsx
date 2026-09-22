import { useEffect, useMemo, useState } from "react";
import { emitNotification, formatCurrency, formatDateTime, type AppSettings } from "../settings";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Eye,
  Package,
  Plus,
  RefreshCw,
  ShoppingCart,
  Truck,
  X,
} from "lucide-react";

type Purchase = {
  purchase_id: number;
  supplier_id: number;
  supplier: string;
  total_amount: number | string;
  purchase_date: string;
};

type Supplier = {
  supplier_id: number;
  name: string;
  company: string | null;
};

type Product = {
  product_id: number;
  name: string;
  price: number | string;
  quantity: number;
};

type PurchaseItemForm = {
  product_id: string;
  quantity: string;
  unit_cost: string;
};

type PurchaseDetailItem = {
  purchase_item_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_cost: number | string;
  subtotal: number | string;
};

type PurchaseDetail = {
  purchase_id: number;
  supplier_id: number;
  supplier: string;
  total_amount: number | string;
  purchase_date: string;
  items: PurchaseDetailItem[];
};

type PurchasesProps = {
  globalSearch?: string;
  onGlobalSearchChange?: (value: string) => void;
  appSettings: AppSettings;
};

const API = "https://inventory-sales-management-system-production-a7df.up.railway.app
/api";

function Purchases({
  globalSearch = "",
  onGlobalSearchChange,
  appSettings,
}: PurchasesProps) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [searchTerm, setSearchTerm] = useState(globalSearch);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [itemForm, setItemForm] = useState<PurchaseItemForm>({
    product_id: "",
    quantity: "",
    unit_cost: "",
  });

  const [purchaseItems, setPurchaseItems] = useState<PurchaseItemForm[]>([]);
  const [selectedPurchase, setSelectedPurchase] =
    useState<PurchaseDetail | null>(null);

  useEffect(() => {
    setSearchTerm(globalSearch);
  }, [globalSearch]);

  useEffect(() => {
    if (onGlobalSearchChange) {
      onGlobalSearchChange(searchTerm);
    }
  }, [searchTerm, onGlobalSearchChange]);

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      const [purchaseResponse, supplierResponse, productResponse] =
        await Promise.all([
          fetch(`${API}/purchases`),
          fetch(`${API}/suppliers`),
          fetch(`${API}/products`),
        ]);

      if (!purchaseResponse.ok) {
        throw new Error("Failed to fetch purchases.");
      }

      if (!supplierResponse.ok) {
        throw new Error("Failed to fetch suppliers.");
      }

      if (!productResponse.ok) {
        throw new Error("Failed to fetch products.");
      }

      const purchaseData = await purchaseResponse.json();
      const supplierData = await supplierResponse.json();
      const productData = await productResponse.json();

      setPurchases(purchaseData.purchases || []);
      setSuppliers(supplierData.suppliers || []);
      setProducts(productData.products || []);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load purchase data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredPurchases = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return purchases;
    }

    return purchases.filter((purchase) =>
      [
        purchase.purchase_id,
        purchase.supplier,
        purchase.total_amount,
        purchase.purchase_date,
      ]
        .map((value) => String(value).toLowerCase())
        .some((value) => value.includes(search))
    );
  }, [purchases, searchTerm]);

  const totalSpend = purchases.reduce(
    (total, purchase) => total + Number(purchase.total_amount),
    0
  );

  const thisMonthSpend = purchases
    .filter((purchase) => {
      const date = new Date(purchase.purchase_date);
      const now = new Date();

      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    })
    .reduce(
      (total, purchase) => total + Number(purchase.total_amount),
      0
    );

  const suppliersUsed = new Set(
    purchases.map((purchase) => purchase.supplier_id)
  ).size;

  const openAddModal = () => {
    setSelectedSupplier("");
    setItemForm({
      product_id: "",
      quantity: "",
      unit_cost: "",
    });
    setPurchaseItems([]);
    setError("");
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    if (submitting) {
      return;
    }

    setShowAddModal(false);
    setError("");
  };

  const handleProductChange = (productId: string) => {
    const product = products.find(
      (item) => String(item.product_id) === productId
    );

    setItemForm((previous) => ({
      ...previous,
      product_id: productId,
      unit_cost:
        product && !previous.unit_cost
          ? String(product.price)
          : previous.unit_cost,
    }));
  };

  const addItem = () => {
    setError("");

    if (!itemForm.product_id) {
      setError("Please select a product.");
      return;
    }

    const quantity = Number(itemForm.quantity);
    const unitCost = Number(itemForm.unit_cost);

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      setError("Quantity must be a positive whole number.");
      return;
    }

    if (
      Number.isNaN(unitCost) ||
      unitCost < 0
    ) {
      setError("Unit cost must be a valid non-negative amount.");
      return;
    }

    if (
      purchaseItems.some(
        (item) => item.product_id === itemForm.product_id
      )
    ) {
      setError("This product is already added to the purchase.");
      return;
    }

    setPurchaseItems((previous) => [
      ...previous,
      {
        product_id: itemForm.product_id,
        quantity: String(quantity),
        unit_cost: String(unitCost),
      },
    ]);

    setItemForm({
      product_id: "",
      quantity: "",
      unit_cost: "",
    });
  };

  const removeItem = (index: number) => {
    setPurchaseItems((previous) =>
      previous.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const purchaseTotal = purchaseItems.reduce(
    (total, item) =>
      total +
      Number(item.quantity) * Number(item.unit_cost),
    0
  );

  const createPurchase = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!selectedSupplier) {
      setError("Please select a supplier.");
      return;
    }

    if (purchaseItems.length === 0) {
      setError("Add at least one product to the purchase.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API}/purchases`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supplier_id: Number(selectedSupplier),
          items: purchaseItems.map((item) => ({
            product_id: Number(item.product_id),
            quantity: Number(item.quantity),
            unit_cost: Number(item.unit_cost),
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to create purchase."
        );
      }

      setShowAddModal(false);
      setPurchaseItems([]);
      setSelectedSupplier("");

      await fetchData();

      setSuccessMessage(
        `Purchase #${data.purchase_id} created successfully. Stock updated.`
      );

      emitNotification({
        type: "purchase",
        title: "Purchase created",
        message: `Purchase #${data.purchase_id} was recorded successfully.`,
      });

      setTimeout(() => {
        setSuccessMessage("");
      }, 4500);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create purchase."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const viewDetails = async (purchaseId: number) => {
    setError("");

    try {
      const response = await fetch(
        `${API}/purchases/${purchaseId}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load purchase details."
        );
      }

      setSelectedPurchase(data.purchase);
      setShowDetailsModal(true);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load purchase details."
      );
    }
  };

  const getProductName = (productId: string) => {
    return (
      products.find(
        (product) => String(product.product_id) === productId
      )?.name || `Product #${productId}`
    );
  };



  return (
    <div className="space-y-7">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">
            Inventory Management
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            Purchases
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Record supplier purchases and update stock
            automatically
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-slate-300 transition hover:bg-white/[0.08]"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 text-sm font-semibold shadow-lg shadow-violet-600/20 transition hover:-translate-y-0.5"
          >
            <Plus size={18} />
            New Purchase
          </button>
        </div>
      </div>

      {/* SUCCESS */}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-400">
          <CheckCircle2 size={18} />
          {successMessage}
        </div>
      )}

      {/* ERROR */}
      {error && !showAddModal && (
        <div className="flex items-center gap-3 rounded-xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-400">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-4 gap-5">
        <StatCard
          title="Total Purchases"
          value={String(purchases.length)}
          subtitle="Purchase orders recorded"
          icon={<ShoppingCart size={21} />}
          iconStyle="from-violet-500/20 to-purple-500/5 text-violet-400"
        />

        <StatCard
          title="Total Spend"
          value={formatCurrency(totalSpend, appSettings.currency)}
          subtitle="Across all purchases"
          icon={<Package size={21} />}
          iconStyle="from-blue-500/20 to-cyan-500/5 text-blue-400"
        />

        <StatCard
          title="This Month"
          value={formatCurrency(thisMonthSpend, appSettings.currency)}
          subtitle="Current month spending"
          icon={<CalendarDays size={21} />}
          iconStyle="from-emerald-500/20 to-green-500/5 text-emerald-400"
        />

        <StatCard
          title="Suppliers Used"
          value={String(suppliersUsed)}
          subtitle="Suppliers with purchases"
          icon={<Truck size={21} />}
          iconStyle="from-orange-500/20 to-red-500/5 text-orange-400"
        />
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold">
              Purchase History
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Supplier orders and inventory additions
            </p>
          </div>

          <div className="text-xs text-slate-500">
            {filteredPurchases.length} result
            {filteredPurchases.length === 1 ? "" : "s"}
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <RefreshCw size={18} className="animate-spin" />
              Loading purchases...
            </div>
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="flex min-h-64 items-center justify-center">
            <div className="text-center">
              <ShoppingCart
                size={34}
                className="mx-auto text-slate-500"
              />

              <p className="mt-3 text-sm text-slate-400">
                {searchTerm
                  ? "No purchases match your search."
                  : "No purchases recorded yet."}
              </p>

              {!searchTerm && (
                <button
                  onClick={openAddModal}
                  className="mt-4 text-sm text-violet-400 hover:text-violet-300"
                >
                  Create your first purchase →
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">
                    Purchase
                  </th>

                  <th className="px-6 py-4">
                    Supplier
                  </th>

                  <th className="px-6 py-4">
                    Amount
                  </th>

                  <th className="px-6 py-4">
                    Date
                  </th>

                  <th className="px-6 py-4 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredPurchases.map((purchase) => (
                  <tr
                    key={purchase.purchase_id}
                    className="border-b border-white/5 transition hover:bg-white/[0.025]"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/10 text-violet-400">
                          <ShoppingCart size={18} />
                        </div>

                        <div>
                          <p className="font-medium">
                            Purchase #{purchase.purchase_id}
                          </p>

                          <p className="text-xs text-slate-500">
                            Supplier order
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <span className="rounded-lg border border-blue-400/10 bg-blue-400/10 px-3 py-1.5 text-xs text-blue-300">
                        {purchase.supplier}
                      </span>
                    </td>

                    <td className="px-6 py-5 font-semibold text-emerald-400">
                      {formatCurrency(Number(purchase.total_amount), appSettings.currency)}
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-400">
                      {formatDateTime(purchase.purchase_date, appSettings.dateFormat)}
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex justify-end">
                        <button
                          onClick={() =>
                            viewDetails(purchase.purchase_id)
                          }
                          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                        >
                          <Eye size={15} />
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD PURCHASE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#0b101c] shadow-2xl shadow-black/60">
            <div className="flex items-center justify-between border-b border-white/10 px-7 py-5">
              <div>
                <h2 className="text-lg font-semibold">
                  Create Purchase
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Stock will increase automatically after
                  confirmation
                </p>
              </div>

              <button
                onClick={closeAddModal}
                className="rounded-xl border border-white/10 p-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={createPurchase}
              className="space-y-5 p-7"
            >
              {error && (
                <div className="flex items-center gap-3 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-400">
                  <AlertTriangle size={18} />
                  {error}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Supplier
                </label>

                <select
                  value={selectedSupplier}
                  onChange={(event) =>
                    setSelectedSupplier(event.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#101624] px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50"
                >
                  <option value="">
                    Select supplier
                  </option>

                  {suppliers.map((supplier) => (
                    <option
                      key={supplier.supplier_id}
                      value={supplier.supplier_id}
                    >
                      {supplier.company || supplier.name} —{" "}
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">
                      Add Products
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Add one or more items to this purchase
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <select
                    value={itemForm.product_id}
                    onChange={(event) =>
                      handleProductChange(event.target.value)
                    }
                    className="rounded-xl border border-white/10 bg-[#101624] px-3 py-3 text-sm text-white outline-none focus:border-violet-500/50"
                  >
                    <option value="">
                      Select product
                    </option>

                    {products.map((product) => (
                      <option
                        key={product.product_id}
                        value={product.product_id}
                      >
                        {product.name} — Stock {product.quantity}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={itemForm.quantity}
                    onChange={(event) =>
                      setItemForm((previous) => ({
                        ...previous,
                        quantity: event.target.value,
                      }))
                    }
                    placeholder="Quantity"
                    className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-500/50"
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemForm.unit_cost}
                    onChange={(event) =>
                      setItemForm((previous) => ({
                        ...previous,
                        unit_cost: event.target.value,
                      }))
                    }
                    placeholder="Unit cost"
                    className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-500/50"
                  />
                </div>

                <button
                  type="button"
                  onClick={addItem}
                  className="mt-3 flex items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-2.5 text-sm text-violet-300 transition hover:bg-violet-500/15"
                >
                  <Plus size={16} />
                  Add Item
                </button>
              </div>

              {purchaseItems.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-white/10">
                  <table className="w-full text-left">
                    <thead className="bg-white/[0.025]">
                      <tr className="text-xs uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-3">
                          Product
                        </th>
                        <th className="px-4 py-3">
                          Qty
                        </th>
                        <th className="px-4 py-3">
                          Unit Cost
                        </th>
                        <th className="px-4 py-3">
                          Subtotal
                        </th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>

                    <tbody>
                      {purchaseItems.map((item, index) => (
                        <tr
                          key={`${item.product_id}-${index}`}
                          className="border-t border-white/5"
                        >
                          <td className="px-4 py-3 text-sm">
                            {getProductName(item.product_id)}
                          </td>

                          <td className="px-4 py-3 text-sm text-slate-300">
                            {item.quantity}
                          </td>

                          <td className="px-4 py-3 text-sm text-slate-300">
                            {formatCurrency(Number(item.unit_cost), appSettings.currency)}
                          </td>

                          <td className="px-4 py-3 text-sm font-medium">
                            ₹
                            {(
                              Number(item.quantity) *
                              Number(item.unit_cost)
                            ).toLocaleString("en-IN", {
                              maximumFractionDigits: 2,
                            })}
                          </td>

                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                removeItem(index)
                              }
                              className="text-xs text-red-400 hover:text-red-300"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex items-center justify-between rounded-xl border border-emerald-400/10 bg-emerald-400/5 px-5 py-4">
                <div>
                  <p className="text-sm text-slate-400">
                    Purchase Total
                  </p>
                  <p className="mt-1 text-xl font-bold text-emerald-400">
                    {formatCurrency(purchaseTotal, appSettings.currency)}
                  </p>
                </div>

                <p className="text-xs text-slate-500">
                  {purchaseItems.length} item
                  {purchaseItems.length === 1 ? "" : "s"} added
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAddModal}
                  disabled={submitting}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm text-slate-300 transition hover:bg-white/[0.06] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 text-sm font-semibold shadow-lg shadow-violet-600/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting && (
                    <RefreshCw
                      size={16}
                      className="animate-spin"
                    />
                  )}
                  {submitting
                    ? "Creating..."
                    : "Create Purchase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILS MODAL */}
      {showDetailsModal && selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0b101c] shadow-2xl shadow-black/60">
            <div className="flex items-center justify-between border-b border-white/10 px-7 py-5">
              <div>
                <p className="text-xs text-slate-500">
                  Purchase Details
                </p>

                <h2 className="mt-1 text-lg font-semibold">
                  Purchase #{selectedPurchase.purchase_id}
                </h2>
              </div>

              <button
                onClick={() =>
                  setShowDetailsModal(false)
                }
                className="rounded-xl border border-white/10 p-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-7">
              <div className="grid grid-cols-3 gap-3">
                <InfoCard
                  label="Supplier"
                  value={selectedPurchase.supplier}
                />

                <InfoCard
                  label="Total"
                  value={formatCurrency(Number(selectedPurchase.total_amount), appSettings.currency)}
                />

                <InfoCard
                  label="Date"
                  value={formatDateTime(
                    selectedPurchase.purchase_date,
                    appSettings.dateFormat
                  )}
                />
              </div>

              <div className="overflow-hidden rounded-xl border border-white/10">
                <table className="w-full text-left">
                  <thead className="bg-white/[0.025]">
                    <tr className="text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3">
                        Product
                      </th>
                      <th className="px-4 py-3">
                        Qty
                      </th>
                      <th className="px-4 py-3">
                        Unit Cost
                      </th>
                      <th className="px-4 py-3">
                        Subtotal
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedPurchase.items.map((item) => (
                      <tr
                        key={item.purchase_item_id}
                        className="border-t border-white/5"
                      >
                        <td className="px-4 py-3 text-sm">
                          {item.product_name}
                        </td>

                        <td className="px-4 py-3 text-sm text-slate-300">
                          {item.quantity}
                        </td>

                        <td className="px-4 py-3 text-sm text-slate-300">
                          ₹
                          {Number(
                            item.unit_cost
                          ).toLocaleString("en-IN", {
                            maximumFractionDigits: 2,
                          })}
                        </td>

                        <td className="px-4 py-3 text-sm font-medium">
                          ₹
                          {Number(
                            item.subtotal
                          ).toLocaleString("en-IN", {
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-emerald-400/10 bg-emerald-400/5 p-4">
                <CheckCircle2
                  size={18}
                  className="text-emerald-400"
                />

                <p className="text-sm text-slate-300">
                  This purchase has been recorded and the
                  product stock was increased automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconStyle,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  iconStyle: string;
}) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-xl shadow-black/20 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/30 hover:shadow-violet-500/10">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {subtitle}
          </p>
        </div>

        <div
          className={`rounded-xl bg-gradient-to-br p-3 ${iconStyle}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-2 truncate text-sm font-medium text-slate-200">
        {value}
      </p>
    </div>
  );
}

export default Purchases;
