from __future__ import annotations

import logging
import os
from pathlib import Path
import subprocess
from dataclasses import dataclass
from typing import Optional


LOGGER = logging.getLogger(__name__)


@dataclass
class RetrievedContext:
    query: str
    target: str
    language: str
    search_command: list[str]
    get_command: list[str]
    search_output: str
    documentation: str
    source: str
    status: str

    @property
    def summary(self) -> str:
        headline = self.documentation.strip().splitlines()
        preview = " ".join(line.strip() for line in headline[:4] if line.strip())
        preview = preview[:300].strip()
        return (
            f"status={self.status}; source={self.source}; "
            f"search_command={' '.join(self.search_command)}; "
            f"get_command={' '.join(self.get_command)}; "
            f"preview={preview or 'No documentation returned.'}"
        )


def _run_command(command: list[str], timeout: int = 30) -> tuple[int, str, str]:
    try:
        completed = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )
    except FileNotFoundError:
        LOGGER.warning("Command not found: %s", command[0])
        return 127, "", f"Command not found: {command[0]}"
    except subprocess.TimeoutExpired:
        LOGGER.warning("Command timed out: %s", " ".join(command))
        return 124, "", f"Command timed out after {timeout}s"

    return completed.returncode, completed.stdout.strip(), completed.stderr.strip()


def _build_fallback_documentation(question_item: dict) -> str:
    topic = question_item["topic"]
    question = question_item["question"]

    canned_docs = {
        "stripe": (
            "Stripe Python guidance:\n"
            "- Install the official stripe package.\n"
            "- Use stripe.Webhook.construct_event(payload, sig_header, endpoint_secret) "
            "to verify webhook signatures.\n"
            "- Use stripe.checkout.Session.create(...) to create Checkout sessions.\n"
            "- Read the raw request body before verification and pass the "
            "'Stripe-Signature' header."
        ),
        "fastapi": (
            "FastAPI documentation summary:\n"
            "- Import BackgroundTasks from fastapi.\n"
            "- Accept BackgroundTasks in the route function signature.\n"
            "- Register work with background_tasks.add_task(function, *args).\n"
            "- Return the response immediately while the task runs after the response."
        ),
        "github": (
            "GitHub webhook validation summary:\n"
            "- Use the X-Hub-Signature-256 header.\n"
            "- Compute an HMAC SHA-256 digest with the webhook secret and raw payload.\n"
            "- Compare the expected and received digests with hmac.compare_digest."
        ),
        "boto3": (
            "boto3 S3 upload summary:\n"
            "- Create a client with boto3.client('s3').\n"
            "- Call upload_file(filename, bucket, key).\n"
            "- Handle ClientError for failures and ensure AWS credentials are configured."
        ),
    }

    return (
        canned_docs.get(topic, "No canned documentation is available for this topic.")
        + f"\n\nOriginal question: {question}"
    )


def retrieve_context(question_item: dict, use_fallback: bool = True) -> RetrievedContext:
    query = question_item["topic"]
    target = question_item["doc_target"]
    language = question_item.get("doc_language", "python")
    project_root = Path(__file__).resolve().parent
    default_cli = project_root / "tools" / "chub.cmd"
    cli_name = os.getenv("CHUB_COMMAND", str(default_cli if default_cli.exists() else "chub"))

    search_command = [cli_name, "search", query]
    get_command = [cli_name, "get", target, "--lang", language]

    search_code, search_stdout, search_stderr = _run_command(search_command)
    get_code, get_stdout, get_stderr = _run_command(get_command)

    if search_code == 0 and get_code == 0 and get_stdout:
        return RetrievedContext(
            query=query,
            target=target,
            language=language,
            search_command=search_command,
            get_command=get_command,
            search_output=search_stdout,
            documentation=get_stdout,
            source="chub-cli",
            status="ok",
        )

    error_details = "\n".join(
        part for part in [search_stderr, get_stderr] if part
    ).strip()
    LOGGER.warning("Falling back to built-in docs for '%s': %s", query, error_details)

    fallback_docs = _build_fallback_documentation(question_item) if use_fallback else ""
    status = "fallback" if fallback_docs else "error"
    documentation = fallback_docs or "No documentation available."

    return RetrievedContext(
        query=query,
        target=target,
        language=language,
        search_command=search_command,
        get_command=get_command,
        search_output=search_stdout or search_stderr,
        documentation=documentation,
        source="built-in-fallback",
        status=status,
    )
