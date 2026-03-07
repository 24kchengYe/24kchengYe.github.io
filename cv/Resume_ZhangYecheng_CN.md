# 张业成

**电话**: [手机号] | **邮箱**: zhangyec23@mails.tsinghua.edu.cn | **GitHub**: [链接] | **Google Scholar**: [链接]

**意向岗位**: 大模型算法实习 / AI算法实习

---

## 教育背景

**清华大学** | 城市规划博士（AI for Urban Science方向）| 2023.09 – 至今
- 导师：龙瀛教授；研究方向：大模型评测与对齐、视觉语言模型、多智能体系统

**合肥工业大学** | 城乡规划学士 | 2018.09 – 2023.06

---

## 研究与项目经历

**大模型科学数据生成能力评测 — AI4US** | 第一作者 | Nature Cities 二审 | 2024.06 – 2025.01

设计 AI4US 评测框架，系统评估 GPT-4o、Claude 3.5 等主流大模型在符号推理（Scaling Law、距离衰减、城市活力）和多模态感知两大领域的数据合成能力，累计执行 10,000+ 次自动化实验。构建多范式提示工程流水线（独立/联合采样、蓝图提示），将输出拟合度从 R²=0.15 提升至 0.90+；发现分布坍塌、模糊回避等关键失败模式，提出 prompt engineering 优化路径。技术栈：Python, OpenAI/Anthropic API, CLIP, 统计建模。

**免训练 VLM-人类偏好对齐 — UrbanAlign** | 第一作者 | ECCV 2026 在审（CCF-B）| 2024.10 – 2025.02

提出免训练后置概念瓶颈方法（Post-hoc Concept Bottleneck），无需微调或 RLHF 即可将冻结 VLM 的输出与人类偏好对齐。设计 Observer-Debater-Judge 多智能体推理链实现结构化评分，在 CLIP+语义混合流形上通过局部加权岭回归（LWRR）进行几何校准，准确率从 43.4% 提升至 72.2%（+28.8pp），超越 Siamese Network 等有监督基线 +15.1pp，同时提供维度级可解释性。技术栈：Python, GPT-4o API, CLIP, 多智能体编排, 流形学习, scikit-learn。

**全球尺度城市数据集构建 — CMAB & GloGCI** | 第一作者 | Scientific Data（ESI高被引）, Habitat International | 2023.09 – 2025.01

构建 CMAB（中国多属性建筑数据集），融合遥感、POI、街景等多源数据，覆盖全国 3200 万+ 栋建筑与 10+ 属性，累计下载 17,000+ 次，入选 ESI 高被引论文。开发 GloGCI（全球鬼城指数），融合卫星影像、移动数据、经济指标，结合上下文多臂赌博机（CMAB）采样与集成学习，覆盖全球 10,000+ 城市。技术栈：Python, GIS, 遥感, Web Scraping, PostgreSQL。

---

## 代表性论文（10+ 篇中选 5 篇，含 1 篇 ESI 高被引）

1. **Zhang Y**, Zhao R, Huang Z, Long Y\*. GenAI Models Capture Urban Science but Oversimplify Complexity. **Nature Cities** 二审. `大模型评测`
2. **Zhang Y**, Zhao R, ..., Shi C\*. UrbanAlign: Post-hoc Semantic Calibration for VLM-Human Preference Alignment. **ECCV 2026** 在审. `VLM对齐 · 多智能体`
3. **Zhang Y**†, Zhao H†, Long Y\*. CMAB: A Multi-Attribute Building Dataset of China. **Scientific Data**, 2025. **(ESI高被引, 17K+下载)** `大规模数据`
4. Shi C, ..., **Zhang Y**, Niu D. WaveC2R: Wavelet-driven Coarse-to-refined Hierarchical Learning for Radar Retrieval. **AAAI 2025** (CCF-A). `扩散模型 · 气象遥感`
5. **Zhang Y**, Zhang Q, ..., Zheng H\*. Urban Spatial Risk Prediction and Optimization Analysis based on Deep Learning. **JAG**, 2022. `GAN · 时空预测`

---

## 技术能力

- **编程**: Python（熟练），SQL，JavaScript；熟悉 Linux、Git
- **AI/ML**: LLM/VLM API 调用与编排（OpenAI, Anthropic），Prompt Engineering，多智能体系统，CLIP，Diffusion Models，scikit-learn，PyTorch
- **数据**: 大规模数据管道，ETL，Web Scraping，GIS/遥感数据处理

---

## 荣誉与学术活动

- 全国高校GIS新秀奖（全国10人）并主持专场论坛，第十三届全国高校GIS论坛，2025
- 清华大学"学术新秀"提名（全校10人），2025
- "AI赋能规划"优秀案例奖，中国城市规划学会，2025
- 受邀报告：剑桥大学 Applied Urban Modelling (AUM)，2024
- 审稿人：Nature Cities, Scientific Data, npj Urban Sustainability
- 开源数据集累计 17,000+ 下载（Figshare/GitHub）
