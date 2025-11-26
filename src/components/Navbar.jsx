import React from "react";
import logo from "../assets/LTME Logo Horizontal.png";
import { FiMenu, FiSearch } from "react-icons/fi";

const Navbar = () => {
	return (
		<nav className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3">
			<div className="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl">
				{/* LEFT: Search bar */}
				<div className="flex items-center w-full sm:w-auto sm:order-1">
					<div className="relative hidden sm:block">
						<div className="absolute inset-y-0 left-0 flex items-center pl-3">
							<FiSearch className="text-gray-500" />
						</div>
						<input
							type="text"
							id="search-navbar"
							className="block w-full sm:w-[250px] p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-black focus:border-black"
							placeholder="Search photos and stories"
						/>
					</div>
				</div>

				{/* CENTER: Logo */}
				<div className="mx-auto sm:order-2">
					<img
						src={logo}
						className="h-8 sm:h-10 object-contain"
						alt="LTME Logo"
					/>
				</div>

				{/* RIGHT: Nav Items */}
				<div className="flex items-center gap-4 sm:order-3">
					<a
						href="#"
						className="text-gray-700 hover:underline hidden sm:block">
						Explore
					</a>
					<a
						href="#"
						className="text-gray-700 hover:underline hidden sm:block">
						Log in / Sign up
					</a>
					<button className="text-white bg-black hover:bg-gray-800 font-medium rounded-full text-sm px-4 py-1.5 text-center hidden sm:block">
						Submit Your Art
					</button>
					<button className="text-2xl text-gray-700 sm:ml-2">
						<FiMenu />
					</button>
				</div>
			</div>
		</nav>
	);
};

export default Navbar;
