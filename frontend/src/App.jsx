import { useState, useEffect, useRef, useCallback } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { apiClient } from "./apiClient";
import Header from "./components/Header";
import AuthModal from "./components/AuthModal";
import UploadModal from "./components/UploadModal";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import HomeExplore from "./pages/HomeExplore";
import Following from "./pages/Following";
import Upload from "./pages/Upload";
import Profile from "./pages/Profile";
import PostDetail from "./pages/PostDetail";
import AlbumGallery from "./pages/AlbumGallery";
import Hero from "./pages/Hero";
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
	const [postToSaveAfterAuth, setPostToSaveAfterAuth] = useState(null);
	const postToSaveAfterAuthRef = useRef(null); // Track postToSaveAfterAuth via ref to avoid effect re-runs

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

			const posts = await apiClient.getPosts();

			// Transform data to match expected format
			const postsData = posts.map((post) => ({
				id: post.id,
				title: post.title || "",
				caption: post.caption || "",
				imageUrl: post.image_url || "",
				audioUrl: post.audio_url || null,
				audioName: post.audio_name || null,
				tags: post.tags || "",
				timestamp: post.created_at || new Date().toISOString(),
				userId: post.user_id || "",
				username: post.username || null,
				avatarUrl: post.avatar_url || null,
				viewCount: post.view_count || 0,
			}));

			if (import.meta.env.DEV)
				console.debug("Loaded posts:", postsData.length);
			setPosts(postsData);
			setLoading(false);
		} catch (err) {
			console.error("Error loading posts:", err);
			setError(`Error loading posts: ${err.message}`);
			setPosts([]);
			setLoading(false);
		}
	}, []);

	// Keep ref in sync with state
	useEffect(() => {
		postToSaveAfterAuthRef.current = postToSaveAfterAuth;
	}, [postToSaveAfterAuth]);

	useEffect(() => {
		// Check for existing token and set user
		const token = localStorage.getItem("token");
		if (token) {
			try {
				// Decode token to get user info (simple decode, not full verification)
				const payload = JSON.parse(atob(token.split(".")[1]));
				setUser({
					id: payload.userId,
					email: payload.email,
				});
			} catch (err) {
				console.error("Error decoding token:", err);
				localStorage.removeItem("token");
			}
		}

		loadPosts();

		// TODO: Set up real-time updates via WebSocket or polling
		// For now, we'll reload posts periodically or on user action

		return () => {
			// Cleanup if needed
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
					apiClient.signOut();
					setUser(null);
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
						<HomeExplore
							setShowAuthModal={setShowAuthModal}
							setPostToSaveAfterAuth={setPostToSaveAfterAuth}
						/>
					}
				/>
				<Route
					path="/explore"
					element={
						<HomeExplore
							key="explore"
							scrollToExplore={true}
							setShowAuthModal={setShowAuthModal}
							setPostToSaveAfterAuth={setPostToSaveAfterAuth}
						/>
					}
				/>
				<Route path="/hero" element={<Hero />} />
				<Route
					path="/home"
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
							setShowAuthModal={setShowAuthModal}
							setPostToSaveAfterAuth={setPostToSaveAfterAuth}
						/>
					}
				/>
				<Route path="/following" element={<Following />} />
				<Route path="/upload" element={<Upload />} />
				<Route
					path="/profile/:username"
					element={
						<Profile
							setShowAuthModal={setShowAuthModal}
							setPostToSaveAfterAuth={setPostToSaveAfterAuth}
						/>
					}
				/>
				<Route
					path="/post/:id"
					element={
						<PostDetail
							setShowAuthModal={setShowAuthModal}
							setPostToSaveAfterAuth={setPostToSaveAfterAuth}
						/>
					}
				/>
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
					onAuth={() => {
						setShowAuthModal(false);
						// Post saving is handled in auth state change listener
					}}
				/>
			)}

			{/* Upload Modal */}
			{showUpload && (
				<UploadModal
					user={user}
					setShowUpload={setShowUpload}
					onUploadSuccess={() => {
						loadPosts();
						// If on profile page, dispatch event to refresh it
						if (location.pathname.startsWith("/profile/")) {
							window.dispatchEvent(
								new CustomEvent("postUploaded")
							);
						}
					}}
				/>
			)}
		</div>
	);
};

export default App;
