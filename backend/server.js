const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET =
	process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Create uploads directory if it doesn't exist
if (!fs.existsSync("uploads")) {
	fs.mkdirSync("uploads");
}
if (!fs.existsSync("uploads/posts")) {
	fs.mkdirSync("uploads/posts");
}
if (!fs.existsSync("uploads/avatars")) {
	fs.mkdirSync("uploads/avatars");
}

// Configure multer for file uploads
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		const uploadPath =
			file.fieldname === "avatar" ? "uploads/avatars" : "uploads/posts";
		cb(null, uploadPath);
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(null, uniqueSuffix + path.extname(file.originalname));
	},
});

const upload = multer({
	storage: storage,
	limits: { fileSize: 30 * 1024 * 1024 }, // 30MB limit
	fileFilter: (req, file, cb) => {
		const allowedTypes = /jpeg|jpg|png|gif|webp/;
		const extname = allowedTypes.test(
			path.extname(file.originalname).toLowerCase()
		);
		const mimetype = allowedTypes.test(file.mimetype);

		if (mimetype && extname) {
			return cb(null, true);
		} else {
			cb(new Error("Only image files are allowed!"));
		}
	},
});

// Initialize SQLite Database
const db = new sqlite3.Database("./ltme.db", (err) => {
	if (err) {
		console.error("Error opening database", err);
	} else {
		console.log("Connected to SQLite database");
		initializeDatabase();
	}
});

