-- RLS Performance Optimization Migration
-- Run this script to fix all RLS policies that use auth.uid() directly
-- This improves query performance by caching auth.uid() evaluation

-- ============================================
-- 1. User Profiles Table
-- ============================================
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
    ON user_profiles FOR INSERT
    WITH CHECK ((select auth.uid()) = id);

-- ============================================
-- 2. Saved Posts Table
-- ============================================
DROP POLICY IF EXISTS "Users can view own saved posts" ON saved_posts;
CREATE POLICY "Users can view own saved posts"
    ON saved_posts FOR SELECT
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can save posts" ON saved_posts;
CREATE POLICY "Users can save posts"
    ON saved_posts FOR INSERT
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can unsave posts" ON saved_posts;
CREATE POLICY "Users can unsave posts"
    ON saved_posts FOR DELETE
    USING ((select auth.uid()) = user_id);

-- ============================================
-- 3. Follows Table
-- ============================================
DROP POLICY IF EXISTS "Users can follow others" ON follows;
CREATE POLICY "Users can follow others"
    ON follows FOR INSERT
    WITH CHECK ((select auth.uid()) = follower_id);

DROP POLICY IF EXISTS "Users can unfollow" ON follows;
CREATE POLICY "Users can unfollow"
    ON follows FOR DELETE
    USING ((select auth.uid()) = follower_id);

-- ============================================
-- 4. Albums Table
-- ============================================
DROP POLICY IF EXISTS "Public albums are viewable by everyone" ON albums;
CREATE POLICY "Public albums are viewable by everyone"
    ON albums FOR SELECT
    USING (is_public = true OR (select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create albums" ON albums;
CREATE POLICY "Users can create albums"
    ON albums FOR INSERT
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own albums" ON albums;
CREATE POLICY "Users can update own albums"
    ON albums FOR UPDATE
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own albums" ON albums;
CREATE POLICY "Users can delete own albums"
    ON albums FOR DELETE
    USING ((select auth.uid()) = user_id);

-- ============================================
-- 5. Album Posts Table
-- ============================================
DROP POLICY IF EXISTS "Album posts are viewable if album is public" ON album_posts;
CREATE POLICY "Album posts are viewable if album is public"
    ON album_posts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM albums
            WHERE albums.id = album_posts.album_id
            AND (albums.is_public = true OR albums.user_id = (select auth.uid()))
        )
    );

DROP POLICY IF EXISTS "Users can add posts to own albums" ON album_posts;
CREATE POLICY "Users can add posts to own albums"
    ON album_posts FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM albums
            WHERE albums.id = album_posts.album_id
            AND albums.user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can remove posts from own albums" ON album_posts;
CREATE POLICY "Users can remove posts from own albums"
    ON album_posts FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM albums
            WHERE albums.id = album_posts.album_id
            AND albums.user_id = (select auth.uid())
        )
    );

-- ============================================
-- 6. Posts Table (if policy exists)
-- ============================================
DROP POLICY IF EXISTS "Allow users to update own posts" ON posts;
CREATE POLICY "Allow users to update own posts"
    ON posts FOR UPDATE
    USING ((select auth.uid()) = user_id);

-- ============================================
-- 7. Cleanup: Remove likes table if it exists
-- ============================================
-- Note: The likes table was removed from the schema as per project requirements.
-- Uncomment the line below if you want to drop the likes table:
-- DROP TABLE IF EXISTS public.likes CASCADE;
