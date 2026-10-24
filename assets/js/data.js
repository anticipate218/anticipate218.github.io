/*
 * 站点内容数据 / Site content data
 * ------------------------------------------------------------
 * 所有可见内容都集中在这里，修改后刷新页面即可生效。
 * Every piece of visible content lives here; edit and reload.
 *
 * 双语字段统一写成 { zh: "...", en: "..." }。
 * Bilingual fields are written as { zh: "...", en: "..." }.
 *
 * 学术数据来源：Google Scholar（user=9DUk4NYAAAAJ），2026-10-24 同步。
 * Scholar data synced from Google Scholar (user=9DUk4NYAAAAJ) on 2026-10-24.
 */
window.SITE_DATA = {
  meta: {
    syncedAt: "2026-10-24",
    githubUser: "anticipate218",
    scholarId: "9DUk4NYAAAAJ",
    githubStarsTotal: 85,
    /* 预印本暂时隐藏，改为 true 即恢复显示 / set to true to show preprints again */
    showPreprints: false,
    siteUrl: "https://anticipate218.github.io/"
  },

  profile: {
    name: { zh: "曹帅帅", en: "Shuaishuai Cao" },
    altName: { zh: "Shuaishuai Cao", en: "曹帅帅" },
    handle: "anticipate218",
    avatar: "assets/img/avatar.jpg",
    title: {
      zh: "AI 研究者 · 遥感 · 计算机视觉 · 多模态学习",
      en: "AI Researcher · Remote Sensing · Computer Vision · Multimodal Learning"
    },
    affiliation: { zh: "中南大学", en: "Central South University" },
    location: { zh: "中国 · 长沙", en: "Changsha, China" },
    /* 教育经历 / Education（current: true 表示在读 / currently enrolled） */
    education: [
      {
        current: true,
        school: { zh: "中南大学", en: "Central South University" },
        degree: { zh: "硕士研究生 · 在读", en: "M.S. Student" }
      },
      {
        school: { zh: "江西师范大学", en: "Jiangxi Normal University" },
        degree: { zh: "本科", en: "B.S." },
        honors: [
          { zh: "十佳大学生", en: "Top Ten Undergraduates" },
          { zh: "国家奖学金", en: "National Scholarship" }
        ]
      }
    ],
    email: "265011218@csu.edu.cn",
    links: {
      scholar: "https://scholar.google.com/citations?user=9DUk4NYAAAAJ&hl=zh-CN",
      github: "https://github.com/anticipate218"
    },
    typing: {
      zh: [
        "让卫星看懂地球 🛰️",
        "遥感影像解译 · 建筑物提取",
        "语义分割 · 开放词汇遥感",
        "大模型智能体 · 表征工程",
        "开源 · 可复现 · 可验证"
      ],
      en: [
        "Teaching satellites to understand Earth 🛰️",
        "Remote sensing interpretation · Building extraction",
        "Semantic segmentation · Open-vocabulary RS",
        "LLM agents · Representation engineering",
        "Open · Reproducible · Verifiable"
      ]
    },
    intro: {
      zh: [
        "你好！我是曹帅帅，现为中南大学硕士研究生，本科毕业于江西师范大学（曾获国家奖学金、十佳大学生）。研究方向是遥感影像智能解译与计算机视觉，同时关注大语言模型与智能体。",
        "我的工作围绕「从像素到可验证的地理空间推理」展开：高精度建筑物提取（CBRNet）、遥感语义分割标注质量审计（Contrastive Mask Fidelity）、无人机场景指代基准（GeoRefer-Bench），以及面向开放词汇遥感分割的数据集工厂。在大模型方向，我参与了工具调用智能体的表征工程（ASA）、神经符号知识图谱问答（NeuroSymActive）与混合大模型扩展规律（cMoLLM）等研究。"
      ],
      en: [
        "Hi! I'm Shuaishuai Cao, a master's student at Central South University. I received my bachelor's degree from Jiangxi Normal University, where I was awarded the National Scholarship and named one of the Top Ten Undergraduates. I work on intelligent remote sensing image interpretation and computer vision, and I'm also active in large language models and agents.",
        "My research runs from pixels to verifiable geospatial reasoning: high-precision building extraction (CBRNet), reference-free auditing of segmentation masks (Contrastive Mask Fidelity), referring benchmarks over UAV scenes (GeoRefer-Bench), and a dataset factory for open-vocabulary remote sensing segmentation. On the LLM side, I have contributed to representation engineering for tool-calling agents (ASA), neural-symbolic KGQA (NeuroSymActive) and horizontal scaling laws for mixtures of LLMs (cMoLLM)."
      ]
    },
    interests: [
      { zh: "遥感影像解译", en: "Remote Sensing Interpretation", icon: "globe" },
      { zh: "建筑物提取", en: "Building Extraction", icon: "building" },
      { zh: "语义分割", en: "Semantic Segmentation", icon: "layers" },
      { zh: "计算机视觉", en: "Computer Vision", icon: "eye" },
      { zh: "多模态学习", en: "Multimodal Learning", icon: "spark" },
      { zh: "大模型智能体", en: "LLM Agents", icon: "cpu" }
    ]
  },

  scholar: {
    citations: 32,
    hIndex: 3,
    i10Index: 1,
    since: 2021
  },

  /* 新闻 / News：按时间倒序 (newest first)；只写年份的条目放在同年已知月份条目之后 */
  news: [
    {
      date: "2026-08",
      tag: "arxiv",
      text: {
        zh: "第一作者论文 Contrastive Mask Fidelity 发布于 arXiv（2608.09101）：无需参考即可审计遥感语义分割真值掩膜。",
        en: "First-author paper Contrastive Mask Fidelity is on arXiv (2608.09101): reference-free auditing of ground-truth masks in remote sensing segmentation."
      },
      link: "https://arxiv.org/abs/2608.09101"
    },
    {
      date: "2026-08",
      tag: "open",
      text: {
        zh: "开源 GeoRefer-Bench：从指代像素到可验证地理空间推理的基准，覆盖 700 个大尺度无人机场景。",
        en: "Open-sourced GeoRefer-Bench, a benchmark from referring pixels to verifiable geospatial reasoning over 700 large-scale UAV scenes."
      },
      link: "https://github.com/anticipate218/GeoRefer-Bench"
    },
    {
      date: "2026-07",
      tag: "accept",
      hot: true,
      text: {
        zh: "cMoLLM at Scale：卷积门控混合大模型的水平扩展规律，被 ICML 2026 接收。",
        en: "cMoLLM at Scale — horizontal scaling laws for convolutionally-gated Mixture-of-LLMs — accepted to ICML 2026."
      },
      link: "https://arxiv.org/abs/2607.22577"
    },
    {
      date: "2026",
      tag: "accept",
      hot: true,
      text: {
        zh: "CBRNet：角点引导的边界细化网络，用于高精度建筑物提取，发表于 IEEE TGRS。",
        en: "CBRNet, a corner-guided boundary refinement network for high-precision building extraction, is published in IEEE TGRS."
      },
      link: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=9DUk4NYAAAAJ&citation_for_view=9DUk4NYAAAAJ:UeHWp8X0CEIC"
    },
    {
      date: "2026",
      tag: "accept",
      text: {
        zh: "InfoMamba：恢复隐状态压缩中丢失的信息，发表于 Neurocomputing。",
        en: "InfoMamba — recovering information lost in hidden-state compression — is published in Neurocomputing."
      },
      link: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=9DUk4NYAAAAJ&citation_for_view=9DUk4NYAAAAJ:Y0pCki6q_DkC"
    },
    {
      date: "2026-05",
      tag: "open",
      text: {
        zh: "开源 Remote-Sensing Dataset Factory：基于 SAM 3 / PRISM 的开放词汇遥感语义分割数据集工厂。",
        en: "Open-sourced the Remote-Sensing Dataset Factory, an open-vocabulary RS segmentation dataset factory powered by SAM 3 / PRISM."
      },
      link: "https://github.com/anticipate218/remote-sensing-dataset-factory"
    },
    {
      date: "2026-03",
      tag: "arxiv",
      text: {
        zh: "Sphunc（超球面不确定性分解）与 Social-JEPA（涌现几何同构）两篇合作论文发布于 arXiv。",
        en: "Two collaborative preprints, Sphunc (hyperspherical uncertainty decomposition) and Social-JEPA (emergent geometric isomorphism), are on arXiv."
      },
      link: "https://arxiv.org/abs/2603.01168"
    },
    {
      date: "2026-02",
      tag: "arxiv",
      text: {
        zh: "ASA：面向工具调用智能体的免训练表征工程，以及 NeuroSymActive 神经符号 KGQA 发布于 arXiv。",
        en: "ASA (training-free representation engineering for tool-calling agents) and NeuroSymActive (neural-symbolic KGQA) are on arXiv."
      },
      link: "https://arxiv.org/abs/2602.04935"
    }
  ],

  /*
   * 论文 / Publications
   * topic: rs = 遥感与视觉, llm = 大模型与智能体, ml = 机器学习理论
   * type: journal | conference | preprint
   * selected: true 会出现在首页「代表作」中
   */
  publications: [
    {
      id: "cbrnet",
      title: "CBRNet: Corner-Guided Boundary Refinement Network for High-Precision Building Extraction from Remote Sensing Imagery",
      authors: "M Huang, S Cao, D Zhu, X Liu, J Luo, Y Chen, J Niu, L Zhang, X Huang, et al.",
      venue: "IEEE Transactions on Geoscience and Remote Sensing (TGRS)",
      venueShort: "IEEE TGRS",
      year: 2026,
      type: "journal",
      topic: "rs",
      selected: true,
      rank: 20,
      level: { zh: "中科院一区 Top · CCF-B", en: "CAS Q1 Top · CCF-B" },
      citations: 12,
      links: {
        scholar: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=9DUk4NYAAAAJ&citation_for_view=9DUk4NYAAAAJ:UeHWp8X0CEIC"
      },
      summary: {
        zh: "利用角点先验引导边界细化，提升遥感影像中建筑物轮廓提取的几何精度。",
        en: "Uses corner priors to guide boundary refinement for geometrically precise building footprints."
      }
    },
    {
      id: "cmf",
      title: "Contrastive Mask Fidelity: Reference-Free Auditing of Ground-Truth Masks in Remote Sensing Semantic Segmentation",
      authors: "S Cao, S Peng, M Tang, M Huang, Y Wang, J Chen, J Ouyang, Z Zhai",
      venue: "arXiv preprint arXiv:2608.09101",
      venueShort: "arXiv",
      year: 2026,
      type: "preprint",
      topic: "rs",
      selected: true,
      firstAuthor: true,
      citations: 0,
      links: {
        arxiv: "https://arxiv.org/abs/2608.09101",
        pdf: "https://arxiv.org/pdf/2608.09101",
        scholar: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=9DUk4NYAAAAJ&citation_for_view=9DUk4NYAAAAJ:zYLM7Y9cAGgC"
      },
      summary: {
        zh: "无需参考标注，通过对比一致性度量自动发现遥感分割数据集中的错误真值掩膜。",
        en: "Flags faulty ground-truth masks in RS segmentation datasets via contrastive consistency, with no reference labels."
      }
    },
    {
      id: "cmollm",
      title: "cMoLLM at Scale: Horizontal Scaling Laws for Convolutionally-Gated Mixture-of-LLMs",
      authors: "X Yang, Y Wang, M Liu, L Li, S Cao, ZX He, R Dong",
      venue: "Forty-third International Conference on Machine Learning (ICML)",
      venueShort: "ICML 2026",
      year: 2026,
      type: "conference",
      topic: "llm",
      selected: true,
      rank: 10,
      level: { zh: "CCF-A 顶会", en: "CCF-A" },
      citations: 0,
      links: {
        arxiv: "https://arxiv.org/abs/2607.22577",
        pdf: "https://arxiv.org/pdf/2607.22577",
        scholar: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=9DUk4NYAAAAJ&citation_for_view=9DUk4NYAAAAJ:u-x6o8ySG0sC"
      },
      summary: {
        zh: "研究混合大模型在横向扩展（增加模型数量）时的性能规律与卷积门控机制。",
        en: "Studies how mixtures of LLMs scale horizontally, with a convolutional gating mechanism."
      }
    },
    {
      id: "neurosymactive",
      title: "NeuroSymActive: Differentiable Neural-Symbolic Reasoning with Active Exploration for Knowledge Graph Question Answering",
      authors: "R Fu, Y Li, Z Zhang, J Wu, Y Liu, S Cao, Y Zeng, Y Zhang, X Du, S Fong",
      venue: "arXiv preprint arXiv:2602.15353",
      venueShort: "arXiv",
      year: 2026,
      type: "preprint",
      topic: "llm",
      selected: false,
      citations: 8,
      links: {
        arxiv: "https://arxiv.org/abs/2602.15353",
        pdf: "https://arxiv.org/pdf/2602.15353",
        scholar: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=9DUk4NYAAAAJ&citation_for_view=9DUk4NYAAAAJ:d1gkVwhDpl0C"
      },
      summary: {
        zh: "可微神经符号推理结合主动探索，用于知识图谱问答。",
        en: "Differentiable neural-symbolic reasoning with active exploration for KGQA."
      }
    },
    {
      id: "asa",
      title: "ASA: Backbone-Training-Free Representation Engineering for Tool-Calling Agents",
      authors: "Y Wang, R Zhou, Y Ma, R Fu, J Liang, S Cao, M Huang, T Fang, L Pan",
      venue: "arXiv preprint arXiv:2602.04935",
      venueShort: "arXiv",
      year: 2026,
      type: "preprint",
      topic: "llm",
      selected: true,
      citations: 7,
      links: {
        arxiv: "https://arxiv.org/abs/2602.04935",
        pdf: "https://arxiv.org/pdf/2602.04935",
        scholar: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=9DUk4NYAAAAJ&citation_for_view=9DUk4NYAAAAJ:qjMakFHDy7sC"
      },
      note: {
        zh: "Scholar 中另有早期版本「ASA: Training-Free Representation Engineering for Tool-Calling Agents」，引用合计 4 + 3。",
        en: "Scholar also lists an earlier version, “ASA: Training-Free Representation Engineering for Tool-Calling Agents”; citations combined (4 + 3)."
      },
      summary: {
        zh: "不训练主干网络，通过表征工程提升智能体的工具调用能力。",
        en: "Improves tool calling of LLM agents through representation engineering without training the backbone."
      }
    },
    {
      id: "sphunc",
      title: "Sphunc: Hyperspherical Uncertainty Decomposition and Causal Identification via Information Geometry",
      authors: "R Fu, C Meng, J Liu, D Zhao, Y Liu, Y Meng, X Ma, W Wu, Y Zeng, S Cao, et al.",
      venue: "arXiv preprint arXiv:2603.01168",
      venueShort: "arXiv",
      year: 2026,
      type: "preprint",
      topic: "ml",
      selected: false,
      citations: 3,
      links: {
        arxiv: "https://arxiv.org/abs/2603.01168",
        pdf: "https://arxiv.org/pdf/2603.01168",
        scholar: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=9DUk4NYAAAAJ&citation_for_view=9DUk4NYAAAAJ:u5HHmVD_uO8C"
      },
      summary: {
        zh: "基于信息几何在超球面上分解不确定性并进行因果识别。",
        en: "Hyperspherical uncertainty decomposition and causal identification through information geometry."
      }
    },
    {
      id: "socialjepa",
      title: "Social-JEPA: Emergent Geometric Isomorphism",
      authors: "H Zhang, Y Wang, Y Duan, R Fu, D Zhao, S Fan, S Cao, W Guo, X Zhou",
      venue: "arXiv preprint arXiv:2603.02263",
      venueShort: "arXiv",
      year: 2026,
      type: "preprint",
      topic: "ml",
      selected: false,
      citations: 2,
      links: {
        arxiv: "https://arxiv.org/abs/2603.02263",
        pdf: "https://arxiv.org/pdf/2603.02263",
        scholar: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=9DUk4NYAAAAJ&citation_for_view=9DUk4NYAAAAJ:IjCSPb-OGe4C"
      },
      summary: {
        zh: "在 JEPA 表征中观察到的涌现几何同构现象。",
        en: "Emergent geometric isomorphism in JEPA-style representations."
      }
    },
    {
      id: "infomamba",
      title: "InfoMamba: Recovering Information Lost in Hidden-State Compression",
      authors: "Y Wang, Y Lu, M Xu, S Cao, J Cai, DF Wong, T Fang",
      venue: "Neurocomputing, 135002",
      venueShort: "Neurocomputing",
      year: 2026,
      type: "journal",
      topic: "ml",
      selected: false,
      rank: 40,
      level: { zh: "中科院二区 · CCF-C", en: "CAS Q2 · CCF-C" },
      citations: 0,
      links: {
        scholar: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=9DUk4NYAAAAJ&citation_for_view=9DUk4NYAAAAJ:Y0pCki6q_DkC"
      },
      summary: {
        zh: "恢复状态空间模型隐状态压缩过程中丢失的信息。",
        en: "Recovers information lost when state-space models compress their hidden state."
      }
    },
    {
      id: "cmollm-preprint",
      title: "cMoLLM at Scale: Horizontal Scaling Laws for Mixture-of-LLMs",
      authors: "X Yang, Y Wang, M Liu, L Li, S Cao, Z He, R Dong",
      venue: "arXiv preprint arXiv:2607.22577",
      venueShort: "arXiv",
      year: 2026,
      type: "preprint",
      topic: "llm",
      selected: false,
      hidden: true,
      citations: 0,
      links: {
        arxiv: "https://arxiv.org/abs/2607.22577"
      }
    }
  ],

  /* 开源项目 / Projects —— stars 为静态兜底值，页面会尝试从 GitHub API 实时刷新 */
  projects: [
    {
      repo: "GeoRefer-Bench",
      topic: "rs",
      lang: "Dataset",
      stars: 2,
      forks: 0,
      desc: {
        zh: "从指代像素到可验证地理空间推理的基准，覆盖 700 个大尺度无人机场景。",
        en: "A benchmark from referring pixels to verifiable geospatial reasoning over 700 large-scale UAV scenes."
      }
    },
    {
      repo: "remote-sensing-dataset-factory",
      topic: "rs",
      lang: "Python",
      stars: 15,
      forks: 1,
      desc: {
        zh: "基于 SAM 3 / PRISM 的开放词汇遥感语义分割数据集工厂，FastAPI + React。",
        en: "Open-vocabulary remote sensing segmentation dataset factory powered by SAM 3 / PRISM. FastAPI + React."
      }
    },
    {
      repo: "CABNet",
      topic: "rs",
      lang: "Python",
      stars: 3,
      forks: 0,
      desc: {
        zh: "面向遥感影像的内容自适应建筑物分割网络。",
        en: "Content-Adaptive Building Segmentation Network for remote sensing."
      }
    },
    {
      repo: "HAFRNet",
      topic: "rs",
      lang: "Model",
      stars: 2,
      forks: 0,
      desc: {
        zh: "恒等初始化细化预训练 Swin-B，用于高分辨率航空影像分割，已发布 LoveDA 权重。",
        en: "Identity-initialized refinement of a pretrained Swin-B for VHR aerial segmentation; LoveDA weights released."
      }
    },
    {
      repo: "SpecGate",
      topic: "llm",
      lang: "Python",
      stars: 0,
      forks: 0,
      desc: {
        zh: "规范引导的模块化推理（投稿中）。",
        en: "Specification-guided modular inference (under review)."
      }
    },
    {
      repo: "math-modeling-skill",
      topic: "llm",
      lang: "Python",
      stars: 54,
      forks: 2,
      desc: {
        zh: "面向 AI 助手的数学建模竞赛技能：覆盖国赛、研赛与美赛的选题、建模、检验与论文自检。",
        en: "A math-modeling contest skill for AI assistants covering CUMCM, the Huawei Cup and MCM/ICM."
      }
    }
  ]
};
