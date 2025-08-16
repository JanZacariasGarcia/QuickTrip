import {useEffect, useState} from "react";
import axios from "axios";
import {differenceInCalendarDays, format} from "date-fns";
import {Link} from "react-router-dom";

export default function ItinerariesPage(){
    const [itineraries, setItineraries] = useState([]);
    const [savedFlights, setSavedFlights] = useState([]);
    const [activeTab, setActiveTab] = useState('itineraries');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [generatingItinerary, setGeneratingItinerary] = useState(null);
    const [selectedDestination, setSelectedDestination] = useState(null);
    const [itineraryOptions, setItineraryOptions] = useState({
        activityLevel: 'intermediate',
        duration: 'full-day',
        interests: [],
        budget: 'moderate'
    });

    useEffect(() => {
        // Load existing itineraries
        loadItineraries();

        // Load saved flights for potential itinerary generation
        loadSavedFlights();
    }, []);

    const loadItineraries = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/itineraries', {
                withCredentials: true
            });

            if (response.data.success) {
                setItineraries(response.data.itineraries);
            }
        } catch (err) {
            console.error('Error loading itineraries:', err);
            setError('Failed to load itineraries');
        } finally {
            setLoading(false);
        }
    };

    const loadSavedFlights = async () => {
        try {
            const response = await axios.get('/api/saved-flights', {
                withCredentials: true
            });

            if (response.data.success) {
                setSavedFlights(response.data.savedFlights);
            }
        } catch (err) {
            console.error('Error fetching saved flights:', err);
        }
    };

    const generateItinerary = async (destination, departureDate, returnDate, customOptions = null) => {
        try {
            setGeneratingItinerary(destination);

            const options = customOptions || itineraryOptions;

            const response = await axios.post('/api/generate-itinerary', {
                destination,
                departureDate,
                returnDate,
                preferences: {
                    activityLevel: options.activityLevel,
                    duration: options.duration,
                    interests: options.interests,
                    budget: options.budget
                }
            }, {
                withCredentials: true
            });

            if (response.data.success) {
                // Add the new itinerary to the list
                setItineraries(prev => [response.data.itinerary, ...prev]);
                setSelectedDestination(null); // Close the options modal
                // Reset options
                setItineraryOptions({
                    activityLevel: 'intermediate',
                    duration: 'full-day',
                    interests: [],
                    budget: 'moderate'
                });
            } else {
                throw new Error(response.data.error || 'Failed to generate itinerary');
            }
        } catch (err) {
            console.error('Error generating itinerary:', err);
            alert(err.response?.data?.error || 'Failed to generate itinerary. Please try again.');
        } finally {
            setGeneratingItinerary(null);
        }
    };

    const handleInterestToggle = (interest) => {
        setItineraryOptions(prev => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest]
        }));
    };

    const deleteItinerary = async (itineraryId) => {
        if (!confirm('Are you sure you want to delete this itinerary?')) {
            return;
        }

        try {
            const response = await axios.delete(`/api/itineraries/${itineraryId}`, {
                withCredentials: true
            });

            if (response.data.success) {
                setItineraries(prev => prev.filter(itinerary => itinerary._id !== itineraryId));
            }
        } catch (err) {
            console.error('Error deleting itinerary:', err);
            alert('Failed to delete itinerary');
        }
    };

    const handleRemoveFlight = async (flightId) => {
        try {
            const response = await axios.delete(`/api/save-flight/${flightId}`, {
                withCredentials: true
            });

            if (response.data.success) {
                setSavedFlights(prev => prev.filter(flight => flight._id !== flightId));
            }
        } catch (err) {
            console.error('Error removing flight:', err);
            alert('Failed to remove flight');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getDaysUntilDeparture = (departureDate) => {
        const today = new Date();
        const departure = new Date(departureDate);
        const diffTime = departure - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getTimeSinceScraping = (scrapedAt) => {
        const now = new Date();
        const scraped = new Date(scrapedAt);
        const diffHours = Math.floor((now - scraped) / (1000 * 60 * 60));

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;

        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    };

    const getUniqueDestinations = () => {
        const destinations = savedFlights.map(flight => ({
            city: flight.city,
            code: flight.code,
            departureDate: flight.departureDate,
            returnDate: flight.returnDate
        }));

        // Remove duplicates based on city
        const unique = destinations.filter((dest, index, self) =>
            index === self.findIndex(d => d.city === dest.city)
        );

        return unique;
    };

    return(
        <div>
            {/* Tab Navigation */}
            <div className="max-w-4xl mx-auto mb-6">
                <div className="flex border-b border-gray-200 bg-transparent">
                    <button
                        onClick={() => setActiveTab('itineraries')}
                        className={`px-6 py-3 font-medium text-sm bg-white transition-colors ${
                            activeTab === 'itineraries'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        My Itineraries ({itineraries.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('flights')}
                        className={`px-6 py-3 font-medium text-sm bg-white transition-colors ${
                            activeTab === 'flights'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Saved Flights ({savedFlights.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('generate')}
                        className={`px-6 py-3 font-medium text-sm bg-white transition-colors ${
                            activeTab === 'generate'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Generate New
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto">
                {/* My Itineraries Tab */}
                {activeTab === 'itineraries' && (
                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <p className="mt-4 text-gray-500">Loading your itineraries...</p>
                            </div>
                        ) : itineraries.length > 0 ? (
                            itineraries.map((itinerary) => (
                                <div
                                    key={itinerary._id}
                                    className="bg-white rounded-2xl p-6 border border-gray-200 transition-all hover:shadow-md"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="text-2xl">📋</div>
                                            <div>
                                                <h3 className="text-xl font-semibold capitalize">
                                                    {itinerary.destination.replace(/-/g, ' ')} Itinerary
                                                </h3>
                                                <p className="text-gray-500 text-sm">
                                                    {formatDate(itinerary.startDate)} - {formatDate(itinerary.endDate)}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            className="bg-white text-gray-400 hover:text-red-500 transition-colors text-xl"
                                            onClick={() => deleteItinerary(itinerary._id)}
                                            title="Delete itinerary"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <div className="mb-4">
                                        <div className="text-sm text-gray-600 mb-2">
                                            Duration: {Math.ceil((new Date(itinerary.endDate) - new Date(itinerary.startDate)) / (1000 * 60 * 60 * 24))} days
                                        </div>

                                        {itinerary.activities && itinerary.activities.length > 0 && (
                                            <div className="mb-3">
                                                <h4 className="font-medium mb-2">Highlights:</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {itinerary.activities.slice(0, 3).map((activity, index) => (
                                                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                                            {activity.name || activity.title}
                                                        </span>
                                                    ))}
                                                    {itinerary.activities.length > 3 && (
                                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                            +{itinerary.activities.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                                        <div className="text-sm text-gray-500">
                                            Created: {new Date(itinerary.createdAt).toLocaleDateString()}
                                        </div>
                                        <Link
                                            to={`/itineraries/${itinerary._id}`}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <div className="text-6xl mb-4">📋</div>
                                <h3 className="text-xl font-medium mb-2">No Itineraries Yet</h3>
                                <p className="mb-4">Create personalized travel itineraries for your saved destinations</p>
                                <button
                                    onClick={() => setActiveTab('generate')}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Generate First Itinerary
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Generate New Itinerary Tab */}
                {activeTab === 'generate' && (
                    <div className="space-y-4">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold mb-2">Generate New Itinerary</h2>
                            <p className="text-gray-600">Create a personalized itinerary for your saved flight destinations</p>
                        </div>

                        {getUniqueDestinations().length > 0 ? (
                            <div className="grid gap-4">
                                {getUniqueDestinations().map((destination, index) => (
                                    <div
                                        key={index}
                                        className="bg-white rounded-2xl p-6 border border-gray-200 transition-all hover:shadow-md"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="text-2xl">🌍</div>
                                                <div>
                                                    <h3 className="text-xl font-semibold capitalize">
                                                        {destination.city.replace(/-/g, ' ')}
                                                    </h3>
                                                    <p className="text-gray-500 text-sm">
                                                        {formatDate(destination.departureDate)} - {formatDate(destination.returnDate)}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setSelectedDestination(destination)}
                                                disabled={generatingItinerary === destination.city}
                                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                {generatingItinerary === destination.city ? (
                                                    <>
                                                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                        Generating...
                                                    </>
                                                ) : (
                                                    'Customize & Generate'
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {/* Itinerary Customization Modal */}
                                {selectedDestination && (
                                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                                            <div className="flex justify-between items-center mb-6">
                                                <h2 className="text-2xl font-bold capitalize">
                                                    Customize Your {selectedDestination.city.replace(/-/g, ' ')} Itinerary
                                                </h2>
                                                <button
                                                    onClick={() => setSelectedDestination(null)}
                                                    className="text-gray-400 bg-white hover:text-red-600 text-2xl"
                                                >
                                                    ✕
                                                </button>
                                            </div>

                                            <div className="space-y-6">
                                                {/* Activity Level */}
                                                <div>
                                                    <label className="block text-lg font-semibold mb-3">Activity Level</label>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {[
                                                            { value: 'relaxed', label: 'Relaxed', desc: 'Take it easy, minimal walking', icon: '🛋️' },
                                                            { value: 'intermediate', label: 'Intermediate', desc: 'Balanced pace, moderate activity', icon: '🚶' },
                                                            { value: 'active', label: 'Active', desc: 'Fast-paced, lots of activities', icon: '🏃' }
                                                        ].map(option => (
                                                            <button
                                                                key={option.value}
                                                                onClick={() => setItineraryOptions(prev => ({...prev, activityLevel: option.value}))}
                                                                className={`p-4 rounded-lg border-2 transition-all text-center ${
                                                                    itineraryOptions.activityLevel === option.value
                                                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                                        : 'border-gray-200 hover:border-gray-300'
                                                                }`}
                                                            >
                                                                <div className="text-2xl mb-2">{option.icon}</div>
                                                                <div className="font-medium">{option.label}</div>
                                                                <div className="text-xs text-gray-600 mt-1">{option.desc}</div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Duration Style */}
                                                <div>
                                                    <label className="block text-lg font-semibold mb-3">Duration Style</label>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {[
                                                            { value: 'half-day', label: 'Half Day', desc: '3-4 hours per activity', icon: '🌅' },
                                                            { value: 'full-day', label: 'Full Day', desc: '6-8 hours of activities', icon: '☀️' },
                                                            { value: 'multi-day', label: 'Multi Day', desc: 'Activities spanning multiple days', icon: '📅' }
                                                        ].map(option => (
                                                            <button
                                                                key={option.value}
                                                                onClick={() => setItineraryOptions(prev => ({...prev, duration: option.value}))}
                                                                className={`p-4 rounded-lg border-2 transition-all text-center ${
                                                                    itineraryOptions.duration === option.value
                                                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                                        : 'border-gray-200 hover:border-gray-300'
                                                                }`}
                                                            >
                                                                <div className="text-2xl mb-2">{option.icon}</div>
                                                                <div className="font-medium">{option.label}</div>
                                                                <div className="text-xs text-gray-600 mt-1">{option.desc}</div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Budget */}
                                                <div>
                                                    <label className="block text-lg font-semibold mb-3">Budget Range</label>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {[
                                                            { value: 'budget', label: 'Budget', desc: 'Free & low-cost activities', icon: '💰' },
                                                            { value: 'moderate', label: 'Moderate', desc: 'Mix of free & paid activities', icon: '💳' },
                                                            { value: 'luxury', label: 'Luxury', desc: 'Premium experiences', icon: '💎' }
                                                        ].map(option => (
                                                            <button
                                                                key={option.value}
                                                                onClick={() => setItineraryOptions(prev => ({...prev, budget: option.value}))}
                                                                className={`p-4 rounded-lg border-2 transition-all text-center ${
                                                                    itineraryOptions.budget === option.value
                                                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                                        : 'border-gray-200 hover:border-gray-300'
                                                                }`}
                                                            >
                                                                <div className="text-2xl mb-2">{option.icon}</div>
                                                                <div className="font-medium">{option.label}</div>
                                                                <div className="text-xs text-gray-600 mt-1">{option.desc}</div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Interests */}
                                                <div>
                                                    <label className="block text-lg font-semibold mb-3">Interests (Select all that apply)</label>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                        {[
                                                            { value: 'culture', label: 'Culture', icon: '🏛️' },
                                                            { value: 'food', label: 'Food', icon: '🍽️' },
                                                            { value: 'nightlife', label: 'Nightlife', icon: '🍻' },
                                                            { value: 'nature', label: 'Nature', icon: '🌿' },
                                                            { value: 'history', label: 'History', icon: '📚' },
                                                            { value: 'art', label: 'Art', icon: '🎨' },
                                                            { value: 'shopping', label: 'Shopping', icon: '🛍️' },
                                                            { value: 'adventure', label: 'Adventure', icon: '⛷️' }
                                                        ].map(interest => (
                                                            <button
                                                                key={interest.value}
                                                                onClick={() => handleInterestToggle(interest.value)}
                                                                className={`p-3 rounded-lg border-2 transition-all text-center ${
                                                                    itineraryOptions.interests.includes(interest.value)
                                                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                                        : 'border-gray-200 hover:border-gray-300'
                                                                }`}
                                                            >
                                                                <div className="text-lg mb-1">{interest.icon}</div>
                                                                <div className="text-sm font-medium">{interest.label}</div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Generate Button */}
                                            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                                                <button
                                                    onClick={() => setSelectedDestination(null)}
                                                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => generateItinerary(
                                                        selectedDestination.city,
                                                        selectedDestination.departureDate,
                                                        selectedDestination.returnDate,
                                                        itineraryOptions
                                                    )}
                                                    disabled={generatingItinerary === selectedDestination.city}
                                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                >
                                                    {generatingItinerary === selectedDestination.city ? (
                                                        <>
                                                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                            Generating Itinerary...
                                                        </>
                                                    ) : (
                                                        'Generate Itinerary'
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <div className="text-6xl mb-4">✈️</div>
                                <h3 className="text-xl font-medium mb-2">No Saved Flights</h3>
                                <p className="mb-4">Save some flights first to generate itineraries for your destinations</p>
                                <Link
                                    to="/search"
                                    className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Search Flights
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {/* Saved Flights Tab (kept for reference/management) */}
                {activeTab === 'flights' && (
                    <div className="space-y-4">
                        {savedFlights.length > 0 ? (
                            savedFlights.map((flight) => {
                                const daysUntilDeparture = getDaysUntilDeparture(flight.departureDate);
                                const isExpiringSoon = daysUntilDeparture <= 2;

                                return (
                                    <div
                                        key={flight._id}
                                        className={`bg-white rounded-2xl p-6 border transition-all hover:shadow-md ${
                                            isExpiringSoon ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="text-2xl">✈️</div>
                                                <div>
                                                    <h3 className="text-xl font-semibold capitalize">
                                                        {flight.city.replace(/-/g, ' ')}
                                                    </h3>
                                                    {flight.code && (
                                                        <span className="text-gray-500 text-sm">({flight.code})</span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                className="text-gray-400 bg-white hover:text-red-500 transition-colors text-xl"
                                                onClick={() => handleRemoveFlight(flight._id)}
                                                title="Remove from saved flights"
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Departure:</span>
                                                    <span className="font-medium">{formatDate(flight.departureDate)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Return:</span>
                                                    <span className="font-medium">{formatDate(flight.returnDate)}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Price:</span>
                                                    <span className="text-2xl font-bold text-blue-600">€{flight.price}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Scraped:</span>
                                                    <span className="text-sm text-gray-500">{getTimeSinceScraping(flight.scrapedAt)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                                            <div>
                                                {daysUntilDeparture > 0 ? (
                                                    <span className={`text-sm ${isExpiringSoon ? 'text-orange-600 font-semibold' : 'text-gray-500'}`}>
                                                        {isExpiringSoon && '⚠️ '}
                                                        {daysUntilDeparture} day{daysUntilDeparture !== 1 ? 's' : ''} until departure
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-red-500">Departure date has passed</span>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => window.open(flight.pageUrl, '_blank')}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                                                >
                                                    Book Now
                                                </button>
                                            </div>
                                        </div>

                                        {isExpiringSoon && (
                                            <div className="mt-3 p-3 bg-orange-100 border border-orange-200 rounded-lg">
                                                <p className="text-sm text-orange-800">
                                                    <strong>Price Alert:</strong> This flight departs soon! Prices may have changed since it was saved.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <div className="text-6xl mb-4">⭐</div>
                                <h3 className="text-xl font-medium mb-2">No Saved Flights</h3>
                                <p>Start searching for flights and click the star to save your favorites!</p>
                                <Link
                                    to="/search"
                                    className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Search Flights
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}