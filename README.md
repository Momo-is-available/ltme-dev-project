# LTME - Photo Gallery & Album Platform

A modern, responsive photo gallery and album sharing platform built with React, Vite, and Supabase. Share your moments, create beautiful albums, and discover content from other creators.

## ✨ Features

### Core Functionality
- **User Authentication** - Sign up, sign in, and secure session management
- **Post Creation** - Upload photos with titles and captions
- **Gallery View** - Responsive masonry grid layout (1-4 columns based on screen size)
- **Post Management** - Edit and delete your posts
- **Save/Bookmark** - Save posts to your collection for later viewing
- **Albums/Collections** - Create, edit, and organize posts into beautiful scrapbook-style albums
- **Follow System** - Follow other users and see their content in your Following feed
- **Explore** - Discover posts and albums from the community
- **Search** - Find users and posts by keywords
- **Share** - Share posts and albums via social media or copy links
- **User Profiles** - Customize your profile with avatar, bio, and username

### Design Features
- Fully responsive design (mobile, tablet, desktop)
- Custom fonts and color palette
- Scrapbook-style album layouts
- Smooth animations and transitions
- Tooltips for better UX
- Mobile hamburger menu

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn
- A Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ltme-dev-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   Get these values from: https://app.supabase.com → Your Project → Settings → API

4. **Set up the database**

   Run the SQL commands in `supabase-schema.sql` in your Supabase SQL Editor:
   - Go to Supabase Dashboard → SQL Editor
   - Create a new query
   - Copy and paste the contents of `supabase-schema.sql`
   - Run the query

   This will create all necessary tables, RLS policies, functions, and indexes.

5. **Set up storage buckets**

   Run the SQL commands in `supabase-storage-avatars.sql` in your Supabase SQL Editor:
   - Go to Supabase Dashboard → SQL Editor
   - Create a new query
   - Copy and paste the contents of `supabase-storage-avatars.sql`
   - Run the query

   This will create the storage buckets for photos, audio, and avatars.

6. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## 📁 Project Structure

```
src/
├── components/          # Reusable React components
│   ├── Header.jsx      # Navigation header
│   ├── MasonryGrid.jsx # Main gallery grid component
│   ├── UploadModal.jsx # Post creation modal
│   └── ...
├── pages/              # Page components
│   ├── Home.jsx        # Home feed
│   ├── Explore.jsx     # Explore/discovery page
│   ├── Profile.jsx     # User profile page
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useSavedPosts.js
│   └── useFollows.js
├── config/             # Configuration files
│   └── features.js     # Feature flags
└── supabaseClient.js   # Supabase client setup
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically

## 🎨 Customization

### Feature Flags
Audio functionality is currently disabled but can be re-enabled by editing `src/config/features.js`:
```javascript
export const FEATURES = {
  AUDIO_ENABLED: true, // Set to true to enable audio features
};
```

### Custom Fonts
Custom fonts are located in `src/assets/fonts/` and configured in `src/index.css`.

### Color Palette
Colors are defined as CSS variables in `src/index.css` and can be customized there.

## 📝 Database Schema

The application uses the following main tables:
- `posts` - User posts/photos
- `user_profiles` - User profile information
- `saved_posts` - Saved posts junction table
- `follows` - Follow relationships
- `albums` - User-created albums
- `album_posts` - Album-post junction table

See `supabase-schema.sql` for complete schema details.

## 🚢 Deployment

### Build for Production
```bash
npm run build
```

The `dist/` folder will contain the production-ready files.

### Deploy to Vercel/Netlify
1. Push your code to GitHub
2. Import the project in Vercel/Netlify
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

## 🔒 Security Notes

- Row Level Security (RLS) is enabled on all tables
- Users can only access/modify their own data
- Public albums are viewable by all authenticated users
- Private albums are only visible to the owner

## 📚 Tech Stack

- **React 19** - UI library
- **Vite** - Build tool and dev server
- **React Router DOM** - Routing
- **Supabase** - Backend (PostgreSQL, Auth, Storage)
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run lint` to check for errors
5. Submit a pull request

## 📄 License

[Your License Here]

## 🙏 Acknowledgments

- Built with React and Vite
- Backend powered by Supabase
- Icons from Lucide React
