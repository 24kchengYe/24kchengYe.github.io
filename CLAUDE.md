# Academic Homepage - Claude Code Guide

This is a data-driven academic personal homepage with AI-powered automation for image processing and content management.

## Core Architecture

### Three-Layer Separation Pattern

```
Data Layer (JSON)          Processing Layer (Python)       Display Layer (JS/HTML)
├── data/config.json  →    ├── scripts/image_processor.py  →  ├── js/main.js
├── data/publications.json ├── scripts/pdf_cover_extractor.py  ├── js/news-generator.js
├── data/datasets.json     ├── scripts/ai_image_analyzer.py    └── index.html
├── data/news.json         ├── scripts/pdf_metadata_extractor.py
└── data/awards.json       └── scripts/content_formatter.py
```

**Key Principle**: Content updates flow through JSON files → AI processing scripts → Frontend rendering. No hardcoded content in HTML.

### Data-Driven Content Management

All content lives in `data/*.json` files:
- **config.json**: Personal info, biography, research interests, contact links
- **publications.json**: Paper metadata with auto-generated citations
- **datasets.json**: Open datasets with download tracking
- **code-tools.json**: GitHub repositories and tools
- **awards.json**: Academic awards and honors
- **activities.json**: Exhibitions, talks, peer review, skills
- **news.json**: Auto-generated news feed with pagination

Frontend JavaScript loads these files dynamically and renders content without page reload.

## Critical Environment Configuration

### API Key Priority Issue (IMPORTANT!)

**Problem**: System environment variables override `.env` file by default.

**Solution**: All Python scripts use `load_dotenv(override=True)` to force `.env` precedence.

```python
# scripts/pdf_cover_extractor.py line 42
# scripts/pdf_metadata_extractor.py line 40
# scripts/ai_image_analyzer.py line 49
# scripts/content_formatter.py line 40
load_dotenv(override=True)  # Critical: Forces .env to override system vars
```

**Why This Matters**:
- If system has old `OPENAI_API_KEY` env var with wrong key format
- It will cause 401 errors when calling OpenRouter API
- The `override=True` ensures `.env` file always wins

### Environment Variables (.env)

```bash
OPENAI_API_KEY=sk-or-v1-...  # OpenRouter API key (NOT OpenAI official key)
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=openai/gpt-4o-mini
PAPER_COVER_WIDTH=400
PAPER_COVER_HEIGHT=300
CONTENT_FORMAT_MODEL=gpt-4-turbo-preview
```

**Key Format Difference**:
- OpenRouter keys: `sk-or-v1-...`
- OpenAI official keys: `sk-...`
- Sending wrong key to wrong endpoint causes 401 "No cookie auth credentials found"

## Common Commands

### Setup and Installation

```bash
# Install Python dependencies
pip install -r scripts/requirements.txt

# Configure API keys (required for AI features)
cp .env.example .env
# Edit .env and add your OpenRouter API key
```

### Image Processing (AI-Powered)

```bash
# Process ALL new images (papers + avatar)
python scripts/image_processor.py --all

# Process papers only (extract PDF covers with AI)
python scripts/image_processor.py --papers

# Process avatar only (smart face detection + cropping)
python scripts/image_processor.py --avatar

# Batch process with verbose output
python scripts/image_processor.py --all --verbose
```

**What Happens**:
1. Scans `images/raw-papers/*.pdf` and `images/raw-avatars/*.[jpg|png]`
2. Calls OpenRouter AI Vision API for intelligent analysis
3. Papers: AI selects best page (framework diagrams prioritized) + crops to 400×300
4. Avatar: AI detects face center + crops to 400×400 square
5. Outputs to `images/papers/` and `images/profile.jpg`

### Content Management (AI-Assisted)

```bash
# Add new publication with AI formatting
python scripts/content_formatter.py --type publication

# Add new dataset
python scripts/content_formatter.py --type dataset

# Add new award
python scripts/content_formatter.py --type award
```

