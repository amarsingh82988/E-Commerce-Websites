export type Review = {
  id: string;
  productId: string;
  author: string;
  rating: number;
  content: string;
  status: "pending" | "approved" | "rejected";
  featured: boolean;
  reply?: string;
  createdAt: string;
};

const KEY = "ahc_reviews";

export function loadReviews(): Review[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(KEY);
    if (data) {
      return JSON.parse(data) as Review[];
    }
    // Initialize with some dummy reviews if none exist
    const initialReviews: Review[] = [
      {
        id: "r1",
        productId: "1",
        author: "Ananya R.",
        rating: 5,
        content: "The sunflower bouquet arrived beautifully packed. My mother cried. Worth every rupee.",
        status: "approved",
        featured: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: "r2",
        productId: "2",
        author: "Ishita M.",
        rating: 5,
        content: "I use the tote every single day and it still looks brand new. The stitching is so even.",
        status: "approved",
        featured: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: "r3",
        productId: "4",
        author: "Rohan K.",
        rating: 5,
        content: "Ordered a custom teddy with a name on the scarf. They sent progress photos while making it.",
        status: "approved",
        featured: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: "r4",
        productId: "3",
        author: "Sneha P.",
        rating: 4,
        content: "Cute keychain, but a bit smaller than I expected.",
        status: "pending",
        featured: false,
        createdAt: new Date().toISOString(),
      }
    ];
    localStorage.setItem(KEY, JSON.stringify(initialReviews));
    return initialReviews;
  } catch {
    return [];
  }
}

export function saveReviews(reviews: Review[]) {
  localStorage.setItem(KEY, JSON.stringify(reviews));
}

export function addReview(review: Omit<Review, "id" | "status" | "featured" | "createdAt">) {
  const reviews = loadReviews();
  const newReview: Review = {
    ...review,
    id: `rev_${Date.now()}`,
    status: "pending",
    featured: false,
    createdAt: new Date().toISOString(),
  };
  reviews.unshift(newReview);
  saveReviews(reviews);
  return newReview;
}
