---
permalink: /
title: ""
excerpt: ""
author_profile: true
redirect_from:
  - /about/
  - /about.html
---

{% if site.google_scholar_stats_use_cdn %}
{% assign gsDataBaseUrl = "https://cdn.jsdelivr.net/gh/" | append: site.repository | append: "@" %}
{% else %}
{% assign gsDataBaseUrl = "https://raw.githubusercontent.com/" | append: site.repository | append: "/" %}
{% endif %}
{% assign url = gsDataBaseUrl | append: "google-scholar-stats/gs_data_shieldsio.json" %}

<span class='anchor' id='about-me'></span>

I am a Ph.D. student at the [School of Architecture](https://www.arch.tsinghua.edu.cn/), [Tsinghua University](https://www.tsinghua.edu.cn/), advised by [Prof. Ying Long](http://www.intelli-city.com/), and a member of [Beijing City Lab (BCL)](https://www.beijingcitylab.com/). I received my B.Eng. in Urban Planning from [Hefei University of Technology](https://www.hfut.edu.cn/) in 2023.

My research interests include **LLM/VLM evaluation and alignment**, **multi-agent systems**, and **urban AI**. I build large-scale urban datasets and systematically evaluate generative AI models for scientific data synthesis and visual understanding. I have published papers in venues including Nature Cities, Scientific Data, AAAI, Habitat International, and ECCV, with <a href='https://scholar.google.com/citations?user=6vKhpBoAAAAJ'><img src="https://img.shields.io/endpoint?url={{ url | url_encode }}&logo=Google%20Scholar&labelColor=f6f6f6&color=9cf&style=flat&label=citations"></a> total Google Scholar citations. My open-source datasets have received **23,000+** downloads, including **1 ESI Highly Cited Paper**.


# News
- *2026.06*: Invited to present at **Applied Urban Modelling (AUM2026)**, University of Cambridge, UK.
- *2026.02*: Paper "UrbanAlign" submitted to **ECCV 2026**.
- *2026.01*: Our research on global ghost cities reported by [**Popular Mechanics**](https://www.popularmechanics.com/) (one of the most influential popular science media in the US).
- *2025.11*: CMAB paper recognized as **ESI Highly Cited Paper** in Geoscience.
- *2025.11*: "新城市科学" paper listed in **CNKI Top 20 Most-Cited Papers** (2024-2025) in *城市规划 CITY PLANNING REVIEW*.
- *2025.11*: Received **"GIS Rising Star" Award** (10 nationwide) & chaired the Rising Star session at The 13th China College GIS Forum, Shanghai.
- *2025.10*: Our paper "GenAI Models Capture Urban Science..." entered **2nd round review** at **Nature Cities**.
- *2025.10*: Received **Jin Jingchang Outstanding Paper Award** (佳作奖, 22nd edition), Shanghai.
- *2025.08*: Recognized as **Outstanding Teaching Assistant** (Top 5%) at Tsinghua University.
- *2025.06*: CMAB research featured on **Tsinghua University's official Facebook account**.
- *2025.05*: Nominated for **"Academic Rising Star"** (学术新秀) at Tsinghua University (10 university-wide, sole nominee from School of Architecture).
- *2025.05*: Exhibitor at **China Pavilion, 19th Venice Architecture Biennale**, Venice, Italy.
- *2025.03*: Presented at **AAG 2025**, Detroit, USA.
- *2025.01*: Paper "CMAB" published in **Scientific Data** — **23,000+ downloads**.
- *2025.01*: Paper "WaveC2R" accepted at **AAAI 2025** (CCF-A).
- *2025.01*: Received **Outstanding Case Award for "AI-Empowered Planning"** from Urban Planning Society of China.
- *2024.12*: Paper "Inferring Ghost Cities" published in **Habitat International**.
- *2024.06*: Invited talk at **Applied Urban Modelling (AUM2024)**, University of Cambridge, UK.

# Publications

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">Nature Cities</div><img src='images/papers/ai4us.png' alt="AI4US" width="100%"></div></div>
<div class='paper-box-text' markdown="1">

**GenAI Models Capture Urban Science but Oversimplify Complexity**

**Yecheng Zhang**, Renhe Zhao, Zhenliang Huang, Ying Long*

*Nature Cities* (2nd round review). [PDF](cv/aiusv3.pdf)

- Designed the **AI4US benchmark framework** to systematically evaluate data synthesis capabilities of leading LLMs (GPT-4o, Claude 3.5, etc.) across **symbolic reasoning** (scaling laws, distance decay, urban vitality) and **multimodal perception**, running **10,000+ automated experiments**.
- Built a multi-paradigm prompt engineering pipeline (independent/joint sampling, blueprint prompting) that improved LLM output fidelity from R²=0.15 to **0.90+**.
- Discovered critical failure modes including **distributional collapse** and **ambiguity aversion**, providing systematic prompt engineering optimization pathways.
</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">ECCV 2026</div><img src='images/papers/urbanalign.png' alt="UrbanAlign" width="100%"></div></div>
<div class='paper-box-text' markdown="1">

**UrbanAlign: Post-hoc Semantic Calibration for VLM-Human Preference Alignment**

**Yecheng Zhang**, Renhe Zhao, Ying Long, Chengyang Shi*

*ECCV 2026* (under review, CCF-B). [PDF](cv/arxiv-eccv.pdf)

- Proposed a **training-free post-hoc concept bottleneck method** to align frozen VLM outputs with human preferences — no fine-tuning, RLHF, or GPU training required.
- Designed an **Observer-Debater-Judge multi-agent reasoning chain** for structured scoring, and developed **locally-weighted ridge regression (LWRR)** on a hybrid CLIP+semantic manifold for geometric calibration.
- Achieved **72.2% accuracy** (+28.8pp over raw VLM, +15.1pp over supervised baselines like Siamese Network) with full **dimension-level interpretability**.
</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">Scientific Data</div><img src='images/papers/08Zhang et al 2025 Scientific_Data-CMAB.png' alt="CMAB" width="100%"></div></div>
<div class='paper-box-text' markdown="1">

**CMAB: A Multi-Attribute Building Dataset of China** [![](https://img.shields.io/badge/ESI-Highly%20Cited-red)]()

**Yecheng Zhang**&dagger;, Huimin Zhao&dagger;, Ying Long*

*Scientific Data*, 12, 430, 2025. [DOI](https://doi.org/10.1038/s41597-025-04730-5) \| [PDF](cv/08Zhang et al 2025 Scientific_Data-CMAB.pdf)

- Built **China's Multi-Attribute Building Dataset** by integrating remote sensing, POI, and street-view imagery, covering **32M+ buildings** with **10+ attributes** nationwide.
- **23,000+ downloads** on Figshare/GitHub; recognized as **ESI Highly Cited Paper** in Geoscience.
- Featured by **Tsinghua University's official Facebook account** for research impact.
</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">Habitat International</div><img src='images/papers/07Zhang et al 2025 Habitat_International-GloGCI.png' alt="GloGCI" width="100%"></div></div>
<div class='paper-box-text' markdown="1">

**Inferring Ghost Cities on the Globe in Newly Developed Urban Areas Based on Urban Vitality with Multi-source Data**

**Yecheng Zhang**, Tangqi Tu, Ying Long*

*Habitat International*, 2025. [PDF](cv/07Zhang et al 2025 Habitat_International-GloGCI.pdf)

- Developed **GloGCI (Global Ghost City Index)** through multi-source data fusion (satellite imagery, mobility, economic indicators) with contextual multi-armed bandit sampling and ensemble learning across **10,000+ global cities**.
- Research reported by [**Popular Mechanics**](https://www.popularmechanics.com/) (one of the most influential popular science media in the US).
</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">iScience 2024</div><img src='images/papers/04Li et al 2024 iScience-GloPPRUA.png' alt="GloPPRUA" width="100%"></div></div>
<div class='paper-box-text' markdown="1">

**Rethinking the Country-level Percentage of Population Residing in Urban Area with a Global Harmonized Urban Definition**

Wenyue Li&dagger;, **Yecheng Zhang**&dagger;, Mengxing Li, Ying Long*

*iScience*, 27, 110125, 2024. [DOI](https://doi.org/10.1016/j.isci.2024.110125) \| [PDF](cv/04Li et al 2024 iScience-GloPPRUA.pdf)

- Constructed a **global harmonized urban definition (GloPPRUA)** dataset, providing consistent urban-rural boundaries across countries for comparative urbanization research.
- 5,000+ downloads on Figshare.
</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">JAG 2022</div><img src='images/papers/01Zhang et al 2022 JAG-GAN.png' alt="JAG-GAN" width="100%"></div></div>
<div class='paper-box-text' markdown="1">

**Urban Spatial Risk Prediction and Optimization Analysis of POI based on Deep Learning from the Perspective of an Epidemic**

**Yecheng Zhang**, Qimin Zhang, Yuxuan Zhao, Yunjie Deng, Hao Zheng*

*International Journal of Applied Earth Observations and Geoinformation*, 112, 102942, 2022. [PDF](cv/01Zhang et al 2022 JAG-GAN.pdf)

- Applied **GAN-based deep learning** for urban spatial risk prediction and POI optimization during epidemic scenarios, combining spatiotemporal modeling with urban planning applications.
</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">AAAI 2025</div><img src='images/papers/wavec2r.png' alt="WaveC2R" width="100%"></div></div>
<div class='paper-box-text' markdown="1">

**WaveC2R: Wavelet-driven Coarse-to-refined Hierarchical Learning for Radar Retrieval**

Chengyang Shi, ..., **Yecheng Zhang**, Danni Niu

*AAAI 2025* (CCF-A). [PDF](cv/卫星雷达反演zyc20250730.pdf)

- Satellite-to-radar reflectivity inversion using wavelet-driven coarse-to-refined hierarchical learning framework for meteorological remote sensing.
</div>
</div>

- Shi C, Han X, **Zhang Y**, Wu B, Hou J, Wang J, Niu D. AWFlowS2R: A Flow-Based New Paradigm for All-Weather Satellite-to-Radar Retrieval. *arXiv*, 2026.
- Wang L, Hou C, **Zhang Y**, He J*. Measuring Solar Radiation and Spatio-temporal Distribution in Different Street Network Direction through Solar Trajectories and Street View Images. *International Journal of Applied Earth Observation and Geoinformation*, 132, 104058, 2024. [PDF](cv/06Wang et al 2024 JAG-SolarSVIs.pdf)
- Long Y*, Zhao H, **Zhang Y**. 新城市科学：技术、计算、变革与应用. *城市规划 CITY PLANNING REVIEW*, 48, 2024. [DOI](https://doi.org/10.11819/cpr20240702a) \| [PDF](cv/05龙瀛等 2024 城市规划-新城市科学.pdf)
- Li Y, **Zhang Y**, Wu Q, Xue R, Wang X, Si M, Zhang Y*. Greening the Concrete Jungle: Unveiling the Co-mitigation of Greenspace Configuration on PM2.5 and Land Surface Temperature with Explanatory Machine Learning. *Urban Forestry & Urban Greening*, 88, 128086, 2023. [PDF](cv/03Li et al 2023 UFUG-SHAP.pdf)
- Ding X, **Zhang Y**, Zhang Y, ..., Haick H*, Zhang M*. Modular Assembly of MXene Frameworks for Noninvasive Disease Diagnosis via Urinary Volatiles. *ACS Nano*, 16, 17376–17388, 2022. [DOI](https://doi.org/10.1021/acsnano.2c08266) \| [PDF](cv/02Ding et al 2022 ACS_nano-Datafusion.pdf)
- Yao J, Jian Y, Shen Y, ..., **Zhang Y**. Decoding the Spatial Heterogeneity of Bike-Sharing Impacts. *Journal of Urban Planning and Development*, 2025. [DOI](https://doi.org/10.1061/JUPDDM.UPENG-5192)
- **Zhang Y**, et al. Generative Design Method of Building Group Based on AIP Assessment. *UIA World Congress of Architects*, Copenhagen, 2023.

# Honors and Awards
- *2025.11* **ESI Highly Cited Paper** (Geoscience), CMAB paper in *Scientific Data*.
- *2025.11* **"GIS Rising Star" Award** (全国高校GIS新秀, 10 nationwide) & Session Chair, The 13th China College GIS Forum, Shanghai.
- *2025.11* **"新城市科学" Highly Cited Paper**, CNKI Top 20 Most-Cited (2024-2025), *城市规划*.
- *2025.10* **Jin Jingchang Outstanding Paper Award** (金经昌城市规划优秀论文佳作奖, 22nd edition), Shanghai.
- *2025.08* **Outstanding Teaching Assistant** (Top 5%), Tsinghua University, 2024-2025 Fall.
- *2025.05* **"Academic Rising Star" Nominee** (学术新秀, 10 university-wide, sole nominee from School of Architecture), Tsinghua University.
- *2025.05* Exhibitor, **China Pavilion, 19th Venice Architecture Biennale**, Venice, Italy.
- *2025.01* **Outstanding Case Award for "AI-Empowered Planning"**, Urban Planning Society of China.
- *2023.05* Exhibitor, **China Pavilion, 18th Venice Architecture Biennale**, Venice, Italy.

# Educations
- *2023.09 - present*, Ph.D. in Urban Planning (AI for Urban Science), **Tsinghua University**, Beijing, China. Advisor: Prof. Ying Long.
- *2018.09 - 2023.06*, B.Eng. in Urban Planning, **Hefei University of Technology**, Hefei, China.

# Invited Talks & Conferences
- *2026.06*, **Applied Urban Modelling (AUM2026)**, University of Cambridge, UK (upcoming).
- *2025.11*, **The 13th China College GIS Forum — Rising Star Forum**, Shanghai. Session Chair & Speaker.
- *2025.10*, **China Urban Planning Informatization Annual Conference**, Foshan. Poster.
- *2025.03*, **AAG 2025** (American Association of Geographers Annual Meeting), Detroit, USA.
- *2024.11*, **Tsinghua University "Future Urban Construction" Ph.D. Forum**, Beijing.
- *2024.06*, **Applied Urban Modelling (AUM2024)**, University of Cambridge, UK.
- *2023.08*, **Global Smart Cities Summit (GSCS) & ICUI**, Hong Kong.
- *2023.07*, **UIA World Congress of Architects**, Copenhagen, Denmark.
- *2023.06*, **Tongji University Architectural DigitalFUTURES** "Emerging Planetarism", Shanghai.
- *2022.09*, **CUSR Urban Big Data Annual Meeting**, Beijing.
- *2022.07*, **4th International Conference on Computational Design and Robotic Fabrication**, Shanghai.

# Academic Service
- Invited Reviewer, **Nature Cities** (Nature Portfolio), 2024–present.
- Invited Reviewer, **Scientific Data** (Nature Portfolio), 2024–present.
- Invited Reviewer, **npj Urban Sustainability** (Nature Portfolio), 2024–present.
- Invited Reviewer, **Cities** (Elsevier), 2023–present.
- Invited Reviewer, **Computers, Environment and Urban Systems** (Elsevier), 2023–present.
- Invited Reviewer, **Verixiv**, 2025–present.

# Open-source Datasets
- **CMAB** — China's Multi-Attribute Building Dataset (32M+ buildings, 23,000+ downloads, ESI Highly Cited). [Dataset](https://figshare.com/authors/Yecheng_Zhang/20402873)
- **GloGCI** — Global Ghost City Index (10,000+ cities worldwide, 4,000+ downloads).
- **GloPPRUA** — Global Harmonized Urban Definition (5,000+ downloads).
- **AI4US** — Generative AI Benchmarks for Urban Science (2,000+ downloads).
