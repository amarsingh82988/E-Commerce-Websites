import re

with open(r'C:\coding\codes\project\apne-hath-crafts-main\frontend\src\components\admin\AdminLayout.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '{ name: "Settings",       to: "/seller/settings",       icon: Settings,         roles: ["superadmin"] },',
    '{ name: "Settings",       to: "/seller/settings",       icon: Settings,         roles: ["seller", "superadmin"] },'
)

with open(r'C:\coding\codes\project\apne-hath-crafts-main\frontend\src\components\admin\AdminLayout.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
