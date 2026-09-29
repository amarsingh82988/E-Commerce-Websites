import re

with open(r'C:\coding\codes\project\apne-hath-crafts-main\frontend\src\api\content.ts', 'r', encoding='utf-8') as f:
    content = f.read()

get_public_settings = '''
/**
 * Public API: Fetch public store settings (shipping config, etc)
 */
export async function getPublicSettings(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/content/public-settings`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to fetch public settings");
    return await res.json();
  } catch (err) {
    console.error("Error fetching public settings:", err);
    return null;
  }
}
'''

content = content + '\n' + get_public_settings

with open(r'C:\coding\codes\project\apne-hath-crafts-main\frontend\src\api\content.ts', 'w', encoding='utf-8') as f:
    f.write(content)
