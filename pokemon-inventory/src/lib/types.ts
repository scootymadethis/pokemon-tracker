export type InventoryCard = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  set_name: string | null;
  card_number: string | null;
  variant: string | null;
  language: string | null;
  condition: string | null;
  graded: boolean | null;
  grade_company: string | null;
  grade_value: string | null;
  quantity: number;
  buy_price_eur: number;
  buy_date: string | null;
  current_value_eur: number | null;
  target_value_eur: number | null;
  location: string | null;
  tags: string | null;
  notes: string | null;
  image_url: string | null;
};

export type Sale = {
  id: string;
  created_at: string;
  inventory_id: string | null;
  card_name_snapshot: string;
  quantity: number;
  sold_at: string;
  platform: string | null;
  sold_price_eur: number;
  shipping_eur: number;
  fees_eur: number;
  notes: string | null;
};

export type WatchItem = {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  link: string | null;
  source: string | null;
  seen_price_eur: number | null;
  target_price_eur: number | null;
  status: "active" | "closed" | "bought" | string;
  notes: string | null;
};
