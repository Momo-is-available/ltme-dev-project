import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
	Bookmark,
	Share2,
	FolderPlus,
	Edit2,
	User,
} from "lucide-react";
import ShareModal from "./ShareModal";
import AddToAlbumModal from "./AddToAlbumModal";
import EditPostModal from "./EditPostModal";
import Tooltip from "./Tooltip";
import { apiClient } from "../apiClient";
import { useSavedPosts } from "../hooks/useSavedPosts";
import { Link } from "react-router-dom";
import { FEATURES } from "../config/features";

const MixedContentGrid = ({
	feedItems,
	hoveredPost,
	setHoveredPost,
	audioRefs,
	playingAudioId,
	setPlayingAudioId,
	savedPostIds = [],
	user = null,
	setShowAuthModal,
	setPostToSaveAfterAuth,
	showEditButtons = false,
}) => {
	const navigate = useNavigate();
	const [shareModalPost, setShareModalPost] = useState(null);
	const [addToAlbumPost, setAddToAlbumPost] = useState(null);
	const [showEditModal, setShowEditModal] = useState(false);
	const [editingPost, setEditingPost] = useState(null);
	const [currentUser, setCurrentUser] = useState(user);
	const [savingPostId, setSavingPostId] = useState(null);

	// Sync currentUser with user prop and listen for auth changes
	useEffect(() => {
		// If user prop is provided, sync with it
		if (user) {
			setCurrentUser(user);
		} else {
			// If no user prop, get from session
			supabase.auth.getSession().then(({ data: { session } }) => {
				setCurrentUser(session?.user ?? null);
			});
		}

		// Listen for auth state changes to keep currentUser in sync
		const {
			data: { subscription: authSubscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setCurrentUser(session?.user ?? null);
		});

		return () => {
			authSubscription?.unsubscribe();
		};
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
		let timeoutId;
		const handleResize = () => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				setColumns(getColumns());
			}, 150); // Debounce resize events
		};

		window.addEventListener("resize", handleResize);
		return () => {
			clearTimeout(timeoutId);
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	const col = useMemo(() => {
		const columnsArray = Array.from({ length: columns }, () => []);
		feedItems.forEach((item, i) => columnsArray[i % columns].push(item));
		return columnsArray;
	}, [feedItems, columns]);

	// Stop all audio when a new one starts playing - DISABLED via feature flag
	// useEffect(() => {
	// 	if (FEATURES.AUDIO_ENABLED && playingAudioId) {
	// 		Object.keys(audioRefs.current || {}).forEach((postId) => {
	// 			if (postId !== playingAudioId && audioRefs.current[postId]) {
	// 				audioRefs.current[postId].pause();
	// 				audioRefs.current[postId].currentTime = 0;
	// 			}
	// 		});
	// 	}
	// }, [playingAudioId, audioRefs]);

	// Handle audio play/pause - DISABLED via feature flag
	// const handleAudioToggle = (e, postId) => {
	// 	e.stopPropagation();

	// 	const audioElement = audioRefs.current[postId];
	// 	if (!audioElement) return;

	// 	if (playingAudioId === postId) {
	// 		audioElement.pause();
	// 		setPlayingAudioId(null);
	// 	} else {
	// 		if (playingAudioId && audioRefs.current[playingAudioId]) {
	// 			audioRefs.current[playingAudioId].pause();
	// 			audioRefs.current[playingAudioId].currentTime = 0;
	// 		}
	// 		audioElement.play();
	// 		setPlayingAudioId(postId);
	// 	}
	// };

	const renderPost = (post) => {
		return (
			<div
				key={post.id}
				className="relative group cursor-pointer"
				onMouseEnter={() => setHoveredPost(post.id)}
				onMouseLeave={() => setHoveredPost(null)}
				onClick={() => {
					navigate(`/post/${post.id}`);
				}}>
				<div className="relative rounded-2xl overflow-hidden bg-white">
					<img
						src={post.imageUrl}
						alt={post.title || "Memory"}
						loading="lazy"
						className="w-full h-auto object-cover"
					/>

					{/* User Info - Top Left */}
					{(post.username || post.userId) && (
						<Link
							to={
								post.username
									? `/profile/${post.username}`
									: "#"
							}
							onClick={(e) => {
								e.stopPropagation();
							}}
							className={`absolute top-2 left-2 z-10 flex items-center gap-2.5 px-2 py-1.5 transition-all max-w-[calc(100%-4rem)] ${
								hoveredPost === post.id
									? "opacity-100 md:opacity-100"
									: "opacity-100 md:opacity-0"
							}`}>
							{post.avatarUrl ? (
								<img
									src={post.avatarUrl}
									alt={post.username || "User"}
									loading="lazy"
									className="w-8 h-8 rounded-full object-cover flex-shrink-0"
								/>
							) : (
								<div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
									<User className="w-4 h-4 text-white" />
								</div>
							)}
							{post.username && (
								<span className="text-base font-medium text-white pr-1 truncate">
									{post.username.length > 14
										? post.username.substring(0, 14) + "..."
										: post.username}
								</span>
							)}
						</Link>
					)}

					{/* Hidden audio element - DISABLED via feature flag */}
					{/* {FEATURES.AUDIO_ENABLED && post.audioUrl && (
						<audio
							data-grid-post-id={post.id}
							ref={(el) => {
								if (el) {
									audioRefs.current[post.id] = el;
								} else {
									delete audioRefs.current[post.id];
								}
							}}
							src={post.audioUrl}
							onEnded={() => setPlayingAudioId(null)}
							onPause={() => {
								if (playingAudioId === post.id) {
									setPlayingAudioId(null);
								}
							}}
							onPlay={() => {
								setPlayingAudioId(post.id);
							}}
							preload="metadata"
						/>
					)} */}

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

						{/* Buttons container */}
						<div className="absolute top-2 right-2 flex flex-wrap gap-1.5 max-w-[calc(100%-1rem)] justify-end">
							{/* Audio play/pause button - DISABLED via feature flag */}
							{/* {FEATURES.AUDIO_ENABLED && post.audioUrl && (
								<Tooltip
									text={
										playingAudioId === post.id
											? "Pause audio"
											: "Play audio"
									}>
									<button
										type="button"
										aria-label={
											playingAudioId === post.id
												? "Pause audio"
												: "Play audio"
										}
										onClick={(e) =>
											handleAudioToggle(e, post.id)
										}
										className={`p-1.5 sm:p-2 rounded-full transition-all flex-shrink-0 ${
											playingAudioId === post.id
												? "bg-white shadow-lg"
												: "bg-white/90 hover:bg-white backdrop-blur-sm"
										}`}>
										{playingAudioId === post.id ? (
											<Pause className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" />
										) : (
											<Play className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" />
										)}
									</button>
								</Tooltip>
							)} */}
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
							{showEditButtons &&
								currentUser &&
								currentUser.id === post.userId && (
									<>
										<Tooltip text="Edit this post">
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													setEditingPost(post);
													setShowEditModal(true);
												}}
												aria-label="Edit post"
												className="p-1.5 sm:p-2 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full transition-all flex-shrink-0">
												<Edit2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" />
											</button>
										</Tooltip>
										<Tooltip text="Add to album">
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													setAddToAlbumPost(post);
												}}
												aria-label="Add to album"
												className="p-1.5 sm:p-2 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full transition-all flex-shrink-0">
												<FolderPlus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" />
											</button>
										</Tooltip>
									</>
								)}
							{currentUser ? (
								isSaved(post.id) ? (
									<Tooltip text="Remove from saved posts">
										<button
											type="button"
											onClick={async (e) => {
												e.stopPropagation();
												setSavingPostId(post.id);
												await toggleSave(post.id);
												setSavingPostId(null);
											}}
											disabled={savingPostId === post.id}
											aria-label="Unsave post"
											className={`p-1.5 sm:p-2 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full transition-all flex-shrink-0 ${
												savingPostId === post.id
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
											onClick={async (e) => {
												e.stopPropagation();
												setSavingPostId(post.id);
												await toggleSave(post.id);
												setSavingPostId(null);
											}}
											disabled={savingPostId === post.id}
											aria-label="Save post"
											className={`p-1.5 sm:p-2 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full transition-all flex-shrink-0 ${
												savingPostId === post.id
													? "opacity-50 cursor-not-allowed"
													: ""
											}`}>
											<Bookmark className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" />
										</button>
									</Tooltip>
								)
							) : (
								<Tooltip text="Save this post">
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											if (setPostToSaveAfterAuth) {
												setPostToSaveAfterAuth(post.id);
											}
											if (setShowAuthModal) {
												setShowAuthModal(true);
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
		);
	};

	const renderAlbum = (album) => {
		return (
			<Link
				key={album.id}
				to={`/album/${album.id}`}
				state={{ fromExplore: true }}
				className="group relative rounded-2xl overflow-hidden bg-white border border-gray-200 hover:shadow-lg transition-shadow">
				<div className="aspect-video bg-gray-100 overflow-hidden">
					{album.coverImageUrl ? (
						<img
							src={album.coverImageUrl}
							alt={album.title}
							className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center">
							<span className="material-icons text-5xl text-gray-400">
								photo_album
							</span>
						</div>
					)}
				</div>
				<div className="p-4">
					<h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
						{album.title}
					</h3>
					{album.description && (
						<p className="text-sm text-gray-600 line-clamp-2 mb-2">
							{album.description}
						</p>
					)}
					{album.username && (
						<p className="text-xs text-gray-500">
							by {album.username}
						</p>
					)}
				</div>
			</Link>
		);
	};

	return (
		<>
			<div className="flex gap-4">
				{col.map((column, i) => (
					<div key={i} className="flex-1 flex flex-col gap-4">
						{column.map((item) =>
							item.type === "post"
								? renderPost(item.data)
								: renderAlbum(item.data)
						)}
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
						window.location.reload();
					}}
					onDelete={() => {
						window.location.reload();
					}}
				/>
			)}
		</>
	);
};

export default MixedContentGrid;
