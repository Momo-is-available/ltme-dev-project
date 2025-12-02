import { useState } from "react";
import { supabase } from "../supabaseClient";

const AuthModal = ({ isSignUp, setIsSignUp, setShowAuthModal, onAuth }) => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

	const handleAuth = async (e) => {
		e.preventDefault();
		setError("");
		try {
			let userCred;
			if (isSignUp) {
				userCred = await supabase.auth.signUp({
					email,
					password,
				});
			} else {
				userCred = await supabase.auth.signInWithPassword({
					email,
					password,
				});
			}

			if (userCred.error) {
				throw userCred.error;
			}

			setShowAuthModal(false);
			if (onAuth) {
				onAuth(userCred.data.user);
			}
		} catch (err) {
			let errorMessage = "An error occurred. Please try again.";

			// Provide more helpful error messages for Supabase
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
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-lg max-w-md w-full p-8 relative">
				<button
					type="button"
					aria-label="Close auth modal"
					onClick={() => setShowAuthModal(false)}
					className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl">
					×
				</button>
				<h1 className="text-4xl font-bold text-center mb-6">LTME</h1>

				<form onSubmit={handleAuth} className="space-y-4">
					{error && (
						<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
							{error}
						</div>
					)}

					<input
						type="email"
						placeholder="Email"
						className="w-full px-4 py-3 border rounded-lg"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
					/>

					<input
						type="password"
						placeholder="Password"
						className="w-full px-4 py-3 border rounded-lg"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>

					<button
						type="submit"
						className="w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
						{isSignUp ? "Sign Up" : "Sign In"}
					</button>
				</form>

				<p className="text-center mt-4 text-sm">
					<button
						type="button"
						onClick={() => setIsSignUp(!isSignUp)}
						className="text-gray-600 hover:text-gray-900">
						{isSignUp
							? "Already have an account? Sign in"
							: "Don't have an account? Sign up"}
					</button>
				</p>
			</div>
		</div>
	);
};

export default AuthModal;
