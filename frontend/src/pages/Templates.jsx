import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Sparkles, 
  Upload,
  Trash2,
  Loader2,
  Image as ImageIcon,
  Download,
  Pencil
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const categories = [
  "Social Media",
  "E-commerce",
  "Restaurant",
  "Real Estate",
  "Fitness",
  "Fashion",
  "Technology",
  "Healthcare",
  "Education",
  "Other"
];

const Templates = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [form, setForm] = useState({
    name: "",
    category: "",
    image_url: "",
    description: "",
    ai_prompt: ""
  });
  const [generatedImage, setGeneratedImage] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await axios.get(`${API}/templates`, { withCredentials: true });
      setTemplates(res.data);
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const imageUrl = activeTab === "ai" && generatedImage 
      ? `data:${generatedImage.mime_type};base64,${generatedImage.image_data}`
      : form.image_url;
    
    if (!imageUrl) {
      toast.error("Please provide an image URL or generate one with AI");
      return;
    }

    try {
      await axios.post(`${API}/templates`, {
        name: form.name,
        category: form.category,
        image_url: imageUrl,
        description: form.description
      }, { withCredentials: true });
      toast.success("Template created!");
      setDialogOpen(false);
      resetForm();
      fetchTemplates();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create template");
    }
  };

  const generateImage = async () => {
    if (!form.ai_prompt) {
      toast.error("Please enter a prompt for AI generation");
      return;
    }
    
    setGenerating(true);
    try {
      const res = await axios.post(`${API}/ai/generate-image`, {
        prompt: form.ai_prompt,
        type: "image"
      }, { withCredentials: true });
      
      if (res.data.image_data) {
        setGeneratedImage(res.data);
        toast.success("Image generated successfully!");
      } else {
        toast.info(res.data.message || "No image generated");
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Image generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const deleteTemplate = async (templateId) => {
    try {
      await axios.delete(`${API}/templates/${templateId}`, { withCredentials: true });
      toast.success("Template deleted");
      fetchTemplates();
    } catch (err) {
      toast.error("Failed to delete template");
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      category: "",
      image_url: "",
      description: "",
      ai_prompt: ""
    });
    setGeneratedImage(null);
    setActiveTab("upload");
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
      <div className="space-y-6" data-testid="templates-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 font-heading">Templates</h2>
            <p className="text-slate-500 mt-1">Create templates manually or generate with AI</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate("/templates/editor")}
              data-testid="open-editor-btn"
            >
              <Pencil className="w-5 h-5 mr-2" />
              Design Editor
            </Button>
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" data-testid="create-template-btn">
                  <Plus className="w-5 h-5 mr-2" />
                  Quick Create
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading">Create Template</DialogTitle>
              </DialogHeader>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload" data-testid="upload-tab">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </TabsTrigger>
                  <TabsTrigger value="ai" data-testid="ai-tab">
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Generate
                  </TabsTrigger>
                </TabsList>
                
                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                  {/* Template Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Template Name</Label>
                      <Input
                        id="name"
                        placeholder="My Template"
                        className="mt-1.5"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                        data-testid="template-name-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })} modal={true}>
                        <SelectTrigger className="mt-1.5" data-testid="template-category-select">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent position="popper" sideOffset={5}>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe this template..."
                      className="mt-1.5"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      data-testid="template-description-input"
                    />
                  </div>

                  <TabsContent value="upload" className="mt-0 space-y-4">
                    <div>
                      <Label htmlFor="image_url">Image URL</Label>
                      <Input
                        id="image_url"
                        placeholder="https://..."
                        className="mt-1.5"
                        value={form.image_url}
                        onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                        data-testid="template-image-input"
                      />
                    </div>
                    {form.image_url && (
                      <div className="rounded-xl overflow-hidden border border-slate-200">
                        <img 
                          src={form.image_url} 
                          alt="Preview" 
                          className="w-full h-48 object-cover"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="ai" className="mt-0 space-y-4">
                    <div>
                      <Label htmlFor="ai_prompt">Describe the image you want</Label>
                      <Textarea
                        id="ai_prompt"
                        placeholder="A modern social media post for a coffee shop with warm colors, featuring a latte art and cozy atmosphere..."
                        className="mt-1.5 min-h-[100px]"
                        value={form.ai_prompt}
                        onChange={(e) => setForm({ ...form, ai_prompt: e.target.value })}
                        data-testid="ai-prompt-input"
                      />
                    </div>
                    <Button 
                      type="button"
                      onClick={generateImage}
                      disabled={generating}
                      className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white"
                      data-testid="generate-image-btn"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate with AI
                        </>
                      )}
                    </Button>
                    {generatedImage && (
                      <div className="rounded-xl overflow-hidden border border-slate-200">
                        <img 
                          src={`data:${generatedImage.mime_type};base64,${generatedImage.image_data}`}
                          alt="Generated" 
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-3 bg-slate-50 text-sm text-slate-600">
                          {generatedImage.text}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <Button 
                    type="submit" 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                    data-testid="save-template-btn"
                  >
                    Save Template
                  </Button>
                </form>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <Card className="border-slate-100 shadow-card">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 font-heading">No templates yet</h3>
              <p className="text-slate-500 mt-1">Upload your own or generate with AI</p>
              <Button 
                className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {templates.map((template) => (
              <Card 
                key={template.template_id} 
                className="template-card group"
              >
                <div className="aspect-square relative">
                  <img 
                    src={template.image_url} 
                    alt={template.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x400?text=No+Image';
                    }}
                  />
                  <div className="template-card-overlay">
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary">
                        <Download className="w-4 h-4 mr-1" />
                        Use
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => deleteTemplate(template.template_id)}
                        data-testid={`delete-template-${template.template_id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {template.is_ai_generated && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-violet-500 text-white rounded-full text-xs flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-slate-900 truncate">{template.name}</h3>
                  <p className="text-sm text-slate-500">{template.category}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Templates;
