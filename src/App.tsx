import React, { useState, useRef, useEffect } from 'react';
import { Plus, Copy, RefreshCw, Image as ImageIcon, X, Download, MessageSquare, Trash2, LayoutGrid, Maximize2, FileText, Menu, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

const SYSTEM_PROMPT = `顶级商业广告AI视频提示词生成专家

【Role｜角色定位】
你是一位荣获多项国际大奖的顶级商业广告导演，同时也是精通Sora、Kling、Runway Gen-3等顶尖AI视频生成模型的“AI提示词架构专家”。你擅长将任何简单的产品需求，升华为具有极致美学、严密分镜头逻辑、并完美规避AI生成缺陷的“大师级长镜头/蒙太奇混合提示词”。

【Core Philosophy｜核心创作原则】
不要平铺直叙地描述画面，你必须通过设定以下原则来创造“视觉张力”与“昂贵感”：
美学与色彩法则：不指定固定颜色，但必须根据产品的受众与调性，构建高度统一且具有视觉张力的色彩系统（如：利用经典复古撞色产生戏剧性，或利用同色系渐变凸显极简高级感）。色彩必须辅助情绪表达。
材质与光影法则：不罗列材质，但必须详细描述光线如何与特定材质发生物理级交互。顶级质感来源于“对比”（如：哑光肌理与锐利高光的对比、粗糙表面与柔和侧光的共振、光斑在流线型边缘的顺滑流转）。
符号与意境法则：提取产品背后的文化或现代美学内核，将其转化为具象的微观视觉符号。让环境意境与产品气质形成共鸣（如：用烟雾/水波/几何阴影等自然或抽象元素烘托主观氛围）。
动静辩证法则：深谙AI视频的节奏控制。大景别用“极静”配合微弱动态（如仅有呼吸感、微风感）以保证画面不崩坏；特写与转场用“极动”（如快速闪剪、光影掠过）以制造视觉冲击。

【AI Optimization Rules｜AI防崩坏与优化指令】
在撰写提示词时，必须暗中植入对AI模型友好的控制指令：
景别策略：大量使用“微距特写（Macro）”、“极致微距（Extreme Close-up）”。这能最大程度规避AI生成复杂大场景时的透视崩坏与逻辑变形，同时凸显高奢质感。
物理形变规避：深知AI对液体滴落、复杂机械形变等动态容易处理成“融化”或“诡异扭曲”。必须用**“高级的视觉错觉”代替“复杂的物理形变”**（例如：用一道如同水波般缓缓抚过的微光，代替真实的液体流动；用光影的流转代替物理的变形）。
活体控制：当画面出现人物或动物时，必须加上类似“镜头保持静止，主体仅有微弱的呼吸感/眼眸微动”的限制词，锁死五官与肢体，确保逼真度。

【Structure & Pacing｜专业分镜结构公式】
你输出的最终提示词，必须是一段连续、极具画面感的文学性描述，且暗含以下严密的6步分镜头脚本（Storyboard）逻辑：
1. 开场（建置/Hook）：以产品最具代表性的局部材质微距特写开场。配合极缓的运镜（如缓慢拉出/缓慢推进），奠定整支视频的基调与情绪。
2. 人物或环境（情绪/Vibe）：切入使用场景、相关人物或核心意象的特写。妆造/环境布置必须干净高级，利用光影雕刻立体感，画面保持极静，仅保留微弱的生命感动态。
3. 产品核心（特写/Details）：画面平稳切至产品的极致微距。展现其表面令人惊叹的微缩细节或肌理。配合柔和或锐利的光线交互，以及缓慢的旋转或掠过，凸显艺术品般的层次。
4. 人/物交互（动作/Interaction）：展示产品被使用或被触发的优雅瞬间。动作必须缓慢、克制，手部或机械动作配合平滑的推拉摇移运镜。
5. 高潮（蒙太奇/Montage）：视频进入极快节奏的蒙太奇闪剪。伴随强烈的音乐鼓点（以视觉暗示听觉），将核心材质、反光、人物眼神、局部细节交替极快闪现，将视觉张力推向巅峰。
6. 落幅（全景展示/Packshot）：镜头切入核心产品全景展示（产品定妆照）。在符合产品调性的柔光或几何光影背景下，产品如同典藏艺术品般陈列，镜头匀速缓慢推进，最终画面在光影中缓慢渐隐至黑屏（Fade to black）。

【Workflow｜工作流】
当用户输入 [产品名称及基础需求] 时，你需按照以下步骤执行：
深刻分析：推演该产品的美学内核、色彩系统、核心材质与情绪基调。
生成提示词：严格按照【Structure & Pacing】的6步结构，融合【核心创作原则】与【AI优化指令】，输出一段连续的、毫无废话的、极具文学性与画面感的顶级AI视频生成提示词。
输出要求：直接输出这段最终的提示词（可分为6个自然段以代表分镜，段落开头必须带有数字编号如"1. "以便后续分镜提取），不要输出任何解释性的废话，提示词语感要像一首赞美工业/自然艺术的诗，同时充满严谨的摄像机语言（如：微距、拉出、推镜、侧光、高光、景深）。`;

type Version = {
  id: string;
  text: string;
  textModel: string;
  storyboardModel: string;
  storyboardImages: string[];
  isGeneratingText: boolean;
  isGeneratingStoryboard: boolean;
};

type MediaItem = {
  dataUrl: string;
  mimeType: string;
  name: string;
};

type Project = {
  id: string;
  name: string;
  requirement: string;
  duration?: number;
  videoStyle?: string;
  media: MediaItem[];
  versions: Version[];
  updatedAt: number;
};

const stitchImages = async (base64Images: string[], startIndex: number): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const imgWidth = 1024;
    const imgHeight = 576;
    const cols = 3;
    const rows = 3;
    const padding = 24;

    canvas.width = cols * imgWidth + (cols + 1) * padding;
    canvas.height = rows * imgHeight + (rows + 1) * padding;

    ctx.fillStyle = '#f5f5f7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let loadedCount = 0;
    if (base64Images.length === 0) {
        resolve(canvas.toDataURL('image/jpeg', 0.9));
        return;
    }

    base64Images.forEach((b64, index) => {
      const img = new Image();
      img.onload = () => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const x = padding + col * (imgWidth + padding);
        const y = padding + row * (imgHeight + padding);

        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 6;
        ctx.drawImage(img, x, y, imgWidth, imgHeight);
        ctx.shadowColor = 'transparent';

        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.beginPath();
        ctx.roundRect(x + 16, y + 16, 48, 48, 8);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((startIndex + index + 1).toString(), x + 16 + 24, y + 16 + 24);

        loadedCount++;
        if (loadedCount === base64Images.length) {
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === base64Images.length) {
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        }
      };
      img.src = b64.startsWith('data:') ? b64 : `data:image/jpeg;base64,${b64}`;
    });
  });
};

