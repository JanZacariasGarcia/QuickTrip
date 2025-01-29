import './App.css'
import {Route, Routes} from "react-router-dom";
import IndexPage from "./Pages/IndexPage.jsx";
import LoginPage from "./Pages/LoginPage.jsx";
import Layout from "./Layout.jsx";
import RegisterPage from "./Pages/RegisterPage.jsx";
import axios from "axios";
import {UserContentProvider} from "./UserContext";
import ProfilePage from "./Pages/ProfilePage";
import BookingsPage from "./Pages/BookingsPage";
import FlightsPage from "./Pages/FlightsPage.jsx";

axios.defaults.baseURL = 'http://localhost:4000';
axios.defaults.withCredentials = true;
function App() {
    return (
        <UserContentProvider>
            <Routes>
                <Route path={"/"} element={<Layout />}>
                    <Route index element={<IndexPage />}/>
                    <Route path={"/login"} element={<LoginPage />}/>
                    <Route path={"/register"} element={<RegisterPage />}/>
                    <Route path={"/account"} element={<ProfilePage />}/>
                    <Route path={"/account/bookings"} element={<BookingsPage />}/>
                    <Route path="/flights/:dates" element={<FlightsPage />} />
                </Route>
            </Routes>
        </UserContentProvider>
    )
}

export default App