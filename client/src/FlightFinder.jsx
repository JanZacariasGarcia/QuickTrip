import { useState } from "react";
import axios from "axios";

export default function FlightFinder() {
    const [apiResponse, setApiResponse] = useState(null);
    const [error, setError] = useState(null);
    const [flightData, setFlightData] = useState({
        ids: [],
        prices: [],
        legs: []
    });

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
                    '2stops',
                    '3stops'
                ],
                sort: 'cheapest_first',
                flights: [
                    {
                        fromEntityId: 'DUB',
                        toEntityId: 'LAX',
                        departDate: '2025-02-02'
                    },
                    {
                        fromEntityId: 'LAX',
                        toEntityId: 'DUB',
                        departDate: '2025-02-22'
                    }
                ],
            },
            headers: {
                "x-rapidapi-key": "92d970d30cmsh1f8198993778dd8p137efcjsn9cba1685733a",
                "x-rapidapi-host": "sky-scanner3.p.rapidapi.com",
            },
        };

        try {
            const response = await axios.request(options);
            if (response.data && response.data.data) {
                setApiResponse(response.data);
                setError(null);
                processFlightData(response.data.data);
            } else {
                throw new Error('Invalid API response format');
            }
        } catch (err) {
            setError(err.message);
            setApiResponse(null);
            setFlightData({ ids: [], prices: [], legs: [] });
        }
    };

    const processFlightData = (data) => {
        if (!data.itineraries) {
            setError('No itineraries found in response');
            return;
        }

        const newFlightData = {
            ids: [],
            prices: [],
            legs: []
        };

        data.itineraries.forEach((itinerary, index) => {
            if (itinerary) {
                newFlightData.ids[index] = itinerary.id;
                newFlightData.prices[index] = itinerary.price;
                newFlightData.legs[index] = itinerary.legs;
            }
        });

        setFlightData(newFlightData);
        console.log('Processed flight data:', newFlightData);
    };

    const formatPrice = (price) => {
        if (!price) return 'N/A';
        if (typeof price === 'object' && price.formatted) {
            return price.formatted;
        }
        if (typeof price === 'object' && price.raw) {
            return `€${price.raw.toFixed(2)}`;
        }
        return `€${price}`;
    };

    const formatLegs = (legs) => {
        if (!legs) return 'No legs information';
        try {
            return `${legs.origin.city} to ${legs.destination.city}`;
        } catch (e) {
            return 'Legs details unavailable';
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
                        <h3 className="font-bold">Flights:</h3>
                        <pre className="text-sm">{JSON.stringify(apiResponse.data, null, 2)}</pre>
                    </div>
                )}

                {/*/!* Display Processed Flight Data *!/*/}
                {/*{flightData.ids.length > 0 && (*/}
                {/*    <div className="mt-4 p-4 bg-green-100 rounded-md w-full max-w-2xl">*/}
                {/*        <h3 className="font-bold">Found Flights:</h3>*/}
                {/*        {flightData.ids.map((id, index) => (*/}
                {/*            <div key={id} className="mt-2 p-2 border-b">*/}
                {/*                <p className="font-medium">Flight ID: {id}</p>*/}
                {/*                <p>Price: {formatPrice(flightData.prices[index])}</p>*/}
                {/*                <div className="mt-1">*/}
                {/*                    <p className="font-medium">Flight Legs:</p>*/}
                {/*                    {Array.isArray(flightData.legs[index]) ? (*/}
                {/*                        flightData.legs[index].map((legs, segIndex) => (*/}
                {/*                            <p key={segIndex} className="ml-4 text-sm">*/}
                {/*                                {formatLegs(legs)}*/}
                {/*                            </p>*/}
                {/*                        ))*/}
                {/*                    ) : (*/}
                {/*                        <p className="ml-4 text-sm">No legs information available</p>*/}
                {/*                    )}*/}
                {/*                </div>*/}
                {/*            </div>*/}
                {/*        ))}*/}
                {/*    </div>*/}
                {/*)}*/}

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