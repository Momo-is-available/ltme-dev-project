-- LTME Database Schema
-- Run these SQL commands in your Supabase SQL Editor

-- ============================================
-- 1. User Profiles Table
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all profiles
CREATE POLICY "Public profiles are viewable by everyone"
    ON user_profiles FOR SELECT
    USING (true);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING ((select auth.uid()) = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON user_profiles FOR INSERT
    WITH CHECK ((select auth.uid()) = id);

-- Function to automatically create a user profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    base_username TEXT;
    final_username TEXT;
    counter INTEGER := 0;
BEGIN
    -- Extract base username from email (before @)
    base_username := SPLIT_PART(NEW.email, '@', 1);

    -- If base username is empty or null, use user ID prefix
    IF base_username IS NULL OR base_username = '' THEN
        base_username := 'user_' || SUBSTRING(NEW.id::text, 1, 8);
    END IF;

    -- Clean username (remove special characters, lowercase)
    base_username := LOWER(REGEXP_REPLACE(base_username, '[^a-z0-9_]', '', 'g'));

    -- Ensure username starts with a letter or number
    IF base_username = '' OR NOT (base_username ~ '^[a-z0-9]') THEN
        base_username := 'user_' || SUBSTRING(NEW.id::text, 1, 8);
    END IF;

    final_username := base_username;

    -- Handle username conflicts by appending numbers
    WHILE EXISTS (SELECT 1 FROM public.user_profiles WHERE username = final_username) LOOP
        counter := counter + 1;
        final_username := base_username || counter::TEXT;
    END LOOP;

    -- Insert the profile
    INSERT INTO public.user_profiles (id, username, created_at)
    VALUES (NEW.id, final_username, NOW())
    ON CONFLICT (id) DO NOTHING; -- Prevent errors if profile already exists

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- IMPORTANT: For existing users who signed up before this trigger was added,
-- run this migration to create their profiles:
-- ============================================
-- Migration for existing users: safely handle username collisions without casting '' as bigint

WITH base as (
    SELECT
        au.id,
        LOWER(REGEXP_REPLACE(SPLIT_PART(au.email, '@', 1), '[^a-z0-9_]', '', 'g')) AS clean_username,
        au.created_at
    FROM auth.users au
    WHERE NOT EXISTS (
        SELECT 1 FROM public.user_profiles WHERE id = au.id
    )
),
usernames as (
    SELECT
        b.id,
        b.created_at,
        COALESCE(
            NULLIF(b.clean_username, ''),
            'user_' || SUBSTRING(b.id::text, 1, 8)
        ) AS base_username
    FROM base b
),
finals as (
    SELECT
        u.id,
        -- If username collision: append an incrementing number;
        -- else, use base_username
        (
            SELECT
                CASE
                    WHEN COUNT(*) = 0 THEN u.base_username
                    ELSE
                        u.base_username || (COUNT(*)+1)::TEXT
                END
            FROM public.user_profiles p
            WHERE p.username LIKE u.base_username || '%'
        ) AS final_username,
        u.created_at
    FROM usernames u
)
INSERT INTO public.user_profiles (id, username, created_at)
SELECT id, final_username, created_at
FROM finals
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. Saved Posts Table
-- ============================================
CREATE TABLE IF NOT EXISTS saved_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- Enable RLS
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own saved posts
CREATE POLICY "Users can view own saved posts"
    ON saved_posts FOR SELECT
    USING ((select auth.uid()) = user_id);

-- Policy: Users can save posts
CREATE POLICY "Users can save posts"
    ON saved_posts FOR INSERT
    WITH CHECK ((select auth.uid()) = user_id);

-- Policy: Users can unsave posts
CREATE POLICY "Users can unsave posts"
    ON saved_posts FOR DELETE
    USING ((select auth.uid()) = user_id);

-- ============================================
-- 3. Following/Followers Table
-- ============================================
CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Enable RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all follows
CREATE POLICY "Follows are viewable by everyone"
    ON follows FOR SELECT
    USING (true);

-- Policy: Users can follow others
CREATE POLICY "Users can follow others"
    ON follows FOR INSERT
    WITH CHECK ((select auth.uid()) = follower_id);

-- Policy: Users can unfollow
CREATE POLICY "Users can unfollow"
    ON follows FOR DELETE
    USING ((select auth.uid()) = follower_id);

-- ============================================
-- 4. Albums/Collections Table (for organizing photos)
-- ============================================
CREATE TABLE IF NOT EXISTS albums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

-- Policy: Public albums are viewable by everyone
CREATE POLICY "Public albums are viewable by everyone"
    ON albums FOR SELECT
    USING (is_public = true OR (select auth.uid()) = user_id);

-- Policy: Users can create albums
CREATE POLICY "Users can create albums"
    ON albums FOR INSERT
    WITH CHECK ((select auth.uid()) = user_id);

-- Policy: Users can update own albums
CREATE POLICY "Users can update own albums"
    ON albums FOR UPDATE
    USING ((select auth.uid()) = user_id);

-- Policy: Users can delete own albums
CREATE POLICY "Users can delete own albums"
    ON albums FOR DELETE
    USING ((select auth.uid()) = user_id);

-- ============================================
-- 5. Album Posts Junction Table
-- ============================================
CREATE TABLE IF NOT EXISTS album_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(album_id, post_id)
);

-- Enable RLS
ALTER TABLE album_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Album posts are viewable by everyone (if album is public)
CREATE POLICY "Album posts are viewable if album is public"
    ON album_posts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM albums
            WHERE albums.id = album_posts.album_id
            AND (albums.is_public = true OR albums.user_id = (select auth.uid()))
        )
    );

-- Policy: Users can add posts to own albums
CREATE POLICY "Users can add posts to own albums"
    ON album_posts FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM albums
            WHERE albums.id = album_posts.album_id
            AND albums.user_id = (select auth.uid())
        )
    );

-- Policy: Users can remove posts from own albums
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
-- 6. Posts Table RLS Policies (Performance Optimization)
-- ============================================
-- Fix RLS policy for posts table if it exists
-- Note: If you have a policy "Allow users to update own posts", update it with:
-- DROP POLICY IF EXISTS "Allow users to update own posts" ON posts;
-- CREATE POLICY "Allow users to update own posts"
--     ON posts FOR UPDATE
--     USING ((select auth.uid()) = user_id);

-- ============================================
-- 7. Update Posts Table (add missing columns)
-- ============================================
-- Add columns if they don't exist
DO $$
BEGIN
    -- Add view_count if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='posts' AND column_name='view_count') THEN
        ALTER TABLE posts ADD COLUMN view_count INTEGER DEFAULT 0;
    END IF;

    -- Add tags if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='posts' AND column_name='tags') THEN
        ALTER TABLE posts ADD COLUMN tags TEXT[];
    END IF;
END $$;

-- ============================================
-- 8. Functions for updating counts
-- ============================================

-- Function to increment view_count
CREATE OR REPLACE FUNCTION increment_post_view_count(post_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE posts SET view_count = view_count + 1 WHERE id = post_uuid;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_saved_posts_user_id ON saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_post_id ON saved_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_albums_user_id ON albums(user_id);
CREATE INDEX IF NOT EXISTS idx_album_posts_album_id ON album_posts(album_id);
CREATE INDEX IF NOT EXISTS idx_album_posts_post_id ON album_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- ============================================
-- 10. Cleanup: Remove likes table if it exists
-- ============================================
-- Note: The likes table was removed from this schema as per project requirements.
-- If you have an existing likes table, you can drop it with:
-- DROP TABLE IF EXISTS public.likes CASCADE;
-- This will also remove any RLS policies associated with it.
