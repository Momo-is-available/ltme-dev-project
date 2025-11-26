import React from "react";
import MasonryGrid from "../components/MasonryGrid";
import { Grid } from "lucide-react";

const Gallery = ({ posts, onCreate, onSelect }) => {
	return (
		<main className="max-w-screen-2xl mx-auto px-6 pt-24 pb-12">
			{posts.length === 0 ? (
				<div className="text-center py-32">
					<Grid className="w-16 h-16 text-gray-300 mx-auto mb-4" />
					<h2 className="text-3xl font-bold">No moments yet</h2>
					<button
						onClick={onCreate}
						className="px-8 py-3 bg-gray-900 text-white rounded-full mt-8">
						Create Your First Moment
					</button>
				</div>
			) : (
				<MasonryGrid posts={posts} onSelect={onSelect} />
			)}
		</main>
	);
};

export default Gallery;