**Interactive Workflow**:
1. Paste raw content (e.g., "Zhang Y, Long Y. Title. Nature, 2025.")
2. AI formats into structured JSON
3. Auto-adds to corresponding `data/*.json` file
4. Auto-generates news entry in `data/news.json`
5. No manual JSON editing needed

### Local Development

```bash
# Start local web server
python -m http.server 8000

# View at: http://localhost:8000

# Test Google Scholar citation updates
# Open browser console → Check "Total Citations" updates
```

### Deployment

```bash
# GitHub Pages deployment (automatic)
git add .
git commit -m "Update content"
git push origin main

# Live site updates in ~1 minute
```

## AI Processing Pipeline Details

### Multi-Page PDF Processing (Critical Feature)

**Problem Solved**: Academic papers often have framework diagrams on pages 2-5, NOT page 1.

**Implementation** (`scripts/pdf_cover_extractor.py`):

```python
def extract_pages(self, pdf_path, page_range=None):
    """
    Extracts specified pages at 300 DPI.
    page_range examples: None (all pages), "1-5", "3,5,7"
    """

def select_best_page_with_ai(self, images):
    """
    Sends all extracted pages to AI Vision API.
    AI evaluates each page and returns best one based on:
    1. Framework diagrams/flowcharts (highest priority)
    2. Core result visualizations
    3. Conceptual illustrations
    4. Falls back to page 1 if all text
    """

def analyze_with_ai(self, image):
    """
    After selecting best page, AI identifies optimal crop region.
    Returns coordinates for 4:3 aspect ratio crop.
    """
```

**CLI Usage**:
```bash
# Scan all pages of all PDFs (recommended)
python scripts/image_processor.py --papers

# Scan only first 5 pages (faster, may miss diagrams)
python scripts/pdf_cover_extractor.py -i paper.pdf -o cover.png --page-range 1-5
```

**Graceful Degradation**:
- If AI fails (network/API error) → Falls back to center crop of first page
- If no API key configured → Uses default cropping strategy
- System always produces output, never fails completely

### Avatar Smart Cropping

**Process** (`scripts/ai_image_analyzer.py`):
1. **Primary**: AI Vision API detects face center coordinates
2. **Fallback**: OpenCV Haar Cascade face detection (if `--use-opencv` flag)
3. **Default**: Center crop if both fail

**Crop Strategy**:
- Targets square crop centered on detected face
- Ensures 2.5× face size for appropriate context
- Adjusts boundaries to stay within image limits
- Outputs 400×400 pixels

## Frontend Architecture

### Dynamic Content Loading (`js/main.js`)

```javascript
class ConfigLoader {
    // Fetches all JSON files in parallel
    // Returns structured data objects
}

class PageRenderer {
    // Renders content without touching HTML structure
    // All content injected via DOM manipulation
}

// Initialization flow:
async function initApp() {
    // 1. Load all JSON configs
    // 2. Render personal info → biography → publications → datasets → etc.
    // 3. Initialize news pagination
    // 4. Update Google Scholar stats
}
```

### News Pagination System (`js/news-generator.js`)

```javascript
class NewsGenerator {
    constructor() {
        this.itemsPerPage = 10;  // Configurable in data/config.json
    }

    renderPage(page) {
        // Filters news items for current page
        // Always shows pinned statistics at top
        // Generates pagination controls
    }
}
```

**News Auto-Generation Rules**:
- New publication → "Our paper on [title] was published in [venue]."
- New dataset → "Released [name] dataset with [downloads] downloads."
- New award → "Received [name] from [organization]."

**Pinned Statistics Bar**:
- Always visible at top of news section
- Updates from Google Scholar API (citations, h-index)
- Displays total downloads (manual config in `data/config.json`)

## File Structure Deep Dive

### scripts/ Folder

- **image_processor.py**: Main entry point, orchestrates avatar + paper processing
- **pdf_cover_extractor.py**: Multi-page PDF scanning + AI page selection + crop analysis
- **ai_image_analyzer.py**: Avatar face detection (AI + OpenCV fallback)
- **pdf_metadata_extractor.py**: Extracts paper metadata from PDF text (title, authors, venue, DOI)
- **content_formatter.py**: Interactive CLI for AI-assisted content addition

