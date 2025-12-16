import { useState, useRef, useEffect } from "react";
import { X, Upload, User, Loader2 } from "lucide-react";
import { apiClient } from "../apiClient";

export default function EditProfileModal({
	isOpen,
	onClose,
	currentUser,
	profileData,
	onUpdate,
}) {
	const [username, setUsername] = useState(profileData?.username || "");
	const [bio, setBio] = useState(profileData?.bio || "");
	const [avatarPreview, setAvatarPreview] = useState(
		profileData?.avatar_url || null
	);
	const [avatarFile, setAvatarFile] = useState(null);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState("");
	const fileInputRef = useRef(null);

	// Sync state when modal opens or profileData changes
	useEffect(() => {
		if (isOpen) {
			setUsername(profileData?.username || "");
			setBio(profileData?.bio || "");
			setAvatarPreview(profileData?.avatar_url || null);
			setAvatarFile(null);
			setError("");
		}
	}, [isOpen, profileData]);

	if (!isOpen) return null;

	const handleAvatarSelect = (e) => {
		const file = e.target.files[0];
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith("image/")) {
			setError("Please select an image file");
			return;
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			setError("Image size must be less than 5MB");
			return;
		}

		setError("");
		setAvatarFile(file);

		// Create preview
		const reader = new FileReader();
		reader.onloadend = () => {
			setAvatarPreview(reader.result);
		};
		reader.readAsDataURL(file);
	};

	const validateUsername = (username) => {
		const trimmed = username.trim().toLowerCase();

		// Check length
		if (trimmed.length < 3) {
			return "Username must be at least 3 characters";
		}
		if (trimmed.length > 30) {
			return "Username must be less than 30 characters";
		}

		// Check format (alphanumeric, underscores, hyphens only)
		if (!/^[a-z0-9_-]+$/.test(trimmed)) {
			return "Username can only contain letters, numbers, underscores, and hyphens";
		}

		// Check if starts with letter or number
		if (!/^[a-z0-9]/.test(trimmed)) {
			return "Username must start with a letter or number";
		}

		return null;
	};

	const handleSave = async () => {
		if (!currentUser?.id) {
			setError("You must be signed in to update your profile");
			return;
		}

		const trimmedUsername = username.trim().toLowerCase();

		// Validate username if it changed
		if (trimmedUsername !== (profileData?.username || "").toLowerCase()) {
			const usernameError = validateUsername(trimmedUsername);
			if (usernameError) {
				setError(usernameError);
				return;
			}
		}

		setUploading(true);
		setError("");

		try {
			let avatarUrl = profileData?.avatar_url || null;

			// Upload new avatar if selected
			if (avatarFile) {
				if (import.meta.env.DEV) {
					console.debug("Uploading avatar...", {
						userId: currentUser.id,
						fileName: avatarFile.name,
						fileSize: avatarFile.size,
					});
				}

				// Delete old avatar if it exists
				if (profileData?.avatar_url) {
					try {
						// Extract path from URL
						const oldPath = profileData.avatar_url
							.split("/storage/v1/object/public/avatars/")
							.pop();
						if (oldPath) {
							await supabase.storage
								.from("avatars")
								.remove([oldPath]);
						}
					} catch (deleteError) {
						// Ignore delete errors (file might not exist)
						if (import.meta.env.DEV) {
							console.debug(
								"Could not delete old avatar:",
								deleteError
							);
						}
					}
				}

				// Upload new avatar
				const avatarPath = `${currentUser.id}/${Date.now()}_${
					avatarFile.name
				}`;

				const { data: uploadData, error: uploadError } =
					await supabase.storage
						.from("avatars")
						.upload(avatarPath, avatarFile, {
							cacheControl: "3600",
							upsert: false,
						});

				if (uploadError) {
					throw uploadError;
				}

				// Get public URL
				const { data: urlData } = supabase.storage
					.from("avatars")
					.getPublicUrl(avatarPath);

				avatarUrl = urlData.publicUrl;

				if (import.meta.env.DEV) {
					console.debug("Avatar uploaded:", avatarUrl);
				}
			}

			// Check if username changed and if it's available
			const usernameChanged = trimmedUsername !== (profileData?.username || "").toLowerCase();
			if (usernameChanged) {
				// Check if username is already taken
				const { data: existingUser, error: checkError } = await supabase
					.from("user_profiles")
					.select("id")
					.ilike("username", trimmedUsername)
					.neq("id", currentUser.id)
					.maybeSingle();

				if (checkError) {
					throw checkError;
				}

				if (existingUser) {
					setError("Username is already taken");
					setUploading(false);
					return;
				}
			}

			// Update profile in database
			const updateData = {
				bio: bio.trim() || null,
				avatar_url: avatarUrl,
				updated_at: new Date().toISOString(),
			};

			// Only update username if it changed
			if (usernameChanged) {
				updateData.username = trimmedUsername;
			}

			const { error: updateError } = await supabase
				.from("user_profiles")
				.update(updateData)
				.eq("id", currentUser.id);

			if (updateError) {
				// Check for unique constraint violation
				if (updateError.code === "23505" || updateError.message?.includes("unique")) {
					setError("Username is already taken");
					setUploading(false);
					return;
				}
				throw updateError;
			}

			if (import.meta.env.DEV) {
				console.debug("Profile updated successfully");
			}

			// Call onUpdate callback with new data
			onUpdate({
				username: usernameChanged ? trimmedUsername : profileData?.username,
				bio: bio.trim() || null,
				avatar_url: avatarUrl,
			});

			onClose();
		} catch (err) {
			console.error("Error updating profile:", err);
			setError(
				err.message ||
					"Failed to update profile. Please try again."
			);
		} finally {
			setUploading(false);
		}
	};

	const handleClose = () => {
		// Reset form
		setUsername(profileData?.username || "");
		setBio(profileData?.bio || "");
		setAvatarPreview(profileData?.avatar_url || null);
		setAvatarFile(null);
		setError("");
		onClose();
	};

	return (
		<div
			className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
			onClick={handleClose}>
			<div
				className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden"
				onClick={(e) => e.stopPropagation()}>
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200">
					<h2 className="text-xl font-bold text-gray-900">
						Edit Profile
					</h2>
					<button
						type="button"
						onClick={handleClose}
						disabled={uploading}
						aria-label="Close edit profile modal"
						className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50">
						<X className="w-5 h-5 text-gray-600" />
					</button>
				</div>

				{/* Content */}
				<div className="p-6">
					{/* Username */}
					<div className="mb-6">
						<label
							htmlFor="username"
							className="block text-sm font-medium text-gray-700 mb-2">
							Username
						</label>
						<input
							id="username"
							type="text"
							value={username}
							onChange={(e) => {
								// Convert to lowercase as user types
								const value = e.target.value.toLowerCase();
								// Validate: only allow letters, numbers, underscores, and hyphens
								const validValue = value.replace(/[^a-z0-9_-]/g, "");
								setUsername(validValue);
								setError(""); // Clear error when user types
							}}
							placeholder="username"
							disabled={uploading}
							minLength={3}
							maxLength={30}
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 placeholder-gray-500"
						/>
						<div className="text-xs text-gray-500 mt-1">
							{username.length}/30 • Letters, numbers, underscores, and hyphens only
						</div>
					</div>

					{/* Avatar Upload */}
					<div className="flex flex-col items-center mb-6">
						<div className="relative">
							<div className="w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-600 rounded-full flex items-center justify-center overflow-hidden">
								{avatarPreview ? (
									<img
										src={avatarPreview}
										alt="Avatar preview"
										className="w-full h-full object-cover"
									/>
								) : (
									<User className="w-12 h-12 text-white" />
								)}
							</div>
							<button
								type="button"
								onClick={() => fileInputRef.current?.click()}
								disabled={uploading}
								className="absolute bottom-0 right-0 w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-50">
								<Upload className="w-4 h-4 text-white" />
							</button>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								onChange={handleAvatarSelect}
								className="hidden"
								disabled={uploading}
							/>
						</div>
						<p className="text-sm text-gray-500 mt-2">
							Click to upload avatar
						</p>
					</div>

					{/* Bio */}
					<div className="mb-6">
						<label
							htmlFor="bio"
							className="block text-sm font-medium text-gray-700 mb-2">
							Bio
						</label>
						<textarea
							id="bio"
							value={bio}
							onChange={(e) => setBio(e.target.value)}
							placeholder="Tell us about yourself..."
							disabled={uploading}
							rows={4}
							maxLength={500}
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 placeholder-gray-500"
						/>
						<div className="text-xs text-gray-500 mt-1 text-right">
							{bio.length}/500
						</div>
					</div>

					{/* Error Message */}
					{error && (
						<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
							<p className="text-sm text-red-600">{error}</p>
						</div>
					)}

					{/* Actions */}
					<div className="flex gap-3">
						<button
							type="button"
							onClick={handleClose}
							disabled={uploading}
							className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							style={{ color: "#374151" }}>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleSave}
							disabled={uploading}
							className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
							{uploading ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin" style={{ color: "#FFFFFF" }} />
									Saving...
								</>
							) : (
								"Save Changes"
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
