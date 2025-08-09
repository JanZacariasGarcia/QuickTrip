import { useEffect, useState } from "react";
import axios from "axios";
import styles from './DisplayFlights.module.css';

export default function DisplayFlights({ airports, home = "DUB", departureDate, returnDate, budget }) {
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
                const scrapeResponse = await axios.post('/api/scrape', {
                    airports: airports, // Pass the airports array instead of 'anywhere'
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
                    setResults(filteredResults);
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
            {results.map((result, index) => (
                <div key={index} className={styles.flightCard}>
                    <div className={styles.flightCardContent}>
                        <h3 className={styles.destinationName}>
                            {result.city.replace(/-/g, ' ')}
                            {result.code && <span className={styles.airportCode}>({result.code})</span>}
                        </h3>

                        <p className={styles.priceTag}>€{result.price.toFixed(2)}</p>

                        <button
                            onClick={() => window.open(result.pageUrl, '_blank')}
                            className={styles.bookNowButton}
                        >
                            Book Now
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}