import React from "react";
import { Search, Plus, User, LogIn } from "lucide-react";
import logo from "../assets/LTME Logo Horizontal.png";

const Header = ({
	user,
	handleCreateClick,
	setShowAuthModal,
	handleSignOut,
	searchQuery,
	setSearchQuery,
}) => {
	return (
		<header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
			<div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
				<div className="flex items-center gap-8">
					<h1 className="flex justify-center">
						<img
							src={logo}
							className="h-15 object-contain"
							alt="LTME Logo"
						/>
					</h1>
					<div className="hidden md:flex items-center gap-6">
						<button className="text-gray-700 hover:text-gray-900 font-medium">
							Explore
						</button>
						<button className="text-gray-700 hover:text-gray-900 font-medium">
							Following
						</button>
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
					<button
						onClick={handleCreateClick}
						className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors font-medium">
						<Plus className="w-5 h-5" />
						<span className="hidden sm:inline">Create</span>
					</button>

					{user ? (
						<div className="relative group">
							<button className="p-2.5 hover:bg-gray-100 rounded-full transition-colors">
								<User className="w-6 h-6 text-gray-700" />
							</button>
							<div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
								<div className="p-3 border-b border-gray-200">
									<p className="text-sm font-medium text-gray-900">
										{user.email}
									</p>
								</div>
								<button
									onClick={handleSignOut}
									className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
									Sign Out
								</button>
							</div>
						</div>
					) : (
						<button
							onClick={() => setShowAuthModal(true)}
							className="flex items-center gap-2 px-5 py-2.5 border border-gray-900 text-gray-900 rounded-full hover:bg-gray-50 transition-colors font-medium">
							<LogIn className="w-5 h-5" />
							<span className="hidden sm:inline">Sign In</span>
						</button>
					)}
				</div>
			</div>
		</header>
	);
};

export default Header;
