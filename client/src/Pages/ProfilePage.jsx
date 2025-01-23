import {useContext, useState} from "react";
import {UserContext} from "../UserContext";
import {Navigate, useParams} from "react-router-dom";
import axios from "axios";
import AccountNav from "../AccountNav";

export default function ProfilePage(){
    const [toHome, setToHome] = useState(null);
    const {ready, user, setUser} = useContext(UserContext);

    let {subpage} = useParams();
    if(subpage === undefined){
        subpage = 'profile';
    }

    async function logout() {
        await axios.post('/logout');
        setToHome('/');
        setUser(null);
    }

    if(!ready){
        return 'Loading...';
    }

    if(ready && !user && !toHome){
        return <Navigate to={'/login'}/>
    }

    if(toHome){
        return <Navigate to={toHome}/>
    }

    return(
        <div>
            <AccountNav/>
            {subpage === 'profile' && (
                <div className={"text-center max-w-lg mx-auto"}>
                    Logged in as {user.name} ({user.email})<br/>
                    <button onClick={logout} className={"primary mx-w-sm"}>Logout</button>
                </div>
            )}
        </div>
    )
}