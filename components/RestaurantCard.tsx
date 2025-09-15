import React, { memo } from 'react';
import type { SimplePlace } from '../types';
import { StarIcon } from './icons';

interface RestaurantCardProps {
    restaurant: SimplePlace;
    isSelected: boolean;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}

const renderStars = (rating?: number) => {
    if (!rating) return <span className="text-gray-500 text-sm">No rating</span>;
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    return (
        <div className="flex items-center">
            {[...Array(fullStars)].map((_, i) => (
                <StarIcon key={`full-${i}`} className="w-4 h-4 text-yellow-400" />
            ))}
            {halfStar && <StarIcon key="half" className="w-4 h-4 text-yellow-400" />}
            {[...Array(emptyStars)].map((_, i) => (
                <StarIcon key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
            ))}
        </div>
    );
};

export const RestaurantCard: React.FC<RestaurantCardProps> = memo(({ restaurant, isSelected, onMouseEnter, onMouseLeave }) => {
    const imageUrl = restaurant.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 400 }) || `https://picsum.photos/seed/${restaurant.place_id}/400/400`;
    const isOpen = restaurant.opening_hours?.isOpen?.() ?? restaurant.opening_hours?.open_now;
    
    return (
        <div
            id={`restaurant-${restaurant.place_id}`}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className={`flex items-center p-3 rounded-lg transition-all duration-300 cursor-pointer ${isSelected ? 'bg-indigo-100 scale-105 shadow-lg' : 'bg-white hover:bg-gray-50'}`}
        >
            <img src={imageUrl} alt={restaurant.name} className="w-20 h-20 rounded-md object-cover mr-4" />
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{restaurant.name}</h3>
                <p className="text-sm text-gray-600 truncate">{restaurant.vicinity}</p>
                <div className="flex items-center mt-1">
                    {renderStars(restaurant.rating)}
                    <span className="text-xs text-gray-500 ml-2">({restaurant.user_ratings_total || 0} reviews)</span>
                </div>
                {isOpen === true && (
                    <p className="text-xs text-green-600 font-medium mt-1">Open Now</p>
                )}
                {isOpen === false && (
                     <p className="text-xs text-red-600 font-medium mt-1">Closed</p>
                )}
            </div>
        </div>
    );
});
