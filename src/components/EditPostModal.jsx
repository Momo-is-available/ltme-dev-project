import { useState, useEffect, useRef } from "react";
import { X, Trash2 } from "lucide-react";
import { supabase } from "../supabaseClient";
import Tooltip from "./Tooltip";
import { FEATURES } from "../config/features";

const EditPostModal = ({ isOpen, onClose, post, onSuccess, onDelete }) => {
	const [title, setTitle] = useState("");
	const [caption, setCaption] = useState("");
	const [updating, setUpdating] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState("");
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	useEffect(() => {
		if (isOpen && post) {
			setTitle(post.title || "");
			setCaption(post.caption || "");
			setError("");
			setShowDeleteConfirm(false);
		}
	}, [isOpen, post]);

	const handleUpdate = async () => {
		if (!post) return;

		setUpdating(true);
		setError("");

		try {
			const { error: updateError } = await supabase
				.from("posts")
				.update({
					title: title.trim() || "",
					caption: caption.trim() || null,
				})
				.eq("id", post.id);

			if (updateError) throw updateError;

			if (onSuccess) {
				onSuccess();
			}
			onClose();
		} catch (err) {
			console.error("Error updating post:", err);
			setError(err.message || "Failed to update post. Please try again.");
		} finally {
			setUpdating(false);
		}
	};

	const handleDelete = async () => {
		if (!post) return;

		setDeleting(true);
		setError("");

		try {
			// Delete the post (cascade will handle album_posts and saved_posts)
			const { error: deleteError } = await supabase
				.from("posts")
				.delete()
				.eq("id", post.id);

			if (deleteError) throw deleteError;

			// Delete image from storage if it exists
			if (post.imageUrl) {
				try {
					// Extract path from full URL (e.g., https://.../storage/v1/object/public/photos/user_id/file.jpg)
					const urlParts = post.imageUrl.split("/");
					const photosIndex = urlParts.findIndex((part) => part === "photos");
					if (photosIndex !== -1) {
						const imagePath = urlParts.slice(photosIndex).join("/");
						await supabase.storage.from("photos").remove([imagePath]);
					}
				} catch (storageError) {
					console.warn("Error deleting image from storage:", storageError);
					// Don't fail the whole operation if storage delete fails
				}
			}

			// Delete audio from storage if it exists - DISABLED via feature flag
			// if (FEATURES.AUDIO_ENABLED && post.audioUrl) {
			// 	try {
			// 		// Extract path from full URL
			// 		const urlParts = post.audioUrl.split("/");
			// 		const audioIndex = urlParts.findIndex((part) => part === "audio");
			// 		if (audioIndex !== -1) {
			// 			const audioPath = urlParts.slice(audioIndex).join("/");
			// 			await supabase.storage.from("audio").remove([audioPath]);
			// 		}
			// 	} catch (storageError) {
			// 		console.warn("Error deleting audio from storage:", storageError);
			// 		// Don't fail the whole operation if storage delete fails
			// 	}
			// }

			if (onDelete) {
				onDelete();
			}
			onClose();
		} catch (err) {
			console.error("Error deleting post:", err);
			setError(err.message || "Failed to delete post. Please try again.");
		} finally {
			setDeleting(false);
			setShowDeleteConfirm(false);
		}
	};

	if (!isOpen || !post) return null;

	return (
		<div
			className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
			onClick={onClose}>
			<div
				className="bg-white rounded-2xl w-full max-w-2xl mx-4 shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto"
				onClick={(e) => e.stopPropagation()}>
				{/* Header */}
				<div className="flex items-center justify-between p-4 md:p-5 border-b border-gray-200">
					<h2 className="text-xl font-bold text-gray-900">Edit Post</h2>
					<button
						type="button"
						onClick={onClose}
						className="p-2 hover:bg-gray-100 rounded-full transition-colors">
						<X className="w-5 h-5 text-gray-600" />
					</button>
				</div>

				{/* Content */}
				<div className="p-4 md:p-6">
					{error && (
						<div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
							{error}
						</div>
					)}

					{/* Image Preview */}
					{post.imageUrl && (
						<div className="mb-6">
							<img
								src={post.imageUrl}
								alt={title || "Post image"}
								className="w-full max-h-64 object-cover rounded-lg"
							/>
						</div>
					)}

					{/* Title */}
					<div className="mb-4">
						<label
							htmlFor="edit-title"
							className="block text-sm font-medium text-gray-700 mb-2">
							Title (optional)
						</label>
						<input
							id="edit-title"
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Add a title..."
							maxLength={100}
							disabled={updating || deleting}
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 placeholder-gray-500"
						/>
					</div>

					{/* Caption */}
					<div className="mb-6">
						<label
							htmlFor="edit-caption"
							className="block text-sm font-medium text-gray-700 mb-2">
							Caption (optional)
						</label>
						<textarea
							id="edit-caption"
							value={caption}
							onChange={(e) => setCaption(e.target.value)}
							placeholder="Add a caption..."
							rows={4}
							maxLength={500}
							disabled={updating || deleting}
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none text-gray-900 placeholder-gray-500"
						/>
						<div className="text-xs text-gray-500 mt-1">
							{caption.length}/500
						</div>
					</div>

					{/* Audio Info - DISABLED via feature flag */}
					{/* {FEATURES.AUDIO_ENABLED && post.audioUrl && (
						<div className="mb-6 p-3 bg-gray-50 rounded-lg">
							<p className="text-sm text-gray-600">
								<strong>Audio:</strong> {post.audioName || "Audio file"}
							</p>
							<p className="text-xs text-gray-500 mt-1">
								Audio files cannot be changed after upload
							</p>
						</div>
					)} */}

					{/* Delete Confirmation */}
					{showDeleteConfirm ? (
						<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
							<p className="text-sm font-medium text-red-900 mb-2">
								Are you sure you want to delete this post?
							</p>
							<p className="text-xs text-red-700 mb-4">
								This action cannot be undone. The post will be removed from all
								albums and saved collections.
							</p>
							<div className="flex gap-3">
								<Tooltip text="Cancel deletion and keep the post">
									<button
										type="button"
										onClick={() => setShowDeleteConfirm(false)}
										disabled={deleting}
										className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
										Cancel
									</button>
								</Tooltip>
								<Tooltip text="Permanently delete this post">
									<button
										type="button"
										onClick={handleDelete}
										disabled={deleting}
										className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
										<Trash2 className="w-4 h-4" />
										{deleting ? "Deleting..." : "Delete Post"}
									</button>
								</Tooltip>
							</div>
						</div>
					) : (
						<div className="flex items-center justify-between gap-4">
							{/* Delete Button */}
							<Tooltip text="Delete this post">
								<button
									type="button"
									onClick={() => setShowDeleteConfirm(true)}
									disabled={updating || deleting}
									className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
									<Trash2 className="w-4 h-4" />
									Delete
								</button>
							</Tooltip>

							{/* Action Buttons */}
							<div className="flex gap-3">
								<button
									type="button"
									onClick={onClose}
									disabled={updating || deleting}
									className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
									Cancel
								</button>
								<button
									type="button"
									onClick={handleUpdate}
									disabled={updating || deleting}
									className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
									{updating ? "Saving..." : "Save Changes"}
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default EditPostModal;
