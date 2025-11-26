import React, { useState } from "react";
import { Upload, X, Volume2 } from "lucide-react";
import { supabase } from "../supabaseClient";

const UploadModal = ({ user, setShowUpload }) => {
	const [preview, setPreview] = useState(null);
	const [imageFile, setImageFile] = useState(null);
	const [audioFile, setAudioFile] = useState(null);
	const [audioName, setAudioName] = useState("");
	const [title, setTitle] = useState("");
	const [caption, setCaption] = useState("");
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState("");

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

	const handleClose = () => {
		// Reset form
		setPreview(null);
		setImageFile(null);
		setAudioFile(null);
		setAudioName("");
		setTitle("");
		setCaption("");
		setError("");
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
			console.log("Starting upload...", {
				userId: user.id,
				imageName: imageFile.name,
				imageSize: imageFile.size,
			});

			// Upload image to Supabase Storage
			const imagePath = `photos/${user.id}/${Date.now()}_${
				imageFile.name
			}`;
			console.log("Uploading image to:", imagePath);

			const { data: imageData, error: imageError } =
				await supabase.storage
					.from("photos")
					.upload(imagePath, imageFile, {
						cacheControl: "3600",
						upsert: false,
					});

			if (imageError) {
				throw imageError;
			}

			console.log("Image upload complete, getting download URL...");

			// Get public URL for the image
			const { data: imageUrlData } = supabase.storage
				.from("photos")
				.getPublicUrl(imagePath);

			const imageUrl = imageUrlData.publicUrl;
			console.log("Image URL obtained:", imageUrl);

			// Upload audio (optional)
			let audioUrl = null;
			if (audioFile) {
				console.log("Uploading audio...");
				const audioPath = `audio/${user.id}/${Date.now()}_${
					audioFile.name
				}`;

				const { data: audioData, error: audioError } =
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
				console.log("Audio upload complete");
			}

			// Save metadata to Supabase database
			console.log("Saving post to database...");
			const { data: postData, error: dbError } = await supabase
				.from("posts")
				.insert({
					title: title || "Untitled",
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

			console.log("Post saved successfully!");

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
					<button
						onClick={handleClose}
						disabled={uploading}
						className="hover:bg-gray-100 rounded-full p-2 transition-colors disabled:opacity-50">
						<X className="w-6 h-6" />
					</button>
				</div>

				<div className="grid md:grid-cols-2 p-6 gap-6">
					{/* Left: Image Upload & Preview */}
					<div className="space-y-4">
						<label className="block font-medium text-gray-900">
							Photo *
						</label>
						<input
							type="file"
							accept="image/*"
							className="hidden"
							id="img-upload"
							onChange={handleImage}
							disabled={uploading}
						/>
						<label
							htmlFor="img-upload"
							className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
								preview
									? "border-gray-300"
									: "border-gray-300 hover:border-gray-400"
							} ${
								uploading ? "opacity-50 cursor-not-allowed" : ""
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

						{/* Audio Upload */}
						<div>
							<label className="block font-medium text-gray-900 mb-2">
								Audio (Optional)
							</label>
							<input
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
									{audioName || "Add audio"}
								</span>
							</label>
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
