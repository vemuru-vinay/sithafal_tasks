from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

try:
    from rich.console import Console
    from rich.table import Table
except ImportError:  # pragma: no cover - handled at runtime
    Console = None  # type: ignore[assignment]
    Table = None  # type: ignore[assignment]

from context_retriever import retrieve_context
from llm_interface import generate_answer
from test_questions import TEST_QUESTIONS


LOGGER = logging.getLogger(__name__)
CONSOLE = Console() if Console else None


def _configure_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(levelname)s | %(name)s | %(message)s",
    )


def _has_code_block(text: str) -> bool:
    return "```" in text


def _keyword_match_score(text: str, keywords: list[str]) -> dict[str, Any]:
    lowered = text.lower()
    matched = [keyword for keyword in keywords if keyword.lower() in lowered]
    return {
        "matched_keywords": matched,
        "match_count": len(matched),
        "total_keywords": len(keywords),
        "coverage_ratio": round(len(matched) / max(len(keywords), 1), 2),
    }


def _build_record(question_item: dict, without_answer, with_answer, retrieved_context) -> dict:
    without_metrics = {
        "response_length": len(without_answer.answer),
        "has_code_block": _has_code_block(without_answer.answer),
        **_keyword_match_score(without_answer.answer, question_item["expected_keywords"]),
    }
    with_metrics = {
        "response_length": len(with_answer.answer),
        "has_code_block": _has_code_block(with_answer.answer),
        **_keyword_match_score(with_answer.answer, question_item["expected_keywords"]),
    }

    return {
        "question_id": question_item["id"],
        "question": question_item["question"],
        "topic": question_item["topic"],
        "without_context": {
            "answer": without_answer.answer,
            "model": without_answer.model,
            "source": without_answer.source,
            "metrics": without_metrics,
        },
        "with_context": {
            "answer": with_answer.answer,
            "model": with_answer.model,
            "source": with_answer.source,
            "metrics": with_metrics,
        },
        "retrieved_docs_summary": retrieved_context.summary,
        "retrieved_docs_source": retrieved_context.source,
        "retrieved_docs_status": retrieved_context.status,
        "retrieved_docs_excerpt": retrieved_context.documentation[:1200],
    }


def _write_results(results_path: Path, payload: dict[str, Any]) -> None:
    results_path.parent.mkdir(parents=True, exist_ok=True)
    results_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    LOGGER.info("Saved experiment results to %s", results_path)


def run_experiment(project_root: Path | None = None) -> dict[str, Any]:
    _configure_logging()

    root = project_root or Path(__file__).resolve().parent
    results_path = root / "results" / "experiment_results.json"
    experiment_records = []

    if CONSOLE:
        CONSOLE.print("[bold cyan]Running Context Hub evaluation experiment[/bold cyan]")
    else:
        print("Running Context Hub evaluation experiment")

    for index, question_item in enumerate(TEST_QUESTIONS, start=1):
        progress_line = f"{index}/{len(TEST_QUESTIONS)} {question_item['question']}"
        if CONSOLE:
            CONSOLE.print(
                f"[cyan]{index}/{len(TEST_QUESTIONS)}[/cyan] {question_item['question']}"
            )
        else:
            print(progress_line)

        without_answer = generate_answer(question_item["question"])
        retrieved_context = retrieve_context(question_item)
        with_answer = generate_answer(
            question_item["question"], context=retrieved_context.documentation
        )

        experiment_records.append(
            _build_record(question_item, without_answer, with_answer, retrieved_context)
        )

    summary = {
        "questions_evaluated": len(experiment_records),
        "context_used_count": sum(
            1 for item in experiment_records if item["retrieved_docs_status"] == "ok"
        ),
        "fallback_context_count": sum(
            1 for item in experiment_records if item["retrieved_docs_status"] == "fallback"
        ),
        "avg_keyword_coverage_without_context": round(
            sum(
                item["without_context"]["metrics"]["coverage_ratio"]
                for item in experiment_records
            )
            / max(len(experiment_records), 1),
            2,
        ),
        "avg_keyword_coverage_with_context": round(
            sum(
                item["with_context"]["metrics"]["coverage_ratio"]
                for item in experiment_records
            )
            / max(len(experiment_records), 1),
            2,
        ),
    }

    payload = {"summary": summary, "results": experiment_records}
    _write_results(results_path, payload)
    return payload


def print_summary(results: dict[str, Any]) -> None:
    summary = results["summary"]
    if not Table or not CONSOLE:
        print("Context Hub Evaluation Summary")
        print(f"Questions evaluated: {summary['questions_evaluated']}")
        print(f"CHUB retrieval successes: {summary['context_used_count']}")
        print(f"Fallback context runs: {summary['fallback_context_count']}")
        print(
            "Avg keyword coverage (no context): "
            f"{summary['avg_keyword_coverage_without_context']}"
        )
        print(
            "Avg keyword coverage (with context): "
            f"{summary['avg_keyword_coverage_with_context']}"
        )
        return

    table = Table(title="Context Hub Evaluation Summary")
    table.add_column("Metric", style="bold")
    table.add_column("Value")
    table.add_row("Questions evaluated", str(summary["questions_evaluated"]))
    table.add_row("CHUB retrieval successes", str(summary["context_used_count"]))
    table.add_row("Fallback context runs", str(summary["fallback_context_count"]))
    table.add_row(
        "Avg keyword coverage (no context)",
        str(summary["avg_keyword_coverage_without_context"]),
    )
    table.add_row(
        "Avg keyword coverage (with context)",
        str(summary["avg_keyword_coverage_with_context"]),
    )
    CONSOLE.print(table)
