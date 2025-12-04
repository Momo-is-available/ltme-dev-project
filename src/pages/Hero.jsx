import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Hero() {
	const navigate = useNavigate();
	const [heroPosts, setHeroPosts] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadHeroPosts();
	}, []);

	const loadHeroPosts = async () => {
		try {
			// Fetch all posts
			const { data: allPosts, error } = await supabase
				.from("posts")
				.select("id, image_url, title, caption")
				.order("created_at", { ascending: false })
				.limit(100); // Get more posts to randomize from

			if (error) throw error;

			// Randomize and take 17 posts (we'll use 13 for display)
			const shuffled = [...(allPosts || [])].sort(
				() => 0.5 - Math.random()
			);
			const selected = shuffled.slice(0, 17);

			setHeroPosts(selected);
			setLoading(false);
		} catch (err) {
			console.error("Error loading hero posts:", err);
			setLoading(false);
		}
	};

	// Exact photo positions from Figma CSS
	// Positions are absolute in pixels relative to the container
	const photoConfigs = [
		{
			left: 684.51,
			top: 85.43,
			width: 195,
			height: 193,
			rotate: -4,
			borderRadius: 0,
		},
		{
			left: 928.72,
			top: 204.05,
			width: 238,
			height: 399,
			rotate: 3,
			borderRadius: 5,
		},
		{
			left: 741.17,
			top: 622.36,
			width: 139,
			height: 172,
			rotate: -4,
			borderRadius: 0,
		},
		{
			left: 892,
			top: 781,
			width: 139,
			height: 172,
			rotate: 2,
			borderRadius: 6,
		},
		{
			left: 1087.83,
			top: 653.13,
			width: 235,
			height: 271,
			rotate: 4,
			borderRadius: 0,
		},
		{
			left: 1220.99,
			top: 104.66,
			width: 172,
			height: 234,
			rotate: -3,
			borderRadius: 0,
		},
		{
			left: 1233.55,
			top: 402.17,
			width: 151,
			height: 174,
			rotate: 3,
			borderRadius: 5,
		},
		{
			left: 692.99,
			top: 310.73,
			width: 99,
			height: 147,
			rotate: -4,
			borderRadius: 0,
		},
		{
			left: 784.53,
			top: 462.74,
			width: 90,
			height: 135,
			rotate: 3,
			borderRadius: 0,
		},
		{
			left: 848.33,
			top: 352.38,
			width: 54,
			height: 73,
			rotate: -6,
			borderRadius: 5,
		},
		{
			left: 921,
			top: 95,
			width: 54,
			height: 73,
			rotate: 0,
			borderRadius: 5,
		},
		{
			left: 811.75,
			top: 829.98,
			width: 54,
			height: 73,
			rotate: -7,
			borderRadius: 5,
		},
		{
			left: 1329.75,
			top: 830.98,
			width: 54,
			height: 73,
			rotate: 7,
			borderRadius: 5,
		},
		{
			left: 1341.33,
			top: 627.38,
			width: 54,
			height: 73,
			rotate: 6,
			borderRadius: 10,
		},
		{
			left: 903,
			top: 642,
			width: 54,
			height: 73,
			rotate: 0,
			borderRadius: 0,
		},
		{
			left: 1112.74,
			top: 108.08,
			width: 54,
			height: 73,
			rotate: 2,
			borderRadius: 5,
		},
		{
			left: 979,
			top: 636,
			width: 109,
			height: 141,
			rotate: 3,
			borderRadius: 5,
		},
	];

	const handleExploreClick = () => {
		navigate("/explore");
	};

	if (loading) {
		return (
			<div
				className="min-h-screen flex items-center justify-center"
				style={{ backgroundColor: "#22332E" }}>
				<div className="text-center">
					<div className="animate-spin w-12 h-12 border-4 border-[#f5f1e8] border-t-transparent rounded-full mx-auto mb-4"></div>
					<p className="text-[#f5f1e8] font-body-overlock text-lg">
						Loading...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div
			className="relative w-full min-h-screen overflow-hidden"
			style={{ backgroundColor: "#22332E" }}>
			{/* Hero Page Container - Responsive scaling from desktop layout */}
			<div
				className="relative mx-auto w-full"
				style={{
					maxWidth: "1440px",
					width: "100%",
					height: "clamp(600px, 62.5vw, 900px)",
					minHeight: "clamp(600px, 62.5vw, 900px)",
					position: "relative",
				}}>
				{/* Left Column - Text Content - Responsive */}
				<div
					className="absolute flex flex-col items-start z-10"
					style={{
						width: "clamp(280px, 38.89vw, 560px)",
						height: "clamp(204px, 45.44vh, 409px)",
						left: "clamp(16px, 4.44vw, 64px)",
						top: "clamp(177px, 39.44vh, 355px)",
						gap: "clamp(16px, 2.22vw, 32px)",
					}}>
					{/* Content */}
					<div
						className="flex flex-col items-start w-full"
						style={{
							gap: "clamp(12px, 1.67vw, 24px)",
						}}>
						{/* H1 */}
						<h1
							className="font-heading-cerotta w-full"
							style={{
								color: "#FFFFFF",
								fontSize: "clamp(28px, 3.89vw, 56px)",
								lineHeight: "120%",
								fontWeight: 400,
								fontStyle: "normal",
							}}>
							CAPTURING MOMENTS, SHARING STORIES
						</h1>

						{/* Paragraph */}
						<p
							className="font-body-overlock w-full"
							style={{
								color: "#FFFFFF",
								fontSize: "clamp(14px, 1.25vw, 18px)",
								lineHeight: "150%",
								fontWeight: 400,
								fontStyle: "normal",
							}}>
							Welcome to my LTME, where every image tells a story.
							Join the creative journey and showcase your
							photographs in an organized and beautiful way.
						</p>
					</div>

					{/* Actions */}
					<div
						className="flex flex-row items-start"
						style={{
							padding: "clamp(5px, 0.69vw, 10px) 0px",
							gap: "clamp(8px, 1.11vw, 16px)",
						}}>
						{/* Button */}
						<button
							type="button"
							onClick={handleExploreClick}
							className="font-body-overlock flex flex-row justify-center items-center transition-opacity hover:opacity-90 whitespace-nowrap"
							style={{
								minWidth: "clamp(51px, 7.08vw, 102px)",
								height: "clamp(25px, 3.54vh, 51px)",
								padding:
									"clamp(6px, 0.83vw, 12px) clamp(12px, 1.67vw, 24px)",
								gap: "clamp(4px, 0.56vw, 8px)",
								backgroundColor: "#FFEDAD",
								border: "1px solid #FFFFFF",
								borderRadius: "10px",
								color: "#000000",
								fontSize: "clamp(14px, 1.25vw, 18px)",
								lineHeight: "150%",
								fontWeight: 400,
								fontStyle: "normal",
							}}>
							Explore
						</button>
					</div>
				</div>

				{/* Right Column - Scrapbook Photo Collage - Responsive */}
				{/* Pictures container scaled proportionally */}
				<div
					className="absolute"
					style={{
						width: "clamp(360px, 50vw, 720.5px)",
						height: "clamp(436px, 96.92vh, 872.31px)",
						left: "clamp(342px, 47.54vw, 684.51px)",
						top: "clamp(42px, 9.49vh, 85.43px)",
					}}>
					{heroPosts.slice(0, 17).map((post, index) => {
						if (index >= photoConfigs.length) return null;
						const config = photoConfigs[index];

						// Calculate relative positions (0-1 scale) for responsive scaling
						const containerWidth = 720.5;
						const containerHeight = 872.31;
						const containerLeft = 684.51;
						const containerTop = 85.43;

						const relLeft =
							(config.left - containerLeft) / containerWidth;
						const relTop =
							(config.top - containerTop) / containerHeight;

						// Calculate aspect ratio to maintain proportions
						const aspectRatio = config.width / config.height;

						// Use width as base and let aspectRatio CSS property handle height
						// Scale based on container width to maintain aspect ratio
						// Reduce size by 8% to create more spacing between photos
						const relWidth = (config.width / containerWidth) * 0.92;

						return (
							<div
								key={post.id}
								className="absolute cursor-pointer group"
								style={{
									left: `${relLeft * 100}%`,
									top: `${relTop * 100}%`,
									width: `${relWidth * 100}%`,
									aspectRatio: `${config.width} / ${config.height}`,
									transform: `rotate(${config.rotate}deg)`,
									transition: "transform 0.3s ease",
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.transform = `rotate(${config.rotate}deg) scale(1.05)`;
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.transform = `rotate(${config.rotate}deg) scale(1)`;
								}}
								onClick={() => navigate(`/post/${post.id}`)}>
								{/* Photo with white frame */}
								<div
									className="bg-white h-full w-full shadow-2xl relative"
									style={{
										padding: "clamp(1.5px, 0.42vw, 12px)",
										borderRadius: config.borderRadius
											? `clamp(${
													config.borderRadius * 0.5
											  }px, ${
													config.borderRadius * 0.35
											  }vw, ${config.borderRadius}px)`
											: "0px",
										boxShadow:
											"0 10px 30px rgba(0, 0, 0, 0.3), 0 5px 10px rgba(0, 0, 0, 0.2)",
									}}>
									{/* Image container */}
									<div
										className="w-full h-full overflow-hidden"
										style={{
											borderRadius: config.borderRadius
												? `clamp(${
														config.borderRadius *
														0.5
												  }px, ${
														config.borderRadius *
														0.35
												  }vw, ${
														config.borderRadius
												  }px)`
												: "0px",
										}}>
										<img
											src={post.image_url}
											alt={post.title || "Photo"}
											className="w-full h-full"
											style={{
												objectFit: "cover",
												display: "block",
											}}
											loading="lazy"
										/>
									</div>
									{/* Tape effect - add to some photos */}
									{index % 3 !== 0 && (
										<div
											className="absolute opacity-80 rotate-45 rounded-sm shadow-sm"
											style={{
												backgroundColor: "#E8DCC0",
												width: "clamp(5px, 1.39vw, 10px)",
												height: "clamp(5px, 1.39vw, 10px)",
												top: "clamp(-3px, -0.28vw, -2px)",
												left: "clamp(-3px, -0.28vw, -2px)",
												clipPath:
													"polygon(0 0, 100% 0, 100% 70%, 70% 100%, 0 100%)",
											}}></div>
									)}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
