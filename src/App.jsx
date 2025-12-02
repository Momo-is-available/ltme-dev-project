import { useState, useEffect, useRef, useCallback } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import Header from "./components/Header";
import AuthModal from "./components/AuthModal";
import UploadModal from "./components/UploadModal";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Following from "./pages/Following";
import Upload from "./pages/Upload";
import Profile from "./pages/Profile";
import PostDetail from "./pages/PostDetail";
import AlbumGallery from "./pages/AlbumGallery";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const App = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const [user, setUser] = useState(null);
	const [showAuthModal, setShowAuthModal] = useState(false);
	const [showUpload, setShowUpload] = useState(false);
	const [posts, setPosts] = useState([]);
	const [hoveredPost, setHoveredPost] = useState(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [playingAudioId, setPlayingAudioId] = useState(null);

	// Shared audio refs for syncing between grid and detail views
	const audioRefs = useRef({});

	// Auth state
	const [isSignUp, setIsSignUp] = useState(false);

	// Load posts function - extracted so it can be called after upload
	// Using useCallback to ensure stable reference
	const loadPosts = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			const { data, error: queryError } = await supabase
				.from("posts")
				.select("*")
				.order("created_at", { ascending: false });

			if (queryError) {
				console.error("Error loading posts:", queryError);
				// Check if it's a table doesn't exist error
				if (
					queryError.code === "PGRST116" ||
					queryError.message?.includes("relation") ||
					queryError.message?.includes("does not exist")
				) {
					setError(
						"Database table 'posts' does not exist. Please create it in your Supabase dashboard."
					);
				} else {
					setError(`Error loading posts: ${queryError.message}`);
				}
				setPosts([]);
				setLoading(false);
				return;
			}

			// Handle null or undefined data
			if (!data) {
				if (import.meta.env.DEV)
					console.debug("No posts data returned");
				setPosts([]);
				setLoading(false);
				return;
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

			if (import.meta.env.DEV)
				console.debug("Loaded posts:", postsData.length);
			setPosts(postsData);
			setLoading(false);
		} catch (err) {
			console.error("Unexpected error loading posts:", err);
			setError(`Unexpected error: ${err.message}`);
			setPosts([]);
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		// Listen for auth changes
		const {
			data: { subscription: authSubscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
		});

		// Get initial session
		supabase.auth.getSession().then(({ data: { session } }) => {
			setUser(session?.user ?? null);
		});

		loadPosts();

		// Subscribe to real-time changes (only if table exists)
		let postsSubscription = null;
		try {
			postsSubscription = supabase
				.channel("posts-changes")
				.on(
					"postgres_changes",
					{
						event: "*",
						schema: "public",
						table: "posts",
					},
					() => {
						// Reload posts on any change
						loadPosts();
					}
				)
				.subscribe();
		} catch (err) {
			console.warn("Could not set up real-time subscription:", err);
		}

		return () => {
			authSubscription?.unsubscribe();
			postsSubscription?.unsubscribe();
		};
	}, [loadPosts]);

	const handleCreateClick = () => {
		if (!user) {
			setShowAuthModal(true);
		} else {
			setShowUpload(true);
		}
	};

	return (
		<div className="min-h-screen bg-white">
			{/* Header */}
			<Header
				user={user}
				handleCreateClick={handleCreateClick}
				setShowAuthModal={setShowAuthModal}
				handleSignOut={async () => {
					await supabase.auth.signOut();
					// Redirect to home page after sign out
					navigate("/");
				}}
				searchQuery={searchQuery}
				setSearchQuery={setSearchQuery}
			/>
			<Routes>
				<Route
					path="/"
					element={
						<Home
							posts={posts}
							loading={loading}
							error={error}
							searchQuery={searchQuery}
							hoveredPost={hoveredPost}
							setHoveredPost={setHoveredPost}
							user={user}
							handleCreateClick={handleCreateClick}
							audioRefs={audioRefs}
							playingAudioId={playingAudioId}
							setPlayingAudioId={setPlayingAudioId}
						/>
					}
				/>
				<Route path="/explore" element={<Explore />} />
				<Route path="/following" element={<Following />} />
				<Route path="/upload" element={<Upload />} />
				<Route path="/profile/:username" element={<Profile />} />
				<Route path="/post/:id" element={<PostDetail />} />
				<Route path="/album/:id" element={<AlbumGallery />} />
				<Route path="/auth" element={<Auth />} />
				<Route path="*" element={<NotFound />} />
			</Routes>

			{/* Auth Modal */}
			{showAuthModal && (
				<AuthModal
					isSignUp={isSignUp}
					setIsSignUp={setIsSignUp}
					setShowAuthModal={setShowAuthModal}
					onAuth={() => setShowAuthModal(false)}
				/>
			)}

			{/* Upload Modal */}
			{showUpload && (
				<UploadModal
					user={user}
					setShowUpload={setShowUpload}
					onUploadSuccess={loadPosts}
				/>
			)}
		</div>
	);
};

export default App;
