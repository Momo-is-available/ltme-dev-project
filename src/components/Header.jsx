import { useState, useEffect } from "react";
import { Search, Plus, User, LogIn } from "lucide-react";
import logo from "../assets/LTME Logo Horizontal.png";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
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
	const [avatarUrl, setAvatarUrl] = useState(null);

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
			const { data } = await supabase
				.from("user_profiles")
				.select("avatar_url")
				.eq("id", user.id)
				.maybeSingle();

			if (data?.avatar_url) {
				setAvatarUrl(data.avatar_url);
			}
		} catch (error) {
			console.error("Error loading avatar:", error);
		}
	};

	const handleProfileClick = async () => {
		if (user && user.id) {
			try {
				// Get the actual username from user_profiles table
				const { data: profile } = await supabase
					.from("user_profiles")
					.select("username")
					.eq("id", user.id)
					.maybeSingle();

				if (profile?.username) {
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

	return (
		<header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
			<div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 md:py-4 flex items-center justify-between gap-2 md:gap-4">
				<div className="flex items-center gap-4 md:gap-8">
					<Link to="/" className="flex justify-center">
						<img
							src={logo}
							className="h-12 md:h-16 object-contain"
							alt="LTME Logo"
						/>
					</Link>

					<div className="hidden md:flex items-center gap-6">
						<Link
							to="/explore"
							className="text-gray-700 hover:text-gray-900 font-medium">
							Explore
						</Link>
						{user && (
							<Link
								to="/following"
								className="text-gray-700 hover:text-gray-900 font-medium">
								Following
							</Link>
						)}
					</div>
				</div>

				<div className="flex-1 max-w-2xl mx-8 hidden md:block">
					<div className="relative">
						<Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
						<input
							type="text"
							placeholder="Search moments..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 placeholder-gray-500"
						/>
					</div>
				</div>

				<div className="flex items-center gap-4">
					<Tooltip text="Create a new post">
						<button
							type="button"
							onClick={handleCreateClick}
							aria-label="Create new moment"
							className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors font-medium">
							<Plus className="w-5 h-5" />
							<span className="hidden sm:inline">Create</span>
						</button>
					</Tooltip>

					{user ? (
						<div className="relative group">
							<button
								type="button"
								aria-label="User menu"
								className="p-0.5 hover:bg-gray-100 rounded-full transition-colors">
								{avatarUrl ? (
									<img
										src={avatarUrl}
										alt="Profile"
										className="w-9 h-9 rounded-full object-cover"
									/>
								) : (
									<User className="w-6 h-6 text-gray-700" />
								)}
							</button>
							<div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
								<div className="p-3 border-b border-gray-200">
									<p className="text-sm font-medium text-gray-900 truncate">
										{user.email}
									</p>
								</div>

								{/* Profile Link */}
								<Tooltip text="View your profile">
									<button
										type="button"
										onClick={handleProfileClick}
										className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
										<User className="w-4 h-4" />
										View Profile
									</button>
								</Tooltip>

								{/* Divider */}
								<div className="border-t border-gray-200 my-1"></div>

								{/* Sign Out */}
								<Tooltip text="Sign out of your account">
									<button
										type="button"
										onClick={handleSignOut}
										className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
										Sign Out
									</button>
								</Tooltip>
							</div>
						</div>
					) : (
						<Tooltip text="Sign in to your account">
							<button
								type="button"
								onClick={() => setShowAuthModal(true)}
								className="flex items-center gap-2 px-5 py-2.5 border border-gray-900 text-gray-900 rounded-full hover:bg-gray-50 transition-colors font-medium">
								<LogIn className="w-5 h-5" />
								<span className="hidden sm:inline">
									Sign In
								</span>
							</button>
						</Tooltip>
					)}
				</div>
			</div>
		</header>
	);
};

export default Header;
