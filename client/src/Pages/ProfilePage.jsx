import {useContext, useState, useEffect} from "react";
import {UserContext} from "../UserContext";
import {Navigate, useParams, Link} from "react-router-dom";
import axios from "axios";

export default function ProfilePage(){
    const [toHome, setToHome] = useState(null);
    const [savedFlightsCount, setSavedFlightsCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const {ready, user, setUser} = useContext(UserContext);

    let {subpage} = useParams();
    if(subpage === undefined){
        subpage = 'profile';
    }

    useEffect(() => {
        // Load saved flights count for the profile summary
        if (user) {
            loadSavedFlightsCount();
        }
    }, [user]);

    const loadSavedFlightsCount = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/saved-flights', {
                withCredentials: true
            });

            if (response.data.success) {
                setSavedFlightsCount(response.data.savedFlights.length);
            }
        } catch (err) {
            console.error('Error fetching saved flights count:', err);
            // Don't show error for this, it's just for summary
        } finally {
            setLoading(false);
        }
    };

    async function logout() {
        await axios.post('/logout');
        setToHome('/');
        setUser(null);
    }

    if(!ready){
        return 'Loading...';
    }

    if(ready && !user && !toHome){
        return <Navigate to={'/login'}/>
    }

    if(toHome){
        return <Navigate to={toHome}/>
    }

    return(
        <div>
            {subpage === 'profile' && (
                <div className="max-w-2xl mx-auto">
                    {/* User Info Section */}
                    <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-200 mb-6">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl font-bold text-blue-600">
                                {user.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">
                            Welcome, {user.name}!
                        </h1>
                        <p className="text-gray-600 mb-6">{user.email}</p>
                        <button
                            onClick={logout}
                            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Logout
                        </button>
                    </div>

                    {/* Quick Stats Section */}
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                        <Link
                            to="/account/bookings"
                            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all group"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                                        My Itineraries
                                    </h3>
                                    <p className="text-gray-600 text-sm">View your accommodation reservations</p>
                                </div>
                                <div className="text-3xl">🏨</div>
                            </div>
                        </Link>

                        <Link
                            to="/account/bookings"
                            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all group"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                                        Saved Flights
                                    </h3>
                                    <p className="text-gray-600 text-sm">
                                        {loading ? 'Loading...' : `${savedFlightsCount} flight${savedFlightsCount !== 1 ? 's' : ''} saved`}
                                    </p>
                                </div>
                                <div className="text-3xl">⭐</div>
                            </div>
                        </Link>
                    </div>

                    {/* Recent Activity Section */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <Link
                                to="/"
                                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-xl">🔍</div>
                                    <div>
                                        <span className="font-medium text-gray-800 group-hover:text-blue-600">Search Flights</span>
                                        <p className="text-sm text-gray-600">Find your next adventure</p>
                                    </div>
                                </div>
                                <div className="text-gray-400 group-hover:text-gray-600">→</div>
                            </Link>

                            <Link
                                to="/account/bookings"
                                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-xl">📋</div>
                                    <div>
                                        <span className="font-medium text-gray-800 group-hover:text-blue-600">Manage Bookings</span>
                                        <p className="text-sm text-gray-600">View and manage your trips</p>
                                    </div>
                                </div>
                                <div className="text-gray-400 group-hover:text-gray-600">→</div>
                            </Link>

                            {savedFlightsCount > 0 && (
                                <Link
                                    to="/account/bookings"
                                    onClick={() => {
                                        // You can add a URL parameter to auto-switch to flights tab
                                        // or create a separate route for flights
                                    }}
                                    className="flex items-center justify-between p-3 rounded-lg border border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="text-xl">⚡</div>
                                        <div>
                                            <span className="font-medium text-orange-800 group-hover:text-orange-900">
                                                Check Saved Flights
                                            </span>
                                            <p className="text-sm text-orange-700">
                                                You have {savedFlightsCount} flight{savedFlightsCount !== 1 ? 's' : ''} saved
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-orange-600 group-hover:text-orange-800">→</div>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}