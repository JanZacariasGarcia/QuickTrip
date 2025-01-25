import { useState } from "react";
import axios from "axios";

export default function PlaceFinder() {
    const [apiResponse, setApiResponse] = useState(null);
    const [error, setError] = useState(null);
    const [rawResponse, setRawResponse] = useState(null);

    const handleApiCall = async () => {
        const options = {
            method: "POST",
            url: 'https://sky-scanner3.p.rapidapi.com/flights/search-multi-city',
            data: {
                market: 'UK',
                locale: 'en-US',
                currency: 'EUR',
                adults: 1,
                children: 0,
                infants: 0,
                cabinClass: 'economy',
                stops: [
                    'direct',
                    '1stop',
                    '2stops'
                ],
                sort: 'cheapest_first',
                flights: [
                    {
                        fromEntityId: 'BCN',
                        toEntityId: 'DUB',
                        departDate: '2025-02-02'
                    },
                    {
                        fromEntityId: 'DUB',
                        toEntityId: 'BCN',
                        departDate: '2025-02-22'
                    }
                ],
            },
            headers: {
                "x-rapidapi-key": "92d970d30cmsh1f8198993778dd8p137efcjsn9cba1685733a",
                "x-rapidapi-host": "sky-scanner3.p.rapidapi.com",
            },
        };

        try { // Corrected here
            const response = await axios.request(options);
            setApiResponse(response.data); // Save API response to state
            setError(null); // Clear previous errors
        } catch (err) {
            setError(err.message); // Save the error message
            setApiResponse(null); // Clear previous API response
        }
    };

    return (
        <div>
            <div className="flex flex-col items-center mt-4">
                <button
                    onClick={handleApiCall}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                    Get Flight Info
                </button>

                {/* Display API Response */}
                {apiResponse && (
                    <div className="mt-4 p-4 bg-green-100 rounded-md">
                        <h3 className="font-bold">Sorted Flights:</h3>
                        <pre className="text-sm">{JSON.stringify(apiResponse, null, 2)}</pre>
                    </div>
                )}

                {/* Display Raw Response for Debugging */}
                {rawResponse && (
                    <div className="mt-4 p-4 bg-yellow-100 rounded-md">
                        <h3 className="font-bold">Raw API Response:</h3>
                        <pre className="text-xs">{JSON.stringify(rawResponse, null, 2)}</pre>
                    </div>
                )}

                {/* Display Error */}
                {error && (
                    <div className="mt-4 p-4 bg-red-100 rounded-md text-red-700">
                        <h3 className="font-bold">Error:</h3>
                        <p>{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
