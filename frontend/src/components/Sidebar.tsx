import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";

type SidebarProps = {
    open: boolean;
};

function Sidebar({ open }: SidebarProps) {
    const location = useLocation();

    return (
        <aside className={`sidebar ${open ? "open" : "closed"}`}>
            <h2 className="sidebar-title">Pokemon Cards Site</h2>

            <nav className="sidebar-nav">
                <Link
                    to="/dashboard"
                    className={location.pathname === "/dashboard" ? "active" : ""}
                >
                    Dashboard
                </Link>

                <Link
                    to="/users"
                    className={location.pathname === "/users" ? "active" : ""}
                >
                    Pokemon Card Users
                </Link>

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
