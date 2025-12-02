import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import AuthForm from "../components/AuthForm";

export default function Auth() {
	const [isSignUp, setIsSignUp] = useState(false);
	const [authEmail, setAuthEmail] = useState("");
	const [authPassword, setAuthPassword] = useState("");
	const [error, setError] = useState("");
	const navigate = useNavigate();

	const handleSubmit = async () => {
		setError("");
		try {
			let userCred;
			if (isSignUp) {
				userCred = await supabase.auth.signUp({
					email: authEmail,
					password: authPassword,
				});
			} else {
				userCred = await supabase.auth.signInWithPassword({
					email: authEmail,
					password: authPassword,
				});
			}

			if (userCred.error) {
				throw userCred.error;
			}

			// Redirect to home on successful auth
			navigate("/");
		} catch (err) {
			let errorMessage = "An error occurred. Please try again.";

			if (err.message) {
				const errMsg = err.message.toLowerCase();
				if (
					errMsg.includes("already registered") ||
					errMsg.includes("already exists") ||
					errMsg.includes("user already registered")
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
				} else if (
					errMsg.includes("invalid login") ||
					errMsg.includes("invalid credentials") ||
					errMsg.includes("wrong password")
				) {
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
		<div className="min-h-screen bg-white pt-24">
			{error && (
				<div className="max-w-md mx-auto mt-8 px-4">
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
			/>
		</div>
	);
}
