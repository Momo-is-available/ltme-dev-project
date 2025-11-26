import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
	User,
	Settings,
	Bookmark,
	Grid,
	Calendar,
	ImageIcon,
	Volume2,
	Play,
	Pause,
} from "lucide-react";
import { supabase } from "../supabaseClient";

export default function Profile() {
	const { username } = useParams();
	const [activeTab, setActiveTab] = useState("posts");
	const [userPosts, setUserPosts] = useState([]);
	const [profileUser, setProfileUser] = useState(null);
	const [currentUser, setCurrentUser] = useState(null);
	const [userStats, setUserStats] = useState({
		totalPosts: 0,
		totalSaves: 0,
		joinedDate: null,
	});
	const [loading, setLoading] = useState(true);
	const [selectedPost, setSelectedPost] = useState(null);
	const [hoveredPost, setHoveredPost] = useState(null);
	const [playingAudioId, setPlayingAudioId] = useState(null);
	const audioRefs = useRef({});

	useEffect(() => {
		loadProfileData();
		getCurrentUser();
	}, [username, loadProfileData, getCurrentUser]);

	const getCurrentUser = useCallback(async () => {
		const {
			data: { user },
		} = await supabase.auth.getUser();
		setCurrentUser(user);
	}, []);

	const loadProfileData = useCallback(async () => {
		try {
			setLoading(true);

			// In a real app, you'd query Supabase users table by username
			// For now, we'll use a placeholder
			const mockProfileUser = {
				id: "user123",
				username: username,
				email: `${username}@example.com`,
				avatar: null,
				created_at: new Date().toISOString(),
			};
			setProfileUser(mockProfileUser);

			// Load posts from Supabase
			const { data: postsData, error: postsError } = await supabase
				.from("posts")
				.select("*")
				.eq("user_email", mockProfileUser.email)
				.order("created_at", { ascending: false });

			if (postsError) {
				console.error("Error loading posts:", postsError);
				setUserPosts([]);
			} else {
				// Transform to match expected format
				const transformedPosts = (postsData || []).map((post) => ({
					id: post.id,
					title: post.title || "",
					caption: post.caption || "",
					imageUrl: post.image_url || "",
					audioUrl: post.audio_url || null,
					audioName: post.audio_name || null,
					timestamp: post.created_at,
					userId: post.user_id,
					userEmail: post.user_email,
				}));
				setUserPosts(transformedPosts);

				setUserStats({
					totalPosts: transformedPosts.length,
					totalSaves: 0,
					joinedDate: mockProfileUser.created_at,
				});
			}

			setLoading(false);
		} catch (error) {
			console.error("Error loading profile:", error);
			setLoading(false);
		}
	}, [username]);

	const handleAudioToggle = (e, postId) => {
		e.stopPropagation();
		const audioElement = audioRefs.current[postId];
		if (!audioElement) return;

		if (playingAudioId === postId) {
			audioElement.pause();
			setPlayingAudioId(null);
		} else {
			if (playingAudioId && audioRefs.current[playingAudioId]) {
				audioRefs.current[playingAudioId].pause();
				audioRefs.current[playingAudioId].currentTime = 0;
			}
			audioElement.play();
			setPlayingAudioId(postId);
		}
	};

	const MasonryGrid = ({ posts }) => {
		const columns = 3;
		const columnPosts = Array.from({ length: columns }, () => []);

		posts.forEach((post, idx) => {
			columnPosts[idx % columns].push(post);
		});

		return (
			<div className="flex gap-4">
				{columnPosts.map((columnItems, columnIdx) => (
					<div key={columnIdx} className="flex-1 flex flex-col gap-4">
						{columnItems.map((post) => (
							<div
								key={post.id}
								className="relative group cursor-pointer"
								onMouseEnter={() => setHoveredPost(post.id)}
								onMouseLeave={() => setHoveredPost(null)}
								onClick={() => setSelectedPost(post)}>
								<div className="relative overflow-hidden rounded-xl bg-gray-100">
									<img
										src={post.imageUrl}
										alt={post.title || "Memory"}
										loading="lazy"
										className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
									/>

									{post.audioUrl && (
										<audio
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
												if (playingAudioId === post.id)
													setPlayingAudioId(null);
											}}
											onPlay={() =>
												setPlayingAudioId(post.id)
											}
											preload="metadata"
										/>
									)}

									<div
										className={`absolute inset-0 bg-black/60 transition-opacity ${
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
													className={`p-2 rounded-full transition-all ${
														playingAudioId ===
														post.id
															? "bg-white shadow-lg"
															: "bg-white/90 hover:bg-white backdrop-blur-sm"
													}`}>
													{playingAudioId ===
													post.id ? (
														<Pause className="w-4 h-4 text-gray-900" />
													) : (
														<Play className="w-4 h-4 text-gray-900" />
													)}
												</button>
											)}
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

	const PostDetailModal = ({ post, onClose }) => {
		if (!post) return null;

		return (
			<div
				className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
				onClick={onClose}>
				<div
					className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
					onClick={(e) => e.stopPropagation()}>
					<div className="grid md:grid-cols-2 h-full max-h-[90vh]">
						<div className="bg-black flex items-center justify-center">
							<img
								src={post.imageUrl}
								alt={post.title}
								className="max-w-full max-h-[90vh] object-contain"
							/>
						</div>

						<div className="flex flex-col overflow-y-auto">
							<div className="p-6 border-b">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
											<User className="w-6 h-6 text-white" />
										</div>
										<div>
											<p className="font-semibold">
												{profileUser?.username}
											</p>
											<p className="text-sm text-gray-500">
												{new Date(
													post.timestamp
												).toLocaleDateString("en-US", {
													month: "short",
													day: "numeric",
													year: "numeric",
												})}
											</p>
										</div>
									</div>
									<button
										type="button"
										aria-label="Close detail"
										onClick={onClose}
										className="p-2 hover:bg-gray-100 rounded-full">
										<span className="text-2xl">×</span>
									</button>
								</div>
							</div>

							<div className="p-6 flex-1">
								{post.title && (
									<h2 className="text-2xl font-bold mb-3">
										{post.title}
									</h2>
								)}
								{post.caption && (
									<p className="text-gray-700 leading-relaxed mb-6">
										{post.caption}
									</p>
								)}
								{post.audioUrl && (
									<div className="p-4 bg-gray-50 rounded-lg">
										<audio
											src={post.audioUrl}
											controls
											className="w-full"
										/>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	};

	// Check if viewing own profile
	const isOwnProfile =
		currentUser && profileUser && currentUser.email === profileUser.email;

	if (!profileUser) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="animate-spin w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full"></div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Profile Header */}
			<div className="bg-white border-b">
				<div className="max-w-6xl mx-auto px-6 py-8">
					<div className="flex items-start gap-8">
						{/* Avatar */}
						<div className="w-32 h-32 bg-gradient-to-br from-gray-800 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
							{profileUser.avatar ? (
								<img
									src={profileUser.avatar}
									alt={profileUser.username}
									className="w-full h-full rounded-full object-cover"
								/>
							) : (
								<User className="w-16 h-16 text-white" />
							)}
						</div>

						{/* Profile Info */}
						<div className="flex-1">
							<div className="flex items-center justify-between mb-4">
								<div>
									<h1 className="text-3xl font-bold text-gray-900">
										{profileUser.username}
									</h1>
									<p className="text-gray-600">
										{profileUser.email}
									</p>
								</div>
								{isOwnProfile && (
									<button
										type="button"
										className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
										<Settings className="w-4 h-4" />
										Edit Profile
									</button>
								)}
							</div>

							{/* Stats */}
							<div className="flex gap-8">
								<div>
									<div className="text-2xl font-bold text-gray-900">
										{userStats.totalPosts}
									</div>
									<div className="text-sm text-gray-600">
										Posts
									</div>
								</div>
								<div>
									<div className="text-2xl font-bold text-gray-900">
										{userStats.totalSaves}
									</div>
									<div className="text-sm text-gray-600">
										Saved
									</div>
								</div>
								{userStats.joinedDate && (
									<div className="flex items-center gap-2 text-gray-600">
										<Calendar className="w-4 h-4" />
										<span className="text-sm">
											Joined{" "}
											{new Date(
												userStats.joinedDate
											).toLocaleDateString("en-US", {
												month: "long",
												year: "numeric",
											})}
										</span>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Tabs */}
			<div className="bg-white border-b sticky top-0 z-10">
				<div className="max-w-6xl mx-auto px-6">
					<div className="flex gap-8">
						<button
							type="button"
							onClick={() => setActiveTab("posts")}
							className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${
								activeTab === "posts"
									? "border-gray-900 text-gray-900"
									: "border-transparent text-gray-600 hover:text-gray-900"
							}`}>
							<Grid className="w-4 h-4" />
							<span className="font-medium">Posts</span>
						</button>
						{isOwnProfile && (
							<button
								type="button"
								onClick={() => setActiveTab("saved")}
								className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${
									activeTab === "saved"
										? "border-gray-900 text-gray-900"
										: "border-transparent text-gray-600 hover:text-gray-900"
								}`}>
								<Bookmark className="w-4 h-4" />
								<span className="font-medium">Saved</span>
							</button>
						)}
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="max-w-6xl mx-auto px-6 py-8">
				{loading ? (
					<div className="text-center py-20">
						<div className="animate-spin w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full mx-auto"></div>
						<p className="text-gray-600 mt-4">Loading...</p>
					</div>
				) : (
					<>
						{activeTab === "posts" && (
							<>
								{userPosts.length === 0 ? (
									<div className="text-center py-20">
										<ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
										<h3 className="text-xl font-semibold text-gray-900 mb-2">
											No posts yet
										</h3>
										<p className="text-gray-600">
											{isOwnProfile
												? "Share your first moment to get started"
												: "This user hasn't posted anything yet"}
										</p>
									</div>
								) : (
									<MasonryGrid posts={userPosts} />
								)}
							</>
						)}

						{activeTab === "saved" && isOwnProfile && (
							<div className="text-center py-20">
								<Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
								<h3 className="text-xl font-semibold text-gray-900 mb-2">
									No saved posts
								</h3>
								<p className="text-gray-600">
									Save posts to view them later
								</p>
							</div>
						)}
					</>
				)}
			</div>

			{/* Post Detail Modal */}
			{selectedPost && (
				<PostDetailModal
					post={selectedPost}
					onClose={() => setSelectedPost(null)}
				/>
			)}
		</div>
	);
}
