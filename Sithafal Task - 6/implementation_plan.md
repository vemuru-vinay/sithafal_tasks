# AI Document Analysis Pipeline — PDF → Structured JSON

A Python pipeline that intelligently processes PDF documents by:
1. Analyzing document complexity (simple text vs complex layout)
2. Routing to the appropriate extraction engine (OCR+LLM or VLM)
3. Producing structured, nested JSON key-value output

## User Review Required

> [!IMPORTANT]
> **GPU Limitation**: You have ~128 MB VRAM which cannot run LLaVA on GPU. All models will run on **CPU via Ollama**. LLaVA inference will be **slow** (~1-5 min per page depending on your CPU). This is a trade-off for using fully local, free models.

> [!WARNING]
> **Ollama must be installed** on your system. The setup script will attempt to install it, but if it fails, manual installation from [ollama.com](https://ollama.com) is needed.

## Architecture Overview

```
PDF Input
    │
    ▼
┌─────────────────────┐
│  Document Analyzer   │  ← Checks: text extractable? images? tables? columns?
└────────┬────────────┘
         │
    ┌────┴────┐
    │         │
 Simple    Complex
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│OCR+LLM │ │   VLM    │  ← LLaVA via Ollama
│Pipeline │ │ Pipeline │
└────┬───┘ └────┬─────┘
     │          │
     ▼          ▼
┌─────────────────────┐
│   JSON Output       │  ← Nested key-value pairs
└─────────────────────┘
```

## Proposed Changes

### System Dependencies

| Tool | Purpose | Install Method |
|------|---------|---------------|
| Ollama | Run LLaVA & LLM locally | Installer from ollama.com |
| Tesseract OCR | Text extraction from scanned PDFs | `winget` or manual install |
| Poppler | PDF-to-image conversion | `conda` or manual install |

### Ollama Models

| Model | Purpose | Size |
|-------|---------|------|
| `llava:7b` | VLM for complex layout documents | ~4.7 GB (disk, loads into RAM) |
| `llama3.2:3b` | LLM for structuring extracted text into JSON | ~2 GB |

---

### Python Dependencies

#### [NEW] [requirements.txt](file:///d:/VLM/requirements.txt)

```
PyMuPDF          # PDF text extraction & structure analysis
Pillow           # Image processing
pytesseract      # OCR wrapper for Tesseract
ollama           # Python client for Ollama API
pdf2image        # Convert PDF pages to images
```

---

### Configuration Module

#### [NEW] [config.py](file:///d:/VLM/config.py)

- Ollama model names and parameters
- Tesseract/Poppler paths (Windows-specific)
- Prompt templates for LLM (text→JSON) and VLM (image→JSON)
- Complexity thresholds (when to use VLM vs OCR)

---

### Document Analyzer

#### [NEW] [analyzer.py](file:///d:/VLM/analyzer.py)

Determines if a PDF is "simple" or "complex":
- **Simple**: Mostly extractable text, single-column, no embedded images/tables
- **Complex**: Scanned images, tables, multi-column, forms, mixed media

Logic:
1. Open PDF with PyMuPDF
2. For each page: count text blocks, image blocks, detect table-like patterns
3. Compute a complexity score
4. Return `"simple"` or `"complex"` classification

---

### OCR + LLM Pipeline (Simple Documents)

#### [NEW] [ocr_pipeline.py](file:///d:/VLM/ocr_pipeline.py)

For text-heavy, simple-layout PDFs:
1. Extract text directly with PyMuPDF (or Tesseract for scanned pages)
2. Send extracted text to `llama3.2:3b` via Ollama with a JSON-structuring prompt
3. Parse and validate the returned JSON
4. Return nested key-value pairs

---

### VLM Pipeline (Complex Documents)

#### [NEW] [vlm_pipeline.py](file:///d:/VLM/vlm_pipeline.py)

For complex-layout PDFs:
1. Convert each PDF page to an image using `pdf2image`
2. Send each page image to `llava:7b` via Ollama with a structured extraction prompt
3. Merge results across pages
4. Parse and validate the returned JSON
5. Return nested key-value pairs

---

### Main Orchestrator

#### [MODIFY] [vlm.py](file:///d:/VLM/vlm.py)

Entry point that ties everything together:
1. Accept PDF path via CLI argument
2. Run document analysis (simple vs complex)
3. Route to appropriate pipeline
4. Output final JSON to stdout and optionally save to file
5. Print classification, processing time, and confidence info

Usage: `python vlm.py <path_to_pdf> [--output output.json]`

---

## Verification Plan

### Automated Tests

1. **Create two test PDFs** in `d:\VLM\test_docs\`:
   - `simple_test.pdf` — A text-heavy single-column document (generated via Python)
   - `complex_test.pdf` — A document with tables and mixed layout (generated via Python)

2. **Run the pipeline** on each:
   ```bash
   python vlm.py test_docs/simple_test.pdf --output simple_output.json
   python vlm.py test_docs/complex_test.pdf --output complex_output.json
   ```

3. **Verify**: Check that both commands produce valid JSON output files with nested key-value structure.

### Manual Verification

1. Inspect `simple_output.json` and `complex_output.json` to verify the extracted key-value pairs are accurate
2. Check console output shows correct classification (`simple` → OCR+LLM, `complex` → VLM)
3. User can test with their own real-world PDFs

> [!NOTE]
> Since we're using local LLMs, output quality depends on the model. If results aren't good enough, we can swap `llama3.2:3b` for a larger model or fine-tune prompts.
