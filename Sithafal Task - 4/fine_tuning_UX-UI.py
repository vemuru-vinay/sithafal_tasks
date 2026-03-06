from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments, Trainer
from peft import LoraConfig, get_peft_model
import torch
from datasets import load_dataset

dataset = load_dataset("json", data_files="dataset.jsonl")
dataset = dataset["train"]

# -----------------------------
# 2. Load model
# -----------------------------

model_name = "gpt2"

tokenizer = AutoTokenizer.from_pretrained(model_name)

model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
)

# -----------------------------
# 3. Apply LoRA (PEFT)
# -----------------------------

config = LoraConfig(
    r=8,
    lora_alpha=16,
    target_modules=["c_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM"
)

model = get_peft_model(model, config)

# -----------------------------
# 4. Tokenization
# -----------------------------

def format_example(example):
    text = f"Instruction: {example['instruction']}\nInput: {example['input']}\nOutput: {example['output']}"
    tokens = tokenizer(
        text,
        truncation=True,
        padding="max_length",
        max_length=256
    )
    tokens["labels"] = tokens["input_ids"].copy()
    return tokens

tokenized_dataset = dataset.map(format_example)

# -----------------------------
# 5. Training configuration
# -----------------------------

training_args = TrainingArguments(
    output_dir="./results",
    per_device_train_batch_size=1,
    num_train_epochs=3,
    learning_rate=2e-4,
    logging_steps=1,
    save_steps=10,
)

# -----------------------------
# 6. Trainer
# -----------------------------

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset
)

# -----------------------------
# 7. Train model
# -----------------------------

trainer.train()

# -----------------------------
# 8. Test generation
# -----------------------------

prompt = "Instruction: Generate UI JSON for login page\nInput: Login screen with email and password\nOutput:"

inputs = tokenizer(prompt, return_tensors="pt")

with torch.no_grad():
    output = model.generate(
        **inputs,
        max_length=200
    )

print("\nGenerated Output:\n")
print(tokenizer.decode(output[0]))