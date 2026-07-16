export interface PropertyImage {
  id: number;
  property_id: number;
  image_url: string;
  storage_path: string;
  display_order: number;
  is_cover: boolean;
  alt_text?: string | null;
  created_at?: string;
}

export interface Property {
  id: number;
  title: string;
  price: string;
  price_amount?: number | null;
  location: string;
  area: string;
  description: string;
  image_url: string;
  created_at?: string;
  type?: string | null;
  deal_type?: string | null;
  address?: string | null;
  contract_area?: string | null;
  exclusive_area?: string | null;
  rooms?: number | null;
  bathrooms?: number | null;
  floor?: string | null;
  property_images?: PropertyImage[];
}
