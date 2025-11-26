import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are missing
if (
	!supabaseUrl ||
	!supabaseAnonKey ||
	supabaseUrl === "your_supabase_project_url_here" ||
	supabaseAnonKey === "your_supabase_anon_key_here"
) {
	const errorMessage = `
		❌ Missing Supabase environment variables!

		Please create a .env file in the root of your project with:

		VITE_SUPABASE_URL=your_supabase_project_url
		VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

		Get these values from: https://app.supabase.com
		Go to your project > Settings > API
	`;
	console.error(errorMessage);
}

// Create client with fallback values to prevent crash
// The app will show errors when trying to use Supabase if env vars are missing
export const supabase = createClient(
	supabaseUrl || "https://placeholder.supabase.co",
	supabaseAnonKey ||
		"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.placeholder"
);
