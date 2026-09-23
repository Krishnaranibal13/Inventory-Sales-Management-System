import { useEffect, useState } from "react";
import Products from "./pages/Products";
import Suppliers from "./pages/Suppliers";
import Purchases from "./pages/Purchases";
import Sales from "./pages/Sales";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/Profile";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import { clearToken, getCurrentUser, getToken, type AuthUser } from "./auth";
import {
  fetchDashboardData,
  type DashboardData,
} from "./services/dashboard";

import {
  formatCurrency,
  loadSettings,
  type AppNotification,
  type AppSettings,
} from "./settings";

import {
  LayoutDashboard,
  Package,
  Truck,
  ShoppingCart,
  Receipt,
  BarChart3,
  Settings as SettingsIcon,
  Bell,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Boxes,
} from "lucide-react";


function resolveTheme(theme: AppSettings["theme"]): "dark" | "light" {
  if (theme === "dark") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function App() {

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    products: [],
    sales: [],
    purchases: [],
    suppliers: [],
  });

  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  const [activePage, setActivePage] = useState("dashboard");
  const [globalSearch, setGlobalSearch] = useState("");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>(loadSettings);

  const totalProducts = dashboardData.products.length;

  const currentStock = dashboardData.products.reduce(
    (total, product) => total + Number(product.quantity || 0),
    0
  );

  const totalSales = dashboardData.sales.reduce(
    (total, sale) => total + Number(sale.total_amount || 0),
    0
  );

  const totalSuppliers = dashboardData.suppliers.length;

  const lowStockProducts = dashboardData.products.filter(
    (product) =>
      Number(product.quantity) <= appSettings.lowStockThreshold
  );

  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">(() => resolveTheme(loadSettings().theme));
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [salesPeriod, setSalesPeriod] = useState<"week" | "month" | "year">("month");


  useEffect(() => {
    if (activePage !== "dashboard") return;

    const loadDashboard = async () => {
      try {
        setDashboardLoading(true);
        setDashboardError("");

        const data = await fetchDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error("Dashboard loading failed:", error);
        setDashboardError("Unable to load dashboard data.");
      } finally {
        setDashboardLoading(false);
      }
    };

    loadDashboard();
  }, [activePage]);


  useEffect(() => {
    const restoreSession = async () => {
      if (!getToken()) {
        setAuthLoading(false);
        return;
      }
      try {
        const user = await getCurrentUser();
        setAuthUser(user);
      } catch {
        clearToken();
        setAuthUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
    restoreSession();
  }, []);

  useEffect(() => {
    const applySettings = (nextSettings: AppSettings) => {
      setAppSettings(nextSettings);
      setResolvedTheme(resolveTheme(nextSettings.theme));
    };

    const handleSettingsChange = (event: Event) => {
      const customEvent = event as CustomEvent<AppSettings>;
      applySettings(customEvent.detail || loadSettings());
    };

    const handleStorageChange = () => applySettings(loadSettings());

    window.addEventListener("inventory-settings-changed", handleSettingsChange);
    window.addEventListener("storage", handleStorageChange);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const handleSystemThemeChange = () => {
      const current = loadSettings();
      if (current.theme === "system") setResolvedTheme(resolveTheme("system"));
    };
    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      window.removeEventListener("inventory-settings-changed", handleSettingsChange);
      window.removeEventListener("storage", handleStorageChange);
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, []);

  useEffect(() => {
    const handleNotification = (event: Event) => {
      const customEvent = event as CustomEvent<AppNotification>;
      const notification = customEvent.detail;
      if (!notification) return;

      const current = loadSettings();
      if (notification.type === "sale" && !current.salesNotifications) return;
      if (notification.type === "purchase" && !current.purchaseNotifications) return;
      if (notification.type === "low-stock" && !current.lowStockAlerts) return;
      if (notification.type === "system" && !current.systemNotifications) return;

      setNotifications((previous) => [notification, ...previous].slice(0, 6));
    };

    window.addEventListener("inventory-notification", handleNotification);
    return () => window.removeEventListener("inventory-notification", handleNotification);
  }, []);

  useEffect(() => {
    const fetchLowStockCount = async () => {
      if (!appSettings.lowStockAlerts) {
        setLowStockCount(0);
        return;
      }

      try {
        const response = await fetch("https://inventory-sales-management-system-production-a7df.up.railway.app/api/products");
        const data = await response.json();
        const products = data.products || [];
        const count = products.filter(
          (product: { quantity: number }) =>
            Number(product.quantity) <= appSettings.lowStockThreshold
        ).length;
        setLowStockCount(count);
      } catch {
        setLowStockCount(0);
      }
    };

    fetchLowStockCount();
  }, [appSettings.lowStockAlerts, appSettings.lowStockThreshold]);

  useEffect(() => {
    if (!appSettings.systemNotifications) return;
    const timer = window.setTimeout(() => {
      const current = loadSettings();
      if (!current.systemNotifications) return;

      const systemNotification: AppNotification = {
        id: `system-${Date.now()}`,
        type: "system",
        title: "System online",
        message: "Inventory Management API is ready.",
        createdAt: Date.now(),
      };

      setNotifications((previous) => [systemNotification, ...previous].slice(0, 6));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [appSettings.systemNotifications]);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.dataset.density = appSettings.density;

    return () => {
      delete document.documentElement.dataset.theme;
      delete document.documentElement.dataset.density;
    };
  }, [resolvedTheme, appSettings.density]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050914] text-white">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (!authUser) {
    return authView === "login" ? (
      <LoginPage onSuccess={async () => { setAuthUser(await getCurrentUser()); }} onCreateAccount={() => setAuthView("register")} />
    ) : (
      <RegisterPage onSuccess={async () => { setAuthUser(await getCurrentUser()); }} onSignIn={() => setAuthView("login")} />
    );
  }

  return (
    <div className={`app-shell min-h-screen bg-[#050914] text-white theme-${resolvedTheme} density-${appSettings.density}`}>
      <style>{`
        .theme-light { background: #f4f7fb !important; color: #0f172a !important; }
        .theme-light .text-white { color: #0f172a !important; }
        .theme-light .text-slate-200 { color: #334155 !important; }
        .theme-light .text-slate-300 { color: #475569 !important; }
        .theme-light .text-slate-400 { color: #64748b !important; }
        .theme-light .text-slate-500 { color: #94a3b8 !important; }
        .theme-light [class*="bg-[#050914]"] { background: #f4f7fb !important; }
        .theme-light [class*="bg-[#080d19]"] { background: rgba(255,255,255,.92) !important; }
        .theme-light [class*="bg-[#070b14]"] { background: rgba(255,255,255,.88) !important; }
        .theme-light [class*="bg-[#0d111c]"] { background: #ffffff !important; }
        .theme-light [class*="bg-white/[0.035]"],
        .theme-light [class*="bg-white/[0.04]"],
        .theme-light [class*="bg-white/[0.03]"],
        .theme-light [class*="bg-white/[0.025]"] { background: rgba(15,23,42,.045) !important; }
        .theme-light [class*="border-white/10"],
        .theme-light [class*="border-white/5"] { border-color: rgba(15,23,42,.12) !important; }
        .theme-light input::placeholder { color: #94a3b8 !important; }
        .density-compact .p-8 { padding: 1.5rem !important; }
        .density-compact .p-6 { padding: 1.25rem !important; }
        .density-compact .p-5 { padding: 1rem !important; }
        .density-compact .py-3 { padding-top: .625rem !important; padding-bottom: .625rem !important; }
      `}</style>

      {/* ================= SIDEBAR ================= */}

      <aside className="fixed left-0 top-0 h-screen w-64 border-r border-white/10 bg-[#080d19]/90 backdrop-blur-xl">

        {/* Logo */}

        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg shadow-violet-500/20">

            <Package size={23} />

          </div>

          <div>

            <h1 className="text-lg font-bold">
              {appSettings.businessName || "Inventory Pro"}
            </h1>

            <p className="text-xs text-slate-400">
              Management System
            </p>

          </div>

        </div>


        {/* Navigation */}

        <nav className="space-y-2 px-4 py-6">

          <NavItem
            icon={<LayoutDashboard size={19} />}
            label="Dashboard"
            active={activePage === "dashboard"}
            onClick={() => setActivePage("dashboard")}
          />

          <NavItem
            icon={<Package size={19} />}
            label="Products"
            active={activePage === "products"}
            onClick={() => {
              setActivePage("products");
              setNotificationOpen(false);
            }}
          />

          <NavItem
            icon={<Truck size={19} />}
            label="Suppliers"
            active={activePage === "suppliers"}
            onClick={() => {
              setActivePage("suppliers");
              setNotificationOpen(false);
            }}
          />

          <NavItem
            icon={<ShoppingCart size={19} />}
            label="Purchases"
            active={activePage === "purchases"}
            onClick={() => {
              setActivePage("purchases");
              setNotificationOpen(false);
            }}
          />

          <NavItem
            icon={<Receipt size={19} />}
            label="Sales"
            active={activePage === "sales"}
            onClick={() => {
              setActivePage("sales");
              setNotificationOpen(false);
            }}
          />

          <NavItem
            icon={<BarChart3 size={19} />}
            label="Reports"
            active={activePage === "reports"}
            onClick={() => {
              setActivePage("reports");
              setNotificationOpen(false);
            }}
          />

          <div className="my-5 border-t border-white/10" />

          <NavItem
            icon={<SettingsIcon size={19} />}
            label="Settings"
            active={activePage === "settings"}
            onClick={() => {
              setActivePage("settings");
              setNotificationOpen(false);
            }}
          />

        </nav>


        {/* System Status */}

        <div className="absolute bottom-5 left-4 right-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">

          <p className="text-xs text-slate-400">
            Inventory Status
          </p>

          <div className="mt-3 flex items-center gap-2">

            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />

            <span className="text-sm text-slate-200">
              System Online
            </span>

          </div>

        </div>

      </aside>


      {/* ================= MAIN ================= */}

      <main className="ml-64 min-h-screen">


        {/* ================= HEADER ================= */}

        <header className="flex h-20 items-center justify-between border-b border-white/10 bg-[#070b14]/70 px-8 backdrop-blur-xl">

          <div>

            <p className="text-sm text-slate-400">
              Inventory Overview
            </p>

            <h2 className="text-2xl font-bold">
              {activePage === "products"
                ? "Products"
                : activePage === "suppliers"
                  ? "Suppliers"
                  : activePage === "purchases"
                    ? "Purchases"
                    : activePage === "sales"
                      ? "Sales"
                      : activePage === "reports"
                        ? "Reports"
                        : activePage === "settings"
                          ? "Settings"
                          : activePage === "profile"
                            ? "Profile"
                            : "Dashboard"}
            </h2>

          </div>


          <div className="flex items-center gap-4">

            {/* Search */}

            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 transition focus-within:border-violet-500/40">

              <Search
                size={17}
                className="text-slate-400"
              />

              <input
                value={globalSearch}
                onChange={(event) => {
                  const value = event.target.value;
                  setGlobalSearch(value);
                }}
                placeholder={
                  activePage === "suppliers"
                    ? "Search suppliers..."
                    : activePage === "purchases"
                      ? "Search purchases..."
                    : activePage === "sales"
                      ? "Search sales..."
                      : activePage === "reports"
                        ? "Search reports..."
                        : activePage === "settings"
                          ? "Search settings..."
                          : "Search products..."
                }
                className="w-40 bg-transparent text-sm outline-none placeholder:text-slate-500"
              />

            </div>


            {/* Notification */}

            <div className="relative">

              <button
                onClick={() =>
                  setNotificationOpen((previous) => !previous)
                }
                className="relative rounded-xl border border-white/10 bg-white/[0.04] p-3 transition hover:bg-white/[0.08]"
                title="Notifications"
              >

                <Bell size={18} />

                {appSettings.lowStockAlerts && lowStockCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {lowStockCount}
                  </span>
                )}

              </button>

              {notificationOpen && (
                <div className="absolute right-0 top-14 z-50 w-80 overflow-hidden rounded-2xl border border-white/10 bg-[#0d111c] shadow-2xl shadow-black/50">

                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold">
                        Notifications
                      </p>
                      <p className="text-xs text-slate-500">
                        Inventory alerts
                      </p>
                    </div>

                    <Bell size={16} className="text-violet-400" />
                  </div>

                  <div className="p-3">

                    {appSettings.lowStockAlerts && lowStockCount > 0 ? (
                      <button
                        onClick={() => {
                          setActivePage("products");
                          setGlobalSearch("");
                          setNotificationOpen(false);
                        }}
                        className="w-full rounded-xl border border-orange-400/10 bg-orange-400/5 p-3 text-left transition hover:bg-orange-400/10"
                      >
                        <p className="text-sm font-medium text-orange-300">
                          Low stock alert
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {lowStockCount} product{lowStockCount === 1 ? "" : "s"} at or below {appSettings.lowStockThreshold} units.
                        </p>
                        <p className="mt-2 text-xs text-violet-400">
                          View products →
                        </p>
                      </button>
                    ) : (
                      <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/5 p-3">
                        <p className="text-sm font-medium text-emerald-300">
                          All stock levels healthy
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          No products are currently below their reorder level.
                        </p>
                      </div>
                    )}

                    {notifications.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        {notifications.map((notification) => (
                          <div key={notification.id} className="rounded-xl border border-white/5 bg-white/[0.025] p-3">
                            <p className="text-sm font-medium text-slate-300">{notification.title}</p>
                            <p className="mt-1 text-xs text-slate-500">{notification.message}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 rounded-xl border border-white/5 bg-white/[0.025] p-3">
                        <p className="text-sm font-medium text-slate-300">No notifications</p>
                        <p className="mt-1 text-xs text-slate-500">Everything is quiet right now.</p>
                      </div>
                    )}

                  </div>

                </div>
              )}

            </div>


            {/* Profile */}

            <button
              onClick={() => {
                setActivePage("profile");
                setNotificationOpen(false);
                setGlobalSearch("");
              }}
              className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 font-semibold shadow-lg shadow-violet-500/20 transition hover:scale-105 hover:shadow-violet-500/30 ${
                activePage === "profile" ? "ring-2 ring-violet-300/60 ring-offset-2 ring-offset-[#070b14]" : ""
              }`}
              title="User Profile"
            >
              {authUser.name.charAt(0).toUpperCase()}
            </button>

          </div>

        </header>


        {/* ================= PAGE CONTENT ================= */}

        {activePage === "products" ? (

          /* PRODUCTS PAGE */

          <section className="p-8">

            <Products
              onLowStockCountChange={setLowStockCount}
              appSettings={appSettings}
            />

          </section>

        ) : activePage === "suppliers" ? (

          /* SUPPLIERS PAGE */

          <section className="p-8">

            <Suppliers
              globalSearch={globalSearch}
              onGlobalSearchChange={setGlobalSearch}
            />

          </section>

        ) : activePage === "purchases" ? (

          /* PURCHASES PAGE */

          <section className="p-8">

            <Purchases
              globalSearch={globalSearch}
              onGlobalSearchChange={setGlobalSearch}
              appSettings={appSettings}
            />

          </section>

        ) : activePage === "sales" ? (

          /* SALES PAGE */

          <section className="p-8">

            <Sales
              globalSearch={globalSearch}
              appSettings={appSettings}
            />

          </section>

        ) : activePage === "reports" ? (

          /* REPORTS PAGE */

          <section className="p-8">

            <Reports
              globalSearch={globalSearch}
              appSettings={appSettings}
            />

          </section>

        ) : activePage === "settings" ? (

          /* SETTINGS PAGE */

          <section className="p-8">

            <SettingsPage />

          </section>

        ) : activePage === "profile" ? (

          /* PROFILE PAGE */

          <section className="p-8">

            <ProfilePage
              user={authUser}
              businessName={appSettings.businessName || "Inventory Pro"}
              onUserUpdated={setAuthUser}
              onSignOut={() => {
                clearToken();
                setAuthUser(null);
                setAuthView("login");
                setActivePage("dashboard");
              }}
              onBack={() => setActivePage("dashboard")}
            />

          </section>

        ) : dashboardError ? (

          <section className="flex min-h-[calc(100vh-80px)] items-center justify-center p-8">
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-200 shadow-xl shadow-black/20">
              {dashboardError}
            </div>
          </section>

        ) : dashboardLoading ? (

          <section className="flex min-h-[calc(100vh-80px)] items-center justify-center p-8">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-4 text-slate-300 shadow-xl shadow-black/20">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              Loading dashboard...
            </div>
          </section>

        ) : (

          /* DASHBOARD PAGE */

          <section className="space-y-7 p-8">


            {/* Welcome */}

            <div>

              <p className="text-sm text-slate-400">
                Welcome back, {appSettings.businessName || "there"} 👋
              </p>

              <h3 className="mt-1 text-3xl font-bold">
                Here's your inventory overview
              </h3>

            </div>


            {/* ================= STATS ================= */}

            <div className="grid grid-cols-5 gap-5">


              <StatCard
                title="Total Products"
                value={String(totalProducts)}
                subtitle={totalProducts === 1 ? "Active product" : "Active products"}
                icon={<Package size={22} />}
                iconStyle="from-violet-500/20 to-purple-500/5 text-violet-400"
              />


              <StatCard
                title="Suppliers"
                value={String(totalSuppliers)}
                subtitle={totalSuppliers === 1 ? "Active supplier" : "Active suppliers"}
                icon={<Truck size={22} />}
                iconStyle="from-amber-500/20 to-yellow-500/5 text-amber-400"
              />


              <StatCard
                title="Current Stock"
                value={String(currentStock)}
                subtitle="Units available"
                icon={<Boxes size={22} />}
                iconStyle="from-blue-500/20 to-cyan-500/5 text-blue-400"
              />


              <StatCard
                title="Total Sales"
                value={formatCurrency(totalSales, appSettings.currency)}
                subtitle="Total revenue"
                icon={<Receipt size={22} />}
                iconStyle="from-emerald-500/20 to-green-500/5 text-emerald-400"
                trend={totalSales > 0 ? "Live" : undefined}
                positive
              />


              <StatCard
                title="Low Stock"
                value={String(lowStockProducts.length)}
                subtitle={`Products at or below ${appSettings.lowStockThreshold} units`}
                icon={<AlertTriangle size={22} />}
                iconStyle="from-orange-500/20 to-red-500/5 text-orange-400"
              />

            </div>


            {/* ================= MAIN GRID ================= */}

            <div className="grid grid-cols-3 gap-5">


              {/* Sales Overview */}

              <div className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">


                <div className="flex items-center justify-between">

                  <div>

                    <h4 className="text-lg font-semibold">
                      Sales Overview
                    </h4>

                    <p className="text-sm text-slate-400">
                      Revenue performance
                    </p>

                  </div>


                  <select
                    value={salesPeriod}
                    onChange={(event) => setSalesPeriod(event.target.value as "week" | "month" | "year")}
                    className="rounded-lg border border-white/10 bg-[#111622] px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-violet-500/50"
                  >
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                  </select>

                </div>


                {/* Chart */}

                {(() => {
                  const now = new Date();

                  const startOfDay = (date: Date) =>
                    new Date(date.getFullYear(), date.getMonth(), date.getDate());

                  const salesByPeriod = (() => {
                    if (salesPeriod === "year") {
                      const year = now.getFullYear();
                      const values = Array.from({ length: 12 }, (_, month) => {
                        const total = dashboardData.sales
                          .filter((sale) => {
                            const date = new Date(sale.sale_date);
                            return (
                              date.getFullYear() === year &&
                              date.getMonth() === month
                            );
                          })
                          .reduce(
                            (sum, sale) => sum + Number(sale.total_amount || 0),
                            0
                          );

                        return {
                          label: new Date(year, month, 1).toLocaleString("en-US", {
                            month: "short",
                          }),
                          value: total,
                        };
                      });

                      return values;
                    }

                    if (salesPeriod === "week") {
                      const today = startOfDay(now);
                      const dayOfWeek = today.getDay();
                      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                      const monday = new Date(today);
                      monday.setDate(today.getDate() + mondayOffset);

                      return Array.from({ length: 7 }, (_, index) => {
                        const date = new Date(monday);
                        date.setDate(monday.getDate() + index);

                        const total = dashboardData.sales
                          .filter((sale) => {
                            const saleDate = startOfDay(new Date(sale.sale_date));
                            return saleDate.getTime() === date.getTime();
                          })
                          .reduce(
                            (sum, sale) => sum + Number(sale.total_amount || 0),
                            0
                          );

                        return {
                          label: date.toLocaleString("en-US", {
                            weekday: "short",
                          }),
                          value: total,
                        };
                      });
                    }

                    const year = now.getFullYear();
                    const month = now.getMonth();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();

                    return Array.from({ length: daysInMonth }, (_, index) => {
                      const date = new Date(year, month, index + 1);

                      const total = dashboardData.sales
                        .filter((sale) => {
                          const saleDate = startOfDay(new Date(sale.sale_date));
                          return saleDate.getTime() === date.getTime();
                        })
                        .reduce(
                          (sum, sale) => sum + Number(sale.total_amount || 0),
                          0
                        );

                      return {
                        label: String(index + 1),
                        value: total,
                      };
                    });
                  })();

                  const maxValue = Math.max(
                    ...salesByPeriod.map((item) => item.value),
                    0
                  );

                  const chartItems = salesByPeriod.map((item) => ({
                    ...item,
                    height:
                      maxValue > 0
                        ? Math.max((item.value / maxValue) * 100, item.value > 0 ? 4 : 1)
                        : 1,
                  }));

                  return (
                    <>
                      <div className="mt-8 flex h-56 items-end gap-1.5 overflow-hidden">
                        {chartItems.map((item, index) => (
                          <div
                            key={`${item.label}-${index}`}
                            className="group flex min-w-0 flex-1 flex-col justify-end"
                            title={`${item.label}: ${formatCurrency(
                              item.value,
                              appSettings.currency
                            )}`}
                          >
                            <div
                              style={{ height: `${item.height}%` }}
                              className="rounded-t-lg bg-gradient-to-t from-violet-600/80 to-blue-400/80 opacity-80 transition-all duration-300 group-hover:opacity-100 group-hover:shadow-lg group-hover:shadow-violet-500/20"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex justify-between gap-1 text-xs text-slate-500">
                        {chartItems.map((item, index) => (
                          <span
                            key={`${item.label}-label-${index}`}
                            className="min-w-0 flex-1 text-center"
                          >
                            {item.label}
                          </span>
                        ))}
                      </div>
                    </>
                  );
                })()}

              </div>


              {/* Inventory Summary */}

              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">

                <h4 className="text-lg font-semibold">
                  Inventory Summary
                </h4>

                <p className="mt-1 text-sm text-slate-400">
                  Current stock status
                </p>


                <div className="mt-7 space-y-6">
                  {(() => {
                    const categoryTotals = dashboardData.products.reduce<Record<string, number>>(
                      (totals, product) => {
                        const category = product.category?.trim() || "Other";
                        totals[category] = (totals[category] || 0) + Number(product.quantity || 0);
                        return totals;
                      },
                      {}
                    );

                    const inventoryCategories = Object.entries(categoryTotals)
                      .sort(([, a], [, b]) => b - a);

                    const totalCategoryStock = inventoryCategories.reduce(
                      (sum, [, value]) => sum + value,
                      0
                    );

                    const visibleCategories = inventoryCategories.slice(0, 3);

                    if (visibleCategories.length === 0) {
                      return (
                        <div className="rounded-xl border border-white/5 bg-white/[0.025] p-4 text-sm text-slate-500">
                          No inventory data available.
                        </div>
                      );
                    }

                    return visibleCategories.map(([category, value]) => (
                      <InventoryRow
                        key={category}
                        label={category}
                        value={String(value)}
                        percentage={
                          totalCategoryStock > 0
                            ? `${Math.round((value / totalCategoryStock) * 100)}%`
                            : "0%"
                        }
                      />
                    ));
                  })()}
                </div>

              </div>

            </div>


            {/* ================= BOTTOM GRID ================= */}

            <div className="grid grid-cols-2 gap-5">


              {/* Recent Sales */}

              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl">


                <div className="flex items-center justify-between">

                  <div>

                    <h4 className="text-lg font-semibold">
                      Recent Sales
                    </h4>

                    <p className="text-sm text-slate-400">
                      Latest transactions
                    </p>

                  </div>


                  <button
                    onClick={() => { setActivePage("sales"); setGlobalSearch(""); }}
                    className="text-sm text-violet-400 hover:text-violet-300"
                  >
                    View all →
                  </button>

                </div>


                <div className="mt-5 space-y-4">
                  {(() => {
                    const recentSales = [...dashboardData.sales]
                      .sort(
                        (a, b) =>
                          new Date(b.sale_date).getTime() -
                          new Date(a.sale_date).getTime()
                      )
                      .slice(0, 3);

                    if (recentSales.length === 0) {
                      return (
                        <div className="rounded-xl border border-white/5 bg-white/[0.025] p-4 text-sm text-slate-500">
                          No sales recorded yet.
                        </div>
                      );
                    }

                    return recentSales.map((sale) => (
                      <Transaction
                        key={sale.sale_id}
                        name={`Sale #${sale.sale_id}`}
                        customer={sale.customer_name || "Walk-in customer"}
                        amount={formatCurrency(
                          Number(sale.total_amount || 0),
                          appSettings.currency
                        )}
                        positive
                      />
                    ));
                  })()}
                </div>

              </div>


              {/* Stock Alerts */}

              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl">


                <div className="flex items-center justify-between">

                  <div>

                    <h4 className="text-lg font-semibold">
                      Stock Alerts
                    </h4>

                    <p className="text-sm text-slate-400">
                      Products requiring attention
                    </p>

                  </div>


                  <AlertTriangle
                    className="text-orange-400"
                    size={20}
                  />

                </div>


                <div className="mt-5 space-y-3">
                  {(() => {
                    const alertProducts = [...dashboardData.products]
                      .filter(
                        (product) =>
                          Number(product.quantity || 0) === 0 ||
                          Number(product.quantity || 0) <=
                            Number(product.reorder_level || appSettings.lowStockThreshold)
                      )
                      .sort((a, b) => {
                        const aOut = Number(a.quantity || 0) === 0 ? 0 : 1;
                        const bOut = Number(b.quantity || 0) === 0 ? 0 : 1;
                        return aOut - bOut || Number(a.quantity || 0) - Number(b.quantity || 0);
                      })
                      .slice(0, 4);

                    if (alertProducts.length === 0) {
                      return (
                        <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4">
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                              <Boxes size={18} />
                            </div>
                            <div>
                              <p className="font-medium">
                                All stock levels healthy
                              </p>
                              <p className="text-xs text-slate-400">
                                No products below reorder level
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return alertProducts.map((product) => {
                      const quantity = Number(product.quantity || 0);
                      const isOutOfStock = quantity === 0;

                      return (
                        <button
                          key={product.product_id}
                          onClick={() => {
                            setActivePage("products");
                            setGlobalSearch(product.name);
                            setNotificationOpen(false);
                          }}
                          className={`w-full rounded-xl border p-3 text-left transition hover:bg-white/[0.04] ${
                            isOutOfStock
                              ? "border-red-500/10 bg-red-500/5"
                              : "border-orange-500/10 bg-orange-500/5"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {product.name}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {isOutOfStock
                                  ? "Out of stock"
                                  : `${quantity} units remaining • Reorder at ${product.reorder_level} units`}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 rounded-lg px-2 py-1 text-xs font-semibold ${
                                isOutOfStock
                                  ? "bg-red-500/10 text-red-300"
                                  : "bg-orange-500/10 text-orange-300"
                              }`}
                            >
                              {isOutOfStock ? "OUT" : "LOW"}
                            </span>
                          </div>
                        </button>
                      );
                    });
                  })()}
                </div>

              </div>

            </div>

          </section>

        )}

      </main>

    </div>
  );
}


