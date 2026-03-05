from llm.model import generate_sql
from db.connection import get_engine
import pandas as pd


engine = get_engine()

def ask_bot(user_text: str, schema: str):
    """
    Takes natural language from the user,
    asks LLM to convert to SQL,
    runs the SQL safely,
    returns the result.
    """

    sql_query = generate_sql(user_text, schema)

    print("\n[DEBUG] Generated SQL (not shown to user):", sql_query)

    try:
        df = pd.read_sql(sql_query, engine)
        if df.empty:
            return "No matching data found."

        return df.to_markdown(index=False)

    except Exception as e:
        return f"SQL Error: {e}"
