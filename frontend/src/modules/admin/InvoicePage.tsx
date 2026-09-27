import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { findOrder } from "@/store/orders";
import { formatINR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";

export default function AdminInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const order = findOrder(id || "");

  useEffect(() => {
    // Automatically trigger print dialog when component mounts (optional, but requested for "generate PDF")
    if (order) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [order]);

  if (!order) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-bold">Order not found</h1>
        <Button asChild className="mt-4">
          <Link to="/admin/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Non-printable header for navigation/manual print */}
      <div className="print:hidden p-4 bg-secondary/20 flex justify-between items-center border-b">
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/orders">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
          </Link>
        </Button>
        <Button onClick={() => window.print()} size="sm">
          <Printer className="mr-2 h-4 w-4" /> Print / Save as PDF
        </Button>
      </div>

      {/* Invoice Content */}
      <div className="max-w-4xl mx-auto p-10 bg-white text-black" id="invoice-content">
        <div className="flex justify-between items-start border-b pb-8 mb-8">
          <div>
            <h1 className="text-4xl font-display font-bold tracking-tight">INVOICE</h1>
            <p className="text-muted-foreground mt-2">Apne Hath Crafts</p>
            <p className="text-sm text-muted-foreground">123 Artisan Street, Craftsville</p>
            <p className="text-sm text-muted-foreground">hello@apnehathcrafts.com</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold">Order #{order.id}</h2>
            <p className="text-sm mt-1">
              <span className="font-semibold">Date:</span> {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Payment:</span> {order.payment.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 mb-10">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Bill To / Ship To</h3>
            <p className="font-medium text-lg">{order.customer.name}</p>
            <p>{order.customer.address}</p>
            <p>{order.customer.city}, {order.customer.state} {order.customer.pin}</p>
            <p className="mt-2 text-sm">{order.customer.email}</p>
            <p className="text-sm">{order.customer.phone}</p>
          </div>
        </div>

        <table className="w-full mb-10 border-collapse">
          <thead>
            <tr className="border-b-2 border-black text-left">
              <th className="py-3 px-2 font-semibold">Item</th>
              <th className="py-3 px-2 font-semibold">Variant</th>
              <th className="py-3 px-2 font-semibold text-center">Qty</th>
              <th className="py-3 px-2 font-semibold text-right">Price</th>
              <th className="py-3 px-2 font-semibold text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={i} className="border-b border-gray-200">
                <td className="py-4 px-2">
                  <p className="font-medium">{item.title}</p>
                </td>
                <td className="py-4 px-2 text-sm text-gray-600">
                  {item.color && <span>{item.color}</span>}
                  {item.color && item.size && <span> · </span>}
                  {item.size && <span>{item.size}</span>}
                </td>
                <td className="py-4 px-2 text-center">{item.qty}</td>
                <td className="py-4 px-2 text-right">{formatINR(item.price)}</td>
                <td className="py-4 px-2 text-right">{formatINR(item.price * item.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-1/2 space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatINR(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>{formatINR(order.shipping)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{formatINR(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xl pt-4 border-t-2 border-black mt-4">
              <span>Total</span>
              <span>{formatINR(order.total)}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-20 pt-8 border-t text-center text-sm text-gray-500">
          <p>Thank you for shopping with Apne Hath Crafts!</p>
          <p>This is a computer generated invoice and does not require a signature.</p>
        </div>
      </div>
    </div>
  );
}
