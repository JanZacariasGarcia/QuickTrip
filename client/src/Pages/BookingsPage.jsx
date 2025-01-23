import AccountNav from "../AccountNav";
import {useEffect, useState} from "react";
import axios from "axios";
import PlaceImg from "../PlaceImg";
import {differenceInCalendarDays, format} from "date-fns";
import {Link} from "react-router-dom";
import BookingDates from "../BookingDates";

export default function BookingsPage(){
    const [bookings, setBookings] = useState([]);
    useEffect(() => {
        axios.get('/bookings').then(response => {
            setBookings(response.data);
        });
    })
    return(
        <div>
            <AccountNav/>
            <div>
                {bookings?.length > 0 && bookings.map(booking => (
                    <Link to={`/account/bookings/${booking._id}`} className={"flex gap-4 bg-gray-200 rounded-2xl overflow-hidden"}>
                        <div className={"w-48"}>
                            <PlaceImg place={booking.place}/>
                        </div>
                        <div className={"py-3 pr-3 grow"}>
                            <h2 className={"text-xl"}>{booking.place.title}</h2>
                            <div className={"text-xl"}>
                                <BookingDates booking={booking} className={"py-2 mt-2 mb-1 text-gray-500 border-t border-gray-300"}/>
                                <div className={"text-2xl"}>
                                    Total Price: €{booking.price}
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}