import { useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  FolderOpen,
  History,
  ImagePlus,
  Layers3,
  LoaderCircle,
  RefreshCcw,
  SlidersHorizontal,
  Sparkles,
  Upload,
  Wand2,
  X,
} from 'lucide-react';
import {
  loadProjectSnapshot,
  listProjectsForUser,
  listVersionsForProject,
  persistProjectSnapshot,
  type ProjectSummary,
  type ProjectVersionSummary,
  type PersistProjectStatus,
} from './lib/projectPersistence';

type Step = 1 | 2 | 3;
type ProfileKey = 'tool' | 'luxury' | 'skincare' | 'tech';
type StrategyMode = 'recommended' | 'function' | 'story' | 'brand' | 'feed';

type ProductProfile = {
  key: ProfileKey;
  label: string;
  defaultName: string;
  headline: string;
  summary: string;
  goal: number;
  ageRange: [number, number];
  points: string[];
  audience: string;
  note: string;
  colors: [string, string];
};

type FormState = {
  productName: string;
  category: ProfileKey;
  goal: number;
  ageRange: [number, number];
  sellingPoints: string[];
  audience: string;
  note: string;
};

type StrategyCard = {
  title: string;
  subtitle: string;
  why: string[];
  functionVsMood: number;
  realismVsSpectacle: number;
  restraintVsImpact: number;
  mustShow: string[];
  avoid: string[];
  narrative: [string, string, string];
  alternates: { title: string; description: string }[];
};

type SceneCard = {
  id: string;
  title: string;
  objective: string;
  visual: string;
  payoff: string;
  frameTone: string;
};

type SolutionCard = {
  idea: string;
  rationale: string;
  directionTag: string;
  scenes: SceneCard[];
};

type StrategyChoice = {
  mode: StrategyMode;
  title: string;
  subtitle: string;
  thinking: string;
  lines: string[];
  narrative: [string, string, string];
  avoid: string[];
};

const goalMarks = [
  { value: 0, label: '卖货' },
  { value: 50, label: '种草' },
  { value: 100, label: '品牌' },
];

const categoryOptions: { key: ProfileKey; label: string }[] = [
  { key: 'tool', label: '功能型工具' },
  { key: 'luxury', label: '奢侈品配饰' },
  { key: 'skincare', label: '护肤/美妆' },
  { key: 'tech', label: '科技性能产品' },
];

const quickTweaks = [
  '更贵一点',
  '更强调功能',
  '更有故事感',
  '增加真人镜头',
  '减少特效堆砌',
  '更适合前3秒抓人',
] as const;

