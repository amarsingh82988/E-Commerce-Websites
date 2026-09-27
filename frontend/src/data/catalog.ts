
export type Category = {
  _id?: string;
  slug: string;
  name: string;
  description: string;
  image?: string;
  isActive?: boolean;
  sortOrder?: number;
};


export type Product = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  shippingCost?: number;
  category: string;
  sku: string;
  stock: number;
  images: string[];
  featuredImage: string;
  colors: string[];
  sizes: string[];
  materials: string;
  careInstructions: string;
  estimatedDelivery: string;
  customizable: boolean;
  tags: string[];
  featured: boolean;
  bestseller: boolean;
  newArrival: boolean;
  rating: number;
  reviewCount: number;
  isActive?: boolean;
  isDeleted?: boolean;
  deletedAt?: string | null;
  deletedBy?: string | null;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt?: string;
};

