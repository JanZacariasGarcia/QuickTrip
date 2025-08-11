import { useEffect, useState } from "react";
import axios from "axios";
import styles from './DisplayFlights.module.css';

export default function DisplayFlights({ airports, home = "DUB", departureDate, returnDate, budget }) {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [savingStates, setSavingStates] = useState({}); // Track saving state for each flight

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
                const scrapeResponse = await axios.post('/api/scrape', {
                    airports: airports,
                    from: departureDate,
                    to: returnDate,
                    budget: budget || 500
                });

                if (scrapeResponse.data.success) {
                    console.log('Scrape response:', scrapeResponse.data);

                    // Filter flights by budget on the frontend
                    const filteredResults = scrapeResponse.data.results.filter(flight =>
                        flight.price <= (budget || 500)
                    );

                    console.log(`Filtered ${scrapeResponse.data.results.length} flights to ${filteredResults.length} within budget €${budget || 500}`);

                    // Add departure/return dates to each result
                    const resultsWithDates = filteredResults.map(flight => ({
                        ...flight,
                        departureDate,
                        returnDate
                    }));

                    // Check which flights are already saved
                    try {
                        const savedCheckResponse = await axios.post('/api/check-saved-flights', {
                            flights: resultsWithDates
                        }, {
                            withCredentials: true
                        });

                        if (savedCheckResponse.data.success) {
                            setResults(savedCheckResponse.data.flights);
                        } else {
                            // Fallback if check fails
                            setResults(resultsWithDates);
                        }
                    } catch (checkError) {
                        console.warn('Could not check saved flights:', checkError);
                        setResults(resultsWithDates);
                    }
                } else {
                    throw new Error('Scraping failed');
                }
            } catch (err) {
                console.error('Flight search error:', err);
                setError(err.response?.data?.message || "Failed to fetch flights");
            } finally {
                setLoading(false);
            }
        };

        fetchFlights();
    }, [home, departureDate, returnDate, airports, budget]);

    const handleSaveFlight = async (flight) => {
        const flightKey = `${flight.city}-${flight.departureDate}-${flight.returnDate}`;

        // Prevent multiple simultaneous saves
        if (savingStates[flightKey]) return;

        setSavingStates(prev => ({
            ...prev,
            [flightKey]: true
        }));

        try {
            if (flight.isSaved) {
                // Remove from saved flights
                const response = await axios.delete(`/api/save-flight/${flight.savedFlightId}`, {
                    withCredentials: true
                });

                if (response.data.success) {
                    setResults(prev => prev.map(f =>
                        f.city === flight.city && f.departureDate === flight.departureDate && f.returnDate === flight.returnDate
                            ? { ...f, isSaved: false, savedFlightId: null }
                            : f
                    ));
                }
            } else {
                // Save flight
                const response = await axios.post('/api/save-flight', {
                    city: flight.city,
                    code: flight.code,
                    price: flight.price,
                    pageUrl: flight.pageUrl,
                    departureDate: flight.departureDate,
                    returnDate: flight.returnDate
                }, {
                    withCredentials: true
                });

                if (response.data.success) {
                    setResults(prev => prev.map(f =>
                        f.city === flight.city && f.departureDate === flight.departureDate && f.returnDate === flight.returnDate
                            ? { ...f, isSaved: true, savedFlightId: response.data.savedFlight.id }
                            : f
                    ));
                }
            }
        } catch (error) {
            console.error('Error saving/removing flight:', error);
            alert(flight.isSaved ? 'Failed to remove flight' : 'Failed to save flight');
        } finally {
            setSavingStates(prev => ({
                ...prev,
                [flightKey]: false
            }));
        }
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <div className={styles.loadingMessage}>
                    Searching flights from {home} to recommended destinations...
                    <br />
                    <small>This may take up to 3 minutes</small>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <p>{error}</p>
            </div>
        );
    }

    if (!results.length) {
        return (
            <div className={styles.noResults}>
                <p>No flights found within your budget to the recommended destinations.</p>
                <p>Try increasing your budget or adjusting your travel dates.</p>
            </div>
        );
    }

    return (
        <div className={styles.resultsContainer}>
            <h2 className={styles.resultsHeader}>
                Found {results.length} flight{results.length !== 1 ? 's' : ''} within your budget
            </h2>
            {results.map((result, index) => {
                const flightKey = `${result.city}-${result.departureDate}-${result.returnDate}`;
                const isSaving = savingStates[flightKey];

                return (
                    <div key={index} className={styles.flightCard}>
                        <div className={styles.flightCardHeader}>
                            <button
                                className={`${styles.saveButton} ${result.isSaved ? styles.saved : ''}`}
                                onClick={() => handleSaveFlight(result)}
                                disabled={isSaving}
                                title={result.isSaved ? 'Remove from saved flights' : 'Save flight'}
                            >
                                {isSaving ? '⏳' : result.isSaved ? '⭐' : '☆'}
                            </button>
                        </div>

                        <div className={styles.flightCardContent}>
                            <h3 className={styles.destinationName}>
                                {result.city.replace(/-/g, ' ')}
                                {result.code && <span className={styles.airportCode}>({result.code})</span>}
                            </h3>

                            <p className={styles.priceTag}>€{result.price.toFixed(2)}</p>

                            <div className={styles.dateInfo}>
                                <small>
                                    {new Date(result.departureDate).toLocaleDateString()} - {new Date(result.returnDate).toLocaleDateString()}
                                </small>
                            </div>

                            <button
                                onClick={() => window.open(result.pageUrl, '_blank')}
                                className={styles.bookNowButton}
                            >
                                Book Now
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}