/**
 * Register.tsx - User Registration Page Component
 *
 * This component handles new user registration for the Pokemon Cards application.
 * Features:
 * - Form validation for name, email, and password fields
 * - Client-side validation before API submission
 * - Error handling and user feedback
 * - Loading states during registration process
 * - Automatic navigation to login page after successful registration
 *
 * Validation Rules:
 * - Name: Must be at least 3 characters, only letters and spaces allowed
 * - Email: Must be a valid @gmail.com address
 * - Password: Minimum 8 characters, must include letter, number, and special character
 */

// Import useState hook for managing component state
import { useState } from "react";

// Import useNavigate hook for programmatic navigation after registration
import { useNavigate } from "react-router-dom";

// Import component-specific styles
import "./Register.css";

function Register() {
    // State for form input fields
    const [name, setName] = useState(""); // User's full name
    const [email, setEmail] = useState(""); // User's email address (must be @gmail.com)
    const [password, setPassword] = useState(""); // User's chosen password

    // State for error messages to display validation or API errors
    const [error, setError] = useState("");

    // State to track loading status during API call (prevents multiple submissions)
    const [isLoading, setIsLoading] = useState(false);

    // Hook for programmatic navigation (used to redirect to login after successful registration)
    const navigate = useNavigate();

    /**
     * Validates all form fields according to business rules
     * Returns error message string if validation fails, empty string if valid
     */
    const validateForm = () => {
        // Regular expression to validate name: minimum 3 characters, only letters (A-Z, a-z) and spaces
        const nameRegex = /^[A-Za-z\s]{3,}$/;
        // Test the trimmed name against the regex pattern
        if (!nameRegex.test(name.trim())) {
            return "Name must be at least 3 letters long and contain only alphabets";
        }

        // Email validation: must end with @gmail.com (business requirement)
        if (!email.endsWith("@gmail.com")) {
            return "Email must be a valid gmail.com address";
        }

        // Regular expression for password validation
        // (?=.*[A-Za-z]) - must contain at least one letter
        // (?=.*\d) - must contain at least one digit
        // (?=.*[^A-Za-z\d]) - must contain at least one special character
        // .{8,} - minimum 8 characters total
        const passwordRegex =
            /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

        // Test password against the regex pattern
        if (!passwordRegex.test(password)) {
            return "Password must be at least 8 characters and include a letter, a number, and a special character";
        }

        // All validations passed, return empty string
        return "";
    };

    /**
     * Handles form submission and user registration
     * Validates input, sends POST request to backend API, handles response/errors
     */
    const handleRegister = async (e: React.FormEvent) => {
        // Prevent default form submission behavior (page reload)
        e.preventDefault();

        // Clear any previous error messages
        setError("");

        // Run client-side validation
        const validationError = validateForm();
        // If validation fails, display error and stop submission
        if (validationError) {
            setError(validationError);
            return;
        }

        // Set loading state to true (disables submit button, shows loading text)
        setIsLoading(true);

        try {
            // Send POST request to backend user registration endpoint
            const res = await fetch("http://localhost:8000/user", {
                method: "POST", // HTTP POST method for creating new resource
                headers: { "Content-Type": "application/json" }, // Specify JSON payload
                body: JSON.stringify({ name, email, password }), // Convert form data to JSON string
            });

            // Check if response status indicates failure (status code 4xx or 5xx)
            if (!res.ok) {
                // Parse error response body to get error details
                const data = await res.json();
                // Throw error with detail message from API or generic message
                throw new Error(data.detail || "Registration failed");
            }

            // Registration successful - show success message to user
            alert("✅ Registration successful! Please login.");
            // Navigate to login page so user can log in with new credentials
            navigate("/login");
        } catch (err: any) {
            // Catch any errors (network errors, API errors, etc.) and display to user
            setError(err.message);
        } finally {
            // Always set loading to false after request completes (success or failure)
            setIsLoading(false);
        }
    };

    // Render the registration form UI
    return (
        // Main page container with full-page styling
        <div className="register-page">
            {/* Centered card container for registration form */}
            <div className="register-card">
                {/* Header section with title and subtitle */}
                <div className="register-header">
                    {/* Main heading */}
                    <h2>Create Account</h2>
                    {/* Subheading with welcoming message */}
                    <p>Join the Pokemon Card community</p>
                </div>

                {/* Registration form - submits via handleRegister function */}
                <form onSubmit={handleRegister} className="register-form">
                    {/* Form group for full name input */}
                    <div className="form-group">
                        {/* Label for name input field */}
                        <label>Full Name</label>
                        {/* Text input for user's full name */}
                        <input
                            type="text" // Standard text input type
                            value={name} // Controlled input - value from state
                            onChange={(e) => setName(e.target.value)} // Update name state on every keystroke
                            placeholder="Enter your full name" // Placeholder text for empty field
                        />
                    </div>

                    {/* Form group for email input */}
                    <div className="form-group">
                        {/* Label for email input field */}
                        <label>Email</label>
                        {/* Email input with HTML5 validation */}
                        <input
                            type="email" // Email input type (provides basic email format validation)
                            value={email} // Controlled input - value from state
                            onChange={(e) => setEmail(e.target.value)} // Update email state on every keystroke
                            placeholder="example@gmail.com" // Placeholder showing expected email format
                        />
                    </div>

                    {/* Form group for password input */}
                    <div className="form-group">
                        {/* Label for password input field */}
                        <label>Password</label>
                        {/* Password input field (hides characters for security) */}
                        <input
                            type="password" // Password type hides input characters
                            value={password} // Controlled input - value from state
                            onChange={(e) => setPassword(e.target.value)} // Update password state on every keystroke
                            placeholder="Min 8 chars, letter, number & symbol" // Placeholder showing password requirements
                        />
                    </div>

                    {/* Conditionally render error message div if error exists */}
                    {error && (
                        <div className="error-message">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Submit button for registration form */}
                    <button
                        type="submit" // Submit type triggers form onSubmit handler
                        className="register-btn" // CSS class for button styling
                        disabled={isLoading} // Disable button during API call to prevent duplicate submissions
                    >
                        {/* Show different text based on loading state */}
                        {isLoading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>

                {/* Footer section with link to login page for existing users */}
                <div className="register-footer">
                    <p>
                        Already have an account?{" "}
                        {/* Link to navigate to login page */}
                        <a href="/login">Login here</a>
                    </p>
                </div>
            </div>
        </div>
    );
}

// Export Register component as default export for use in routing
export default Register;

