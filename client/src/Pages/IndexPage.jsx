import {Link} from "react-router-dom";
import {useEffect, useState} from "react";
import axios from "axios";

export default function IndexPage() {
    // const [places, setPlaces] = useState([]);
    // useEffect(()=>{
    //     axios.get('/places/').then(response => {
    //         setPlaces(response.data);
    //     });
    // },[]);
    return (
        <div className={"flex justify-center mr-14 py-8"}>
            <div className="flex flex-col gap-2 sm:w-72 text-[10px] sm:text-xs z-50 items-center">

                    {/*<div className="text-[#2b9875] bg-white/5 backdrop-blur-xl p-1 rounded-lg">*/}
                    {/*    <svg*/}
                    {/*        xmlns="http://www.w3.org/2000/svg"*/}
                    {/*        fill="none"*/}
                    {/*        viewBox="0 0 24 24"*/}
                    {/*        strokeWidth="1.5"*/}
                    {/*        stroke="currentColor"*/}
                    {/*        className="w-6 h-6"*/}
                    {/*    >*/}
                    {/*        <path*/}
                    {/*            strokeLinecap="round"*/}
                    {/*            strokeLinejoin="round"*/}
                    {/*            d="m4.5 12.75 6 6 9-13.5"*/}
                    {/*        ></path>*/}
                    {/*    </svg>*/}
                    {/*</div>*/}
                    <div>
                        <p className="text-gray-500">Preferences</p>
                        <p className="text-gray-500">A</p>
                    </div>

                {/*<button*/}
                {/*    className="text-gray-600 text-gray-600 hover:bg-white/5 p-1 rounded-md transition-colors ease-linear"*/}
                {/*>*/}
                {/*    <svg*/}
                {/*        xmlns="http://www.w3.org/2000/svg"*/}
                {/*        fill="none"*/}
                {/*        viewBox="0 0 24 24"*/}
                {/*        strokeWidth="1.5"*/}
                {/*        stroke="currentColor"*/}
                {/*        className="w-6 h-6"*/}
                {/*    >*/}
                {/*        <path*/}
                {/*            strokeLinecap="round"*/}
                {/*            strokeLinejoin="round"*/}
                {/*            d="M6 18 18 6M6 6l12 12"*/}
                {/*        ></path>*/}
                {/*    </svg>*/}
                {/*</button>*/}
            </div>
        </div>

        // <div className={"mt-8 grid gap-x-6 gap-y-8 grid-cols-2 md:grid-cols-3 lg:grid-cols-4"}>
        //     {places.length > 0 && places.map(place => (
        //         <Link to={'/place/' + place._id}>
        //             <div className={"bg-gray-500 mb-2 rounded-2xl flex"}>
        //                 {place.photos?.[0] && (
        //                     <img className={"rounded-2xl object-cover aspect-square"}
        //                          src={'http://localhost:4000/uploads/' + place.photos?.[0]} alt={""}/>
        //                 )}
        //             </div>
        //             <h2 className={"font-bold"}>{place.address}</h2>
        //             <h3 className={"text-sm text-gray-500"}>{place.title}</h3>
        //             <div className={"mt-1 text-sm"}>
        //                 <strong>€{place.price}</strong> night
        //             </div>
        //         </Link>
        //     ))}
        // </div>
    )
}