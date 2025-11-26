import AuthForm from "../components/AuthForm";

export default function Auth() {
	return (
		<div className="flex flex-col items-center justify-center h-screen p-4">
			<h1 className="text-2xl font-bold">Sign in / Sign up</h1>
			<AuthForm />
		</div>
	);
}
