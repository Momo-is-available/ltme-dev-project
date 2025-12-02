import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export default function Tooltip({ children, text, position = "bottom" }) {
	const [isVisible, setIsVisible] = useState(false);
	const [tooltipStyle, setTooltipStyle] = useState({});
	const [arrowStyle, setArrowStyle] = useState({});
	const wrapperRef = useRef(null);
	const tooltipRef = useRef(null);
	const [portalContainer, setPortalContainer] = useState(null);

	// Create portal container once
	useEffect(() => {
		const container = document.createElement("div");
		container.id = "tooltip-portal-root";
		document.body.appendChild(container);
		setPortalContainer(container);

		return () => {
			document.body.removeChild(container);
		};
	}, []);

	// Calculate tooltip position when visible
	useEffect(() => {
		if (!isVisible || !wrapperRef.current || !tooltipRef.current || !portalContainer) {
			return;
		}

		const updatePosition = () => {
			if (!wrapperRef.current || !tooltipRef.current) return;

			const wrapperRect = wrapperRef.current.getBoundingClientRect();
			const tooltip = tooltipRef.current;

			// Temporarily make visible to measure
			tooltip.style.visibility = "hidden";
			tooltip.style.opacity = "0";
			tooltip.style.display = "block";

			const tooltipRect = tooltip.getBoundingClientRect();
			const viewportWidth = window.innerWidth;
			const padding = 10;
			const gap = 8;

			const style = {};

			if (position === "bottom") {
				// Position below the element
				style.top = `${wrapperRect.bottom + gap}px`;

				// Center horizontally, but adjust if it would overflow
				const tooltipCenterX = wrapperRect.left + wrapperRect.width / 2;
				const tooltipHalfWidth = tooltipRect.width / 2;
				let tooltipLeft = tooltipCenterX - tooltipHalfWidth;

				// Keep within viewport bounds
				if (tooltipLeft + tooltipRect.width > viewportWidth - padding) {
					tooltipLeft = viewportWidth - padding - tooltipRect.width;
				}
				if (tooltipLeft < padding) {
					tooltipLeft = padding;
				}

				style.left = `${tooltipLeft}px`;
				style.transform = "none";
			} else if (position === "top") {
				// Position above the element
				style.bottom = `${window.innerHeight - wrapperRect.top + gap}px`;
				style.top = "auto";

				const tooltipCenterX = wrapperRect.left + wrapperRect.width / 2;
				const tooltipHalfWidth = tooltipRect.width / 2;
				let tooltipLeft = tooltipCenterX - tooltipHalfWidth;

				if (tooltipLeft + tooltipRect.width > viewportWidth - padding) {
					tooltipLeft = viewportWidth - padding - tooltipRect.width;
				}
				if (tooltipLeft < padding) {
					tooltipLeft = padding;
				}

				style.left = `${tooltipLeft}px`;
				style.transform = "none";
			} else if (position === "left") {
				// Position to the left
				style.right = `${window.innerWidth - wrapperRect.left + gap}px`;
				style.left = "auto";

				const tooltipCenterY = wrapperRect.top + wrapperRect.height / 2;
				const tooltipHalfHeight = tooltipRect.height / 2;
				let tooltipTop = tooltipCenterY - tooltipHalfHeight;

				if (tooltipTop + tooltipRect.height > window.innerHeight - padding) {
					tooltipTop = window.innerHeight - padding - tooltipRect.height;
				}
				if (tooltipTop < padding) {
					tooltipTop = padding;
				}

				style.top = `${tooltipTop}px`;
				style.transform = "none";
			} else {
				// Position to the right
				style.left = `${wrapperRect.right + gap}px`;

				const tooltipCenterY = wrapperRect.top + wrapperRect.height / 2;
				const tooltipHalfHeight = tooltipRect.height / 2;
				let tooltipTop = tooltipCenterY - tooltipHalfHeight;

				if (tooltipTop + tooltipRect.height > window.innerHeight - padding) {
					tooltipTop = window.innerHeight - padding - tooltipRect.height;
				}
				if (tooltipTop < padding) {
					tooltipTop = padding;
				}

				style.top = `${tooltipTop}px`;
				style.transform = "none";
			}

			// Reset for CSS to handle visibility
			tooltip.style.visibility = "";
			tooltip.style.opacity = "";
			tooltip.style.display = "";

			setTooltipStyle(style);
		};

		// Calculate position after a brief delay to ensure DOM is ready
		const timeoutId = setTimeout(updatePosition, 0);

		// Update on scroll/resize
		const handleUpdate = () => updatePosition();
		window.addEventListener("scroll", handleUpdate, true);
		window.addEventListener("resize", handleUpdate);

		return () => {
			clearTimeout(timeoutId);
			window.removeEventListener("scroll", handleUpdate, true);
			window.removeEventListener("resize", handleUpdate);
		};
	}, [isVisible, position, portalContainer]);

	// Calculate arrow position
	useEffect(() => {
		if (!isVisible || !wrapperRef.current || !tooltipRef.current) {
			setArrowStyle({});
			return;
		}

		// Wait for tooltipStyle to be set
		if ((position === "bottom" || position === "top") && !tooltipStyle.left) {
			return;
		}
		if ((position === "left" || position === "right") && !tooltipStyle.top) {
			return;
		}

		const calculateArrow = () => {
			if (!wrapperRef.current || !tooltipRef.current) return;

			const wrapperRect = wrapperRef.current.getBoundingClientRect();
			const style = {};

			if (position === "bottom" || position === "top") {
				const wrapperCenterX = wrapperRect.left + wrapperRect.width / 2;
				const tooltipLeft = parseFloat(tooltipStyle.left);
				style.left = `${wrapperCenterX - tooltipLeft}px`;
			} else {
				const wrapperCenterY = wrapperRect.top + wrapperRect.height / 2;
				const tooltipTop = parseFloat(tooltipStyle.top);
				style.top = `${wrapperCenterY - tooltipTop}px`;
			}

			setArrowStyle(style);
		};

		const rafId = requestAnimationFrame(calculateArrow);
		return () => cancelAnimationFrame(rafId);
	}, [isVisible, position, tooltipStyle]);

	const tooltipContent = portalContainer ? (
		<div
			ref={tooltipRef}
			className={`tooltip-content fixed transition-opacity pointer-events-none whitespace-nowrap ${
				isVisible ? "opacity-100 visible" : "opacity-0 invisible"
			}`}
			style={{
				maxWidth: "200px",
				zIndex: 9999,
				...tooltipStyle,
			}}>
			<div className="bg-white text-dark-navy text-xs px-3 py-1.5 rounded-lg shadow-xl border border-gray-200 font-medium relative">
				{text}
				{/* Arrow pointing to element */}
				{position === "bottom" && (
					<div
						className="absolute bottom-full border-4 border-transparent border-b-white"
						style={{
							left: arrowStyle.left || "50%",
							transform: "translateX(-50%)",
						}}></div>
				)}
				{position === "top" && (
					<div
						className="absolute top-full border-4 border-transparent border-t-white"
						style={{
							left: arrowStyle.left || "50%",
							transform: "translateX(-50%)",
						}}></div>
				)}
				{position === "left" && (
					<div
						className="absolute left-full border-4 border-transparent border-l-white"
						style={{
							top: arrowStyle.top || "50%",
							transform: "translateY(-50%)",
						}}></div>
				)}
				{position === "right" && (
					<div
						className="absolute right-full border-4 border-transparent border-r-white"
						style={{
							top: arrowStyle.top || "50%",
							transform: "translateY(-50%)",
						}}></div>
				)}
			</div>
		</div>
	) : null;

	return (
		<>
			<div
				className="relative tooltip-wrapper inline-block"
				ref={wrapperRef}
				onMouseEnter={() => setIsVisible(true)}
				onMouseLeave={() => setIsVisible(false)}>
				{children}
			</div>
			{portalContainer && createPortal(tooltipContent, portalContainer)}
		</>
	);
}
