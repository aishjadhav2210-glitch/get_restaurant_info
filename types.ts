// Fix: To resolve errors related to missing Google Maps types, the ineffective /// <reference>
// directive is removed. `window.google` is declared on the global scope, and `any`
// is used for Google Maps-specific types as a workaround.
declare global {
  interface Window {
    google: any;
  }
}

export interface SimplePlace {
    place_id?: string;
    name?: string;
    vicinity?: string;
    formatted_address?: string;
    rating?: number;
    user_ratings_total?: number;
    geometry?: {
        location: any;
    };
    photos?: {
        getUrl: (opts?: {maxWidth?: number; maxHeight?: number;}) => string;
    }[];
    opening_hours?: {
      open_now?: boolean; // Deprecated. From nearbySearch.
      isOpen?: () => boolean; // From getDetails.
    };
    price_level?: number;
    types?: string[];
}