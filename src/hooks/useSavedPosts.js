import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";

export function useSavedPosts(userId) {
	const [savedPostIds, setSavedPostIds] = useState(new Set());
	const [loading, setLoading] = useState(true);

	const loadSavedPosts = useCallback(async () => {
		if (!userId) {
			setLoading(false);
			return;
		}

		try {
			const { data, error } = await supabase
				.from("saved_posts")
				.select("post_id")
				.eq("user_id", userId);

			if (error) throw error;

			const postIds = (data || []).map((item) => item.post_id);
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

	// Subscribe to real-time changes in saved_posts table
	useEffect(() => {
		if (!userId) return;

		const channel = supabase
			.channel(`saved-posts-${userId}`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "saved_posts",
					filter: `user_id=eq.${userId}`,
				},
				() => {
					// Reload saved posts when changes occur
					loadSavedPosts();
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [userId, loadSavedPosts]);

	// Listen for custom events to update immediately (before real-time sync)
	useEffect(() => {
		if (!userId) return;

		const handleSavedPostChanged = (event) => {
			const { userId: eventUserId, postId, action } = event.detail;

			// Only update if this event is for our user
			if (eventUserId !== userId) return;

			if (action === "saved") {
				setSavedPostIds((prev) => {
					// Only update if not already saved (avoid duplicates)
					if (prev.has(postId)) return prev;
					return new Set([...prev, postId]);
				});
			} else if (action === "unsaved") {
				setSavedPostIds((prev) => {
					// Only update if currently saved
					if (!prev.has(postId)) return prev;
					const newSet = new Set(prev);
					newSet.delete(postId);
					return newSet;
				});
			}
		};

		window.addEventListener("savedPostChanged", handleSavedPostChanged);
		return () => {
			window.removeEventListener("savedPostChanged", handleSavedPostChanged);
		};
	}, [userId]);

	const savePost = async (postId) => {
		if (!userId) return false;

		try {
			const { error } = await supabase
				.from("saved_posts")
				.insert({ user_id: userId, post_id: postId });

			if (error) throw error;

			setSavedPostIds((prev) => new Set([...prev, postId]));

			// Dispatch custom event to notify all hook instances immediately
			window.dispatchEvent(
				new CustomEvent("savedPostChanged", {
					detail: { userId, postId, action: "saved" },
				})
			);

			return true;
		} catch (error) {
			console.error("Error saving post:", error);
			return false;
		}
	};

	const unsavePost = async (postId) => {
		if (!userId) return false;

		try {
			const { error } = await supabase
				.from("saved_posts")
				.delete()
				.eq("user_id", userId)
				.eq("post_id", postId);

			if (error) throw error;

			setSavedPostIds((prev) => {
				const newSet = new Set(prev);
				newSet.delete(postId);
				return newSet;
			});

			// Dispatch custom event to notify all hook instances immediately
			window.dispatchEvent(
				new CustomEvent("savedPostChanged", {
					detail: { userId, postId, action: "unsaved" },
				})
			);

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
