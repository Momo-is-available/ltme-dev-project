import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
	User,
	Settings,
	Bookmark,
	Grid,
	Calendar,
	ImageIcon,
	UserPlus,
	UserCheck,
	Folder,
	Plus,
	Lock,
	Globe,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import MasonryGrid from "../components/MasonryGrid";
import { useSavedPosts } from "../hooks/useSavedPosts";
import { useFollows } from "../hooks/useFollows";
import EditProfileModal from "../components/EditProfileModal";
import AlbumModal from "../components/AlbumModal";
import { FEATURES } from "../config/features";

export default function Profile({ setShowAuthModal, setPostToSaveAfterAuth }) {
	const { username } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const [activeTab, setActiveTab] = useState("posts");
	const [userPosts, setUserPosts] = useState([]);
	const [profileUser, setProfileUser] = useState(null);
	const [currentUser, setCurrentUser] = useState(null);
	const [userStats, setUserStats] = useState({
		totalPosts: 0,
		totalSaves: 0,
		joinedDate: null,
	});
	const [loading, setLoading] = useState(true);
	const [selectedPost, setSelectedPost] = useState(null);
	const [hoveredPost, setHoveredPost] = useState(null);
	const [playingAudioId, setPlayingAudioId] = useState(null);
	const [savedPosts, setSavedPosts] = useState([]);
	const [loadingSaved, setLoadingSaved] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [loadingFollows, setLoadingFollows] = useState(false);
	const [albums, setAlbums] = useState([]);
	const [loadingAlbums, setLoadingAlbums] = useState(false);
	const [showAlbumModal, setShowAlbumModal] = useState(false);
	const [editingAlbum, setEditingAlbum] = useState(null);
	const audioRefs = useRef({});
	const hasLoadedRef = useRef(false);
	const loadingRef = useRef(false);
	const hookHasSetCountRef = useRef(false); // Track if hook has ever set the count

	const {
		savedPostIds,
		isSaved,
		loading: savedPostsLoading,
	} = useSavedPosts(currentUser?.id);

	const {
		isFollowing,
		toggleFollow,
		loading: followsLoading,
		followingCount: currentUserFollowingCount,
	} = useFollows(currentUser?.id);

	const getCurrentUser = useCallback(async () => {
		const {
			data: { user },
		} = await supabase.auth.getUser();
		setCurrentUser(user);
	}, []);

	const loadSavedPosts = useCallback(async () => {
		if (!currentUser?.id) return;

		try {
			setLoadingSaved(true);
			const { data, error } = await supabase
				.from("saved_posts")
				.select("post_id")
				.eq("user_id", currentUser.id);

			if (error) throw error;

			const postIds = (data || []).map((item) => item.post_id);
			if (postIds.length === 0) {
				setSavedPosts([]);
				setLoadingSaved(false);
				return;
			}

			const { data: postsData, error: postsError } = await supabase
				.from("posts")
				.select("*")
				.in("id", postIds)
				.order("created_at", { ascending: false });

			if (postsError) throw postsError;

			const transformedPosts = (postsData || []).map((post) => ({
				id: post.id,
				title: post.title || "",
				caption: post.caption || "",
				imageUrl: post.image_url || "",
				audioUrl: post.audio_url || null,
				audioName: post.audio_name || null,
				timestamp: post.created_at,
				userId: post.user_id,
				userEmail: post.user_email,
			}));

			// Get unique user IDs from saved posts
			const userIds = [
				...new Set(
					transformedPosts.map((p) => p.userId).filter(Boolean)
				),
			];

			// Fetch user profiles for saved posts
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

			// Enrich saved posts with user profile data
			const enrichedSavedPosts = transformedPosts.map((post) => ({
				...post,
				username: userProfilesMap[post.userId]?.username || null,
				avatarUrl: userProfilesMap[post.userId]?.avatarUrl || null,
			}));

			setSavedPosts(enrichedSavedPosts);

			// Note: Saved count is automatically updated via the useEffect watching savedPostIds
			// This ensures consistency with the hook's real-time data
		} catch (error) {
			console.error("Error loading saved posts:", error);
			setSavedPosts([]);
		} finally {
			setLoadingSaved(false);
		}
	}, [currentUser?.id]);

	const loadProfileData = useCallback(async () => {
		// Prevent multiple simultaneous loads
		if (loadingRef.current) {
			if (import.meta.env.DEV) {
				console.debug(
					"[Profile] loadProfileData already in progress, skipping"
				);
			}
			return;
		}

		try {
			loadingRef.current = true;
			setLoading(true);
			if (import.meta.env.DEV) {
				console.debug("[Profile] loadProfileData called", {
					username,
					currentUserId: currentUser?.id,
				});
			}

			let profileUserData = null;

			// Strategy 1: Try to find user by username in user_profiles table
			// Use case-insensitive matching since usernames are stored lowercase
			const { data: profileData, error: profileError } = await supabase
				.from("user_profiles")
				.select("*")
				.ilike("username", username) // Case-insensitive match
				.maybeSingle();

			if (import.meta.env.DEV) {
				console.debug("[Profile] user_profiles lookup", {
					found: !!profileData,
					error: profileError?.message,
					profileId: profileData?.id,
				});
			}

			if (profileData && !profileError) {
				// Found profile in user_profiles table
				// Try to get email from posts table (since we can't use admin API)
				const { data: userPosts } = await supabase
					.from("posts")
					.select("user_email")
					.eq("user_id", profileData.id)
					.limit(1)
					.maybeSingle();

				profileUserData = {
					id: profileData.id,
					username: profileData.username,
					email: userPosts?.user_email || `${username}@example.com`,
					avatar: profileData.avatar_url,
					bio: profileData.bio,
					created_at: profileData.created_at,
				};
			} else {
				// Strategy 2: Try to find user by user_id if username looks like "user_xxxxx"
				if (username.startsWith("user_") && username.length > 5) {
					const userIdPrefix = username.substring(5); // Remove "user_" prefix
					// Try to find profile by matching user_id prefix
					const { data: allProfiles } = await supabase
						.from("user_profiles")
						.select("*");

					if (allProfiles) {
						const matchingProfile = allProfiles.find((p) =>
							p.id.toString().startsWith(userIdPrefix)
						);

						if (matchingProfile) {
							const { data: userPosts } = await supabase
								.from("posts")
								.select("user_email")
								.eq("user_id", matchingProfile.id)
								.limit(1)
								.maybeSingle();

							profileUserData = {
								id: matchingProfile.id,
								username: matchingProfile.username,
								email:
									userPosts?.user_email ||
									`${matchingProfile.username}@example.com`,
								avatar: matchingProfile.avatar_url,
								bio: matchingProfile.bio,
								created_at: matchingProfile.created_at,
							};
						}
					}
				}

				// Strategy 3: Try to find user by posts (user might exist in auth but not in user_profiles)
				if (!profileUserData) {
					const emailPattern = `${username}@%`;
					const { data: postsData } = await supabase
						.from("posts")
						.select("user_id, user_email")
						.ilike("user_email", emailPattern)
						.limit(1)
						.maybeSingle();

					if (postsData) {
						// Found user via posts - they exist in auth but may not have a profile
						// Try to get or create their profile
						const { data: existingProfile } = await supabase
							.from("user_profiles")
							.select("*")
							.eq("id", postsData.user_id)
							.maybeSingle();

						if (existingProfile) {
							// Profile exists, use it
							profileUserData = {
								id: existingProfile.id,
								username: existingProfile.username,
								email: postsData.user_email,
								avatar: existingProfile.avatar_url,
								bio: existingProfile.bio,
								created_at: existingProfile.created_at,
							};
						} else {
							// Profile doesn't exist - user signed up but profile wasn't created
							// This shouldn't happen with the trigger, but handle it gracefully
							profileUserData = {
								id: postsData.user_id,
								username: username,
								email: postsData.user_email,
								avatar: null,
								bio: null,
								created_at: new Date().toISOString(),
							};
						}
					}
				}

				// Strategy 4: Check if current user is viewing their own profile
				if (!profileUserData) {
					// and username matches their email prefix
					if (currentUser?.email) {
						const emailPrefix = currentUser.email.split("@")[0];
						if (emailPrefix === username) {
							// This might be the current user viewing their own profile
							// Try to get their profile by ID
							const { data: ownProfile } = await supabase
								.from("user_profiles")
								.select("*")
								.eq("id", currentUser.id)
								.maybeSingle();

							if (ownProfile) {
								profileUserData = {
									id: ownProfile.id,
									username: ownProfile.username,
									email: currentUser.email,
									avatar: ownProfile.avatar_url,
									bio: ownProfile.bio,
									created_at: ownProfile.created_at,
								};
							} else {
								// Current user doesn't have a profile yet
								profileUserData = {
									id: currentUser.id,
									username: username,
									email: currentUser.email,
									avatar: null,
									bio: null,
									created_at:
										currentUser.created_at ||
										new Date().toISOString(),
								};
							}
						} else {
							// Last resort: create mock profile
							profileUserData = {
								id: null,
								username: username,
								email: `${username}@example.com`,
								avatar: null,
								bio: null,
								created_at: new Date().toISOString(),
							};
						}
					} else {
						// Last resort: create mock profile
						profileUserData = {
							id: null,
							username: username,
							email: `${username}@example.com`,
							avatar: null,
							bio: null,
							created_at: new Date().toISOString(),
						};
					}
				}
			}

			// Always set profile user, even if it's a fallback
			if (profileUserData) {
				setProfileUser(profileUserData);
			} else {
				// Fallback profile if nothing found
				setProfileUser({
					id: null,
					username: username,
					email: `${username}@example.com`,
					avatar: null,
					bio: null,
					created_at: new Date().toISOString(),
				});
			}

			// Load posts from Supabase
			// Try by user_id first, then fallback to email
			let postsQuery = supabase
				.from("posts")
				.select("*")
				.order("created_at", { ascending: false });

			if (profileUserData.id) {
				postsQuery = postsQuery.eq("user_id", profileUserData.id);
			} else if (profileUserData.email) {
				postsQuery = postsQuery.eq("user_email", profileUserData.email);
			} else {
				// No way to query, set empty posts
				setUserPosts([]);
				setUserStats({
					totalPosts: 0,
					totalSaves: 0,
					joinedDate: profileUserData.created_at,
				});
				setLoading(false);
				return;
			}

			const { data: postsData, error: postsError } = await postsQuery;

			if (postsError) {
				console.error("Error loading posts:", postsError);
				setUserPosts([]);
				setUserStats({
					totalPosts: 0,
					totalSaves: 0,
					joinedDate: profileUserData.created_at,
				});
			} else {
				// Transform to match expected format
				const transformedPosts = (postsData || []).map((post) => ({
					id: post.id,
					title: post.title || "",
					caption: post.caption || "",
					imageUrl: post.image_url || "",
					audioUrl: post.audio_url || null,
					audioName: post.audio_name || null,
					timestamp: post.created_at,
					userId: post.user_id,
					userEmail: post.user_email,
					username: profileUserData?.username || null,
					avatarUrl: profileUserData?.avatar || null,
				}));
				setUserPosts(transformedPosts);

				// For saved count: if viewing own profile, NEVER touch it here
				// Let the useEffect watching savedPostIds be the ONLY source of truth
				// Use both ID and email comparison for older accounts that might not have user_profiles
				const isViewingOwnProfile =
					currentUser?.id &&
					profileUserData.id &&
					(currentUser.id === profileUserData.id ||
						(currentUser.email &&
							profileUserData.email &&
							currentUser.email === profileUserData.email));

				setUserStats((prev) => ({
					totalPosts: transformedPosts.length,
					// If viewing own profile, ALWAYS preserve existing count (useEffect will update it)
					// If not viewing own profile, set to 0
					// For older accounts, prev.totalSaves might be 0 initially, but useEffect will update it
					totalSaves: isViewingOwnProfile ? prev.totalSaves : 0,
					joinedDate: profileUserData.created_at,
				}));
			}

			setLoading(false);
			loadingRef.current = false;
			hasLoadedRef.current = true;
		} catch (error) {
			console.error("Error loading profile:", error);
			loadingRef.current = false;
			// Ensure we always set a profile user even on error
			setProfileUser({
				id: null,
				username: username,
				email: `${username}@example.com`,
				avatar: null,
				bio: null,
				created_at: new Date().toISOString(),
			});
			setUserPosts([]);
			setUserStats({
				totalPosts: 0,
				totalSaves: 0,
				joinedDate: new Date().toISOString(),
			});
			setLoading(false);
		}
	}, [username, currentUser?.id, currentUser?.email]);

	useEffect(() => {
		const fetchUser = async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			setCurrentUser(user);
		};
		fetchUser();
	}, []);

	useEffect(() => {
		if (username) {
			hasLoadedRef.current = false; // Reset when username changes
			hookHasSetCountRef.current = false; // Reset when username changes
			if (import.meta.env.DEV) {
				console.debug(
					"Loading profile for username:",
					username,
					"currentUser:",
					currentUser?.id
				);
			}
			// Load profile data - it will handle currentUser being null initially
			loadProfileData().catch((err) => {
				console.error("Failed to load profile data:", err);
				// Ensure we always have a profile user even on failure
				setProfileUser({
					id: null,
					username: username,
					email: `${username}@example.com`,
					avatar: null,
					bio: null,
					created_at: new Date().toISOString(),
				});
				setLoading(false);
				loadingRef.current = false;
			});
		} else {
			// No username in URL, show error
			setLoading(false);
			setProfileUser({
				id: null,
				username: "unknown",
				email: "unknown@example.com",
				avatar: null,
				bio: null,
				created_at: new Date().toISOString(),
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [username]); // Only depend on username to prevent loops

	// Reload profile data when currentUser changes (in case it was null initially)
	useEffect(() => {
		if (username && currentUser !== undefined && !hasLoadedRef.current) {
			// Only reload if currentUser was null initially and we haven't loaded yet
			// Also check if hook has already set the count - if so, don't reload to avoid resetting it
			if (
				profileUser &&
				!profileUser.id &&
				currentUser &&
				!hookHasSetCountRef.current
			) {
				if (import.meta.env.DEV) {
					console.debug(
						"Reloading profile data now that currentUser is available"
					);
				}
				hasLoadedRef.current = true;
				loadProfileData().catch((err) => {
					console.error("Failed to reload profile data:", err);
					hasLoadedRef.current = false;
				});
			}
		}
	}, [currentUser?.id, currentUser?.email]);

	// Check if viewing own profile (must be defined before useEffects that use it)
	// Use ID comparison first (more reliable), fallback to email for older accounts
	const isOwnProfile =
		currentUser &&
		profileUser &&
		(currentUser.id === profileUser.id ||
			(currentUser.email &&
				profileUser.email &&
				currentUser.email === profileUser.email));

	// Check if we should open albums tab (from AddToAlbumModal or AlbumGallery back button)
	useEffect(() => {
		if (location.state?.openAlbumsTab) {
			setActiveTab("albums");
			// Clear the state to prevent reopening on re-render
			navigate(location.pathname, { replace: true, state: {} });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [location.state?.openAlbumsTab]);

	// No need to load follower/following counts - they're private
	// Only the current user's own "following" count is shown (from useFollows hook)

	// Load albums when albums tab is active
	useEffect(() => {
		if (activeTab === "albums" && profileUser?.id && !loadingAlbums) {
			loadAlbums();
		}
	}, [activeTab, profileUser?.id]);

	const loadAlbums = async () => {
		if (!profileUser?.id) return;

		try {
			setLoadingAlbums(true);

			// Build query based on whether viewing own profile or someone else's
			let query = supabase
				.from("albums")
				.select(
					"id, title, description, cover_image_url, is_public, created_at, updated_at"
				)
				.eq("user_id", profileUser.id);

			// If viewing someone else's profile, only show public albums
			if (!isOwnProfile) {
				query = query.eq("is_public", true);
			}

			const { data, error } = await query.order("created_at", {
				ascending: false,
			});

			if (error) throw error;

			setAlbums(data || []);
		} catch (err) {
			console.error("Error loading albums:", err);
		} finally {
			setLoadingAlbums(false);
		}
	};

	const handleCreateAlbum = () => {
		setEditingAlbum(null);
		setShowAlbumModal(true);
	};

	const handleEditAlbum = (album) => {
		setEditingAlbum(album);
		setShowAlbumModal(true);
	};

	const handleAlbumSuccess = () => {
		loadAlbums();
	};

	// Handle follow/unfollow
	const handleFollowToggle = async () => {
		if (!currentUser?.id || !profileUser?.id || isOwnProfile) return;

		try {
			setLoadingFollows(true);
			await toggleFollow(profileUser.id);
			// No need to update counts - they're private
		} catch (error) {
			console.error("Error toggling follow:", error);
		} finally {
			setLoadingFollows(false);
		}
	};

	// Extract the saved count as a primitive value to use as a stable dependency
	// This prevents the useEffect from running when savedPostIds gets a new array reference
	// but the count is the same
	const savedCount =
		savedPostIds !== undefined && Array.isArray(savedPostIds)
			? savedPostIds.length
			: 0;

	// Debug: Log savedPostIds and savedCount changes
	useEffect(() => {
		if (import.meta.env.DEV) {
			console.debug("[Profile] savedPostIds changed:", {
				savedPostIds,
				savedCount,
				savedPostsLoading,
				currentUserId: currentUser?.id,
				profileUserId: profileUser?.id,
			});
		}
	}, [
		savedPostIds,
		savedCount,
		savedPostsLoading,
		currentUser?.id,
		profileUser?.id,
	]);

	// Update saved count from useSavedPosts hook when it loads/changes
	// This ensures the count stays accurate and updates in real-time
	// The hook already loads saved posts and has real-time subscriptions
	useEffect(() => {
		// Don't update if profile is still loading - wait for it to finish
		if (loading || !profileUser) {
			if (import.meta.env.DEV) {
				console.debug(
					"[Profile] Profile still loading, skipping saved count update"
				);
			}
			return;
		}

		// Check if we're viewing own profile
		// Use direct comparison to avoid dependency on isOwnProfile variable
		// Use both ID and email comparison for older accounts that might not have user_profiles
		const viewingOwnProfile =
			currentUser &&
			profileUser &&
			(currentUser.id === profileUser.id ||
				(currentUser.email &&
					profileUser.email &&
					currentUser.email === profileUser.email));

		if (import.meta.env.DEV) {
			console.debug("[Profile] useEffect for saved count:", {
				viewingOwnProfile,
				savedCount,
				savedPostsLoading,
				savedPostIds,
				currentUserId: currentUser?.id,
				profileUserId: profileUser?.id,
				currentUserEmail: currentUser?.email,
				profileUserEmail: profileUser?.email,
				loading,
			});
		}

		if (!viewingOwnProfile) {
			// Not viewing own profile, ensure saved count is 0
			// Only update if it's not already 0 to prevent unnecessary re-renders
			setUserStats((prev) => {
				if (prev.totalSaves === 0) return prev;
				return {
					...prev,
					totalSaves: 0,
				};
			});
			return;
		}

		// Viewing own profile - update count from hook
		// This is the ONLY place that sets the saved count when viewing own profile
		if (savedPostsLoading) {
			if (import.meta.env.DEV) {
				console.debug(
					"[Profile] Hook still loading, skipping update to preserve DB count"
				);
			}
			return; // Hook still loading, wait
		}

		// Update count from hook - simple and direct
		// Always update when hook has finished loading, even if count is 0
		// This ensures older accounts get their count set correctly
		setUserStats((prev) => {
			if (prev.totalSaves === savedCount) {
				if (import.meta.env.DEV) {
					console.debug(
						"[Profile] Saved count unchanged:",
						savedCount,
						"skipping update"
					);
				}
				return prev; // No change needed
			}

			if (import.meta.env.DEV) {
				console.debug(
					"[Profile] Updating saved count from hook:",
					savedCount,
					"previous:",
					prev.totalSaves,
					"viewingOwnProfile:",
					viewingOwnProfile
				);
			}
			return {
				...prev,
				totalSaves: savedCount,
			};
		});
	}, [
		savedCount,
		savedPostsLoading,
		currentUser?.id,
		profileUser?.id,
		currentUser?.email,
		profileUser?.email,
		loading,
	]);

	// Reload saved posts list when switching to saved tab
	useEffect(() => {
		if (activeTab === "saved" && isOwnProfile) {
			loadSavedPosts();
		}
	}, [activeTab, isOwnProfile, loadSavedPosts]);

	// Reload saved posts list when saved count changes (e.g., when unsaving a post)
	// This ensures the list stays in sync with the hook's state
	// Use a ref to track the previous count to avoid reloading on initial mount
	const prevSavedCountRef = useRef(savedCount);
	useEffect(() => {
		// Always update the ref to track the current count
		const countChanged = prevSavedCountRef.current !== savedCount;
		prevSavedCountRef.current = savedCount;

		if (
			activeTab === "saved" &&
			isOwnProfile &&
			!savedPostsLoading &&
			countChanged
		) {
			// Only reload if we're on the saved tab, hook has finished loading,
			// and the count actually changed (not just on initial mount)
			loadSavedPosts();
		}
	}, [
		savedCount,
		activeTab,
		isOwnProfile,
		savedPostsLoading,
		loadSavedPosts,
	]);

	const PostDetailModal = ({ post, onClose }) => {
		if (!post) return null;

		return (
			<div
				className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
				onClick={onClose}>
				<div
					className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
					onClick={(e) => e.stopPropagation()}>
					<div className="grid md:grid-cols-2 h-full max-h-[90vh]">
						<div className="bg-white flex items-center justify-center overflow-hidden">
							<img
								src={post.imageUrl}
								alt={post.title}
								className="w-full h-full object-cover"
							/>
						</div>

						<div className="flex flex-col overflow-y-auto">
							<div className="p-6 border-b">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
											<User className="w-6 h-6 text-white" />
										</div>
										<div>
											<p className="font-semibold">
												{profileUser?.username}
											</p>
											<p className="text-sm text-gray-500">
												{new Date(
													post.timestamp
												).toLocaleDateString("en-US", {
													month: "short",
													day: "numeric",
													year: "numeric",
												})}
											</p>
										</div>
									</div>
									<button
										type="button"
										aria-label="Close detail"
										onClick={onClose}
										className="p-2 hover:bg-gray-100 rounded-full">
										<span className="text-2xl">×</span>
									</button>
								</div>
							</div>

							<div className="p-6 flex-1">
								{post.title && (
									<h2 className="text-2xl font-bold mb-3">
										{post.title}
									</h2>
								)}
								{post.caption && (
									<p className="text-gray-700 leading-relaxed mb-6">
										{post.caption}
									</p>
								)}
								{/* Audio Player - DISABLED via feature flag */}
								{/* {FEATURES.AUDIO_ENABLED && post.audioUrl && (
									<div className="p-4 bg-gray-50 rounded-lg">
										<audio
											src={post.audioUrl}
											controls
											className="w-full"
										/>
									</div>
								)} */}
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	};

	if (import.meta.env.DEV) {
		console.debug("[Profile] Render state", {
			loading,
			hasProfileUser: !!profileUser,
			username,
			isOwnProfile,
			currentUserId: currentUser?.id,
		});
	}

	if (loading && !profileUser) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center pt-24">
				<div className="text-center">
					<div className="animate-spin w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full mx-auto mb-4"></div>
					<p className="text-gray-600">Loading profile...</p>
				</div>
			</div>
		);
	}

	if (!profileUser && !loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center pt-24 px-4">
				<div className="text-center max-w-md">
					<h1 className="text-2xl font-bold text-gray-900 mb-4">
						Profile Not Found
					</h1>
					<p className="text-gray-600 mb-6">
						The user "{username}" doesn't exist or hasn't created a
						profile yet.
					</p>
				</div>
			</div>
		);
	}

	if (!profileUser) {
		return null;
	}

	return (
		<div className="min-h-screen bg-gray-50 pt-28 md:pt-24">
			{/* Profile Header */}
			<div className="bg-white border-b">
				<div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
					<div className="flex flex-col sm:flex-row items-start gap-4 md:gap-8">
						{/* Avatar */}
						<div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-gray-800 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
							{profileUser.avatar ? (
								<img
									src={profileUser.avatar}
									alt={profileUser.username}
									className="w-full h-full rounded-full object-cover"
								/>
							) : (
								<User className="w-16 h-16 text-white" />
							)}
						</div>

						{/* Profile Info */}
						<div className="flex-1 w-full">
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
								<div>
									<h1 className="text-2xl md:text-3xl font-bold text-gray-900">
										{profileUser.username}
									</h1>
									{profileUser.bio && (
										<p className="text-gray-700 mt-2">
											{profileUser.bio}
										</p>
									)}
								</div>
								<div className="flex items-center gap-3">
									{isOwnProfile ? (
										<button
											type="button"
											onClick={() =>
												setShowEditModal(true)
											}
											className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-900">
											<Settings className="w-4 h-4 text-gray-700" />
											Edit Profile
										</button>
									) : (
										currentUser && (
											<button
												type="button"
												onClick={handleFollowToggle}
												disabled={
													loadingFollows ||
													followsLoading
												}
												className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors font-medium ${
													isFollowing(profileUser.id)
														? "bg-gray-200 text-gray-900 hover:bg-gray-300"
														: "bg-gray-900 text-white hover:bg-gray-800"
												} disabled:opacity-50 disabled:cursor-not-allowed`}>
												{isFollowing(profileUser.id) ? (
													<>
														<UserCheck className="w-4 h-4" />
														Following
													</>
												) : (
													<>
														<UserPlus className="w-4 h-4" />
														Follow
													</>
												)}
											</button>
										)
									)}
								</div>
							</div>

							{/* Stats */}
							<div className="flex gap-8 flex-wrap">
								<div>
									<div className="text-2xl font-bold text-gray-900">
										{userStats.totalPosts}
									</div>
									<div className="text-sm text-gray-600">
										Posts
									</div>
								</div>
								{/* Only show saved count to profile owner */}
								{isOwnProfile && (
									<div>
										<div className="text-2xl font-bold text-gray-900">
											{userStats.totalSaves}
										</div>
										<div className="text-sm text-gray-600">
											Saved
										</div>
									</div>
								)}
								{/* Only show following count to profile owner (their own following count) */}
								{isOwnProfile && (
									<div>
										<div className="text-2xl font-bold text-gray-900">
											{followsLoading
												? "..."
												: currentUserFollowingCount}
										</div>
										<div className="text-sm text-gray-600">
											Following
										</div>
									</div>
								)}
								{userStats.joinedDate && (
									<div className="flex items-center gap-2 text-gray-600">
										<Calendar className="w-4 h-4" />
										<span className="text-sm">
											Joined{" "}
											{new Date(
												userStats.joinedDate
											).toLocaleDateString("en-US", {
												month: "long",
												year: "numeric",
											})}
										</span>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Tabs */}
			<div className="bg-white border-b sticky top-0 z-10">
				<div className="max-w-6xl mx-auto px-6">
					<div className="flex gap-8">
						<button
							type="button"
							onClick={() => setActiveTab("posts")}
							className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${
								activeTab === "posts"
									? "border-gray-900 text-gray-900"
									: "border-transparent text-gray-600 hover:text-gray-900"
							}`}>
							<Grid className="w-4 h-4" />
							<span className="font-medium">Posts</span>
						</button>
						{isOwnProfile && (
							<button
								type="button"
								onClick={() => setActiveTab("saved")}
								className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${
									activeTab === "saved"
										? "border-gray-900 text-gray-900"
										: "border-transparent text-gray-600 hover:text-gray-900"
								}`}>
								<Bookmark className="w-4 h-4" />
								<span className="font-medium">Saved</span>
							</button>
						)}
						<button
							type="button"
							onClick={() => setActiveTab("albums")}
							className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${
								activeTab === "albums"
									? "border-gray-900 text-gray-900"
									: "border-transparent text-gray-600 hover:text-gray-900"
							}`}>
							<Folder className="w-4 h-4" />
							<span className="font-medium">Albums</span>
						</button>
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
				{loading ? (
					<div className="text-center py-20">
						<div className="animate-spin w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full mx-auto"></div>
						<p className="text-gray-600 mt-4">Loading...</p>
					</div>
				) : (
					<>
						{activeTab === "posts" && (
							<>
								{userPosts.length === 0 ? (
									<div className="text-center py-20">
										<ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
										<h3 className="text-xl font-semibold text-gray-900 mb-2">
											No posts yet
										</h3>
										<p className="text-gray-600">
											{isOwnProfile
												? "Share your first moment to get started"
												: "This user hasn't posted anything yet"}
										</p>
									</div>
								) : (
									<MasonryGrid
										posts={userPosts}
										hoveredPost={hoveredPost}
										setHoveredPost={setHoveredPost}
										user={currentUser}
										audioRefs={audioRefs}
										playingAudioId={playingAudioId}
										setPlayingAudioId={setPlayingAudioId}
										savedPostIds={
											currentUser ? savedPostIds : []
										}
										showUserInfo={false}
										showEditButtons={isOwnProfile}
										setShowAuthModal={setShowAuthModal}
										setPostToSaveAfterAuth={
											setPostToSaveAfterAuth
										}
									/>
								)}
							</>
						)}

						{activeTab === "saved" && isOwnProfile && (
							<>
								{loadingSaved ? (
									<div className="text-center py-20">
										<div className="animate-spin w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full mx-auto"></div>
										<p className="text-gray-600 mt-4">
											Loading saved posts...
										</p>
									</div>
								) : savedPosts.length === 0 ? (
									<div className="text-center py-20">
										<Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
										<h3 className="text-xl font-semibold text-gray-900 mb-2">
											No saved posts
										</h3>
										<p className="text-gray-600">
											Save posts to view them later
										</p>
									</div>
								) : (
									<MasonryGrid
										posts={savedPosts}
										hoveredPost={hoveredPost}
										setHoveredPost={setHoveredPost}
										user={currentUser}
										audioRefs={audioRefs}
										playingAudioId={playingAudioId}
										setPlayingAudioId={setPlayingAudioId}
										showUserInfo={false}
									/>
								)}
							</>
						)}

						{activeTab === "albums" && (
							<>
								<div className="mb-6 flex items-center justify-between">
									<h2 className="text-2xl font-bold text-gray-900">
										Albums
									</h2>
									{isOwnProfile && (
										<button
											type="button"
											onClick={handleCreateAlbum}
											className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
											<Plus className="w-4 h-4" />
											Create Album
										</button>
									)}
								</div>

								{loadingAlbums ? (
									<div className="text-center py-20">
										<div className="animate-spin w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full mx-auto"></div>
										<p className="text-gray-600 mt-4">
											Loading albums...
										</p>
									</div>
								) : albums.length === 0 ? (
									<div className="text-center py-20">
										<Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
										<h3 className="text-xl font-semibold text-gray-900 mb-2">
											{isOwnProfile
												? "No albums yet"
												: "No public albums"}
										</h3>
										<p className="text-gray-600 mb-6">
											{isOwnProfile
												? "Create albums to organize your posts"
												: "This user hasn't shared any public albums yet"}
										</p>
										{isOwnProfile && (
											<button
												type="button"
												onClick={handleCreateAlbum}
												className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors mx-auto">
												<Plus className="w-5 h-5" />
												Create Your First Album
											</button>
										)}
									</div>
								) : (
									<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
										{albums.map((album) => (
											<div
												key={album.id}
												className="group cursor-pointer"
												onClick={() =>
													navigate(
														`/album/${album.id}`
													)
												}>
												<div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-3">
													{album.cover_image_url ? (
														<img
															src={
																album.cover_image_url
															}
															alt={album.title}
															className="w-full h-full object-cover group-hover:scale-105 transition-transform"
														/>
													) : (
														<div className="w-full h-full flex items-center justify-center">
															<Folder className="w-16 h-16 text-gray-400" />
														</div>
													)}
													<div className="absolute top-2 right-2">
														{album.is_public ? (
															<Globe className="w-5 h-5 text-white drop-shadow-lg" />
														) : (
															<Lock className="w-5 h-5 text-white drop-shadow-lg" />
														)}
													</div>
												</div>
												<div className="flex items-start justify-between">
													<div className="flex-1">
														<h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
															{album.title}
														</h3>
														{album.description && (
															<p className="text-sm text-gray-600 line-clamp-2">
																{
																	album.description
																}
															</p>
														)}
													</div>
													{isOwnProfile && (
														<button
															type="button"
															onClick={(e) => {
																e.stopPropagation();
																handleEditAlbum(
																	album
																);
															}}
															className="ml-2 p-2 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
															<Settings className="w-4 h-4 text-gray-600" />
														</button>
													)}
												</div>
											</div>
										))}
									</div>
								)}
							</>
						)}
					</>
				)}
			</div>

			{/* Post Detail Modal */}
			{selectedPost && (
				<PostDetailModal
					post={selectedPost}
					onClose={() => setSelectedPost(null)}
				/>
			)}

			{/* Album Modal */}
			{isOwnProfile && (
				<AlbumModal
					isOpen={showAlbumModal}
					onClose={() => {
						setShowAlbumModal(false);
						setEditingAlbum(null);
					}}
					currentUser={currentUser}
					album={editingAlbum}
					onSuccess={handleAlbumSuccess}
				/>
			)}

			{/* Edit Profile Modal */}
			{isOwnProfile && (
				<EditProfileModal
					isOpen={showEditModal}
					onClose={() => setShowEditModal(false)}
					currentUser={currentUser}
					profileData={{
						username: profileUser?.username || "",
						bio: profileUser?.bio || null,
						avatar_url: profileUser?.avatar || null,
					}}
					onUpdate={(updatedData) => {
						// Check if username changed
						const usernameChanged =
							updatedData.username &&
							updatedData.username.toLowerCase() !==
								(profileUser?.username || "").toLowerCase();

						// Update profileUser state with new data
						setProfileUser((prev) => ({
							...prev,
							username: updatedData.username || prev.username,
							bio: updatedData.bio || null,
							avatar: updatedData.avatar_url || null,
						}));

						// Redirect to new username URL if username changed
						if (usernameChanged && updatedData.username) {
							navigate(`/profile/${updatedData.username}`, {
								replace: true,
							});
						}
					}}
				/>
			)}
		</div>
	);
}
