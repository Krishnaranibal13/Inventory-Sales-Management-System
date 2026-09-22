import { useEffect, useMemo, useState } from "react";
import { formatCurrency, type AppSettings } from "../settings";

import {
  Package,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  AlertTriangle,
  X,
  Loader2,
  CheckCircle2,
  Filter,
} from "lucide-react";


type Product = {
  product_id: number;
  name: string;
  category: string;
  price: number;
  quantity: number;
  reorder_level: number;
  supplier: string | null;
};


type ProductsProps = {
  appSettings: AppSettings;
  onLowStockCountChange?: (count: number) => void;
};

type ProductForm = {
  name: string;
  category: string;
  price: string;
  quantity: string;
  reorder_level: string;
  supplier_id: string;
};


function Products({ appSettings, onLowStockCountChange }: ProductsProps) {

  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("All Categories");

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [showDetailsModal, setShowDetailsModal] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [formError, setFormError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");


  const [form, setForm] = useState<ProductForm>({
    name: "",
    category: "",
    price: "",
    quantity: "",
    reorder_level: "",
    supplier_id: "",
  });


  // =========================================================
  // FETCH PRODUCTS
  // =========================================================

  const fetchProducts = async () => {

    setLoading(true);
    setError("");

    try {

      const response = await fetch(
        "https://inventory-sales-management-system-production-a7df.up.railway.app/api/products"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch products.");
      }

      const data = await response.json();

      setProducts(data.products || []);

    } catch (error) {

      console.error(error);

      setError(
        "Unable to load products from server."
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {

    fetchProducts();

  }, []);


  // =========================================================
  // CATEGORIES
  // =========================================================

  const categories = useMemo(() => {

    const uniqueCategories = Array.from(
      new Set(
        products.map(
          (product) => product.category
        )
      )
    );

    return [
      "All Categories",
      ...uniqueCategories,
    ];

  }, [products]);


  // =========================================================
  // FILTERED PRODUCTS
  // =========================================================

  const filteredProducts = useMemo(() => {

    const search = searchTerm.toLowerCase();

    return products.filter((product) => {

      const matchesSearch =
        product.name
          .toLowerCase()
          .includes(search) ||
        product.category
          .toLowerCase()
          .includes(search) ||
        (product.supplier || "")
          .toLowerCase()
          .includes(search);

      const matchesCategory =
        selectedCategory ===
          "All Categories" ||
        product.category ===
          selectedCategory;

      return (
        matchesSearch &&
        matchesCategory
      );

    });

  }, [
    products,
    searchTerm,
    selectedCategory,
  ]);


  // =========================================================
  // STATISTICS
  // =========================================================

  const totalProducts =
    products.length;

  const totalStock =
    products.reduce(
      (total, product) =>
        total + product.quantity,
      0
    );

  const lowStockCount =
    products.filter(
      (product) =>
        product.quantity <=
        appSettings.lowStockThreshold
    ).length;

  useEffect(() => {
    onLowStockCountChange?.(appSettings.lowStockAlerts ? lowStockCount : 0);
  }, [appSettings.lowStockAlerts, lowStockCount, onLowStockCountChange]);


  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleFormChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {

    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFormError("");

  };


  // =========================================================
  // OPEN ADD MODAL
  // =========================================================

  const openAddModal = () => {

    setForm({
      name: "",
      category: "",
      price: "",
      quantity: "",
      reorder_level: "",
      supplier_id: "",
    });

    setFormError("");

    setShowAddModal(true);

  };


  // =========================================================
  // OPEN EDIT MODAL
  // =========================================================

  const openEditModal = (
    product: Product
  ) => {

    setEditingProduct(product);

    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      quantity: String(product.quantity),
      reorder_level:
        String(product.reorder_level),
      supplier_id: "",
    });

    setFormError("");

    setShowEditModal(true);

  };


  // =========================================================
  // CLOSE MODALS
  // =========================================================

  const closeModals = () => {

    if (submitting) {
      return;
    }

    setShowAddModal(false);
    setShowEditModal(false);
    setEditingProduct(null);
    setFormError("");

  };


  // =========================================================
  // ADD PRODUCT
  // =========================================================

  const handleAddProduct = async (
    event: React.FormEvent
  ) => {

    event.preventDefault();

    setFormError("");
    setSuccessMessage("");


    if (!form.name.trim()) {

      setFormError(
        "Product name is required."
      );

      return;

    }


    if (!form.category.trim()) {

      setFormError(
        "Category is required."
      );

      return;

    }


    const price =
      Number(form.price);

    const quantity =
      Number(form.quantity);

    const reorderLevel =
      Number(form.reorder_level);


    if (
      form.price === "" ||
      Number.isNaN(price) ||
      price < 0
    ) {

      setFormError(
        "Please enter a valid price."
      );

      return;

    }


    if (
      form.quantity === "" ||
      Number.isNaN(quantity) ||
      quantity < 0 ||
      !Number.isInteger(quantity)
    ) {

      setFormError(
        "Please enter a valid stock quantity."
      );

      return;

    }


    if (
      form.reorder_level === "" ||
      Number.isNaN(reorderLevel) ||
      reorderLevel < 0 ||
      !Number.isInteger(reorderLevel)
    ) {

      setFormError(
        "Please enter a valid reorder level."
      );

      return;

    }


    let supplierId:
      number | null = null;


    if (
      form.supplier_id.trim()
    ) {

      supplierId =
        Number(form.supplier_id);

      if (
        Number.isNaN(supplierId) ||
        !Number.isInteger(
          supplierId
        ) ||
        supplierId <= 0
      ) {

        setFormError(
          "Supplier ID must be valid."
        );

        return;

      }

    }


    setSubmitting(true);


    try {

      const response =
        await fetch(
          "https://inventory-sales-management-system-production-a7df.up.railway.app/api/products",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name:
                form.name.trim(),

              category:
                form.category.trim(),

              price,

              quantity,

              reorder_level:
                reorderLevel,

              supplier_id:
                supplierId,
            }),
          }
        );


      const data =
        await response.json();


      if (
        !response.ok ||
        !data.success
      ) {

        throw new Error(
          data.message ||
          "Failed to create product."
        );

      }


      setShowAddModal(false);

      await fetchProducts();


      setSuccessMessage(
        `Product created successfully! Product ID: ${data.product_id}`
      );


      setTimeout(() => {
        setSuccessMessage("");
      }, 4000);


    } catch (error) {

      console.error(error);

      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to create product."
      );

    } finally {

      setSubmitting(false);

    }

  };


  // =========================================================
  // UPDATE PRODUCT
  // =========================================================

  const handleUpdateProduct =
    async (
      event: React.FormEvent
    ) => {

      event.preventDefault();

      if (!editingProduct) {
        return;
      }

      setFormError("");
      setSuccessMessage("");


      const price =
        Number(form.price);

      const reorderLevel =
        Number(form.reorder_level);


      if (!form.name.trim()) {

        setFormError(
          "Product name is required."
        );

        return;

      }


      if (!form.category.trim()) {

        setFormError(
          "Category is required."
        );

        return;

      }


      if (
        form.price === "" ||
        Number.isNaN(price) ||
        price < 0
      ) {

        setFormError(
          "Please enter a valid price."
        );

        return;

      }


      if (
        form.reorder_level === "" ||
        Number.isNaN(reorderLevel) ||
        reorderLevel < 0 ||
        !Number.isInteger(
          reorderLevel
        )
      ) {

        setFormError(
          "Please enter a valid reorder level."
        );

        return;

      }


      setSubmitting(true);


      try {

        const response =
          await fetch(
            `https://inventory-sales-management-system-production-a7df.up.railway.app/api/products/${editingProduct.product_id}`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                name:
                  form.name.trim(),

                category:
                  form.category.trim(),

                price,

                reorder_level:
                  reorderLevel,
              }),
            }
          );


        const data =
          await response.json();


        if (
          !response.ok ||
          !data.success
        ) {

          throw new Error(
            data.message ||
            "Failed to update product."
          );

        }


        setShowEditModal(false);

        setEditingProduct(null);

        await fetchProducts();


        setSuccessMessage(
          "Product updated successfully!"
        );


        setTimeout(() => {
          setSuccessMessage("");
        }, 4000);


      } catch (error) {

        console.error(error);

        setFormError(
          error instanceof Error
            ? error.message
            : "Failed to update product."
        );

      } finally {

        setSubmitting(false);

      }

    };


  // =========================================================
  // DELETE PRODUCT
  // =========================================================

  const handleDeleteProduct =
    async (
      product: Product
    ) => {

      const confirmed =
        window.confirm(
          `Are you sure you want to delete "${product.name}"?\n\nThis action cannot be undone.`
        );


      if (!confirmed) {
        return;
      }


      setDeletingId(
        product.product_id
      );

      setError("");
      setSuccessMessage("");


      try {

        const response =
          await fetch(
            `https://inventory-sales-management-system-production-a7df.up.railway.app/api/products/${product.product_id}`,
            {
              method: "DELETE",
            }
          );


        const data =
          await response.json();


        if (
          !response.ok ||
          !data.success
        ) {

          throw new Error(
            data.message ||
            "Failed to delete product."
          );

        }


        setProducts(
          (previous) =>
            previous.filter(
              (item) =>
                item.product_id !==
                product.product_id
            )
        );


        setSuccessMessage(
          "Product deleted successfully!"
        );


        setTimeout(() => {
          setSuccessMessage("");
        }, 4000);


      } catch (error) {

        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to delete product."
        );

      } finally {

        setDeletingId(null);

      }

    };


  return (

    <div className="space-y-7">


      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-slate-400">
            Inventory Management
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            Products
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Manage your products and stock levels
          </p>

        </div>


        <button
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 text-sm font-semibold shadow-lg shadow-violet-600/20 transition hover:-translate-y-0.5"
        >

          <Plus size={18} />

          Add Product

        </button>

      </div>


      {/* ================================================= */}
      {/* SUCCESS */}
      {/* ================================================= */}

      {successMessage && (

        <div className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-400">

          <CheckCircle2 size={20} />

          {successMessage}

        </div>

      )}


      {/* ================================================= */}
      {/* ERROR */}
      {/* ================================================= */}

      {error && (

        <div className="flex items-center gap-3 rounded-xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-400">

          <AlertTriangle size={20} />

          {error}

          <button
            onClick={() => setError("")}
            className="ml-auto"
          >
            <X size={17} />
          </button>

        </div>

      )}


      {/* ================================================= */}
      {/* STATS */}
      {/* ================================================= */}

      <div className="grid grid-cols-3 gap-5">

        <MiniCard
          title="Total Products"
          value={
            loading
              ? "..."
              : totalProducts.toString()
          }
          subtitle="Active products"
          icon={<Package size={20} />}
        />


        <MiniCard
          title="Total Stock"
          value={
            loading
              ? "..."
              : totalStock.toString()
          }
          subtitle="Units available"
          icon={<Package size={20} />}
        />


        <MiniCard
          title="Low Stock"
          value={
            loading
              ? "..."
              : lowStockCount.toString()
          }
          subtitle="Needs attention"
          icon={<AlertTriangle size={20} />}
        />

      </div>


      {/* ================================================= */}
      {/* PRODUCTS CARD */}
      {/* ================================================= */}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/20 backdrop-blur-xl">


        {/* TOOLBAR */}

        <div className="flex items-center justify-between border-b border-white/10 p-5">

          <div>

            <h2 className="font-semibold">
              All Products
            </h2>

            <p className="mt-1 text-xs text-slate-500">

              {filteredProducts.length} products shown

            </p>

          </div>


          <div className="flex items-center gap-3">


            {/* SEARCH */}

            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">

              <Search
                size={17}
                className="text-slate-500"
              />

              <input
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Search products..."
                className="w-48 bg-transparent text-sm outline-none placeholder:text-slate-500"
              />

            </div>


            {/* CATEGORY FILTER */}

            <div className="relative flex items-center">

              <Filter
                size={16}
                className="pointer-events-none absolute left-3 text-slate-500"
              />

              <select
                value={selectedCategory}
                onChange={(event) =>
                  setSelectedCategory(
                    event.target.value
                  )
                }
                className="appearance-none rounded-xl border border-white/10 bg-[#111622] py-2.5 pl-9 pr-9 text-sm text-slate-300 outline-none hover:bg-white/[0.06] focus:border-violet-500/50"
              >

                {categories.map(
                  (category) => (

                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>

                  )
                )}

              </select>

            </div>

          </div>

        </div>


        {/* ================================================= */}
        {/* TABLE */}
        {/* ================================================= */}

        <div className="overflow-x-auto">

          {loading ? (

            <div className="flex min-h-64 items-center justify-center">

              <div className="text-center">

                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />

                <p className="mt-4 text-sm text-slate-400">
                  Loading products...
                </p>

              </div>

            </div>

          ) : filteredProducts.length === 0 ? (

            <div className="flex min-h-64 items-center justify-center">

              <div className="text-center">

                <Package
                  size={35}
                  className="mx-auto text-slate-500"
                />

                <p className="mt-3 text-sm text-slate-400">
                  No products found
                </p>

              </div>

            </div>

          ) : (

            <table className="w-full text-left">

              <thead>

                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500">

                  <th className="px-6 py-4">
                    Product
                  </th>

                  <th className="px-6 py-4">
                    Category
                  </th>

                  <th className="px-6 py-4">
                    Price
                  </th>

                  <th className="px-6 py-4">
                    Stock
                  </th>

                  <th className="px-6 py-4">
                    Supplier
                  </th>

                  <th className="px-6 py-4 text-right">
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredProducts.map(
                  (product) => (

                    <tr
                      key={
                        product.product_id
                      }
                      className="border-b border-white/5 transition hover:bg-white/[0.025]"
                    >

                      {/* PRODUCT */}

                      <td className="px-6 py-5">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/10 text-violet-400">

                            <Package size={19} />

                          </div>


                          <div>

                            <p className="font-medium">
                              {product.name}
                            </p>

                            <p className="text-xs text-slate-500">
                              ID #
                              {
                                product.product_id
                              }
                            </p>

                          </div>

                        </div>

                      </td>


                      {/* CATEGORY */}

                      <td className="px-6 py-5">

                        <span className="rounded-lg border border-blue-400/10 bg-blue-400/10 px-3 py-1.5 text-xs text-blue-300">

                          {product.category}

                        </span>

                      </td>


                      {/* PRICE */}

                      <td className="px-6 py-5 font-medium">

                        {formatCurrency(Number(product.price), appSettings.currency)}

                      </td>


                      {/* STOCK */}

                      <td className="px-6 py-5">

                        <div className="flex items-center gap-3">

                          <span
                            className={
                              product.quantity <=
                              product.reorder_level
                                ? "text-orange-400"
                                : "text-emerald-400"
                            }
                          >
                            {
                              product.quantity
                            }
                          </span>

                          <span className="text-xs text-slate-500">
                            units
                          </span>

                        </div>

                      </td>


                      {/* SUPPLIER */}

                      <td className="px-6 py-5 text-sm text-slate-400">

                        {
                          product.supplier ||
                          "—"
                        }

                      </td>


                      {/* ACTIONS */}

                      <td className="px-6 py-5">

                        <div className="flex justify-end gap-2">


                          {/* EDIT */}

                          <button
                            onClick={() =>
                              openEditModal(
                                product
                              )
                            }
                            className="rounded-lg border border-white/10 p-2 text-slate-400 transition hover:border-blue-400/30 hover:bg-blue-400/10 hover:text-blue-400"
                            title="Edit Product"
                          >

                            <Pencil size={16} />

                          </button>


                          {/* DELETE */}

                          <button
                            onClick={() =>
                              handleDeleteProduct(
                                product
                              )
                            }
                            disabled={
                              deletingId ===
                              product.product_id
                            }
                            className="rounded-lg border border-white/10 p-2 text-slate-400 transition hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-400 disabled:opacity-50"
                            title="Delete Product"
                          >

                            {deletingId ===
                            product.product_id ? (

                              <Loader2
                                size={16}
                                className="animate-spin"
                              />

                            ) : (

                              <Trash2 size={16} />

                            )}

                          </button>


                          {/* MORE */}

                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowDetailsModal(true);
                            }}
                            className="rounded-lg border border-white/10 p-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
                            title="More"
                          >

                            <MoreHorizontal
                              size={16}
                            />

                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          )}

        </div>


        {/* FOOTER */}

        <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">

          <p className="text-xs text-slate-500">

            Showing{" "}
            {filteredProducts.length}
            {" "}of{" "}
            {products.length}
            {" "}products

          </p>


          <div className="flex gap-2">

            <button
              disabled
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-600"
            >
              Previous
            </button>

            <button className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium">
              1
            </button>

            <button
              disabled
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-600"
            >
              Next
            </button>

          </div>

        </div>

      </div>


      {/* ================================================= */}
      {/* PRODUCT DETAILS MODAL */}
      {/* ================================================= */}

      {showDetailsModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-md">
          <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-[#0d111c] shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between border-b border-white/10 px-7 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                  <Package size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Product Details</p>
                  <h2 className="mt-1 text-lg font-semibold">
                    {selectedProduct.name}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedProduct(null);
                }}
                className="rounded-xl border border-white/10 p-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 p-7">
              <ProductDetail label="Product ID" value={`#${selectedProduct.product_id}`} />
              <ProductDetail label="Category" value={selectedProduct.category} />
              <ProductDetail
                label="Price"
                value={formatCurrency(Number(selectedProduct.price), appSettings.currency)}
              />
              <ProductDetail label="Current Stock" value={`${selectedProduct.quantity} units`} />
              <ProductDetail label="Reorder Level" value={`${selectedProduct.reorder_level} units`} />
              <ProductDetail label="Supplier" value={selectedProduct.supplier || "Not assigned"} />
            </div>

            <div className="flex justify-end gap-3 border-t border-white/10 px-7 py-5">
              <button
                type="button"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedProduct(null);
                  openEditModal(selectedProduct);
                }}
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold transition hover:bg-violet-500"
              >
                <Pencil size={15} />
                Edit Product
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ================================================= */}
      {/* ADD / EDIT MODAL */}
      {/* ================================================= */}

      {(showAddModal ||
        showEditModal) && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-md">


          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#0d111c] shadow-2xl shadow-black/50">


            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-white/10 px-7 py-5">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">

                  <Package size={20} />

                </div>


                <div>

                  <h2 className="text-lg font-semibold">

                    {showEditModal
                      ? "Edit Product"
                      : "Add New Product"}

                  </h2>

                  <p className="text-xs text-slate-500">

                    {showEditModal
                      ? "Update product information"
                      : "Add a new item to your inventory"}

                  </p>

                </div>

              </div>


              <button
                onClick={closeModals}
                className="rounded-xl border border-white/10 p-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
              >

                <X size={18} />

              </button>

            </div>


            {/* FORM */}

            <form
              onSubmit={
                showEditModal
                  ? handleUpdateProduct
                  : handleAddProduct
              }
              className="space-y-5 p-7"
            >


              {/* FORM ERROR */}

              {formError && (

                <div className="flex items-center gap-3 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-400">

                  <AlertTriangle
                    size={18}
                  />

                  {formError}

                </div>

              )}


              {/* NAME */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Product Name
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={
                    handleFormChange
                  }
                  placeholder="e.g. Wireless Keyboard"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-500/50"
                />

              </div>


              {/* CATEGORY + PRICE */}

              <div className="grid grid-cols-2 gap-4">

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Category
                  </label>

                  <input
                    name="category"
                    value={form.category}
                    onChange={
                      handleFormChange
                    }
                    placeholder="Electronics"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-500/50"
                  />

                </div>


                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Price
                  </label>

                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={
                      handleFormChange
                    }
                    placeholder="799"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-500/50"
                  />

                </div>

              </div>


              {/* QUANTITY + REORDER */}

              <div className="grid grid-cols-2 gap-4">

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-300">

                    {showEditModal
                      ? "Current Stock"
                      : "Initial Stock"}

                  </label>

                  <input
                    name="quantity"
                    type="number"
                    min="0"
                    step="1"
                    value={form.quantity}
                    onChange={
                      handleFormChange
                    }
                    disabled={
                      showEditModal
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                  />

                  {showEditModal && (

                    <p className="mt-2 text-xs text-slate-500">
                      Stock is changed through purchases/sales.
                    </p>

                  )}

                </div>


                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Reorder Level
                  </label>

                  <input
                    name="reorder_level"
                    type="number"
                    min="0"
                    step="1"
                    value={
                      form.reorder_level
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="5"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-500/50"
                  />

                </div>

              </div>


              {/* SUPPLIER */}

              {!showEditModal && (

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-300">

                    Supplier ID

                    <span className="ml-2 text-xs font-normal text-slate-500">
                      Optional
                    </span>

                  </label>

                  <input
                    name="supplier_id"
                    type="number"
                    min="1"
                    step="1"
                    value={
                      form.supplier_id
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="e.g. 1"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-500/50"
                  />

                </div>

              )}


              {/* BUTTONS */}

              <div className="flex justify-end gap-3 border-t border-white/10 pt-5">

                <button
                  type="button"
                  onClick={closeModals}
                  disabled={submitting}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-slate-300 hover:bg-white/[0.05] disabled:opacity-50"
                >

                  Cancel

                </button>


                <button
                  type="submit"
                  disabled={
                    submitting
                  }
                  className="flex min-w-36 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 text-sm font-semibold shadow-lg shadow-violet-600/20 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {submitting ? (

                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />

                      Saving...

                    </>

                  ) : (

                    <>
                      {showEditModal
                        ? <Pencil size={17} />
                        : <Plus size={17} />
                      }

                      {showEditModal
                        ? "Save Changes"
                        : "Add Product"}

                    </>

                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );
}


/* ========================================================= */
/* MINI CARD */
/* ========================================================= */

function MiniCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) {

  return (

    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-xl shadow-black/20 backdrop-blur-xl">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {subtitle}
          </p>

        </div>


        <div className="rounded-xl bg-violet-500/10 p-3 text-violet-400">

          {icon}

        </div>

      </div>

    </div>

  );

}



function ProductDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 truncate text-sm font-medium text-slate-200">{value}</p>
    </div>
  );
}

export default Products;