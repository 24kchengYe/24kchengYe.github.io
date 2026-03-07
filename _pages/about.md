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
- *2025.10*: Our paper "GenAI Models Capture Urban Science but Oversimplify Complexity" entered 2nd round review at **Nature Cities**.
- *2025.02*: Paper "UrbanAlign" submitted to **ECCV 2026**.
- *2025.01*: Paper "WaveC2R" accepted at **AAAI 2025** (CCF-A).
- *2025.01*: Paper "CMAB" published in **Scientific Data** — now an **ESI Highly Cited Paper** with 17,000+ downloads!
- *2025.01*: Received **"GIS Rising Star" Award** (10 nationwide) at The 13th China College GIS Forum.
- *2025.01*: Nominated for **"Academic Rising Star"** at Tsinghua University (Top 0.1%, 10 university-wide).
- *2025.01*: Received **Outstanding Case Award for "AI-Empowered Planning"** from Urban Planning Society of China.
- *2024.12*: Paper "Inferring Ghost Cities" published in **Habitat International**.

# Publications

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">Nature Cities</div><img src='images/papers/ai4us.png' alt="AI4US" width="100%"></div></div>
<div class='paper-box-text' markdown="1">

**GenAI Models Capture Urban Science but Oversimplify Complexity**

**Yecheng Zhang**, Renhe Zhao, Zhenliang Huang, Ying Long*

*Nature Cities* (2nd round review)

- Designed the AI4US benchmark with 40,000+ synthesis trials to evaluate LLMs on scientific data generation across symbolic reasoning and multimodal perception.
</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">ECCV 2026</div><img src='images/papers/urbanalign.png' alt="UrbanAlign" width="100%"></div></div>
<div class='paper-box-text' markdown="1">

**UrbanAlign: Post-hoc Semantic Calibration for VLM-Human Preference Alignment**

**Yecheng Zhang**, Renhe Zhao, Ying Long, Chengyang Shi*

*ECCV 2026* (under review)

- Training-free post-hoc concept bottleneck method achieving 72.2% accuracy (+28.8pp over raw VLM) with full dimension-level interpretability.
</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">Scientific Data</div><img src='images/papers/08Zhang et al 2025 Scientific_Data-CMAB.png' alt="CMAB" width="100%"></div></div>
<div class='paper-box-text' markdown="1">

