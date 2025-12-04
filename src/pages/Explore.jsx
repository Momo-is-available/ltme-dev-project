import { useState, useEffect, useRef, useMemo } from "react";
import { Search, Users, Sparkles } from "lucide-react";
import { supabase } from "../supabaseClient";
import MixedContentGrid from "../components/MixedContentGrid";
import { Link } from "react-router-dom";

export default function Explore({ setShowAuthModal, setPostToSaveAfterAuth }) {
	const [posts, setPosts] = useState([]);
	const [albums, setAlbums] = useState([]);
	const [searchResults, setSearchResults] = useState({
		users: [],
		posts: [],
		albums: [],
	});
	const [loading, setLoading] = useState(true);
	const [loadingAlbums, setLoadingAlbums] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [activeFilter, setActiveFilter] = useState("all"); // all, recent
	const [hoveredPost, setHoveredPost] = useState(null);
	const [playingAudioId, setPlayingAudioId] = useState(null);
	const audioRefs = useRef({});

	useEffect(() => {
		loadPosts();
		loadAlbums();
	}, []);

	const loadPosts = async () => {
		try {
			const { data, error } = await supabase
				.from("posts")
				.select("*")
				.order("created_at", { ascending: false })
				.limit(50);

			if (error) throw error;

			const postsData = (data || []).map((post) => ({
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
			}));

			// Get unique user IDs
			const userIds = [
				...new Set(postsData.map((p) => p.userId).filter(Boolean)),
			];

			// Fetch user profiles
			let userProfilesMap = {};
			if (userIds.length > 0) {
				const { data: profilesData } = await supabase
					.from("user_profiles")
					.select("id, username, avatar_url")
					.in("id", userIds);

				(profilesData || []).forEach((profile) => {
					userProfilesMap[profile.id] = {
						username: profile.username,
						avatarUrl: profile.avatar_url,
					};
				});
			}

			// Enrich posts with user profile data
			const enrichedPosts = postsData.map((post) => ({
				...post,
				username: userProfilesMap[post.userId]?.username || null,
				avatarUrl: userProfilesMap[post.userId]?.avatarUrl || null,
			}));

			setPosts(enrichedPosts);
		} catch (error) {
			console.error("Error loading posts:", error);
		} finally {
			setLoading(false);
		}
	};

	const loadAlbums = async () => {
		try {
			setLoadingAlbums(true);
			// Get public albums
			const { data: albumsData, error } = await supabase
				.from("albums")
				.select("*")
				.eq("is_public", true)
				.order("created_at", { ascending: false })
				.limit(12);

			if (error) throw error;

			if (!albumsData || albumsData.length === 0) {
				setAlbums([]);
				return;
			}

			// Get unique user IDs
			const userIds = [...new Set(albumsData.map((a) => a.user_id))];

			// Fetch usernames for these users
			const { data: profilesData } = await supabase
				.from("user_profiles")
				.select("id, username")
				.in("id", userIds);

			// Create a map of user_id -> username
			const usernameMap = {};
			(profilesData || []).forEach((profile) => {
				usernameMap[profile.id] = profile.username;
			});

			setAlbums(
				albumsData.map((album) => ({
					id: album.id,
					title: album.title || "",
					description: album.description || "",
					coverImageUrl: album.cover_image_url || "",
					userId: album.user_id,
					username: usernameMap[album.user_id] || null,
					createdAt: album.created_at,
				}))
			);
		} catch (error) {
			console.error("Error loading albums:", error);
		} finally {
			setLoadingAlbums(false);
		}
	};

	// Enhanced search function
	const performSearch = async (query) => {
		if (!query.trim()) {
			setSearchResults({ users: [], posts: [], albums: [] });
			return;
		}

		const searchTerm = query.toLowerCase().trim();

		try {
			// Search users by username
			const { data: usersData } = await supabase
				.from("user_profiles")
				.select("id, username, avatar_url")
				.ilike("username", `%${searchTerm}%`)
				.limit(10);

			// Search posts - improved keyword matching using ilike for case-insensitive search
			const { data: postsData } = await supabase
				.from("posts")
				.select("*")
				.or(`title.ilike.%${searchTerm}%,caption.ilike.%${searchTerm}%`)
				.order("created_at", { ascending: false })
				.limit(50);

			// Search albums
			const { data: albumsData } = await supabase
				.from("albums")
				.select("*")
				.eq("is_public", true)
				.or(
					`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
				)
				.order("created_at", { ascending: false })
				.limit(12);

			// Get usernames for album creators if we have albums
			let usernameMap = {};
			if (albumsData && albumsData.length > 0) {
				const albumUserIds = [
					...new Set(albumsData.map((a) => a.user_id)),
				];
				const { data: profilesData } = await supabase
					.from("user_profiles")
					.select("id, username")
					.in("id", albumUserIds);

				(profilesData || []).forEach((profile) => {
					usernameMap[profile.id] = profile.username;
				});
			}

			// Get user profiles for posts
			const postUserIds = [
				...new Set(
					(postsData || []).map((p) => p.user_id).filter(Boolean)
				),
			];
			let postUserProfilesMap = {};
			if (postUserIds.length > 0) {
				const { data: postProfilesData } = await supabase
					.from("user_profiles")
					.select("id, username, avatar_url")
					.in("id", postUserIds);

				(postProfilesData || []).forEach((profile) => {
					postUserProfilesMap[profile.id] = {
						username: profile.username,
						avatarUrl: profile.avatar_url,
					};
				});
			}

			setSearchResults({
				users: usersData || [],
				posts: (postsData || []).map((post) => ({
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
					username:
						postUserProfilesMap[post.user_id]?.username || null,
					avatarUrl:
						postUserProfilesMap[post.user_id]?.avatarUrl || null,
				})),
				albums: (albumsData || []).map((album) => ({
					id: album.id,
					title: album.title || "",
					description: album.description || "",
					coverImageUrl: album.cover_image_url || "",
					userId: album.user_id,
					username: usernameMap[album.user_id] || null,
					createdAt: album.created_at,
				})),
			});
		} catch (error) {
			console.error("Error performing search:", error);
		}
	};

	// Debounced search
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			if (searchQuery.trim()) {
				performSearch(searchQuery);
			} else {
				setSearchResults({ users: [], posts: [], albums: [] });
			}
		}, 300);

		return () => clearTimeout(timeoutId);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchQuery]);

	const filteredPosts =
		activeFilter === "recent"
			? posts
			: searchQuery.trim()
			? searchResults.posts
			: posts.filter(
					(post) =>
						post.title
							?.toLowerCase()
							.includes(searchQuery.toLowerCase()) ||
						post.caption
							?.toLowerCase()
							.includes(searchQuery.toLowerCase())
			  );

	const filteredAlbums = searchQuery.trim()
		? searchResults.albums
		: albums.filter(
				(album) =>
					album.title
						?.toLowerCase()
						.includes(searchQuery.toLowerCase()) ||
					album.description
						?.toLowerCase()
						.includes(searchQuery.toLowerCase())
		  );

	// Create combined feed: mix albums and posts, sorted by recency
	const combinedFeed = useMemo(() => {
		const feedItems = [
			...filteredPosts.map((post) => ({
				type: "post",
				id: post.id,
				timestamp: post.timestamp,
				data: post,
			})),
			...filteredAlbums.map((album) => ({
				type: "album",
				id: album.id,
				timestamp: album.createdAt,
				data: album,
			})),
		];

		// Sort by timestamp (most recent first)
		return feedItems.sort((a, b) => {
			const timeA = new Date(a.timestamp).getTime();
			const timeB = new Date(b.timestamp).getTime();
			return timeB - timeA;
		});
	}, [filteredPosts, filteredAlbums]);

	return (
		<div className="min-h-screen bg-white pt-28 md:pt-24">
			<div className="max-w-screen-2xl mx-auto px-6 py-8">
				{/* Header */}
				<div className="mb-6 md:mb-8">
					<h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
						Explore
					</h1>
					<p className="text-sm md:text-base text-gray-600">
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
				<div className="flex flex-wrap gap-3 md:gap-4 mb-6 md:mb-8">
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
						onClick={() => setActiveFilter("recent")}
						className={`px-6 py-2 rounded-full font-medium transition-colors ${
							activeFilter === "recent"
								? "bg-gray-900 text-white"
								: "bg-gray-100 text-gray-700 hover:bg-gray-200"
						}`}>
						Recent
					</button>
				</div>

				{/* Users Section (only show when searching) */}
				{searchQuery.trim() && searchResults.users.length > 0 && (
					<div className="mb-8 md:mb-12">
						<h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2">
							<Users className="w-5 h-5 md:w-6 md:h-6" />
							Users
						</h2>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
							{searchResults.users.map((user) => (
								<Link
									key={user.id}
									to={`/profile/${user.username}`}
									className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
									{user.avatar_url ? (
										<img
											src={user.avatar_url}
											alt={user.username}
											className="w-12 h-12 rounded-full object-cover"
										/>
									) : (
										<div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
											<span className="text-white text-sm font-semibold">
												{user.username
													?.charAt(0)
													.toUpperCase() || "U"}
											</span>
										</div>
									)}
									<div className="flex-1 min-w-0">
										<p className="font-medium text-gray-900 truncate">
											{user.username}
										</p>
									</div>
								</Link>
							))}
						</div>
					</div>
				)}

				{/* Combined Feed - Albums and Posts Mixed */}
				<div>
					{loading || loadingAlbums ? (
						<div className="text-center py-20">
							<div className="animate-spin w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full mx-auto"></div>
							<p className="text-gray-600 mt-4">Loading...</p>
						</div>
					) : combinedFeed.length === 0 ? (
						<div className="text-center py-20">
							<Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
							<h3 className="text-xl font-semibold text-gray-900 mb-2">
								No content found
							</h3>
							<p className="text-gray-600">
								Try adjusting your search or filters
							</p>
						</div>
					) : (
					<MixedContentGrid
						feedItems={combinedFeed}
						hoveredPost={hoveredPost}
						setHoveredPost={setHoveredPost}
						audioRefs={audioRefs}
						playingAudioId={playingAudioId}
						setPlayingAudioId={setPlayingAudioId}
						setShowAuthModal={setShowAuthModal}
						setPostToSaveAfterAuth={setPostToSaveAfterAuth}
					/>
					)}
				</div>
			</div>
		</div>
	);
}
