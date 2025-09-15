// Fix: Removed the ineffective /// <reference> directive and replaced all Google Maps
// type annotations with `any` to resolve compilation errors.
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { SimplePlace } from './types';
import { MapComponent } from './components/MapComponent';
import { RestaurantCard } from './components/RestaurantCard';
import { PlaceDetailCard } from './components/PlaceDetailCard';
import { Spinner } from './components/Spinner';
import { SearchIcon, MinusIcon, XIcon } from './components/icons';

type Status = 'idle' | 'locating' | 'searching' | 'success' | 'error';
type PanelState = 'hidden' | 'peek' | 'full';

const deniedErrorMessage = (
    <div className="text-left text-sm">
        <p className="font-bold mb-2">Location Permission Denied</p>
        <p className="mb-2">To find restaurants near you, this app needs access to your location.</p>
        <p className="font-semibold mt-3 mb-1">Please try the following:</p>
        <ol className="list-decimal list-inside space-y-2">
            <li>
                <strong>Enable in Browser:</strong> Look for a lock icon 🔒 in the address bar. Click it, go to "Site Settings" or "Permissions," find "Location," and set it to "Allow."
            </li>
            <li>
                <strong>Reload the Page:</strong> After changing settings, you may need to fully reload the page. Try a hard refresh: <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Cmd+Shift+R</kbd> (Mac) or <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Ctrl+Shift+R</kbd> (Windows).
            </li>
            <li>
                <strong>Check OS Settings:</strong> Ensure location services are enabled for your browser in your operating system's privacy settings (e.g., in Windows Privacy or macOS Privacy & Security).
            </li>
        </ol>
        <p className="font-semibold mt-3 mb-1">Factors Affecting Accuracy:</p>
        <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
            <li>Using a VPN or proxy can report an incorrect location.</li>
            <li>Being indoors or in an area with a poor GPS signal may reduce accuracy.</li>
            <li>Ensure Wi-Fi is enabled for better results in urban areas.</li>
        </ul>
        <p className="mt-3 text-xs text-gray-500">Note: Geolocation requires a secure (HTTPS) connection.</p>
    </div>
);

const positionUnavailableErrorMessage = (
    <div className="text-left text-sm">
        <p className="font-bold mb-2">Location Unavailable</p>
        <p>We couldn't get your current position. This can happen for a few reasons:</p>
        <p className="font-semibold mt-3 mb-1">Please check the following:</p>
        <ul className="list-disc list-inside space-y-1">
            <li><strong>Network & GPS:</strong> Ensure you have a stable internet connection and that GPS is enabled on your device.</li>
            <li><strong>VPN/Proxy:</strong> Disable any VPN or proxy services, as they can interfere with location detection.</li>
            <li><strong>Environment:</strong> Accuracy is much better outdoors. Being indoors, especially in a large building, can block GPS signals.</li>
            <li><strong>Wi-Fi:</strong> Keeping Wi-Fi enabled (even if not connected) can significantly improve location accuracy in urban areas.</li>
        </ul>
    </div>
);


const App: React.FC = () => {
    const [currentLocation, setCurrentLocation] = useState<any | null>(null);
    const [restaurants, setRestaurants] = useState<SimplePlace[]>([]);
    const [status, setStatus] = useState<Status>('idle');
    const [error, setError] = useState<React.ReactNode | null>(null);
    const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPlaceDetails, setSelectedPlaceDetails] = useState<SimplePlace | null>(null);
    const [panelState, setPanelState] = useState<PanelState>('hidden');
    const [infoMessage, setInfoMessage] = useState<string | null>(null);

    const mapInstanceRef = useRef<any | null>(null);
    // Fix: The type for a timeout ID in the browser is `number`, not `NodeJS.Timeout`.
    const infoTimerRef = useRef<number | null>(null);
    
    useEffect(() => {
        return () => {
            if (infoTimerRef.current) {
                clearTimeout(infoTimerRef.current);
            }
        };
    }, []);

    const isDetailView = selectedPlaceDetails !== null;

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

    const handleRequestLocationAndSearch = useCallback(async () => {
        setStatus('locating');
        setRestaurants([]);
        setSelectedPlaceDetails(null);
        setSelectedRestaurantId(null);
        setError(null);
        setInfoMessage(null);
        if (infoTimerRef.current) clearTimeout(infoTimerRef.current);
        setPanelState('peek');
    
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.');
            setStatus('error');
            return;
        }
    
        try {
            if (navigator.permissions && navigator.permissions.query) {
                const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
                if (permissionStatus.state === 'denied') {
                    setError(deniedErrorMessage);
                    setStatus('error');
                    return;
                }
            }
        
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude, accuracy } = position.coords;
                    const userLocation = new window.google.maps.LatLng(latitude, longitude);
                    setCurrentLocation(userLocation);
                    setInfoMessage(`Location found with accuracy of ${Math.round(accuracy)} meters.`);
                    infoTimerRef.current = setTimeout(() => setInfoMessage(null), 5000);
                    findRestaurants(userLocation);
                },
                (geoError) => {
                    let errorMessage: React.ReactNode = 'Could not get your location. Please try again.';
                     if (geoError.code === geoError.PERMISSION_DENIED) {
                        errorMessage = deniedErrorMessage;
                    } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
                        errorMessage = positionUnavailableErrorMessage;
                    } else if (geoError.code === geoError.TIMEOUT) {
                        errorMessage = "The request to get user location timed out. Please try again."
                    }
                    setError(errorMessage);
                    setStatus('error');
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
        } catch (err) {
            console.error("Error checking permissions:", err);
            setError('An unexpected error occurred while checking location permissions.');
            setStatus('error');
        }
    }, [findRestaurants]);
    
    useEffect(() => {
        // On initial load, automatically request the user's location and search for restaurants.
        handleRequestLocationAndSearch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // This effect should run only once when the component mounts.

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
                <form onSubmit={handleSearch} className="relative flex items-center bg-white rounded-full shadow-md overflow-hidden h-14">
                    <div className="pl-5 pr-2 absolute left-0 top-0 h-full flex items-center pointer-events-none">
                        <SearchIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for a place..."
                        className="w-full h-full bg-transparent text-lg text-gray-800 placeholder-gray-500 pl-14 pr-14 focus:outline-none"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={handleClearSearch}
                            className="absolute right-0 p-4 text-gray-600 hover:text-gray-900 transition-colors"
                            aria-label="Clear search"
                        >
                            <XIcon className="w-6 h-6" />
                        </button>
                    )}
                </form>
                {infoMessage && (
                    <div className="mt-2 text-center text-sm text-gray-800 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-md animate-fade-in">
                        {infoMessage}
                    </div>
                )}
            </div>

            {/* Bottom Results Panel */}
            <div className={`absolute ${isDetailView ? 'bottom-4 left-[25px] right-[25px]' : 'bottom-0 left-0 right-0'} ${getPanelHeight()} transition-all duration-500 ease-in-out z-10`}>
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