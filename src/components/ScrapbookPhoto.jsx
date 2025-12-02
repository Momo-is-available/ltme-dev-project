import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ScrapbookPhoto({ photo, index }) {
	const navigate = useNavigate();
	const [isHovered, setIsHovered] = useState(false);

	// More varied rotations for scrapbook effect (-5 to 5 degrees)
	const rotation = ((index % 5) - 2) * 2.5; // -5, -2.5, 0, 2.5, 5 degrees
	const rotationStyle = {
		transform: `rotate(${rotation}deg) ${isHovered ? "scale(1.05)" : "scale(1)"}`,
		transition: "transform 0.3s ease",
	};

	const handleClick = () => {
		navigate(`/post/${photo.id}`);
	};

	// Varied tape positions
	const tapePositions = [
		{ top: "-top-2", left: "-left-2" },
		{ top: "-top-2", right: "-right-2" },
		{ bottom: "-bottom-2", left: "-left-2" },
		{ bottom: "-bottom-2", right: "-right-2" },
	];
	const tapePos = tapePositions[index % 4];

	return (
		<div
			className="relative cursor-pointer group"
			style={rotationStyle}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onClick={handleClick}>
			{/* Photo with shadow and border */}
			<div
				className={`bg-white p-3 shadow-xl rounded-sm transition-all duration-300 border-2 border-gray-100 ${
					isHovered ? "shadow-2xl border-gray-200" : ""
				}`}>
				<img
					src={photo.image_url || photo.imageUrl}
					alt={photo.title || "Photo"}
					className="w-full h-auto object-cover rounded-sm"
					loading="lazy"
				/>

				{/* Photo caption/title */}
				{(photo.title || photo.caption) && (
					<div className="mt-2 px-2">
						{photo.title && (
							<p className="text-xs font-handwriting text-gray-700 font-semibold">
								{photo.title}
							</p>
						)}
						{photo.caption && (
							<p className="text-xs font-handwriting text-gray-600 mt-1 line-clamp-2">
								{photo.caption}
							</p>
						)}
					</div>
				)}
			</div>

			{/* Photo corner tape effect - varied positions */}
			{index % 3 !== 0 && (
				<div
					className={`absolute ${tapePos.top || ""} ${tapePos.bottom || ""} ${tapePos.left || ""} ${tapePos.right || ""} w-10 h-10 bg-yellow-200/70 opacity-80 rotate-45 rounded-sm shadow-sm`}
					style={{
						clipPath: "polygon(0 0, 100% 0, 100% 70%, 70% 100%, 0 100%)",
					}}></div>
			)}
		</div>
	);
}
