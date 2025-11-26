import React, { useEffect } from "react";
import { X, User, Heart, Share2 } from "lucide-react";

const PostDetail = ({
	post,
	onClose,
	user,
	onSave,
	audioRefs,
	playingAudioId,
	setPlayingAudioId,
}) => {
	// Sync audio when opening detail view if audio is already playing
	useEffect(() => {
		if (
			!post ||
			!post.audioUrl ||
			!playingAudioId ||
			playingAudioId !== post.id
		)
			return;

		// Wait for audio element to be rendered and then sync
		const timer = setTimeout(() => {
			const gridAudio = audioRefs.current[post.id];
			if (gridAudio) {
				// Find the detail audio element
				const detailAudio = document.querySelector(
					`audio[data-post-id="${post.id}"]`
				);

				if (detailAudio && gridAudio !== detailAudio) {
					const wasPlaying = !gridAudio.paused;
					const currentTime = gridAudio.currentTime;
					const muted = gridAudio.muted;

					// Sync currentTime and muted state
					detailAudio.currentTime = currentTime;
					detailAudio.muted = muted;

					// Pause the grid audio (hidden element)
					gridAudio.pause();

					// Replace ref to use detail audio so both views control the same element
					audioRefs.current[post.id] = detailAudio;

					// If grid audio was playing, continue playing on detail audio
					if (wasPlaying) {
						detailAudio.play().catch(() => {
							// Ignore play errors (may need user interaction)
						});
					}
				}
			}
		}, 50);

		return () => {
			clearTimeout(timer);

			// When closing detail view, sync back to grid audio if it's still playing
			if (playingAudioId === post?.id && post?.audioUrl) {
				const detailAudio = document.querySelector(
					`audio[data-post-id="${post.id}"]`
				);

				if (detailAudio) {
					const wasPlaying = !detailAudio.paused;
					const currentTime = detailAudio.currentTime;
					const muted = detailAudio.muted;

					// Find the grid audio element using the data attribute
					const gridAudioElement = document.querySelector(
						`audio[data-grid-post-id="${post.id}"]`
					);

					if (gridAudioElement && gridAudioElement !== detailAudio) {
						// Sync state to grid audio
						gridAudioElement.currentTime = currentTime;
						gridAudioElement.muted = muted;

						// Update ref to point back to grid audio
						audioRefs.current[post.id] = gridAudioElement;

						// If detail audio was playing, continue on grid audio
						if (wasPlaying) {
							// Small delay to ensure smooth transition
							setTimeout(() => {
								gridAudioElement.play().catch(() => {
									// Ignore play errors
								});
							}, 10);
						}
					}
				}
			}
		};
	}, [post?.id, playingAudioId]);

	if (!post) return null;

	return (
		<div
			className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
			onClick={onClose}>
			<div
				className="bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl"
				onClick={(e) => e.stopPropagation()}>
				<div className="grid md:grid-cols-2 h-full max-h-[90vh]">
					{/* Left: Image */}
					<div className="bg-black flex items-center justify-center">
						<img
							src={post.imageUrl}
							alt={post.title || "Memory"}
							className="max-w-full max-h-[90vh] object-contain"
						/>
					</div>

					{/* Right: Details */}
					<div className="flex flex-col overflow-y-auto">
						{/* Header */}
						<div className="p-6 border-b border-gray-200 flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
									<User className="w-6 h-6 text-white" />
								</div>
								<div>
									<p className="font-semibold text-gray-900">
										{post.userEmail || post.user_email
											? (
													post.userEmail ||
													post.user_email
											  ).split("@")[0]
											: "User"}
									</p>
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
							<button
								onClick={onClose}
								className="p-2 hover:bg-gray-100 rounded-full transition-colors">
								<X className="w-6 h-6 text-gray-600" />
							</button>
						</div>

						{/* Body */}
						<div className="p-6 flex-1">
							{post.title && (
								<h2 className="text-2xl font-bold text-gray-900 mb-3">
									{post.title}
								</h2>
							)}
							{post.caption && (
								<p className="text-gray-700 leading-relaxed mb-6">
									{post.caption}
								</p>
							)}
							{post.audioUrl && (
								<div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
									<audio
										data-post-id={post.id}
										ref={(el) => {
											if (el) {
												// Update ref to use detail audio
												const gridAudio =
													audioRefs.current[post.id];

												if (
													gridAudio &&
													gridAudio !== el &&
													playingAudioId === post.id
												) {
													// Copy state from grid audio
													const wasPlaying =
														!gridAudio.paused;
													el.currentTime =
														gridAudio.currentTime;
													el.muted = gridAudio.muted;
													// Pause grid audio since we're switching to detail audio
													gridAudio.pause();

													// Update ref to use detail audio
													audioRefs.current[post.id] =
														el;

													// If audio was playing, continue playing on detail audio
													if (wasPlaying) {
														el.play().catch(() => {
															// Ignore play errors
														});
													}
												} else {
													// Update ref to use detail audio
													audioRefs.current[post.id] =
														el;
												}
											}
										}}
										src={post.audioUrl}
										onEnded={() => setPlayingAudioId(null)}
										onPause={() => {
											// Update state when paused
											if (playingAudioId === post.id) {
												setPlayingAudioId(null);
											}
										}}
										onPlay={() => {
											// Stop any other playing audio
											if (
												playingAudioId &&
												playingAudioId !== post.id
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
											setPlayingAudioId(post.id);
										}}
										className="w-full"
										controls>
										Your browser does not support the audio
										element.
									</audio>
								</div>
							)}
						</div>

						{/* Footer actions */}
						<div className="p-6 border-t border-gray-200 flex items-center gap-4">
							<button
								onClick={onSave}
								className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors">
								<Heart className="w-5 h-5 text-gray-600" />
								<span className="text-gray-700 font-medium">
									Save
								</span>
							</button>
							<button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors">
								<Share2 className="w-5 h-5 text-gray-600" />
								<span className="text-gray-700 font-medium">
									Share
								</span>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default PostDetail;
