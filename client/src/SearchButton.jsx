import React, { useState } from 'react';

export default function SearchButton(){
    const [activeButton, setActiveButton] = useState(null);
    async function submit(){

    }

    return (
        <div className={"max-w-2xl mx-auto p-4"}>
            <form onSubmit={submit}>
            <div className="flex items-center bg-white rounded-full shadow-lg border border-gray-200 h-16">
                <button
                    type={"button"}
                    onClick={() => setActiveButton('calendar')}
                    className={`flex items-center justify-center pl-3 pr-6 h-full hover:bg-gray-100 transition-all flex-shrink-0 rounded-full bg-white ${activeButton === 'calendar' ? 'bg-gray-100' : ''}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 2.994v2.25m10.5-2.25v2.25m-14.252 13.5V7.491a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v11.251m-18 0a2.25 2.25 0 0 0 2.25 2.25h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5" />
                    </svg>
                    <span className="ml-2 text-sm font-medium">When</span>
                </button>

                <div className="h-8 w-px bg-gray-200"></div>

                <button
                    type={"button"}
                    onClick={() => setActiveButton('weather')}
                    className={`flex items-center justify-center px-8 h-full hover:bg-gray-100 transition-all flex-1 rounded-full bg-white ${activeButton === 'weather' ? 'bg-gray-100' : ''}`}
                >
                    <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                             stroke="currentColor" className="w-5 h-5 text-gray-600">
                            <path strokeLinecap="round" strokeLinejoin="round"
                                  d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"/>
                        </svg>
                        <span className="text-gray-400">/</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                             stroke="currentColor" className="w-5 h-5 text-gray-600">
                            <path strokeLinecap="round" strokeLinejoin="round"
                                  d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z"/>
                        </svg>
                        <span className="ml-2 text-sm font-medium">How</span>
                    </div>
                </button>

                <div className="h-8 w-px bg-gray-200"></div>

                <button
                    type={"button"}
                    onClick={() => setActiveButton('time')}
                    className={`flex items-center justify-center px-8 h-full hover:bg-gray-100 transition-all flex-1 rounded-full bg-white ${activeButton === 'time' ? 'bg-gray-100' : ''}`}
                >
                    <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                             stroke="currentColor" className="w-5 h-5 text-gray-600">
                            <path strokeLinecap="round" strokeLinejoin="round"
                                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                        </svg>
                    </div>
                    <span className="ml-2 text-sm font-medium">How far</span>
                </button>

                <div className="h-8 w-px bg-gray-200"></div>

                <button
                    type={"submit"}
                    onClick={() => setActiveButton('search')}
                    className="flex items-center justify-center w-12 h-12 rounded-full bg-sky-500 hover:bg-sky-600 transition-colors ml-2 mr-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                </button>
            </div>
            </form>
        </div>
    );
}
