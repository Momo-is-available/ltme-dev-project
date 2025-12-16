import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../apiClient";
import MasonryGrid from "../components/MasonryGrid";
import { useSavedPosts } from "../hooks/useSavedPosts";
import { useFollows } from "../hooks/useFollows";

export default function Following() {
	const navigate = useNavigate();
	const [user, setUser] = useState(null);
	const [posts, setPosts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [hoveredPost, setHoveredPost] = useState(null);
	const [playingAudioId, setPlayingAudioId] = useState(null);
	const audioRefs = useRef({});

	const { savedPostIds } = useSavedPosts(user?.id);
	const { followingIds, loading: followsLoading } = useFollows(user?.id);

	// Create a stable string key from followingIds to use as dependency
	const followingIdsKey = useMemo(
		() => followingIds.sort().join(","),
		[followingIds]
	);

	useEffect(() => {
		// Check auth state from token
		const token = localStorage.getItem("token");
		if (token) {
			try {
				const payload = JSON.parse(atob(token.split(".")[1]));
				setUser({
					id: payload.userId,
					email: payload.email,
				});
			} catch (err) {
				console.error("Error decoding token:", err);
				localStorage.removeItem("token");
				setUser(null);
				navigate("/auth");
			}
		} else {
			setUser(null);
			navigate("/auth");
		}
	}, [navigate]);

	// Load posts from followed users
	useEffect(() => {
		const loadFollowingPosts = async () => {
			if (!user?.id || followsLoading) {
				if (!followsLoading && user?.id && followingIds.length === 0) {
					// User is logged in but not following anyone
					setPosts([]);
					setLoading(false);
				}
				return;
			}

			if (followingIds.length === 0) {
				// Not following anyone
				setPosts([]);
				setLoading(false);
				return;
			}

			try {
				setLoading(true);
				setError(null);

				// Get posts from followed users using API client
				const postsData = await apiClient.getFollowingPosts();

				// Transform data to match expected format
				const transformedPosts = postsData.map((post) => ({
					id: post.id,
					title: post.title || "",
					caption: post.caption || "",
					imageUrl: post.image_url || "",
					audioUrl: post.audio_url || null,
					audioName: post.audio_name || null,
					timestamp: post.created_at || new Date().toISOString(),
					userId: post.user_id || "",
					userEmail: post.user_email || "",
					username: post.username || "",
					avatarUrl: post.avatar_url || "",
				}));

				setPosts(transformedPosts);

				if (import.meta.env.DEV) {
					console.debug(
						"[Following] Loaded posts:",
						postsData.length,
						"from",
						followingIds.length,
						"followed users"
					);
				}
			} catch (err) {
				console.error("Error loading following posts:", err);
				setError(`Error loading posts: ${err.message}`);
				setPosts([]);
			} finally {
				setLoading(false);
			}
		};

		loadFollowingPosts();
	}, [user?.id, followingIdsKey, followsLoading]);

	// TODO: Implement real-time updates for following posts
	// This will be added in a future update using WebSockets or polling

	if (loading || followsLoading) {
		return (
			<div className="min-h-screen bg-white flex items-center justify-center pt-24">
				<div className="text-center">
					<div className="animate-spin w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full mx-auto mb-4"></div>
					<p className="text-gray-600">Loading...</p>
				</div>
			</div>
		);
	}

	if (!user) {
		return null; // Will redirect
	}

	return (
		<div className="min-h-screen bg-white pt-28 md:pt-24">
			<div className="max-w-7xl mx-auto px-6 py-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						Following
					</h1>
					<p className="text-gray-600">Posts from users you follow</p>
				</div>

				{/* Error Message */}
				{error && (
					<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
						<p className="text-red-600">{error}</p>
					</div>
				)}

				{/* Empty State */}
				{!loading &&
					posts.length === 0 &&
					followingIds.length === 0 && (
						<div className="text-center py-16">
							<p className="text-gray-600 text-lg mb-4">
								You're not following anyone yet
							</p>
							<p className="text-gray-500 mb-6">
								Start following users to see their posts here
							</p>
							<button
								type="button"
								onClick={() => navigate("/explore")}
								className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
								Explore Users
							</button>
						</div>
					)}

				{!loading && posts.length === 0 && followingIds.length > 0 && (
					<div className="text-center py-16">
						<p className="text-gray-600 text-lg">
							No posts from users you follow yet
						</p>
					</div>
				)}

				{/* Posts Grid */}
				{posts.length > 0 && (
					<MasonryGrid
						posts={posts}
						hoveredPost={hoveredPost}
						setHoveredPost={setHoveredPost}
						audioRefs={audioRefs}
						playingAudioId={playingAudioId}
						setPlayingAudioId={setPlayingAudioId}
						savedPostIds={savedPostIds}
					/>
				)}
			</div>
		</div>
	);
}