**Dependency Chain**:
```
image_processor.py
├── calls → pdf_cover_extractor.py (for each PDF in images/raw-papers/)
└── calls → ai_image_analyzer.py (for latest image in images/raw-avatars/)
```

### data/ Folder

**Schema Patterns**:

```json
// publications.json
{
  "publications": [{
    "id": "unique_key_2025",           // Used for citations + news linking
    "title": "Paper Title",
    "authors": ["Zhang Y†", "Long Y*"], // † = co-first, * = corresponding
    "venue": "Journal Name",
    "year": 2025,
    "type": "journal|conference|preprint",
    "status": "published|accepted|under_review",
    "image": "images/papers/cover.png", // Auto-generated by scripts
    "links": {
      "pdf": "pdfs/paper.pdf",
      "doi": "https://doi.org/10.xxxx"
    },
    "citation_key": "matches_id"       // For Google Scholar integration
  }]
}

// news.json
{
  "news": [{
    "id": "news_001",
    "date": "2025-01-15",
    "content": "HTML string with <em> tags",
    "type": "publication|dataset|award|statistics",
    "related_id": "links_to_publication_id",
    "pinned": false,                    // true = always show at top
    "auto_generated": true              // true = generated by script
  }]
}
```

### images/ Folder

```
images/
├── profile.jpg              # Output: Processed avatar (400×400)
├── papers/                  # Output: AI-extracted covers (400×300)
├── raw-avatars/             # Input: Drop new photos here
└── raw-papers/              # Input: Drop PDFs here
```

**Workflow**:
1. User drops files in `raw-*` folders
2. Runs `python scripts/image_processor.py --all`
3. AI processes and outputs to root/papers folders
4. Frontend automatically loads new images (no code changes needed)

## Google Scholar Integration

### Citation Auto-Update

**File**: `google-scholar-stats/gs_data_shieldsio.json`

**Update Mechanism**:
1. GitHub Actions runs daily (workflow in `.github/workflows/`)
2. Scrapes Google Scholar profile using scholar.py
3. Updates `gs_data_shieldsio.json` with latest citation counts
4. Frontend `js/main.js` reads this file on page load

**Frontend Integration**:
```javascript
// Displays citations for each paper
document.querySelectorAll('.show_paper_citations').forEach(el => {
    const citationKey = el.getAttribute('data');
    const count = gsData[citationKey] || 0;
    el.textContent = `Citations: ${count}`;
});
```

**Manual Update**:
```bash
# If auto-update fails, manually run:
python google-scholar-stats/crawler.py
```

## Common Development Tasks

### Adding a New Publication (Full Workflow)

```bash
# 1. Drop PDF in folder
cp new_paper.pdf images/raw-papers/

# 2. Extract cover with AI
python scripts/image_processor.py --papers
# Output: images/papers/new_paper.png

# 3. Add metadata with AI
python scripts/content_formatter.py --type publication
# Paste: "Zhang Y, Long Y. New Paper. Nature, 2025. DOI: 10.1038/xxx"
# AI generates JSON + adds to data/publications.json
# Auto-generates news entry

# 4. Verify changes
git diff data/publications.json
git diff data/news.json

# 5. Deploy
git add .
git commit -m "Add new publication"
git push

# 6. Check live site in ~1 minute
```

### Troubleshooting AI Processing

**Error: "401 - No cookie auth credentials found"**

**Root Cause**: Wrong API key being sent to API endpoint.

**Check**:
```python
# Run in Python interpreter
import os
from dotenv import load_dotenv
load_dotenv(override=True)
print(os.getenv('OPENAI_API_KEY'))      # Should be sk-or-v1-...
print(os.getenv('OPENAI_BASE_URL'))     # Should be https://openrouter.ai/api/v1
```

**Fix**:
1. Verify `.env` has correct OpenRouter key (sk-or-v1-...)
2. Ensure all scripts have `load_dotenv(override=True)`
3. Check system environment variables: `echo $OPENAI_API_KEY` (Linux/Mac) or `echo %OPENAI_API_KEY%` (Windows)
4. Remove conflicting system variables if present

