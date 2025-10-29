/**
 * Interface for a menu item
 */
export interface MenuItem {
    /** Food category (e.g., "soup", "main course", "dessert") */
    category: string;
    /** Item name */
    name: string;
    /** Price in CZK */
    price: number;
    /** List of allergens (optional) */
    allergens?: string[];
    /** Portion weight (optional) */
    weight?: string | null;
}

/**
 * Interface for API response with menu data
 */
export interface MenuResponse {
    /** Restaurant name */
    restaurant_name: string;
    /** List of menu items */
    menu_items: MenuItem[];
    /** Whether a daily menu was found */
    daily_menu: boolean;
    /** Date for which the menu is available */
    date: string;
    /** URL source of the menu */
    source_url: string;
}