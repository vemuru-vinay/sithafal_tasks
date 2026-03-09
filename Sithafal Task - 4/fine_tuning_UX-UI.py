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
tokenizer.pad_token = tokenizer.eos_token

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

    prompt = f"Instruction: {example['instruction']}\nInput: {example['input']}\nOutput:\n"
    response = example["output"]

    prompt_tokens = tokenizer(prompt, truncation=True, max_length=256)
    response_tokens = tokenizer(response, truncation=True, max_length=256)

    input_ids = prompt_tokens["input_ids"] + response_tokens["input_ids"]

    labels = [-100]*len(prompt_tokens["input_ids"]) + response_tokens["input_ids"]

    return {
        "input_ids": input_ids,
        "labels": labels
    }

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

prompt = """Instruction: Generate UI JSON
Input: Login page with email input, password input and login button
Output:
"""

device = "cuda" if torch.cuda.is_available() else "cpu"

model.to(device)

inputs = tokenizer(prompt, return_tensors="pt").to(device)

with torch.no_grad():
    output = model.generate(
    **inputs,
    max_new_tokens=150,
    min_new_tokens=20,
    do_sample=True,
    temperature=0.9,
    top_p=0.95,
    top_k=50,
    repetition_penalty=1.2,
    pad_token_id=tokenizer.eos_token_id
)
print("\n======================")
print("Output : ")
print("======================\n")

generated = output[0][inputs["input_ids"].shape[1]:]
decoded = tokenizer.decode(generated, skip_special_tokens=True)

print(decoded)