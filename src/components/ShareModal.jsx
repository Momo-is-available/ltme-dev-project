import { useState } from "react";
import { X, Facebook, Copy, Check, Share2, Link2 } from "lucide-react";
import Tooltip from "./Tooltip";

export default function ShareModal({ isOpen, onClose, post, url }) {
	const [copied, setCopied] = useState(false);

	if (!isOpen) return null;

	const shareUrl = url || window.location.href;
	const shareTitle = post?.title || "Check out this moment";
	const shareText = post?.caption || "";

	const handleCopyLink = async () => {
		try {
			await navigator.clipboard.writeText(shareUrl);
			setCopied(true);
			setTimeout(() => {
				setCopied(false);
			}, 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
			// Fallback for older browsers
			const textArea = document.createElement("textarea");
			textArea.value = shareUrl;
			document.body.appendChild(textArea);
			textArea.select();
			try {
				document.execCommand("copy");
				setCopied(true);
				setTimeout(() => {
					setCopied(false);
				}, 2000);
			} catch (fallbackErr) {
				console.error("Fallback copy failed:", fallbackErr);
			}
			document.body.removeChild(textArea);
		}
	};

	const handleNativeShare = async () => {
		if (navigator.share) {
			try {
				await navigator.share({
					title: shareTitle,
					text: shareText,
					url: shareUrl,
				});
				onClose();
			} catch (err) {
				// User cancelled or error occurred
				if (err.name !== "AbortError") {
					console.error("Share failed:", err);
				}
			}
		}
	};

	const handleSocialShare = (platform) => {
		let shareUrl_platform = "";

		switch (platform) {
			case "twitter":
				shareUrl_platform = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
					shareUrl
				)}&text=${encodeURIComponent(shareTitle)}`;
				break;
			case "facebook":
				shareUrl_platform = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
					shareUrl
				)}`;
				break;
			case "whatsapp":
				const whatsappText = `${shareTitle}${
					shareText ? ` - ${shareText}` : ""
				} ${shareUrl}`;
				shareUrl_platform = `https://wa.me/?text=${encodeURIComponent(
					whatsappText
				)}`;
				break;
			case "pinterest":
				const pinterestText = `${shareTitle}${
					shareText ? ` - ${shareText}` : ""
				}`;
				shareUrl_platform = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(
					shareUrl
				)}&description=${encodeURIComponent(
					pinterestText
				)}&media=${encodeURIComponent(post?.imageUrl || "")}`;
				break;
			default:
				return;
		}

		window.open(shareUrl_platform, "_blank", "width=600,height=400");
	};

	return (
		<div
			className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
			onClick={onClose}>
			<div
				className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-xl overflow-hidden"
				onClick={(e) => e.stopPropagation()}>
				{/* Header */}
				<div className="flex items-center justify-between p-5 border-b border-gray-200">
					<h2 className="text-xl font-bold text-gray-900">Share</h2>
					<Tooltip text="Close share modal">
						<button
							type="button"
							onClick={onClose}
							aria-label="Close share modal"
							className="p-2 hover:bg-gray-100 rounded-full transition-colors">
							<X className="w-5 h-5 text-gray-600" />
						</button>
					</Tooltip>
				</div>

				{/* Post Preview Image */}
				{post?.imageUrl && (
					<div className="w-full aspect-video bg-gray-100 overflow-hidden relative">
						<img
							src={post.imageUrl}
							alt={post.title || "Share preview"}
							className="w-full h-full object-cover"
							loading="lazy"
						/>
					</div>
				)}

				{/* Content */}
				<div className="p-6">
					{/* Social Media Icons - Horizontal Row */}
					<div className="flex items-center justify-center gap-3 mb-4">
						<Tooltip text="Share on X (Twitter)">
							<button
								type="button"
								onClick={() => handleSocialShare("twitter")}
								className="w-12 h-12 rounded-full border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 hover:scale-110 transition-all duration-200 flex items-center justify-center group">
								<svg
									className="w-6 h-6 text-gray-900 group-hover:scale-110 transition-transform"
									fill="currentColor"
									viewBox="0 0 24 24"
									xmlns="http://www.w3.org/2000/svg">
									<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
								</svg>
							</button>
						</Tooltip>

						<Tooltip text="Share on Facebook">
							<button
								type="button"
								onClick={() => handleSocialShare("facebook")}
								className="w-12 h-12 rounded-full border-2 border-gray-200 bg-[#1877F2] hover:bg-[#166FE5] hover:border-[#166FE5] hover:scale-110 transition-all duration-200 flex items-center justify-center group">
								<Facebook className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
							</button>
						</Tooltip>

						<Tooltip text="Share on WhatsApp">
							<button
								type="button"
								onClick={() => handleSocialShare("whatsapp")}
								className="w-12 h-12 rounded-full border-2 border-gray-200 bg-[#25D366] hover:bg-[#20BA5A] hover:border-[#20BA5A] hover:scale-110 transition-all duration-200 flex items-center justify-center group">
								<svg
									className="w-6 h-6 text-white group-hover:scale-110 transition-transform"
									fill="currentColor"
									viewBox="0 0 24 24"
									xmlns="http://www.w3.org/2000/svg">
									<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
								</svg>
							</button>
						</Tooltip>

						<Tooltip text="Share on Pinterest">
							<button
								type="button"
								onClick={() => handleSocialShare("pinterest")}
								className="w-12 h-12 rounded-full border-2 border-gray-200 bg-[#BD081C] hover:bg-[#A00716] hover:border-[#A00716] hover:scale-110 transition-all duration-200 flex items-center justify-center group">
								<svg
									className="w-6 h-6 text-white group-hover:scale-110 transition-transform"
									viewBox="0 0 24 24"
									fill="none"
									xmlns="http://www.w3.org/2000/svg">
									<path
										d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.617 11.174-.105-.949-.2-2.403.042-3.441.219-.937 1.407-5.965 1.407-5.965s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.001 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"
										fill="white"
									/>
								</svg>
							</button>
						</Tooltip>
					</div>

					{/* Copy Link and Share Via Buttons - Centered */}
					<div className="flex flex-col items-center gap-3">
						{/* Copy Link Button */}
						<Tooltip
							text={
								copied
									? "Link copied to clipboard!"
									: "Copy post link to clipboard"
							}>
							<button
								type="button"
								onClick={handleCopyLink}
								className="w-full flex items-center justify-center gap-3 p-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-all duration-200 hover:border-gray-300 hover:shadow-sm">
								<div className="flex-shrink-0">
									{copied ? (
										<Check className="w-5 h-5 text-green-600" />
									) : (
										<Link2 className="w-5 h-5 text-gray-700" />
									)}
								</div>
								<span className="text-sm font-medium text-gray-900 text-center">
									{copied ? "Link copied!" : "Copy link"}
								</span>
							</button>
						</Tooltip>

						{/* Native Share (if available) */}
						{navigator.share && (
							<Tooltip text="Share using your device's native share options">
								<button
									type="button"
									onClick={handleNativeShare}
									className="w-full flex items-center justify-center gap-2 p-2.5 bg-gray-900 text-white hover:bg-gray-800 rounded-lg transition-colors">
									<Share2 className="w-4 h-4" />
									<span className="font-medium text-sm">
										Share via...
									</span>
								</button>
							</Tooltip>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
