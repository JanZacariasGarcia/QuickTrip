import { useParams, useSearchParams } from "react-router-dom";
import { useState } from 'react';
import axios from 'axios';

export default function FlightsPage() {
    const { dates } = useParams();
    const [searchParams] = useSearchParams();
    const [cities, setCities] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Get individual parameters
    const [startDate, endDate] = dates.split('->');
    const weather = searchParams.get('weather');
    const duration = searchParams.get('duration');
    const activity = searchParams.get('activity');
    const budget = searchParams.get('budget');

    async function getCities() {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(
                'http://localhost:4000/cities',
                { startDate, endDate, weather, budget },
                { withCredentials: true }
            );

            // Axios automatically parses the response data, so you can access it directly
            setCities(response.data.cities);
        } catch (error) {
            // Handle Axios errors
            setError(error.response ? error.response.data.message : error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <button
                onClick={getCities}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded"
            >
                {loading ? 'Loading...' : 'Get Cities'}
            </button>
            {cities !== null && (
                <div className="mt-4 col">
                    <pre>{cities}</pre>
                </div>
            )}
            {error && <p className="text-red-500">{error}</p>}

        </div>
    );
}