// Fix: Removed the ineffective /// <reference> directive and replaced all Google Maps
// type annotations with `any` to resolve compilation errors.
import React, { useEffect, useRef, memo } from 'react';
import type { SimplePlace } from '../types';

interface MapComponentProps {
    center: any | null;
    restaurants: SimplePlace[];
    selectedRestaurantId: string | null;
    onMapLoad: (map: any) => void;
    onMarkerClick: (id: string) => void;
}

export const MapComponent: React.FC<MapComponentProps> = memo(({ center, restaurants, selectedRestaurantId, onMapLoad, onMarkerClick }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any | null>(null);
    const markersRef = useRef<{ [key: string]: any }>({});
    const userMarkerRef = useRef<any | null>(null);

    useEffect(() => {
        if (mapContainerRef.current && !mapInstance.current) {
            const map = new window.google.maps.Map(mapContainerRef.current, {
                center: center || { lat: 0, lng: 0 },
                zoom: 15,
                disableDefaultUI: true,
                zoomControl: true,
            });
            mapInstance.current = map;
            onMapLoad(map);
        }
    }, [center, onMapLoad]);

    useEffect(() => {
        if (mapInstance.current && center) {
            mapInstance.current.panTo(center);
            if (!userMarkerRef.current) {
                userMarkerRef.current = new window.google.maps.Marker({
                    position: center,
                    map: mapInstance.current,
                    title: "Your Location",
                    icon: {
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: "#4285F4",
                        fillOpacity: 1,
                        strokeColor: "white",
                        strokeWeight: 2,
                    },
                });
            } else {
                userMarkerRef.current.setPosition(center);
            }
        }
    }, [center]);

    useEffect(() => {
        if (!mapInstance.current) return;

        // Clear old markers not in the new list
        Object.keys(markersRef.current).forEach(placeId => {
            if (!restaurants.find(r => r.place_id === placeId)) {
                markersRef.current[placeId].setMap(null);
                delete markersRef.current[placeId];
            }
        });
        
        restaurants.forEach(place => {
            if (!place.geometry?.location || !place.place_id) return;

            if (!markersRef.current[place.place_id]) {
                const marker = new window.google.maps.Marker({
                    position: place.geometry.location,
                    map: mapInstance.current,
                    title: place.name,
                });
                marker.addListener('click', () => onMarkerClick(place.place_id!));
                markersRef.current[place.place_id] = marker;
            }
            
            const marker = markersRef.current[place.place_id];
            const isSelected = place.place_id === selectedRestaurantId;
            marker.setAnimation(isSelected ? window.google.maps.Animation.BOUNCE : null);
            marker.setZIndex(isSelected ? 100 : 1);
        });
    }, [restaurants, selectedRestaurantId, onMarkerClick]);

    return <div ref={mapContainerRef} className="w-full h-full" />;
});