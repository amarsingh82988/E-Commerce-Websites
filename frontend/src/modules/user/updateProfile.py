import re

with open(r'C:\coding\codes\project\apne-hath-crafts-main\frontend\src\modules\user\ProfilePage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
content = re.sub(
    r'import \{ (.*?) \} from "lucide-react";',
    r'import { \1, ChevronDown, ChevronUp, Package } from "lucide-react";',
    content
)

order_item_component = '''
function OrderItem({ order }: { order: OrderDetails }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-card shadow-sm">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/20 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hidden sm:flex">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">Order placed on {new Date(order.createdAt).toLocaleDateString()}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {order.items.length} item{order.items.length !== 1 ? "s" : ""} • {formatINR(order.total)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={order.status === "delivered" ? "default" : "secondary"} className="capitalize hidden sm:inline-flex">
            {order.status.replace("_", " ")}
          </Badge>
          {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {isOpen && (
        <div className="p-4 pt-4 border-t border-border bg-card/50 text-sm animate-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-center mb-4 sm:hidden">
            <Badge variant={order.status === "delivered" ? "default" : "secondary"} className="capitalize">
              {order.status.replace("_", " ")}
            </Badge>
          </div>
          
          <h4 className="font-semibold mb-3">Items</h4>
          <div className="space-y-2 mb-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between">
                <span className="text-muted-foreground">{item.quantity}x {item.name}</span>
                <span>{formatINR(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="pt-2 mt-2 border-t border-border flex justify-between font-medium">
              <span>Total</span>
              <span>{formatINR(order.total)}</span>
            </div>
          </div>

          {(order.trackingNumber || order.courier || (order.timeline && order.timeline.length > 0)) && (
            <div className="mt-6 pt-4 border-t border-dashed border-border">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-accent" /> Tracking & Updates
              </h4>
              
              <div className="bg-secondary/20 p-3 rounded-lg mb-4">
                {order.courier && (
                  <p className="mb-1">
                    <span className="font-medium text-foreground">Courier:</span> <span className="text-muted-foreground">{order.courier}</span>
                  </p>
                )}
                {order.trackingNumber ? (
                  <p>
                    <span className="font-medium text-foreground">Tracking ID:</span> <span className="text-accent font-medium">{order.trackingNumber}</span>
                  </p>
                ) : (
                  <p className="text-muted-foreground italic text-xs">Tracking number not assigned yet</p>
                )}
              </div>
              
              {order.timeline && order.timeline.length > 0 && (
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[9px] before:w-px before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:bg-border">
                  {order.timeline.slice().reverse().map((event, i) => (
                    <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full border border-background bg-accent text-accent-foreground shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                        <div className="h-1.5 w-1.5 rounded-full bg-background" />
                      </div>
                      <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border border-border bg-background shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
                          <div className="font-medium capitalize text-foreground">{event.status.replace("_", " ")}</div>
                          <time className="text-[10px] text-muted-foreground sm:ml-2 font-mono">{new Date(event.at).toLocaleString()}</time>
                        </div>
                        {event.note && <div className="text-xs text-muted-foreground mt-1">{event.note}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CustomerProfileContent() {
'''

content = content.replace('function CustomerProfileContent() {', order_item_component)

# We want to replace everything inside:
#                 <div className="space-y-4">
#                   {orders.map((order) => (
# ... up to ...
#                   ))}
#                 </div>

start_marker = '<div className="space-y-4">\n                  {orders.map((order) => ('
end_marker = '))}\n                </div>'

start_idx = content.find(start_marker)
if start_idx != -1:
    end_idx = content.find(end_marker, start_idx)
    if end_idx != -1:
        replacement = '''<div className="space-y-4">
                  {orders.map((order) => (
                    <OrderItem key={order._id} order={order} />
                  ))}
                </div>'''
        content = content[:start_idx] + replacement + content[end_idx + len(end_marker):]

with open(r'C:\coding\codes\project\apne-hath-crafts-main\frontend\src\modules\user\ProfilePage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
