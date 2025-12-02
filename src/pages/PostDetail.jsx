import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
	User,
	Share2,
	ArrowLeft,
	Bookmark,
	FolderPlus,
	Edit2,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { useSavedPosts } from "../hooks/useSavedPosts";
import ShareModal from "../components/ShareModal";
import AddToAlbumModal from "../components/AddToAlbumModal";
import EditPostModal from "../components/EditPostModal";
import Tooltip from "../components/Tooltip";

export default function PostDetail({
	setShowAuthModal,
	setPostToSaveAfterAuth,
}) {
	const { id } = useParams();
	const navigate = useNavigate();
	const [post, setPost] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [playingAudioId, setPlayingAudioId] = useState(null);
	const [currentUser, setCurrentUser] = useState(null);
	const [saving, setSaving] = useState(false);
	const [showShareModal, setShowShareModal] = useState(false);
	const [showAddToAlbumModal, setShowAddToAlbumModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const audioRefs = useRef({});

	const { isSaved, toggleSave } = useSavedPosts(currentUser?.id);

	useEffect(() => {
		// Get current user
		supabase.auth.getUser().then(({ data: { user } }) => {
			setCurrentUser(user);
		});

		const loadPost = async () => {
			try {
				setLoading(true);
				setError(null);

				const { data, error: queryError } = await supabase
					.from("posts")
					.select("*")
					.eq("id", id)
					.single();

				if (queryError) {
					throw queryError;
				}

				if (!data) {
					setError("Post not found");
					setLoading(false);
					return;
				}

				// Increment view count
				await supabase.rpc("increment_post_view_count", {
					post_uuid: data.id,
				});

				// Transform to match expected format
				const postData = {
					id: data.id,
					title: data.title || "",
					caption: data.caption || "",
					imageUrl: data.image_url || "",
					audioUrl: data.audio_url || null,
					audioName: data.audio_name || null,
					timestamp: data.created_at || new Date().toISOString(),
					userId: data.user_id || "",
					userEmail: data.user_email || "",
					viewCount: (data.view_count || 0) + 1,
				};

				setPost(postData);
			} catch (err) {
				console.error("Error loading post:", err);
				setError(err.message || "Failed to load post");
			} finally {
				setLoading(false);
			}
		};

		if (id) {
			loadPost();
		}
	}, [id]);

	// Handle audio play/pause
	const handleAudioToggle = () => {
		const audioElement = audioRefs.current[id];
		if (!audioElement) return;

		if (playingAudioId === id) {
			audioElement.pause();
			setPlayingAudioId(null);
		} else {
			// Stop any other playing audio
			if (playingAudioId && audioRefs.current[playingAudioId]) {
				audioRefs.current[playingAudioId].pause();
				audioRefs.current[playingAudioId].currentTime = 0;
			}
			audioElement.play();
			setPlayingAudioId(id);
		}
	};

	const handleSave = async () => {
		if (!currentUser) {
			// Store the post ID to save after auth
			if (setPostToSaveAfterAuth && post) {
				setPostToSaveAfterAuth(post.id);
			}
			// Open auth modal
			if (setShowAuthModal) {
				setShowAuthModal(true);
			} else {
				// Fallback: navigate to auth page
				navigate("/auth");
			}
			return;
		}

		if (!post) return;

		setSaving(true);
		const success = await toggleSave(post.id);
		setSaving(false);

		if (!success) {
			alert("Failed to save post. Please try again.");
		}
	};

	const handleShare = () => {
		setShowShareModal(true);
	};

	const handleEditSuccess = async () => {
		// Reload the post to get updated data
		const { data } = await supabase
			.from("posts")
			.select("*")
			.eq("id", id)
			.single();

		if (data) {
			setPost({
				id: data.id,
				title: data.title || "",
				caption: data.caption || "",
				imageUrl: data.image_url || "",
				audioUrl: data.audio_url || null,
				audioName: data.audio_name || null,
				timestamp: data.created_at || new Date().toISOString(),
				userId: data.user_id || "",
				userEmail: data.user_email || "",
				viewCount: data.view_count || 0,
			});
		}
	};

	const handleDelete = () => {
		// Navigate back to home after deletion
		navigate("/");
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-white flex items-center justify-center pt-24">
				<div className="text-center">
					<div className="animate-spin w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full mx-auto mb-4"></div>
					<p className="text-gray-600">Loading post...</p>
				</div>
			</div>
		);
	}

	if (error || !post) {
		return (
			<div className="min-h-screen bg-white flex items-center justify-center pt-24 px-4">
				<div className="text-center max-w-md">
					<h1 className="text-2xl font-bold text-gray-900 mb-4">
						Post Not Found
					</h1>
					<p className="text-gray-600 mb-6">
						{error || "The post you're looking for doesn't exist."}
					</p>
					<Link
						to="/"
						className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors">
						<ArrowLeft className="w-5 h-5" />
						Back to Home
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-white pt-24">
			{/* Header with back button */}
			<div className="max-w-7xl mx-auto px-6 py-4 border-b border-gray-200">
				<button
					type="button"
					onClick={() => navigate(-1)}
					aria-label="Go back"
					className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors">
					<ArrowLeft className="w-5 h-5" />
					<span>Back</span>
				</button>
			</div>

			{/* Post Content */}
			<div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
				<div className="grid md:grid-cols-2 gap-8">
					{/* Left: Image */}
					<div className="bg-white rounded-2xl overflow-hidden flex items-center justify-center min-h-[300px] md:min-h-[500px]">
						<img
							src={post.imageUrl}
							alt={post.title || "Memory"}
							className="w-full h-full object-cover rounded-2xl"
						/>
					</div>

					{/* Right: Details */}
					<div className="flex flex-col">
						{/* User Info */}
						<div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
							<div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center">
								<User className="w-6 h-6 text-white" />
							</div>
							<div>
								<Link
									to={`/profile/${
										post.userId
											? `user_${post.userId.substring(
													0,
													8
											  )}`
											: (
													post.userEmail ||
													post.user_email ||
													""
											  ).split("@")[0]
									}`}
									className="font-semibold text-gray-900 hover:text-gray-700 transition-colors">
									{post.userEmail || post.user_email
										? (
												post.userEmail ||
												post.user_email
										  ).split("@")[0]
										: "User"}
								</Link>
								<p className="text-sm text-gray-500">
									{post.timestamp
										? new Date(
												post.timestamp
										  ).toLocaleDateString("en-US", {
												month: "short",
												day: "numeric",
												year: "numeric",
										  })
										: ""}
								</p>
							</div>
						</div>

						{/* Title and Caption */}
						<div className="flex-1">
							{post.title && (
								<h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
									{post.title}
								</h1>
							)}
							{post.caption && (
								<p className="text-gray-700 leading-relaxed mb-6 text-base md:text-lg">
									{post.caption}
								</p>
							)}

							{/* Audio Player */}
							{post.audioUrl && (
								<div className="mb-6 p-4 bg-gray-50 rounded-lg">
									<audio
										ref={(el) => {
											if (el) {
												audioRefs.current[id] = el;
											} else {
												delete audioRefs.current[id];
											}
										}}
										src={post.audioUrl}
										onEnded={() => setPlayingAudioId(null)}
										onPause={() => {
											if (playingAudioId === id) {
												setPlayingAudioId(null);
											}
										}}
										onPlay={() => {
											// Stop any other playing audio
											if (
												playingAudioId &&
												playingAudioId !== id
											) {
												if (
													audioRefs.current[
														playingAudioId
													]
												) {
													audioRefs.current[
														playingAudioId
													].pause();
													audioRefs.current[
														playingAudioId
													].currentTime = 0;
												}
											}
											setPlayingAudioId(id);
										}}
										className="w-full"
										controls>
										Your browser does not support the audio
										element.
									</audio>
								</div>
							)}
						</div>

						{/* Actions */}
						<div className="flex flex-wrap items-center gap-3 md:gap-4 pt-6 border-t border-gray-200">
							{/* Edit button - only show for post owner */}
							{currentUser &&
								post &&
								currentUser.id === post.userId && (
									<Tooltip text="Edit this post">
										<button
											type="button"
											onClick={() =>
												setShowEditModal(true)
											}
											className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-700">
											<Edit2 className="w-5 h-5" />
											<span className="font-medium">
												Edit
											</span>
										</button>
									</Tooltip>
								)}
							<Tooltip
								text={
									currentUser
										? isSaved(post?.id)
											? "Remove from saved posts"
											: "Save this post"
										: "Save this post"
								}>
								<button
									type="button"
									onClick={handleSave}
									disabled={saving}
									aria-label={
										currentUser
											? isSaved(post?.id)
												? "Unsave post"
												: "Save post"
											: "Sign in to save post"
									}
									className={`flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors ${
										currentUser && isSaved(post?.id)
											? "text-gray-900"
											: "text-gray-700"
									} ${
										saving
											? "opacity-50 cursor-not-allowed"
											: ""
									}`}>
									<Bookmark
										className={`w-5 h-5 ${
											currentUser && isSaved(post?.id)
												? "fill-current"
												: ""
										}`}
									/>
									<span className="font-medium">
										{currentUser
											? isSaved(post?.id)
												? "Saved"
												: "Save"
											: "Save"}
									</span>
								</button>
							</Tooltip>
							<Tooltip text="Share this post with others">
								<button
									type="button"
									onClick={handleShare}
									aria-label="Share post"
									className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors">
									<Share2 className="w-5 h-5 text-gray-600" />
									<span className="text-gray-700 font-medium">
										Share
									</span>
								</button>
							</Tooltip>
							{currentUser && currentUser.id === post?.userId && (
								<Tooltip text="Add this post to one of your albums">
									<button
										type="button"
										onClick={() =>
											setShowAddToAlbumModal(true)
										}
										aria-label="Add to album"
										className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors">
										<FolderPlus className="w-5 h-5 text-gray-600" />
										<span className="text-gray-700 font-medium">
											Add to Album
										</span>
									</button>
								</Tooltip>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Share Modal */}
			<ShareModal
				isOpen={showShareModal}
				onClose={() => setShowShareModal(false)}
				post={post}
				url={window.location.href}
			/>

			{/* Add to Album Modal */}
			{currentUser && (
				<AddToAlbumModal
					isOpen={showAddToAlbumModal}
					onClose={() => setShowAddToAlbumModal(false)}
					currentUser={currentUser}
					postId={post?.id}
					onSuccess={() => {
						if (import.meta.env.DEV) {
							console.debug("Post added to album successfully");
						}
					}}
				/>
			)}

			{/* Edit Post Modal */}
			{showEditModal &&
				currentUser &&
				post &&
				currentUser.id === post.userId && (
					<EditPostModal
						isOpen={showEditModal}
						onClose={() => setShowEditModal(false)}
						post={post}
						onSuccess={handleEditSuccess}
						onDelete={handleDelete}
					/>
				)}
		</div>
	);
}
