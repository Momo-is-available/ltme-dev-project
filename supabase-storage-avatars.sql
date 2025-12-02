-- ============================================
-- Avatars Storage Bucket Setup
-- Run these SQL commands in your Supabase SQL Editor
-- ============================================

-- Create the avatars storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true, -- Public bucket so avatars can be viewed by anyone
    5242880, -- 5MB file size limit (in bytes)
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'] -- Allowed image types
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage Policies for Avatars Bucket
-- ============================================

-- Policy: Anyone can view avatars (public read)
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Policy: Authenticated users can upload their own avatars
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Policy: Users can update their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Policy: Users can delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
);
