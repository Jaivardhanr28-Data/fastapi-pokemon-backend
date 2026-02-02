import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, type ComponentType } from "react";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import PokeballButton from "./components/PokeballButton";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Register from "./pages/Register";
import Login from "./pages/Login";
import PokemonCards from "./pages/PokemonCards";
import Cart from "./pages/Cart";
import MyCollection from "./pages/MyCollection";
import AdminOnly from "./pages/AdminOnly";
import "./App.css";

const SidebarComponent = Sidebar as ComponentType<{ open: boolean }>;

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("sidebarOpen");

    if (saved === null) {
      localStorage.setItem("sidebarOpen", "false");
      return false;
    }

    return saved === "true";
  });

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
    window.addEventListener('userLoggedIn', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('userLoggedIn', checkAuth);
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(prev => {
      const newState = !prev;
      localStorage.setItem("sidebarOpen", String(newState));
      return newState;
    });
  };

  return (
    <Router>
      <div className="app-layout">
        {isLoggedIn && <SidebarComponent open={sidebarOpen} />}

        <div className={`app-main ${isLoggedIn && sidebarOpen ? "sidebar-pushed" : ""}`}>
          {isLoggedIn && (
            <header className="app-header">
              <div className="app-header-left">
                <PokeballButton
                  isOpen={sidebarOpen}
                  onClick={toggleSidebar}
                />
                <h1>Pokemon Cards Site</h1>
              </div>

              <button
                className="logout-btn"
                onClick={() => {
                  localStorage.clear();
                  setIsLoggedIn(false);
                  window.location.href = "/login";
                }}
              >
                Logout
              </button>
            </header>
          )}

          <main className="app-content">
            <div className="content-wrapper">
              <div className="content-inner">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/users/register" element={<Register />} />
                  <Route
                    path="/"
                    element={
                      isLoggedIn ? (
                        <Navigate to="/dashboard" replace />
                      ) : (
                        <Navigate to="/login" replace />
                      )
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pokemon-cards"
                    element={
                      <ProtectedRoute>
                        <PokemonCards />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/cart"
                    element={
                      <ProtectedRoute>
                        <Cart />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/my-collection"
                    element={
                      <ProtectedRoute>
                        <MyCollection />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin-only"
                    element={
                      <ProtectedRoute>
                        <AdminOnly />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/users"
                    element={
                      <ProtectedRoute adminOnly>
                        <Users />
                      </ProtectedRoute>
                    }
                  />
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
