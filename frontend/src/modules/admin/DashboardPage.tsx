import { useState, useEffect } from "react";
import { getSellerOrders, type OrderDetails } from "@/api/orders";
import { type Product } from "@/data/catalog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp, ShoppingBag, AlertCircle, IndianRupee } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getSellerProducts } from "@/api/product";

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    getSellerOrders()
      .then((data) => setOrders(data || []))
      .catch(() => {});
    
    getSellerProducts()
      .then((res) => {
        if (res && res.products) {
          setProducts(res.products);
        }
      })
      .catch(() => {});
  }, []);

  // Calculate stats
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const thisMonthStr = now.toISOString().slice(0, 7); // yyyy-mm

  const totalSales = orders.reduce((sum, o) => sum + (o.status !== "cancelled" ? o.total : 0), 0);
  const ordersToday = orders.filter((o) => o.createdAt.startsWith(today)).length;
  const ordersThisMonth = orders.filter((o) => o.createdAt.startsWith(thisMonthStr)).length;
  const activeOrders = orders.filter((o) => ["pending", "confirmed", "in_production", "shipped"].includes(o.status)).length;

  const lowStockProducts = products.filter((p) => p.stock <= 5);

  // Revenue chart data (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(now.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const revenueData = last7Days.map((date) => {
    const dayOrders = orders.filter((o) => o.createdAt.startsWith(date) && o.status !== "cancelled");
    const revenue = dayOrders.reduce((sum, o) => sum + o.total, 0);
    return {
      date: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
      revenue,
      orders: dayOrders.length,
    };
  });

  // Best selling products (mocked based on rating/reviewCount if actual sales data is unavailable per product, or just sorted by bestseller flag)
  const bestSellingProducts = [...products]
    .sort((a, b) => (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0) || b.reviewCount - a.reviewCount)
    .slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="font-display text-3xl mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back to the Admin Console. Here's a quick overview of your store.
        </p>
      </div>
      
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalSales.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeOrders}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Orders Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordersToday}</div>
            <p className="text-xs text-muted-foreground mt-1">This month: {ordersThisMonth}</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockProducts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Products needing restock</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="col-span-2 shadow-soft">
          <CardHeader>
            <CardTitle>Revenue (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} tickFormatter={(val) => `₹${val}`} />
                <Tooltip
                  formatter={(value: any) => [`₹${value}`, "Revenue"]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)" }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#ec4899" fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="shadow-soft flex flex-col">
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-80">
            {lowStockProducts.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">All products are well stocked.</p>
            ) : (
              <div className="space-y-4">
                {lowStockProducts.map(p => (
                  <div key={p.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-secondary overflow-hidden shrink-0">
                        {p.featuredImage ? (
                          <img src={p.featuredImage} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 m-2.5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.sku}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${p.stock === 0 ? 'text-destructive' : 'text-orange-500'}`}>
                        {p.stock} left
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Best Selling Products */}
        <Card className="shadow-soft md:col-span-2">
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bestSellingProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-4">
                  <div className="text-lg font-bold text-muted-foreground w-4">{i + 1}</div>
                  <div className="w-12 h-12 rounded-md bg-secondary overflow-hidden shrink-0">
                    {p.featuredImage && (
                      <img src={p.featuredImage} alt={p.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-sm text-muted-foreground">₹{p.price}</p>
                  </div>
                  {p.bestseller && (
                    <div className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">
                      Bestseller
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>


      </div>
    </div>
  );
}
