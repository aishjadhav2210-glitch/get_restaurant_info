// Fix: Removed the ineffective /// <reference> directive and replaced all Google Maps
// type annotations with `any` to resolve compilation errors.
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { SimplePlace } from './types';
import { MapComponent } from './components/MapComponent';
import { RestaurantCard } from './components/RestaurantCard';
import { PlaceDetailCard } from './components/PlaceDetailCard';
import { Spinner } from './components/Spinner';
import { SearchIcon, LocationMarkerIcon, ArrowLeftIcon, MinusIcon } from './components/icons';

type Status = 'idle' | 'locating' | 'searching' | 'success' | 'error';
type PanelState = 'hidden' | 'peek' | 'full';

const App: React.FC = () => {
    const [currentLocation, setCurrentLocation] = useState<any | null>(null);
    const [restaurants, setRestaurants] = useState<SimplePlace[]>([]);
    const [status, setStatus] = useState<Status>('idle');
    const [error, setError] = useState<React.ReactNode | null>(null);
    const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPlaceDetails, setSelectedPlaceDetails] = useState<SimplePlace | null>(null);
    const [panelState, setPanelState] = useState<PanelState>('hidden');

    const mapInstanceRef = useRef<any | null>(null);
    const initialLocationSet = useRef(false);

    const isDetailView = selectedPlaceDetails !== null;


    useEffect(() => {
        if (!initialLocationSet.current) {
            setCurrentLocation(new window.google.maps.LatLng(40.7128, -74.0060)); // Default to New York
            initialLocationSet.current = true;
        }
    }, []);

    const findRestaurants = useCallback((location?: any) => {
        const searchLocation = location || currentLocation;
        if (!mapInstanceRef.current || !searchLocation) {
            setError("Map isn't ready or location not available. Please try again.");
            setStatus('error');
            setPanelState('peek');
            return;
        }

        setStatus('searching');
        setRestaurants([]);
        setSelectedPlaceDetails(null);
        setSelectedRestaurantId(null);
        setError(null);
        setPanelState('peek');
        
        const service = new window.google.maps.places.PlacesService(mapInstanceRef.current!);
        const request: any = {
            location: searchLocation,
            radius: 1500,
            type: 'restaurant',
        };

        service.nearbySearch(request, (results: any, searchStatus: string) => {
            if (searchStatus === window.google.maps.places.PlacesServiceStatus.OK && results) {
                setRestaurants(results as SimplePlace[]);
                setStatus('success');
                 setPanelState(results.length > 0 ? 'peek' : 'hidden');
                if (results.length === 0) {
                    setError('No restaurants found within a 1.5km radius.');
                    setPanelState('peek');
                }
            } else {
                setError('Could not fetch restaurants. Please try again later.');
                setStatus('error');
                setPanelState('peek');
            }
        });
    }, [currentLocation]);

    const handleRequestLocationAndSearch = useCallback(() => {
        setStatus('locating');
        setRestaurants([]);
        setSelectedPlaceDetails(null);
        setSelectedRestaurantId(null);
        setError(null);
        setPanelState('peek');

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const userLocation = new window.google.maps.LatLng(latitude, longitude);
                    setCurrentLocation(userLocation);
                    findRestaurants(userLocation);
                },
                (geoError) => {
                    let errorMessage: React.ReactNode = 'Could not get your location. Please try again.';
                    if (geoError.code === geoError.PERMISSION_DENIED) {
                        errorMessage = (
                            <div className="text-left text-sm">
                                <p className="font-bold mb-2">Location Permission Denied</p>
                                <p className="mb-2">To find nearby restaurants, please enable location services for this site in your browser settings.</p>
                                <p className="font-semibold mt-3 mb-1">General Steps:</p>
                                <ol className="list-decimal list-inside space-y-1">
                                    <li>Look for a lock icon 🔒 next to the website address (URL).</li>
                                    <li>Click it and go to "Site settings" or "Permissions".</li>
                                    <li>Find "Location" and set it to "Allow".</li>
                                </ol>
                                <p className="mt-3 text-xs">You may need to reload the page after changing the settings.</p>
                            </div>
                        );
                    }
                    setError(errorMessage);
                    setStatus('error');
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            setError('Geolocation is not supported by your browser.');
            setStatus('error');
        }
    }, [findRestaurants]);
    
    const handleMarkerClick = useCallback((id: string) => {
      setSelectedRestaurantId(id);
      setPanelState('peek');
      if (selectedPlaceDetails) return; // Don't scroll if showing detail card
      const restaurantElement = document.getElementById(`restaurant-${id}`);
      restaurantElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [selectedPlaceDetails]);

    const handleMapLoad = useCallback((map: any) => {
        mapInstanceRef.current = map;
    }, []);

    const handleSearch = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!searchQuery.trim()) return;

        if (!mapInstanceRef.current) {
            setError("Map isn't ready. Please wait a moment and try again.");
            setStatus('error');
            setPanelState('peek');
            return;
        }
        
        setStatus('searching');
        setRestaurants([]);
        setSelectedPlaceDetails(null);
        setError(null);
        setPanelState('peek');
        
        const service = new window.google.maps.places.PlacesService(mapInstanceRef.current!);
        const request: any = {
            query: searchQuery,
            fields: ['place_id'],
            locationBias: currentLocation ? { center: currentLocation, radius: 20000 } : undefined,
        };

        service.textSearch(request, (results: any, searchStatus: string) => {
            if (searchStatus === window.google.maps.places.PlacesServiceStatus.OK && results && results[0]?.place_id) {
                const placeId = results[0].place_id;
                
                const detailRequest = {
                    placeId,
                    fields: ['name', 'rating', 'user_ratings_total', 'price_level', 'formatted_address', 'vicinity', 'geometry', 'photos', 'opening_hours', 'place_id', 'types']
                };

                service.getDetails(detailRequest, (placeDetails: any, detailStatus: string) => {
                    if (detailStatus === window.google.maps.places.PlacesServiceStatus.OK && placeDetails) {
                        setSelectedPlaceDetails(placeDetails);
                        setRestaurants([placeDetails]);
                        setSelectedRestaurantId(placeDetails.place_id);
                        if (placeDetails.geometry?.location) {
                           setCurrentLocation(placeDetails.geometry.location);
                           mapInstanceRef.current?.panTo(placeDetails.geometry.location);
                           mapInstanceRef.current?.setZoom(16);
                        }
                        setStatus('success');
                        setPanelState('full');
                    } else {
                         setError('Could not fetch place details. Please try again.');
                         setStatus('error');
                    }
                });
            } else {
                setError(`No results found for "${searchQuery}".`);
                setStatus('error');
            }
        });
    };

    const handleClearSearch = () => {
        setSelectedPlaceDetails(null);
        setSearchQuery('');
        setSelectedRestaurantId(null);
        handleRequestLocationAndSearch();
    };
    
    const getPanelHeight = () => {
        switch(panelState) {
            case 'hidden': return 'h-0';
            case 'peek': return 'h-1/3';
            case 'full': return 'h-1/2';
            default: return 'h-0';
        }
    }

    return (
        <div className="w-full h-full relative overflow-hidden bg-gray-100">
            <MapComponent
                center={currentLocation}
                restaurants={restaurants}
                selectedRestaurantId={selectedRestaurantId}
                onMapLoad={handleMapLoad}
                onMarkerClick={handleMarkerClick}
            />

            {/* Top Search Bar */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-md z-10">
                <div className="bg-white p-2 rounded-2xl shadow-lg">
                    <form onSubmit={handleSearch} className="relative flex items-center">
                        {selectedPlaceDetails ? (
                            <button type="button" onClick={handleClearSearch} className="absolute left-0 ml-3 p-1 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-200" aria-label="Back to results">
                                <ArrowLeftIcon className="w-6 h-6" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleRequestLocationAndSearch}
                                disabled={status === 'locating' || status === 'searching'}
                                className="absolute left-0 ml-3 p-1 rounded-full text-indigo-600 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Find nearby restaurants"
                            >
                                {status === 'locating' || status === 'searching' ?
                                    <Spinner className="w-6 h-6" /> :
                                    <LocationMarkerIcon className="w-6 h-6" />}
                            </button>
                        )}
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for a place..."
                            className="w-full bg-gray-100 border-2 border-gray-200 rounded-lg py-3 pl-12 pr-12 text-gray-900 focus:outline-none focus:border-indigo-500"
                        />
                        <button type="submit" className="absolute right-0 mr-3 p-1 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-gray-200" aria-label="Search">
                            <SearchIcon className="w-6 h-6"/>
                        </button>
                    </form>
                </div>
            </div>

            {/* Bottom Results Panel */}
            <div className={`absolute ${isDetailView ? 'bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-md' : 'bottom-0 left-0 right-0'} ${getPanelHeight()} transition-all duration-500 ease-in-out z-10`}>
                <div className={`bg-white ${isDetailView ? 'rounded-2xl shadow-lg' : 'rounded-t-2xl shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.3)]'} h-full flex flex-col`}>
                    <div className="w-full py-2 flex justify-center items-center cursor-pointer flex-shrink-0" onPointerDown={() => setPanelState(panelState === 'full' ? 'peek' : 'full')}>
                        <MinusIcon className="w-8 h-2 text-gray-400" />
                    </div>
                    <div className="px-4 pb-4 flex-grow overflow-y-auto">
                        {status === 'idle' && restaurants.length === 0 && !error && !selectedPlaceDetails && (
                             <div className="text-center text-gray-600 p-4">Search for a place or find nearby restaurants to see results here.</div>
                        )}
                        {status === 'locating' && <div className="text-center text-gray-600 p-4 flex items-center justify-center"><Spinner className="mr-2"/>Getting your location...</div>}
                        {error && <div className="text-red-700 bg-red-100 p-3 rounded-lg mx-3">{error}</div>}
                        
                        {selectedPlaceDetails ? (
                            <PlaceDetailCard place={selectedPlaceDetails} onClose={handleClearSearch} />
                        ) : (
                            <div className="space-y-3 mt-2">
                                {restaurants.map((restaurant) => (
                                    <RestaurantCard
                                        key={restaurant.place_id}
                                        restaurant={restaurant}
                                        isSelected={selectedRestaurantId === restaurant.place_id}
                                        onMouseEnter={() => setSelectedRestaurantId(restaurant.place_id || null)}
                                        onMouseLeave={() => setSelectedRestaurantId(null)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;