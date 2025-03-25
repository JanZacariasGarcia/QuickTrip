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
                // Call your scrape API endpoint
                const scrapeResponse = await axios.post('/api/scrape', {
                    destination: 'anywhere', // or use airports[0]?.code
                    from: departureDate,
                    to: returnDate,
                    budget: budget || 500 // Provide a default budget if not specified
                });

                // Handle the response from your scrape function
                if (scrapeResponse.data.success) {
                    setResults(scrapeResponse.data.results); // Set the results state
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
        <div className={styles.resultsContainer}>
            {results.map((result, index) => (
                <div key={index} className={styles.flightCard}>
                    <h3>{result.city}</h3>
                    <p>Price: €{result.price}</p>
                    <img src={result.screenshot} alt={`Flight to ${result.city}`} />
                </div>
            ))}
        </div>
    );
}