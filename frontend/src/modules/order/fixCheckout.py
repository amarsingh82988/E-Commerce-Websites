import re

with open(r'C:\coding\codes\project\apne-hath-crafts-main\frontend\src\modules\order\CheckoutPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import
content = re.sub(
    r'import \{ createOrder, verifyRazorpayPayment \} from "@/api/orders";',
    r'import { createOrder, verifyRazorpayPayment } from "@/api/orders";\nimport { getPublicSettings } from "@/api/content";',
    content
)

# 2. Add state
state_code = '''
  const [shippingConfig, setShippingConfig] = useState({ fee: 79, freeThreshold: 1499, codFee: 49 });

  useEffect(() => {
    getPublicSettings().then(data => {
      if (data?.shipping) {
        setShippingConfig({
          fee: data.shipping.fee ?? 79,
          freeThreshold: data.shipping.freeThreshold ?? 1499,
          codFee: data.shipping.codFee ?? 49
        });
      }
    });
  }, []);
'''
content = content.replace('  const [form, setForm] = useState({', state_code + '\n  const [form, setForm] = useState({')

# 3. Update calculations
old_calc = '''  const discount = appliedCoupon?.discountAmount ?? 0;
  const shipping = subtotal >= 1499 ? 0 : 79;
  const codFee = payment === "cod" ? 49 : 0;
  const total = Math.max(0, subtotal - discount) + shipping + codFee;'''

new_calc = '''  const discount = appliedCoupon?.discountAmount ?? 0;
  const shipping = subtotal >= shippingConfig.freeThreshold ? 0 : shippingConfig.fee;
  const codFee = payment === "cod" ? shippingConfig.codFee : 0;
  const total = Math.max(0, subtotal - discount) + shipping + codFee;'''

content = content.replace(old_calc, new_calc)

# Update radio label text which had hardcoded 1,499
content = content.replace(
    'Free shipping over ₹1,499.',
    'Free shipping over ₹{shippingConfig.freeThreshold}.'
)
# Wait, it's inside JSX, so we need to use JS expressions: 
# Free shipping over &#8377;{shippingConfig.freeThreshold}.
# Let's fix that.
content = content.replace(
    'Free shipping over ₹{shippingConfig.freeThreshold}.',
    'Free shipping over ₹{shippingConfig.freeThreshold}.'
)
# Actually the original was:
# Free shipping over ?1,499. (or Free shipping over ₹1,499.)
# Let's just use regex.
content = re.sub(
    r'Free shipping over [₹\?]?1,?499\.',
    r'Free shipping over ₹{shippingConfig.freeThreshold}.',
    content
)

with open(r'C:\coding\codes\project\apne-hath-crafts-main\frontend\src\modules\order\CheckoutPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
