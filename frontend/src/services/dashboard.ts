const API_BASE = "";

export type DashboardProduct = {
  product_id: number;
  name: string;
  category: string;
  price: number;
  quantity: number;
  reorder_level: number;
  supplier?: string | null;
};

export type DashboardSale = {
  sale_id: number;
  customer_name: string | null;
  total_amount: number;
  sale_date: string;
};

export type DashboardPurchase = {
  purchase_id: number;
  supplier_id: number;
  supplier: string;
  total_amount: number;
  purchase_date: string;
};

export type DashboardSupplier = {
  supplier_id: number;
  name: string;
  company: string | null;
  phone?: string | null;
  email?: string | null;
};

export type DashboardData = {
  products: DashboardProduct[];
  sales: DashboardSale[];
  purchases: DashboardPurchase[];
  suppliers: DashboardSupplier[];
};

export async function fetchDashboardData(): Promise<DashboardData> {
  const [
    productsResponse,
    salesResponse,
    purchasesResponse,
    suppliersResponse,
  ] = await Promise.all([
    fetch(`${API_BASE}/api/products`),
    fetch(`${API_BASE}/api/sales`),
    fetch(`${API_BASE}/api/purchases`),
    fetch(`${API_BASE}/api/suppliers`),
  ]);

  if (
    !productsResponse.ok ||
    !salesResponse.ok ||
    !purchasesResponse.ok ||
    !suppliersResponse.ok
  ) {
    throw new Error("Failed to load dashboard data.");
  }

  const [
    productsData,
    salesData,
    purchasesData,
    suppliersData,
  ] = await Promise.all([
    productsResponse.json(),
    salesResponse.json(),
    purchasesResponse.json(),
    suppliersResponse.json(),
  ]);

  return {
    products: productsData.products || [],
    sales: salesData.sales || [],
    purchases: purchasesData.purchases || [],
    suppliers: suppliersData.suppliers || [],
  };
}
