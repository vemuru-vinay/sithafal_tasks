import os
from dotenv import load_dotenv
from google.genai import Client

load_dotenv()

client = Client(api_key=os.getenv("GEMINI_API_KEY"))


SYNONYM_MAP = {
    "ongoing": "In progress",
    "running": "In progress",
    "active": "In progress",
    "finished": "Completed",
    "done": "Completed",
    "late": "Delayed",
    "overdue": "Delayed",

    "web app": "Web App Development",
    "web development": "Web App Development",
    "ai project": "AI Development",
    "machine learning": "AI Development",
    "data eng": "Data Engineering",
    "cloud": "Cloud Migration",
}


ALLOWED_STATUS = ["Completed", "In progress", "Delayed"]

ALLOWED_SERVICES = [
    "Web App Development",
    "AI Development",
    "Data Engineering",
    "Cloud Migration"
]


def normalize_user_text(text: str) -> str:
    """
    Replace known synonyms with official database values
    before sending to LLM.
    """
    text_lower = text.lower()

    for key, value in SYNONYM_MAP.items():
        if key in text_lower:
            text_lower = text_lower.replace(key, value)

    return text_lower


def clean_sql_output(sql_text: str) -> str:
    if not sql_text:
        return ""

    sql_text = sql_text.strip()

    if sql_text.startswith("```"):
        sql_text = sql_text.replace("```sql", "")
        sql_text = sql_text.replace("```", "")
        sql_text = sql_text.strip()

    return sql_text


def validate_sql(sql_text: str) -> str:
    """
    Block dangerous operations.
    """
    forbidden = ["drop", "delete", "update", "alter", "insert"]
    lower_sql = sql_text.lower()

    for word in forbidden:
        if word in lower_sql:
            return "-- BLOCKED: Dangerous SQL detected."

    return sql_text

def generate_sql(user_request: str, schema: str) -> str:
    """
    Convert natural language to MySQL SELECT query
    with semantic normalization and strict constraints.
    """

    normalized_request = normalize_user_text(user_request)

    prompt = f"""
You are a strict enterprise-grade SQL generator.

Database Schema:
{schema}

COLUMN CONSTRAINTS:

Project_Status allowed values:
{ALLOWED_STATUS}

Service_Type allowed values:
{ALLOWED_SERVICES}

CRITICAL RULES:
- Only generate SELECT queries.
- Never invent new values.
- If user word differs slightly, map it to closest allowed value.
- Always match exact database values.
- Use correct MySQL syntax.
- Return ONLY SQL.
- No explanation text.

DATE INTELLIGENCE:
Convert phrases like:
- last month
- this year
- between January and March
- today
- yesterday

into proper MySQL date logic.

User request:
"{normalized_request}"
"""

    try:
        response = client.models.generate_content(
            model="models/gemini-2.5-flash",
            contents=prompt
        )

        raw_sql = response.text
        cleaned_sql = clean_sql_output(raw_sql)
        validated_sql = validate_sql(cleaned_sql)

        return validated_sql

    except Exception as e:
        return f"-- SQL generation error: {str(e)}"
