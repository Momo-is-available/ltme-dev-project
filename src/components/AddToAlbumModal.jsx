import { useState, useEffect } from "react";
import { X, Loader2, Plus, Folder } from "lucide-react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function AddToAlbumModal({
	isOpen,
	onClose,
	currentUser,
	postId,
	onSuccess,
}) {
	const [albums, setAlbums] = useState([]);
	const [loading, setLoading] = useState(true);
	const [adding, setAdding] = useState(false);
	const [error, setError] = useState("");
	const [selectedAlbumId, setSelectedAlbumId] = useState("");
	const navigate = useNavigate();

	// Load user's albums when modal opens
	useEffect(() => {
		if (isOpen && currentUser?.id) {
			loadAlbums();
		} else {
			setAlbums([]);
			setSelectedAlbumId("");
		}
	}, [isOpen, currentUser?.id]);

	const loadAlbums = async () => {
		if (!currentUser?.id) return;

		try {
			setLoading(true);
			setError("");

			const { data, error: queryError } = await supabase
				.from("albums")
				.select("id, title, cover_image_url")
				.eq("user_id", currentUser.id)
				.order("created_at", { ascending: false });

			if (queryError) throw queryError;

			setAlbums(data || []);
		} catch (err) {
			console.error("Error loading albums:", err);
			setError("Failed to load albums");
		} finally {
			setLoading(false);
		}
	};

	const handleAddToAlbum = async () => {
		if (!selectedAlbumId || !postId || !currentUser?.id) return;

		setAdding(true);
		setError("");

		try {
			// Check if post is already in album
			const { data: existing } = await supabase
				.from("album_posts")
				.select("id")
				.eq("album_id", selectedAlbumId)
				.eq("post_id", postId)
				.maybeSingle();

			if (existing) {
				setError("This post is already in the selected album");
				setAdding(false);
				return;
			}

			// Add post to album
			const { error: insertError } = await supabase
				.from("album_posts")
				.insert({
					album_id: selectedAlbumId,
					post_id: postId,
				});

			if (insertError) throw insertError;

			if (import.meta.env.DEV) {
				console.debug("Post added to album successfully");
			}

			onSuccess?.();
			onClose();
		} catch (err) {
			console.error("Error adding post to album:", err);
			setError(err.message || "Failed to add post to album");
		} finally {
			setAdding(false);
		}
	};

	const handleCreateAlbum = async () => {
		onClose();
		// Get user's username to navigate to their profile
		try {
			const { data: profile } = await supabase
				.from("user_profiles")
				.select("username")
				.eq("id", currentUser.id)
				.maybeSingle();

			if (profile?.username) {
				navigate(`/profile/${profile.username}`, { state: { openAlbumsTab: true } });
			} else {
				navigate("/");
			}
		} catch (err) {
			console.error("Error getting profile:", err);
			navigate("/");
		}
	};

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
			onClick={onClose}>
			<div
				className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden"
				onClick={(e) => e.stopPropagation()}>
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200">
					<h2 className="text-xl font-bold text-gray-900">
						Add to Album
					</h2>
					<button
						type="button"
						onClick={onClose}
						disabled={adding}
						aria-label="Close add to album modal"
						className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50">
						<X className="w-5 h-5 text-gray-600" />
					</button>
				</div>

				{/* Content */}
				<div className="p-6">
					{loading ? (
						<div className="text-center py-8">
							<Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
							<p className="text-gray-600">Loading albums...</p>
						</div>
					) : albums.length === 0 ? (
						<div className="text-center py-8">
							<Folder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
							<p className="text-gray-600 mb-4">
								You don't have any albums yet
							</p>
							<button
								type="button"
								onClick={handleCreateAlbum}
								className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors mx-auto">
								<Plus className="w-4 h-4" style={{ color: "#FFFFFF" }} />
								Create Album
							</button>
						</div>
					) : (
						<>
							<div className="mb-4">
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Select Album
								</label>
								<div className="space-y-2 max-h-64 overflow-y-auto">
									{albums.map((album) => (
										<button
											key={album.id}
											type="button"
											onClick={() =>
												setSelectedAlbumId(album.id)
											}
											disabled={adding}
											className={`w-full flex items-center gap-3 p-3 border-2 rounded-lg transition-colors disabled:opacity-50 ${
												selectedAlbumId === album.id
													? "border-gray-900 bg-gray-50"
													: "border-gray-200 hover:border-gray-300"
											}`}>
											{album.cover_image_url ? (
												<img
													src={album.cover_image_url}
													alt={album.title}
													className="w-12 h-12 rounded object-cover"
												/>
											) : (
												<div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
													<Folder className="w-6 h-6 text-gray-400" />
												</div>
											)}
											<span className="flex-1 text-left font-medium text-gray-900">
												{album.title}
											</span>
										</button>
									))}
								</div>
							</div>

							{/* Create New Album Option */}
							<button
								type="button"
								onClick={handleCreateAlbum}
								disabled={adding}
								className="w-full flex items-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors disabled:opacity-50 mb-4">
								<Plus className="w-4 h-4" style={{ color: "#4B5563" }} />
								<span className="font-medium" style={{ color: "#374151" }}>
									Create New Album
								</span>
							</button>

							{/* Error Message */}
							{error && (
								<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
									<p className="text-sm text-red-600">
										{error}
									</p>
								</div>
							)}

							{/* Actions */}
							<div className="flex gap-3">
								<button
									type="button"
									onClick={onClose}
									disabled={adding}
									className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
									style={{ color: "#374151" }}>
									Cancel
								</button>
								<button
									type="button"
									onClick={handleAddToAlbum}
									disabled={adding || !selectedAlbumId}
									className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
									{adding ? (
										<>
											<Loader2 className="w-4 h-4 animate-spin" style={{ color: "#FFFFFF" }} />
											Adding...
										</>
									) : (
										"Add to Album"
									)}
								</button>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
