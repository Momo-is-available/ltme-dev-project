import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Hero from "./Hero";
import Explore from "./Explore";

export default function HomeExplore({ scrollToExplore, setShowAuthModal, setPostToSaveAfterAuth }) {
	const location = useLocation();
	const exploreSectionRef = useRef(null);

	// Scroll to explore section when navigating from Explore link
	useEffect(() => {
		// Check if we should scroll to explore section
		// This happens when user clicks "Explore" in navigation
		if (scrollToExplore || location.state?.scrollToExplore) {
			setTimeout(() => {
				exploreSectionRef.current?.scrollIntoView({
					behavior: "smooth",
					block: "start",
				});
			}, 100);
		}
	}, [scrollToExplore, location.state]);

	return (
		<>
			<Hero />
			{/* Explore section */}
			<div id="explore-section" ref={exploreSectionRef}>
				<Explore setShowAuthModal={setShowAuthModal} setPostToSaveAfterAuth={setPostToSaveAfterAuth} />
			</div>
		</>
	);
}
