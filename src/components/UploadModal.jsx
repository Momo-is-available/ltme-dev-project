import { useState, useRef } from "react";
import { Upload, X, Volume2 } from "lucide-react";
import { supabase } from "../supabaseClient";
import Tooltip from "./Tooltip";

const UploadModal = ({ user, setShowUpload, onUploadSuccess }) => {
	const [preview, setPreview] = useState(null);
	const [imageFile, setImageFile] = useState(null);
	const [audioFile, setAudioFile] = useState(null);
	const [audioName, setAudioName] = useState("");
	const [title, setTitle] = useState("");
	const [caption, setCaption] = useState("");
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState("");
	const audioInputRef = useRef(null);
	const imageInputRef = useRef(null);

	const handleImage = (e) => {
		const f = e.target.files[0];
		if (!f) return;
		setImageFile(f);
		const reader = new FileReader();
		reader.onloadend = () => setPreview(reader.result);
		reader.readAsDataURL(f);
	};

	const handleAudio = (e) => {
		const f = e.target.files[0];
		if (!f) return;
		setAudioFile(f);
		setAudioName(f.name);
	};

	const handleRemoveAudio = () => {
		setAudioFile(null);
		setAudioName("");
		// Reset the file input
		if (audioInputRef.current) {
			audioInputRef.current.value = "";
		}
	};

	const handleRemoveImage = () => {
		setPreview(null);
		setImageFile(null);
		// Reset the file input
		if (imageInputRef.current) {
			imageInputRef.current.value = "";
		}
	};

	const handleClose = () => {
		// Reset form
		setPreview(null);
		setImageFile(null);
		setAudioFile(null);
		setAudioName("");
		setTitle("");
		setCaption("");
		setError("");
		// Reset file inputs
		if (imageInputRef.current) {
			imageInputRef.current.value = "";
		}
		if (audioInputRef.current) {
			audioInputRef.current.value = "";
		}
		setShowUpload(false);
	};

	const handleUpload = async () => {
		if (!imageFile) {
			setError("Please select an image");
			return;
		}

		if (!user || !user.id) {
			setError("You must be signed in to upload");
			return;
		}

		setUploading(true);
		setError("");

		try {
			if (import.meta.env.DEV) {
				console.debug("Starting upload...", {
					userId: user.id,
					imageName: imageFile.name,
					imageSize: imageFile.size,
				});
			}

			// Upload image to Supabase Storage
			const imagePath = `photos/${user.id}/${Date.now()}_${
				imageFile.name
			}`;
			if (import.meta.env.DEV)
				console.debug("Uploading image to:", imagePath);

			const { data: _imageData, error: imageError } =
				await supabase.storage
					.from("photos")
					.upload(imagePath, imageFile, {
						cacheControl: "3600",
						upsert: false,
					});

			if (imageError) {
				throw imageError;
			}

			if (import.meta.env.DEV)
				console.debug("Image upload complete, getting download URL...");

			// Get public URL for the image
			const { data: imageUrlData } = supabase.storage
				.from("photos")
				.getPublicUrl(imagePath);

			const imageUrl = imageUrlData.publicUrl;
			if (import.meta.env.DEV)
				console.debug("Image URL obtained:", imageUrl);

			// Upload audio (optional)
			let audioUrl = null;
			if (audioFile) {
				if (import.meta.env.DEV) console.debug("Uploading audio...");
				const audioPath = `audio/${user.id}/${Date.now()}_${
					audioFile.name
				}`;

				const { data: _audioData, error: audioError } =
					await supabase.storage
						.from("audio")
						.upload(audioPath, audioFile, {
							cacheControl: "3600",
							upsert: false,
						});

				if (audioError) {
					throw audioError;
				}

				const { data: audioUrlData } = supabase.storage
					.from("audio")
					.getPublicUrl(audioPath);

				audioUrl = audioUrlData.publicUrl;
				if (import.meta.env.DEV) console.debug("Audio upload complete");
			}

			// Save metadata to Supabase database
			if (import.meta.env.DEV)
				console.debug("Saving post to database...");
			const { data: _postData, error: dbError } = await supabase
				.from("posts")
				.insert({
					title: title || "",
					caption,
					image_url: imageUrl,
					audio_url: audioUrl,
					audio_name: audioName || null,
					user_id: user.id,
					user_email: user.email,
				})
				.select()
				.single();

			if (dbError) {
				throw dbError;
			}

			if (import.meta.env.DEV) console.debug("Post saved successfully!");

			// Refresh posts list if callback provided
			// Call immediately - real-time subscription should handle it, but this ensures it
			if (onUploadSuccess) {
				if (import.meta.env.DEV) {
					console.debug("Calling onUploadSuccess to refresh posts");
				}
				// Use a small delay to ensure the database transaction is fully committed
				setTimeout(() => {
					onUploadSuccess();
				}, 300);
			}

			handleClose();
		} catch (err) {
			console.error("Upload error details:", {
				message: err.message,
				stack: err.stack,
			});

			let errorMessage = "Failed to upload. Please try again.";

			if (
				err.message?.includes("unauthorized") ||
				err.message?.includes("permission")
			) {
				errorMessage =
					"Permission denied. Please check your Supabase storage policies.";
			} else if (err.message?.includes("timeout")) {
				errorMessage = err.message;
			} else if (err.message) {
				errorMessage = err.message;
			}

			setError(errorMessage);
		} finally {
			setUploading(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
			<div className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto">
				<div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
					<h2 className="text-2xl font-semibold">
						Create New Moment
					</h2>
					<Tooltip text="Close upload dialog">
						<button
							type="button"
							aria-label="Close upload dialog"
							onClick={handleClose}
							disabled={uploading}
							className="hover:bg-gray-100 rounded-full p-2 transition-colors disabled:opacity-50">
							<X className="w-6 h-6" />
						</button>
					</Tooltip>
				</div>

				<div className="grid md:grid-cols-2 p-4 md:p-6 gap-4 md:gap-6">
					{/* Left: Image Upload & Preview */}
					<div className="space-y-4">
						<label className="block font-medium text-gray-900">
							Photo *
						</label>
						<input
							ref={imageInputRef}
							type="file"
							accept="image/*"
							className="hidden"
							id="img-upload"
							onChange={handleImage}
							disabled={uploading}
						/>
						<div className="relative">
							<label
								htmlFor="img-upload"
								className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
									preview
										? "border-gray-300"
										: "border-gray-300 hover:border-gray-400"
								} ${
									uploading
										? "opacity-50 cursor-not-allowed"
										: ""
								}`}>
								{preview ? (
									<img
										src={preview}
										alt="Preview"
										className="w-full h-full object-cover rounded-lg"
									/>
								) : (
									<>
										<Upload className="w-12 h-12 text-gray-400 mb-2" />
										<p className="text-sm text-gray-600">
											Click to upload image
										</p>
									</>
								)}
							</label>
							{preview && !uploading && (
								<Tooltip text="Remove image">
									<button
										type="button"
										onClick={handleRemoveImage}
										aria-label="Remove image"
										className="absolute top-2 right-2 p-2 bg-black/70 hover:bg-black/90 rounded-full transition-colors">
										<X className="w-4 h-4 text-white" />
									</button>
								</Tooltip>
							)}
						</div>

						{/* Audio Upload */}
						<div>
							<label className="block font-medium text-gray-900 mb-2">
								Audio (Optional)
							</label>
							{audioFile ? (
								<div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
									<Volume2 className="w-5 h-5 text-gray-600 flex-shrink-0" />
									<span className="text-sm text-gray-700 flex-1 truncate">
										{audioName}
									</span>
									<Tooltip text="Remove audio file">
										<button
											type="button"
											onClick={handleRemoveAudio}
											disabled={uploading}
											aria-label="Remove audio"
											className="p-1 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
											<X className="w-4 h-4 text-gray-600" />
										</button>
									</Tooltip>
								</div>
							) : (
								<>
									<input
										ref={audioInputRef}
										type="file"
										accept="audio/*"
										className="hidden"
										id="audio-upload"
										onChange={handleAudio}
										disabled={uploading}
									/>
									<label
										htmlFor="audio-upload"
										className={`flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
											uploading
												? "opacity-50 cursor-not-allowed"
												: ""
										}`}>
										<Volume2 className="w-5 h-5 text-gray-600" />
										<span className="text-sm text-gray-700">
											Add audio
										</span>
									</label>
								</>
							)}
						</div>
					</div>

					{/* Right: Form Fields */}
					<div className="space-y-4">
						<div>
							<label className="block font-medium text-gray-900 mb-2">
								Title
							</label>
							<input
								type="text"
								placeholder="Give your moment a title..."
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
								disabled={uploading}
							/>
						</div>

						<div>
							<label className="block font-medium text-gray-900 mb-2">
								Caption
							</label>
							<textarea
								placeholder="Share the story behind this moment..."
								value={caption}
								onChange={(e) => setCaption(e.target.value)}
								rows={6}
								className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
								disabled={uploading}
							/>
						</div>

						{error && (
							<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
								{error}
							</div>
						)}

						<button
							onClick={handleUpload}
							type="button"
							disabled={uploading || !imageFile}
							className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
							{uploading ? "Uploading..." : "Share Moment"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default UploadModal;
