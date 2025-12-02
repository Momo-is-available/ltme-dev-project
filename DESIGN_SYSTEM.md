# Design System - Color Palette & Typography

## Colors

### Primary Palette
- **Terracotta**: `#C97C5D` - Use: `bg-terracotta` or `text-terracotta`
- **Cream**: `#FFEDAD` - Use: `bg-cream` or `text-cream`
- **Blue Gray**: `#C5D0D3` - Use: `bg-blue-gray` or `text-blue-gray`
- **Dark Navy**: `#0C101D` - Use: `bg-dark-navy` or `text-dark-navy`
- **Dark Green**: `#22332E` - Use: `bg-dark-green` or `text-dark-green`
- **Off White**: `#F6FFF8` - Use: `bg-off-white` or `text-off-white`

### Gradient
The primary gradient can be applied using the `.text-gradient` class:
```html
<h1 className="text-gradient">Your Text Here</h1>
```

Gradient colors: `#F6FFF8 → #C5D0D3 → #FFEDAD → #C97C5D → #19213E`

## Typography

### Font Combinations

#### 1. Glory + Reddit
- **Heading**: `.font-heading-glory` (Dancing Script / Glory Heart)
- **Body**: `.font-body-reddit` (Inter / Reddit Sans)

```html
<h1 className="font-heading-glory">Capturing Moments, Sharing Stories</h1>
<p className="font-body-reddit">Welcome to my new photo journal...</p>
```

#### 2. Beauty + OverLock
- **Heading**: `.font-heading-beauty` (Playfair Display / Beauty Mountains)
- **Body**: `.font-body-overlock` (Overlock)

```html
<h1 className="font-heading-beauty">Capturing Moments, Sharing Stories</h1>
<p className="font-body-overlock">Welcome to my new photo journal...</p>
```

#### 3. Tropical + Alfena
- **Heading**: `.font-heading-tropical` (Cormorant Garamond / Tropical Avenue)
- **Body**: `.font-body-alfena` (Inter / Alfena Demo)

```html
<h1 className="font-heading-tropical">Capturing Moments, Sharing Stories</h1>
<p className="font-body-alfena">Welcome to my new photo journal...</p>
```

### Font Sizes
- **Headings**: 56px (3.5rem) with 120% line-height
- **Body**: 18px (1.125rem) with 150% line-height

## Usage Examples

### Tailwind Classes
```jsx
// Using colors
<div className="bg-terracotta text-off-white p-4">
  Content
</div>

// Using typography
<h1 className="font-heading-glory text-gradient">
  Title
</h1>
<p className="font-body-reddit text-white">
  Body text
</p>
```

## Premium Fonts Note

The following premium fonts need to be hosted locally or purchased:
- **Glory Heart** (alternative: Dancing Script)
- **Beauty Mountains Personal Use** (alternative: Playfair Display)
- **Tropical Avenue Personal Use On** (alternative: Cormorant Garamond)
- **Reddit Sans** (alternative: Inter)
- **Alfena Demo** (alternative: Inter)

To use premium fonts:
1. Add font files to `src/assets/fonts/`
2. Import them in `src/index.css` using `@font-face`
3. Update font-family declarations
