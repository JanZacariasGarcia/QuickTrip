import React, { useState, useRef, useEffect } from 'react';
import {Navigate} from "react-router-dom";

export default function SearchBar() {
    const [activeButton, setActiveButton] = useState(null);
    const [arrowPosition, setArrowPosition] = useState(0);

    const today = new Date().toISOString().split("T")[0]; // Set current date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split("T")[0];

    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(tomorrowDate);
    const [weather, setWeather] = useState('');
    const [itineraryDuration, setItineraryDuration] = useState('');
    const [itineraryActivity, setItineraryActivity] = useState('');
    const [budget, setBudget] = useState(null);
    const [redirect, setRedirect] = useState(false);
    const containerRef = useRef(null);
    const buttonRefs = {
        calendar: useRef(null),
        weather: useRef(null),
        itinerary: useRef(null)
    };
    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setActiveButton(null);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (activeButton && buttonRefs[activeButton]?.current) {
            const button = buttonRefs[activeButton].current;
            const buttonRect = button.getBoundingClientRect();
            const buttonCenter = buttonRect.left + (buttonRect.width / 2);
            const searchBar = button.closest('.search-bar-container');
            const searchBarRect = searchBar.getBoundingClientRect();
            setArrowPosition(buttonCenter - searchBarRect.left - 10);
        }
    }, [activeButton]);

    async function submit(e) {
        e.preventDefault();

        // Check if all required fields are filled
        if (!weather || !itineraryDuration || !itineraryActivity || !budget) {
            alert('Please fill in all fields');
            return;
        }

        setRedirect(true);
    }

    if (redirect){
        const searchParams = new URLSearchParams({
            weather: weather,
            duration: itineraryDuration,
            activity: itineraryActivity,
            budget : budget
        });

        return <Navigate to={`/flights/${startDate}->${endDate}?${searchParams.toString()}`} />;
    }

    function dropDown() {
        return (
            <>
                {activeButton && (
                    <div className="relative">
                        <div
                            className="absolute h-4 w-4 bg-white transform rotate-45 -top-2 border-t border-l border-gray-200"
                            style={{ left: `${arrowPosition}px` }}
                        />
                        <div className="max-w-2xl mx-auto mt-2 p-4 bg-white rounded-lg shadow-lg border border-gray-200 relative">
                            {activeButton === 'calendar' && (
                                <div className="space-y-4">
                                    <h3 className="font-medium text-gray-900">Select dates</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-600">Start date</label>
                                            <input type="date"
                                                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                                                   min={today} value={startDate}
                                                    onChange={ev => setStartDate(ev.target.value)}/>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600">End date</label>
                                            <input type="date"
                                                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                                                min={tomorrowDate} // Tomorrow's date
                                                value={endDate}
                                            onChange={ev => setEndDate(ev.target.value)}/>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeButton === 'weather' && (
                                <div className="space-y-4">
                                    <h3 className="font-medium text-gray-900">Weather preferences</h3>
                                    <div className="space-y-2">
                                        {/*<label className="flex items-center space-x-2">*/}
                                        {/*    <input type="checkbox" className="rounded" />*/}
                                        {/*    <span className="text-sm text-gray-600">Sunny weather only</span>*/}
                                        {/*</label>*/}
                                        {/*<label className="flex items-center space-x-2">*/}
                                        {/*    <input type="checkbox" className="rounded" />*/}
                                        {/*    <span className="text-sm text-gray-600">Avoid rain</span>*/}
                                        {/*</label>*/}
                                        <label className="flex items-center gap-x-2">
                                            <span className="text-sm text-gray-600">Temperature range</span>
                                            <select className="rounded" value={weather}
                                                    onChange={ev => setWeather(ev.target.value)}>
                                                <option value={"<0°C"}>I want to freeze (less than 0°C)</option>
                                                <option value={"0°C-10°C"}>I want a chilly escape (0°C-10°C)</option>
                                                <option value={"10°C-20°C"}>I want a fall/spring holiday (10°C-20°C)</option>
                                                <option value={"20°C-26°C"}>I want a warm holiday (20°C-26°C)</option>
                                                <option value={"26°C- 33°C"}>I want to sweat (26°C- 33°C)</option>
                                                <option value={">33°C"}>I want to burn (more 33°C)</option>
                                            </select>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {activeButton === 'itinerary' && (
                                <div className="space-y-4">
                                    <h3 className="font-medium text-gray-900">Itinerary preferences</h3>
                                    <div className="space-y-2">
                                        <div>
                                            <label className="block text-sm text-gray-600">Preferred duration</label>
                                            <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                                                    value={itineraryDuration}
                                                    onChange={ev => setItineraryDuration(ev.target.value)}>
                                                <option>Half day</option>
                                                <option>Full day</option>
                                                <option>Multi-day</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600">Activity level</label>
                                            <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                                                    value={itineraryActivity}
                                                    onChange={ev => setItineraryActivity(ev.target.value)}>
                                                    <option>Relaxed</option>
                                                    <option>Moderate</option>
                                                    <option>Active</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600">Budget in Eur</label>
                                            <input type={"number"} placeholder={100}
                                            onChange={ev => setBudget(ev.target.value)} required={true}/>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </>
        );
    }

    return (
        <div ref={containerRef} className="max-w-2xl mx-auto p-4 search-bar-container">
            <form onSubmit={submit}>
                <div className="flex items-center bg-white rounded-full shadow-lg border border-gray-200 h-16">
                    <button
                        ref={buttonRefs.calendar}
                        type="button"
                        onClick={() => setActiveButton(activeButton === 'calendar' ? null : 'calendar')}
                        className={`flex items-center justify-center pl-3 pr-6 h-full hover:bg-gray-100 transition-all flex-shrink-0 rounded-full bg-white ${activeButton === 'calendar' ? 'bg-gray-100' : ''}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-600">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 2.994v2.25m10.5-2.25v2.25m-14.252 13.5V7.491a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v11.251m-18 0a2.25 2.25 0 0 0 2.25 2.25h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5" />
                        </svg>
                        <span className="ml-2 text-sm font-medium">When</span>
                    </button>

                    <div className="h-8 w-px bg-gray-200"></div>

                    <button
                        ref={buttonRefs.weather}
                        type="button"
                        onClick={() => setActiveButton(activeButton === 'weather' ? null : 'weather')}
                        className={`flex items-center justify-center px-8 h-full hover:bg-gray-100 transition-all flex-1 rounded-full bg-white ${activeButton === 'weather' ? 'bg-gray-100' : ''}`}
                    >
                        <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-600">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"/>
                            </svg>
                            <span className="text-gray-400">/</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-600">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z"/>
                            </svg>
                            <span className="ml-2 text-sm font-medium">How</span>
                        </div>
                    </button>

                    <div className="h-8 w-px bg-gray-200"></div>

                    <button
                        ref={buttonRefs.itinerary}
                        type="button"
                        onClick={() => setActiveButton(activeButton === 'itinerary' ? null : 'itinerary')}
                        className={`flex items-center justify-center px-8 h-full hover:bg-gray-100 transition-all flex-1 rounded-full bg-white ${activeButton === 'itinerary' ? 'bg-gray-100' : ''}`}
                    >
                        <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                                 stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                      d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"/>
                            </svg>
                        </div>
                        <span className="ml-2 text-sm font-medium">Itinerary/Budget</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                             stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round"
                                  d="M14.25 7.756a4.5 4.5 0 1 0 0 8.488M7.5 10.5h5.25m-5.25 3h5.25M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                        </svg>
                    </button>

                    <div className="h-8 w-px bg-gray-200"></div>

                    <button
                        type="submit"
                        className="flex items-center justify-center w-12 h-12 rounded-full bg-sky-500 hover:bg-sky-600 transition-colors ml-2 mr-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
                        </svg>
                    </button>
                </div>
            </form>
            {dropDown()}
        </div>
    );
}