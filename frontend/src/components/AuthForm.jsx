import backgroundImage from "../assets/LTME - Sign up BG with logo.png";

const AuthForm = ({
	isSignUp,
	authEmail,
	authPassword,
	setAuthEmail,
	setAuthPassword,
	onToggle,
	onSubmit,
	onGoogleAuth,
}) => {
	return (
		<div
			className="relative h-screen w-full flex items-center justify-center overflow-hidden"
			style={{
				backgroundImage: `url(${backgroundImage})`,
				backgroundSize: "cover",
				backgroundPosition: "center",
				backgroundRepeat: "no-repeat",
			}}>
			{/* Desktop: Modal positioned on right */}
			<div className="hidden lg:flex relative w-full h-screen items-center justify-end pr-8 xl:pr-16 2xl:pr-24 overflow-hidden">
				{/* Modal */}
				<div
					className="bg-white rounded-[30px] p-12 flex flex-col"
					style={{
						width: "clamp(400px, 33.33vw, 480px)",
						maxHeight: "90vh",
						opacity: 0.9,
					}}>
					{/* Heading */}
					<h2
						className="text-center font-bold mb-8 font-heading-beauty"
						style={{
							fontSize: "clamp(32px, 3.33vw, 48px)",
							lineHeight: "120%",
							color: "#000000",
						}}>
						{isSignUp ? "Sign Up" : "Login"}
					</h2>

					{/* Form */}
					<form
						onSubmit={(e) => {
							e.preventDefault();
							onSubmit();
						}}
						className="flex flex-col gap-6">
				{/* Email Input */}
				<div className="flex flex-col gap-2">
					<input
						type="email"
						value={authEmail}
						onChange={(e) => setAuthEmail(e.target.value)}
						className="w-full px-3 py-3 border rounded-[10px] font-body-overlock placeholder-gray-500"
						style={{
							border: "1px solid #000000",
							fontSize: "16px",
							color: "#000000",
						}}
						placeholder="Email*"
						required
					/>
				</div>

				{/* Password Input */}
				<div className="flex flex-col gap-2">
					<input
						type="password"
						value={authPassword}
						onChange={(e) => setAuthPassword(e.target.value)}
						className="w-full px-3 py-3 border rounded-[10px] font-body-overlock placeholder-gray-500"
						style={{
							border: "1px solid #000000",
							fontSize: "16px",
							color: "#000000",
						}}
						placeholder="Password*"
						required
					/>
				</div>

						{/* Buttons Container */}
						<div className="flex flex-col gap-6 mt-2">
							{/* Buttons */}
							<div className="flex flex-col gap-4">
								{/* Submit Button */}
								<button
									type="submit"
									className="w-full flex items-center justify-center px-6 py-3 rounded-[10px] font-normal font-body-overlock"
									style={{
										background: "#000000",
										border: "1px solid #000000",
										fontSize: "16px",
										lineHeight: "150%",
										color: "#FFFFFF",
									}}>
									{isSignUp ? "Sign Up" : "Sign In"}
								</button>

								{/* Google Button */}
								{onGoogleAuth && (
									<button
										type="button"
										onClick={onGoogleAuth}
										className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-[10px] font-normal font-body-overlock"
										style={{
											border: "1px solid #000000",
											background: "transparent",
											fontSize: "16px",
											lineHeight: "150%",
											color: "#000000",
										}}>
										<svg
											width="24"
											height="24"
											viewBox="0 0 24 24"
											fill="none"
											xmlns="http://www.w3.org/2000/svg">
											<path
												d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
												fill="#4285F4"
											/>
											<path
												d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
												fill="#34A853"
											/>
											<path
												d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
												fill="#FBBC05"
											/>
											<path
												d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
												fill="#EA4335"
											/>
										</svg>
										<span>Continue with Google</span>
									</button>
								)}
							</div>

							{/* Links */}
							<div className="flex flex-col items-center gap-4">
								<button
									type="button"
									onClick={onToggle}
									className="text-center underline font-normal font-body-overlock"
									style={{
										fontSize: "16px",
										lineHeight: "150%",
										color: "#000000",
										textDecorationLine: "underline",
									}}>
									{isSignUp
										? "Already have an account? Sign in"
										: "Don't have an account? Sign up"}
								</button>
							</div>
						</div>
					</form>
				</div>
			</div>

			{/* Mobile/Tablet: Full screen modal */}
			<div className="lg:hidden relative w-full h-screen bg-white flex flex-col px-5 py-8 overflow-hidden">
				{/* Close button - top right */}
				<button
					type="button"
					onClick={() => window.history.back()}
					className="absolute top-4 right-4 flex items-center justify-center w-8 h-8"
					aria-label="Close">
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg">
						<path
							d="M18 6L6 18M6 6L18 18"
							stroke="#000000"
							strokeWidth="2"
							strokeLinecap="round"
						/>
					</svg>
				</button>

				{/* Heading */}
				<h2
					className="text-center font-bold mt-16 mb-8 font-heading-beauty"
					style={{
						fontSize: "clamp(28px, 9.6vw, 36px)",
						lineHeight: "120%",
						color: "#000000",
					}}>
					{isSignUp ? "Sign Up" : "Login"}
				</h2>

				{/* Form */}
				<form
					onSubmit={(e) => {
						e.preventDefault();
						onSubmit();
					}}
					className="flex flex-col gap-6 flex-1">
					{/* Email Input */}
					<div className="flex flex-col gap-2">
						<input
							type="email"
							value={authEmail}
							onChange={(e) => setAuthEmail(e.target.value)}
							className="w-full px-3 py-3 border rounded-[10px] font-body-overlock placeholder-gray-500"
							style={{
								border: "1px solid #000000",
								fontSize: "16px",
								color: "#000000",
							}}
							placeholder="Email*"
							required
						/>
					</div>

					{/* Password Input */}
					<div className="flex flex-col gap-2">
						<input
							type="password"
							value={authPassword}
							onChange={(e) => setAuthPassword(e.target.value)}
							className="w-full px-3 py-3 border rounded-[10px] font-body-overlock placeholder-gray-500"
							style={{
								border: "1px solid #000000",
								fontSize: "16px",
								color: "#000000",
							}}
							placeholder="Password*"
							required
						/>
					</div>

					{/* Buttons Container */}
					<div className="flex flex-col gap-6 mt-2">
						{/* Buttons */}
						<div className="flex flex-col gap-4">
							{/* Submit Button */}
							<button
								type="submit"
								className="w-full flex items-center justify-center px-6 py-3 rounded-[10px] font-normal font-body-overlock"
								style={{
									background: "#000000",
									border: "1px solid #000000",
									fontSize: "16px",
									lineHeight: "150%",
									color: "#FFFFFF",
								}}>
								{isSignUp ? "Sign Up" : "Sign In"}
							</button>

							{/* Google Button */}
							{onGoogleAuth && (
								<button
									type="button"
									onClick={onGoogleAuth}
									className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-[10px] font-normal font-body-overlock"
									style={{
										border: "1px solid #000000",
										background: "transparent",
										fontSize: "16px",
										lineHeight: "150%",
										color: "#000000",
									}}>
									<svg
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="none"
										xmlns="http://www.w3.org/2000/svg">
										<path
											d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
											fill="#4285F4"
										/>
										<path
											d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
											fill="#34A853"
										/>
										<path
											d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
											fill="#FBBC05"
										/>
										<path
											d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
											fill="#EA4335"
										/>
									</svg>
									<span>Continue with Google</span>
								</button>
							)}
						</div>

						{/* Links */}
						<div className="flex flex-col items-center gap-3">
							<button
								type="button"
								onClick={onToggle}
								className="text-center underline font-normal font-body-overlock"
								style={{
									fontSize: "16px",
									lineHeight: "150%",
									color: "#000000",
									textDecorationLine: "underline",
								}}>
								{isSignUp
									? "Already have an account? Sign in"
									: "Don't have an account? Sign up"}
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
};

export default AuthForm;
