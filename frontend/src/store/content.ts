export type HeroContent = {
  title: string;
  subtitle: string;
  imageUrl: string;
  buttonText: string;
  buttonLink: string;
};

export type AboutContent = {
  title: string;
  content: string;
  imageUrl: string;
};

export type FAQEntry = {
  id: string;
  question: string;
  answer: string;
};

export type PoliciesContent = {
  shipping: string;
  returnPolicy: string;
  privacy: string;
  terms: string;
};

export type SiteContent = {
  hero: HeroContent;
  about: AboutContent;
  faqs: FAQEntry[];
  policies: PoliciesContent;
};

export const defaultContent: SiteContent = {
  hero: {
    title: "Handmade with Love",
    subtitle: "Discover unique, artisanal crafts made by local creators.",
    imageUrl: "",
    buttonText: "Shop Now",
    buttonLink: "/shop",
  },
  about: {
    title: "Our Story",
    content: "Apne Hath Crafts was born out of a love for handmade, unique items. We believe in supporting local artisans and bringing their beautiful creations to a wider audience. Every piece tells a story, crafted with care and dedication.",
    imageUrl: "",
  },
  faqs: [
    {
      id: "1",
      question: "How long does shipping take?",
      answer: "Standard shipping takes 5-7 business days. Custom orders may take longer depending on the item.",
    },
    {
      id: "2",
      question: "Do you accept returns?",
      answer: "Yes, we accept returns within 14 days of delivery for unused items in their original packaging.",
    },
  ],
  policies: {
    shipping: "We ship all across India. Standard shipping takes 5-7 business days. Expedited shipping is available at checkout. You will receive a tracking number once your order is dispatched.",
    returnPolicy: "We want you to be completely satisfied with your purchase. If for any reason you are not, we gladly accept returns of unworn, unwashed, or defective merchandise within 14 days of delivery.",
    privacy: "Your privacy is important to us. We only collect information necessary to process your order and provide a personalized shopping experience. We do not sell your data to third parties.",
    terms: "By accessing this website, you agree to be bound by these website Terms and Conditions of Use, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.",
  },
};

const KEY = "ahc_site_content";

export function loadContent(): SiteContent {
  if (typeof window === "undefined") return defaultContent;
  try {
    const data = window.localStorage.getItem(KEY);
    return data ? JSON.parse(data) : defaultContent;
  } catch {
    return defaultContent;
  }
}

export function saveContent(content: SiteContent) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(content));
  }
}
