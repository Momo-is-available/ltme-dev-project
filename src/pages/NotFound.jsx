import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
	return (
		<div className="min-h-screen bg-white flex items-center justify-center pt-24 px-4">
			<div className="text-center max-w-md">
				<h1 className="text-9xl font-bold text-gray-900 mb-4">404</h1>
				<h2 className="text-3xl font-bold text-gray-900 mb-4">
					Page Not Found
				</h2>
				<p className="text-gray-600 mb-8">
					The page you're looking for doesn't exist or has been moved.
				</p>
				<div className="flex gap-4 justify-center">
					<Link
						to="/"
						className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors">
						<Home className="w-5 h-5" />
						Go Home
					</Link>
					<button
						type="button"
						onClick={() => window.history.back()}
						className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors">
						<ArrowLeft className="w-5 h-5" />
						Go Back
					</button>
				</div>
			</div>
		</div>
	);
}
