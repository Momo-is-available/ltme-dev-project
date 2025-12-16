# LTME Backend API

Backend server for LTME (Look Through My Eyes) - A photo sharing web application.

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite3
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **File Upload**: Multer

## Prerequisites

Before running the backend, ensure you have:

- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)

To verify installation:
```bash
node --version
npm --version
```

## Installation Steps

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- express (web framework)
- cors (cross-origin resource sharing)
- sqlite3 (database)
- bcrypt (password hashing)
- jsonwebtoken (authentication)
- multer (file uploads)

### 3. Start the Server

**Production mode:**
```bash
npm start
```

**Development mode (with auto-restart):**
```bash
npm run dev
```

The server will start on **http://localhost:3001**

## Project Structure

```
backend/
├── server.js          # Main server file
├── package.json       # Dependencies
├── ltme.db           # SQLite database (auto-created)
└── uploads/          # Uploaded files (auto-created)
    ├── posts/        # Post images
    └── avatars/      # User avatars
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | Create new user | No |
| POST | `/api/auth/signin` | Login user | No |

### User Profile

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/user/profile` | Get current user profile | Yes |
| PUT | `/api/user/profile` | Update profile | Yes |
| POST | `/api/user/avatar` | Upload avatar | Yes |

### Posts

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/posts` | Create new post | Yes |
| GET | `/api/posts` | Get all posts | Yes |
| GET | `/api/posts/:id` | Get single post | Yes |
| GET | `/api/posts/user/:userId` | Get user's posts | Yes |
| PUT | `/api/posts/:id` | Update post | Yes |
| DELETE | `/api/posts/:id` | Delete post | Yes |

### Saved Posts

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/saved-posts` | Save a post | Yes |
| GET | `/api/saved-posts` | Get saved posts | Yes |
| DELETE | `/api/saved-posts/:postId` | Unsave post | Yes |

### Follows

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/follows` | Follow a user | Yes |
| DELETE | `/api/follows/:userId` | Unfollow user | Yes |
| GET | `/api/follows/followers/:userId` | Get followers | Yes |
| GET | `/api/follows/following/:userId` | Get following | Yes |

### Albums

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/albums` | Create album | Yes |
| GET | `/api/albums/user/:userId` | Get user's albums | Yes |
| POST | `/api/album-posts` | Add post to album | Yes |
| GET | `/api/album-posts/:albumId` | Get album posts | Yes |

## Database Schema

The backend uses SQLite with the following tables:

- **user_profiles** - User accounts and profile information
- **posts** - Photo posts with metadata
- **saved_posts** - User's saved posts
- **follows** - User follow relationships
- **albums** - Photo collections
- **album_posts** - Posts within albums

## Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. User signs up or signs in
2. Server returns a JWT token
3. Client includes token in Authorization header: `Bearer <token>`
4. Token expires after 7 days

## File Uploads

### Post Images
- Endpoint: `/api/posts`
- Field name: `image`
- Max size: 10MB
- Allowed formats: JPEG, PNG, GIF, WebP
- Storage: `uploads/posts/`

### Avatar Images
- Endpoint: `/api/user/avatar`
- Field name: `avatar`
- Max size: 10MB
- Allowed formats: JPEG, PNG, GIF, WebP
- Storage: `uploads/avatars/`

## Environment Variables (Optional)

You can create a `.env` file for configuration:

```
PORT=3001
JWT_SECRET=your-custom-secret-key-here
```

## Testing the API

### Using cURL

**Sign Up:**
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Sign In:**
```bash
curl -X POST http://localhost:3001/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Get Posts (requires token):**
```bash
curl -X GET http://localhost:3001/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman

1. Import the endpoints into Postman
2. Set Authorization type to "Bearer Token"
3. Paste your JWT token

## Troubleshooting

### Port Already in Use
If port 3001 is busy, change it in server.js:
```javascript
const PORT = 3002; // Change to any available port
```

### Database Locked
If you get "database is locked" error:
1. Stop the server
2. Delete `ltme.db`
3. Restart the server (database will be recreated)

### Cannot Upload Files
Ensure `uploads/` directory exists and has write permissions:
```bash
mkdir -p uploads/posts uploads/avatars
chmod 755 uploads
```

### Module Not Found
Reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Security Notes

⚠️ **For Production:**
- Change `JWT_SECRET` to a strong random string
- Use HTTPS
- Add rate limiting
- Implement input validation
- Use environment variables for sensitive data
- Add proper error handling
- Implement CSRF protection

## Support

For issues or questions about the backend API, please refer to the main project documentation.
