import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import UploadModal from "../components/UploadModal";

export default function Upload() {
	const navigate = useNavigate();
	const location = useLocation();
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Check auth state
		supabase.auth.getSession().then(({ data: { session } }) => {
			setUser(session?.user ?? null);
			setLoading(false);
			if (!session?.user) {
				navigate("/auth");
			}
		});

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
			if (!session?.user) {
				navigate("/auth");
			}
		});

		return () => subscription.unsubscribe();
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
