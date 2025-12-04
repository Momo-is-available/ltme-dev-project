import { useState, useEffect, useRef } from "react";
import { X, Loader2, Upload, Check, Search, ChevronDown, Globe, Lock } from "lucide-react";
import { supabase } from "../supabaseClient";

export default function AlbumModal({
	isOpen,
	onClose,
	currentUser,
	album = null, // If provided, we're editing; otherwise creating
	onSuccess,
}) {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [isPublic, setIsPublic] = useState(false);
	const [coverImageUrl, setCoverImageUrl] = useState("");
	const [coverImageFile, setCoverImageFile] = useState(null);
	const [coverImagePreview, setCoverImagePreview] = useState(null);
	const [selectedPostId, setSelectedPostId] = useState(null);
	const [userPosts, setUserPosts] = useState([]);
	const [loadingPosts, setLoadingPosts] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const [hasMorePosts, setHasMorePosts] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [coverImageSource, setCoverImageSource] = useState("upload"); // "upload" or "select"
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [postsOffset, setPostsOffset] = useState(0);
	const fileInputRef = useRef(null);
	const POSTS_PER_PAGE = 24; // Load 24 posts at a time (good for grid layout)

	// Load user's posts when modal opens
	useEffect(() => {
		if (isOpen && currentUser?.id) {
			setSearchQuery(""); // Reset search when modal opens
			loadUserPosts(true);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen, currentUser?.id]);

	// Initialize form when modal opens or album changes
	useEffect(() => {
		if (isOpen) {
			if (album) {
				// Editing existing album
				setTitle(album.title || "");
				setDescription(album.description || "");
				setIsPublic(album.is_public || false);
				setCoverImageUrl(album.cover_image_url || "");
				setCoverImagePreview(album.cover_image_url || null);
				setCoverImageFile(null);
				setSelectedPostId(null);
				setCoverImageSource("upload");
			} else {
				// Creating new album
				setTitle("");
				setDescription("");
				setIsPublic(false); // Private by default
				setCoverImageUrl("");
				setCoverImagePreview(null);
				setCoverImageFile(null);
				setSelectedPostId(null);
				setCoverImageSource("upload");
			}
			setError("");
		}
	}, [isOpen, album]);

	const loadUserPosts = async (reset = false) => {
		if (!currentUser?.id) return;

		try {
			if (reset) {
				setLoadingPosts(true);
				setPostsOffset(0);
			} else {
				setLoadingMore(true);
			}

			const offset = reset ? 0 : postsOffset;

			// Build query
			let query = supabase
				.from("posts")
				.select("id, title, image_url, created_at", { count: "exact" })
				.eq("user_id", currentUser.id)
				.order("created_at", { ascending: false })
				.range(offset, offset + POSTS_PER_PAGE - 1);

			// Add search filter if query exists
			if (searchQuery.trim()) {
				query = query.ilike("title", `%${searchQuery.trim()}%`);
			}

			const { data, error, count } = await query;

			if (error) throw error;

			if (reset) {
				setUserPosts(data || []);
				// Check if there are more posts to load
				setHasMorePosts((data?.length || 0) < (count || 0));
			} else {
				setUserPosts((prev) => {
					const updatedPosts = [...prev, ...(data || [])];
					// Check if there are more posts to load
					setHasMorePosts(updatedPosts.length < (count || 0));
					return updatedPosts;
				});
			}

			setPostsOffset(offset + POSTS_PER_PAGE);
		} catch (err) {
			console.error("Error loading user posts:", err);
			setError("Failed to load your posts");
		} finally {
			setLoadingPosts(false);
			setLoadingMore(false);
		}
	};

	const handleLoadMore = () => {
		loadUserPosts(false);
	};

	const handleSearchChange = (e) => {
		setSearchQuery(e.target.value);
	};

	// Debounce search - reload posts when search query changes
	useEffect(() => {
		if (!isOpen) return;

		const timeoutId = setTimeout(() => {
			if (currentUser?.id) {
				loadUserPosts(true);
			}
		}, 300); // 300ms debounce

		return () => clearTimeout(timeoutId);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchQuery]);

	const handleFileSelect = (e) => {
		const file = e.target.files[0];
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			setError("Please select an image file");
			return;
		}

		setCoverImageFile(file);
		setSelectedPostId(null);
		setCoverImageSource("upload");

		// Create preview
		const reader = new FileReader();
		reader.onloadend = () => {
			setCoverImagePreview(reader.result);
		};
		reader.readAsDataURL(file);
	};

	const handlePostSelect = (postId) => {
		setSelectedPostId(postId);
		setCoverImageFile(null);
		setCoverImageSource("select");
		const post = userPosts.find((p) => p.id === postId);
		if (post) {
			setCoverImagePreview(post.image_url);
		}
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	if (!isOpen) return null;

	const handleSave = async () => {
		if (!currentUser?.id) {
			setError("You must be signed in to create/edit albums");
			return;
		}

		if (!title.trim()) {
			setError("Album title is required");
			return;
		}

		setSaving(true);
		setError("");

		try {
			let finalCoverImageUrl = coverImageUrl.trim() || null;

			// Upload cover image if file was selected
			if (coverImageFile) {
				const coverPath = `album-covers/${currentUser.id}/${Date.now()}_${coverImageFile.name}`;

				const { error: uploadError } = await supabase.storage
					.from("photos")
					.upload(coverPath, coverImageFile, {
						cacheControl: "3600",
						upsert: false,
					});

				if (uploadError) throw uploadError;

				const { data: urlData } = supabase.storage
					.from("photos")
					.getPublicUrl(coverPath);

				finalCoverImageUrl = urlData.publicUrl;
			} else if (selectedPostId) {
				// Use selected post's image
				const post = userPosts.find((p) => p.id === selectedPostId);
				if (post) {
					finalCoverImageUrl = post.image_url;
				}
			}

			const albumData = {
				title: title.trim(),
				description: description.trim() || null,
				is_public: isPublic,
				cover_image_url: finalCoverImageUrl,
				updated_at: new Date().toISOString(),
			};

			if (album) {
				// Update existing album
				const { error: updateError } = await supabase
					.from("albums")
					.update(albumData)
					.eq("id", album.id)
					.eq("user_id", currentUser.id);

				if (updateError) throw updateError;

				if (import.meta.env.DEV) {
					console.debug("Album updated successfully");
				}
			} else {
				// Create new album
				const { data, error: insertError } = await supabase
					.from("albums")
					.insert({
						...albumData,
						user_id: currentUser.id,
					})
					.select()
					.single();

				if (insertError) throw insertError;

				if (import.meta.env.DEV) {
					console.debug("Album created successfully:", data);
				}
			}

			onSuccess?.();
			onClose();
		} catch (err) {
			console.error("Error saving album:", err);
			setError(err.message || "Failed to save album. Please try again.");
		} finally {
			setSaving(false);
		}
	};

	const handleClose = () => {
		setTitle("");
		setDescription("");
		setCoverImageUrl("");
		setCoverImageFile(null);
		setCoverImagePreview(null);
		setSelectedPostId(null);
		setCoverImageSource("upload");
		setError("");
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
		onClose();
	};

	return (
		<div
			className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto"
			onClick={handleClose}>
			<div
				className="bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden my-8"
				onClick={(e) => e.stopPropagation()}>
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-gray-200">
					<h2 className="text-lg font-bold" style={{ color: "#111827" }}>
						{album ? "Edit Album" : "Create Album"}
					</h2>
					<button
						type="button"
						onClick={handleClose}
						disabled={saving}
						aria-label="Close album modal"
						className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50">
						<X className="w-5 h-5" style={{ color: "#4B5563" }} />
					</button>
				</div>

				{/* Content - Side by side layout */}
				<div className="flex flex-col md:flex-row max-h-[calc(100vh-200px)]">
					{/* Main Form - Left Side */}
					<div className="flex-1 p-4 md:p-6 overflow-y-auto">
						{/* Title */}
						<div className="mb-3">
							<label
								htmlFor="album-title"
								className="block text-sm font-medium mb-1.5"
								style={{ color: "#374151" }}>
								Title *
							</label>
							<input
								type="text"
								id="album-title"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="Album title"
								disabled={saving}
								maxLength={100}
								className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 placeholder-gray-500"
							/>
						</div>

						{/* Description */}
						<div className="mb-4">
							<label
								htmlFor="album-description"
								className="block text-sm font-medium mb-1.5"
								style={{ color: "#374151" }}>
								Description
							</label>
						<textarea
							id="album-description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Describe your album..."
							disabled={saving}
							rows={3}
							maxLength={500}
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 placeholder-gray-500"
						/>
							<div className="text-xs mt-1 text-right" style={{ color: "#6B7280" }}>
								{description.length}/500
							</div>
						</div>

						{/* Privacy Toggle */}
						<div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									{isPublic ? (
										<Globe className="w-4 h-4" style={{ color: "#2563EB" }} />
									) : (
										<Lock className="w-4 h-4" style={{ color: "#6B7280" }} />
									)}
									<div>
										<label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>
											{isPublic ? "Public Album" : "Private Album"}
										</label>
										<p className="text-xs" style={{ color: "#6B7280" }}>
											{isPublic
												? "Anyone can view this album"
												: "Only you can view this album"}
										</p>
									</div>
								</div>
								<button
									type="button"
									onClick={() => setIsPublic(!isPublic)}
									disabled={saving}
									className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 ${
										isPublic ? "bg-blue-600" : "bg-gray-300"
									}`}>
									<span
										className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
											isPublic ? "translate-x-6" : "translate-x-1"
										}`}
									/>
								</button>
							</div>
						</div>

						{/* Cover Image Upload */}
						<div className="mb-4">
							<label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>
								Cover Image (Optional)
							</label>

							{/* Cover Image Preview */}
							{coverImagePreview && (
								<div className="mb-3 relative">
									<img
										src={coverImagePreview}
										alt="Cover preview"
										className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
									/>
									<button
										type="button"
										onClick={() => {
											setCoverImagePreview(null);
											setCoverImageFile(null);
											setSelectedPostId(null);
											setCoverImageUrl("");
											if (fileInputRef.current) {
												fileInputRef.current.value = "";
											}
										}}
										className="absolute top-1.5 right-1.5 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors">
										<X className="w-3 h-3" />
									</button>
								</div>
							)}

							{/* Upload Option */}
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								onChange={handleFileSelect}
								disabled={saving}
								className="hidden"
								id="cover-upload"
							/>
							<label
								htmlFor="cover-upload"
								className={`flex items-center justify-center gap-2 px-3 py-2 text-sm border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
									saving
										? "opacity-50 cursor-not-allowed"
										: coverImageSource === "upload"
										? "border-gray-900 bg-gray-50"
										: "border-gray-300 hover:border-gray-400"
								}`}>
								<Upload className="w-4 h-4" style={{ color: "#374151" }} />
								<span className="font-medium" style={{ color: "#374151" }}>Upload Image</span>
							</label>
						</div>

						{/* Error Message */}
						{error && (
							<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
								<p className="text-sm text-red-600">{error}</p>
							</div>
						)}

						{/* Actions - Always visible at bottom */}
						<div className="flex gap-3 pt-4 border-t border-gray-200">
							<button
								type="button"
								onClick={handleClose}
								disabled={saving}
								className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								style={{ color: "#374151" }}>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleSave}
								disabled={saving || !title.trim()}
								className="flex-1 px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
								{saving ? (
									<>
										<Loader2 className="w-4 h-4 animate-spin" />
										Saving...
									</>
								) : (
									album ? "Save Changes" : "Create Album"
								)}
							</button>
						</div>
					</div>

					{/* Post Selection Sidebar - Right Side */}
					<div className="md:w-64 border-t md:border-t-0 md:border-l border-gray-200 p-4 md:p-6 bg-gray-50 flex flex-col max-h-[calc(100vh-200px)]">
						<label className="block text-sm font-medium mb-3" style={{ color: "#374151" }}>
							Select from your posts:
						</label>

						{/* Search Input */}
						<div className="relative mb-3">
							<Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: "#9CA3AF" }} />
							<input
								type="text"
								value={searchQuery}
								onChange={handleSearchChange}
								placeholder="Search posts..."
								disabled={saving || loadingPosts}
								className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 placeholder-gray-500"
							/>
						</div>

						{/* Posts Grid - Scrollable */}
						<div className="flex-1 overflow-y-auto min-h-0">
							{loadingPosts ? (
								<div className="text-center py-8">
									<Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: "#9CA3AF" }} />
									<p className="text-xs mt-2" style={{ color: "#6B7280" }}>Loading...</p>
								</div>
							) : userPosts.length === 0 ? (
								<div className="text-center py-8">
									<p className="text-xs" style={{ color: "#6B7280" }}>
										{searchQuery ? "No posts found" : "No posts yet"}
									</p>
								</div>
							) : (
								<>
									<div className="grid grid-cols-3 md:grid-cols-2 gap-2">
										{userPosts.map((post) => (
											<button
												key={post.id}
												type="button"
												onClick={() => handlePostSelect(post.id)}
												disabled={saving}
												className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
													selectedPostId === post.id
														? "border-gray-900 ring-2 ring-gray-900"
														: "border-gray-300 hover:border-gray-500"
												} disabled:opacity-50`}>
												<img
													src={post.image_url}
													alt={post.title || "Post"}
													className="w-full h-full object-cover"
													loading="lazy"
												/>
												{selectedPostId === post.id && (
													<div className="absolute inset-0 bg-black/30 flex items-center justify-center">
														<Check className="w-5 h-5 text-white" />
													</div>
												)}
											</button>
										))}
									</div>

									{/* Load More Button */}
									{hasMorePosts && !loadingPosts && (
										<div className="mt-4 flex justify-center">
											<button
												type="button"
												onClick={handleLoadMore}
												disabled={loadingMore || saving}
												className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
												style={{ color: "#374151" }}>
												{loadingMore ? (
													<>
														<Loader2 className="w-3 h-3 animate-spin" style={{ color: "#374151" }} />
														Loading...
													</>
												) : (
													<>
														<ChevronDown className="w-3 h-3" style={{ color: "#374151" }} />
														Load More
													</>
												)}
											</button>
										</div>
									)}
									{loadingMore && (
										<div className="mt-2 text-center">
											<Loader2 className="w-4 h-4 animate-spin mx-auto" style={{ color: "#9CA3AF" }} />
										</div>
									)}
								</>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
