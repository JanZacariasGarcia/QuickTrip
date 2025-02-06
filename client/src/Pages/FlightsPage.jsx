import { useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from 'react';
import axios from 'axios';

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

    async function getFlights(index, dep, dest) {
        const options = {
            method: 'GET',
            url: 'https://booking-com15.p.rapidapi.com/api/v1/flights/searchFlights',
            params: {
                fromId: dep + '.AIRPORT',
                toId: dest + '.AIRPORT',
                pageNo: '1',
                adults: '1',
                children: '0,17',
                sort: 'BEST',
                cabinClass: 'ECONOMY',
                currency_code: 'AED'
            },
            headers: {
                'x-rapidapi-key': '92d970d30cmsh1f8198993778dd8p137efcjsn9cba1685733a',
                'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
            }
        };

        try {
            const response = await axios.request(options);
            console.log(response.data);
        } catch (error) {
            console.error(error);
        }
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
    )
}
{error && <p className="text-red-500">{error}</p>}
        </div>
    );
}