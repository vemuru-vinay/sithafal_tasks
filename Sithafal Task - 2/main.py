from app.chatbot import ask_bot

schema = """
project_cleaned(Project_ID, Client_Name, Service_Type, Start_Date, End_Date,
                Team_Size, Budget_USD, Project_Status)
"""

print("Sithafal AI Assistant Connected to Database.\n")

while True:
    text = input("Ask me anything about your project data: ")

    if text.lower() in ["exit", "quit"]:
        print("Goodbye!")
        break

    answer = ask_bot(text, schema)
    print("\n", answer, "\n")
