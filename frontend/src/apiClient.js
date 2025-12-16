const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

class ApiClient {
	constructor() {
		this.baseURL = API_BASE_URL;
		this.token = localStorage.getItem("token");
	}

	setToken(token) {
		this.token = token;
		if (token) {
			localStorage.setItem("token", token);
		} else {
			localStorage.removeItem("token");
		}
	}

	getAuthHeaders() {
		return this.token ? { Authorization: `Bearer ${this.token}` } : {};
	}

	async request(endpoint, options = {}) {
		const url = `${this.baseURL}${endpoint}`;
		const config = {
			headers: {
				"Content-Type": "application/json",
				...this.getAuthHeaders(),
				...options.headers,
			},
			...options,
		};

		try {
			const response = await fetch(url, config);
			const data = await response.json();

			if (!response.ok) {
				throw new Error(
					data.error || `HTTP error! status: ${response.status}`
				);
			}

			return data;
		} catch (error) {
			console.error("API request failed:", error);
			throw error;
		}
	}

	// Auth methods
	async signUp(email, password) {
		return this.request("/api/auth/signup", {
			method: "POST",
			body: JSON.stringify({ email, password }),
		});
	}

	async signIn(email, password) {
		const response = await this.request("/api/auth/signin", {
			method: "POST",
			body: JSON.stringify({ email, password }),
		});
		if (response.token) {
			this.setToken(response.token);
		}
		return response;
	}

	async signOut() {
		this.setToken(null);
	}

	// User methods
	async getProfile() {
		return this.request("/api/user/profile");
	}

	async updateProfile(updates) {
		return this.request("/api/user/profile", {
			method: "PUT",
			body: JSON.stringify(updates),
		});
	}

	async uploadAvatar(formData) {
		const response = await fetch(`${this.baseURL}/api/user/avatar`, {
			method: "POST",
			headers: {
				...this.getAuthHeaders(),
			},
			body: formData,
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || "Upload failed");
		}

		return response.json();
	}

	async getUserByUsername(username) {
		return this.request(`/api/user/username/${username}`);
	}

	// Posts methods
	async getPosts(limit = 50, offset = 0) {
		return this.request(`/api/posts?limit=${limit}&offset=${offset}`);
	}

	async getPost(id) {
		return this.request(`/api/posts/${id}`);
	}

	async getUserPosts(userId) {
		return this.request(`/api/posts/user/${userId}`);
	}

	async getFollowingPosts() {
		return this.request("/api/posts/following");
	}

	async createPost(formData) {
		const response = await fetch(`${this.baseURL}/api/posts`, {
			method: "POST",
			headers: {
				...this.getAuthHeaders(),
			},
			body: formData,
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || "Post creation failed");
		}

		return response.json();
	}

	async updatePost(id, updates) {
		return this.request(`/api/posts/${id}`, {
			method: "PUT",
			body: JSON.stringify(updates),
		});
	}

	async deletePost(id) {
		return this.request(`/api/posts/${id}`, {
			method: "DELETE",
		});
	}

	// Saved posts methods
	async getSavedPosts() {
		return this.request("/api/saved-posts");
	}

	async savePost(postId) {
		return this.request("/api/saved-posts", {
			method: "POST",
			body: JSON.stringify({ post_id: postId }),
		});
	}

	async unsavePost(postId) {
		return this.request(`/api/saved-posts/${postId}`, {
			method: "DELETE",
		});
	}

	// Follows methods
	async followUser(userId) {
		return this.request("/api/follows", {
			method: "POST",
			body: JSON.stringify({ following_id: userId }),
		});
	}

	async unfollowUser(userId) {
		return this.request(`/api/follows/${userId}`, {
			method: "DELETE",
		});
	}

	async getFollowers(userId) {
		return this.request(`/api/follows/followers/${userId}`);
	}

	async getFollowing(userId) {
		return this.request(`/api/follows/following/${userId}`);
	}

	// Albums methods
	async createAlbum(albumData) {
		return this.request("/api/albums", {
			method: "POST",
			body: JSON.stringify(albumData),
		});
	}

	async getUserAlbums(userId) {
		return this.request(`/api/albums/user/${userId}`);
	}

	async addPostToAlbum(albumId, postId) {
		return this.request("/api/album-posts", {
			method: "POST",
			body: JSON.stringify({ album_id: albumId, post_id: postId }),
		});
	}

	async getAlbumPosts(albumId) {
		return this.request(`/api/album-posts/${albumId}`);
	}
}

export const apiClient = new ApiClient();
