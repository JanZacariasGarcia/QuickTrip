import {useEffect, useState} from "react";
import axios from "axios";
import {differenceInCalendarDays, format} from "date-fns";
import {Link} from "react-router-dom";
import BookingDates from "../BookingDates";

export default function BookingsPage(){
    const [bookings, setBookings] = useState([]);
    const [savedFlights, setSavedFlights] = useState([]);
    const [activeTab, setActiveTab] = useState('bookings');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Load bookings
        axios.get('/bookings').then(response => {
            setBookings(response.data);
        }).catch(err => {
            console.error('Error loading bookings:', err);
        });

        // Load saved flights
        loadSavedFlights();
    }, []);

    const loadSavedFlights = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/saved-flights', {
                withCredentials: true
            });

            if (response.data.success) {
                setSavedFlights(response.data.savedFlights);
            } else {
                throw new Error('Failed to fetch saved flights');
            }
        } catch (err) {
            console.error('Error fetching saved flights:', err);
            setError(err.response?.data?.error || 'Failed to load saved flights');
        } finally {
            setLoading(false);
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

    return(
        <div>
            {/* Tab Navigation */}
            <div className="max-w-4xl mx-auto mb-6">
                    <div className="flex border-b border-gray-200 bg-transparent">
                    <button
                        onClick={() => setActiveTab('bookings')}
                        className={`px-6 py-3 font-medium text-sm bg-white transition-colors ${
                            activeTab === 'bookings'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Bookings ({bookings.length})
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
                </div>
            </div>

            <div className="max-w-4xl mx-auto">
                {/* Bookings Tab */}
                {activeTab === 'bookings' && (
                    <div className="space-y-4">
                        {bookings?.length > 0 ? (
                            bookings.map(booking => (
                                <Link
                                    key={booking._id}
                                    to={`/account/bookings/${booking._id}`}
                                    className="flex gap-4 bg-gray-200 rounded-2xl overflow-hidden hover:bg-gray-300 transition-colors"
                                >
                                    <div className="w-48">
                                        <PlaceImg place={booking.place}/>
                                    </div>
                                    <div className="py-3 pr-3 grow">
                                        <h2 className="text-xl">{booking.place.title}</h2>
                                        <div className="text-xl">
                                            <BookingDates booking={booking} className="py-2 mt-2 mb-1 text-gray-500 border-t border-gray-300"/>
                                            <div className="text-2xl">
                                                Total Price: €{booking.price}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <div className="text-6xl mb-4">🏨</div>
                                <h3 className="text-xl font-medium mb-2">No bookings yet</h3>
                                <p>Your accommodation bookings will appear here</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Saved Flights Tab */}
                {activeTab === 'flights' && (
                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <p className="mt-4 text-gray-500">Loading your saved flights...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-12 text-red-600">
                                <p>{error}</p>
                                <button
                                    onClick={loadSavedFlights}
                                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : savedFlights.length > 0 ? (
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
                                            <button
                                                onClick={() => window.open(flight.pageUrl, '_blank')}
                                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                            >
                                                Book Now
                                            </button>
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