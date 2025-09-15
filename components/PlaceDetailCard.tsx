import React from 'react';
import type { SimplePlace } from '../types';
import { StarIcon, DirectionsIcon, StartIcon, CalendarIcon, XIcon } from './icons';

interface PlaceDetailCardProps {
    place: SimplePlace;
    onClose: () => void;
}

const renderStars = (rating?: number) => {
    if (!rating) return <span className="text-gray-500 text-sm">No rating available</span>;
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    return (
        <div className="flex items-center">
            {[...Array(fullStars)].map((_, i) => (
                <StarIcon key={`full-${i}`} className="w-5 h-5 text-yellow-400" />
            ))}
            {halfStar && <StarIcon key="half" className="w-5 h-5 text-yellow-400" />}
            {[...Array(emptyStars)].map((_, i) => (
                <StarIcon key={`empty-${i}`} className="w-5 h-5 text-gray-300" />
            ))}
        </div>
    );
};

const formatPriceLevel = (level?: number) => {
    if (level === undefined || level === null) return '';
    return '· ' + '$'.repeat(level);
};

const getPlaceType = (types?: string[]) => {
    if (!types) return 'Restaurant';
    const preferredTypes = ['restaurant', 'cafe', 'bar', 'meal_delivery', 'meal_takeaway'];
    const foundType = types.find(t => preferredTypes.includes(t));
    return foundType ? foundType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Place';
};

export const PlaceDetailCard: React.FC<PlaceDetailCardProps> = ({ place, onClose }) => {
    const directionsUrl = place.place_id ? `https://www.google.com/maps/dir/?api=1&destination_place_id=${place.place_id}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name || '')}`;
    const isOpen = place.opening_hours?.isOpen?.();

    return (
        <div className="relative text-gray-900 animate-fade-in p-4">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors z-10"
                aria-label="Close details"
            >
                <XIcon className="w-6 h-6" />
            </button>
            <div>
                <h2 className="text-3xl font-bold pr-10">{place.name}</h2>
                <div className="flex items-center space-x-2 mt-2 text-gray-600">
                    <span>{place.rating?.toFixed(1)}</span>
                    {renderStars(place.rating)}
                    <span>({place.user_ratings_total})</span>
                </div>
                <div className="mt-1 text-gray-500">
                    <span>{getPlaceType(place.types)}</span>
                    <span>{formatPriceLevel(place.price_level)}</span>
                </div>
                <div className="mt-1">
                {isOpen === true && (
                    <span className="text-green-600 font-semibold">Open</span>
                )}
                {isOpen === false && (
                     <span className="text-red-600 font-semibold">Closed</span>
                )}
                </div>
            </div>

            <div className="flex justify-start items-center my-6 space-x-3">
                <a href={directionsUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center px-5 py-2.5 rounded-full bg-teal-600 text-white font-semibold shadow-md hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                    aria-label="Get directions">
                    <DirectionsIcon className="w-5 h-5 mr-2" />
                    <span className="text-sm">Directions</span>
                </a>
                <a href={directionsUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center px-5 py-2.5 rounded-full bg-teal-50 text-teal-700 font-semibold shadow-md hover:bg-teal-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                    aria-label="Start navigation">
                    <StartIcon className="w-5 h-5 mr-2" />
                    <span className="text-sm">Start</span>
                </a>
                <button
                    className="flex items-center justify-center px-5 py-2.5 rounded-full bg-teal-50 text-teal-700 font-semibold shadow-md hover:bg-teal-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                    aria-label="Reserve a table">
                    <CalendarIcon className="w-5 h-5 mr-2" />
                    <span className="text-sm">Reserve</span>
                </button>
            </div>
            
            {place.photos && place.photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 max-h-96 overflow-y-auto">
                    {place.photos.map((photo, index) => (
                        <div key={index} className="aspect-square">
                           <img 
                                src={photo.getUrl({ maxWidth: 400, maxHeight: 400 })} 
                                alt={`${place.name} photo ${index + 1}`} 
                                className="w-full h-full object-cover rounded-lg"
                                loading="lazy"
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};