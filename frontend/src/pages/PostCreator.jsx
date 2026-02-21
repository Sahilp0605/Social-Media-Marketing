import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  Sparkles, 
  Hash, 
  Image as ImageIcon,
  Calendar,
  Send,
  Save,
  Trash2,
  Instagram,
  Facebook,
  Linkedin,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { API } from "@/App";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const platforms = [
  { id: "instagram", name: "Instagram", icon: Instagram, color: "from-pink-500 to-orange-400" },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "from-blue-600 to-blue-500" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "from-blue-700 to-blue-600" },
];

const PostCreator = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generating, setGenerating] = useState({ caption: false, hashtags: false });
  const [form, setForm] = useState({
    title: "",
    caption: "",
    hashtags: [],
    hashtagInput: "",
    platforms: [],
    image_url: "",
    scheduled_at: "",
    status: "draft"
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API}/posts`, { withCredentials: true });
      setPosts(res.data);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title,
        caption: form.caption,
        hashtags: form.hashtags,
        platforms: form.platforms,
        image_url: form.image_url || null,
        scheduled_at: form.scheduled_at || null,
        status: form.status
      };
      await axios.post(`${API}/posts`, payload, { withCredentials: true });
      toast.success("Post created successfully!");
      setDialogOpen(false);
      resetForm();
      fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create post");
    }
  };

  const deletePost = async (postId) => {
    try {
      await axios.delete(`${API}/posts/${postId}`, { withCredentials: true });
      toast.success("Post deleted");
      fetchPosts();
    } catch (err) {
      toast.error("Failed to delete post");
    }
  };

  const resetForm = () => {
    setForm({
      title: "",
      caption: "",
      hashtags: [],
      hashtagInput: "",
      platforms: [],
      image_url: "",
      scheduled_at: "",
      status: "draft"
    });
  };

  const generateAI = async (type) => {
    if (!form.title && !form.caption) {
      toast.error("Please enter a title or caption first");
      return;
    }
    
    setGenerating({ ...generating, [type]: true });
    try {
      const res = await axios.post(`${API}/ai/generate`, {
        prompt: form.title || form.caption,
        type: type
      }, { withCredentials: true });
      
      if (type === "caption") {
        setForm({ ...form, caption: res.data.result });
        toast.success("Caption generated!");
      } else if (type === "hashtags") {
        const tags = res.data.result.match(/#[\w]+/g) || [];
        setForm({ ...form, hashtags: [...form.hashtags, ...tags.map(t => t.replace('#', ''))] });
        toast.success("Hashtags generated!");
      }
    } catch (err) {
      toast.error("AI generation failed");
    } finally {
      setGenerating({ ...generating, [type]: false });
    }
  };

  const addHashtag = () => {
    if (form.hashtagInput.trim()) {
      const tag = form.hashtagInput.replace('#', '').trim();
      if (!form.hashtags.includes(tag)) {
        setForm({ ...form, hashtags: [...form.hashtags, tag], hashtagInput: "" });
      }
    }
  };

  const removeHashtag = (tag) => {
    setForm({ ...form, hashtags: form.hashtags.filter(t => t !== tag) });
  };

  const togglePlatform = (platformId) => {
    const current = form.platforms;
    if (current.includes(platformId)) {
      setForm({ ...form, platforms: current.filter(p => p !== platformId) });
    } else {
      setForm({ ...form, platforms: [...current, platformId] });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="posts-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 font-heading">Post Creator</h2>
            <p className="text-slate-500 mt-1">Create and schedule social media posts with AI assistance</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" data-testid="create-post-btn">
                <Plus className="w-5 h-5 mr-2" />
                Create Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading">Create New Post</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                {/* Title */}
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Post title or topic..."
                    className="mt-1.5"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                    data-testid="post-title-input"
                  />
                </div>

                {/* Caption with AI */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label htmlFor="caption">Caption</Label>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="sm"
                      className="text-violet-600 hover:text-violet-700"
                      onClick={() => generateAI("caption")}
                      disabled={generating.caption}
                      data-testid="ai-caption-btn"
                    >
                      {generating.caption ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-1" />
                      )}
                      Generate with AI
                    </Button>
                  </div>
                  <Textarea
                    id="caption"
                    placeholder="Write your caption..."
                    className="min-h-[120px]"
                    value={form.caption}
                    onChange={(e) => setForm({ ...form, caption: e.target.value })}
                    required
                    data-testid="post-caption-input"
                  />
                </div>

                {/* Hashtags */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label>Hashtags</Label>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="sm"
                      className="text-violet-600 hover:text-violet-700"
                      onClick={() => generateAI("hashtags")}
                      disabled={generating.hashtags}
                      data-testid="ai-hashtags-btn"
                    >
                      {generating.hashtags ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Hash className="w-4 h-4 mr-1" />
                      )}
                      Suggest Hashtags
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add hashtag..."
                      value={form.hashtagInput}
                      onChange={(e) => setForm({ ...form, hashtagInput: e.target.value })}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
                      data-testid="hashtag-input"
                    />
                    <Button type="button" variant="outline" onClick={addHashtag}>Add</Button>
                  </div>
                  {form.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.hashtags.map((tag, idx) => (
                        <span 
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm"
                        >
                          #{tag}
                          <button 
                            type="button" 
                            onClick={() => removeHashtag(tag)}
                            className="hover:text-indigo-900"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Image URL */}
                <div>
                  <Label htmlFor="image_url">Image URL (optional)</Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      id="image_url"
                      placeholder="https://..."
                      value={form.image_url}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                      data-testid="post-image-input"
                    />
                    <Button type="button" variant="outline">
                      <ImageIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Platforms */}
                <div>
                  <Label className="mb-2 block">Platforms</Label>
                  <div className="flex gap-3">
                    {platforms.map((platform) => (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => togglePlatform(platform.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                          form.platforms.includes(platform.id)
                            ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                        data-testid={`platform-${platform.id}`}
                      >
                        <div className={`w-6 h-6 rounded bg-gradient-to-r ${platform.color} flex items-center justify-center`}>
                          <platform.icon className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-sm font-medium">{platform.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Schedule */}
                <div>
                  <Label htmlFor="scheduled_at">Schedule (optional)</Label>
                  <Input
                    id="scheduled_at"
                    type="datetime-local"
                    className="mt-1.5"
                    value={form.scheduled_at}
                    onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                    data-testid="post-schedule-input"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                    data-testid="save-post-btn"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Draft
                  </Button>
                  <Button 
                    type="button" 
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white"
                    onClick={() => { setForm({ ...form, status: 'published' }); }}
                    data-testid="publish-post-btn"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Publish Now
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Posts List */}
        {posts.length === 0 ? (
          <Card className="border-slate-100 shadow-card">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 font-heading">No posts yet</h3>
              <p className="text-slate-500 mt-1">Create your first post with AI-powered captions</p>
              <Button 
                className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Post
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Card key={post.post_id} className="border-slate-100 shadow-card hover:shadow-card-hover transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-slate-900 font-heading">{post.title}</h3>
                    <span className={`status-badge ${
                      post.status === 'published' ? 'status-published' : 
                      post.status === 'scheduled' ? 'status-scheduled' : 'status-draft'
                    }`}>
                      {post.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-3">{post.caption}</p>
                  
                  {post.hashtags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {post.hashtags.slice(0, 4).map((tag, idx) => (
                        <span key={idx} className="text-xs text-indigo-600">#{tag}</span>
                      ))}
                      {post.hashtags.length > 4 && (
                        <span className="text-xs text-slate-400">+{post.hashtags.length - 4}</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                    <div className="flex gap-1">
                      {post.platforms?.map((p) => {
                        const platform = platforms.find(pl => pl.id === p);
                        if (!platform) return null;
                        return (
                          <div 
                            key={p} 
                            className={`w-6 h-6 rounded bg-gradient-to-r ${platform.color} flex items-center justify-center`}
                          >
                            <platform.icon className="w-3 h-3 text-white" />
                          </div>
                        );
                      })}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => deletePost(post.post_id)}
                      data-testid={`delete-post-${post.post_id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PostCreator;
