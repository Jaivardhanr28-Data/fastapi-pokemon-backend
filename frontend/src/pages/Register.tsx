import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const submit = async () => {
        setError("");

        const res = await fetch("http://localhost:8000/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password })
        });

        if (!res.ok) {
            const d = await res.json();
            setError(d.detail || "Registration failed");
            return;
        }

        alert("User registered successfully!");
        navigate("/login");
    };

    return (
        <div className="auth-box">
            <h2>Register New Pokemon Card User</h2>

            <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" />
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
            <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" />

            {error && <p style={{ color: "red" }}>{error}</p>}

            <button onClick={submit}>Register</button>
        </div>
    );
}

export default Register;
