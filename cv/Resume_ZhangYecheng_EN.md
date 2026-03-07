# Yecheng Zhang

**Phone**: [Your Phone] | **Email**: zhangyec23@mails.tsinghua.edu.cn | **GitHub**: [Link] | **Google Scholar**: [Link]

**Target Position**: LLM / AI Algorithm Intern

---

## Education

**Tsinghua University** | Ph.D. in Urban Planning (AI for Urban Science) | 2023.09 – Present
- Advisor: Prof. Ying Long; Research: LLM Evaluation & Alignment, Vision-Language Models, Multi-Agent Systems

**Hefei University of Technology** | B.Eng. in Urban Planning | 2018.09 – 2023.06

---

## Research & Project Experience

**LLM Scientific Data Generation Evaluation — AI4US** | First Author | Nature Cities (2nd round review) | 2024.06 – 2025.01

Designed the AI4US benchmark framework to systematically evaluate data synthesis capabilities of leading LLMs (GPT-4o, Claude 3.5, etc.) across symbolic reasoning (scaling laws, distance decay, urban vitality) and multimodal perception, running 10,000+ automated experiments. Built a multi-paradigm prompt engineering pipeline (independent/joint sampling, blueprint prompting) that improved LLM output fidelity from R²=0.15 to 0.90+; discovered critical failure modes including distributional collapse and ambiguity aversion. Tech: Python, OpenAI/Anthropic API, CLIP, statistical modeling.

**Training-Free VLM-Human Preference Alignment — UrbanAlign** | First Author | ECCV 2026 (under review, CCF-B) | 2024.10 – 2025.02

Proposed a training-free post-hoc concept bottleneck method to align frozen VLM outputs with human preferences — no fine-tuning, RLHF, or GPU training required. Designed an Observer-Debater-Judge multi-agent reasoning chain for structured scoring, and developed locally-weighted ridge regression (LWRR) on a hybrid CLIP+semantic manifold for geometric calibration. Achieved 72.2% accuracy (+28.8pp over raw VLM, +15.1pp over supervised baselines) with full dimension-level interpretability. Tech: Python, GPT-4o API, CLIP, multi-agent orchestration, manifold learning, scikit-learn.

**Global-Scale Urban Dataset Construction — CMAB & GloGCI** | First Author | Scientific Data (ESI Highly Cited), Habitat International | 2023.09 – 2025.01

Built CMAB (China's Multi-Attribute Building Dataset) by integrating remote sensing, POI, and street-view imagery, covering 32M+ buildings with 10+ attributes nationwide; 17,000+ downloads and ESI Highly Cited. Developed GloGCI (Global Ghost City Index) through multi-source data fusion (satellite imagery, mobility, economic indicators) with contextual multi-armed bandit sampling and ensemble learning across 10,000+ global cities. Tech: Python, GIS, remote sensing, Web scraping, PostgreSQL.

---

## Selected Publications (5 of 10+, incl. 1 ESI Highly Cited)

1. **Zhang Y**, Zhao R, Huang Z, Long Y\*. GenAI Models Capture Urban Science but Oversimplify Complexity. **Nature Cities** (2nd review). `LLM Evaluation`
2. **Zhang Y**, Zhao R, ..., Shi C\*. UrbanAlign: Post-hoc Semantic Calibration for VLM-Human Preference Alignment. **ECCV 2026** (under review). `VLM Alignment · Multi-Agent`
3. **Zhang Y**†, Zhao H†, Long Y\*. CMAB: A Multi-Attribute Building Dataset of China. **Scientific Data**, 2025. **(ESI Highly Cited, 17K+ downloads)** `Large-Scale Data`
4. Shi C, ..., **Zhang Y**, Niu D. WaveC2R: Wavelet-driven Coarse-to-refined Hierarchical Learning for Radar Retrieval. **AAAI 2025** (CCF-A). `Diffusion · Remote Sensing`
5. **Zhang Y**, Zhang Q, ..., Zheng H\*. Urban Spatial Risk Prediction and Optimization Analysis based on Deep Learning. **JAG**, 2022. `GAN · Spatiotemporal Prediction`

---

## Technical Skills

- **Programming**: Python (proficient), SQL, JavaScript; familiar with Linux, Git
- **AI/ML**: LLM/VLM API orchestration (OpenAI, Anthropic), Prompt Engineering, Multi-Agent Systems, CLIP, Diffusion Models, scikit-learn, PyTorch
- **Data**: Large-scale data pipelines, ETL, Web Scraping, GIS/Remote Sensing

---

## Honors & Activities

- "GIS Rising Star" Award (10 nationwide) & Session Chair, 13th China College GIS Forum, 2025
- "Academic Rising Star" Nominee (10 university-wide), Tsinghua University, 2025
- Outstanding Case Award for "AI-Empowered Planning", Urban Planning Society of China, 2025
- Invited Talk: Applied Urban Modelling (AUM), University of Cambridge, 2024
- Reviewer: Nature Cities, Scientific Data, npj Urban Sustainability
- Open-source datasets with 17,000+ total downloads (Figshare/GitHub)
