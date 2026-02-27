import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  Type, 
  Image as ImageIcon,
  Square,
  Circle,
  Trash2,
  Download,
  Save,
  ArrowLeft,
  Palette,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCw
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { API } from "@/App";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fabric } from "fabric";

const TemplateEditor = () => {
  const navigate = useNavigate();
  const { templateId } = useParams();
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [template, setTemplate] = useState(null);
  const [templateName, setTemplateName] = useState("");
  const [category, setCategory] = useState("Social Media");
  const [activeObject, setActiveObject] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 600 });
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");

  const categories = [
    "Social Media", "E-commerce", "Restaurant", "Real Estate", 
    "Fitness", "Fashion", "Technology", "Healthcare", "Education", "Other"
  ];

  const presetSizes = [
    { name: "Instagram Post", width: 1080, height: 1080 },
    { name: "Instagram Story", width: 1080, height: 1920 },
    { name: "Facebook Post", width: 1200, height: 630 },
    { name: "LinkedIn Post", width: 1200, height: 627 },
    { name: "Twitter Post", width: 1200, height: 675 },
  ];

  useEffect(() => {
    initCanvas();
    if (templateId) {
      loadTemplate();
    }
    
    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
      }
    };
  }, [templateId]);

  const initCanvas = () => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
    }

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 600,
      height: 600,
      backgroundColor: '#ffffff',
      selection: true,
    });

    canvas.on('selection:created', (e) => setActiveObject(e.selected[0]));
    canvas.on('selection:updated', (e) => setActiveObject(e.selected[0]));
    canvas.on('selection:cleared', () => setActiveObject(null));

    fabricCanvasRef.current = canvas;
  };

  const loadTemplate = async () => {
    try {
      const res = await axios.get(`${API}/templates/${templateId}`);
      setTemplate(res.data);
      setTemplateName(res.data.name);
      setCategory(res.data.category);
      
      if (res.data.canvas_data) {
        fabricCanvasRef.current.loadFromJSON(res.data.canvas_data, () => {
          fabricCanvasRef.current.renderAll();
        });
      }
    } catch (err) {
      toast.error("Failed to load template");
    }
  };

  const addText = () => {
    const text = new fabric.IText('Your Text Here', {
      left: 100,
      top: 100,
      fontSize: 40,
      fill: '#1e293b',
      fontFamily: 'Inter',
    });
    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
  };

  const addShape = async (type) => {
    const fabric = (await import('fabric')).fabric;
    let shape;
    
    if (type === 'rect') {
      shape = new fabric.Rect({
        left: 100,
        top: 100,
        width: 150,
        height: 100,
        fill: '#4F46E5',
        rx: 10,
        ry: 10,
      });
    } else if (type === 'circle') {
      shape = new fabric.Circle({
        left: 100,
        top: 100,
        radius: 60,
        fill: '#8B5CF6',
      });
    }
    
    if (shape) {
      fabricCanvasRef.current.add(shape);
      fabricCanvasRef.current.setActiveObject(shape);
    }
  };

  const addImage = async (url) => {
    const fabric = (await import('fabric')).fabric;
    fabric.Image.fromURL(url, (img) => {
      img.scaleToWidth(300);
      fabricCanvasRef.current.add(img);
      fabricCanvasRef.current.setActiveObject(img);
    }, { crossOrigin: 'anonymous' });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        addImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const deleteSelected = () => {
    const activeObjects = fabricCanvasRef.current.getActiveObjects();
    activeObjects.forEach((obj) => {
      fabricCanvasRef.current.remove(obj);
    });
    fabricCanvasRef.current.discardActiveObject();
  };

  const updateObjectProperty = (property, value) => {
    if (activeObject) {
      activeObject.set(property, value);
      fabricCanvasRef.current.renderAll();
    }
  };

  const changeBackgroundColor = (color) => {
    setBackgroundColor(color);
    fabricCanvasRef.current.setBackgroundColor(color, () => {
      fabricCanvasRef.current.renderAll();
    });
  };

  const changeCanvasSize = (preset) => {
    const scale = 600 / Math.max(preset.width, preset.height);
    const displayWidth = preset.width * scale;
    const displayHeight = preset.height * scale;
    
    fabricCanvasRef.current.setDimensions({ width: displayWidth, height: displayHeight });
    setCanvasSize({ width: displayWidth, height: displayHeight });
  };

  const exportAsImage = () => {
    const dataURL = fabricCanvasRef.current.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2
    });
    
    const link = document.createElement('a');
    link.download = `${templateName || 'template'}.png`;
    link.href = dataURL;
    link.click();
  };

  const saveTemplate = async () => {
    if (!templateName) {
      toast.error("Please enter a template name");
      return;
    }

    const canvasJSON = JSON.stringify(fabricCanvasRef.current.toJSON());
    const imageURL = fabricCanvasRef.current.toDataURL({
      format: 'png',
      quality: 0.8,
      multiplier: 1
    });

    try {
      if (templateId) {
        await axios.put(`${API}/templates/${templateId}`, {
          name: templateName,
          category: category,
          image_url: imageURL,
          canvas_data: canvasJSON,
          description: ""
        });
        toast.success("Template updated!");
      } else {
        await axios.post(`${API}/templates`, {
          name: templateName,
          category: category,
          image_url: imageURL,
          canvas_data: canvasJSON,
          description: ""
        });
        toast.success("Template saved!");
      }
      navigate("/templates");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save template");
    }
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col" data-testid="template-editor-page">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/templates")} data-testid="back-btn">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <Input
                placeholder="Template name..."
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="font-semibold text-lg border-none shadow-none focus-visible:ring-0 p-0 h-auto"
                data-testid="template-name-input"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[150px]" data-testid="category-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportAsImage} data-testid="export-btn">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={saveTemplate} data-testid="save-template-btn">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        <div className="flex-1 flex gap-4 pt-4 overflow-hidden">
          {/* Left Toolbar */}
          <Card className="w-16 border-slate-200 shadow-card flex-shrink-0">
            <CardContent className="p-2 flex flex-col gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-full aspect-square"
                onClick={addText}
                title="Add Text"
                data-testid="add-text-btn"
              >
                <Type className="w-5 h-5" />
              </Button>
              <label className="cursor-pointer">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-full aspect-square pointer-events-none"
                  title="Add Image"
                >
                  <ImageIcon className="w-5 h-5" />
                </Button>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} data-testid="add-image-input" />
              </label>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-full aspect-square"
                onClick={() => addShape('rect')}
                title="Add Rectangle"
                data-testid="add-rect-btn"
              >
                <Square className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-full aspect-square"
                onClick={() => addShape('circle')}
                title="Add Circle"
                data-testid="add-circle-btn"
              >
                <Circle className="w-5 h-5" />
              </Button>
              <div className="border-t border-slate-200 my-2"></div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-full aspect-square text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={deleteSelected}
                title="Delete Selected"
                disabled={!activeObject}
                data-testid="delete-btn"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </CardContent>
          </Card>

          {/* Canvas Area */}
          <div className="flex-1 bg-slate-100 rounded-xl overflow-auto flex items-center justify-center p-4">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <canvas ref={canvasRef} data-testid="fabric-canvas" />
            </div>
          </div>

          {/* Right Panel - Properties */}
          <Card className="w-64 border-slate-200 shadow-card flex-shrink-0 overflow-y-auto">
            <CardContent className="p-4 space-y-6">
              {/* Canvas Settings */}
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Canvas</Label>
                <div className="mt-2 space-y-3">
                  <Select onValueChange={(v) => changeCanvasSize(presetSizes.find(p => p.name === v))}>
                    <SelectTrigger data-testid="size-preset-select">
                      <SelectValue placeholder="Size preset" />
                    </SelectTrigger>
                    <SelectContent>
                      {presetSizes.map((preset) => (
                        <SelectItem key={preset.name} value={preset.name}>
                          {preset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Background</Label>
                    <input 
                      type="color" 
                      value={backgroundColor}
                      onChange={(e) => changeBackgroundColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer"
                      data-testid="bg-color-input"
                    />
                  </div>
                </div>
              </div>

              {/* Object Properties */}
              {activeObject && (
                <div>
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Properties</Label>
                  <div className="mt-2 space-y-3">
                    {activeObject.type === 'i-text' && (
                      <>
                        <div>
                          <Label className="text-xs">Font Size</Label>
                          <Slider
                            value={[activeObject.fontSize || 40]}
                            onValueChange={([v]) => updateObjectProperty('fontSize', v)}
                            min={8}
                            max={200}
                            step={1}
                            className="mt-1"
                            data-testid="font-size-slider"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Color</Label>
                          <input 
                            type="color" 
                            value={activeObject.fill || '#000000'}
                            onChange={(e) => updateObjectProperty('fill', e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer"
                            data-testid="text-color-input"
                          />
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8"
                            onClick={() => updateObjectProperty('fontWeight', activeObject.fontWeight === 'bold' ? 'normal' : 'bold')}
                          >
                            <Bold className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8"
                            onClick={() => updateObjectProperty('fontStyle', activeObject.fontStyle === 'italic' ? 'normal' : 'italic')}
                          >
                            <Italic className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                    
                    {(activeObject.type === 'rect' || activeObject.type === 'circle') && (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Fill</Label>
                        <input 
                          type="color" 
                          value={activeObject.fill || '#4F46E5'}
                          onChange={(e) => updateObjectProperty('fill', e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer"
                          data-testid="shape-fill-input"
                        />
                      </div>
                    )}

                    <div>
                      <Label className="text-xs">Opacity</Label>
                      <Slider
                        value={[activeObject.opacity * 100 || 100]}
                        onValueChange={([v]) => updateObjectProperty('opacity', v / 100)}
                        min={0}
                        max={100}
                        step={1}
                        className="mt-1"
                        data-testid="opacity-slider"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Rotation</Label>
                      <Slider
                        value={[activeObject.angle || 0]}
                        onValueChange={([v]) => updateObjectProperty('angle', v)}
                        min={0}
                        max={360}
                        step={1}
                        className="mt-1"
                        data-testid="rotation-slider"
                      />
                    </div>
                  </div>
                </div>
              )}

              {!activeObject && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Select an object to edit its properties
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TemplateEditor;
