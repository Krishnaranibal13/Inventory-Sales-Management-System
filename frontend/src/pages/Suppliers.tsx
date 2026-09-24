import { useEffect, useMemo, useState } from "react";

import {
  Truck,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  Building2,
  Package,
  Eye,
  Users,
} from "lucide-react";

type Supplier = {
  supplier_id: number;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  product_count: number;
  purchase_count: number;
};

type SupplierForm = {
  name: string;
  company: string;
  phone: string;
  email: string;
};

type SuppliersProps = {
  globalSearch?: string;
  onGlobalSearchChange?: (value: string) => void;
};

const API_URL = "";

function Suppliers({
  globalSearch = "",
  onGlobalSearchChange,
}: SuppliersProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState(globalSearch);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [form, setForm] = useState<SupplierForm>({
    name: "",
    company: "",
    phone: "",
    email: "",
  });

  const fetchSuppliers = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/suppliers`);
      if (!response.ok) throw new Error("Failed to fetch suppliers.");

      const data = await response.json();
      setSuppliers(data.suppliers || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load suppliers from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    setSearchTerm(globalSearch);
  }, [globalSearch]);

  const filteredSuppliers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return suppliers;

    return suppliers.filter((supplier) =>
      [supplier.name, supplier.company, supplier.phone, supplier.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    );
  }, [suppliers, searchTerm]);

  const totalSuppliers = suppliers.length;
  const linkedSuppliers = suppliers.filter((supplier) => supplier.product_count > 0).length;
  const totalProductsFromSuppliers = suppliers.reduce(
    (total, supplier) => total + Number(supplier.product_count || 0),
    0
  );
  const companies = new Set(
    suppliers.map((supplier) => supplier.company?.trim()).filter(Boolean)
  ).size;

  const updateSearch = (value: string) => {
    setSearchTerm(value);
    onGlobalSearchChange?.(value);
  };

  const resetForm = () => {
    setForm({ name: "", company: "", phone: "", email: "" });
    setFormError("");
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setForm({
      name: supplier.name || "",
      company: supplier.company || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
    });
    setFormError("");
    setOpenMenuId(null);
    setShowEditModal(true);
  };

  const closeModals = () => {
    if (submitting) return;
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingSupplier(null);
    setFormError("");
  };

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setFormError("");
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      setFormError("Supplier name is required.");
      return false;
    }

    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setFormError("Please enter a valid email address.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setFormError("");
    setSuccessMessage("");

    const isEdit = Boolean(editingSupplier);
    const url = isEdit
      ? `${API_URL}/api/suppliers/${editingSupplier!.supplier_id}`
      : `${API_URL}/api/suppliers`;

    try {
      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          company: form.company.trim() || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || `Failed to ${isEdit ? "update" : "create"} supplier.`);
      }

      closeModals();
      await fetchSuppliers();
      setSuccessMessage(
        isEdit
          ? "Supplier updated successfully!"
          : `Supplier created successfully! Supplier ID: ${data.supplier_id}`
      );
      window.setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      console.error(err);
      setFormError(err instanceof Error ? err.message : "Supplier operation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (supplier: Supplier) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${supplier.name}"?\n\nIf this supplier has purchase history, the database may prevent deletion.`
    );

    if (!confirmed) return;

    setDeletingId(supplier.supplier_id);
    setOpenMenuId(null);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(`${API_URL}/api/suppliers/${supplier.supplier_id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete supplier.");
      }

      setSuppliers((previous) =>
        previous.filter((item) => item.supplier_id !== supplier.supplier_id)
      );
      setSuccessMessage("Supplier deleted successfully!");
      window.setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to delete supplier.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (value: string) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Inventory Management</p>
          <h1 className="mt-1 text-3xl font-bold">Suppliers</h1>
          <p className="mt-1 text-sm text-slate-400">Manage your suppliers and vendor contacts</p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 text-sm font-semibold shadow-lg shadow-violet-600/20 transition hover:-translate-y-0.5"
        >
          <Plus size={18} />
          Add Supplier
        </button>
      </div>

      {successMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-400">
          <CheckCircle2 size={20} />
          {successMessage}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-400">
          <AlertTriangle size={20} />
          {error}
          <button onClick={() => setError("")} className="ml-auto rounded-lg p-1 hover:bg-white/5">
            <X size={17} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-4 gap-5">
        <MiniCard title="Total Suppliers" value={loading ? "..." : String(totalSuppliers)} subtitle="Registered vendors" icon={<Users size={20} />} />
        <MiniCard title="Companies" value={loading ? "..." : String(companies)} subtitle="Unique companies" icon={<Building2 size={20} />} />
        <MiniCard title="Linked Suppliers" value={loading ? "..." : String(linkedSuppliers)} subtitle="With products assigned" icon={<Package size={20} />} />
        <MiniCard title="Products Covered" value={loading ? "..." : String(totalProductsFromSuppliers)} subtitle="Supplier-linked products" icon={<Truck size={20} />} />
      </div>

      <div className="overflow-visible rounded-2xl border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <div>
            <h2 className="font-semibold">All Suppliers</h2>
            <p className="mt-1 text-xs text-slate-500">{filteredSuppliers.length} suppliers shown</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 focus-within:border-violet-500/40">
              <Search size={17} className="text-slate-500" />
              <input
                value={searchTerm}
                onChange={(event) => updateSearch(event.target.value)}
                placeholder="Search suppliers..."
                className="w-56 bg-transparent text-sm outline-none placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                <p className="mt-4 text-sm text-slate-400">Loading suppliers...</p>
              </div>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="flex min-h-64 items-center justify-center">
              <div className="text-center">
                <Truck size={35} className="mx-auto text-slate-500" />
                <p className="mt-3 text-sm text-slate-400">No suppliers found</p>
                <button onClick={openAddModal} className="mt-4 text-sm text-violet-400 hover:text-violet-300">
                  Add your first supplier →
                </button>
              </div>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Supplier</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Products</th>
                  <th className="px-6 py-4">Added</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.supplier_id} className="border-b border-white/5 transition hover:bg-white/[0.025]">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/10 text-violet-400">
                          <Truck size={19} />
                        </div>
                        <div>
                          <p className="font-medium">{supplier.name}</p>
                          <p className="text-xs text-slate-500">ID #{supplier.supplier_id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Building2 size={15} className="text-slate-500" />
                        {supplier.company || "—"}
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        {supplier.phone ? (
                          <div className="flex items-center gap-2 text-xs text-slate-300">
                            <Phone size={13} className="text-slate-500" />
                            {supplier.phone}
                          </div>
                        ) : null}
                        {supplier.email ? (
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Mail size={13} className="text-slate-500" />
                            {supplier.email}
                          </div>
                        ) : null}
                        {!supplier.phone && !supplier.email && <span className="text-sm text-slate-500">No contact info</span>}
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <span className={`rounded-lg border px-3 py-1.5 text-xs ${supplier.product_count > 0 ? "border-emerald-400/10 bg-emerald-400/10 text-emerald-300" : "border-white/10 bg-white/[0.03] text-slate-400"}`}>
                        {supplier.product_count} linked
                      </span>
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-400">
                      {formatDate(supplier.created_at)}
                    </td>

                    <td className="px-6 py-5">
                      <div className="relative flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(supplier)}
                          className="rounded-lg border border-white/10 p-2 text-slate-400 transition hover:border-blue-400/30 hover:bg-blue-400/10 hover:text-blue-400"
                          title="Edit Supplier"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() => handleDelete(supplier)}
                          disabled={deletingId === supplier.supplier_id}
                          className="rounded-lg border border-white/10 p-2 text-slate-400 transition hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-400 disabled:opacity-50"
                          title="Delete Supplier"
                        >
                          {deletingId === supplier.supplier_id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>

                        <button
                          onClick={() => setOpenMenuId((current) => current === supplier.supplier_id ? null : supplier.supplier_id)}
                          className="rounded-lg border border-white/10 p-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
                          title="More"
                        >
                          <MoreHorizontal size={16} />
                        </button>

                        {openMenuId === supplier.supplier_id && (
                          <div className="absolute right-0 top-11 z-30 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#0d111c] p-1 shadow-2xl shadow-black/50">
                            <button
                              onClick={() => { setViewingSupplier(supplier); setOpenMenuId(null); }}
                              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white"
                            >
                              <Eye size={16} />
                              View Details
                            </button>
                            <button
                              onClick={() => openEditModal(supplier)}
                              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white"
                            >
                              <Pencil size={16} />
                              Edit Supplier
                            </button>
                            <button
                              onClick={() => handleDelete(supplier)}
                              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-400 hover:bg-red-400/10"
                            >
                              <Trash2 size={16} />
                              Delete Supplier
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
          <p className="text-xs text-slate-500">Showing {filteredSuppliers.length} of {suppliers.length} suppliers</p>
          <span className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-500">{linkedSuppliers} linked</span>
        </div>
      </div>

      {viewingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-md">
          <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-[#0d111c] shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between border-b border-white/10 px-7 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400"><Truck size={20} /></div>
                <div>
                  <h2 className="text-lg font-semibold">Supplier Details</h2>
                  <p className="text-xs text-slate-500">ID #{viewingSupplier.supplier_id}</p>
                </div>
              </div>
              <button onClick={() => setViewingSupplier(null)} className="rounded-xl border border-white/10 p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white"><X size={18} /></button>
            </div>

            <div className="space-y-4 p-7">
              <div>
                <p className="text-xs text-slate-500">Supplier</p>
                <p className="mt-1 text-lg font-semibold">{viewingSupplier.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Detail label="Company" value={viewingSupplier.company || "Not provided"} />
                <Detail label="Phone" value={viewingSupplier.phone || "Not provided"} />
                <Detail label="Email" value={viewingSupplier.email || "Not provided"} />
                <Detail label="Products Linked" value={`${viewingSupplier.product_count} products`} />
                <Detail label="Purchase Orders" value={`${viewingSupplier.purchase_count} purchases`} />
                <Detail label="Added" value={formatDate(viewingSupplier.created_at)} />
              </div>

              <button onClick={() => setViewingSupplier(null)} className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 text-sm font-semibold shadow-lg shadow-violet-600/20">Close</button>
            </div>
          </div>
        </div>
      )}

      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-md">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#0d111c] shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between border-b border-white/10 px-7 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400"><Truck size={20} /></div>
                <div>
                  <h2 className="text-lg font-semibold">{showEditModal ? "Edit Supplier" : "Add New Supplier"}</h2>
                  <p className="text-xs text-slate-500">{showEditModal ? "Update supplier information" : "Add a new vendor to your inventory"}</p>
                </div>
              </div>
              <button onClick={closeModals} className="rounded-xl border border-white/10 p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-7">
              {formError && (
                <div className="flex items-center gap-3 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-400"><AlertTriangle size={18} />{formError}</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Field label="Supplier Name" name="name" value={form.name} onChange={handleFormChange} placeholder="e.g. Rahul" required />
                <Field label="Company" name="company" value={form.company} onChange={handleFormChange} placeholder="e.g. ABC Distributors" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Phone" name="phone" value={form.phone} onChange={handleFormChange} placeholder="9876543210" />
                <Field label="Email" name="email" type="email" value={form.email} onChange={handleFormChange} placeholder="supplier@example.com" />
              </div>

              <div className="flex justify-end gap-3 border-t border-white/10 pt-5">
                <button type="button" onClick={closeModals} disabled={submitting} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-slate-300 hover:bg-white/[0.05] disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={submitting} className="flex min-w-36 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 text-sm font-semibold shadow-lg shadow-violet-600/20 disabled:opacity-60">
                  {submitting ? <><Loader2 size={17} className="animate-spin" />Saving...</> : <>{showEditModal ? <Pencil size={17} /> : <Plus size={17} />}{showEditModal ? "Save Changes" : "Add Supplier"}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, name, value, onChange, placeholder, type = "text", required = false }: {
  label: string;
  name: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">{label}{required && <span className="ml-1 text-violet-400">*</span>}</label>
      <input name={name} type={type} value={value} onChange={onChange} required={required} placeholder={placeholder} className="w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-500/50" />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-200">{value}</p>
    </div>
  );
}

function MiniCard({ title, value, subtitle, icon }: { title: string; value: string; subtitle: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-xl shadow-black/20 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className="rounded-xl bg-violet-500/10 p-3 text-violet-400">{icon}</div>
      </div>
    </div>
  );
}

export default Suppliers;
