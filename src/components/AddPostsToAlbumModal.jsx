import { useState } from "react";
import { X, Loader2, Check } from "lucide-react";

export default function AddPostsToAlbumModal({
	isOpen,
	onClose,
	userPosts,
	loadingPosts,
	adding,
	onAdd,
}) {
	const [selectedPostIds, setSelectedPostIds] = useState(new Set());

	if (!isOpen) return null;

	const togglePostSelection = (postId) => {
		setSelectedPostIds((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(postId)) {
				newSet.delete(postId);
			} else {
				newSet.add(postId);
			}
			return newSet;
		});
	};

	const handleAdd = () => {
		if (selectedPostIds.size > 0) {
			onAdd(Array.from(selectedPostIds));
			setSelectedPostIds(new Set());
		}
	};

	const handleClose = () => {
		setSelectedPostIds(new Set());
		onClose();
	};

	return (
		<div
			className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
			onClick={handleClose}>
			<div
				className="bg-white rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
				onClick={(e) => e.stopPropagation()}>
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200">
					<h2 className="text-xl font-bold text-gray-900">
						Add Photos to Album
					</h2>
					<button
						type="button"
						onClick={handleClose}
						disabled={adding}
						aria-label="Close modal"
						className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50">
						<X className="w-5 h-5 text-gray-600" />
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-6">
					{loadingPosts ? (
						<div className="text-center py-12">
							<Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
							<p className="text-gray-600">Loading your posts...</p>
						</div>
					) : userPosts.length === 0 ? (
						<div className="text-center py-12">
							<p className="text-gray-600 mb-4">
								You don't have any posts to add
							</p>
							<p className="text-sm text-gray-500">
								All your posts are already in this album
							</p>
						</div>
					) : (
						<>
							<p className="text-sm text-gray-600 mb-4">
								Select photos to add to this album ({selectedPostIds.size} selected)
							</p>
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
								{userPosts.map((post) => {
									const isSelected = selectedPostIds.has(post.id);
									return (
										<button
											key={post.id}
											type="button"
											onClick={() => togglePostSelection(post.id)}
											disabled={adding}
											className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
												isSelected
													? "border-gray-900 ring-2 ring-gray-900"
													: "border-gray-200 hover:border-gray-400"
											} disabled:opacity-50`}>
											<img
												src={post.image_url}
												alt={post.title || "Post"}
												className="w-full h-full object-cover"
											/>
											{isSelected && (
												<div className="absolute inset-0 bg-black/30 flex items-center justify-center">
													<Check className="w-8 h-8 text-white" />
												</div>
											)}
										</button>
									);
								})}
							</div>
						</>
					)}
				</div>

				{/* Footer */}
				<div className="p-6 border-t border-gray-200 flex items-center justify-between">
					<p className="text-sm text-gray-600">
						{selectedPostIds.size > 0
							? `${selectedPostIds.size} photo${selectedPostIds.size === 1 ? "" : "s"} selected`
							: "Select photos to add"}
					</p>
					<div className="flex gap-3">
						<button
							type="button"
							onClick={handleClose}
							disabled={adding}
							className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							style={{ color: "#374151" }}>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleAdd}
							disabled={adding || selectedPostIds.size === 0}
							className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
							{adding ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin" style={{ color: "#FFFFFF" }} />
									Adding...
								</>
							) : (
								`Add ${selectedPostIds.size > 0 ? `${selectedPostIds.size} ` : ""}Photo${selectedPostIds.size === 1 ? "" : "s"}`
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
