LTME - Photo Gallery & Album Platform

A modern, responsive photo gallery and album sharing platform built with React, Vite, and a custom Node.js/Express backend with SQLite. Share your moments, create beautiful albums, and discover content from other creators.

Features

Core Functionality
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

Design Features
- Fully responsive design (mobile, tablet, desktop)
- Custom fonts and color palette
- Scrapbook-style album layouts
- Smooth animations and transitions
- Tooltips for better UX
- Mobile hamburger menu

Getting Started

Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

Installation

1. Clone the repository
   ```bash
   git clone <your-repo-url>
   cd ltme-dev-project
   ```

2. Install frontend dependencies
   ```bash
   cd frontend
   npm install
   cd ..
   ```

3. Install backend dependencies
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. Set up environment variables

   Create `.env` file in the backend directory:
   ```env
   JWT_SECRET=your_jwt_secret_key_here
   ```

5. Start the backend server
   ```bash
   cd backend
   npm run dev
   ```

6. In a new terminal, start the frontend development server
   ```bash
   cd frontend
   npm run dev
   ```

   The app will be available at `http://localhost:5173` and the API at `http://localhost:3000`

Project Structure

```
├── backend/             # Node.js/Express API server
│   ├── server.js       # Main server file
│   ├── package.json    # Backend dependencies
│   └── uploads/        # File upload directories
├── frontend/            # React frontend application
│   ├── src/
│   │   ├── components/ # Reusable React components
│   │   │   ├── Header.jsx      # Navigation header
│   │   │   ├── MasonryGrid.jsx # Main gallery grid component
│   │   │   ├── UploadModal.jsx # Post creation modal
│   │   │   └── ...
│   │   ├── pages/      # Page components
│   │   │   ├── Home.jsx    # Home feed
│   │   │   ├── Explore.jsx # Explore/discovery page
│   │   │   ├── Profile.jsx # User profile page
│   │   │   └── ...
│   │   ├── hooks/      # Custom React hooks
│   │   │   ├── useSavedPosts.js
│   │   │   └── useFollows.js
│   │   ├── config/     # Configuration files
│   │   │   └── features.js # Feature flags
│   │   └── apiClient.js # API client for backend communication
│   ├── package.json    # Frontend dependencies
│   └── ...
└── docs/               # Documentation
```

 Available Scripts

Frontend:
- `cd frontend && npm run dev` - Start frontend development server
- `cd frontend && npm run build` - Build frontend for production
- `cd frontend && npm run preview` - Preview frontend production build
- `cd frontend && npm run lint` - Run ESLint on frontend
- `cd frontend && npm run lint:fix` - Fix ESLint errors automatically

Backend:
- `cd backend && npm run dev` - Start backend development server with nodemon
- `cd backend && npm start` - Start backend production server

Customization

Feature Flags
Audio functionality is currently disabled but can be re-enabled by editing `src/config/features.js`:
```javascript
export const FEATURES = {
  AUDIO_ENABLED: true, // Set to true to enable audio features
};
```

Custom Fonts
Custom fonts are located in `src/assets/fonts/` and configured in `src/index.css`.

Color Palette
Colors are defined as CSS variables in `src/index.css` and can be customized there.

Database Schema

The application uses SQLite with the following main tables:
- `user_profiles` - User profile information
- `posts` - User posts/photos
- `saved_posts` - Saved posts junction table
- `follows` - Follow relationships
- `albums` - User-created albums
- `album_posts` - Album-post junction table

The database is automatically initialized when the backend server starts. See `backend/server.js` for schema details.

Deployment

Build the Frontend for Production
```bash
cd frontend
npm run build
```

The `frontend/dist/` folder will contain the production-ready frontend files.

Deploy to Vercel/Netlify (Frontend)
1. Push your code to GitHub
2. Import the frontend folder in Vercel/Netlify
3. Add environment variable:
   - `VITE_API_BASE_URL` (URL of your deployed backend API)
4. Deploy!

Backend Deployment
The backend can be deployed to services like Railway, Render, or Heroku:
1. Push your code to GitHub
2. Connect your repository to the deployment service
3. Add environment variable:
   - `JWT_SECRET`
4. Deploy!

Security Notes

- JWT authentication is used for secure API access
- Passwords are hashed with bcrypt
- Users can only access/modify their own data
- File uploads are validated and stored securely
- Public albums are viewable by all authenticated users
- Private albums are only visible to the owner

Tech Stack

- **React 19** - UI library
- **Vite** - Build tool and dev server
- **React Router DOM** - Routing
- **Node.js/Express** - Backend API server
- **SQLite** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Multer** - File uploads
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run lint` to check for errors
5. Submit a pull request

License

nil

Acknowledgments

- Built with React and Vite
- Backend powered by Node.js and Express
- Database powered by SQLite
- Icons from Lucide React
