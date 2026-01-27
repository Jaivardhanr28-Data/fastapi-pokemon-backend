import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, type ComponentType } from "react"; // controls sidebar open/close used typescript type for sidebar

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Register from "./pages/Register";
import Login from "./pages/Login";

import "./App.css"; // Import the main CSS file for the app, Layout-level styling

/* TEMP PLACEHOLDER */
function PokemonCards() {
  return <div>Pokemon Cards page (placeholder)</div>; // Placeholder to prove routing works
}

const SidebarComponent = Sidebar as ComponentType<{ open: boolean }>; //Ensures Sidebar always receives open

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);// App controls layout → Sidebar + content must agree

  return (
    <Router>
      <div className="app-layout">
        <SidebarComponent open={sidebarOpen} />

        <div className={`app-main ${sidebarOpen ? "sidebar-pushed" : ""}`}>
          {/* HEADER */}
          <header className="app-header">
            {/* LEFT SIDE */}
            <div className="app-header-left">
              <button
                className="burger"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle sidebar"
              >
                ☰
              </button>
              <h1>Pokemon Cards Site</h1>
            </div>

            {/* RIGHT SIDE */}
            <button
              className="logout-btn"
              onClick={() => {
                localStorage.clear();
                window.location.href = "/login";
              }}
            >
              Logout
            </button>
          </header>

          {/* CONTENT */}
          <main className="app-content">
            <div className="content-wrapper">
              <div className="content-inner">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/users/register" element={<Register />} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} /> // client side routing
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/pokemon-cards" element={<PokemonCards />} />
                </Routes>
              </div>
            </div>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;