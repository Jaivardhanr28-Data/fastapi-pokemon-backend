/**
 * App.tsx - Main Application Component
 *
 * This is the root component of the Pokemon Cards application. It handles:
 * - Application routing and navigation
 * - User authentication state management
 * - Sidebar toggle functionality with persistent state
 * - Protected routes for authenticated users
 * - Admin-only routes with role-based access control
 * - Application layout structure (header, sidebar, main content)
 */

// Import Router components from react-router-dom for client-side navigation
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Import React hooks for state management, side effects, and type utilities
import { useState, useEffect, type ComponentType } from "react";

// Import custom components
import Sidebar from "./components/Sidebar"; // Navigation sidebar component
import ProtectedRoute from "./components/ProtectedRoute"; // HOC for protecting routes that require authentication
import PokeballButton from "./components/PokeballButton"; // Animated button for toggling sidebar

// Import page components
import Dashboard from "./pages/Dashboard"; // Main dashboard page after login
import Users from "./pages/Users"; // Admin-only user management page
import Register from "./pages/Register"; // User registration page (public)
import Login from "./pages/Login"; // User login page (public)
import PokemonCards from "./pages/PokemonCards"; // Pokemon card browsing page
import Cart from "./pages/Cart"; // Shopping cart page
import MyCollection from "./pages/MyCollection"; // User's purchased cards collection
import AdminOnly from "./pages/AdminOnly"; // Access denied page for non-admin users

// Import global application styles
import "./App.css";

// Type cast Sidebar component to ensure TypeScript recognizes the 'open' prop
const SidebarComponent = Sidebar as ComponentType<{ open: boolean }>;

function App() {
  // State to track whether the user is currently logged in
  // Initialized to false, will be updated by useEffect on mount
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // State to track whether the sidebar is open or closed
  // Uses lazy initialization function to read from localStorage on first render
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Retrieve saved sidebar state from localStorage
    const saved = localStorage.getItem("sidebarOpen");

    // If no saved state exists (first time user), initialize as closed
    if (saved === null) {
      localStorage.setItem("sidebarOpen", "false");
      return false;
    }

    // Parse the saved string value to boolean ("true" -> true, "false" -> false)
    return saved === "true";
  });

  // Effect hook to check and maintain authentication state
  // Runs once on component mount and sets up event listeners
  useEffect(() => {
    // Function to verify if user is authenticated by checking for auth token
    const checkAuth = () => {
      // Retrieve JWT token from localStorage
      const token = localStorage.getItem("token");
      // Update login state: true if token exists, false otherwise
      setIsLoggedIn(!!token);
    };

    // Initial authentication check when component mounts
    checkAuth();

    // Listen for storage events (fired when localStorage is modified in another tab/window)
    window.addEventListener('storage', checkAuth);

    // Listen for custom 'userLoggedIn' event (fired after successful login in same tab)
    window.addEventListener('userLoggedIn', checkAuth);

    // Cleanup function to remove event listeners when component unmounts
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('userLoggedIn', checkAuth);
    };
  }, []); // Empty dependency array means this effect runs only once on mount

  // Function to toggle the sidebar open/closed state
  // Also persists the new state to localStorage for consistency across page reloads
  const toggleSidebar = () => {
    setSidebarOpen(prev => {
      // Calculate the new state (opposite of current state)
      const newState = !prev;
      // Save the new state to localStorage as a string
      localStorage.setItem("sidebarOpen", String(newState));
      // Return new state to update React state
      return newState;
    });
  };

  // Render the application JSX structure
  return (
    // Router component wraps the entire app to enable client-side routing
    <Router>
      {/* Main application layout container */}
      <div className="app-layout">
        {/* Conditionally render sidebar only when user is logged in */}
        {isLoggedIn && <SidebarComponent open={sidebarOpen} />}

        {/* Main content area - applies 'sidebar-pushed' class when sidebar is open to shift content */}
        <div className={`app-main ${isLoggedIn && sidebarOpen ? "sidebar-pushed" : ""}`}>
          {/* Application header - only visible when user is logged in */}
          {isLoggedIn && (
            <header className="app-header">
              {/* Left section of header containing toggle button and title */}
              <div className="app-header-left">
                {/* Animated Pokeball button that toggles sidebar open/closed */}
                <PokeballButton
                  isOpen={sidebarOpen}
                  onClick={toggleSidebar}
                />
                {/* Application title */}
                <h1>Pokemon Cards Site</h1>
              </div>

              {/* Logout button - clears all auth data and redirects to login */}
              <button
                className="logout-btn"
                onClick={() => {
                  // Clear all localStorage data (token, user info, etc.)
                  localStorage.clear();
                  // Update logged in state to false
                  setIsLoggedIn(false);
                  // Hard redirect to login page (full page reload)
                  window.location.href = "/login";
                }}
              >
                Logout
              </button>
            </header>
          )}

          {/* Main content section where page components are rendered */}
          <main className="app-content">
            {/* Wrapper divs for content styling and layout */}
            <div className="content-wrapper">
              <div className="content-inner">
                {/* Routes container - defines all application routes */}
                <Routes>
                  {/* PUBLIC ROUTES - accessible without authentication */}

                  {/* Login page route */}
                  <Route path="/login" element={<Login />} />

                  {/* User registration page route */}
                  <Route path="/users/register" element={<Register />} />

                  {/* ROOT ROUTE - redirects to appropriate page based on auth status */}
                  <Route
                    path="/"
                    element={
                      // If user is logged in, redirect to dashboard
                      isLoggedIn ? (
                        <Navigate to="/dashboard" replace />
                      ) : (
                        // If not logged in, redirect to login page
                        <Navigate to="/login" replace />
                      )
                    }
                  />

                  {/* PROTECTED ROUTES - require authentication to access */}

                  {/* Dashboard route - main landing page after login */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Pokemon Cards browsing page - displays all available cards for purchase */}
                  <Route
                    path="/pokemon-cards"
                    element={
                      <ProtectedRoute>
                        <PokemonCards />
                      </ProtectedRoute>
                    }
                  />

                  {/* Shopping cart page - shows items user has added to cart */}
                  <Route
                    path="/cart"
                    element={
                      <ProtectedRoute>
                        <Cart />
                      </ProtectedRoute>
                    }
                  />

                  {/* User's collection page - displays cards user has purchased */}
                  <Route
                    path="/my-collection"
                    element={
                      <ProtectedRoute>
                        <MyCollection />
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin-only access denied page - shown to non-admin users who try to access admin routes */}
                  <Route
                    path="/admin-only"
                    element={
                      <ProtectedRoute>
                        <AdminOnly />
                      </ProtectedRoute>
                    }
                  />

                  {/* ADMIN-ONLY ROUTES - require admin role to access */}

                  {/* User management page - allows admins to view/edit/delete users */}
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

// Export App component as default export for use in index.tsx
export default App;