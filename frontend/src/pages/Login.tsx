import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const validateForm = () => {
        if (!email.trim()) {
            return "Email is required";
        }

        if (!password.trim()) {
            return "Password is required";
        }

        return "";
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch("http://localhost:8000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.detail || "Invalid email or password");
            }

            // Store auth data
            localStorage.setItem("token", data.access_token);
            localStorage.setItem("user", JSON.stringify(data.user));

            // Reset sidebar to closed on fresh login
            localStorage.setItem("sidebarOpen", "false");

            // ✨ TRIGGER EVENT SO APP.TSX KNOWS USER LOGGED IN
            window.dispatchEvent(new Event('userLoggedIn'));

            // Small delay to ensure state updates
            setTimeout(() => {
                navigate("/dashboard");
            }, 100);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <h2>Welcome Back</h2>
                    <p>Login to access your Pokemon Card collection</p>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                        />
                    </div>

                    {error && <div className="error-message">⚠️ {error}</div>}

                    <button type="submit" className="login-btn" disabled={isLoading}>
                        {isLoading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <div className="login-footer">
                    <p>
                        Don't have an account?{" "}
                        <a href="/users/register">Register here</a>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;