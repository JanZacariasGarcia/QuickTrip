import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function ItineraryDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [itinerary, setItinerary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadItinerary();
    }, [id]);

    const loadItinerary = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/itineraries/${id}`, {
                withCredentials: true
            });

            if (response.data.success) {
                setItinerary(response.data.itinerary);
            } else {
                setError('Failed to load itinerary');
            }
        } catch (err) {
            console.error('Error loading itinerary:', err);
            if (err.response?.status === 404) {
                setError('Itinerary not found');
            } else {
                setError('Failed to load itinerary');
            }
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (timeString) => {
        // Handle various time formats
        if (!timeString) return '';

        // If it's already formatted nicely, return as is
        if (timeString.includes('AM') || timeString.includes('PM')) {
            return timeString;
        }

        // If it's a 24-hour format like "09:00", convert it
        if (timeString.match(/^\d{1,2}:\d{2}$/)) {
            const [hours, minutes] = timeString.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${minutes} ${ampm}`;
        }

        return timeString;
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto py-12">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-500">Loading itinerary...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto py-12">
                <div className="text-center">
                    <div className="text-6xl mb-4">😔</div>
                    <h2 className="text-2xl font-bold mb-2">Oops!</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Link
                        to="/account/bookings"
                        className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Back to Itineraries
                    </Link>
                </div>
            </div>
        );
    }

    if (!itinerary) {
        return null;
    }

    return (
        <div className="max-w-4xl mx-auto py-6">
            {/* Header */}
            <div className="mb-8">
                <Link
                    to="/account/bookings"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
                >
                    ← Back to Itineraries
                </Link>

                <div className="bg-white rounded-2xl p-8 border border-gray-200">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="text-4xl">🗺️</div>
                        <div>
                            <h1 className="text-3xl font-bold capitalize">
                                {itinerary.destination.replace(/-/g, ' ')} Adventure
                            </h1>
                            <p className="text-gray-600 text-lg">
                                {formatDate(itinerary.startDate)} - {formatDate(itinerary.endDate)}
                            </p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 mt-6">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{itinerary.duration}</div>
                            <div className="text-sm text-gray-600">Days</div>
                        </div>

                        {itinerary.totalEstimatedCost && (
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">{itinerary.totalEstimatedCost}</div>
                                <div className="text-sm text-gray-600">Estimated Cost</div>
                            </div>
                        )}

                        {itinerary.preferences && (
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                                <div className="text-lg font-bold text-purple-600 capitalize">
                                    {itinerary.preferences.activityLevel || 'Intermediate'}
                                </div>
                                <div className="text-sm text-gray-600">Activity Level</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Transportation */}
            {itinerary.transportation && (
                <div className="mb-8">
                    <div className="bg-white rounded-2xl p-6 border border-gray-200">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            🚗 Getting Around
                        </h2>
                        <p className="text-gray-700 mb-4">{itinerary.transportation.getting_around}</p>

                        {itinerary.transportation.recommendations && itinerary.transportation.recommendations.length > 0 && (
                            <div>
                                <h3 className="font-semibold mb-2">Recommendations:</h3>
                                <ul className="list-disc list-inside space-y-1 text-gray-700">
                                    {itinerary.transportation.recommendations.map((rec, index) => (
                                        <li key={index}>{rec}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Daily Itinerary */}
            {itinerary.days && itinerary.days.length > 0 && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold">Daily Itinerary</h2>

                    {itinerary.days.map((day, dayIndex) => (
                        <div key={dayIndex} className="bg-white rounded-2xl p-6 border border-gray-200">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">
                                    {day.day}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">{formatDate(day.date)}</h3>
                                    {day.theme && (
                                        <p className="text-gray-600">{day.theme}</p>
                                    )}
                                </div>
                            </div>

                            {/* Activities */}
                            {day.activities && day.activities.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        🎯 Activities
                                    </h4>
                                    <div className="space-y-4">
                                        {day.activities.map((activity, actIndex) => (
                                            <div key={actIndex} className="border-l-4 border-blue-200 pl-4 py-2">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h5 className="font-semibold text-lg">{activity.name}</h5>
                                                    {activity.time && (
                                                        <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                            {formatTime(activity.time)}
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-gray-700 mb-2">{activity.description}</p>

                                                <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                                                    {activity.location && (
                                                        <div className="flex items-center gap-1">
                                                            <span>📍</span>
                                                            <span>{activity.location}</span>
                                                        </div>
                                                    )}
                                                    {activity.duration && (
                                                        <div className="flex items-center gap-1">
                                                            <span>⏱️</span>
                                                            <span>{activity.duration}</span>
                                                        </div>
                                                    )}
                                                    {activity.cost && (
                                                        <div className="flex items-center gap-1">
                                                            <span>💰</span>
                                                            <span>{activity.cost}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {activity.tips && (
                                                    <div className="mt-2 p-3 bg-yellow-50 rounded-lg">
                                                        <p className="text-sm text-yellow-800">
                                                            <strong>💡 Tip:</strong> {activity.tips}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Meals */}
                            {day.meals && day.meals.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        🍽️ Meals
                                    </h4>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {day.meals.map((meal, mealIndex) => (
                                            <div key={mealIndex} className="border rounded-lg p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h5 className="font-semibold capitalize">{meal.time}</h5>
                                                    {meal.cost && (
                                                        <span className="text-green-600 font-semibold">{meal.cost}</span>
                                                    )}
                                                </div>
                                                <p className="font-medium">{meal.restaurant}</p>
                                                <p className="text-sm text-gray-600">{meal.cuisine} cuisine</p>
                                                {meal.location && (
                                                    <p className="text-sm text-gray-500 mt-1">📍 {meal.location}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Daily Cost */}
                            {day.totalEstimatedCost && (
                                <div className="pt-4 border-t border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold">Day {day.day} Estimated Cost:</span>
                                        <span className="text-lg font-bold text-green-600">{day.totalEstimatedCost}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* General Tips */}
            {itinerary.generalTips && itinerary.generalTips.length > 0 && (
                <div className="mt-8">
                    <div className="bg-white rounded-2xl p-6 border border-gray-200">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            💡 General Tips
                        </h2>
                        <ul className="space-y-2">
                            {itinerary.generalTips.map((tip, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <span className="text-yellow-500 mt-1">💡</span>
                                    <span className="text-gray-700">{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Raw Content Fallback */}
            {itinerary.rawContent && !itinerary.days && (
                <div className="mt-8">
                    <div className="bg-white rounded-2xl p-6 border border-gray-200">
                        <h2 className="text-2xl font-bold mb-4">Itinerary Details</h2>
                        <div className="prose max-w-none">
                            <pre className="whitespace-pre-wrap text-gray-700">{itinerary.rawContent}</pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}