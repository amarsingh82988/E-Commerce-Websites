import { useState, useEffect } from "react";
import { formatINR } from "@/lib/format";
import { getSellerOrders, updateSellerOrderStatus, type OrderDetails } from "@/api/orders";
import { statusLabel } from "@/store/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { Eye, Search, FilterX } from "lucide-react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderDetails["status"] | "all">("all");
  const [dateFilter, setDateFilter] = useState("");
  
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [statusUpdateNote, setStatusUpdateNote] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courier, setCourier] = useState("");

  useEffect(() => {
     
    getSellerOrders()
      .then((data) => setOrders(data || []))
      .catch((err) => console.error("Error loading orders", err));
  }, []);

    const updateOrderStatus = async (id: string, newStatus: OrderDetails["status"]) => {
    try {
      await updateSellerOrderStatus(id, newStatus, statusUpdateNote, trackingNumber, courier);
      const orderIndex = orders.findIndex((o) => (o._id === id || o.orderNumber === id));
      if (orderIndex !== -1) {
        const updatedOrder = { ...orders[orderIndex], status: newStatus, courier: courier || orders[orderIndex].courier, trackingNumber: trackingNumber || orders[orderIndex].trackingNumber };
        const newOrders = [...orders];
        newOrders[orderIndex] = updatedOrder;
        setOrders(newOrders);
        if (selectedOrder && (selectedOrder._id === id || selectedOrder.orderNumber === id)) {
          setSelectedOrder(updatedOrder);
        }
        toast.success(`Order ${id} marked as ${statusLabel[newStatus]}`);
      }
    } catch {
      toast.error("Failed to update order status");
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      (o.orderNumber || o._id).toLowerCase().includes(search.toLowerCase()) ||
      o.shippingAddress.fullName.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchDate = !dateFilter || new Date(o.createdAt).toISOString().split("T")[0] === dateFilter;
    
    return matchSearch && matchStatus && matchDate;
  });

  const getStatusColor = (status: OrderDetails["status"]) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "confirmed": return "bg-blue-100 text-blue-800 border-blue-200";
      case "in_production": return "bg-purple-100 text-purple-800 border-purple-200";
      case "shipped": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "delivered": return "bg-green-100 text-green-800 border-green-200";
      case "cancelled": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 border rounded-lg bg-card">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order ID, name or email..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <Select value={statusFilter} onValueChange={(val: OrderDetails["status"] | "all") => setStatusFilter(val)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(statusLabel).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          className="w-[180px]"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />

        {(search || statusFilter !== "all" || dateFilter) && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setDateFilter("");
            }}
            className="px-2"
          >
            <FilterX className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <TableRow key={(order.orderNumber || order._id)}>
                  <TableCell className="font-medium">{(order.orderNumber || order._id)}</TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric"
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{order.shippingAddress.fullName}</div>
                    <div className="text-xs text-muted-foreground">{order.email}</div>
                  </TableCell>
                  <TableCell>{formatINR(order.total)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(order.status)}>
                      {statusLabel[order.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}>
                      <Eye className="mr-2 h-4 w-4" /> View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selectedOrder} onOpenChange={(open) => {
        if (!open) setSelectedOrder(null);
        else {
          setStatusUpdateNote("");
          setTrackingNumber("");
          setCourier("");
        }
      }}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          {selectedOrder && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="flex items-center justify-between">
                  <span>Order {(selectedOrder.orderNumber || selectedOrder._id)}</span>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={getStatusColor(selectedOrder.status)}>
                      {statusLabel[selectedOrder.status]}
                    </Badge>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/admin/orders/${(selectedOrder.orderNumber || selectedOrder._id)}/invoice`} target="_blank" rel="noreferrer">
                        Download Invoice
                      </a>
                    </Button>
                  </div>
                </SheetTitle>
                <div className="text-sm text-muted-foreground">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString("en-IN")}
                </div>
              </SheetHeader>

              <div className="space-y-8">
                <section>
                  <h3 className="font-semibold mb-3 border-b pb-2">Update Status</h3>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(statusLabel).map(([key, label]) => (
                        <Button
                          key={key}
                          variant={selectedOrder.status === key ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateOrderStatus((selectedOrder.orderNumber || selectedOrder._id), key as OrderDetails["status"])}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Courier Service</Label>
                        <Input 
                          placeholder="e.g., Delhivery" 
                          value={courier} 
                          onChange={e => setCourier(e.target.value)} 
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Tracking Number</Label>
                        <Input 
                          placeholder="Tracking ID" 
                          value={trackingNumber} 
                          onChange={e => setTrackingNumber(e.target.value)} 
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs">Note for Customer (Optional)</Label>
                      <Input 
                        placeholder="e.g., Out for delivery today!" 
                        value={statusUpdateNote} 
                        onChange={e => setStatusUpdateNote(e.target.value)} 
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold mb-3 border-b pb-2">Customer & Shipping</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">{selectedOrder.shippingAddress.fullName}</p>
                      <p className="text-muted-foreground">{selectedOrder.email}</p>
                      <p className="text-muted-foreground">{selectedOrder.shippingAddress.phone}</p>
                    </div>
                    <div>
                      <p>{selectedOrder.shippingAddress.line1}</p>
                      <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}</p>
                      <p>PIN: {selectedOrder.shippingAddress.pincode}</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold mb-3 border-b pb-2">Payment Details</h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Method:</span>
                    <span className="uppercase font-medium">{selectedOrder.paymentMethod}</span>
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold mb-3 border-b pb-2">Order Items</h3>
                  <div className="space-y-4">
                    {selectedOrder.items.map((item, i) => (
                      <div key={i} className="flex gap-4">
                        <img src={item.image} alt={item.name} className="h-16 w-16 rounded-md object-cover border" />
                        <div className="flex-1 text-sm">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-muted-foreground">
                            Qty: {item.quantity} {item.color && `· ${item.color}`} {item.size && `· ${item.size}`}
                          </p>
                          <p className="font-medium mt-1">{formatINR(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatINR(selectedOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>{formatINR(selectedOrder.shippingFee)}</span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-{formatINR(selectedOrder.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-base pt-2 border-t mt-2">
                      <span>Total</span>
                      <span>{formatINR(selectedOrder.total)}</span>
                    </div>
                  </div>
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}