**Error: "AI分析失败" (AI analysis failed)**

**Behavior**: System falls back to default cropping (not critical).

**Causes**:
- Network timeout
- API rate limit exceeded
- Invalid model name in .env
- Insufficient API credits

**Verification**:
```bash
# Test API connectivity
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Modifying JSON Schemas

**If changing data structure** (e.g., adding new field to publications):

1. Update JSON schema in corresponding `data/*.json` file
2. Update `js/main.js` renderer to handle new field:
   ```javascript
   // In PageRenderer.createPublicationElement()
   const newField = pub.new_field || 'default_value';
   ```
3. Update Python scripts if they generate this data:
   ```python
   # In content_formatter.py
   publication['new_field'] = extracted_value
   ```
4. Test with sample data before deploying

## Testing Checklist

### Before Committing Changes

- [ ] All Python scripts pass syntax check: `python -m py_compile scripts/*.py`
- [ ] Local web server runs without errors: `python -m http.server 8000`
- [ ] Browser console shows no JavaScript errors (F12 → Console)
- [ ] All JSON files validate: Use online JSON validator or `python -m json.tool < data/config.json`
- [ ] Images display correctly (check broken image icons)
- [ ] Google Scholar citations load (check "Loading..." changes to numbers)
- [ ] News pagination works (click through pages)
- [ ] Mobile responsive (test at 375px width in DevTools)

### After Deployment

- [ ] GitHub Pages build succeeds (check Actions tab)
- [ ] Live site loads without errors
- [ ] All external links work (PDFs, DOIs, datasets)
- [ ] SSL certificate valid (https://)

## Advanced Customization

### Changing AI Models

**Edit `.env`**:
```bash
# Faster + cheaper (good for testing)
OPENAI_MODEL=google/gemini-flash-1.5

# Higher quality (production)
OPENAI_MODEL=anthropic/claude-3.5-sonnet

# Balance (current)
OPENAI_MODEL=openai/gpt-4o-mini
```

**Note**: Different models have different vision capabilities. Test before switching.

### Custom News Generation Rules

**Edit `scripts/content_formatter.py` line 400+**:

```python
def generate_news_entry(self, item, item_type):
    if item_type == 'publication':
        status_map = {
            'published': 'was published in',
            'accepted': 'was accepted by',
            'under_review': 'was submitted to'
        }
        content = f"Our paper on <em>{item['title']}</em> {status_map[item['status']]} <em>{item['venue']}</em>."

    # Add custom rules here
    elif item_type == 'custom_event':
        content = f"Custom message: {item['description']}"

    return content
```

### Adjusting Image Output Sizes

**Edit `.env`**:
```bash
AVATAR_SIZE=400           # Square avatar (400×400)
PAPER_COVER_WIDTH=400     # Paper cover dimensions
PAPER_COVER_HEIGHT=300    # 4:3 aspect ratio
```

**Changes take effect immediately** on next `image_processor.py` run.

## Security Notes

- `.env` file is git-ignored (NEVER commit API keys)
- All Python scripts validate file paths to prevent directory traversal
- Frontend only reads from `data/` folder (no write permissions needed)
- GitHub Pages serves static files only (no backend vulnerabilities)
- API keys only used in local scripts, not exposed to frontend

## Performance Optimization

- JSON files gzip automatically on GitHub Pages (60-80% size reduction)
- Images pre-compressed to 400×300 / 400×400 (no runtime resizing)
- News pagination prevents DOM bloat (only 10 items rendered per page)
- Google Scholar data cached in JSON (not fetched on every page load)
- AI processing happens offline (no frontend latency)

## Known Limitations

- Multi-page PDF scanning can be slow (21 pages × AI analysis = ~30 seconds)
- OpenRouter API has rate limits (check dashboard if processing many papers)
- Google Scholar auto-update may break if profile becomes private
- News pagination does not have URL routing (page 2 not bookmarkable)
- No backend = no visitor analytics (use Plausible/Analytics.js if needed)
