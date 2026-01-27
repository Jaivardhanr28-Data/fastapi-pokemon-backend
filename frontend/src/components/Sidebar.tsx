// Import the necessary components and hooks from react-router-dom
import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";
// Import the CSS file for styling the sidebar
// Define the SidebarProps type to specify the shape of the props
type SidebarProps = {
    // The open prop indicates whether the sidebar is open or closed
    open: boolean;
};
// Define the Sidebar component as a function that accepts a prop called open of type boolean
function Sidebar({ open }: SidebarProps) {
    // Use the useLocation hook from react-router-dom to get the current location
    const location = useLocation();

    // Render an <aside> element to create the sidebar
    return (
        <aside className={`sidebar ${open ? "open" : "closed"}`}>
            {/* Render a title for the sidebar */}
            <h2 className="sidebar-title">Pokemon Cards Site</h2>

            {/* Render a navigation bar for the sidebar */}
            <nav className="sidebar-nav">
                {/* Render a link to the dashboard */}
                {/* If the current location is "/dashboard", add the "active" class to the link */}
                <Link
                    to="/dashboard"
                    className={location.pathname === "/dashboard" ? "active" : ""}
                >
                    Dashboard
                </Link>

                {/* Render a link to the users */}
                {/* If the current location is "/users", add the "active" class to the link */}
                <Link
                    to="/users"
                    className={location.pathname === "/users" ? "active" : ""}
                >
                    Pokemon Card Users
                </Link>

                {/* Render a link to the pokemon cards */}
                {/* If the current location is "/pokemon-cards", add the "active" class to the link */}
                <Link
                    to="/pokemon-cards"
                    className={location.pathname === "/pokemon-cards" ? "active" : ""}
                >
                    Pokemon Cards
                </Link>
            </nav>
        </aside>
    );
}

export default Sidebar;
