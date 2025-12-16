import { useState, useEffect } from "react";
import { Search, Plus, User, LogIn, ChevronDown, Menu, X } from "lucide-react";
import logo from "../assets/LTME Logo Horizontal.png";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { apiClient } from "../apiClient";
import Tooltip from "./Tooltip";

const Header = ({
	user,
	handleCreateClick,
	setShowAuthModal,
	handleSignOut,
	searchQuery,
	setSearchQuery,
}) => {
	const navigate = useNavigate();
	const location = useLocation();
	const [avatarUrl, setAvatarUrl] = useState(null);
	const [showUserMenu, setShowUserMenu] = useState(false);
	const [showMobileMenu, setShowMobileMenu] = useState(false);
	const [isMenuClosing, setIsMenuClosing] = useState(false);
	const [isMenuOpening, setIsMenuOpening] = useState(false);

	// Close user menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (showUserMenu && !event.target.closest(".user-menu-container")) {
				setShowUserMenu(false);
			}
		};

		if (showUserMenu) {
			document.addEventListener("mousedown", handleClickOutside);
			return () =>
				document.removeEventListener("mousedown", handleClickOutside);
		}
	}, [showUserMenu]);

	useEffect(() => {
		if (user?.id) {
			loadAvatar();
		} else {
			setAvatarUrl(null);
		}
	}, [user?.id]);

	const loadAvatar = async () => {
		if (!user?.id) return;
		try {
			const profile = await apiClient.getProfile();
			if (profile.avatar_url) {
				setAvatarUrl(profile.avatar_url);
			}
		} catch (error) {
			console.error("Error loading avatar:", error);
		}
	};

	const handleProfileClick = async () => {
		if (user && user.id) {
			try {
				// Get the profile to get username
				const profile = await apiClient.getProfile();
				if (profile.username) {
					navigate(`/profile/${profile.username}`);
				} else {
					// Fallback: use email prefix if profile doesn't exist yet
					const username = user.email?.split("@")[0] || "unknown";
					navigate(`/profile/${username}`);
				}
			} catch (error) {
				console.error("Error getting username:", error);
				// Fallback: use email prefix
				const username = user.email?.split("@")[0] || "unknown";
				navigate(`/profile/${username}`);
			}
		}
	};

	const isActive = (path) => location.pathname === path;

	const handleMobileMenuClose = () => {
		setIsMenuClosing(true);
		setIsMenuOpening(false);
		setTimeout(() => {
			setShowMobileMenu(false);
			setIsMenuClosing(false);
		}, 300); // Closing animation duration
	};

	const handleMobileMenuOpen = () => {
		setIsMenuClosing(false);
		setShowMobileMenu(true);
		// Trigger opening animation
		setTimeout(() => {
			setIsMenuOpening(true);
		}, 10);
	};

	return (
		<>
			{/* Mobile Menu Overlay */}
			{(showMobileMenu || isMenuClosing) && (
				<>
					<div
						className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity ${
							isMenuOpening && !isMenuClosing
								? "opacity-100 duration-200"
								: "opacity-0 duration-300"
						}`}
						onClick={handleMobileMenuClose}
					/>
					<div
						className={`fixed left-0 top-0 bottom-0 w-64 bg-white z-50 md:hidden shadow-xl transition-transform ease-out ${
							isMenuOpening && !isMenuClosing
								? "translate-x-0 duration-200"
								: "-translate-x-full duration-300"
						}`}>
						<div className="flex flex-col h-full">
							{/* Menu Header */}
							<div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
								<Link
									to="/"
									onClick={handleMobileMenuClose}
									className="flex items-center">
									<img
										src={logo}
										className="h-7 object-contain"
										alt="LTME Logo"
									/>
								</Link>
								<button
									type="button"
									onClick={handleMobileMenuClose}
									className="p-2 hover:bg-gray-100 rounded-full transition-colors">
									<X className="w-5 h-5 text-gray-700" />
								</button>
							</div>

							{/* Menu Items */}
							<div className="flex-1 overflow-y-auto pt-6 pb-4">
								<Link
									to="/"
									onClick={handleMobileMenuClose}
									className={`flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors ${
										isActive("/")
											? "bg-gray-50 font-semibold"
											: ""
									}`}>
									<span className="text-base">Home</span>
								</Link>
								<Link
									to="/explore"
									state={{ scrollToExplore: true }}
									onClick={(e) => {
										handleMobileMenuClose();
										// If already on home/explore page, scroll instead of navigating
										if (
											location.pathname === "/" ||
											location.pathname === "/explore"
										) {
											e.preventDefault();
											const exploreSection =
												document.getElementById(
													"explore-section"
												);
											if (exploreSection) {
												exploreSection.scrollIntoView({
													behavior: "smooth",
													block: "start",
												});
											}
										}
									}}
									className={`flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors ${
										isActive("/explore") || isActive("/")
											? "bg-gray-50 font-semibold"
											: ""
									}`}>
									<span className="text-base">Explore</span>
								</Link>
								{user && (
									<Link
										to="/following"
										onClick={handleMobileMenuClose}
										className={`flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors ${
											isActive("/following")
												? "bg-gray-50 font-semibold"
												: ""
										}`}>
										<span className="text-base">
											Following
										</span>
									</Link>
								)}
							</div>
						</div>
					</div>
				</>
			)}

			{/* Top Header Bar */}
			<header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
				{/* Mobile: Two-row layout */}
				<div className="md:hidden">
					{/* Top Row: Hamburger, Logo and User */}
					<div className="flex items-center justify-between px-4 py-3 h-14">
						<div className="flex items-center gap-3">
							{/* Hamburger Menu Button */}
							<button
								type="button"
								onClick={() =>
									showMobileMenu
										? handleMobileMenuClose()
										: handleMobileMenuOpen()
								}
								aria-label={
									showMobileMenu ? "Close menu" : "Open menu"
								}
								className="p-2 hover:bg-gray-100 rounded-full transition-colors">
								{showMobileMenu ? (
									<X className="w-5 h-5 text-gray-700 transition-all duration-200 rotate-0 scale-100" />
								) : (
									<Menu className="w-5 h-5 text-gray-700 transition-all duration-200 rotate-0 scale-100" />
								)}
							</button>
							<Link
								to="/"
								onClick={(e) => {
									handleMobileMenuClose();
									// If already on home/explore page, scroll to top instead of navigating
									if (
										location.pathname === "/" ||
										location.pathname === "/explore"
									) {
										e.preventDefault();
										window.scrollTo({
											top: 0,
											behavior: "smooth",
										});
									}
								}}
								className="flex items-center">
								<img
									src={logo}
									className="h-7 object-contain"
									alt="LTME Logo"
								/>
							</Link>
						</div>

						<div className="flex items-center gap-2">
							{/* Create Button */}
							<Tooltip text="Create a new post">
								<button
									type="button"
									onClick={handleCreateClick}
									aria-label="Create new moment"
									className="p-1.5 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors">
									<Plus className="w-4 h-4" />
								</button>
							</Tooltip>

							{/* User Menu */}
							{user ? (
								<div className="relative user-menu-container">
									<button
										type="button"
										onClick={() =>
											setShowUserMenu(!showUserMenu)
										}
										aria-label="User menu"
										className="p-0.5 hover:bg-gray-100 rounded-full transition-colors">
										{avatarUrl ? (
											<img
												src={avatarUrl}
												alt="Profile"
												className="w-8 h-8 rounded-full object-cover"
											/>
										) : (
											<div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
												<User className="w-4 h-4 text-white" />
											</div>
										)}
									</button>
									{showUserMenu && (
										<>
											<div
												className="fixed inset-0 z-40"
												onClick={() =>
													setShowUserMenu(false)
												}
											/>
											<div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
												<div className="p-3 border-b border-gray-200">
													<p className="text-sm font-medium text-gray-900 truncate">
														{user.email}
													</p>
												</div>

												{/* Profile Link */}
												<button
													type="button"
													onClick={() => {
														handleProfileClick();
														setShowUserMenu(false);
													}}
													className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
													<User className="w-4 h-4" />
													View Profile
												</button>

												{/* Divider */}
												<div className="border-t border-gray-200 my-1"></div>

												{/* Sign Out */}
												<button
													type="button"
													onClick={() => {
														handleSignOut();
														setShowUserMenu(false);
													}}
													className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
													Sign Out
												</button>
											</div>
										</>
									)}
								</div>
							) : (
								<Tooltip text="Sign in to your account">
									<button
										type="button"
										onClick={() => setShowAuthModal(true)}
										className="p-1.5 border border-gray-900 text-gray-900 rounded-full hover:bg-gray-50 transition-colors">
										<LogIn className="w-4 h-4" />
									</button>
								</Tooltip>
							)}
						</div>
					</div>

					{/* Bottom Row: Search Bar */}
					<div className="px-4 pb-2.5">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
							<input
								type="text"
								placeholder="Search moments..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 placeholder-gray-500 text-sm"
							/>
						</div>
					</div>
				</div>

				{/* Desktop: Single-row layout */}
				<div className="hidden md:block max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 md:py-4">
					<div className="flex items-center justify-between gap-2 md:gap-4">
						{/* Logo */}
						<Link
							to="/"
							onClick={(e) => {
								// If already on home/explore page, scroll to top instead of navigating
								if (
									location.pathname === "/" ||
									location.pathname === "/explore"
								) {
									e.preventDefault();
									window.scrollTo({
										top: 0,
										behavior: "smooth",
									});
								}
							}}
							className="flex items-center">
							<img
								src={logo}
								className="h-10 object-contain"
								alt="LTME Logo"
							/>
						</Link>

						{/* Desktop: Navigation Links */}
						<div className="flex items-center gap-6">
							<Link
								to="/explore"
								state={{ scrollToExplore: true }}
								onClick={(e) => {
									// If already on home/explore page, scroll instead of navigating
									if (
										location.pathname === "/" ||
										location.pathname === "/explore"
									) {
										e.preventDefault();
										const exploreSection =
											document.getElementById(
												"explore-section"
											);
										if (exploreSection) {
											exploreSection.scrollIntoView({
												behavior: "smooth",
												block: "start",
											});
										}
									}
								}}
								className={`text-gray-700 hover:text-gray-900 font-medium ${
									isActive("/explore") || isActive("/")
										? "text-gray-900 font-semibold"
										: ""
								}`}>
								Explore
							</Link>
							{user && (
								<Link
									to="/following"
									className={`text-gray-700 hover:text-gray-900 font-medium ${
										isActive("/following")
											? "text-gray-900 font-semibold"
											: ""
									}`}>
									Following
								</Link>
							)}
						</div>

						{/* Search Bar */}
						<div className="flex-1 max-w-2xl mx-8">
							<div className="relative">
								<Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
								<input
									type="text"
									placeholder="Search moments..."
									value={searchQuery}
									onChange={(e) =>
										setSearchQuery(e.target.value)
									}
									className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 placeholder-gray-500"
								/>
							</div>
						</div>

						{/* Right Side Actions */}
						<div className="flex items-center gap-4">
							{/* Desktop: Create Button */}
							<Tooltip text="Create a new post">
								<button
									type="button"
									onClick={handleCreateClick}
									aria-label="Create new moment"
									className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors font-medium">
									<Plus className="w-5 h-5" />
									Create
								</button>
							</Tooltip>

							{/* User Menu */}
							{user ? (
								<div className="relative user-menu-container">
									<button
										type="button"
										onClick={() =>
											setShowUserMenu(!showUserMenu)
										}
										aria-label="User menu"
										className="flex items-center gap-1 p-0.5 hover:bg-gray-100 rounded-full transition-colors">
										{avatarUrl ? (
											<img
												src={avatarUrl}
												alt="Profile"
												className="w-9 h-9 rounded-full object-cover"
											/>
										) : (
											<div className="w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center">
												<User className="w-5 h-5 text-white" />
											</div>
										)}
										<ChevronDown className="w-4 h-4 text-gray-600" />
									</button>
									{showUserMenu && (
										<>
											<div
												className="fixed inset-0 z-40"
												onClick={() =>
													setShowUserMenu(false)
												}
											/>
											<div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
												<div className="p-3 border-b border-gray-200">
													<p className="text-sm font-medium text-gray-900 truncate">
														{user.email}
													</p>
												</div>

												{/* Profile Link */}
												<button
													type="button"
													onClick={() => {
														handleProfileClick();
														setShowUserMenu(false);
													}}
													className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
													<User className="w-4 h-4" />
													View Profile
												</button>

												{/* Divider */}
												<div className="border-t border-gray-200 my-1"></div>

												{/* Sign Out */}
												<button
													type="button"
													onClick={() => {
														handleSignOut();
														setShowUserMenu(false);
													}}
													className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
													Sign Out
												</button>
											</div>
										</>
									)}
								</div>
							) : (
								<Tooltip text="Sign in to your account">
									<button
										type="button"
										onClick={() => setShowAuthModal(true)}
										className="flex items-center gap-2 px-5 py-2.5 border border-gray-900 text-gray-900 rounded-full hover:bg-gray-50 transition-colors font-medium">
										<LogIn className="w-5 h-5" />
										Sign In
									</button>
								</Tooltip>
							)}
						</div>
					</div>
				</div>
			</header>
		</>
	);
};

export default Header;
