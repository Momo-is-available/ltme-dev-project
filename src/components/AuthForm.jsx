import React from "react";
import logo from "../assets/LTME Logo Horizontal.png";
const AuthForm = ({
	isSignUp,
	authEmail,
	authPassword,
	setAuthEmail,
	setAuthPassword,
	onToggle,
	onSubmit,
}) => {
	return (
		<div className="min-h-screen bg-white flex items-center justify-center p-8">
			<div className="w-full max-w-md">
				<div className="text-center mb-10">
					<h1 className="flex justify-center">
						<img
							src={logo}
							className="h-20 object-contain"
							alt="LTME Logo"
						/>
					</h1>
				</div>

				<div className="bg-white border rounded-lg p-8 shadow-sm">
					<div className="space-y-4">
						<input
							type="email"
							placeholder="Email"
							value={authEmail}
							onChange={(e) => setAuthEmail(e.target.value)}
							className="w-full px-4 py-3 border rounded-lg"
						/>
						<input
							type="password"
							placeholder="Password"
							value={authPassword}
							onChange={(e) => setAuthPassword(e.target.value)}
							className="w-full px-4 py-3 border rounded-lg"
						/>

						<button
							type="button"
							onClick={onSubmit}
							aria-label={isSignUp ? "Sign up" : "Sign in"}
							className="w-full py-3 bg-gray-900 text-white rounded-lg">
							{isSignUp ? "Sign Up" : "Sign In"}
						</button>
					</div>

					<div className="mt-6 text-center">
						<button
							type="button"
							onClick={onToggle}
							aria-label="Switch auth mode"
							className="text-gray-600 text-sm">
							{isSignUp
								? "Already have an account? Sign in"
								: "Don't have an account? Sign up"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AuthForm;
