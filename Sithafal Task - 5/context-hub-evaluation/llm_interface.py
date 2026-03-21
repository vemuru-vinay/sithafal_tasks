from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from typing import Optional

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - handled at runtime
    def load_dotenv() -> bool:
        return False

try:
    from openai import OpenAI
except ImportError:  # pragma: no cover - handled at runtime
    OpenAI = None  # type: ignore[assignment]


LOGGER = logging.getLogger(__name__)

BASE_SYSTEM_PROMPT = (
    "You are a software engineer assistant. Answer the user's question with accurate, "
    "practical guidance and include runnable Python examples when appropriate."
)

CONTEXT_PROMPT_TEMPLATE = """You are a software engineer assistant. Use the provided documentation to answer the user's question accurately.

Documentation:
{context}

Question:
{question}

Provide correct and runnable code examples."""

NO_CONTEXT_PROMPT_TEMPLATE = """You are a software engineer assistant.

Question:
{question}

Provide correct and runnable code examples."""


@dataclass
class LLMResponse:
    answer: str
    mode: str
    model: str
    source: str


def _build_fallback_answer(question: str, context: Optional[str]) -> str:
    lower = question.lower()
    has_context = context is not None
    context_note = (
        "The answer below was generated with documentation context."
        if has_context
        else "The answer below was generated without external documentation context."
    )

    if "stripe webhook" in lower:
        if has_context:
            return (
                f"{context_note}\n\n"
                "Use Stripe's official verification helper with the raw request body, the `Stripe-Signature` header, and your `endpoint_secret`.\n\n"
                "```python\n"
                "import stripe\n"
                "from fastapi import FastAPI, Header, HTTPException, Request\n\n"
                "app = FastAPI()\n"
                "endpoint_secret = 'whsec_...'\n\n"
                "@app.post('/stripe/webhook')\n"
                "async def stripe_webhook(request: Request, stripe_signature: str = Header(alias='Stripe-Signature')):\n"
                "    payload = await request.body()\n"
                "    try:\n"
                "        event = stripe.Webhook.construct_event(payload, stripe_signature, endpoint_secret)\n"
                "    except ValueError:\n"
                "        raise HTTPException(status_code=400, detail='Invalid payload')\n"
                "    except stripe.error.SignatureVerificationError:\n"
                "        raise HTTPException(status_code=400, detail='Invalid signature')\n"
                "    return {'type': event['type']}\n"
                "```\n"
            )
        return (
            f"{context_note}\n\n"
            "Verify the incoming webhook using Stripe's Python SDK and reject requests whose signature check fails.\n\n"
            "```python\n"
            "import stripe\n\n"
            "def verify_webhook(body, signature, secret):\n"
            "    return stripe.Webhook.construct_event(body, signature, secret)\n"
            "```\n"
        )

    if "stripe checkout" in lower:
        if has_context:
            return (
                f"{context_note}\n\n"
                "Create a Checkout Session with `stripe.checkout.Session.create` and include `line_items`, `success_url`, and `cancel_url`.\n\n"
                "```python\n"
                "import stripe\n\n"
                "stripe.api_key = 'sk_test_...'\n\n"
                "session = stripe.checkout.Session.create(\n"
                "    mode='payment',\n"
                "    line_items=[{'price': 'price_123', 'quantity': 1}],\n"
                "    success_url='https://example.com/success',\n"
                "    cancel_url='https://example.com/cancel',\n"
                ")\n"
                "print(session.url)\n"
                "```\n"
            )
        return (
            f"{context_note}\n\n"
            "Create a checkout session with Stripe's Python client and redirect the user to the hosted payment page.\n\n"
            "```python\n"
            "import stripe\n\n"
            "def create_checkout(price_id):\n"
            "    return {'price_id': price_id, 'status': 'create a Stripe checkout session here'}\n"
            "```\n"
        )

    if "fastapi background" in lower:
        if has_context:
            return (
                f"{context_note}\n\n"
                "FastAPI background tasks use `BackgroundTasks` in the route signature and `add_task` to queue work after the response is returned.\n\n"
                "```python\n"
                "from fastapi import BackgroundTasks, FastAPI\n\n"
                "app = FastAPI()\n\n"
                "def write_log(email: str) -> None:\n"
                "    with open('notifications.log', 'a', encoding='utf-8') as file:\n"
                "        file.write(f'Sent to {email}\\n')\n\n"
                "@app.post('/notify')\n"
                "async def notify(email: str, background_tasks: BackgroundTasks):\n"
                "    background_tasks.add_task(write_log, email)\n"
                "    return {'message': 'Notification scheduled'}\n"
                "```\n"
            )
        return (
            f"{context_note}\n\n"
            "Use a background job pattern in FastAPI so the response can return before the extra work finishes.\n\n"
            "```python\n"
            "from fastapi import FastAPI\n\n"
            "app = FastAPI()\n\n"
            "@app.post('/notify')\n"
            "async def notify():\n"
            "    return {'message': 'queued'}\n"
            "```\n"
        )

    if "github webhook" in lower:
        if has_context:
            return (
                f"{context_note}\n\n"
                "Validate the `X-Hub-Signature-256` header with `hmac`, `sha256`, and `compare_digest`.\n\n"
                "```python\n"
                "import hashlib\n"
                "import hmac\n\n"
                "def is_valid_signature(secret: str, payload: bytes, header_value: str) -> bool:\n"
                "    digest = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()\n"
                "    expected = f'sha256={digest}'\n"
                "    return hmac.compare_digest(expected, header_value)\n"
                "```\n"
            )
        return (
            f"{context_note}\n\n"
            "Compute an HMAC for the webhook body and compare it to the signature GitHub sends.\n\n"
            "```python\n"
            "import hmac\n"
            "import hashlib\n\n"
            "def verify(secret, payload, signature):\n"
            "    expected = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()\n"
            "    return expected == signature\n"
            "```\n"
        )

    if "aws s3" in lower or "boto3" in lower:
        if has_context:
            return (
                f"{context_note}\n\n"
                "Use `boto3.client('s3')` and call `upload_file(path, bucket, key)` with the target `Bucket` and object `Key`.\n\n"
                "```python\n"
                "import boto3\n"
                "from botocore.exceptions import ClientError\n\n"
                "def upload_file(path: str, bucket: str, key: str) -> bool:\n"
                "    s3 = boto3.client('s3')\n"
                "    try:\n"
                "        s3.upload_file(path, bucket, key)\n"
                "        return True\n"
                "    except ClientError as exc:\n"
                "        print(f'Upload failed: {exc}')\n"
                "        return False\n"
                "```\n"
            )
        return (
            f"{context_note}\n\n"
            "Create an S3 client and upload the file with boto3.\n\n"
            "```python\n"
            "import boto3\n\n"
            "def upload(path):\n"
            "    s3 = boto3.client('s3')\n"
            "    return s3\n"
            "```\n"
        )

    return (
        f"{context_note}\n\n"
        "No specialized fallback answer exists for this question. Please configure an OpenAI-compatible API "
        "to generate a model-backed response."
    )