export default function App() {
  const [isKeyReady, setIsKeyReady] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [inputWidth, setInputWidth] = useState(360);
  const [isDraggingInput, setIsDraggingInput] = useState(false);
  const [uploadHeight, setUploadHeight] = useState(120);
  const [isDraggingUpload, setIsDraggingUpload] = useState(false);
  const [fullscreenData, setFullscreenData] = useState<{versionId: string, sheetIndex: number} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSidebar) {
        const newWidth = e.clientX;
        if (newWidth >= 200 && newWidth <= 400) {
          setSidebarWidth(newWidth);
        }
      } else if (isDraggingInput) {
        const currentSidebarWidth = isSidebarOpen ? sidebarWidth : 64;
        const newWidth = e.clientX - currentSidebarWidth;
        if (newWidth >= 280 && newWidth <= 800) {
          setInputWidth(newWidth);
        }
      } else if (isDraggingUpload) {
        // Approximate the top offset of the upload area
        const newHeight = e.clientY - 120; // 120 is roughly the top offset
        if (newHeight >= 100 && newHeight <= 500) {
          setUploadHeight(newHeight);
        }
      }
    };
    const handleMouseUp = () => {
      setIsDraggingSidebar(false);
      setIsDraggingInput(false);
      setIsDraggingUpload(false);
    };

    if (isDraggingSidebar || isDraggingInput || isDraggingUpload) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSidebar, isDraggingInput, isDraggingUpload, isSidebarOpen, sidebarWidth]);

  // Load projects from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ai_ad_projects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProjects(parsed);
        if (parsed.length > 0) {
          setCurrentProjectId(parsed[0].id);
        } else {
          createNewProject();
        }
      } catch (e) {
        console.error('Failed to parse projects', e);
        createNewProject();
      }
    } else {
      createNewProject();
    }
  }, []);

  // Check API Key
  useEffect(() => {
    const checkKey = async () => {
      if ((window as any).aistudio?.hasSelectedApiKey) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        setIsKeyReady(hasKey);
      } else {
        setIsKeyReady(true);
      }
    };
    checkKey();
  }, []);

  // Save projects to localStorage whenever they change
  useEffect(() => {
    if (projects.length > 0) {
      try {
        localStorage.setItem('ai_ad_projects', JSON.stringify(projects));
      } catch (e) {
        console.warn('Failed to save to localStorage (might be full due to images)', e);
      }
    }
  }, [projects]);

  const createNewProject = () => {
    const newProj: Project = {
      id: Date.now().toString(),
      name: '新项目',
      requirement: '',
      media: [],
      versions: [],
      updatedAt: Date.now()
    };
    setProjects(prev => [newProj, ...prev]);
    setCurrentProjectId(newProj.id);
  };

  const deleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjects(prev => {
      const updated = prev.filter(p => p.id !== id);
      if (currentProjectId === id) {
        if (updated.length > 0) {
          setCurrentProjectId(updated[0].id);
        } else {
          // If no projects left, create a new one
          const newProj: Project = {
            id: Date.now().toString(),
            name: '新项目',
            requirement: '',
            media: [],
            versions: [],
            updatedAt: Date.now()
          };
          setCurrentProjectId(newProj.id);
          return [newProj];
        }
      }
      return updated;
    });
  };

  const currentProject = projects.find(p => p.id === currentProjectId);

  const updateCurrentProject = (updates: Partial<Project>) => {
    if (!currentProjectId) return;
    setProjects(prev => prev.map(p => 
      p.id === currentProjectId ? { ...p, ...updates, updatedAt: Date.now() } : p
    ));
  };

  const handleSelectKey = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      setIsKeyReady(true);
    }
  };

  const processFiles = async (files: File[]) => {
    if (!currentProject) return;
    
    const newMediaItems: MediaItem[] = [];
    
    for (const file of files) {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      
      newMediaItems.push({
        dataUrl,
        mimeType: file.type,
        name: file.name
      });
    }
    
    // Update once with all new items
    setProjects(prev => prev.map(p => {
      if (p.id !== currentProjectId) return p;
      return { ...p, media: [...p.media, ...newMediaItems], updatedAt: Date.now() };
    }));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleInitialSubmit = async () => {
    if (!currentProject || !currentProject.requirement.trim()) return;
    
    // Auto-name project if it's "新项目"
    let newName = currentProject.name;
    if (newName === '新项目') {
      newName = currentProject.requirement.trim().slice(0, 12);
      if (currentProject.requirement.length > 12) newName += '...';
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const newVersionId = Date.now().toString();
    const newVersion: Version = {
      id: newVersionId,
      text: '',
      textModel: 'gemini-3.1-pro-preview',
      storyboardModel: 'gemini-3.1-flash-image-preview',
      storyboardImages: [],
      isGeneratingText: true,
      isGeneratingStoryboard: false,
    };
    
    updateCurrentProject({ 
      name: newName,
      versions: [newVersion] 
    });

    try {
      const parts: any[] = [{ text: `用户需求：${currentProject.requirement}\n视频时长：${currentProject.duration || 15}秒\n视觉风格：${currentProject.videoStyle || '多种风格切换'}` }];
      currentProject.media.forEach(m => {
        parts.push({
          inlineData: {
            data: m.dataUrl.split(',')[1],
            mimeType: m.mimeType
          }
        });
      });

      const response = await ai.models.generateContent({
        model: newVersion.textModel,
        contents: { parts },
        config: {
          systemInstruction: SYSTEM_PROMPT,
        }
      });
      
      const generatedText = response.text || '';
      
      // Update the specific version in the current project
      setProjects(prev => prev.map(p => {
        if (p.id !== currentProjectId) return p;
        return {
          ...p,
          versions: p.versions.map(v => v.id === newVersionId ? { ...v, text: generatedText, isGeneratingText: false } : v)
        };
      }));
      
      generateStoryboard(newVersionId, generatedText, newVersion.storyboardModel);
      
    } catch (error) {
      console.error("Error generating text:", error);
      setProjects(prev => prev.map(p => {
        if (p.id !== currentProjectId) return p;
        return {
          ...p,
          versions: p.versions.map(v => v.id === newVersionId ? { ...v, text: '生成失败，请重试。', isGeneratingText: false } : v)
        };
      }));
    }
  };

  const generateStoryboard = async (versionId: string, text: string, model: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== currentProjectId) return p;
      return {
        ...p,
        versions: p.versions.map(v => v.id === versionId ? { ...v, isGeneratingStoryboard: true, storyboardImages: [] } : v)
      };
    }));

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    try {
      const scenes = text.split(/(?=(?:^|\n)\d+\.\s)/).filter(s => s.trim().length > 0);
      const chunks = [];
      for (let i = 0; i < scenes.length; i += 9) {
        chunks.push(scenes.slice(i, i + 9));
      }

      let newStoryboard: string[] = [];

      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunkScenes = chunks[chunkIndex];
        const chunkBase64s: string[] = [];

        for (let i = 0; i < chunkScenes.length; i += 3) {
          const batch = chunkScenes.slice(i, i + 3);
          const chunkPromises = batch.map(async (scene, index) => {
             try {
                 const response = await ai.models.generateContent({
                     model: model,
                     contents: `Professional commercial storyboard frame, cinematic lighting, high-end product photography, highly detailed, 8k resolution, photorealistic, shot on 35mm lens, no text. Scene description: ${scene}`,
                     config: {
                       imageConfig: { aspectRatio: "16:9" }
                     }
                 });
                 
                 let base64 = '';
                 if (response.candidates?.[0]?.content?.parts) {
                   for (const part of response.candidates[0].content.parts) {
                     if (part.inlineData) {
                       base64 = part.inlineData.data;
                       break;
                     }
                   }
                 }
                 
                 return base64 ? `data:image/jpeg;base64,${base64}` : '';
             } catch (e) {
                 console.error(`Image gen error for scene ${chunkIndex * 9 + i + index + 1}:`, e);
                 return '';
             }
          });
          
          const chunkResults = await Promise.all(chunkPromises);
          chunkBase64s.push(...chunkResults.filter(Boolean) as string[]);
        }

        if (chunkBase64s.length > 0) {
          const stitchedBase64 = await stitchImages(chunkBase64s, chunkIndex * 9);
          newStoryboard = [...newStoryboard, stitchedBase64];
          
          setProjects(prev => prev.map(p => {
            if (p.id !== currentProjectId) return p;
            return {
              ...p,
              versions: p.versions.map(v => v.id === versionId ? { ...v, storyboardImages: newStoryboard } : v)
            };
          }));
        }
      }
      
      setProjects(prev => prev.map(p => {
        if (p.id !== currentProjectId) return p;
        return {
          ...p,
          versions: p.versions.map(v => v.id === versionId ? { ...v, isGeneratingStoryboard: false } : v)
        };
      }));
      
    } catch (error) {
      console.error("Error generating storyboard:", error);
      setProjects(prev => prev.map(p => {
        if (p.id !== currentProjectId) return p;
        return {
          ...p,
          versions: p.versions.map(v => v.id === versionId ? { ...v, isGeneratingStoryboard: false } : v)
        };
      }));
    }
  };

  const handleOptimize = async (parentId: string, prompt: string) => {
    if (!prompt.trim() || !currentProject) return;
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const parentVersion = currentProject.versions.find(v => v.id === parentId);
    if (!parentVersion) return;

    const newVersionId = Date.now().toString();
    const newVersion: Version = {
      id: newVersionId,
      text: '',
      textModel: parentVersion.textModel,
      storyboardModel: parentVersion.storyboardModel,
      storyboardImages: [],
      isGeneratingText: true,
      isGeneratingStoryboard: false,
    };
    
    setProjects(prev => prev.map(p => {
      if (p.id !== currentProjectId) return p;
      const index = p.versions.findIndex(v => v.id === parentId);
      const newVersions = [...p.versions];
      newVersions.splice(index + 1, 0, newVersion);
      return { ...p, versions: newVersions };
    }));

    try {
      const parts: any[] = [{ text: `基于之前的脚本进行优化。\n原脚本：\n${parentVersion.text}\n\n优化要求：${prompt}\n请输出优化后的完整脚本，保持分段和编号格式。` }];
      currentProject.media.forEach(m => {
        parts.push({
          inlineData: {
            data: m.dataUrl.split(',')[1],
            mimeType: m.mimeType
          }
        });
      });

      const response = await ai.models.generateContent({
        model: newVersion.textModel,
        contents: { parts },
        config: {
          systemInstruction: SYSTEM_PROMPT,
        }
      });
      
      const generatedText = response.text || '';
      
      setProjects(prev => prev.map(p => {
        if (p.id !== currentProjectId) return p;
        return {
          ...p,
          versions: p.versions.map(v => v.id === newVersionId ? { ...v, text: generatedText, isGeneratingText: false } : v)
        };
      }));
      
      generateStoryboard(newVersionId, generatedText, newVersion.storyboardModel);
      
    } catch (error) {
      console.error("Error optimizing text:", error);
      setProjects(prev => prev.map(p => {
        if (p.id !== currentProjectId) return p;
        return {
          ...p,
          versions: p.versions.map(v => v.id === newVersionId ? { ...v, text: '生成失败，请重试。', isGeneratingText: false } : v)
        };
      }));
    }
  };

  const updateVersionText = (id: string, text: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== currentProjectId) return p;
      return { ...p, versions: p.versions.map(v => v.id === id ? { ...v, text } : v) };
    }));
  };

  const updateTextModel = (id: string, model: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== currentProjectId) return p;
      return { ...p, versions: p.versions.map(v => v.id === id ? { ...v, textModel: model } : v) };
    }));
  };

  const updateStoryboardModel = (id: string, model: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== currentProjectId) return p;
      return { ...p, versions: p.versions.map(v => v.id === id ? { ...v, storyboardModel: model } : v) };
    }));
  };

  const regenerateText = async (id: string) => {
    if (!currentProject) return;
    const version = currentProject.versions.find(v => v.id === id);
    if (!version) return;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    setProjects(prev => prev.map(p => {
      if (p.id !== currentProjectId) return p;
      return { ...p, versions: p.versions.map(v => v.id === id ? { ...v, isGeneratingText: true, text: '' } : v) };
    }));

    try {
      const parts: any[] = [{ text: `用户需求：${currentProject.requirement}\n视频时长：${currentProject.duration || 15}秒\n视觉风格：${currentProject.videoStyle || '多种风格切换'}` }];
      currentProject.media.forEach(m => {
        parts.push({
          inlineData: {
            data: m.dataUrl.split(',')[1],
            mimeType: m.mimeType
          }
        });
      });

      const response = await ai.models.generateContent({
        model: version.textModel,
        contents: { parts },
        config: {
          systemInstruction: SYSTEM_PROMPT,
        }
      });
      
      const generatedText = response.text || '';
      
      setProjects(prev => prev.map(p => {
        if (p.id !== currentProjectId) return p;
        return { ...p, versions: p.versions.map(v => v.id === id ? { ...v, text: generatedText, isGeneratingText: false } : v) };
      }));
      
      generateStoryboard(id, generatedText, version.storyboardModel);
      
    } catch (error) {
      console.error("Error regenerating text:", error);
      setProjects(prev => prev.map(p => {
        if (p.id !== currentProjectId) return p;
        return { ...p, versions: p.versions.map(v => v.id === id ? { ...v, text: '生成失败，请重试。', isGeneratingText: false } : v) };
      }));
    }
  };

  const downloadImage = (dataUrl: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `storyboard-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isKeyReady) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#f5f6f8]">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center max-w-md">
          <h2 className="text-xl font-bold mb-4">需要配置 API Key</h2>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            您选择的图像生成模型（Nano Banana 系列）属于付费模型，需要绑定您自己的 Google Cloud 项目 API Key 才能使用。<br/><br/>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">查看计费文档</a>
          </p>
          <button 
            onClick={handleSelectKey}
            className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            选择 API Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f5f5f7] text-gray-900 font-sans overflow-hidden">
      
      {/* 1. Leftmost Sidebar: Project History */}
      <div 
        style={{ width: isSidebarOpen ? `${sidebarWidth}px` : '64px' }}
        className="transition-all duration-300 bg-[#ffffff] border-r border-gray-200 flex flex-col shadow-sm z-20 shrink-0 relative"
      >
        {/* Resizer Handle */}
        {isSidebarOpen && (
          <div 
            className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-black/10 active:bg-black/20 z-50 transition-colors"
            onMouseDown={() => setIsDraggingSidebar(true)}
          />
        )}
        <div className="h-16 border-b border-gray-100 flex items-center justify-between px-4">
          {isSidebarOpen && <span className="font-semibold text-gray-800 tracking-tight truncate">历史项目</span>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-1.5 hover:bg-gray-100 rounded-md text-gray-600 transition-all ${!isSidebarOpen && 'mx-auto'}`} title="切换侧边栏">
            <Menu size={20} />
          </button>
        </div>
        <div className="p-3">
          <button 
            onClick={createNewProject} 
            className={`w-full flex items-center justify-center gap-2 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 text-gray-700 transition-all ${!isSidebarOpen ? 'px-0' : 'px-3'}`} 
            title="新建项目"
          >
            <Plus size={18} />
            {isSidebarOpen && <span className="font-medium text-sm">新项目</span>}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1 custom-scrollbar">
          {projects.map(proj => (
            <div 
              key={proj.id}
              onClick={() => setCurrentProjectId(proj.id)}
              className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 ${currentProjectId === proj.id ? 'bg-black text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'}`}
              title={proj.name}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText size={16} className={`shrink-0 ${currentProjectId === proj.id ? 'text-white/80' : 'text-gray-400'}`} />
                {isSidebarOpen && <span className="text-sm truncate font-medium">{proj.name}</span>}
              </div>
              {isSidebarOpen && (
                <button 
                  onClick={(e) => deleteProject(proj.id, e)}
                  className={`opacity-0 group-hover:opacity-100 p-1 transition-opacity ${currentProjectId === proj.id ? 'text-white/60 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2. Middle Column: Input Area */}
      <div 
        style={{ width: `${inputWidth}px` }} 
        className="bg-white border-r border-gray-200 flex flex-col shadow-sm z-10 shrink-0 relative"
      >
        {/* Resizer Handle */}
        <div 
          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-black/10 active:bg-black/20 z-50 transition-colors"
          onMouseDown={() => setIsDraggingInput(true)}
        />
        <div className="p-5 border-b border-gray-100 font-semibold text-lg text-gray-800 tracking-tight">需求输入板块</div>
        <div className="p-5 flex-1 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
          
          {/* Upload Area */}
          <div className="flex flex-col gap-3 relative" style={{ height: `${uploadHeight}px` }}>
            <span className="text-sm font-medium text-gray-700 shrink-0">参考素材</span>
            <div 
              className={`flex-1 overflow-y-auto custom-scrollbar rounded-xl transition-all ${isDragging ? 'bg-gray-50 ring-2 ring-black/20' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setIsDragging(false);
                }
              }}
              onDrop={handleDrop}
            >
              {currentProject?.media && currentProject.media.length > 0 ? (
                <div className="flex flex-wrap gap-3 p-1">
                  {currentProject.media.map((m, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-xl border border-gray-200 overflow-hidden group shadow-sm shrink-0">
                      {m.mimeType.startsWith('image/') ? (
                        <img src={m.dataUrl} alt="upload" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-[10px] text-gray-500 break-all p-2 text-center leading-tight">
                          {m.name}
                        </div>
                      )}
                      <button 
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          updateCurrentProject({ media: currentProject.media.filter((_, idx) => idx !== i) });
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 hover:text-black hover:border-black transition-all bg-gray-50 hover:bg-gray-100 shrink-0"
                    title="添加更多素材"
                  >
                    <Plus size={24} />
                  </button>
                </div>
              ) : (
                <div 
                  className={`relative flex flex-col items-center justify-center gap-3 w-full h-full min-h-[100px] border-2 border-dashed rounded-xl transition-all cursor-pointer ${isDragging ? 'border-black bg-gray-50 text-black' : 'border-gray-300 text-gray-500 hover:border-black hover:text-black hover:bg-gray-50'}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className={`p-3 rounded-full ${isDragging ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <Plus size={24} />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-medium">点击或拖拽上传素材</span>
                    <span className="text-xs opacity-60 mt-1">支持图片、视频、音频</span>
                  </div>
                </div>
              )}
            </div>
            <input 
              type="file" 
              multiple 
              className="hidden" 
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files) processFiles(Array.from(e.target.files));
                e.target.value = ''; // Reset input
              }}
            />
          </div>

          {/* Horizontal Resizer */}
          <div 
            className="h-1.5 w-full cursor-row-resize hover:bg-black/10 active:bg-black/20 rounded-full transition-colors shrink-0"
            onMouseDown={() => setIsDraggingUpload(true)}
          />
          
          <div className="flex flex-col gap-3 flex-1">
            <span className="text-sm font-medium text-gray-700">文字需求</span>
            <textarea 
              className="flex-1 w-full p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-black/5 text-sm leading-relaxed bg-gray-50 transition-all placeholder:text-gray-400"
              placeholder="描述您的广告需求，例如：一款极简风格的智能手表，强调金属质感和未来科技感..."
              value={currentProject?.requirement || ''}
              onChange={e => updateCurrentProject({ requirement: e.target.value })}
            />
          </div>

          {/* Duration and Style Options */}
          <div className="flex flex-col gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">时长 (秒)</span>
                <span className="text-sm font-semibold text-black">{currentProject?.duration || 15}s</span>
              </div>
              <input 
                type="range" 
                min="3" 
                max="30" 
                step="1"
                value={currentProject?.duration || 15} 
                onChange={(e) => updateCurrentProject({ duration: Number(e.target.value) })}
                className="w-full accent-black"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-gray-700">风格</span>
              <select 
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-white hover:border-gray-300 transition-all focus:ring-2 focus:ring-black/5"
                value={currentProject?.videoStyle || '多种风格切换'}
                onChange={(e) => updateCurrentProject({ videoStyle: e.target.value })}
              >
                <option value="真实拍摄">真实拍摄</option>
                <option value="三维渲染">三维渲染</option>
                <option value="二维手绘">二维手绘</option>
                <option value="多种风格切换">多种风格切换</option>
              </select>
            </div>
          </div>
          
          <button 
            className="w-full py-3.5 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-all disabled:bg-gray-300 disabled:text-gray-500 shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
            onClick={handleInitialSubmit}
            disabled={!currentProject || (currentProject.versions.length > 0 && currentProject.versions[0].isGeneratingText) || !currentProject.requirement.trim()}
          >
            {currentProject?.versions[0]?.isGeneratingText ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>生成中...</span>
              </>
            ) : (
              '生成广告脚本'
            )}
          </button>
        </div>
      </div>

      {/* 3. Right Area: Output Versions */}
      <div className="flex-1 overflow-y-auto p-8 flex flex-col relative custom-scrollbar bg-[#f5f5f7]">
        <div className="flex items-center justify-between mb-8 px-2 shrink-0">
          <div className="flex gap-8 flex-1">
            <div className="flex-1 font-semibold text-xl text-gray-800 tracking-tight">文字脚本生成板块</div>
            <div className="flex-1 font-semibold text-xl text-gray-800 tracking-tight flex items-center justify-between">
              <span>分镜脚本预览板块</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-10">
          {!currentProject?.versions.length && (
            <div className="flex flex-col items-center justify-center text-gray-400 mt-40">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <MessageSquare size={40} className="text-gray-300" />
              </div>
              <p className="text-lg font-medium text-gray-500">请在左侧输入需求并提交，开始生成广告脚本</p>
              <p className="text-sm text-gray-400 mt-2">支持上传参考图片以获得更精准的生成结果</p>
            </div>
          )}
          
          {currentProject?.versions.map((version, index) => (
            <VersionBlock 
              key={version.id} 
              version={version} 
              index={index}
              onImageClick={(img) => setFullscreenData({ versionId: version.id, sheetIndex: version.storyboardImages.indexOf(img) })}
              onUpdateText={(text) => updateVersionText(version.id, text)}
              onUpdateTextModel={(model) => updateTextModel(version.id, model)}
              onUpdateStoryboardModel={(model) => updateStoryboardModel(version.id, model)}
              onRegenerateText={() => regenerateText(version.id)}
              onRegenerateStoryboard={() => generateStoryboard(version.id, version.text, version.storyboardModel)}
              onOptimize={(prompt) => handleOptimize(version.id, prompt)}
            />
          ))}
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {fullscreenData && (
        (() => {
          const version = currentProject?.versions.find(v => v.id === fullscreenData.versionId);
          const sheets = version?.storyboardImages || [];
          const currentIndex = fullscreenData.sheetIndex;
          const currentSheet = sheets[currentIndex];

          if (!currentSheet) return null;

          const handlePrev = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (currentIndex > 0) {
              setFullscreenData({ ...fullscreenData, sheetIndex: currentIndex - 1 });
            }
          };

          const handleNext = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (currentIndex < sheets.length - 1) {
              setFullscreenData({ ...fullscreenData, sheetIndex: currentIndex + 1 });
            }
          };

          return (
            <div 
              className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center"
              onClick={() => setFullscreenData(null)}
            >
              <button 
                className="absolute top-6 right-6 text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"
                onClick={() => setFullscreenData(null)}
              >
                <X size={32} />
              </button>

              {currentIndex > 0 && (
                <button 
                  onClick={handlePrev} 
                  className="absolute left-6 text-white/70 hover:text-white p-4 hover:bg-white/10 rounded-full transition-colors"
                >
                  <ChevronLeft size={48} />
                </button>
              )}

              <img 
                src={currentSheet} 
                alt="Fullscreen Storyboard"
                className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" 
                onClick={(e) => e.stopPropagation()} 
              />

              {currentIndex < sheets.length - 1 && (
                <button 
                  onClick={handleNext} 
                  className="absolute right-6 text-white/70 hover:text-white p-4 hover:bg-white/10 rounded-full transition-colors"
                >
                  <ChevronRight size={48} />
                </button>
              )}

              <div className="absolute bottom-6 flex items-center gap-4">
                <span className="text-white/70 font-medium">
                  {currentIndex + 1} / {sheets.length}
                </span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const link = document.createElement('a');
                    link.href = currentSheet;
                    link.download = `storyboard_sheet_${currentIndex + 1}.jpg`;
                    link.click();
                  }} 
                  className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-medium hover:bg-gray-100 transition-colors shadow-lg"
                >
                  <Download size={20} />
                  下载此页
                </button>
              </div>
            </div>
          );
        })()
      )}

    </div>
  );
}

const VersionBlock: React.FC<{ 
  version: Version, 
  index: number,
  onImageClick: (img: string) => void,
  onUpdateText: (text: string) => void,
  onUpdateTextModel: (model: string) => void,
  onUpdateStoryboardModel: (model: string) => void,
  onRegenerateText: () => void,
  onRegenerateStoryboard: () => void,
  onOptimize: (prompt: string) => void
}> = ({ 
  version, 
  index, 
  onImageClick,
  onUpdateText, 
  onUpdateTextModel,
  onUpdateStoryboardModel,
  onRegenerateText, 
  onRegenerateStoryboard, 
  onOptimize 
}) => {
  const [optimizePrompt, setOptimizePrompt] = useState('');
  const [scriptWidthPercent, setScriptWidthPercent] = useState(50);
  const [isDraggingScript, setIsDraggingScript] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(version.text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = version.text;
        textArea.style.position = "absolute";
        textArea.style.left = "-999999px";
        document.body.prepend(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (error) {
          console.error(error);
        } finally {
          textArea.remove();
        }
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingScript && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newPercent = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        if (newPercent >= 20 && newPercent <= 80) {
          setScriptWidthPercent(newPercent);
        }
      }
    };
    const handleMouseUp = () => {
      setIsDraggingScript(false);
    };

    if (isDraggingScript) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingScript]);

  const renderStoryboardGrids = (images: string[]) => {
    if (images.length === 0) {
      return (
        <div className="col-span-full text-center text-gray-400 py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center">
          <ImageIcon size={32} className="mb-3 text-gray-300" />
          <span className="text-sm font-medium">暂无分镜，请先生成脚本</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6">
        {images.map((sheet, idx) => (
          <div key={idx} className="relative group">
            <img
              src={sheet}
              alt={`Storyboard Sheet ${idx + 1}`}
              className="w-full rounded-xl shadow-sm border border-gray-200 cursor-pointer transition-all duration-300 group-hover:shadow-lg group-hover:scale-[1.01]"
              onClick={() => onImageClick(sheet)}
            />
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const link = document.createElement('a');
                  link.href = sheet;
                  link.download = `storyboard_sheet_${idx + 1}.jpg`;
                  link.click();
                }}
                className="p-2 bg-black/70 hover:bg-black text-white rounded-lg backdrop-blur-sm transition-colors shadow-lg"
                title="下载此页"
              >
                <Download size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col lg:flex-row gap-8 p-6 rounded-2xl shadow-sm border relative ${index % 2 === 0 ? 'bg-white border-gray-200' : 'bg-[#fafafa] border-gray-200'}`}
    >
      {/* Text Script Half */}
      <div 
        style={{ width: `calc(${scriptWidthPercent}% - 16px)` }}
        className="flex flex-col gap-5 lg:border-r border-gray-100 lg:pr-8 shrink-0"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">模型选择</span>
            <select 
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none bg-white hover:border-gray-300 transition-all focus:ring-2 focus:ring-black/5 w-40 sm:w-48"
              value={version.textModel}
              onChange={(e) => onUpdateTextModel(e.target.value)}
            >
              <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview</option>
              <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite Preview</option>
              <option value="gemini-3-flash-preview">Gemini 3 Flash Preview</option>
            </select>
          </div>
          <button onClick={onRegenerateText} className="shrink-0 flex items-center gap-1.5 text-sm px-4 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 bg-white transition-all text-gray-700 hover:text-black whitespace-nowrap">
            <RefreshCw size={14} /> 重新生成
          </button>
        </div>
        
        <div className="relative flex-1 min-h-[400px]">
          <textarea 
            className="w-full h-full p-5 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-black/5 leading-relaxed bg-white text-sm text-gray-800 shadow-sm transition-all"
            value={version.text}
            onChange={(e) => onUpdateText(e.target.value)}
            disabled={version.isGeneratingText}
            placeholder={version.isGeneratingText ? "正在生成脚本..." : "脚本内容"}
          />
          <button 
            className={`absolute top-3 right-3 p-2 rounded-lg shadow-sm border border-gray-100 transition-all ${isCopied ? 'text-green-500 bg-green-50 border-green-200' : 'text-gray-400 hover:text-black bg-white hover:bg-gray-50'}`}
            onClick={handleCopy}
            title={isCopied ? "已复制" : "复制脚本"}
          >
            {isCopied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        <div className="flex gap-3 mt-2">
          <input 
            type="text" 
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 bg-white shadow-sm transition-all placeholder:text-gray-400"
            placeholder="继续优化，例如：将风格改为赛博朋克..."
            value={optimizePrompt}
            onChange={e => setOptimizePrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onOptimize(optimizePrompt)}
          />
          <button 
            onClick={() => onOptimize(optimizePrompt)}
            className="px-6 py-3 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-all whitespace-nowrap shadow-sm active:scale-[0.98]"
          >
            继续优化
          </button>
        </div>
      </div>

      {/* Resizer Handle */}
      <div 
        className="hidden lg:block absolute top-0 bottom-0 w-2 cursor-col-resize hover:bg-black/10 active:bg-black/20 z-10 transition-colors"
        style={{ left: `calc(${scriptWidthPercent}% - 4px)` }}
        onMouseDown={() => setIsDraggingScript(true)}
      />

      {/* Storyboard Half */}
      <div 
        style={{ width: `calc(${100 - scriptWidthPercent}% - 16px)` }}
        className="flex flex-col gap-5 lg:pl-2 shrink-0"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">模型选择</span>
            <select 
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none bg-white hover:border-gray-300 transition-all focus:ring-2 focus:ring-black/5 w-40 sm:w-48"
              value={version.storyboardModel}
              onChange={(e) => onUpdateStoryboardModel(e.target.value)}
            >
              <option value="gemini-3.1-flash-image-preview">Nano Banana 2 (3.1 Flash Image)</option>
              <option value="gemini-3-pro-image-preview">Nano Banana Pro (3 Pro Image)</option>
            </select>
          </div>
          <button onClick={onRegenerateStoryboard} className="shrink-0 flex items-center gap-1.5 text-sm px-4 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 bg-white transition-all text-gray-700 hover:text-black whitespace-nowrap">
            <RefreshCw size={14} /> 重新生成
          </button>
        </div>

        <div className="flex-1 rounded-xl p-1 overflow-y-auto max-h-[600px] custom-scrollbar">
          {version.isGeneratingStoryboard && version.storyboardImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 min-h-[400px] bg-gray-50 rounded-xl border border-gray-200 border-dashed">
              <RefreshCw className="animate-spin mb-4 text-black" size={32} /> 
              <span className="text-sm font-medium">正在生成电影级分镜...</span>
              <span className="text-xs text-gray-400 mt-2">预计需要 10-30 秒</span>
            </div>
          ) : (
            <>
              {renderStoryboardGrids(version.storyboardImages)}
              {version.isGeneratingStoryboard && version.storyboardImages.length > 0 && (
                <div className="flex items-center justify-center py-4 text-gray-500 gap-2">
                  <RefreshCw className="animate-spin" size={16} />
                  <span className="text-sm font-medium">正在生成剩余分镜...</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
