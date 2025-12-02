/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				terracotta: "#C97C5D",
				cream: "#FFEDAD",
				"blue-gray": "#C5D0D3",
				"dark-navy": "#0C101D",
				"dark-green": "#22332E",
				"off-white": "#F6FFF8",
				"gradient-dark": "#19213E",
			},
			fontFamily: {
				sans: ["Overlock", "sans-serif"], // Default sans-serif (body text)
				"glory": ['"Glory Heart"', '"Dancing Script"', "cursive"],
				"beauty": ['"Beauty Mountains Personal Use"', '"Playfair Display"', "serif"],
				"tropical": ['"Tropical Avenue Personal Use On"', '"Cormorant Garamond"', "serif"],
				"reddit": ['"Reddit Sans"', "Inter", "sans-serif"],
				"overlock": ["Overlock", "sans-serif"],
				"alfena": ['"Alfena Demo"', "Inter", "sans-serif"],
				handwriting: [
					"Glory Heart",
					"Dancing Script",
					"cursive",
					"Brush Script MT",
					"Lucida Handwriting",
					"serif",
				],
			},
		},
	},
	plugins: [],
};
