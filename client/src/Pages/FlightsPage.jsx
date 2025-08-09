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

            setCities(response.data.cities);
        } catch (error) {
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
                { airports: parsedCities },
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
        const cityMatches = citiesString.match(/\*\*(.*?)\*\*/g);
        if (cityMatches) {
            return cityMatches.map(city => city.replace(/\*\*/g, ''));
        }
        return [];
    }

    useEffect(() => {
        getCities();
    }, []);

    useEffect(() => {
        if (cities) {
            getAirportCodes(cities);
        }
    }, [cities]);

    return (
        <div>
            {/* Only show DisplayFlights when we have airport codes */}
            {codes && (
                <DisplayFlights
                    airports={codes}
                    home={"DUB"}
                    departureDate={startDate}
                    returnDate={endDate}
                    budget={budget}
                />
            )}
            {loading && (
                <div className="flex justify-center items-center py-8">
                    <div className="text-lg">Loading flight recommendations...</div>
                </div>
            )}
            {error && <p className="text-red-500 text-center py-4">{error}</p>}
        </div>
    );
}