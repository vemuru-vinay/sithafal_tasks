# Simple PDF to Clean JSON with LlamaCloud

Put these files in the same folder:

- `pdf_to_json_llamaparse.py`
- your PDF file
- `.env`

## `.env` file

Create a `.env` file in the same folder:

```env
LLAMA_CLOUD_API_KEY=your_api_key_here
```

## Install

```bash
pip install -r requirements.txt
```

## Run

```bash
python pdf_to_json_llamaparse.py
```

## What it does

- Reads the API key from `.env`
- Automatically picks the first PDF file in the current folder
- Extracts a clean structured JSON from the PDF with LlamaCloud
- Creates `output.json`
- Overwrites `output.json` if it already exists

If there is no PDF in the folder, the script will show an error.
