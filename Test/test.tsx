import React, { useState, useEffect } from 'react';
import { Search, Plus, User, Heart, Bookmark, Share2, X, Upload, Volume2, Grid, LogIn } from 'lucide-react';

// Firebase Configuration
// TODO: Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Firebase service placeholders - will be initialized when Firebase SDK is added
let auth = null;
let storage = null;
let firestore = null;

// Initialize Firebase (uncomment when Firebase SDK is added)
/*
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);
auth = getAuth(app);
storage = getStorage(app);
firestore = getFirestore(app);
*/

const App = () => {
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredPost, setHoveredPost] = useState(null);

  // Auth state
  const [isSignUp, setIsSignUp] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Upload state
  const [uploadImage, setUploadImage] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadAudio, setUploadAudio] = useState(null);
  const [uploadAudioName, setUploadAudioName] = useState('');
  const [uploading, setUploading] = useState(false);

  // Load posts on mount (available to everyone)
  useEffect(() => {
    loadPosts();

    // Firebase Auth State Listener (uncomment when Firebase is added)
    /*
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
    */
  }, []);

  // Load posts from storage (or Firestore when integrated)
  const loadPosts = async () => {
    try {
      // Using persistent storage for demo
      const storedPosts = await window.storage.list('post:', false);
      if (storedPosts && storedPosts.keys) {
        const loadedPosts = await Promise.all(
          storedPosts.keys.map(async (key) => {
            try {
              const result = await window.storage.get(key, false);
              return result ? JSON.parse(result.value) : null;
            } catch {
              return null;
            }
          })
        );
        setPosts(loadedPosts.filter(p => p !== null).sort((a, b) => b.timestamp - a.timestamp));
      }

      // Firebase Firestore real-time listener (uncomment when Firebase is added)
      /*
      const postsQuery = query(collection(firestore, 'posts'), orderBy('timestamp', 'desc'));
      const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
        const postsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPosts(postsData);
      });
      return unsubscribe;
      */
    } catch (error) {
      console.log('No posts yet');
    }
  };

  // Firebase Authentication
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');

    try {
      // Mock auth for demo
      setUser({ email: authEmail, uid: 'user123' });
      setShowAuthModal(false);
      setAuthEmail('');
      setAuthPassword('');

      // Firebase Auth (uncomment when Firebase is added)
      /*
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      }
      setShowAuthModal(false);
      setAuthEmail('');
      setAuthPassword('');
      */
    } catch (error) {
      setAuthError(error.message || 'Authentication failed');
    }
  };

  const handleSignOut = async () => {
    // Mock sign out
    setUser(null);

    // Firebase sign out (uncomment when Firebase is added)
    /*
    await signOut(auth);
    */
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadImage(file);
        setUploadPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAudioSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadAudio(file);
      setUploadAudioName(file.name);
    }
  };

  const handleUpload = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!uploadPreview) {
      alert('Please select an image');
      return;
    }

    setUploading(true);

    try {
      // Demo: Save to persistent storage
      const newPost = {
        id: `post_${Date.now()}`,
        imageUrl: uploadPreview,
        title: uploadTitle,
        caption: uploadCaption,
        audioName: uploadAudioName,
        timestamp: Date.now(),
        userId: user.uid,
        userEmail: user.email
      };

      await window.storage.set(`post:${newPost.id}`, JSON.stringify(newPost), false);
      setPosts(prev => [newPost, ...prev]);

      // Firebase Storage + Firestore (uncomment when Firebase is added)
      /*
      // Upload image to Firebase Storage
      const imageRef = ref(storage, `images/${user.uid}/${Date.now()}_${uploadImage.name}`);
      await uploadBytes(imageRef, uploadImage);
      const imageUrl = await getDownloadURL(imageRef);

      // Upload audio if present
      let audioUrl = null;
      if (uploadAudio) {
        const audioRef = ref(storage, `audio/${user.uid}/${Date.now()}_${uploadAudio.name}`);
        await uploadBytes(audioRef, uploadAudio);
        audioUrl = await getDownloadURL(audioRef);
      }

      // Save post metadata to Firestore
      await addDoc(collection(firestore, 'posts'), {
        imageUrl,
        audioUrl,
        audioName: uploadAudioName,
        title: uploadTitle,
        caption: uploadCaption,
        userId: user.uid,
        userEmail: user.email,
        timestamp: serverTimestamp()
      });
      */

      // Reset form
      setUploadImage(null);
      setUploadPreview(null);
      setUploadCaption('');
      setUploadTitle('');
      setUploadAudio(null);
      setUploadAudioName('');
      setShowUpload(false);
    } catch (error) {
      alert('Error saving post: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateClick = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      setShowUpload(true);
    }
  };

  const MasonryGrid = ({ posts }) => {
    const columns = 4;
    const columnPosts = Array.from({ length: columns }, () => []);

    posts.forEach((post, idx) => {
      columnPosts[idx % columns].push(post);
    });

    return (
      <div className="flex gap-4">
        {columnPosts.map((columnItems, columnIdx) => (
          <div key={columnIdx} className="flex-1 flex flex-col gap-4">
            {columnItems.map((post) => (
              <div
                key={post.id}
                className="relative group cursor-pointer break-inside-avoid"
                onMouseEnter={() => setHoveredPost(post.id)}
                onMouseLeave={() => setHoveredPost(null)}
                onClick={() => setSelectedPost(post)}
              >
                <div className="relative overflow-hidden rounded-2xl bg-gray-100">
                  <img
                    src={post.imageUrl}
                    alt={post.title || 'Memory'}
                    className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-300 ${hoveredPost === post.id ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      {post.title && (
                        <h3 className="text-white font-semibold text-lg mb-1">{post.title}</h3>
                      )}
                      {post.caption && (
                        <p className="text-white/90 text-sm line-clamp-2">{post.caption}</p>
                      )}
                    </div>

                    <div className="absolute top-4 right-4 flex gap-2">
                      {post.audioName && (
                        <button className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors">
                          <Volume2 className="w-5 h-5 text-gray-800" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!user) setShowAuthModal(true);
                        }}
                        className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                      >
                        <Bookmark className="w-5 h-5 text-gray-800" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-gray-900 cursor-pointer">LTME</h1>

            <div className="hidden md:flex items-center gap-6">
              <button className="text-gray-700 hover:text-gray-900 font-medium">Explore</button>
              <button className="text-gray-700 hover:text-gray-900 font-medium">Following</button>
            </div>
          </div>

          <div className="flex-1 max-w-2xl mx-8 hidden md:block">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search moments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleCreateClick}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Create</span>
            </button>

            {user ? (
              <div className="relative group">
                <button className="p-2.5 hover:bg-gray-100 rounded-full transition-colors">
                  <User className="w-6 h-6 text-gray-700" />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="p-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{user.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-900 text-gray-900 rounded-full hover:bg-gray-50 transition-colors font-medium"
              >
                <LogIn className="w-5 h-5" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </h2>
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  setAuthError('');
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 placeholder-gray-400"
              />
              <input
                type="password"
                placeholder="Password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 placeholder-gray-400"
              />

              {authError && (
                <p className="text-red-500 text-sm">{authError}</p>
              )}

              <button
                onClick={handleAuth}
                className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </button>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAuthError('');
                }}
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900">Create New Moment</h2>
              <button
                onClick={() => setShowUpload(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex items-center justify-center w-full h-96 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-gray-400 transition-colors bg-gray-50"
                  >
                    {uploadPreview ? (
                      <img
                        src={uploadPreview}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      <div className="text-center">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">Click to upload</p>
                        <p className="text-gray-400 text-sm mt-1">or drag and drop</p>
                      </div>
                    )}
                  </label>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="Give it a title"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Caption
                    </label>
                    <textarea
                      value={uploadCaption}
                      onChange={(e) => setUploadCaption(e.target.value)}
                      placeholder="Tell your story..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 placeholder-gray-400 resize-none"
                      rows="6"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Audio (Optional)
                    </label>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioSelect}
                      className="hidden"
                      id="audio-upload"
                    />
                    <label
                      htmlFor="audio-upload"
                      className="flex items-center justify-center w-full px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <Volume2 className="w-5 h-5 text-gray-600 mr-2" />
                      <span className="text-gray-700">
                        {uploadAudioName || 'Add voice note'}
                      </span>
                    </label>
                  </div>

                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Publishing...' : 'Publish'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setSelectedPost(null)}>
          <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="grid md:grid-cols-2 h-full max-h-[90vh]">
              <div className="bg-black flex items-center justify-center">
                <img
                  src={selectedPost.imageUrl}
                  alt={selectedPost.title}
                  className="max-w-full max-h-[90vh] object-contain"
                />
              </div>

              <div className="flex flex-col overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {selectedPost.userEmail ? selectedPost.userEmail.split('@')[0] : 'User'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(selectedPost.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-600" />
                  </button>
                </div>

                <div className="p-6 flex-1">
                  {selectedPost.title && (
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">{selectedPost.title}</h2>
                  )}
                  {selectedPost.caption && (
                    <p className="text-gray-700 leading-relaxed mb-6">{selectedPost.caption}</p>
                  )}
                  {selectedPost.audioName && (
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <Volume2 className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700 text-sm">{selectedPost.audioName}</span>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-gray-200 flex items-center gap-4">
                  <button
                    onClick={() => !user && setShowAuthModal(true)}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Heart className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700 font-medium">Save</span>
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Share2 className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700 font-medium">Share</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gallery */}
      <main className="max-w-screen-2xl mx-auto px-6 pt-24 pb-12">
        {posts.length === 0 ? (
          <div className="text-center py-32">
            <Grid className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to LTME</h2>
            <p className="text-gray-500 mb-8 text-lg">Discover and share meaningful moments</p>
            <button
              onClick={handleCreateClick}
              className="px-8 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
            >
              {user ? 'Create Your First Moment' : 'Sign In to Share'}
            </button>
          </div>
        ) : (
          <MasonryGrid posts={posts} />
        )}
      </main>
    </div>
  );
};

export default App;
