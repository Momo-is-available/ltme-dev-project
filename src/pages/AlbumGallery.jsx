import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
	ArrowLeft,
	Settings,
	Lock,
	Trash2,
	Eye,
	Plus,
	EyeOff,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import ScrapbookPhoto from "../components/ScrapbookPhoto";
import AlbumModal from "../components/AlbumModal";
import AddPostsToAlbumModal from "../components/AddPostsToAlbumModal";

export default function AlbumGallery() {
	const { id } = useParams();
	const navigate = useNavigate();
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
	const [previewMode, setPreviewMode] = useState(false);

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

	const loadAlbum = async () => {
		if (!id) return;

		try {
			setLoading(true);
			setError(null);

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

			setAlbum(albumData);

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
			<div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center pt-24">
				<div className="text-center">
					<div className="animate-spin w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full mx-auto mb-4"></div>
					<p className="text-gray-600 font-handwriting text-xl">
						Loading your scrapbook...
					</p>
				</div>
			</div>
		);
	}

	if (error || !album) {
		return (
			<div className="min-h-screen bg-white flex items-center justify-center pt-24 px-4">
				<div className="text-center max-w-md">
					<h1 className="text-2xl font-bold text-gray-900 mb-4">
						Album Not Found
					</h1>
					<p className="text-gray-600 mb-6">
						{error || "This album doesn't exist or is private."}
					</p>
					<button
						type="button"
						onClick={() => navigate("/")}
						className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
						Go Home
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6 pt-24">
			<div className="max-w-5xl mx-auto">
				{/* Header with Back Button */}
				<div className="mb-6">
					<button
						type="button"
						onClick={() => navigate(-1)}
						className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors">
						<ArrowLeft className="w-5 h-5" />
						<span>Back</span>
					</button>
				</div>

				{/* Preview Mode Banner */}
				{previewMode && isOwner && (
					<div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
						<p className="text-sm text-blue-800 text-center">
							👁️ Preview Mode: You're viewing your album as others
							will see it
						</p>
					</div>
				)}

				{/* Owner Controls Bar (Owner only) */}
				{isOwner && (
					<div className="mb-6 flex flex-wrap items-center justify-center gap-2">
						{/* Preview Toggle (when album has photos) */}
						{photos.length > 0 && (
							<button
								type="button"
								onClick={() => setPreviewMode(!previewMode)}
								className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-sm ${
									previewMode
										? "bg-gray-900 text-white hover:bg-gray-800"
										: "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
								}`}>
								{previewMode ? (
									<>
										<EyeOff className="w-4 h-4" />
										<span>Exit Preview</span>
									</>
								) : (
									<>
										<Eye className="w-4 h-4" />
										<span>Preview</span>
									</>
								)}
							</button>
						)}

						{/* Edit Mode Controls (hidden in preview mode) */}
						{!previewMode && (
							<>
								{/* Add Photos Button */}
								<button
									type="button"
									onClick={handleOpenAddPosts}
									className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-medium text-sm">
									<Plus className="w-4 h-4" />
									<span>Add Photos</span>
								</button>

								{/* Make Public/Private Toggle */}
								{album && (
									<button
										type="button"
										onClick={
											album.is_public
												? handleMakePrivate
												: handleMakePublic
										}
										disabled={makingPublic}
										className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
											album.is_public
												? "bg-gray-600 hover:bg-gray-700 text-white"
												: "bg-blue-600 hover:bg-blue-700 text-white"
										}`}>
										{album.is_public ? (
											<>
												<Lock className="w-4 h-4" />
												<span>Make Private</span>
											</>
										) : (
											<>
												<Eye className="w-4 h-4" />
												<span>Make Public</span>
											</>
										)}
									</button>
								)}

								{/* Edit Button */}
								<button
									type="button"
									onClick={() => setShowEditModal(true)}
									className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors font-medium text-sm">
									<Settings className="w-4 h-4" />
									<span>Edit</span>
								</button>

								{/* Delete Button */}
								<button
									type="button"
									onClick={() => setShowDeleteConfirm(true)}
									className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm">
									<Trash2 className="w-4 h-4" />
									<span>Delete</span>
								</button>
							</>
						)}
					</div>
				)}

				{/* Title page */}
				<div className="p-12 md:p-16 mb-16 relative">
					{/* Main content */}
					<div className="relative z-0 max-w-3xl mx-auto">
						<h1 className="text-5xl md:text-6xl lg:text-7xl font-handwriting text-center text-gray-900 mb-4 leading-tight">
							{album.title}
						</h1>
						{album.description && (
							<p className="text-xl md:text-2xl font-handwriting text-gray-600 text-center mt-6 max-w-2xl mx-auto leading-relaxed">
								{album.description}
							</p>
						)}
					</div>
				</div>

				{/* Photos */}
				{photos.length === 0 ? (
					<div className="text-center py-20 bg-white rounded-lg shadow-lg border-2 border-amber-100">
						<div className="text-6xl mb-4">📸</div>
						<p className="text-gray-600 text-xl font-handwriting">
							This album is empty
						</p>
						<p className="text-gray-500 text-sm mt-2">
							Add photos to start building your scrapbook
						</p>
						{isOwner && !previewMode && (
							<button
								type="button"
								onClick={handleOpenAddPosts}
								className="mt-4 flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-medium mx-auto">
								<Plus className="w-5 h-5" />
								Add Your First Photo
							</button>
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
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6">
						<h2 className="text-xl font-bold text-gray-900 mb-4">
							Delete Album?
						</h2>
						<p className="text-gray-600 mb-6">
							Are you sure you want to delete "{album.title}"?
							This action cannot be undone.
						</p>
						<div className="flex gap-3">
							<button
								type="button"
								onClick={() => setShowDeleteConfirm(false)}
								className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
								Cancel
							</button>
							<button
								type="button"
								onClick={() => {
									handleDeleteAlbum();
									setShowDeleteConfirm(false);
								}}
								className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
								Delete
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
