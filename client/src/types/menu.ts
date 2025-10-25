export interface MenuItem {
    category: string;
    name: string;
    price: number;
    allergens?: string[];
    weight?: string | null;
}

export interface MenuResponse {
    restaurant_name: string;
    menu_items: MenuItem[];
    daily_menu: boolean;
    date: string;
    source_url: string;
}