// Initialize database tables
function initializeDatabase() {
	// User profiles table
	db.run(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      avatar_url TEXT,
      bio TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

	// Posts table
	db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      image_url TEXT NOT NULL,
      title TEXT,
      caption TEXT,
      audio_name TEXT,
      view_count INTEGER DEFAULT 0,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
    )
  `);

	// Saved posts table
	db.run(`
    CREATE TABLE IF NOT EXISTS saved_posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      post_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, post_id),
      FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
  `);

	// Follows table
	db.run(`
    CREATE TABLE IF NOT EXISTS follows (
      id TEXT PRIMARY KEY,
      follower_id TEXT NOT NULL,
      following_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(follower_id, following_id),
      FOREIGN KEY (follower_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (following_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
      CHECK (follower_id != following_id)
    )
  `);

	// Albums table
	db.run(`
    CREATE TABLE IF NOT EXISTS albums (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      cover_image_url TEXT,
      is_public INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
    )
  `);

	// Album posts junction table
	db.run(`
    CREATE TABLE IF NOT EXISTS album_posts (
      id TEXT PRIMARY KEY,
      album_id TEXT NOT NULL,
      post_id TEXT NOT NULL,
      position INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(album_id, post_id),
      FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
  `);

	console.log("Database tables initialized");
}

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1];

	if (!token) {
		return res.status(401).json({ error: "Access token required" });
	}

	jwt.verify(token, JWT_SECRET, (err, user) => {
		if (err) {
			return res.status(403).json({ error: "Invalid or expired token" });
		}
		req.user = user;
		next();
	});
}

// Helper function to generate unique ID
function generateId() {
	return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// == AUTH ROUTES ==

// Sign up
app.post("/api/auth/signup", async (req, res) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return res
			.status(400)
			.json({ error: "Email and password are required" });
	}

	try {
		const hashedPassword = await bcrypt.hash(password, 10);
		const userId = generateId();
		const username =
			email.split("@")[0] + "_" + Math.floor(Math.random() * 1000);

		db.run(
			"INSERT INTO user_profiles (id, email, password_hash, username) VALUES (?, ?, ?, ?)",
			[userId, email, hashedPassword, username],
			function (err) {
				if (err) {
					if (err.message.includes("UNIQUE")) {
						return res
							.status(400)
							.json({ error: "Email already exists" });
					}
					return res
						.status(500)
						.json({ error: "Error creating user" });
				}

				const token = jwt.sign({ userId, email }, JWT_SECRET, {
					expiresIn: "7d",
				});
				res.json({ token, user: { id: userId, email, username } });
			}
		);
	} catch (error) {
		res.status(500).json({ error: "Server error" });
	}
});

// Sign in
app.post("/api/auth/signin", (req, res) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return res
			.status(400)
			.json({ error: "Email and password are required" });
	}

	db.get(
		"SELECT * FROM user_profiles WHERE email = ?",
		[email],
		async (err, user) => {
			if (err || !user) {
				return res.status(401).json({ error: "Invalid credentials" });
			}

			const match = await bcrypt.compare(password, user.password_hash);
			if (!match) {
				return res.status(401).json({ error: "Invalid credentials" });
			}

			const token = jwt.sign(
				{ userId: user.id, email: user.email },
				JWT_SECRET,
				{ expiresIn: "7d" }
			);
			res.json({
				token,
				user: {
					id: user.id,
					email: user.email,
					username: user.username,
					avatar_url: user.avatar_url,
					bio: user.bio,
				},
			});
		}
	);
});

// == USER PROFILE ROUTES ==

// Get current user profile
app.get("/api/user/profile", authenticateToken, (req, res) => {
	db.get(
		"SELECT id, email, username, avatar_url, bio, created_at FROM user_profiles WHERE id = ?",
		[req.user.userId],
		(err, user) => {
			if (err || !user) {
				return res.status(404).json({ error: "User not found" });
			}
			res.json(user);
		}
	);
});

// Update user profile
app.put("/api/user/profile", authenticateToken, (req, res) => {
	const { username, bio } = req.body;

	db.run(
		"UPDATE user_profiles SET username = ?, bio = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
		[username, bio, req.user.userId],
		function (err) {
			if (err) {
				return res
					.status(400)
					.json({ error: "Error updating profile" });
			}
			res.json({ message: "Profile updated successfully" });
		}
	);
});

// Upload avatar
app.post(
	"/api/user/avatar",
	authenticateToken,
	upload.single("avatar"),
	(req, res) => {
		if (!req.file) {
			return res.status(400).json({ error: "No file uploaded" });
		}

		const avatarUrl = `/uploads/avatars/${req.file.filename}`;

		db.run(
			"UPDATE user_profiles SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
			[avatarUrl, req.user.userId],
			function (err) {
				if (err) {
					return res
						.status(500)
						.json({ error: "Error updating avatar" });
				}
				res.json({ avatar_url: avatarUrl });
			}
		);
	}
);

// Get user by username
app.get("/api/user/username/:username", (req, res) => {
	const { username } = req.params;

	db.get(
		"SELECT id, email, username, avatar_url, bio, created_at FROM user_profiles WHERE username = ?",
		[username],
		(err, user) => {
			if (err || !user) {
				return res.status(404).json({ error: "User not found" });
			}
			res.json(user);
		}
	);
});

// == POSTS ROUTES ==

// Create post
app.post(
	"/api/posts",
	authenticateToken,
	upload.single("image"),
	(req, res) => {
		if (!req.file) {
			return res.status(400).json({ error: "Image is required" });
		}

		const { title, caption, audio_name, tags } = req.body;
		const postId = generateId();
		const imageUrl = `/uploads/posts/${req.file.filename}`;

		db.run(
			"INSERT INTO posts (id, user_id, image_url, title, caption, audio_name, tags) VALUES (?, ?, ?, ?, ?, ?, ?)",
			[
				postId,
				req.user.userId,
				imageUrl,
				title,
				caption,
				audio_name,
				tags,
			],
			function (err) {
				if (err) {
					return res
						.status(500)
						.json({ error: "Error creating post" });
				}

				db.get(
					"SELECT * FROM posts WHERE id = ?",
					[postId],
					(err, post) => {
						if (err) {
							return res
								.status(500)
								.json({ error: "Error retrieving post" });
						}
						res.json(post);
					}
				);
			}
		);
	}
);

// Get all posts (with pagination)
app.get("/api/posts", authenticateToken, (req, res) => {
	const limit = parseInt(req.query.limit) || 50;
	const offset = parseInt(req.query.offset) || 0;

	db.all(
		`SELECT p.*, u.username, u.avatar_url
     FROM posts p
     JOIN user_profiles u ON p.user_id = u.id
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
		[limit, offset],
		(err, posts) => {
			if (err) {
				return res.status(500).json({ error: "Error fetching posts" });
			}
			res.json(posts);
		}
	);
});

// Get single post
app.get("/api/posts/:id", authenticateToken, (req, res) => {
	db.get(
		`SELECT p.*, u.username, u.avatar_url
     FROM posts p
     JOIN user_profiles u ON p.user_id = u.id
     WHERE p.id = ?`,
		[req.params.id],
		(err, post) => {
			if (err || !post) {
				return res.status(404).json({ error: "Post not found" });
			}

			// Increment view count
			db.run(
				"UPDATE posts SET view_count = view_count + 1 WHERE id = ?",
				[req.params.id]
			);

			res.json(post);
		}
	);
});

