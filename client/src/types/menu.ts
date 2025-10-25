/**
 * Interface pro položku jídelního lístku
 */
export interface MenuItem {
    /** Kategorie jídla (např. "polévka", "hlavní jídlo", "dezert") */
    category: string;
    /** Název jídla */
    name: string;
    /** Cena v korunách */
    price: number;
    /** Seznam alergenů (volitelné) */
    allergens?: string[];
    /** Hmotnost porce (volitelné) */
    weight?: string | null;
}

/**
 * Interface pro odpověď API s daty menu
 */
export interface MenuResponse {
    /** Název restaurace */
    restaurant_name: string;
    /** Seznam položek menu */
    menu_items: MenuItem[];
    /** Zda byl nalezen denní lístek */
    daily_menu: boolean;
    /** Datum pro které je menu */
    date: string;
    /** URL zdroje menu */
    source_url: string;
}