**CMAB: A Multi-Attribute Building Dataset of China** [![](https://img.shields.io/badge/ESI-Highly%20Cited-red)]()

**Yecheng Zhang**&dagger;, Huimin Zhao&dagger;, Ying Long*

*Scientific Data*, 12, 430, 2025. [DOI](https://doi.org/10.1038/s41597-025-04730-5)

- Covers 32M+ buildings with 10+ attributes nationwide; 23,000+ downloads.
</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">Habitat International</div><img src='images/papers/07Zhang et al 2025 Habitat_International-GloGCI.png' alt="GloGCI" width="100%"></div></div>
<div class='paper-box-text' markdown="1">

**Inferring Ghost Cities on the Globe in Newly Developed Urban Areas Based on Urban Vitality with Multi-source Data**

**Yecheng Zhang**, Tangqi Tu, Ying Long*

*Habitat International*, 2025. [PDF](cv/07Zhang et al 2025 Habitat_International-GloGCI.pdf)

- Global Ghost City Index via multi-source data fusion across 10,000+ cities.
</div>
</div>

- Shi C, ..., **Zhang Y**, Niu D. WaveC2R: Wavelet-driven Coarse-to-refined Hierarchical Learning for Radar Retrieval. **AAAI 2025** (CCF-A).
- Shi C, Han X, **Zhang Y**, Wu B, Hou J, Wang J, Niu D. AWFlowS2R: A Flow-Based New Paradigm for All-Weather Satellite-to-Radar Retrieval. *arXiv*, 2026.
- Wang L, Hou C, **Zhang Y**, He J*. Measuring Solar Radiation and Spatio-temporal Distribution in Different Street Network Direction through Solar Trajectories and Street View Images. *International Journal of Applied Earth Observation and Geoinformation*, 132, 104058, 2024.
- Li W&dagger;, **Zhang Y**&dagger;, Li M, Long Y*. Rethinking the Country-level Percentage of Population Residing in Urban Area with a Global Harmonized Urban Definition. *iScience*, 27, 110125, 2024. [DOI](https://doi.org/10.1016/j.isci.2024.110125)
- Long Y*, Zhao H, **Zhang Y**. 新城市科学：技术、计算、变革与应用. *城市规划 CITY PLANNING REVIEW*, 48, 2024. [DOI](https://doi.org/10.11819/cpr20240702a)
- Li Y, **Zhang Y**, Wu Q, Xue R, Wang X, Si M, Zhang Y*. Greening the Concrete Jungle: Unveiling the Co-mitigation of Greenspace Configuration on PM2.5 and Land Surface Temperature with Explanatory Machine Learning. *Urban Forestry & Urban Greening*, 88, 128086, 2023.
- Ding X, **Zhang Y**, Zhang Y, ..., Haick H*, Zhang M*. Modular Assembly of MXene Frameworks for Noninvasive Disease Diagnosis via Urinary Volatiles. *ACS Nano*, 16, 17376–17388, 2022. [DOI](https://doi.org/10.1021/acsnano.2c08266)
- **Zhang Y**, Zhang Q, Zhao Y, Deng Y, Zheng H*. Urban Spatial Risk Prediction and Optimization Analysis of POI based on Deep Learning from the Perspective of an Epidemic. *International Journal of Applied Earth Observations and Geoinformation*, 112, 102942, 2022.
- Yao J, Jian Y, Shen Y, ..., **Zhang Y**. Decoding the Spatial Heterogeneity of Bike-Sharing Impacts. *Journal of Urban Planning and Development*, 2025. [DOI](https://doi.org/10.1061/JUPDDM.UPENG-5192)
- **Zhang Y**, et al. Generative Design Method of Building Group Based on AIP Assessment. *UIA World Congress of Architects*, Copenhagen, 2023.

# Honors and Awards
- *2025* **"GIS Rising Star" Award** (10 nationwide) & Session Chair, The 13th China College GIS Forum.
- *2025* **"Academic Rising Star" Nominee** (10 university-wide, Top 0.1%), Tsinghua University.
- *2025* **Outstanding Case Award for "AI-Empowered Planning"**, Urban Planning Society of China.
- *2025* Exhibitor, **China Pavilion, 19th Venice Architecture Biennale**, Venice, Italy.
- *2023* Exhibitor, **China Pavilion, 18th Venice Architecture Biennale**, Venice, Italy.

# Educations
- *2023.09 - present*, Ph.D. in Urban Planning (AI for Urban Science), **Tsinghua University**, Beijing, China. Advisor: Prof. Ying Long.
- *2018.09 - 2023.06*, B.Eng. in Urban Planning, **Hefei University of Technology**, Hefei, China.

# Invited Talks
- *2025*, **The 13th China College GIS Forum — Rising Star Forum**, Session Chair & Speaker.
- *2024*, **Applied Urban Modelling (AUM2024)**, University of Cambridge, UK.
- *2023*, **Global Smart Cities Summit (GSCS)**, Hong Kong.
- *2023*, **UIA World Congress of Architects**, Copenhagen, Denmark.

# Open-source Datasets
- **CMAB** — China's Multi-Attribute Building Dataset (32M+ buildings, 23,000+ downloads, ESI Highly Cited). [Dataset](https://figshare.com/authors/Yecheng_Zhang/20402873)
- **GloGCI** — Global Ghost City Index (10,000+ cities worldwide, 4,000+ downloads).
- **GloPPRUA** — Global Harmonized Urban Definition (5,000+ downloads).
- **AI4US** — Generative AI Benchmarks for Urban Science (2,000+ downloads).
