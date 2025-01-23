import {Link, useLocation, useParams} from "react-router-dom";

export default function AccountNav(){
    const {pathname} = useLocation();
    let subpage = pathname.split('/')?.[2];

    function linkClasses(type=null){
        let classes = 'inline flex gap-1 py-2 px-6 rounded-full'
        if (subpage === undefined){
            subpage = 'profile';
        }
        if(type === subpage){
            classes += ' bg-primary text-white rounded-full';
        }else{
            classes += ' bg-gray-200'
        }
        return classes;
    }
    return (
        <nav className={"w-full flex justify-center mt-8 gap-2 mb-8"}>
            <Link className={linkClasses('profile')} to={'/account'}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                    <path fillRule="evenodd"
                          d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                          clipRule="evenodd"/>
                </svg>
                My Profile
            </Link>
            <Link className={linkClasses('bookings')} to={'/account/bookings'}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                    <path
                        d="M5.625 3.75a2.625 2.625 0 1 0 0 5.25h12.75a2.625 2.625 0 0 0 0-5.25H5.625ZM3.75 11.25a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H3.75ZM3 15.75a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75ZM3.75 18.75a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H3.75Z"/>
                </svg>
                My bookings
            </Link>
        </nav>
    );
}