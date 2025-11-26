import React, { useState, useEffect, useRef } from "react";
import { Grid } from "lucide-react";
import { supabase } from "./supabaseClient";
import Header from "./components/Header";
import AuthModal from "./components/AuthModal.jsx";
import UploadModal from "./components/UploadModal";
import PostDetail from "./components/PostDetail";
import MasonryGrid from "./components/MasonryGrid";

const App = () => {
	const [user, setUser] = useState(null);
	const [showAuthModal, setShowAuthModal] = useState(false);
	const [showUpload, setShowUpload] = useState(false);
	const [posts, setPosts] = useState([]);
	const [selectedPost, setSelectedPost] = useState(null);
	const [hoveredPost, setHoveredPost] = useState(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [playingAudioId, setPlayingAudioId] = useState(null);

	// Shared audio refs for syncing between grid and detail views
	const audioRefs = useRef({});

	// Auth state
	const [isSignUp, setIsSignUp] = useState(false);

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

		// Load posts from Supabase
		const loadPosts = async () => {
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
					console.log("No posts data returned");
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

				console.log("Loaded posts:", postsData.length);
				setPosts(postsData);
				setLoading(false);
			} catch (err) {
				console.error("Unexpected error loading posts:", err);
				setError(`Unexpected error: ${err.message}`);
				setPosts([]);
				setLoading(false);
			}
		};

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
	}, []);

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
				}}
				searchQuery={searchQuery}
				setSearchQuery={setSearchQuery}
			/>

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
				<UploadModal user={user} setShowUpload={setShowUpload} />
			)}

			{/* Post Detail */}
			{selectedPost && (
				<PostDetail
					post={selectedPost}
					onClose={() => setSelectedPost(null)}
					user={user}
					onSave={() => {
						// TODO: Implement save functionality
						console.log("Save post:", selectedPost.id);
					}}
					audioRefs={audioRefs}
					playingAudioId={playingAudioId}
					setPlayingAudioId={setPlayingAudioId}
				/>
			)}

			{/* Gallery */}
			<main className="max-w-screen-2xl mx-auto px-6 pt-24 pb-12">
				{error && (
					<div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 rounded-lg mb-6">
						<p className="font-semibold mb-2">⚠️ Setup Required</p>
						<p className="text-sm">{error}</p>
						<p className="text-sm mt-2">
							Check the browser console for more details.
						</p>
					</div>
				)}

				{loading ? (
					<div className="text-center py-32">
						<Grid className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-pulse" />
						<p className="text-gray-500">Loading...</p>
					</div>
				) : posts.length === 0 ? (
					<div className="text-center py-32">
						<Grid className="w-16 h-16 text-gray-300 mx-auto mb-4" />
						<h2 className="text-3xl font-bold text-gray-900 mb-2">
							Welcome to LTME
						</h2>
						<p className="text-gray-500 mb-8 text-lg">
							Discover and share meaningful moments
						</p>
						<button
							onClick={handleCreateClick}
							className="px-8 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors">
							{user
								? "Create Your First Moment"
								: "Sign In to Share"}
						</button>
					</div>
				) : (
					<MasonryGrid
						posts={posts.filter(
							(post) =>
								post.title
									?.toLowerCase()
									.includes(searchQuery.toLowerCase()) ||
								post.caption
									?.toLowerCase()
									.includes(searchQuery.toLowerCase())
						)}
						setSelectedPost={setSelectedPost}
						hoveredPost={hoveredPost}
						setHoveredPost={setHoveredPost}
						user={user}
						audioRefs={audioRefs}
						playingAudioId={playingAudioId}
						setPlayingAudioId={setPlayingAudioId}
					/>
				)}
			</main>
		</div>
	);
};

export default App;
