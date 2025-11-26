import React, { useEffect } from "react";
import { Bookmark, Volume2, Play, Pause } from "lucide-react";

const MasonryGrid = ({
	posts,
	setSelectedPost,
	hoveredPost,
	setHoveredPost,
	audioRefs,
	playingAudioId,
	setPlayingAudioId,
}) => {
	const columns = 4;
	const col = Array.from({ length: columns }, () => []);

	posts.forEach((p, i) => col[i % columns].push(p));

	// Stop all audio when a new one starts playing
	useEffect(() => {
		if (playingAudioId) {
			Object.keys(audioRefs.current).forEach((postId) => {
				if (postId !== playingAudioId && audioRefs.current[postId]) {
					audioRefs.current[postId].pause();
					audioRefs.current[postId].currentTime = 0;
				}
			});
		}
	}, [playingAudioId]);

	// Handle audio play/pause
	const handleAudioToggle = (e, postId, audioUrl) => {
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
		<div className="flex gap-4">
			{col.map((column, i) => (
				<div key={i} className="flex-1 flex flex-col gap-4">
					{column.map((post) => (
						<div
							key={post.id}
							className="relative group cursor-pointer"
							onMouseEnter={() => setHoveredPost(post.id)}
							onMouseLeave={() => setHoveredPost(null)}
							onClick={() => setSelectedPost(post)}>
							<div className="relative rounded-2xl overflow-hidden bg-gray-100">
								<img
									src={post.imageUrl}
									className="w-full object-cover"
								/>

								{/* Hidden audio element */}
								{post.audioUrl && (
									<audio
										data-grid-post-id={post.id}
										ref={(el) => {
											if (el) {
												// Store reference to grid audio element
												// Always set it, but it may be overridden by detail audio
												// When detail closes, it will be restored
												audioRefs.current[post.id] = el;
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
								)}

								{/* Hover overlay */}
								<div
									className={`absolute inset-0 bg-black/60 transition ${
										hoveredPost === post.id
											? "opacity-100"
											: "opacity-0"
									}`}>
									<div className="absolute bottom-0 p-4 text-white">
										<h3 className="font-semibold text-lg">
											{post.title}
										</h3>
										<p className="text-sm opacity-90 line-clamp-2">
											{post.caption}
										</p>
									</div>

									<div className="absolute top-4 right-4 flex gap-2">
										{post.audioUrl && (
											<button
												onClick={(e) =>
													handleAudioToggle(
														e,
														post.id,
														post.audioUrl
													)
												}
												className={`p-2 rounded-full transition-all ${
													playingAudioId === post.id
														? "bg-white shadow-lg"
														: "bg-white/90 hover:bg-white backdrop-blur-sm"
												}`}
												title={
													playingAudioId === post.id
														? "Pause audio"
														: "Play audio"
												}>
												{playingAudioId === post.id ? (
													<Pause className="w-5 h-5 text-gray-900" />
												) : (
													<Play className="w-5 h-5 text-gray-900" />
												)}
											</button>
										)}
										<button
											onClick={(e) => {
												e.stopPropagation();
											}}
											className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors">
											<Bookmark className="w-5 h-5 text-gray-900" />
										</button>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			))}
		</div>
	);
};

export default MasonryGrid;
