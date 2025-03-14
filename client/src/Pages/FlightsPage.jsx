import { useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from 'react';
import axios from 'axios';
import DisplayFlights from "../DisplayFlights.jsx";

export default function FlightsPage() {
    const { dates } = useParams();
    const [searchParams] = useSearchParams();
    const [cities, setCities] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [codes, setCodes] = useState(null);

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
            setCities(response.data.cities); // Assuming the response is { cities: "..." }
        } catch (error) {
            // Handle Axios errors
            setError(error.response ? error.response.data.message : error.message);
        } finally {
            setLoading(false);
        }
    }

    async function getAirportCodes(citiesString){
        setLoading(true);
        setError(null);
        const parsedCities = parseResponse(citiesString);
        try {
            const response = await axios.post(
                'http://localhost:4000/airports',
                { airports: parsedCities },  // Match the backend expected property name
                { withCredentials: true }
            );
            setCodes(response.data.airports);
        } catch (error) {
            setError(error.response ? error.response.data : error.message);
        } finally {
            setLoading(false);
        }
    }

    function parseResponse(citiesString) {
        // Use regex to extract city names between **
        const cityMatches = citiesString.match(/\*\*(.*?)\*\*/g);
        if (cityMatches) {
            // Remove the ** from the matches
            return cityMatches.map(city => city.replace(/\*\*/g, ''));
        }
        return [];
    }

    useEffect(() => {
        getCities();
    }, []); // Fetch cities when the component mounts

    useEffect(() => {
        if (cities) {
            getAirportCodes(cities);
        }
    }, [cities]);

    return (
        <div>
            <button
                onClick={getCities}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded"
            >
                {loading ? 'Loading...' : 'Cities:'}
            </button>
            {cities !== null && codes !== null && (
                <div className="mt-4 col">
                    {codes.map((airport) => (
                        <li key={airport.code}>
                            <strong>{airport.city}</strong> - {airport.code}
                        </li>
                    ))}
                </div>
            )}
            {codes && (
                <DisplayFlights
                    airports={codes}
                    home={"DUB"}
                    departureDate={startDate}
                    returnDate={endDate}
                />
            )}
            {error && <p className="text-red-500">{error}</p>}
        </div>
    );
}