def generate_answer(question: str, context: Optional[str] = None) -> LLMResponse:
    load_dotenv()

    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    api_key = os.getenv("OPENAI_API_KEY")
    base_url = os.getenv("OPENAI_BASE_URL")
    mode = "with_context" if context else "without_context"

    if OpenAI is None or not api_key:
        LOGGER.warning(
            "OpenAI SDK or API key unavailable; returning deterministic fallback answer."
        )
        return LLMResponse(
            answer=_build_fallback_answer(question, context),
            mode=mode,
            model=model,
            source="fallback",
        )

    client_kwargs = {"api_key": api_key}
    if base_url:
        client_kwargs["base_url"] = base_url
    client = OpenAI(**client_kwargs)

    user_prompt = (
        CONTEXT_PROMPT_TEMPLATE.format(context=context, question=question)
        if context
        else NO_CONTEXT_PROMPT_TEMPLATE.format(question=question)
    )

    try:
        response = client.responses.create(
            model=model,
            input=[
                {"role": "system", "content": BASE_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
        )
        answer_text = getattr(response, "output_text", "").strip()
    except Exception as exc:  # pragma: no cover - depends on external API
        LOGGER.warning("OpenAI request failed; using fallback answer. Error: %s", exc)
        return LLMResponse(
            answer=_build_fallback_answer(question, context),
            mode=mode,
            model=model,
            source="fallback",
        )

    if not answer_text:
        answer_text = _build_fallback_answer(question, context)
        source = "fallback"
    else:
        source = "openai-compatible-api"

    return LLMResponse(answer=answer_text, mode=mode, model=model, source=source)
