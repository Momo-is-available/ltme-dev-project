import { useParams } from "react-router-dom";

export default function PostDetail() {
	const { id } = useParams();
	return (
		<div className="flex flex-col items-center justify-center h-screen p-4">
			<h1 className="text-2xl font-bold">Post Detail Page for {id}</h1>
		</div>
	);
}
