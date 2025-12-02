import { useState, useEffect, useRef } from "react";
import { TrendingUp, Search, Users, Sparkles } from "lucide-react";
import { supabase } from "../supabaseClient";
import MasonryGrid from "../components/MasonryGrid";
import { Link } from "react-router-dom";

export default function Explore() {
	const [posts, setPosts] = useState([]);
	const [trendingPosts, setTrendingPosts] = useState([]);
	const [recommendedUsers, setRecommendedUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [activeFilter, setActiveFilter] = useState("all"); // all, trending, recent
	const [hoveredPost, setHoveredPost] = useState(null);
	const [playingAudioId, setPlayingAudioId] = useState(null);
	const audioRefs = useRef({});

	useEffect(() => {
		loadPosts();
		loadTrendingPosts();
		loadRecommendedUsers();
	}, []);

	const loadPosts = async () => {
		try {
			const { data, error } = await supabase
				.from("posts")
				.select("*")
				.order("created_at", { ascending: false })
				.limit(50);

			if (error) throw error;
			setPosts(
				(data || []).map((post) => ({
					id: post.id,
					title: post.title || "",
					caption: post.caption || "",
					imageUrl: post.image_url || "",
					audioUrl: post.audio_url || null,
					audioName: post.audio_name || null,
					timestamp: post.created_at,
					userId: post.user_id,
					userEmail: post.user_email || "",
					viewCount: post.view_count || 0,
				}))
			);
		} catch (error) {
			console.error("Error loading posts:", error);
		} finally {
			setLoading(false);
		}
	};

	const loadTrendingPosts = async () => {
		try {
			// For now, use recent posts as trending (can be enhanced with view-based algorithm)
			// In production, you'd calculate trending based on recent engagement
			const { data, error } = await supabase
				.from("posts")
				.select("*")
				.order("created_at", { ascending: false })
				.limit(20);

			if (error) throw error;
			setTrendingPosts(
				(data || []).map((post) => ({
					id: post.id,
					title: post.title || "",
					caption: post.caption || "",
					imageUrl: post.image_url || "",
					audioUrl: post.audio_url || null,
					audioName: post.audio_name || null,
					timestamp: post.created_at,
					userId: post.user_id,
					userEmail: post.user_email || "",
					viewCount: post.view_count || 0,
				}))
			);
		} catch (error) {
			console.error("Error loading trending posts:", error);
		}
	};

	const loadRecommendedUsers = async () => {
		try {
			// Get users with most posts as recommendations
			const { data: postsData } = await supabase
				.from("posts")
				.select("user_id, user_email")
				.limit(100);

			if (!postsData) return;

			// Count posts per user
			const userPostCounts = {};
			postsData.forEach((post) => {
				const email = post.user_email;
				if (email) {
					userPostCounts[email] = (userPostCounts[email] || 0) + 1;
				}
			});

			// Get top users
			const topUsers = Object.entries(userPostCounts)
				.sort(([, a], [, b]) => b - a)
				.slice(0, 5)
				.map(([email]) => ({
					email,
					username: email.split("@")[0],
					postCount: userPostCounts[email],
				}));

			setRecommendedUsers(topUsers);
		} catch (error) {
			console.error("Error loading recommended users:", error);
		}
	};

	const filteredPosts =
		activeFilter === "trending"
			? trendingPosts
			: activeFilter === "recent"
			? posts
			: posts.filter(
					(post) =>
						post.title
							?.toLowerCase()
							.includes(searchQuery.toLowerCase()) ||
						post.caption
							?.toLowerCase()
							.includes(searchQuery.toLowerCase())
			  );

	return (
		<div className="min-h-screen bg-white pt-24">
			<div className="max-w-screen-2xl mx-auto px-6 py-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold text-gray-900 mb-2">
						Explore
					</h1>
					<p className="text-gray-600">
						Discover trending moments and connect with creators
					</p>
				</div>

				{/* Search Bar */}
				<div className="mb-6">
					<div className="relative max-w-2xl">
						<Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
						<input
							type="text"
							placeholder="Search moments, tags, or users..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 placeholder-gray-500"
						/>
					</div>
				</div>

				{/* Filters */}
				<div className="flex gap-4 mb-8">
					<button
						type="button"
						onClick={() => setActiveFilter("all")}
						className={`px-6 py-2 rounded-full font-medium transition-colors ${
							activeFilter === "all"
								? "bg-gray-900 text-white"
								: "bg-gray-100 text-gray-700 hover:bg-gray-200"
						}`}>
						All Posts
					</button>
					<button
						type="button"
						onClick={() => setActiveFilter("trending")}
						className={`px-6 py-2 rounded-full font-medium transition-colors flex items-center gap-2 ${
							activeFilter === "trending"
								? "bg-gray-900 text-white"
								: "bg-gray-100 text-gray-700 hover:bg-gray-200"
						}`}>
						<TrendingUp className="w-4 h-4" />
						Trending
					</button>
					<button
						type="button"
						onClick={() => setActiveFilter("recent")}
						className={`px-6 py-2 rounded-full font-medium transition-colors ${
							activeFilter === "recent"
								? "bg-gray-900 text-white"
								: "bg-gray-100 text-gray-700 hover:bg-gray-200"
						}`}>
						Recent
					</button>
				</div>

				<div className="grid lg:grid-cols-4 gap-8">
					{/* Main Content */}
					<div className="lg:col-span-3">
						{loading ? (
							<div className="text-center py-20">
								<div className="animate-spin w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full mx-auto"></div>
								<p className="text-gray-600 mt-4">Loading...</p>
							</div>
						) : filteredPosts.length === 0 ? (
							<div className="text-center py-20">
								<Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
								<h3 className="text-xl font-semibold text-gray-900 mb-2">
									No posts found
								</h3>
								<p className="text-gray-600">
									Try adjusting your search or filters
								</p>
							</div>
						) : (
							<MasonryGrid
								posts={filteredPosts}
								hoveredPost={hoveredPost}
								setHoveredPost={setHoveredPost}
								audioRefs={audioRefs}
								playingAudioId={playingAudioId}
								setPlayingAudioId={setPlayingAudioId}
							/>
						)}
					</div>

					{/* Sidebar */}
					<div className="lg:col-span-1">
						{/* Recommended Users */}
						{recommendedUsers.length > 0 && (
							<div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
								<h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
									<Users className="w-5 h-5" />
									Recommended Creators
								</h2>
								<div className="space-y-4">
									{recommendedUsers.map((user) => (
										<Link
											key={user.email}
											to={`/profile/${user.username}`}
											className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors">
											<div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
												<span className="text-white text-sm font-semibold">
													{user.username
														.charAt(0)
														.toUpperCase()}
												</span>
											</div>
											<div className="flex-1 min-w-0">
												<p className="font-medium text-gray-900 truncate">
													{user.username}
												</p>
												<p className="text-sm text-gray-500">
													{user.postCount} posts
												</p>
											</div>
										</Link>
									))}
								</div>
							</div>
						)}

						{/* Trending Tags (placeholder for future) */}
						<div className="bg-white border border-gray-200 rounded-2xl p-6">
							<h2 className="text-lg font-semibold text-gray-900 mb-4">
								Trending Tags
							</h2>
							<p className="text-sm text-gray-500">
								Tag system coming soon
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
