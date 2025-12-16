import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiClient } from "../apiClient";
import UploadModal from "../components/UploadModal";

export default function Upload() {
	const navigate = useNavigate();
	const location = useLocation();
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Check auth state
		const token = localStorage.getItem("token");
		if (token) {
			try {
				const payload = JSON.parse(atob(token.split(".")[1]));
				setUser({ id: payload.userId, email: payload.email });
			} catch (err) {
				console.error("Error decoding token:", err);
				localStorage.removeItem("token");
			}
		}
		setLoading(false);

		if (!token) {
			navigate("/auth");
		}
	}, [navigate]);

	if (loading) {
		return (
			<div className="min-h-screen bg-white flex items-center justify-center pt-24">
				<div className="text-center">
					<div className="animate-spin w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full mx-auto mb-4"></div>
					<p className="text-gray-600">Loading...</p>
				</div>
			</div>
		);
	}

	if (!user) {
		return null; // Will redirect
	}

	// Render the upload modal as a full page experience
	return (
		<div className="min-h-screen bg-white pt-24">
			<UploadModal
				user={user}
				setShowUpload={(show) => {
					if (!show) {
						navigate("/");
					}
				}}
				onUploadSuccess={() => {
					// Reload the page to show new post
					window.location.reload();
				}}
			/>
		</div>
	);
}
