export interface PropertyImage {
  id: number;
  property_id: number;
  image_url: string;
  storage_path?: string;
  display_order?: number;
  sort_order?: number;
  is_cover: boolean;
  alt_text?: string | null;
  created_at?: string;
}

export interface Property {
  id: number;
  title: string;
  price: string;
  location: string;
  area: string;

  type?: string;
  deal_type?: string;
  address?: string;

  contract_area?: string;
  exclusive_area?: string;
  rooms?: number;
  bathrooms?: number;
  floor?: string;

  description?: string;

  image?: string;
  image_url?: string;

  created_at?: string;
  property_images?: PropertyImage[];
}