import { useEffect, useState } from "react";
import axios from "axios";
import styles from './DisplayFlights.module.css';

export default function DisplayFlights({ airports, home = "DUB", departureDate, returnDate }) {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!home || !departureDate || !returnDate || !airports?.length) {
            setError("Missing required search parameters");
            return;
        }

        const fetchFlights = async () => {
            setLoading(true);
            setError(null);
            setResults([]);

            try {
                // Get only the first destination in the list
                const destination = airports[0]?.code;

                if (!destination) {
                    setError("No valid destinations provided.");
                    setLoading(false);
                    return;
                }

                const options = {
                    method: 'GET',
                    url: 'https://multi-site-flight-search.p.rapidapi.com/start-search-lowest-price/',
                    params: {
                        city1: home,
                        city2: destination,
                        date1: departureDate,
                        date2: returnDate,
                        flightType: '1',
                        cabin: '1',
                        adults: '1',
                        children: '0'
                    },
                    headers: {
                        'x-rapidapi-key': '92d970d30cmsh1f8198993778dd8p137efcjsn9cba1685733a',
                        'x-rapidapi-host': 'multi-site-flight-search.p.rapidapi.com'
                    }
                };

                const response = await axios.request(options);

                const flights = response.data?.flights || [];

                setResults([
                    {
                        destination,
                        flights: flights.map(flight => ({
                            airline: flight.airline,
                            price: `$${flight.price}`,
                            duration: flight.duration,
                            stops: flight.stops === 0 ? 'Direct' : `${flight.stops} stops`
                        }))
                    }
                ]);
            } catch (err) {
                console.error('Flight search error:', err);
                setError(err.response?.data?.message || "Failed to fetch flights");
            } finally {
                setLoading(false);
            }
        };

        fetchFlights();
    }, [home, departureDate, returnDate, airports]);

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingMessage}>Searching flights from {home}...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorContainer}>
                {error}
            </div>
        );
    }

    if (!results.length) {
        return (
            <div className={styles.noResults}>
                No flights found.
            </div>
        );
    }

    return (
        <div className={styles.flightResults}>
            <h2 className={styles.flightResultsTitle}>
                Flights from {home}
            </h2>
            <div className={styles.flightGrid}>
                {results.map(({ destination, flights }) => (
                    <div key={destination} className={styles.flightCard}>
                        <div className={styles.flightCardHeader}>
                            <h3 className={styles.flightCardTitle}>{destination}</h3>
                        </div>
                        <div className={styles.flightCardContent}>
                            {flights.length ? (
                                <ul className={styles.flightList}>
                                    {flights.map((flight, index) => (
                                        <li key={index} className={styles.flightItem}>
                                            <div className={styles.flightAirline}>{flight.airline}</div>
                                            <div className={styles.flightDetails}>
                                                {flight.duration} • {flight.stops}
                                            </div>
                                            <div className={styles.flightPrice}>
                                                {flight.price}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className={styles.noFlights}>No flights available</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}