import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../apiClient";

/**
 * Custom hook to manage follow/unfollow functionality
 * @param {string} userId - The current user's ID
 * @returns {object} - { followingIds, followersCount, followingCount, isFollowing, toggleFollow, loading }
 */
export function useFollows(userId) {
	const [followingIds, setFollowingIds] = useState(new Set());
	const [followersCount, setFollowersCount] = useState(0);
	const [followingCount, setFollowingCount] = useState(0);
	const [loading, setLoading] = useState(true);

	const loadFollowing = useCallback(async () => {
		if (!userId) {
			setLoading(false);
			return;
		}

		try {
			// Load who the current user is following
			const following = await apiClient.getFollowing(userId);
			const ids = new Set(following.map((user) => user.id));
			setFollowingIds(ids);
			setFollowingCount(ids.size);

			if (import.meta.env.DEV) {
				console.debug("[useFollows] Loaded following:", {
					userId,
					count: ids.size,
					followingIds: Array.from(ids),
				});
			}
		} catch (error) {
			console.error("Error loading following:", error);
			setFollowingIds(new Set());
			setFollowingCount(0);
		} finally {
			setLoading(false);
		}
	}, [userId]);

	const loadFollowersCount = useCallback(async (targetUserId) => {
		if (!targetUserId) return 0;

		try {
			const followers = await apiClient.getFollowers(targetUserId);
			return followers.length;
		} catch (error) {
			console.error("Error loading followers count:", error);
			return 0;
		}
	}, []);

	useEffect(() => {
		loadFollowing();
	}, [loadFollowing]);

	// TODO: Add real-time updates when backend supports WebSocket subscriptions

	/**
	 * Check if current user is following a specific user
	 * @param {string} targetUserId - The user ID to check
	 * @returns {boolean}
	 */
	const isFollowing = useCallback(
		(targetUserId) => {
			if (!targetUserId || !userId) return false;
			return followingIds.has(targetUserId);
		},
		[followingIds, userId]
	);

	/**
	 * Toggle follow/unfollow for a user
	 * @param {string} targetUserId - The user ID to follow/unfollow
	 * @returns {Promise<boolean>} - Returns true if now following, false if unfollowed
	 */
	const toggleFollow = useCallback(
		async (targetUserId) => {
			if (!userId || !targetUserId || userId === targetUserId) {
				return false;
			}

			const currentlyFollowing = followingIds.has(targetUserId);

			try {
				if (currentlyFollowing) {
					// Unfollow
					await apiClient.unfollowUser(targetUserId);

					// Optimistically update state
					const newIds = new Set(followingIds);
					newIds.delete(targetUserId);
					setFollowingIds(newIds);
					setFollowingCount(newIds.size);

					if (import.meta.env.DEV) {
						console.debug(
							"[useFollows] Unfollowed user:",
							targetUserId
						);
					}

					return false;
				} else {
					// Follow
					await apiClient.followUser(targetUserId);

					// Optimistically update state
					const newIds = new Set(followingIds);
					newIds.add(targetUserId);
					setFollowingIds(newIds);
					setFollowingCount(newIds.size);

					if (import.meta.env.DEV) {
						console.debug(
							"[useFollows] Followed user:",
							targetUserId
						);
					}

					return true;
				}
			} catch (error) {
				console.error("Error toggling follow:", error);
				// Reload to sync state
				loadFollowing();
				throw error;
			}
		},
		[userId, followingIds, loadFollowing]
	);

	return {
		followingIds: Array.from(followingIds),
		followingCount,
		isFollowing,
		toggleFollow,
		loading,
		loadFollowersCount,
	};
}
