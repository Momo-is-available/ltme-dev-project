import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
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
		// Check auth state
		supabase.auth.getSession().then(({ data: { session } }) => {
			setUser(session?.user ?? null);
			if (!session?.user) {
				navigate("/auth");
			}
		});

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
			if (!session?.user) {
				navigate("/auth");
			}
		});

		return () => subscription.unsubscribe();
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

				// Get posts from users the current user is following
				const { data, error: queryError } = await supabase
					.from("posts")
					.select("*")
					.in("user_id", followingIds)
					.order("created_at", { ascending: false });

				if (queryError) {
					throw queryError;
				}

				// Transform data to match expected format
				const postsData = (data || []).map((post) => ({
					id: post.id,
					title: post.title || "",
					caption: post.caption || "",
					imageUrl: post.image_url || "",
					audioUrl: post.audio_url || null,
					audioName: post.audio_name || null,
					timestamp: post.created_at || new Date().toISOString(),
					userId: post.user_id || "",
					userEmail: post.user_email || "",
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

	// Subscribe to real-time changes
	useEffect(() => {
		if (!user?.id || followingIds.length === 0) return;

		const channel = supabase
			.channel("following-posts-changes")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "posts",
					filter: `user_id=in.(${followingIds.join(",")})`,
				},
				() => {
					// Reload posts when changes occur
					const loadPosts = async () => {
						try {
							const { data } = await supabase
								.from("posts")
								.select("*")
								.in("user_id", followingIds)
								.order("created_at", { ascending: false });

							if (data) {
								const postsData = (data || []).map((post) => ({
									id: post.id,
									title: post.title || "",
									caption: post.caption || "",
									imageUrl: post.image_url || "",
									audioUrl: post.audio_url || null,
									audioName: post.audio_name || null,
									timestamp:
										post.created_at ||
										new Date().toISOString(),
									userId: post.user_id || "",
									userEmail: post.user_email || "",
								}));

								// Get unique user IDs
								const userIds = [
									...new Set(
										postsData
											.map((p) => p.userId)
											.filter(Boolean)
									),
								];

								// Fetch user profiles
								let userProfilesMap = {};
								if (userIds.length > 0) {
									const { data: profilesData } =
										await supabase
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
									username:
										userProfilesMap[post.userId]
											?.username || null,
									avatarUrl:
										userProfilesMap[post.userId]
											?.avatarUrl || null,
								}));

								setPosts(enrichedPosts);
							}
						} catch (err) {
							console.error("Error reloading posts:", err);
						}
					};
					loadPosts();
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [user?.id, followingIdsKey]);

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
