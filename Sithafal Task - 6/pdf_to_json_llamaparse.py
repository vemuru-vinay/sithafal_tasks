import json
from pathlib import Path

from dotenv import load_dotenv
from llama_cloud import LlamaCloud
from pydantic import BaseModel, Field


class ExtractedField(BaseModel):
    key: str = Field(description="Short clean field name based on the document content.")
    value: str = Field(description="Exact or cleaned value for the field.")


class DocumentSection(BaseModel):
    heading: str = Field(description="Section heading or logical section name.")
    items: list[ExtractedField] = Field(
        default_factory=list,
        description="Important fields found inside this section.",
    )


class GenericDocument(BaseModel):
    document_type: str = Field(description="Best guess of document type.")
    title: str | None = Field(description="Main title if present.")
    important_fields: list[ExtractedField] = Field(
        default_factory=list,
        description="Most important fields discovered anywhere in the document.",
    )
    sections: list[DocumentSection] = Field(
        default_factory=list,
        description="Logical sections and their extracted fields.",
    )
    summary: str = Field(description="Short accurate summary of the document.")


PROMPT = (
    "Extract this PDF into clean, structured JSON for an unknown document type. "
    "Do not assume a fixed format like invoice or resume. "
    "First identify the document type, then capture the most important fields using short, meaningful keys. "
    "Group related fields into sections when possible."
    "Prefer explicit values from the document. Do not invent data."
    "If a value is missing, omit it instead of guessing."
    "Make the output concise, clean, and useful for downstream processing."
)


load_dotenv()
pdf = next(Path(".").glob("*.pdf"), None)
if not pdf:
    raise FileNotFoundError("Keep one PDF file in this folder.")

client = LlamaCloud()
agent = client.extraction.extraction_agents.create(
    name="generic-clean-json",
    data_schema=GenericDocument.model_json_schema(),
    config={"system_prompt": PROMPT},
)
file = client.files.create(file=str(pdf), purpose="extract")
result = client.extraction.jobs.extract(extraction_agent_id=agent.id, file_id=file.id)

Path("output.json").write_text(
    json.dumps(result.data, indent=2, ensure_ascii=False),
    encoding="utf-8",
)
print("Created output.json from", pdf.name)
