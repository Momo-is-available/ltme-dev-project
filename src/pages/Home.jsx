import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Grid } from "lucide-react";
import MasonryGrid from "../components/MasonryGrid";
import { useSavedPosts } from "../hooks/useSavedPosts";

export default function Home({
	posts,
	loading,
	error,
	searchQuery,
	hoveredPost,
	setHoveredPost,
	user,
	handleCreateClick,
	audioRefs,
	playingAudioId,
	setPlayingAudioId,
}) {
	const location = useLocation();
	const { savedPostIds } = useSavedPosts(user?.id);

	// Debug: Log when component renders
	useEffect(() => {
		if (import.meta.env.DEV) {
			console.debug("Home component rendered", {
				postsCount: posts?.length || 0,
				loading,
				hasError: !!error,
				locationKey: location.key,
			});
		}
	}, [posts, loading, error, location.key]);

	const filteredPosts = (posts || []).filter(
		(post) =>
			post?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			post?.caption?.toLowerCase().includes(searchQuery.toLowerCase())
	);

	return (
		<main className="max-w-screen-2xl mx-auto px-6 pt-24 pb-12">
			{error && (
				<div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 rounded-lg mb-6">
					<p className="font-semibold mb-2">⚠️ Setup Required</p>
					<p className="text-sm">{error}</p>
					<p className="text-sm mt-2">
						Check the browser console for more details.
					</p>
				</div>
			)}

			{loading ? (
				<div className="text-center py-32">
					<Grid className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-pulse" />
					<p className="text-gray-500">Loading...</p>
				</div>
			) : !posts || posts.length === 0 ? (
				<div className="text-center py-32">
					<Grid className="w-16 h-16 text-gray-300 mx-auto mb-4" />
					<h2 className="text-3xl font-bold text-gray-900 mb-2">
						Welcome to LTME
					</h2>
					<p className="text-gray-500 mb-8 text-lg">
						Discover and share meaningful moments
					</p>
					<button
						type="button"
						onClick={handleCreateClick}
						className="px-8 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors">
						{user ? "Create Your First Moment" : "Sign In to Share"}
					</button>
				</div>
			) : filteredPosts.length > 0 ? (
				<MasonryGrid
					posts={filteredPosts}
					hoveredPost={hoveredPost}
					setHoveredPost={setHoveredPost}
					user={user}
					audioRefs={audioRefs}
					playingAudioId={playingAudioId}
					setPlayingAudioId={setPlayingAudioId}
					savedPostIds={savedPostIds || []}
				/>
			) : (
				<div className="text-center py-32">
					<Grid className="w-16 h-16 text-gray-300 mx-auto mb-4" />
					<h2 className="text-3xl font-bold text-gray-900 mb-2">
						No posts found
					</h2>
					<p className="text-gray-500 mb-8 text-lg">
						Try adjusting your search query
					</p>
				</div>
			)}
		</main>
	);
}
