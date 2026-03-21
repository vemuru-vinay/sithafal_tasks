# Context Hub Evaluation

`context-hub-evaluation` is a lightweight Python research experiment for measuring whether Context Hub improves LLM-generated developer answers by supplying up-to-date documentation at generation time.

The experiment compares two answer-generation modes for the same set of API-heavy developer questions:

- Without Context Hub documentation
- With Context Hub documentation retrieved through the `chub` CLI

It stores both outputs, adds simple heuristic metrics, and writes a JSON artifact for later analysis.

## Why This Experiment Exists

Large language models can answer many coding questions from prior training alone, but answers can drift from current docs, omit required parameters, or use outdated patterns. Context Hub is useful because it can retrieve relevant documentation just before generation. This project makes that difference visible in a repeatable command-line workflow.

## Project Structure

```text
context-hub-evaluation/
├── main.py
├── evaluator.py
├── context_retriever.py
├── llm_interface.py
├── test_questions.py
├── results/
│   └── experiment_results.json
├── requirements.txt
└── README.md
```

## How It Works

1. Loads a fixed dataset of developer questions from `test_questions.py`.
2. Generates an answer without documentation context.
3. Calls the `chub` CLI to search and fetch relevant docs.
4. Injects retrieved docs into the prompt and generates a second answer.
5. Calculates heuristic metrics such as:
   - response length
   - presence of code blocks
   - expected API keyword coverage
6. Saves everything to `results/experiment_results.json`.

## Installing Python Dependencies

Create and activate a virtual environment, then install the dependencies:

```bash
pip install -r requirements.txt
```

## Installing CHUB

This project expects the Context Hub CLI to be available as `chub` on your `PATH`.

Example placeholder flow:

```bash
chub search stripe
chub get stripe/webhook --lang python
```

If `chub` is not installed or not available on `PATH`, the project falls back to built-in documentation snippets so the experiment can still run in sample mode.

## Configuring the LLM

This project uses the OpenAI Python SDK with any OpenAI-compatible endpoint.

Set environment variables before running:

```bash
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

If the SDK is unavailable or the API key is missing, the project falls back to deterministic sample answers. That makes the CLI usable for demos, but real evaluation quality is better with a live model.

## Running the Evaluation

```bash
python main.py
```

The command will:

- run the full experiment
- save JSON results to `results/experiment_results.json`
- print a CLI summary table

## Result Format

Each result record includes:

```json
{
  "question_id": "stripe_webhook_signature",
  "question": "How do I verify a Stripe webhook signature in Python?",
  "without_context": {
    "answer": "...",
    "metrics": {
      "response_length": 1234,
      "has_code_block": true,
      "match_count": 3
    }
  },
  "with_context": {
    "answer": "...",
    "metrics": {
      "response_length": 1402,
      "has_code_block": true,
      "match_count": 4
    }
  },
  "retrieved_docs_summary": "status=ok; source=chub-cli; ..."
}
```

## Notes

- `subprocess` is used from Python's standard library, so it is not installed separately with `pip`.
- The built-in fallback mode is intended for offline demos and local scaffolding.
- For a real research run, install Python, the required packages, the `chub` CLI, and configure an API key.
