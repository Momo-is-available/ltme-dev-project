import { useParams } from "react-router-dom";

export default function Profile() {
	const { username } = useParams();
	return (
		<div className="flex flex-col items-center justify-center h-screen p-4">
			<h1 className="text-2xl font-bold">Profile Page for {username}</h1>
		</div>
	);
}
