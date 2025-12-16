import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../apiClient";
import AuthForm from "../components/AuthForm";

export default function Auth() {
	const [isSignUp, setIsSignUp] = useState(false);
	const [authEmail, setAuthEmail] = useState("");
	const [authPassword, setAuthPassword] = useState("");
	const [error, setError] = useState("");
	const navigate = useNavigate();

	const handleGoogleAuth = async () => {
		setError(
			"Google authentication is not available at this time. Please use email and password."
		);
	};

	const handleSubmit = async () => {
		setError("");
		try {
			let result;
			if (isSignUp) {
				result = await apiClient.signUp(authEmail, authPassword);
			} else {
				result = await apiClient.signIn(authEmail, authPassword);
			}

			// Navigate to home page after successful auth
			navigate("/");
		} catch (err) {
			let errorMessage = "An error occurred. Please try again.";

			if (err.message) {
				const errMsg = err.message.toLowerCase();
				if (
					errMsg.includes("already exists") ||
					errMsg.includes("already registered")
				) {
					errorMessage =
						"This email is already registered. Please sign in instead.";
				} else if (
					errMsg.includes("password") &&
					errMsg.includes("6")
				) {
					errorMessage = "Password should be at least 6 characters.";
				} else if (
					errMsg.includes("invalid email") ||
					errMsg.includes("email")
				) {
					errorMessage = "Please enter a valid email address.";
				} else if (errMsg.includes("invalid credentials")) {
					errorMessage =
						"Invalid email or password. Please try again.";
				} else {
					errorMessage = err.message;
				}
			}

			setError(errorMessage);
		}
	};

	return (
		<div className="h-screen w-full overflow-hidden">
			{error && (
				<div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md px-4">
					<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
						{error}
					</div>
				</div>
			)}
			<AuthForm
				isSignUp={isSignUp}
				authEmail={authEmail}
				authPassword={authPassword}
				setAuthEmail={setAuthEmail}
				setAuthPassword={setAuthPassword}
				onToggle={() => setIsSignUp(!isSignUp)}
				onSubmit={handleSubmit}
				onGoogleAuth={handleGoogleAuth}
			/>
		</div>
	);
}