// Get user's posts
app.get("/api/posts/user/:userId", authenticateToken, (req, res) => {
	db.all(
		`SELECT p.*, u.username, u.avatar_url
     FROM posts p
     JOIN user_profiles u ON p.user_id = u.id
     WHERE p.user_id = ?
     ORDER BY p.created_at DESC`,
		[req.params.userId],
		(err, posts) => {
			if (err) {
				return res.status(500).json({ error: "Error fetching posts" });
			}
			res.json(posts);
		}
	);
});

// Get posts from followed users
app.get("/api/posts/following", authenticateToken, (req, res) => {
	db.all(
		`SELECT p.*, u.username, u.avatar_url
     FROM posts p
     JOIN user_profiles u ON p.user_id = u.id
     JOIN follows f ON p.user_id = f.following_id
     WHERE f.follower_id = ?
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
		[req.user.userId, 50, 0], // Default limit of 50, offset 0
		(err, posts) => {
			if (err) {
				return res
					.status(500)
					.json({ error: "Error fetching following posts" });
			}
			res.json(posts);
		}
	);
});

// Update post
app.put("/api/posts/:id", authenticateToken, (req, res) => {
	const { title, caption, tags } = req.body;

	db.run(
		"UPDATE posts SET title = ?, caption = ?, tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
		[title, caption, tags, req.params.id, req.user.userId],
		function (err) {
			if (err) {
				return res.status(500).json({ error: "Error updating post" });
			}
			if (this.changes === 0) {
				return res
					.status(404)
					.json({ error: "Post not found or unauthorized" });
			}
			res.json({ message: "Post updated successfully" });
		}
	);
});

// Delete post
app.delete("/api/posts/:id", authenticateToken, (req, res) => {
	db.run(
		"DELETE FROM posts WHERE id = ? AND user_id = ?",
		[req.params.id, req.user.userId],
		function (err) {
			if (err) {
				return res.status(500).json({ error: "Error deleting post" });
			}
			if (this.changes === 0) {
				return res
					.status(404)
					.json({ error: "Post not found or unauthorized" });
			}
			res.json({ message: "Post deleted successfully" });
		}
	);
});

// == SAVED POSTS ROUTES ==

// Save a post
app.post("/api/saved-posts", authenticateToken, (req, res) => {
	const { post_id } = req.body;
	const savedId = generateId();

	db.run(
		"INSERT INTO saved_posts (id, user_id, post_id) VALUES (?, ?, ?)",
		[savedId, req.user.userId, post_id],
		function (err) {
			if (err) {
				if (err.message.includes("UNIQUE")) {
					return res
						.status(400)
						.json({ error: "Post already saved" });
				}
				return res.status(500).json({ error: "Error saving post" });
			}
			res.json({ message: "Post saved successfully" });
		}
	);
});

// Get saved posts
app.get("/api/saved-posts", authenticateToken, (req, res) => {
	db.all(
		`SELECT p.*, u.username, u.avatar_url
     FROM saved_posts sp
     JOIN posts p ON sp.post_id = p.id
     JOIN user_profiles u ON p.user_id = u.id
     WHERE sp.user_id = ?
     ORDER BY sp.created_at DESC`,
		[req.user.userId],
		(err, posts) => {
			if (err) {
				return res
					.status(500)
					.json({ error: "Error fetching saved posts" });
			}
			res.json(posts);
		}
	);
});

// Unsave a post
app.delete("/api/saved-posts/:postId", authenticateToken, (req, res) => {
	db.run(
		"DELETE FROM saved_posts WHERE user_id = ? AND post_id = ?",
		[req.user.userId, req.params.postId],
		function (err) {
			if (err) {
				return res.status(500).json({ error: "Error unsaving post" });
			}
			res.json({ message: "Post unsaved successfully" });
		}
	);
});

// == FOLLOWS ROUTES ==

// Follow a user
app.post("/api/follows", authenticateToken, (req, res) => {
	const { following_id } = req.body;
	const followId = generateId();

	if (following_id === req.user.userId) {
		return res.status(400).json({ error: "Cannot follow yourself" });
	}

	db.run(
		"INSERT INTO follows (id, follower_id, following_id) VALUES (?, ?, ?)",
		[followId, req.user.userId, following_id],
		function (err) {
			if (err) {
				if (err.message.includes("UNIQUE")) {
					return res
						.status(400)
						.json({ error: "Already following this user" });
				}
				return res.status(500).json({ error: "Error following user" });
			}
			res.json({ message: "User followed successfully" });
		}
	);
});

// Unfollow a user
app.delete("/api/follows/:userId", authenticateToken, (req, res) => {
	db.run(
		"DELETE FROM follows WHERE follower_id = ? AND following_id = ?",
		[req.user.userId, req.params.userId],
		function (err) {
			if (err) {
				return res
					.status(500)
					.json({ error: "Error unfollowing user" });
			}
			res.json({ message: "User unfollowed successfully" });
		}
	);
});

// Get followers
app.get("/api/follows/followers/:userId", authenticateToken, (req, res) => {
	db.all(
		`SELECT u.id, u.username, u.avatar_url
     FROM follows f
     JOIN user_profiles u ON f.follower_id = u.id
     WHERE f.following_id = ?`,
		[req.params.userId],
		(err, users) => {
			if (err) {
				return res
					.status(500)
					.json({ error: "Error fetching followers" });
			}
			res.json(users);
		}
	);
});

// Get following
app.get("/api/follows/following/:userId", authenticateToken, (req, res) => {
	db.all(
		`SELECT u.id, u.username, u.avatar_url
     FROM follows f
     JOIN user_profiles u ON f.following_id = u.id
     WHERE f.follower_id = ?`,
		[req.params.userId],
		(err, users) => {
			if (err) {
				return res
					.status(500)
					.json({ error: "Error fetching following" });
			}
			res.json(users);
		}
	);
});

// == ALBUMS ROUTES ==

// Create album
app.post("/api/albums", authenticateToken, (req, res) => {
	const { title, description, is_public } = req.body;
	const albumId = generateId();

	db.run(
		"INSERT INTO albums (id, user_id, title, description, is_public) VALUES (?, ?, ?, ?, ?)",
		[albumId, req.user.userId, title, description, is_public ? 1 : 0],
		function (err) {
			if (err) {
				return res.status(500).json({ error: "Error creating album" });
			}

			db.get(
				"SELECT * FROM albums WHERE id = ?",
				[albumId],
				(err, album) => {
					if (err) {
						return res
							.status(500)
							.json({ error: "Error retrieving album" });
					}
					res.json(album);
				}
			);
		}
	);
});

// Get user's albums
app.get("/api/albums/user/:userId", authenticateToken, (req, res) => {
	const condition =
		req.params.userId === req.user.userId
			? "user_id = ?"
			: "user_id = ? AND is_public = 1";

	db.all(
		`SELECT * FROM albums WHERE ${condition} ORDER BY created_at DESC`,
		[req.params.userId],
		(err, albums) => {
			if (err) {
				return res.status(500).json({ error: "Error fetching albums" });
			}
			res.json(albums);
		}
	);
});

// Add post to album
app.post("/api/album-posts", authenticateToken, (req, res) => {
	const { album_id, post_id } = req.body;
	const albumPostId = generateId();

	// Verify user owns the album
	db.get(
		"SELECT * FROM albums WHERE id = ? AND user_id = ?",
		[album_id, req.user.userId],
		(err, album) => {
			if (err || !album) {
				return res
					.status(403)
					.json({ error: "Unauthorized or album not found" });
			}

			db.run(
				"INSERT INTO album_posts (id, album_id, post_id) VALUES (?, ?, ?)",
				[albumPostId, album_id, post_id],
				function (err) {
					if (err) {
						return res
							.status(500)
							.json({ error: "Error adding post to album" });
					}
					res.json({ message: "Post added to album successfully" });
				}
			);
		}
	);
});

// Get posts in album
app.get("/api/album-posts/:albumId", authenticateToken, (req, res) => {
	db.all(
		`SELECT p.*, u.username, u.avatar_url, ap.position
     FROM album_posts ap
     JOIN posts p ON ap.post_id = p.id
     JOIN user_profiles u ON p.user_id = u.id
     WHERE ap.album_id = ?
     ORDER BY ap.position, ap.created_at DESC`,
		[req.params.albumId],
		(err, posts) => {
			if (err) {
				return res
					.status(500)
					.json({ error: "Error fetching album posts" });
			}
			res.json(posts);
		}
	);
});

// == START SERVER ==

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
