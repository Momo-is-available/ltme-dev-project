import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Settings, Lock, Trash2, Eye, Plus } from "lucide-react";
import { apiClient } from "../apiClient";
import ScrapbookPhoto from "../components/ScrapbookPhoto";
import AlbumModal from "../components/AlbumModal";
import AddPostsToAlbumModal from "../components/AddPostsToAlbumModal";
import Tooltip from "../components/Tooltip";

// Background asset
import whiteCrumpledTextureBg from "../assets/background/white-crumpled-paper-texture-background.jpg";

export default function AlbumGallery() {
	const { id } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const [album, setAlbum] = useState(null);
	const [photos, setPhotos] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [currentUser, setCurrentUser] = useState(null);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [makingPublic, setMakingPublic] = useState(false);
	const [showAddPostsModal, setShowAddPostsModal] = useState(false);
	const [userPosts, setUserPosts] = useState([]);
	const [loadingUserPosts, setLoadingUserPosts] = useState(false);
	const [addingPosts, setAddingPosts] = useState(false);

	useEffect(() => {
		// Get current user
		supabase.auth.getSession().then(({ data: { session } }) => {
			setCurrentUser(session?.user ?? null);
		});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setCurrentUser(session?.user ?? null);
		});

		return () => subscription.unsubscribe();
	}, []);

	useEffect(() => {
		if (id) {
			loadAlbum();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	const [albumOwnerUsername, setAlbumOwnerUsername] = useState(null);

	const loadAlbum = async () => {
		if (!id) return;

		try {
			setLoading(true);
			setError(null);

			// Get current user session
			const {
				data: { session },
			} = await supabase.auth.getSession();
			const userId = session?.user?.id || null;

			// Get album details
			const { data: albumData, error: albumError } = await supabase
				.from("albums")
				.select("*")
				.eq("id", id)
				.single();

			if (albumError) throw albumError;

			if (!albumData) {
				setError("Album not found");
				setLoading(false);
				return;
			}

			// Check access: user must be owner OR album must be public
			const isOwner = userId && userId === albumData.user_id;
			if (!isOwner && !albumData.is_public) {
				setError("This album is private");
				setLoading(false);
				return;
			}

			setAlbum(albumData);

			// Get album owner's username for navigation
			const { data: ownerProfile } = await supabase
				.from("user_profiles")
				.select("username")
				.eq("id", albumData.user_id)
				.single();

			if (ownerProfile?.username) {
				setAlbumOwnerUsername(ownerProfile.username);
			}

			// Get photos in album using join
			const { data: photosData, error: photosError } = await supabase
				.from("album_posts")
				.select("post_id, position, posts(*)")
				.eq("album_id", id)
				.order("position", { ascending: true });

			if (photosError) throw photosError;

			if (photosData && photosData.length > 0) {
				// Map to extract posts and transform data
				const transformedPhotos = photosData
					.map((item) => {
						const post = item.posts;
						if (!post) return null;
						return {
							id: post.id,
							title: post.title || "",
							caption: post.caption || "",
							image_url: post.image_url || "",
							imageUrl: post.image_url || "",
							audio_url: post.audio_url || null,
							audio_name: post.audio_name || null,
							created_at:
								post.created_at || new Date().toISOString(),
							user_id: post.user_id || "",
							user_email: post.user_email || "",
						};
					})
					.filter(Boolean);

				setPhotos(transformedPhotos);
			} else {
				setPhotos([]);
			}
		} catch (err) {
			console.error("Error loading album:", err);
			setError(err.message || "Failed to load album");
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteAlbum = async () => {
		if (!album || !currentUser || currentUser.id !== album.user_id) return;

		try {
			const { error } = await supabase
				.from("albums")
				.delete()
				.eq("id", album.id)
				.eq("user_id", currentUser.id);

			if (error) throw error;

			// Navigate back to profile
			const { data: profile } = await supabase
				.from("user_profiles")
				.select("username")
				.eq("id", currentUser.id)
				.maybeSingle();

			if (profile?.username) {
				navigate(`/profile/${profile.username}`);
			} else {
				navigate("/");
			}
		} catch (err) {
			console.error("Error deleting album:", err);
			alert("Failed to delete album. Please try again.");
		}
	};

	const handleMakePublic = async () => {
		if (!album || !currentUser || currentUser.id !== album.user_id) return;

		try {
			setMakingPublic(true);
			const { error } = await supabase
				.from("albums")
				.update({
					is_public: true,
					updated_at: new Date().toISOString(),
				})
				.eq("id", album.id)
				.eq("user_id", currentUser.id);

			if (error) throw error;

			// Reload album to reflect changes
			loadAlbum();
		} catch (err) {
			console.error("Error making album public:", err);
			alert("Failed to make album public. Please try again.");
		} finally {
			setMakingPublic(false);
		}
	};

	const handleMakePrivate = async () => {
		if (!album || !currentUser || currentUser.id !== album.user_id) return;

		try {
			setMakingPublic(true);
			const { error } = await supabase
				.from("albums")
				.update({
					is_public: false,
					updated_at: new Date().toISOString(),
				})
				.eq("id", album.id)
				.eq("user_id", currentUser.id);

			if (error) throw error;

			// Reload album to reflect changes
			loadAlbum();
		} catch (err) {
			console.error("Error making album private:", err);
			alert("Failed to make album private. Please try again.");
		} finally {
			setMakingPublic(false);
		}
	};

	const loadUserPosts = async () => {
		if (!currentUser?.id || !album) return;

		try {
			setLoadingUserPosts(true);
			// Get user's posts that aren't already in this album
			const { data: allPosts, error: postsError } = await supabase
				.from("posts")
				.select("id, title, image_url, created_at")
				.eq("user_id", currentUser.id)
				.order("created_at", { ascending: false })
				.limit(50);

			if (postsError) throw postsError;

			// Get posts already in album
			const { data: albumPosts, error: albumPostsError } = await supabase
				.from("album_posts")
				.select("post_id")
				.eq("album_id", album.id);

			if (albumPostsError) throw albumPostsError;

			const existingPostIds = new Set(
				(albumPosts || []).map((ap) => ap.post_id)
			);
			const availablePosts = (allPosts || []).filter(
				(post) => !existingPostIds.has(post.id)
			);

			setUserPosts(availablePosts);
		} catch (err) {
			console.error("Error loading user posts:", err);
		} finally {
			setLoadingUserPosts(false);
		}
	};

	const handleOpenAddPosts = () => {
		setShowAddPostsModal(true);
		loadUserPosts();
	};

	const handleAddSelectedPosts = async (selectedPostIds) => {
		if (!album || !currentUser || selectedPostIds.length === 0) return;

		try {
			setAddingPosts(true);
			const postsToAdd = selectedPostIds.map((postId) => ({
				album_id: album.id,
				post_id: postId,
			}));

			const { error } = await supabase
				.from("album_posts")
				.insert(postsToAdd);

			if (error) throw error;

			// Reload album to show new photos
			loadAlbum();
			setShowAddPostsModal(false);
		} catch (err) {
			console.error("Error adding posts to album:", err);
			alert("Failed to add posts to album. Please try again.");
		} finally {
			setAddingPosts(false);
		}
	};

	const isOwner = currentUser && album && currentUser.id === album.user_id;

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-off-white to-cream flex items-center justify-center pt-24">
				<div className="text-center">
					<div className="animate-spin w-12 h-12 border-4 border-cream border-t-terracotta rounded-full mx-auto mb-4"></div>
					<p
						className="font-handwriting text-xl"
						style={{ color: "#22332E" }}>
						Loading your scrapbook...
					</p>
				</div>
			</div>
		);
	}

	if (error || !album) {
		return (
			<div className="min-h-screen bg-off-white flex items-center justify-center pt-24 px-4">
				<div className="text-center max-w-md">
					<h1
						className="text-2xl font-bold mb-4"
						style={{ color: "#0C101D" }}>
						Album Not Found
					</h1>
					<p className="mb-6" style={{ color: "#22332E" }}>
						{error || "This album doesn't exist or is private."}
					</p>
					<button
						type="button"
						onClick={() => navigate("/")}
						className="px-6 py-3 bg-dark-navy rounded-lg hover:bg-gradient-dark transition-colors"
						style={{ color: "#F6FFF8" }}>
						Go Home
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-off-white to-cream p-4 md:p-6 pt-28 md:pt-24 relative">
			{/* Background Overlay - White Crumpled Texture */}
			<div
				className="fixed inset-0 z-0 opacity-30 pointer-events-none"
				style={{
					backgroundImage: `url(${whiteCrumpledTextureBg})`,
					backgroundSize: "cover",
					backgroundPosition: "center",
					backgroundRepeat: "no-repeat",
				}}
			/>

			<div className="max-w-5xl mx-auto pr-0 md:pr-20 relative z-10">
				{/* Header with Back Button */}
				<div className="mb-6">
					<Tooltip text="Go back">
						<button
							type="button"
							onClick={() => {
								// If came from Explore page, navigate back to Explore
								if (location.state?.fromExplore) {
									navigate("/explore");
								} else if (albumOwnerUsername) {
									// Otherwise, navigate to the album owner's profile with Albums tab open
									navigate(`/profile/${albumOwnerUsername}`, {
										state: { openAlbumsTab: true },
									});
								} else {
									// Fallback to browser back if username not loaded
									navigate(-1);
								}
							}}
							className="flex items-center gap-2 transition-colors"
							style={{ color: "#22332E" }}
							onMouseEnter={(e) =>
								(e.currentTarget.style.color = "#0C101D")
							}
							onMouseLeave={(e) =>
								(e.currentTarget.style.color = "#22332E")
							}>
							<ArrowLeft
								className="w-5 h-5"
								style={{ color: "#22332E" }}
							/>
							<span>Back</span>
						</button>
					</Tooltip>
				</div>

				{/* Owner Controls - Right Sidebar (Owner only) */}
				{isOwner && (
					<div className="fixed right-2 md:right-4 lg:right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-4 md:gap-6 lg:gap-8">
						{/* Add Photos Button */}
						<div className="relative group">
							<button
								type="button"
								onClick={handleOpenAddPosts}
								className="w-12 h-12 rounded-full hover:opacity-90 flex items-center justify-center transition-all shadow-lg hover:scale-110"
								style={{ backgroundColor: "#C97D60" }}>
								<Plus
									className="w-5 h-5"
									style={{ color: "#F6FFF8" }}
								/>
							</button>
							{/* Tooltip - Below button */}
							<div className="absolute right-1/2 translate-x-1/2 top-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
								<div
									className="text-xs px-3 py-1.5 rounded-lg shadow-lg"
									style={{
										backgroundColor: "#0C101D",
										color: "#F6FFF8",
									}}>
									Add Photos
								</div>
								<div
									className="absolute left-1/2 -translate-x-1/2 bottom-full border-4 border-transparent"
									style={{
										borderBottomColor: "#0C101D",
									}}></div>
							</div>
						</div>

						{/* Make Public/Private Toggle */}
						{album && (
							<div className="relative group">
								<button
									type="button"
									onClick={
										album.is_public
											? handleMakePrivate
											: handleMakePublic
									}
									disabled={makingPublic}
									className="w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 hover:opacity-90"
									style={{
										backgroundColor: album.is_public
											? "#22332E"
											: "#E5E7EB",
									}}>
									{album.is_public ? (
										<Lock
											className="w-5 h-5"
											style={{ color: "#F6FFF8" }}
										/>
									) : (
										<Eye
											className="w-5 h-5"
											style={{ color: "#0C101D" }}
										/>
									)}
								</button>
								{/* Tooltip - Below button */}
								<div className="absolute right-1/2 translate-x-1/2 top-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
									<div
										className="text-xs px-3 py-1.5 rounded-lg shadow-lg"
										style={{
											backgroundColor: "#0C101D",
											color: "#F6FFF8",
										}}>
										{album.is_public
											? "Make Private"
											: "Make Public"}
									</div>
									<div
										className="absolute left-1/2 -translate-x-1/2 bottom-full border-4 border-transparent"
										style={{
											borderBottomColor: "#0C101D",
										}}></div>
								</div>
							</div>
						)}

						{/* Edit Button */}
						<div className="relative group">
							<button
								type="button"
								onClick={() => setShowEditModal(true)}
								className="w-12 h-12 rounded-full hover:opacity-90 flex items-center justify-center transition-all shadow-lg hover:scale-110"
								style={{ backgroundColor: "#0C101D" }}>
								<Settings
									className="w-5 h-5"
									style={{ color: "#F6FFF8" }}
								/>
							</button>
							{/* Tooltip - Below button */}
							<div className="absolute right-1/2 translate-x-1/2 top-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
								<div
									className="text-xs px-3 py-1.5 rounded-lg shadow-lg"
									style={{
										backgroundColor: "#0C101D",
										color: "#F6FFF8",
									}}>
									Edit Album
								</div>
								<div
									className="absolute left-1/2 -translate-x-1/2 bottom-full border-4 border-transparent"
									style={{
										borderBottomColor: "#0C101D",
									}}></div>
							</div>
						</div>

						{/* Delete Button */}
						<div className="relative group">
							<button
								type="button"
								onClick={() => setShowDeleteConfirm(true)}
								className="w-12 h-12 rounded-full hover:opacity-90 flex items-center justify-center transition-all shadow-lg hover:scale-110"
								style={{ backgroundColor: "#C97D60" }}>
								<Trash2
									className="w-5 h-5"
									style={{ color: "#F6FFF8" }}
								/>
							</button>
							{/* Tooltip - Below button */}
							<div className="absolute right-1/2 translate-x-1/2 top-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
								<div
									className="text-xs px-3 py-1.5 rounded-lg shadow-lg"
									style={{
										backgroundColor: "#0C101D",
										color: "#F6FFF8",
									}}>
									Delete Album
								</div>
								<div
									className="absolute left-1/2 -translate-x-1/2 bottom-full border-4 border-transparent"
									style={{
										borderBottomColor: "#0C101D",
									}}></div>
							</div>
						</div>
					</div>
				)}

				{/* Title page */}
				<div className="p-12 md:p-16 mb-16 relative">
					{/* Main content */}
					<div className="relative z-0 max-w-3xl mx-auto">
						<h1
							className="text-6xl md:text-7xl lg:text-8xl font-heading-beauty text-center mb-4 leading-tight"
							style={{ color: "#0C101D" }}>
							{album.title}
						</h1>
						{album.description && (
							<p
								className="text-xl md:text-2xl font-alfena text-center mt-6 max-w-2xl mx-auto leading-relaxed"
								style={{ color: "#22332E" }}>
								{album.description}
							</p>
						)}
					</div>
				</div>

				{/* Photos */}
				{photos.length === 0 ? (
					<div className="text-center py-20 bg-off-white rounded-lg shadow-lg border-2 border-cream">
						<div className="text-6xl mb-4">📸</div>
						<p
							className="text-xl font-handwriting"
							style={{ color: "#22332E" }}>
							This album is empty
						</p>
						<p
							className="text-sm mt-2"
							style={{ color: "rgba(34, 51, 46, 0.7)" }}>
							Add photos to start building your scrapbook
						</p>
						{isOwner && (
							<Tooltip text="Add photos to this album">
								<button
									type="button"
									onClick={handleOpenAddPosts}
									className="mt-4 flex items-center gap-2 px-6 py-3 bg-terracotta hover:opacity-90 rounded-lg transition-colors font-medium mx-auto"
									style={{ color: "#F6FFF8" }}>
									<Plus
										className="w-5 h-5"
										style={{ color: "#F6FFF8" }}
									/>
									Add Your First Photo
								</button>
							</Tooltip>
						)}
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-12 pb-12">
						{photos.map((photo, index) => (
							<ScrapbookPhoto
								key={photo.id}
								photo={photo}
								index={index}
							/>
						))}
					</div>
				)}

				{/* Album Footer - Photo Count and Creation Date */}
				<div
					className="text-center py-8 border-t mt-8"
					style={{ borderTopColor: "#000000" }}>
					{photos.length > 0 && (
						<p
							className="text-lg font-handwriting mb-2"
							style={{ color: "#22332E" }}>
							{photos.length}{" "}
							{photos.length === 1 ? "memory" : "memories"}
						</p>
					)}
					{album?.created_at && (
						<p
							className="text-sm"
							style={{ color: "rgba(34, 51, 46, 0.7)" }}>
							Created on{" "}
							{new Date(album.created_at).toLocaleDateString(
								"en-US",
								{
									year: "numeric",
									month: "long",
									day: "numeric",
								}
							)}
						</p>
					)}
				</div>
			</div>

			{/* Edit Album Modal */}
			{isOwner && (
				<AlbumModal
					isOpen={showEditModal}
					onClose={() => setShowEditModal(false)}
					currentUser={currentUser}
					album={album}
					onSuccess={() => {
						loadAlbum();
						setShowEditModal(false);
					}}
				/>
			)}

			{/* Add Posts to Album Modal */}
			{isOwner && showAddPostsModal && (
				<AddPostsToAlbumModal
					isOpen={showAddPostsModal}
					onClose={() => setShowAddPostsModal(false)}
					userPosts={userPosts}
					loadingPosts={loadingUserPosts}
					adding={addingPosts}
					onAdd={handleAddSelectedPosts}
				/>
			)}

			{/* Delete Confirmation */}
			{showDeleteConfirm && (
				<div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6 border-2 border-gray-200">
						<h2
							className="text-xl font-bold mb-4"
							style={{ color: "#0C101D" }}>
							Delete Album?
						</h2>
						<p className="mb-6" style={{ color: "#22332E" }}>
							Are you sure you want to delete "{album.title}"?
							This action cannot be undone.
						</p>
						<div className="flex gap-3">
							<Tooltip text="Cancel deletion and keep the album">
								<button
									type="button"
									onClick={() => setShowDeleteConfirm(false)}
									className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
									style={{ color: "#0C101D", borderColor: "#D1D5DB" }}>
									Cancel
								</button>
							</Tooltip>
							<Tooltip text="Permanently delete this album">
								<button
									type="button"
									onClick={() => {
										handleDeleteAlbum();
										setShowDeleteConfirm(false);
									}}
									className="flex-1 px-4 py-2 rounded-lg hover:opacity-90 transition-colors font-medium shadow-md"
									style={{
										backgroundColor: "#C97D60",
										color: "#F6FFF8"
									}}>
									Delete
								</button>
							</Tooltip>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
