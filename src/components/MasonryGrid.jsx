import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, Play, Pause, Share2, FolderPlus, Edit2 } from "lucide-react";
import ShareModal from "./ShareModal";
import AddToAlbumModal from "./AddToAlbumModal";
import EditPostModal from "./EditPostModal";
import Tooltip from "./Tooltip";
import { supabase } from "../supabaseClient";
import { useSavedPosts } from "../hooks/useSavedPosts";

const MasonryGrid = ({
	posts,
	hoveredPost,
	setHoveredPost,
	audioRefs,
	playingAudioId,
	setPlayingAudioId,
	savedPostIds = [],
	user = null,
	setShowAuthModal,
	setPostToSaveAfterAuth,
	showEditButtons = false, // Only show edit buttons on profile page
}) => {
	const navigate = useNavigate();
	const [shareModalPost, setShareModalPost] = useState(null);
	const [addToAlbumPost, setAddToAlbumPost] = useState(null);
	const [showEditModal, setShowEditModal] = useState(false);
	const [editingPost, setEditingPost] = useState(null);
	const [currentUser, setCurrentUser] = useState(user);
	const [savingPostId, setSavingPostId] = useState(null);

	// Get current user if not provided
	useEffect(() => {
		if (!user) {
			supabase.auth.getSession().then(({ data: { session } }) => {
				setCurrentUser(session?.user ?? null);
			});
		}
	}, [user]);

	// Use saved posts hook for logged-in users
	const { isSaved, toggleSave } = useSavedPosts(currentUser?.id);

	// Responsive columns: 1 on mobile, 2 on tablet, 4 on desktop
	const getColumns = () => {
		if (typeof window === "undefined") return 4;
		const width = window.innerWidth;
		if (width < 640) return 1; // mobile
		if (width < 1024) return 2; // tablet
		return 4; // desktop
	};

	const [columns, setColumns] = useState(() => {
		if (typeof window !== "undefined") {
			return getColumns();
		}
		return 4;
	});

	useEffect(() => {
		const handleResize = () => {
			setColumns(getColumns());
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const col = useMemo(() => {
		const columnsArray = Array.from({ length: columns }, () => []);
		posts.forEach((p, i) => columnsArray[i % columns].push(p));
		return columnsArray;
	}, [posts, columns]);

	// Stop all audio when a new one starts playing
	useEffect(() => {
		if (playingAudioId) {
			Object.keys(audioRefs.current || {}).forEach((postId) => {
				if (postId !== playingAudioId && audioRefs.current[postId]) {
					audioRefs.current[postId].pause();
					audioRefs.current[postId].currentTime = 0;
				}
			});
		}
	}, [playingAudioId, audioRefs]);

	// Handle audio play/pause
	const handleAudioToggle = (e, postId) => {
		e.stopPropagation(); // Prevent opening post detail

		const audioElement = audioRefs.current[postId];
		if (!audioElement) return;

		if (playingAudioId === postId) {
			// If this audio is playing, pause it
			audioElement.pause();
			setPlayingAudioId(null);
		} else {
			// If a different audio is playing, stop it and start this one
			if (playingAudioId && audioRefs.current[playingAudioId]) {
				audioRefs.current[playingAudioId].pause();
				audioRefs.current[playingAudioId].currentTime = 0;
			}

			// Start playing this audio
			audioElement.play();
			setPlayingAudioId(postId);
		}
	};

	return (
		<>
			<div className="flex gap-4">
				{col.map((column, i) => (
					<div key={i} className="flex-1 flex flex-col gap-4">
						{column.map((post) => (
							<div
								key={post.id}
								className="relative group cursor-pointer"
								onMouseEnter={() => setHoveredPost(post.id)}
								onMouseLeave={() => setHoveredPost(null)}
								onClick={() => {
									// Navigate to post detail route page
									navigate(`/post/${post.id}`);
								}}>
								<div className="relative rounded-2xl overflow-hidden bg-white">
									<img
										src={post.imageUrl}
										alt={post.title || "Memory"}
										loading="lazy"
										className="w-full h-auto object-cover"
									/>

									{/* Hidden audio element */}
									{post.audioUrl && (
										<audio
											data-grid-post-id={post.id}
											ref={(el) => {
												if (el) {
													audioRefs.current[post.id] =
														el;
												} else {
													delete audioRefs.current[
														post.id
													];
												}
											}}
											src={post.audioUrl}
											onEnded={() =>
												setPlayingAudioId(null)
											}
											onPause={() => {
												if (
													playingAudioId === post.id
												) {
													setPlayingAudioId(null);
												}
											}}
											onPlay={() => {
												setPlayingAudioId(post.id);
											}}
											preload="metadata"
										/>
									)}

									{/* Hover overlay */}
									<div
										className={`absolute inset-0 bg-black/60 transition ${
											hoveredPost === post.id
												? "opacity-100"
												: "opacity-0"
										}`}>
										<div className="absolute bottom-0 left-0 right-0 p-4 text-white">
											{post.title && (
												<h3 className="font-semibold text-lg">
													{post.title}
												</h3>
											)}
											{post.caption && (
												<p className="text-sm opacity-90 line-clamp-2">
													{post.caption}
												</p>
											)}
										</div>

										{/* Buttons container - wraps on smaller images */}
										<div className="absolute top-2 right-2 flex flex-wrap gap-1.5 max-w-[calc(100%-1rem)] justify-end">
											{post.audioUrl && (
												<Tooltip
													text={
														playingAudioId ===
														post.id
															? "Pause audio"
															: "Play audio"
													}>
													<button
														type="button"
														aria-label={
															playingAudioId ===
															post.id
																? "Pause audio"
																: "Play audio"
														}
														onClick={(e) =>
															handleAudioToggle(
																e,
																post.id
															)
														}
														className={`p-1.5 sm:p-2 rounded-full transition-all flex-shrink-0 ${
															playingAudioId ===
															post.id
																? "bg-white shadow-lg"
																: "bg-white/90 hover:bg-white backdrop-blur-sm"
														}`}>
														{playingAudioId ===
														post.id ? (
															<Pause className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" />
														) : (
															<Play className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" />
														)}
													</button>
												</Tooltip>
											)}
											<Tooltip text="Share this post">
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														setShareModalPost(post);
													}}
													aria-label="Share post"
													className="p-1.5 sm:p-2 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full transition-all flex-shrink-0">
													<Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" />
												</button>
											</Tooltip>
											{/* Edit and Add to Album buttons - only show if showEditButtons is true */}
											{showEditButtons &&
												currentUser &&
												currentUser.id ===
													post.userId && (
													<>
														<Tooltip text="Edit this post">
															<button
																type="button"
																onClick={(
																	e
																) => {
																	e.stopPropagation();
																	setEditingPost(
																		post
																	);
																	setShowEditModal(
																		true
																	);
																}}
																aria-label="Edit post"
																className="p-1.5 sm:p-2 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full transition-all flex-shrink-0">
																<Edit2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" />
															</button>
														</Tooltip>
														<Tooltip text="Add to album">
															<button
																type="button"
																onClick={(
																	e
																) => {
																	e.stopPropagation();
																	setAddToAlbumPost(
																		post
																	);
																}}
																aria-label="Add to album"
																className="p-1.5 sm:p-2 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full transition-all flex-shrink-0">
																<FolderPlus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" />
															</button>
														</Tooltip>
													</>
												)}
											{currentUser ? (
												// Logged in: show saved state or save button
												isSaved(post.id) ? (
													<Tooltip text="Remove from saved posts">
														<button
															type="button"
															onClick={async (
																e
															) => {
																e.stopPropagation();
																setSavingPostId(
																	post.id
																);
																await toggleSave(
																	post.id
																);
																setSavingPostId(
																	null
																);
															}}
															disabled={
																savingPostId ===
																post.id
															}
															aria-label="Unsave post"
															className={`p-1.5 sm:p-2 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full transition-all flex-shrink-0 ${
																savingPostId ===
																post.id
																	? "opacity-50 cursor-not-allowed"
																	: ""
															}`}>
															<Bookmark className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900 fill-current" />
														</button>
													</Tooltip>
												) : (
													<Tooltip text="Save this post">
														<button
															type="button"
															onClick={async (
																e
															) => {
																e.stopPropagation();
																setSavingPostId(
																	post.id
																);
																await toggleSave(
																	post.id
																);
																setSavingPostId(
																	null
																);
															}}
															disabled={
																savingPostId ===
																post.id
															}
															aria-label="Save post"
															className={`p-1.5 sm:p-2 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full transition-all flex-shrink-0 ${
																savingPostId ===
																post.id
																	? "opacity-50 cursor-not-allowed"
																	: ""
															}`}>
															<Bookmark className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" />
														</button>
													</Tooltip>
												)
											) : (
												// Logged out: show save button that triggers auth
												<Tooltip text="Save this post">
													<button
														type="button"
														onClick={(e) => {
															e.stopPropagation();
															if (
																setPostToSaveAfterAuth
															) {
																setPostToSaveAfterAuth(
																	post.id
																);
															}
															if (
																setShowAuthModal
															) {
																setShowAuthModal(
																	true
																);
															}
														}}
														aria-label="Save post"
														className="p-1.5 sm:p-2 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full transition-all flex-shrink-0">
														<Bookmark className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" />
													</button>
												</Tooltip>
											)}
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				))}
			</div>
			{/* Share Modal */}
			{shareModalPost && (
				<ShareModal
					isOpen={!!shareModalPost}
					onClose={() => setShareModalPost(null)}
					post={shareModalPost}
					url={`${window.location.origin}/post/${shareModalPost.id}`}
				/>
			)}

			{/* Add to Album Modal */}
			{currentUser && addToAlbumPost && (
				<AddToAlbumModal
					isOpen={!!addToAlbumPost}
					onClose={() => setAddToAlbumPost(null)}
					currentUser={currentUser}
					postId={addToAlbumPost.id}
					onSuccess={() => {
						if (import.meta.env.DEV) {
							console.debug("Post added to album successfully");
						}
					}}
				/>
			)}

			{/* Edit Post Modal */}
			{showEditModal && editingPost && currentUser && (
				<EditPostModal
					isOpen={showEditModal}
					onClose={() => {
						setShowEditModal(false);
						setEditingPost(null);
					}}
					post={editingPost}
					onSuccess={() => {
						// Reload the page to refresh posts
						window.location.reload();
					}}
					onDelete={() => {
						// Reload the page after deletion
						window.location.reload();
					}}
				/>
			)}
		</>
	);
};

export default MasonryGrid;
