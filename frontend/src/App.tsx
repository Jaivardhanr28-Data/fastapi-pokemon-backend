import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, type ComponentType } from "react";
import Register from "./pages/Register";

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";

import "./App.css";
import Login from "./pages/Login";

/* TEMP PLACEHOLDER — as requested */
function PokemonCards() {
  return <div>Pokemon Cards page (placeholder)</div>;
}

const SidebarComponent = Sidebar as ComponentType<{ open: boolean }>;

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Router>
      <div className="app-layout">
        <SidebarComponent open={sidebarOpen} />

        <div className="app-main">
          <header className="app-header">
            <button
              className="logout-btn"
              onClick={() => {
                localStorage.clear();
                window.location.href = "/login";
              }}
            >
              Logout
            </button>

            <button
              className="burger"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>
            <h1>Pokemon Cards Site</h1>
          </header>

          <main className="app-content">
            <div className={`content-wrapper ${sidebarOpen ? "sidebar-open" : ""}`}>
              <div className="content-inner">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/users/register" element={<Register />} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