const profiles: Record<ProfileKey, ProductProfile> = {
  tool: {
    key: 'tool',
    label: '功能型工具',
    defaultName: '钛核工程铲',
    headline: '用高成本反差感，把普通工具拍出大片级力量感。',
    summary: '优先展示破土效率、握持发力和材质强度，让震撼感服务功能证明。',
    goal: 0,
    ageRange: [24, 48],
    points: ['高强度铲头', '省力握柄', '破土效率', '户外适配'],
    audience: '户外玩家、园艺用户、偏实用主义男性',
    note: '避免长时间空镜，至少三次明确展示实际使用效果。',
    colors: ['#c97a38', '#1f2937'],
  },
  luxury: {
    key: 'luxury',
    label: '奢侈品配饰',
    defaultName: 'Aurora 高级珠宝',
    headline: '先建立情绪和故事，再让产品作为记忆点落下。',
    summary: '让人物、气氛、材质和品牌寓意共同服务“贵而有意义”的感受。',
    goal: 100,
    ageRange: [26, 42],
    points: ['稀有宝石', '工艺细节', '佩戴仪式感', '品牌寓意'],
    audience: '高净值女性、礼赠人群、偏品牌审美用户',
    note: '减少直白功效话术，避免廉价炫光和无意义粒子堆叠。',
    colors: ['#9f7aea', '#1e1b4b'],
  },
  skincare: {
    key: 'skincare',
    label: '护肤/美妆',
    defaultName: '修护焕亮精华',
    headline: '把功效机制、真人肤感和产品质感绑在同一条叙事线上。',
    summary: '既要让成分机理看起来可信，也要让真人肌肤变化有温度、有说服力。',
    goal: 50,
    ageRange: [20, 38],
    points: ['成分渗透', '肌肤修护', '质地高级感', '真人对比感受'],
    audience: '精致护肤用户、功效党、新锐白领女性',
    note: '分子特效只能服务功效解释，不能脱离真实肌肤表现。',
    colors: ['#f59e9e', '#7c3aed'],
  },
  tech: {
    key: 'tech',
    label: '科技性能产品',
    defaultName: 'Arc One 智能设备',
    headline: '用结构、交互和精密感建立性能信任，再放大未来感。',
    summary: '突出工艺、交互反馈、性能场景与速度感，视觉语言偏工程美学。',
    goal: 50,
    ageRange: [18, 40],
    points: ['精密结构', '交互反馈', '性能表现', '工业设计'],
    audience: '数码人群、年轻性能党、审美导向消费者',
    note: '不要把科技片拍成珠宝片，要给性能和交互真实的落点。',
    colors: ['#22c55e', '#0f172a'],
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function goalLabel(goal: number) {
  if (goal <= 20) return '卖货';
  if (goal >= 80) return '品牌';
  return '种草';
}

function projectStatusLabel(status: PersistProjectStatus | null) {
  switch (status) {
    case 'submitted':
      return '已提交';
    case 'storyboard_ready':
      return '已生成分镜';
    case 'strategy_selected':
      return '已选策略';
    case 'draft':
      return '草稿';
    default:
      return '未开始';
  }
}

function createDemoImage(label: string, start: string, end: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${start}" />
          <stop offset="100%" stop-color="${end}" />
        </linearGradient>
      </defs>
      <rect width="800" height="520" rx="36" fill="url(#g)" />
      <rect x="46" y="46" width="708" height="428" rx="28" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" />
      <text x="60" y="98" fill="rgba(255,255,255,0.78)" font-size="26" font-family="Segoe UI, Arial, sans-serif">AI Product Preview</text>
      <text x="60" y="300" fill="#ffffff" font-size="56" font-weight="700" font-family="Segoe UI, Arial, sans-serif">${label}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function inferProfileFromName(name: string): ProductProfile {
  const lower = name.toLowerCase();

  if (
    lower.includes('shovel') ||
    lower.includes('spade') ||
    lower.includes('铲') ||
    lower.includes('tool')
  ) {
    return profiles.tool;
  }

  if (
    lower.includes('ring') ||
    lower.includes('jewel') ||
    lower.includes('necklace') ||
    lower.includes('珠宝') ||
    lower.includes('钻')
  ) {
    return profiles.luxury;
  }

  if (
    lower.includes('serum') ||
    lower.includes('cream') ||
    lower.includes('skin') ||
    lower.includes('护肤') ||
    lower.includes('精华')
  ) {
    return profiles.skincare;
  }

  return profiles.tech;
}

function buildStrategy(form: FormState, mode: StrategyMode): StrategyCard {
  const base = profiles[form.category];
  const selectedPoints = form.sellingPoints.length > 0 ? form.sellingPoints : base.points.slice(0, 3);

  if (form.category === 'tool') {
    if (mode === 'story' || mode === 'brand') {
      return {
        title: '推荐方向：工业史诗型品牌短片',
        subtitle: '保留工具的力量感，但用人物和环境建立“可靠、值得被信任”的品牌情绪。',
        why: [
          '你的产品属于低门槛工具，单纯堆特效会很快失真，故事化更适合拉高品牌感。',
          '功能展示仍然保留，但它要作为人物处境和情绪转折的关键动作出现。',
        ],
        functionVsMood: 58,
        realismVsSpectacle: 42,
        restraintVsImpact: 54,
        mustShow: ['工具进入真实使用场景', ...selectedPoints.slice(0, 3)],
        avoid: ['纯粒子空镜', '只拍材质不拍动作', '结尾没有落到真实功能价值'],
        narrative: ['用高压场景开头建立张力', '在人物使用动作中完成信任建立', '最后把产品落成可靠的解决方案'],
        alternates: [
          { title: '高成本反差型功能广告', description: '更适合投流，功能展示比例更高。' },
          { title: '极简参数型短片', description: '更克制，适合科技工具或电商详情页。' },
        ],
      };
    }

    return {
      title: '推荐方向：高成本反差型功能广告',
      subtitle: '把工具拍出大片感，但每个震撼镜头都必须服务“它到底好不好用”。',
      why: [
        '你的产品更适合“普通品类，高规格表达”的反差路线，这能快速抓注意力。',
        '系统会强制保留功能证明镜头，避免脚本只剩炫技而无法转化。',
      ],
      functionVsMood: mode === 'function' ? 82 : 72,
      realismVsSpectacle: mode === 'feed' ? 64 : 48,
      restraintVsImpact: mode === 'feed' ? 72 : 60,
      mustShow: ['破土或切入动作', '手部发力与握柄反馈', ...selectedPoints.slice(0, 2)],
      avoid: ['过长空镜', '与使用无关的大场面', '无功能解释的特效堆叠'],
      narrative: ['3秒内抛出超规格视觉钩子', '中段连续证明功能效率', '结尾用高定格产品英雄镜收束'],
      alternates: [
        { title: '工业史诗型品牌短片', description: '更讲品牌可靠感，人物叙事更多。' },
        { title: '教程感投流版', description: '更直接，适合快节奏电商素材。' },
      ],
    };
  }

  if (form.category === 'luxury') {
    return {
      title: '推荐方向：故事化情绪奢品广告',
      subtitle: '先铺陈人物和情绪，再让珠宝成为故事中的高潮，而不是廉价特效中心。',
      why: [
        '奢侈品更需要品牌理念、佩戴仪式感和情绪氛围来抬高价值感。',
        '系统会压制无脑粒子和炫光，优先保留工艺特写与叙事节奏。',
      ],
      functionVsMood: mode === 'function' ? 35 : 22,
      realismVsSpectacle: mode === 'brand' ? 38 : 30,
      restraintVsImpact: mode === 'feed' ? 56 : 34,
      mustShow: ['佩戴仪式感', '工艺级细节特写', ...selectedPoints.slice(0, 2)],
      avoid: ['廉价闪光特效', '直白硬卖', '全程没有人物情绪承接'],
      narrative: ['开场先营造人物情绪缺口', '中段让珠宝成为关系或自我表达的符号', '结尾把品牌意味落成记忆点'],
      alternates: [
        { title: '极简工艺陈列片', description: '更克制，适合官网和门店屏。' },
        { title: '高奢节庆礼赠版', description: '更偏礼物语境和社交传播。' },
      ],
    };
  }

  if (form.category === 'skincare') {
    return {
      title: '推荐方向：功效可视化护肤广告',
      subtitle: '把成分机制、真人肌肤和产品使用触感穿成一条可信又高级的体验线。',
      why: [
        '护肤品既要让用户看懂“为什么有效”，也要让人感受到真实肤感变化。',
        '系统会平衡分子特效和真人镜头，避免只剩实验室动画或纯颜值大片。',
      ],
      functionVsMood: mode === 'story' ? 48 : 62,
      realismVsSpectacle: 52,
      restraintVsImpact: mode === 'feed' ? 66 : 50,
      mustShow: ['真人肤质近景', '成分机理可视化', ...selectedPoints.slice(0, 2)],
      avoid: ['空泛“发光皮肤”镜头', '只有瓶身转圈', '成分特效与真人镜头完全脱节'],
      narrative: ['先放大肌肤痛点或渴望', '中段解释产品如何作用', '结尾回到真人肤感与产品记忆'],
      alternates: [
        { title: '质地感官大片', description: '更偏审美和品牌调性。' },
        { title: '高转化成分拆解版', description: '更适合信息流投放。' },
      ],
    };
  }

  return {
    title: '推荐方向：工程美学性能广告',
    subtitle: '用结构、交互和速度感建立“这东西很强”的可信度，再推高未来感。',
    why: [
      '科技产品的高级感来自精密结构和真实反馈，不是把它拍成珠宝。',
      '系统会保证交互镜头和性能场景有足够分量，避免只剩漂亮外壳。',
    ],
    functionVsMood: 64,
    realismVsSpectacle: 58,
    restraintVsImpact: mode === 'feed' ? 68 : 54,
    mustShow: ['关键交互反馈', '核心结构特写', ...selectedPoints.slice(0, 2)],
    avoid: ['只拍外观不拍使用', '悬浮UI过载', '没有性能落点的科幻包装'],
    narrative: ['开场用精密细节吸睛', '中段快速证明交互与性能', '结尾用整机英雄镜固化记忆'],
    alternates: [
      { title: '极简官网陈列版', description: '更克制，适合产品发布页。' },
      { title: '性能对比版', description: '更偏卖点与效率展示。' },
    ],
  };
}

function buildStrategyChoices(form: FormState): StrategyChoice[] {
  const product = form.productName || '这个产品';
  const pointA = form.sellingPoints[0] ?? profiles[form.category].points[0];
  const pointB = form.sellingPoints[1] ?? profiles[form.category].points[1];
  const pointC = form.sellingPoints[2] ?? profiles[form.category].points[2];
  const pick = (mode: StrategyMode) => buildStrategy(form, mode);

  if (form.category === 'tool') {
    return [
      {
        mode: 'recommended',
        title: '反差大片版',
        subtitle: `先把 ${product} 拍得很贵、很猛，再很快让人看到它真的好用。`,
        thinking: `系统判断这类产品更适合走“高成本感 + 真功能”的路线。因为用户最后不会为特效买单，他们会为 ${pointA}、${pointB} 和真实使用效果买单。这版的目标是先抓住眼球，再把注意力转成功能信任。`,
        lines: [
          '第一感觉：普通工具也能拍得这么厉害',
          `重点会放在：${pointA}、${pointB} 和使用动作`,
          '更适合：既想抓眼球，也想卖货',
        ],
        narrative: pick('recommended').narrative,
        avoid: ['不会让特效抢走功能镜头', '不会只拍材质不拍动作'],
      },
      {
        mode: 'function',
        title: '直接卖货版',
        subtitle: `更快进入使用场景，让人马上看懂 ${product} 为什么值得买。`,
        thinking: `如果你更关心转化，这版会把好看的空镜压短，尽快进入真实使用。系统会优先拍清楚 ${pointA} 和 ${pointC}，让观众看完立刻明白“它到底解决什么问题”。`,
        lines: [
          '第一感觉：这东西看起来就很能干活',
          '重点会放在：上手、发力、结果差异',
          '更适合：投流、电商、短视频前3秒抢人',
        ],
        narrative: pick('function').narrative,
        avoid: ['不会铺太多情绪段落', '不会把节奏拖慢'],
      },
      {
        mode: 'story',
        title: '品牌感叙事版',
        subtitle: `加入人物和场景，让 ${product} 更像一个可靠、值得信任的品牌选择。`,
        thinking: `如果你希望用户记住的不只是功能，而是“这牌子看起来就靠谱”，这一版会更克制。系统会保留功能动作，但会把它放进人物和场景里，让产品的价值更像一种态度。`,
        lines: [
          '第一感觉：这不只是工具，更像一种可靠感',
          '重点会放在：人物状态、场景情绪和关键动作',
          '更适合：品牌内容、官网、招商传播',
        ],
        narrative: pick('story').narrative,
        avoid: ['不会变成纯文艺片', '不会丢掉最关键的功能镜头'],
      },
    ];
  }

  if (form.category === 'luxury') {
    return [
      {
        mode: 'recommended',
        title: '故事情绪版',
        subtitle: `先让人进入情绪，再让 ${product} 成为那一刻最贵、最有意味的存在。`,
        thinking: `系统把这类产品理解成更需要“被感受”而不是“被解释”的商品。观众不需要看一堆特效，他们更需要被情绪、人物状态和 ${pointA} 的细节打动。这版的目标是让人先想要，再记住品牌气质。`,
        lines: [
          '第一感觉：这件东西很贵，而且有情绪',
          `重点会放在：人物、仪式感和 ${pointA}`,
          '更适合：品牌片、节日礼赠、高级传播',
        ],
        narrative: pick('recommended').narrative,
        avoid: ['不会堆廉价闪光特效', '不会把珠宝拍成普通卖货片'],
      },
      {
        mode: 'feed',
        title: '轻种草版',
        subtitle: `保留高级感，但会更快地让观众看到佩戴效果和记忆点。`,
        thinking: `如果你希望它更适合短视频传播，这版会缩短铺垫，尽早给出佩戴后的状态和最打动人的画面。系统会让高级感保留，但不会让节奏太慢。`,
        lines: [
          '第一感觉：戴上就很想拥有',
          '重点会放在：佩戴前后、记忆点、节奏更轻快',
          '更适合：短视频种草、社媒传播',
        ],
        narrative: pick('feed').narrative,
        avoid: ['不会把故事讲太长', '不会削弱产品本身的出现频率'],
      },
      {
        mode: 'brand',
        title: '工艺陈列版',
        subtitle: `更少故事，更克制地放大 ${product} 的材质、工艺和品牌气质。`,
        thinking: `如果你更想让用户记住“这件东西本身很了不起”，这版会把篇幅集中在工艺和陈列感上。系统会弱化剧情，强化细节，让整个片子更像高定展示。`,
        lines: [
          '第一感觉：工艺非常讲究',
          `重点会放在：${pointA}、材质、光线和陈列方式`,
          '更适合：官网、店屏、发布会物料',
        ],
        narrative: pick('brand').narrative,
        avoid: ['不会加入过多人物冲突', '不会做太多热闹转场'],
      },
    ];
  }

  if (form.category === 'skincare') {
    return [
      {
        mode: 'recommended',
        title: '平衡说服版',
        subtitle: `既让人觉得 ${product} 很高级，也让人看懂它为什么有效。`,
        thinking: `系统判断这类产品最怕两件事：只剩瓶身美感，或者只剩一堆分子动画。这版会把真人肤感、成分解释和 ${pointA} 放在同一条线上，让它既好看又可信。`,
        lines: [
          '第一感觉：这款产品看起来有质感，也有道理',
          '重点会放在：真人肌肤、成分解释、质地体验',
          '更适合：大多数品牌主片和主投放素材',
        ],
        narrative: pick('recommended').narrative,
        avoid: ['不会只剩实验室特效', '不会只有瓶身转圈'],
      },
      {
        mode: 'function',
        title: '功效直给版',
        subtitle: `更快说明 ${product} 的作用逻辑，让用户尽快建立“这个能解决问题”的感觉。`,
        thinking: `如果你更重视转化，这版会更直接。系统会更快讲清楚 ${pointB} 和 ${pointC}，减少情绪铺垫，把“为什么值得试”放在更前面。`,
        lines: [
          '第一感觉：这个产品是真的在解决皮肤问题',
          '重点会放在：问题、机理、结果',
          '更适合：投流、转化导向、成分党沟通',
        ],
        narrative: pick('function').narrative,
        avoid: ['不会把时间花太多在情绪镜头上', '不会把信息讲得太虚'],
      },
      {
        mode: 'story',
        title: '审美情绪版',
        subtitle: `更像一支高级护肤大片，让 ${product} 先被喜欢，再被理解。`,
        thinking: `如果你更想让品牌看起来有审美、有生活方式，这版会更温柔也更克制。系统仍会保留产品作用，但节奏会更注重情绪和使用感受。`,
        lines: [
          '第一感觉：这是一种很想拥有的生活状态',
          '重点会放在：肤感、人物状态、产品气质',
          '更适合：品牌内容、社媒形象片',
        ],
        narrative: pick('story').narrative,
        avoid: ['不会把成分解释完全删掉', '不会变成纯颜值空片'],
      },
    ];
  }

  return [
    {
      mode: 'recommended',
      title: '平衡高级版',
      subtitle: `让 ${product} 同时看起来很强、也很高级。`,
      thinking: `系统认为这类产品最重要的是先建立“它真的很厉害”的感觉，再让外观和质感去放大这种信任。这版会在 ${pointA} 和 ${pointB} 之间做平衡，既不会太硬，也不会太飘。`,
      lines: [
        '第一感觉：这东西性能强，而且做工很好',
        '重点会放在：结构、交互、性能场景',
        '更适合：大多数产品主片',
      ],
      narrative: pick('recommended').narrative,
      avoid: ['不会只拍外观', '不会做太浮的科幻包装'],
    },
    {
      mode: 'function',
      title: '性能直给版',
      subtitle: `更快告诉用户 ${product} 到底强在哪，用起来爽在哪。`,
      thinking: `如果你更看重卖点被迅速看懂，这版会把性能和交互放在更前面。系统会更直接地展示 ${pointA} 和 ${pointC}，减少不必要的情绪铺垫。`,
      lines: [
        '第一感觉：功能很强，体验很快',
        '重点会放在：核心交互、速度、反馈',
        '更适合：投流、发布卖点剪辑',
      ],
      narrative: pick('function').narrative,
      avoid: ['不会让参数变得太晦涩', '不会铺太多抒情段落'],
    },
    {
      mode: 'brand',
      title: '发布会大片版',
      subtitle: `更像高规格发布片，让 ${product} 看起来像一个面向未来的作品。`,
      thinking: `如果你想让用户先记住品牌气质，这版会更强调设计、结构和高级感。系统会保留关键功能，但整体更像一次正式亮相，而不是一支快消卖货片。`,
      lines: [
        '第一感觉：品牌很强，产品也很有格调',
        '重点会放在：设计语言、整体气场、关键亮点',
        '更适合：发布会、官网、品牌传播',
      ],
      narrative: pick('brand').narrative,
      avoid: ['不会只剩概念感画面', '不会完全放弃真实使用语境'],
    },
  ];
}

function buildSolution(form: FormState, strategy: StrategyCard, customPrompt: string, tweaks: string[]): SolutionCard {
  const pointA = form.sellingPoints[0] ?? profiles[form.category].points[0];
  const pointB = form.sellingPoints[1] ?? profiles[form.category].points[1];
  const pointC = form.sellingPoints[2] ?? profiles[form.category].points[2];
  const tweakText = tweaks.length > 0 ? ` 已叠加微调：${tweaks.join('、')}。` : '';
  const customText = customPrompt.trim() ? ` 本轮高级修改要求：${customPrompt.trim()}。` : '';

  if (form.category === 'tool') {
    return {
      idea: `把 ${form.productName} 拍成一件像重工业艺术装置一样昂贵的产品，但镜头始终围绕 ${pointA}、${pointB} 和真实使用效果展开。`,
      rationale: `当前方案会先用超规格视觉钩子吸住注意力，再立刻把镜头拉回真实功能，确保这支片子既有反差感也有转化力。${tweakText}${customText}`,
      directionTag: '功能反差',
      scenes: [
        { id: '01', title: '开场钩子', objective: '用反差成本感抓住注意力', visual: '黑场中，铲头像航天合金一样被冷光切开，砂石和金属颗粒在镜头前悬停。', payoff: '先让“普通工具也能拍得如此昂贵”成立。', frameTone: '工业冷光 + 微距' },
        { id: '02', title: '功能进入现实', objective: '从奇观切回可信功能', visual: '镜头落到真实土层，手部一把握紧，铲头干净切入硬土。', payoff: `明确展示 ${pointA}。`, frameTone: '高对比纪实' },
        { id: '03', title: '省力机制', objective: '让用户感知使用收益', visual: '慢镜头拆解握柄受力路径，金属结构与真人动作叠化。', payoff: `把 ${pointB} 可视化。`, frameTone: '结构示意 + 真人' },
        { id: '04', title: '连续证明', objective: '把卖点变成连贯证据', visual: '快速切换户外、园艺、工程等场景，动作都短、准、狠。', payoff: `让 ${pointC} 和适配场景一起被记住。`, frameTone: '快切功能蒙太奇' },
        { id: '05', title: '英雄镜', objective: '建立产品的高级记忆', visual: '泥土甩落后，产品立于极简空间，铲面残留真实使用痕迹。', payoff: '让高级感建立在“被验证过”的基础上。', frameTone: '英雄定妆镜' },
        { id: '06', title: '收束口号', objective: '用一句价值判断完成收口', visual: '镜头推进 Logo 与产品名，背景仍保留轻微尘土运动。', payoff: '让品牌与可靠感绑定。', frameTone: '克制收尾' },
      ],
    };
  }

  if (form.category === 'luxury') {
    return {
      idea: `围绕 ${form.productName} 做一支有情绪牵引的故事化短片，让珠宝作为人物情绪与身份表达的高潮出现。`,
      rationale: `当前方案会压低无意义特效，把主要篇幅留给人物状态、仪式感和工艺细节，让产品显得贵而且有意义。${tweakText}${customText}`,
      directionTag: '故事情绪',
      scenes: [
        { id: '01', title: '情绪起势', objective: '先建立人物氛围', visual: '人物站在低照度空间，风声和布料运动先出现，珠宝暂不露全。', payoff: '先让观众进入情绪，不急着卖产品。', frameTone: '低饱和电影感' },
        { id: '02', title: '第一次显露', objective: '让产品像叙事线索而不是道具', visual: '指尖掠过首饰盒，局部折射出宝石和金属边缘。', payoff: `突出 ${pointA} 的工艺感。`, frameTone: '局部高光' },
        { id: '03', title: '佩戴仪式', objective: '把产品和人物身份连接起来', visual: '耳侧、锁骨、指尖的佩戴动作被拆成克制而优雅的细节镜头。', payoff: `让 ${pointB} 和仪式感绑定。`, frameTone: '慢镜细节' },
        { id: '04', title: '情绪兑现', objective: '让人物关系或自我表达完成转折', visual: '人物进入光线更开阔的空间，回眸或抬手带出完整佩戴状态。', payoff: `把 ${pointC} 变成情绪高潮的一部分。`, frameTone: '叙事推进' },
        { id: '05', title: '品牌寓意', objective: '补品牌理念，而不是讲参数', visual: '珠宝在极简背景中缓慢旋转，伴随一句高度凝练的品牌表达。', payoff: '让产品背后有价值观和审美立场。', frameTone: '高奢陈列' },
        { id: '06', title: '余韵结尾', objective: '留下可回味的记忆点', visual: '人物离开画面，只留珠宝反光与品牌标识。', payoff: '把记忆定格在情绪余韵里。', frameTone: '留白收束' },
      ],
    };
  }

  if (form.category === 'skincare') {
    return {
      idea: `把 ${form.productName} 做成一支“有功效逻辑的高级护肤广告”，让成分机理、质地感和真人肌肤变化彼此互相证明。`,
      rationale: `当前方案会控制分子特效的比例，优先保证真人肌肤质感真实可信，再用视觉化方式解释为什么它有效。${tweakText}${customText}`,
      directionTag: '功效可视化',
      scenes: [
        { id: '01', title: '痛点开场', objective: '快速唤起需求', visual: '真人肌肤局部近景，细小纹理和干燥感被温柔但真实地看见。', payoff: '先让用户知道“为什么需要这款产品”。', frameTone: '柔光微距' },
        { id: '02', title: '质地登场', objective: '建立高级感与使用欲', visual: '精华液在玻璃与肌肤之间流动，黏度和折射都很克制。', payoff: `让 ${pointA} 从触觉角度被感知。`, frameTone: '液体微观' },
        { id: '03', title: '成分机理', objective: '解释产品如何工作', visual: '分子结构和皮肤截面短暂可视化，再回到真人肌肤。', payoff: `把 ${pointB} 说清楚。`, frameTone: '科学可视化' },
        { id: '04', title: '真人吸收', objective: '把机制回落到真实体验', visual: '手部推开产品，脸部和肌肤纹理在光线下逐渐更均匀。', payoff: `让 ${pointC} 可信地出现。`, frameTone: '真人肤感' },
        { id: '05', title: '产品多角度', objective: '加深品牌和包装记忆', visual: '瓶身在轻微流体光影里做多角度展示，但每次出现都带着成分或肤感语义。', payoff: '避免瓶身空转，让产品外观与功效关系更紧。', frameTone: '高级产品镜' },
        { id: '06', title: '结果收束', objective: '把功效和情绪同时落下', visual: '真人自然状态镜头收尾，再回到产品和品牌名。', payoff: '留下一种“看起来就想试”的可信感。', frameTone: '温和结束' },
      ],
    };
  }

  return {
    idea: `把 ${form.productName} 做成一支偏工程美学的性能短片，用结构细节和使用反馈证明它的高级感。`,
    rationale: `当前方案会让性能、交互和材质形成同一个语言系统，避免只剩漂亮外观没有真实落点。${tweakText}${customText}`,
    directionTag: '性能工程',
    scenes: [
      { id: '01', title: '结构吸睛', objective: '用细节建立高级感', visual: '机身边缘、接口、曲面和材质纹理在极近距离下被依次揭示。', payoff: '先让“做工很强”成立。', frameTone: '冷峻微距' },
      { id: '02', title: '交互反馈', objective: '证明它不只是外观好看', visual: '手指触发核心功能，灯效、界面与实体动作同步响应。', payoff: `快速带出 ${pointA}。`, frameTone: '真实反馈' },
      { id: '03', title: '性能场景', objective: '把参数变成体验', visual: '设备进入高强度使用场景，速度和稳定性通过镜头节奏体现。', payoff: `让 ${pointB} 被看懂。`, frameTone: '高节奏性能段落' },
      { id: '04', title: '结构拆解', objective: '建立可信度', visual: '局部爆炸图式的拆解，但仍紧贴真实结构而不是悬浮科幻 UI。', payoff: `把 ${pointC} 做成可信的工程优势。`, frameTone: '半写实示意' },
      { id: '05', title: '整机英雄镜', objective: '巩固品牌与产品记忆', visual: '整机在大面积负空间中完成转身，光线沿轮廓扫过。', payoff: '把高级感与品牌绑定。', frameTone: '克制英雄镜' },
      { id: '06', title: '价值收口', objective: '给用户一个明确判断', visual: '简洁口号和设备状态画面同时收束。', payoff: '让人记住它为什么值得买。', frameTone: '简练结尾' },
    ],
  };
}

type PrototypeV2Props = {
  user: User;
};

export default function PrototypeV2({ user }: PrototypeV2Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>(1);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [recognitionSource, setRecognitionSource] = useState('等待上传产品图');
  const [advancedPrompt, setAdvancedPrompt] = useState('');
  const [nameEdited, setNameEdited] = useState(false);
  const [strategyMode, setStrategyMode] = useState<StrategyMode | null>(null);
  const [activeTweaks, setActiveTweaks] = useState<string[]>([]);
  const [customPointInput, setCustomPointInput] = useState('');
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [sceneEdits, setSceneEdits] = useState<Record<string, string>>({});
  const [sceneCommands, setSceneCommands] = useState<Record<string, string[]>>({});
  const [sceneVoiceInput, setSceneVoiceInput] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('尚未保存到项目');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [currentProjectStatus, setCurrentProjectStatus] = useState<PersistProjectStatus | null>(null);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [versions, setVersions] = useState<ProjectVersionSummary[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [isVersionsLoading, setIsVersionsLoading] = useState(false);
  const [isRestoringProject, setIsRestoringProject] = useState(false);
  const [projectsMessage, setProjectsMessage] = useState('');
  const [form, setForm] = useState<FormState>({
    productName: '',
    category: 'tool',
    goal: 50,
    ageRange: [22, 40],
    sellingPoints: [],
    audience: '',
    note: '',
  });

  const currentProfile = profiles[form.category];
  const activeStrategyMode = strategyMode ?? 'recommended';
  const strategy = useMemo(() => buildStrategy(form, activeStrategyMode), [activeStrategyMode, form]);
  const strategyChoices = useMemo(() => buildStrategyChoices(form), [form]);
  const solution = useMemo(
    () => buildSolution(form, strategy, advancedPrompt, activeTweaks),
    [activeTweaks, advancedPrompt, form, strategy],
  );

  const refreshProjects = async (nextProjectId?: string | null) => {
    setIsProjectsLoading(true);

    try {
      const nextProjects = await listProjectsForUser(user);
      setProjects(nextProjects);
      setProjectsMessage(nextProjects.length === 0 ? '还没有历史项目，从当前页开始创建即可。' : '');

      const activeId = nextProjectId ?? projectId;
      if (activeId) {
        const nextVersions = await listVersionsForProject(user, activeId);
        setVersions(nextVersions);
      } else {
        setVersions([]);
      }
    } catch (error) {
      setProjectsMessage(error instanceof Error ? error.message : '读取项目失败，请稍后再试。');
    } finally {
      setIsProjectsLoading(false);
    }
  };

  const refreshVersions = async (nextProjectId: string) => {
    setIsVersionsLoading(true);

    try {
      const nextVersions = await listVersionsForProject(user, nextProjectId);
      setVersions(nextVersions);
    } catch (error) {
      setProjectsMessage(error instanceof Error ? error.message : '读取版本失败，请稍后再试。');
    } finally {
      setIsVersionsLoading(false);
    }
  };

  useEffect(() => {
    void refreshProjects();
  }, [user.id]);

  const resetProjectPersistence = () => {
    setProjectId(null);
    setVersionId(null);
    setCurrentProjectStatus(null);
    setSaveState('idle');
    setSaveMessage('尚未保存到项目');
    setLastSavedAt(null);
    setVersions([]);
  };

  const buildScenePayload = () =>
    solution.scenes.map((scene) => ({
      id: scene.id,
      title: scene.title,
      objective: scene.objective,
      visual: sceneEdits[scene.id] ?? scene.visual,
      payoff: scene.payoff,
      frameTone: scene.frameTone,
      commands: sceneCommands[scene.id] ?? [],
    }));

  const persistCurrentProject = async (status: PersistProjectStatus) => {
    setSaveState('saving');
    setSaveMessage('正在保存项目...');

    try {
      const persisted = await persistProjectSnapshot({
        user,
        projectId,
        versionId,
        projectName: form.productName || currentProfile.defaultName,
        category: form.category,
        recognitionSource,
        previews,
        goal: form.goal,
        ageRange: form.ageRange,
        sellingPoints: form.sellingPoints,
        note: form.note,
        status,
        strategyMode,
        activeTweaks,
        advancedPrompt,
        formSnapshot: {
          productName: form.productName,
          category: form.category,
          goal: form.goal,
          ageRange: form.ageRange,
          sellingPoints: form.sellingPoints,
          note: form.note,
          recognitionSource,
          previews,
        },
        strategySnapshot: strategyMode
          ? {
              mode: strategyMode,
              title: strategy.title,
              subtitle: strategy.subtitle,
              mustShow: strategy.mustShow,
              avoid: strategy.avoid,
            }
          : null,
        scenes: buildScenePayload(),
      });

      const timestamp = new Date().toISOString();
      setProjectId(persisted.projectId);
      setVersionId(persisted.versionId);
      setCurrentProjectStatus(status);
      setSaveState('saved');
      setSaveMessage(status === 'submitted' ? '项目已提交保存' : '项目草稿已保存');
      setLastSavedAt(timestamp);
      void refreshProjects(persisted.projectId);

      return true;
    } catch (error) {
      setSaveState('error');
      setSaveMessage(error instanceof Error ? error.message : '保存失败，请稍后再试。');
      return false;
    }
  };

  const applyProfile = (profile: ProductProfile, source: string, nextPreviews: string[]) => {
    resetProjectPersistence();
    setRecognitionSource(source);
    setPreviews(nextPreviews);
    setForm({
      productName: profile.defaultName,
      category: profile.key,
      goal: profile.goal,
      ageRange: profile.ageRange,
      sellingPoints: profile.points.slice(0, 4),
      audience: profile.audience,
      note: profile.note,
    });
    setStrategyMode(null);
    setActiveTweaks([]);
    setAdvancedPrompt('');
    setCustomPointInput('');
    setEditingSceneId(null);
    setSceneEdits({});
    setSceneCommands({});
    setSceneVoiceInput('');
    setNameEdited(false);
  };

  const simulateRecognition = async (profile: ProductProfile, source: string, nextPreviews: string[]) => {
    setIsRecognizing(true);
    await new Promise((resolve) => window.setTimeout(resolve, 1200));
    applyProfile(profile, source, nextPreviews);
    setIsRecognizing(false);
  };

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    const pickedFiles = files.slice(0, 4);
    const filePreviews = await Promise.all(
      pickedFiles.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.readAsDataURL(file);
          }),
      ),
    );

    const inferred = inferProfileFromName(pickedFiles[0].name);
    await simulateRecognition(inferred, `识别自：${pickedFiles[0].name}`, filePreviews);
  };

  const handleDemoPick = async (key: ProfileKey) => {
    const profile = profiles[key];
    const preview = createDemoImage(profile.defaultName, profile.colors[0], profile.colors[1]);
    await simulateRecognition(profile, `Demo：${profile.label}`, [preview]);
  };

  const updateAgeRange = (index: 0 | 1, nextValue: number) => {
    setForm((current) => {
      const [minAge, maxAge] = current.ageRange;
      if (index === 0) {
        return {
          ...current,
          ageRange: [Math.min(nextValue, maxAge - 2), maxAge],
        };
      }

      return {
        ...current,
        ageRange: [minAge, Math.max(nextValue, minAge + 2)],
      };
    });
  };

  const togglePoint = (point: string) => {
    setForm((current) => {
      const exists = current.sellingPoints.includes(point);
      return {
        ...current,
        sellingPoints: exists
          ? current.sellingPoints.filter((item) => item !== point)
          : [...current.sellingPoints, point],
      };
    });
  };

  const toggleQuickTweak = (tweak: string) => {
    setActiveTweaks((current) =>
      current.includes(tweak)
        ? current.filter((item) => item !== tweak)
        : [...current, tweak],
    );
  };

  const addSellingPoint = () => {
    const next = customPointInput.trim();
    if (!next) return;

    setForm((current) => ({
      ...current,
      sellingPoints: [next, ...current.sellingPoints.filter((item) => item !== next)],
    }));
    setCustomPointInput('');
  };

  const recognizedReady = Boolean(form.productName.trim()) || previews.length > 0;
  const availablePoints = Array.from(new Set([...currentProfile.points, ...form.sellingPoints]));
  const ageMinPercent = (form.ageRange[0] / 80) * 100;
  const ageMaxPercent = (form.ageRange[1] / 80) * 100;
  const editingScene = solution.scenes.find((scene) => scene.id === editingSceneId) ?? null;
  const stageMeta = {
    1: {
      label: '上传产品',
      caption: '先让我看见产品，再帮你补全方向。',
      detail: '上传一张产品图，系统会先识别产品信息，再把需要你确认的部分留下来。',
    },
    2: {
      label: '挑一个方向',
      caption: '先选拍法，再进生成。',
      detail: '我会把对产品的理解整理成 3 种不同气质的方向，你只需要挑一个最接近想法的。',
    },
    3: {
      label: '看看分镜',
      caption: '先看画面感觉，再决定提交。',
      detail: '这一页不先给你长脚本，只看分镜感受，并允许你逐镜微调。',
    },
  } as const;
  const currentStage = stageMeta[step];
  const saveToneClass =
    saveState === 'error'
      ? 'border-[#ef4444]/20 bg-[#ef4444]/10 text-[#fecaca]'
      : saveState === 'saved'
        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100'
        : 'border-white/10 bg-white/[0.04] text-white/55';
  const saveStatusLabel =
    saveState === 'saving'
      ? '正在保存...'
      : saveState === 'saved' && saveMessage === '已恢复历史项目'
        ? saveMessage
        : saveState === 'saved' && lastSavedAt
        ? `已保存 ${new Date(lastSavedAt).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          })}`
        : saveMessage;
  const panelClass =
    'rounded-[30px] border border-white/10 bg-[#080808]/92 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.48)] backdrop-blur-2xl';
  const softCardClass =
    'rounded-[24px] border border-white/10 bg-white/[0.04] shadow-[0_18px_44px_rgba(0,0,0,0.26)]';
  const secondaryButtonClass =
    'inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm text-white/72 transition hover:border-white/22 hover:bg-white/[0.09]';
  const primaryButtonClass =
    'inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-[#050505] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/45';
  const softPillClass =
    'rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white/70 shadow-[0_10px_28px_rgba(0,0,0,0.18)] backdrop-blur';

  const openSceneEditor = (sceneId: string) => {
    setEditingSceneId(sceneId);
    setSceneVoiceInput('');
  };

  const updateSceneEdit = (sceneId: string, nextText: string) => {
    setSceneEdits((current) => ({ ...current, [sceneId]: nextText }));
  };

  const applySceneVoiceCommand = () => {
    if (!editingScene || !sceneVoiceInput.trim()) return;

    const command = sceneVoiceInput.trim();
    setSceneCommands((current) => ({
      ...current,
      [editingScene.id]: [...(current[editingScene.id] ?? []), command],
    }));
    setSceneEdits((current) => ({
      ...current,
      [editingScene.id]: `${current[editingScene.id] ?? editingScene.visual}\n\n当前微调指令：${command}`,
    }));
    setSceneVoiceInput('');
  };

  const handleContinueToStrategy = async () => {
    if (!recognizedReady) {
      setSaveState('error');
      setSaveMessage('先上传一张产品图，或者先填一个产品名称。');
      return;
    }

    const saved = await persistCurrentProject('draft');
    if (saved) {
      setStep(2);
    }
  };

  const handleGenerateStoryboard = async () => {
    const saved = await persistCurrentProject('storyboard_ready');
    if (saved) {
      setStep(3);
    }
  };

  const handleSubmitProject = async () => {
    await persistCurrentProject('submitted');
  };

  const handleRestoreProject = async (targetProjectId: string, targetVersionId?: string) => {
    setIsRestoringProject(true);
    setSaveState('saving');
    setSaveMessage('正在恢复项目...');

    try {
      const snapshot = await loadProjectSnapshot(user, targetProjectId, targetVersionId);
      const nextCategory = (
        snapshot.formSnapshot.category in profiles ? snapshot.formSnapshot.category : 'tool'
      ) as ProfileKey;
      const nextStep: Step =
        snapshot.status === 'storyboard_ready' || snapshot.status === 'submitted'
          ? 3
          : snapshot.strategyMode
            ? 2
            : 1;

      setProjectId(snapshot.projectId);
      setVersionId(snapshot.versionId);
      setCurrentProjectStatus(snapshot.status);
      setRecognitionSource(snapshot.recognitionSource);
      setPreviews(snapshot.previews);
      setForm({
        productName: snapshot.formSnapshot.productName,
        category: nextCategory,
        goal: snapshot.formSnapshot.goal,
        ageRange: snapshot.formSnapshot.ageRange,
        sellingPoints: snapshot.formSnapshot.sellingPoints,
        audience: '',
        note: snapshot.formSnapshot.note,
      });
      setStrategyMode((snapshot.strategyMode as StrategyMode | null) ?? null);
      setActiveTweaks(snapshot.activeTweaks);
      setAdvancedPrompt(snapshot.advancedPrompt);
      setSceneEdits(
        Object.fromEntries(snapshot.scenes.map((scene) => [scene.id, scene.visual])),
      );
      setSceneCommands(
        Object.fromEntries(snapshot.scenes.map((scene) => [scene.id, scene.commands])),
      );
      setSceneVoiceInput('');
      setEditingSceneId(null);
      setNameEdited(false);
      setStep(nextStep);
      setSaveState('saved');
      setSaveMessage('已恢复历史项目');
      setLastSavedAt(snapshot.updatedAt);
      await refreshVersions(snapshot.projectId);
    } catch (error) {
      setSaveState('error');
      setSaveMessage(error instanceof Error ? error.message : '恢复项目失败，请稍后再试。');
    } finally {
      setIsRestoringProject(false);
    }
  };

  const stageOne = (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className={panelClass}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/36">Upload</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">先给我看你的产品</h2>
          </div>
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus size={16} />
            选择图片
          </button>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-6 flex min-h-[320px] w-full flex-col items-center justify-center rounded-[28px] border border-dashed border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03),rgba(255,255,255,0.02))] px-6 text-center transition hover:border-white/24 hover:shadow-[0_22px_55px_rgba(0,0,0,0.28)]"
        >
          {previews.length > 0 ? (
            <div className="w-full">
              <img
                src={previews[0]}
                alt="Product preview"
                className="h-[250px] w-full rounded-[22px] object-cover shadow-[0_18px_40px_rgba(177,150,136,0.18)]"
              />
              <div className="mt-4 flex gap-3 overflow-auto pb-1">
                {previews.map((preview, index) => (
                  <img
                    key={`${preview}-${index}`}
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="h-16 w-20 rounded-xl border border-white/10 object-cover shadow-[0_12px_24px_rgba(0,0,0,0.26)]"
                  />
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-full border border-white/10 bg-white/10 p-4 text-white shadow-[0_16px_35px_rgba(0,0,0,0.28)]">
                <Upload size={28} />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-white">上传一张产品图，系统自动帮你补</h3>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/58">
                优先用图片启动流程，再由系统补全产品名称、类型、卖点和广告方向。你只负责确认和修正。
              </p>
            </>
          )}
        </button>

        <div className="mt-5 flex flex-wrap gap-3">
          {categoryOptions.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => void handleDemoPick(key)}
              className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white/70 transition hover:border-white/20 hover:bg-white/[0.08]"
            >
              试试 Demo：{label}
            </button>
          ))}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            const pickedFiles = Array.from(event.target.files ?? []) as File[];
            void handleFileUpload(pickedFiles);
            event.target.value = '';
          }}
        />
      </section>

      <section className={panelClass}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/36">Recognition</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">我先替你补一版基础信息</h2>
            <p className="mt-2 text-sm text-white/58">系统先看懂产品，再把需要你确认的地方留出来。</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-medium text-white/68">
            {recognitionSource}
          </span>
        </div>

        {isRecognizing ? (
          <div className="mt-8 space-y-5">
            <div className="h-14 animate-pulse rounded-2xl bg-white/[0.05]" />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="h-28 animate-pulse rounded-2xl bg-white/[0.05]" />
              <div className="h-28 animate-pulse rounded-2xl bg-white/[0.05]" />
            </div>
            <div className="h-36 animate-pulse rounded-2xl bg-white/[0.05]" />
            <p className="text-sm text-white/58">正在识别产品、材质、用途与广告策略建议...</p>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <div className={`${softCardClass} p-5`}>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white">产品名称</label>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${nameEdited ? 'bg-[#ecfccb] text-[#3f6212]' : 'bg-[#eff6ff] text-[#1d4ed8]'}`}>
                  {nameEdited ? '已修改' : '系统识别'}
                </span>
              </div>
              <input
                autoFocus
                value={form.productName}
                 onChange={(event) => {
                   setNameEdited(true);
                   setForm((current) => ({ ...current, productName: event.target.value }));
                 }}
                 placeholder="系统识别后自动填入"
                 className={`mt-3 w-full border-b border-white/10 bg-transparent pb-2 text-2xl font-semibold outline-none ${nameEdited ? 'text-white' : 'text-white/28'}`}
                />
              </div>
            <div className={`${softCardClass} p-5`}>
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-white/40" />
                <span className="text-sm font-medium text-white">
                  广告定位：{goalLabel(form.goal)}
                </span>
              </div>
              <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="50"
                  value={form.goal}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, goal: Number(event.target.value) }))
                  }
                  className="w-full accent-[#6c5750]"
                />
                <div className="mt-3 flex justify-between text-xs text-white/40">
                  {goalMarks.map((mark) => (
                    <span
                      key={mark.value}
                      className={form.goal === mark.value ? 'font-semibold text-white' : ''}
                    >
                      {mark.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className={`${softCardClass} p-5`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">
                  你想打到的年龄段：{form.ageRange[0]} - {form.ageRange[1]} 岁
                </span>
              </div>
              <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-5">
                <div className="relative h-10">
                  <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-white/10" />
                  <div
                    className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-white"
                    style={{ left: `${ageMinPercent}%`, right: `${100 - ageMaxPercent}%` }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={form.ageRange[0]}
                    onChange={(event) => updateAgeRange(0, Number(event.target.value))}
                    className="pointer-events-none absolute left-0 top-1/2 h-10 w-full -translate-y-1/2 appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/40 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg"
                  />
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={form.ageRange[1]}
                    onChange={(event) => updateAgeRange(1, Number(event.target.value))}
                    className="pointer-events-none absolute left-0 top-1/2 h-10 w-full -translate-y-1/2 appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/40 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg"
                  />
                </div>
                <div className="mt-3 flex justify-between text-xs text-white/40">
                  <span>0 岁</span>
                  <span>80 岁</span>
                </div>
              </div>
            </div>

            <div className={`${softCardClass} p-5`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">你最想让广告突出什么？</p>
                  <p className="mt-1 text-xs leading-5 text-white/54">
                    先写你最在意的卖点。系统识别出来的建议你可以直接删掉，不需要保留。
                  </p>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <input
                  value={customPointInput}
                  onChange={(event) => setCustomPointInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addSellingPoint();
                    }
                  }}
                  placeholder="例如：更省力、看起来更贵、一定要突出耐用"
                   className="flex-1 rounded-2xl border border-white/10 bg-[#0b0b0b] px-4 py-3 text-sm text-white outline-none focus:border-white/22"
                 />
                 <button
                   type="button"
                   onClick={addSellingPoint}
                   className="rounded-2xl border border-white/12 bg-white px-5 py-3 text-sm font-medium text-[#050505] transition hover:bg-white/90"
                 >
                   添加
                 </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {availablePoints.map((point) => (
                  <button
                    key={point}
                    type="button"
                    onClick={() => togglePoint(point)}
                   className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white/72 transition hover:border-white/20 hover:bg-white/[0.08]"
                  >
                    {point}
                    <X size={14} />
                  </button>
                ))}
              </div>
            </div>

            <div className={`${softCardClass} p-5`}>
              <label className="text-sm font-medium text-white">还有什么你特别在意？</label>
              <textarea
                value={form.note}
                onChange={(event) =>
                  setForm((current) => ({ ...current, note: event.target.value }))
                }
                rows={4}
                placeholder="例如：不要拍得太浮夸；开头一定要抓人；必须看得出高级感。"
                className="mt-3 w-full rounded-2xl border border-white/10 bg-[#0b0b0b] px-4 py-3 text-sm text-white outline-none focus:border-white/22"
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );

  const stageTwo = (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <section className={panelClass}>
        <p className="text-xs uppercase tracking-[0.3em] text-white/36">Product Snapshot</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">这一版我先这样理解你的产品</h2>
        <div className="mt-6 overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
          {previews[0] ? (
            <img src={previews[0]} alt="Product" className="h-56 w-full object-cover" />
          ) : (
            <div className="flex h-56 items-center justify-center text-white/40">等待产品图</div>
          )}
        </div>
        <div className="mt-6 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/36">产品名称</p>
            <p className="mt-2 text-xl font-semibold text-white">{form.productName || '未填写'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/36">系统识别</p>
            <p className="mt-2 text-sm font-medium text-white/72">{currentProfile.label}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/36">广告定位</p>
            <p className="mt-2 text-sm font-medium text-white/72">{goalLabel(form.goal)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/36">大概想打到的人群年龄</p>
            <p className="mt-2 text-sm font-medium text-white/72">
              {form.ageRange[0]} - {form.ageRange[1]}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/36">你最想被记住的点</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {form.sellingPoints.map((point) => (
                <span key={point} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white/72 shadow-[0_8px_18px_rgba(0,0,0,0.18)]">
                  {point}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={panelClass}>
        <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.24)]">
          <p className="text-sm font-medium text-white">我先按你的意思理解一下</p>
          <div className="mt-3 space-y-3 text-sm leading-7 text-white/62">
            <p>
              这次你不是只想做一条“看上去还行”的视频，而是想把
              <span className="font-semibold text-white"> {form.productName || '这个产品'} </span>
              拍得更对，让人一眼就知道它最值得被记住的地方。
            </p>
            <p>
              你最在意的是
              <span className="font-semibold text-white"> {form.sellingPoints[0] || currentProfile.points[0]} </span>
              和
              <span className="font-semibold text-white"> {form.sellingPoints[1] || currentProfile.points[1]} </span>
              ，所以后面的片子不能只顾着好看，得让这两个点真的被看懂。
            </p>
            <p>
              下面这 3 个方向没有谁更高级，只有气质不同。你挑一个最像你心里那版的就行。
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          {strategyChoices.map((choice) => {
            const selected = strategyMode === choice.mode;
            return (
              <button
                key={choice.mode}
                type="button"
                onClick={() => setStrategyMode(choice.mode)}
                className={`rounded-[24px] border p-5 text-left transition ${
                  selected
                    ? 'border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.08))] text-white shadow-[0_25px_60px_rgba(0,0,0,0.32)]'
                    : 'border-white/10 bg-white/[0.04] text-white shadow-[0_14px_34px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold">{choice.title}</p>
                  {selected ? <BadgeCheck size={18} /> : <Sparkles size={18} className="text-white/38" />}
                </div>
                <p className={`mt-3 text-sm leading-6 ${selected ? 'text-white/85' : 'text-white/58'}`}>
                  {choice.subtitle}
                </p>
                <div className="mt-5 space-y-2">
                  {choice.lines.map((line) => (
                    <div
                      key={line}
                      className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                        selected ? 'bg-white/10 text-white' : 'bg-black/30 text-white/68'
                      }`}
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {strategyMode && (
          <div className="mt-6 rounded-[26px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_16px_42px_rgba(0,0,0,0.24)]">
            <p className="text-sm font-medium text-white">如果你选这版，视频大概会这样走</p>
            <p className="mt-3 text-sm leading-7 text-white/62">
              {strategyChoices.find((item) => item.mode === strategyMode)?.thinking}
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {strategy.narrative.map((item, index) => (
                <div key={item} className="rounded-[18px] border border-white/10 bg-black/30 p-4 shadow-[0_10px_24px_rgba(0,0,0,0.2)]">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/36">第 {index + 1} 段</p>
                  <p className="mt-3 text-sm leading-6 text-white/68">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {(strategyChoices.find((item) => item.mode === strategyMode)?.avoid || []).map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white/68">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );

  const stageThree = (
    <div className="space-y-6">
      <section className={panelClass}>
        <p className="text-xs uppercase tracking-[0.3em] text-white/36">Storyboard Only</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">先看看这版画面是不是对味</h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-white/58">
          这一页只看最后大概会拍成什么样。你可以直接点开某一镜放大看、改文字，或者用一句话去推动图像变化，比如“把产品放大一点”。
        </p>
      </section>

      <section className={panelClass}>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/36">Preview</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">这版视频大概会长这样</h2>
            <p className="mt-2 text-sm leading-6 text-white/58">
              现在先看分镜感受对不对。每一镜都可以单独放大、改单句描述，或者直接用一句话推动图像变化。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-white/68">
              {solution.directionTag}
            </span>
            <button
              type="button"
              onClick={() => {
                setActiveTweaks([]);
                setAdvancedPrompt('');
                setSceneEdits({});
                setSceneCommands({});
              }}
              className={secondaryButtonClass}
            >
              重新来一版
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {solution.scenes.map((scene, index) => {
            const previewText = sceneEdits[scene.id] ?? scene.visual;
            const commands = sceneCommands[scene.id] ?? [];

            return (
              <div
                key={scene.id}
                className="group overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] shadow-[0_14px_34px_rgba(0,0,0,0.24)] transition hover:-translate-y-0.5 hover:border-white/16 hover:shadow-[0_20px_44px_rgba(0,0,0,0.34)]"
              >
                <div
                  className="flex h-44 items-end justify-between p-4 text-white"
                  style={{
                    background: `linear-gradient(135deg, ${currentProfile.colors[0]}, ${index % 2 === 0 ? currentProfile.colors[1] : '#6c5750'})`,
                  }}
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-white/80">镜头 {scene.id}</p>
                    <p className="mt-2 text-lg font-semibold">{scene.title}</p>
                  </div>
                  <Layers3 size={20} className="text-white/85" />
                </div>
                <div className="space-y-3 p-4">
                  <p className="text-sm leading-6 text-white/68">{previewText}</p>
                  {commands.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {commands.slice(-2).map((command) => (
                        <span key={command} className="rounded-full bg-white/[0.07] px-3 py-1 text-xs text-white/68">
                          {command}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openSceneEditor(scene.id)}
                      className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-white/70 transition hover:border-white/20 hover:bg-white/[0.09]"
                    >
                      放大看这一镜
                    </button>
                    <button
                      type="button"
                      onClick={() => openSceneEditor(scene.id)}
                      className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-white/70 transition hover:border-white/20 hover:bg-white/[0.09]"
                    >
                      改这一镜
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );

  const projectRail = (
    <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <div className={panelClass}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/36">Projects</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">继续上次做到一半的项目</h2>
          </div>
          <button
            type="button"
            onClick={() => void refreshProjects()}
            className={secondaryButtonClass}
          >
            {isProjectsLoading ? <LoaderCircle size={15} className="animate-spin" /> : <RefreshCcw size={15} />}
            刷新
          </button>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {projects.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => void handleRestoreProject(project.id)}
              disabled={isRestoringProject}
              className={`overflow-hidden rounded-[24px] border p-4 text-left transition ${
                project.id === projectId
                  ? 'border-white/24 bg-white/[0.08]'
                  : 'border-white/10 bg-white/[0.04] hover:border-white/18 hover:bg-white/[0.06]'
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <div className="flex items-start gap-4">
                {project.previewUrl ? (
                  <img
                    src={project.previewUrl}
                    alt={project.name}
                    className="h-20 w-24 rounded-[18px] object-cover"
                  />
                ) : (
                  <div
                    className="h-20 w-24 rounded-[18px]"
                    style={{
                      background: `linear-gradient(135deg, ${profiles[project.category as ProfileKey]?.colors?.[0] ?? '#6c5750'}, ${
                        profiles[project.category as ProfileKey]?.colors?.[1] ?? '#171717'
                      })`,
                    }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-base font-semibold text-white">{project.name}</p>
                    <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] text-white/56">
                      {projectStatusLabel(project.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/56">
                    上次更新 {new Date(project.updatedAt).toLocaleString('zh-CN', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <div className="mt-3 inline-flex items-center gap-2 text-sm text-white/72">
                    <FolderOpen size={15} />
                    恢复这个项目
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-sm leading-7 text-white/58">
            {isProjectsLoading ? '正在读取项目列表...' : projectsMessage || '还没有保存过的项目。'}
          </div>
        )}
      </div>

      <div className={panelClass}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/36">Versions</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">当前项目的保存节点</h2>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/60">
            {projectStatusLabel(currentProjectStatus)}
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {isVersionsLoading && (
            <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-white/60">
              正在读取版本...
            </div>
          )}

          {!isVersionsLoading &&
            versions.map((version) => (
              <button
                key={version.id}
                type="button"
                onClick={() => {
                  if (projectId) {
                    void handleRestoreProject(projectId, version.id);
                  }
                }}
                disabled={!projectId || isRestoringProject}
                className={`flex w-full items-center justify-between rounded-[22px] border px-4 py-4 text-left transition ${
                  version.id === versionId
                    ? 'border-white/24 bg-white/[0.08]'
                    : 'border-white/10 bg-white/[0.04] hover:border-white/18 hover:bg-white/[0.06]'
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <div>
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-white">
                    <History size={15} />
                    V{version.versionIndex}
                  </div>
                  <p className="mt-2 text-sm text-white/56">{projectStatusLabel(version.status)}</p>
                </div>
                <p className="text-xs leading-5 text-white/46">
                  {new Date(version.updatedAt).toLocaleString('zh-CN', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </button>
            ))}
        </div>

        {!isVersionsLoading && versions.length === 0 && (
          <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-sm leading-7 text-white/58">
            还没有可恢复的历史版本。先保存一次当前项目，版本列表就会出现在这里。
          </div>
        )}
      </div>
    </section>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020202] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.14),transparent_24%),radial-gradient(circle_at_16%_12%,rgba(244,114,182,0.14),transparent_22%),radial-gradient(circle_at_88%_4%,rgba(250,204,21,0.16),transparent_18%)]" />
        <div className="absolute left-[-8%] top-[6%] h-[26rem] w-[26rem] rounded-full bg-[#3b82f6]/10 blur-[140px]" />
        <div className="absolute right-[-8%] top-[-4%] h-[28rem] w-[28rem] rounded-full bg-[#f97316]/12 blur-[150px]" />
        <div className="absolute bottom-[-12%] left-[18%] h-[30rem] w-[30rem] rounded-full bg-[#8b5cf6]/10 blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1480px] px-4 pb-32 pt-6 sm:px-6 lg:px-8">
        <header className="relative overflow-hidden rounded-[40px] border border-white/10 bg-[#030303]/94 px-6 py-6 shadow-[0_42px_130px_rgba(0,0,0,0.62)] backdrop-blur-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_14%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_88%_16%,rgba(147,197,253,0.10),transparent_18%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]" />
          <div className="relative">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70 backdrop-blur">
                <span className="text-[11px] uppercase tracking-[0.38em] text-white/40">Brand</span>
                <span className="font-medium text-white">拍对 RightShot</span>
              </div>
              <div className="hidden items-center gap-6 rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm text-white/48 backdrop-blur lg:flex">
                <span>Upload</span>
                <span>Direction</span>
                <span>Storyboard</span>
                <span>Edit</span>
              </div>
              <div className="inline-flex items-center gap-3">
                <span className={softPillClass}>当前阶段：{currentStage.label}</span>
                <span className={`rounded-full border px-4 py-2 text-sm backdrop-blur ${saveToneClass}`}>
                  {saveStatusLabel}
                </span>
              </div>
            </div>

            <div className="mt-10 grid gap-8 xl:grid-cols-[0.95fr_1.05fr] xl:items-end">
              <div className="max-w-4xl">
                <p className="text-[11px] uppercase tracking-[0.42em] text-white/36">AI storyboard direction engine</p>
                <h1 className="mt-4 text-5xl font-semibold tracking-[-0.06em] text-white sm:text-[5.25rem] sm:leading-[0.92]">
                  先把产品拍对，
                  <br />
                  再把视频做对。
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-8 text-white/60">
                  上传一张产品图，我们先判断它该怎么讲、怎么拍、该强调什么，再给你几个更接近真实商业场景的方向。结构先清楚，画面再出彩。
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <span className={softPillClass}>{currentStage.caption}</span>
                  <span className={softPillClass}>Image-first input</span>
                  <span className={softPillClass}>Editorial dark UI</span>
                </div>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/36">这一步会发生什么</p>
                    <p className="mt-3 text-sm leading-7 text-white/72">{currentStage.detail}</p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/36">设计方向</p>
                    <p className="mt-3 text-sm leading-7 text-white/72">
                      参考 Framer / editorial landing 的黑底、拼贴式内容和玻璃悬浮层，但保留原有三步流程和所有交互。
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
                <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.03] p-4 shadow-[0_20px_55px_rgba(0,0,0,0.32)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.10),transparent_34%)]" />
                  {previews[0] ? (
                    <img
                      src={previews[0]}
                      alt="Hero preview"
                      className="h-[260px] w-full rounded-[22px] object-cover opacity-90"
                    />
                  ) : (
                    <div
                      className="h-[260px] w-full rounded-[22px]"
                      style={{
                        background: `linear-gradient(135deg, ${currentProfile.colors[0]}, ${currentProfile.colors[1]})`,
                      }}
                    />
                  )}
                  <div className="relative mt-4 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-white/40">Current focus</p>
                      <p className="mt-2 text-2xl font-semibold text-white">{form.productName || currentProfile.defaultName}</p>
                      <p className="mt-2 max-w-sm text-sm leading-6 text-white/58">{currentProfile.headline}</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs text-white/70 backdrop-blur">
                      {goalLabel(form.goal)}
                    </span>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
                    <div className="absolute right-[-24px] top-[-24px] h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                    <p className="text-xs uppercase tracking-[0.24em] text-white/36">Detected angle</p>
                    <p className="mt-3 text-2xl font-semibold text-white">{currentProfile.label}</p>
                    <p className="mt-3 text-sm leading-6 text-white/58">{currentProfile.summary}</p>
                  </div>
                  <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/36">Top directions</p>
                    <div className="mt-4 space-y-3">
                      {strategyChoices.slice(0, 3).map((choice, index) => (
                        <div key={choice.mode} className="rounded-[20px] border border-white/10 bg-black/30 px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-white">{choice.title}</p>
                            <span className="text-xs text-white/36">0{index + 1}</span>
                          </div>
                          <p className="mt-2 text-xs leading-5 text-white/52">{choice.subtitle}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {projectRail}

        <main className="mt-6">
          {step === 1 && stageOne}
          {step === 2 && stageTwo}
          {step === 3 && stageThree}
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/65 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="text-sm leading-6 text-white/58">
            {step === 1 && '上传完产品图，下一步我会先把理解整理成几种不同的拍法给你挑。'}
            {step === 2 && '先选一版更接近你想法的方向，再进入分镜，返工会少很多。'}
            {step === 3 && '这一步只看分镜和单镜微调，确认感觉对了再提交。'}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setStep((current) => clamp(current - 1, 1, 3) as Step)}
              disabled={step === 1}
              className={`${secondaryButtonClass} px-5 py-3 disabled:cursor-not-allowed disabled:opacity-40`}
            >
              <ArrowLeft size={16} />
              上一步
            </button>

            {step === 1 && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`${secondaryButtonClass} px-5 py-3`}
                >
                  手动上传
                </button>
                <button
                  type="button"
                  disabled={!recognizedReady || isRecognizing || saveState === 'saving'}
                  onClick={() => void handleContinueToStrategy()}
                  className={primaryButtonClass}
                >
                  继续生成策略
                  <ArrowRight size={16} />
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <button
                  type="button"
                  onClick={() => void handleGenerateStoryboard()}
                  disabled={!strategyMode || saveState === 'saving'}
                  className={primaryButtonClass}
                >
                  生成这个方案
                  <Wand2 size={16} />
                </button>
              </>
            )}

            {step === 3 && (
              <>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className={`${secondaryButtonClass} px-5 py-3`}
                >
                  返回策略
                </button>
                <button
                  type="button"
                  onClick={() => void handleSubmitProject()}
                  disabled={saveState === 'saving'}
                  className={primaryButtonClass}
                >
                  提交
                  <ArrowRight size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {editingScene && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm">
          <div className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-white/10 bg-[linear-gradient(180deg,rgba(8,8,8,0.98),rgba(12,12,12,0.96))] shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/36">Scene Editor</p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  编辑镜头 {editingScene.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingSceneId(null)}
                className="rounded-full border border-white/10 p-2 text-white/70 transition hover:border-white/20 hover:bg-white/[0.08]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.22)]">
                <p className="text-sm font-medium text-white">你可以直接改这一镜的描述</p>
                <textarea
                  value={sceneEdits[editingScene.id] ?? editingScene.visual}
                  onChange={(event) => updateSceneEdit(editingScene.id, event.target.value)}
                  rows={7}
                  placeholder="例如：产品更靠近镜头一点，背景更干净，手部动作更明显。"
                  className="mt-4 w-full rounded-[20px] border border-white/10 bg-[#0b0b0b] px-4 py-3 text-sm text-white outline-none focus:border-white/22"
                />
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.22)]">
                <p className="text-sm font-medium text-white">也可以直接说一句，让图像往那个方向变</p>
                <div className="mt-4 flex gap-3">
                  <input
                    value={sceneVoiceInput}
                    onChange={(event) => setSceneVoiceInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        applySceneVoiceCommand();
                      }
                    }}
                    placeholder="例如：把产品放大一点"
                    className="flex-1 rounded-[18px] border border-white/10 bg-[#0b0b0b] px-4 py-3 text-sm text-white outline-none focus:border-white/22"
                  />
                  <button
                    type="button"
                    onClick={applySceneVoiceCommand}
                    className="rounded-[18px] bg-[#6c5750] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#5f4b45]"
                  >
                    应用
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(sceneCommands[editingScene.id] ?? []).length > 0 ? (
                    (sceneCommands[editingScene.id] ?? []).map((command) => (
                      <span key={command} className="rounded-full bg-white/[0.07] px-3 py-1 text-xs text-white/68">
                        {command}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-white/58">你输入的语句会作为图像编辑指令发给后端模型。</span>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 px-6 py-5">
              <button
                type="button"
                onClick={() => setEditingSceneId(null)}
                className="w-full rounded-full bg-[#6c5750] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#5f4b45]"
              >
                关闭这个编辑面板
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