/* ================= NAV ITEM ================= */

function NavItem({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {

  return (

    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all ${
        active
          ? "bg-gradient-to-r from-violet-600/80 to-purple-600/60 text-white shadow-lg shadow-violet-600/20"
          : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
      }`}
    >

      {icon}

      {label}

    </button>

  );
}


/* ================= STAT CARD ================= */

function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconStyle,
  trend,
  positive,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  iconStyle: string;
  trend?: string;
  positive?: boolean;
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


        <div className={`rounded-xl bg-gradient-to-br p-3 ${iconStyle}`}>
          {icon}
        </div>

      </div>


      {trend && (

        <div className="mt-4 flex items-center gap-1 text-xs text-emerald-400">

          {positive ? (
            <ArrowUpRight size={14} />
          ) : (
            <ArrowDownRight size={14} />
          )}

          {trend} from previous period

        </div>

      )}

    </div>

  );
}


/* ================= INVENTORY ROW ================= */

function InventoryRow({
  label,
  value,
  percentage,
}: {
  label: string;
  value: string;
  percentage: string;
}) {

  return (

    <div>

      <div className="mb-2 flex justify-between text-sm">

        <span className="text-slate-300">
          {label}
        </span>

        <span className="text-slate-400">
          {value} units
        </span>

      </div>


      <div className="h-2 overflow-hidden rounded-full bg-white/5">

        <div
          style={{ width: percentage }}
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-400"
        />

      </div>

    </div>

  );
}


/* ================= TRANSACTION ================= */

function Transaction({
  name,
  customer,
  amount,
  positive,
}: {
  name: string;
  customer: string;
  amount: string;
  positive?: boolean;
}) {

  return (

    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.025] p-4">


      <div className="flex items-center gap-3">

        <div className="rounded-lg bg-violet-500/10 p-2 text-violet-400">

          <Receipt size={18} />

        </div>


        <div>

          <p className="text-sm font-medium">
            {name}
          </p>

          <p className="text-xs text-slate-500">
            {customer}
          </p>

        </div>

      </div>


      <p
        className={
          positive
            ? "text-sm font-semibold text-emerald-400"
            : "text-sm"
        }
      >
        {positive ? `+${amount}` : `-${amount}`}
      </p>

    </div>

  );
}


export default App;