import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";

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
			const { data: followingData, error: followingError } = await supabase
				.from("follows")
				.select("following_id")
				.eq("follower_id", userId);

			if (followingError) throw followingError;

			const ids = new Set((followingData || []).map((item) => item.following_id));
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
			const { count, error } = await supabase
				.from("follows")
				.select("*", { count: "exact", head: true })
				.eq("following_id", targetUserId);

			if (error) throw error;

			return count || 0;
		} catch (error) {
			console.error("Error loading followers count:", error);
			return 0;
		}
	}, []);

	useEffect(() => {
		loadFollowing();
	}, [loadFollowing]);

	// Subscribe to real-time changes
	useEffect(() => {
		if (!userId) return;

		const channel = supabase
			.channel(`follows-${userId}`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "follows",
					filter: `follower_id=eq.${userId}`,
				},
				() => {
					// Reload following when changes occur
					loadFollowing();
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [userId, loadFollowing]);

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
					const { error } = await supabase
						.from("follows")
						.delete()
						.eq("follower_id", userId)
						.eq("following_id", targetUserId);

					if (error) throw error;

					// Optimistically update state
					const newIds = new Set(followingIds);
					newIds.delete(targetUserId);
					setFollowingIds(newIds);
					setFollowingCount(newIds.size);

					if (import.meta.env.DEV) {
						console.debug("[useFollows] Unfollowed user:", targetUserId);
					}

					return false;
				} else {
					// Follow
					const { error } = await supabase
						.from("follows")
						.insert({
							follower_id: userId,
							following_id: targetUserId,
						});

					if (error) throw error;

					// Optimistically update state
					const newIds = new Set(followingIds);
					newIds.add(targetUserId);
					setFollowingIds(newIds);
					setFollowingCount(newIds.size);

					if (import.meta.env.DEV) {
						console.debug("[useFollows] Followed user:", targetUserId);
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
