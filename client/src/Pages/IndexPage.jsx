import {Link} from "react-router-dom";
import React, {useEffect, useState} from "react";
import axios from "axios";
import SearchBar from "../SearchBar.jsx";

export default function IndexPage() {
    return (
        <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 rounded-xl">
            {/* Static Background Elements */}
            <div className="absolute inset-0">
                {/* Geometric Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1"/>
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                {/* Floating Travel Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Airplane paths */}
                    <div className="absolute top-1/4 left-0 right-0 h-px bg-white/20 transform -rotate-12"></div>
                    <div className="absolute top-2/3 left-0 right-0 h-px bg-white/20 transform rotate-6"></div>
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20 transform -rotate-3"></div>

                    {/* Travel icons scattered around */}
                    <div className="absolute top-20 left-20 text-white/20 transform rotate-12">
                        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                        </svg>
                    </div>

                    <div className="absolute top-32 right-32 text-white/15 transform -rotate-45">
                        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                        </svg>
                    </div>

                    <div className="absolute bottom-32 left-32 text-white/20 transform rotate-45">
                        <svg className="w-14 h-14" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </div>

                    <div className="absolute bottom-20 right-20 text-white/15 transform -rotate-12">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.238.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                        </svg>
                    </div>

                    <div className="absolute top-1/2 left-16 text-white/10 transform rotate-90">
                        <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"/>
                        </svg>
                    </div>
                </div>

                {/* Gradient Orbs */}
                <div className="absolute top-10 right-10 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl"></div>
                <div className="absolute top-1/3 left-1/2 w-64 h-64 bg-pink-300/5 rounded-full blur-3xl"></div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-full px-4 py-16">
                {/* Hero Section */}
                <div className="text-center mb-12 max-w-4xl mx-auto">
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                        Find Your Next
                        <span className="bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 bg-clip-text text-transparent block">
                            Adventure
                        </span>
                    </h1>
                    <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
                        Discover amazing destinations tailored to your perfect weather, budget, and travel dates
                    </p>

                    {/* Feature Pills */}
                    <div className="flex flex-wrap justify-center gap-4 mb-8">
                        <div className="bg-white/15 backdrop-blur-sm rounded-full px-6 py-3 text-white font-medium border border-white/25 hover:bg-white/20 transition-colors">
                            ⚡ Instant Results
                        </div>
                        <div className="bg-white/15 backdrop-blur-sm rounded-full px-6 py-3 text-white font-medium border border-white/25 hover:bg-white/20 transition-colors">
                            🌍 Global Destinations
                        </div>
                        <div className="bg-white/15 backdrop-blur-sm rounded-full px-6 py-3 text-white font-medium border border-white/25 hover:bg-white/20 transition-colors">
                            💰 Budget Friendly
                        </div>
                    </div>
                </div>

                {/* Search Bar Container */}
                <div className="w-full max-w-4xl mx-auto relative mb-16">
                    <div className="bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 rounded-3xl p-8 shadow-2xl">
                        <SearchBar />
                    </div>
                </div>

                {/* Bottom Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto text-center">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                        <div className="text-4xl font-bold text-yellow-300 mb-2">1000+</div>
                        <div className="text-white/90 font-medium uppercase tracking-wide">Destinations</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                        <div className="text-4xl font-bold text-orange-300 mb-2">24/7</div>
                        <div className="text-white/90 font-medium uppercase tracking-wide">Support</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                        <div className="text-4xl font-bold text-red-300 mb-2">99%</div>
                        <div className="text-white/90 font-medium uppercase tracking-wide">Satisfaction</div>
                    </div>
                </div>
            </div>
        </div>
    );
}