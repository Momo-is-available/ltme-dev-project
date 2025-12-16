import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../apiClient";

export function useSavedPosts(userId) {
	const [savedPostIds, setSavedPostIds] = useState(new Set());
	const [loading, setLoading] = useState(true);

	const loadSavedPosts = useCallback(async () => {
		if (!userId) {
			setLoading(false);
			return;
		}

		try {
			const savedPosts = await apiClient.getSavedPosts();
			const postIds = savedPosts.map((post) => post.id);
			setSavedPostIds(new Set(postIds));

			if (import.meta.env.DEV) {
				console.debug("[useSavedPosts] Loaded saved posts:", {
					userId,
					count: postIds.length,
					postIds,
				});
			}
		} catch (error) {
			console.error("Error loading saved posts:", error);
		} finally {
			setLoading(false);
		}
	}, [userId]);

	useEffect(() => {
		loadSavedPosts();
	}, [loadSavedPosts]);

	const savePost = async (postId) => {
		if (!userId) return false;

		try {
			await apiClient.savePost(postId);
			setSavedPostIds((prev) => new Set([...prev, postId]));
			return true;
		} catch (error) {
			console.error("Error saving post:", error);
			return false;
		}
	};

	const unsavePost = async (postId) => {
		if (!userId) return false;

		try {
			await apiClient.unsavePost(postId);
			setSavedPostIds((prev) => {
				const newSet = new Set(prev);
				newSet.delete(postId);
				return newSet;
			});
			return true;
		} catch (error) {
			console.error("Error unsaving post:", error);
			return false;
		}
	};

	const toggleSave = async (postId) => {
		const isSaved = savedPostIds.has(postId);
		if (isSaved) {
			return await unsavePost(postId);
		} else {
			return await savePost(postId);
		}
	};

	const isSaved = (postId) => savedPostIds.has(postId);

	return {
		savedPostIds: Array.from(savedPostIds),
		isSaved,
		savePost,
		unsavePost,
		toggleSave,
		loading,
	};
}
