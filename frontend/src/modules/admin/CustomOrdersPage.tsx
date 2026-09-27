import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Eye, Search, FilterX, Loader2 } from "lucide-react";
import { getAllCustomOrders, updateCustomOrderStatus, type CustomOrder } from "@/api/customOrders";

const statusLabelMap: Record<string, string> = {
  requested: "Requested",
  in_review: "In Review",
  quoted: "Quote Ready",
  accepted: "Accepted",
  rejected: "Declined",
  completed: "Completed",
};

export default function AdminCustomOrdersPage() {
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<CustomOrder | null>(null);
  const [quoteInput, setQuoteInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllCustomOrders();
      setOrders(data || []);
    } catch {
      toast.error("Failed to load custom orders from database.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdating(true);
    try {
      await updateCustomOrderStatus(id, {
        status: newStatus,
        quoteAmount: quoteInput ? Number(quoteInput) : undefined,
        notes: notesInput || undefined,
      });
      toast.success(`Custom order status updated to ${statusLabelMap[newStatus] || newStatus}`);
      await fetchOrders();
      if (selectedOrder && selectedOrder._id === id) {
        setSelectedOrder((prev) => prev ? { ...prev, status: newStatus as any } : null);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update custom order status");
    } finally {
      setUpdating(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const orderId = o._id || "";
    const custName = o.name || "";
    const custEmail = o.email || "";

    const matchSearch =
      orderId.toLowerCase().includes(search.toLowerCase()) ||
      custName.toLowerCase().includes(search.toLowerCase()) ||
      custEmail.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "requested": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "in_review": return "bg-blue-100 text-blue-800 border-blue-200";
      case "quoted": return "bg-purple-100 text-purple-800 border-purple-200";
      case "accepted": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "rejected": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Custom Orders Management</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 border rounded-lg bg-card">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, name or email..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(statusLabelMap).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(search || statusFilter !== "all") && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
            }}
            className="px-2"
          >
            <FilterX className="h-4 w-4" />
          </Button>
        )}
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell className="font-mono text-xs font-medium">{order._id.slice(-6).toUpperCase()}</TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{order.name}</div>
                      <div className="text-xs text-muted-foreground">{order.email}</div>
                    </TableCell>
                    <TableCell>{order.type}</TableCell>
                    <TableCell>{order.budget ? `₹${order.budget}` : "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(order.status)}>
                        {statusLabelMap[order.status] || order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setQuoteInput(order.quoteAmount ? String(order.quoteAmount) : "");
                          setNotesInput(order.notes || "");
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No custom orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          {selectedOrder && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="flex items-center justify-between">
                  <span>Order #{selectedOrder._id.slice(-6).toUpperCase()}</span>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={getStatusColor(selectedOrder.status)}>
                      {statusLabelMap[selectedOrder.status] || selectedOrder.status}
                    </Badge>
                  </div>
                </SheetTitle>
                <div className="text-sm text-muted-foreground">
                  Requested on {new Date(selectedOrder.createdAt).toLocaleString("en-IN")}
                </div>
              </SheetHeader>

              <div className="space-y-8 mt-6">
                <section>
                  <h3 className="font-semibold mb-3 border-b pb-2">Update Status & Quote</h3>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(statusLabelMap).map(([key, label]) => (
                        <Button
                          key={key}
                          variant={selectedOrder.status === key ? "default" : "outline"}
                          size="sm"
                          disabled={updating}
                          onClick={() => handleUpdateStatus(selectedOrder._id, key)}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 pt-2">
                      <div>
                        <label className="text-xs font-medium">Quote Amount (₹)</label>
                        <Input
                          type="number"
                          placeholder="e.g. 3500"
                          value={quoteInput}
                          onChange={(e) => setQuoteInput(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium">Notes / Internal Feedback</label>
                        <Input
                          placeholder="Note for customer or internal..."
                          value={notesInput}
                          onChange={(e) => setNotesInput(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold mb-3 border-b pb-2">Customer Contact</h3>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">Name:</span> {selectedOrder.name}</p>
                    <p><span className="font-medium">Email:</span> {selectedOrder.email}</p>
                    <p><span className="font-medium">Phone:</span> {selectedOrder.phone || "-"}</p>
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold mb-3 border-b pb-2">Request Details</h3>
                  <div className="space-y-3 text-sm">
                    <p><span className="font-medium">Type:</span> {selectedOrder.type}</p>
                    <p><span className="font-medium">Budget:</span> {selectedOrder.budget ? `₹${selectedOrder.budget}` : "-"}</p>
                    <p><span className="font-medium">Needed By:</span> {selectedOrder.deadline || "-"}</p>
                    <p><span className="font-medium">Colors:</span> {selectedOrder.colors || "-"}</p>
                    <p><span className="font-medium">Size:</span> {selectedOrder.size || "-"}</p>

                    <div>
                      <p className="font-medium mb-1">Description:</p>
                      <p className="text-muted-foreground bg-muted p-3 rounded-md whitespace-pre-wrap">
                        {selectedOrder.details}
                      </p>
                    </div>

                    {selectedOrder.referenceImage && (
                      <div>
                        <p className="font-medium mb-2">Reference Image:</p>
                        <a
                          href={selectedOrder.referenceImage}
                          target="_blank"
                          rel="noreferrer"
                          className="block w-48 h-48 rounded-xl overflow-hidden border shadow-sm hover:opacity-90 transition-opacity"
                        >
                          <img
                            src={selectedOrder.referenceImage}
                            alt="Reference"
                            className="w-full h-full object-cover"
                          />
                        </a>
                      </div>
                    )}
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
