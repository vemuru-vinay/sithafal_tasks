#!/usr/bin/env node

const docs = {
  stripe: {
    search: [
      "stripe/webhook - Verify Stripe webhook signatures in Python",
      "stripe/checkout - Create Stripe Checkout sessions in Python",
    ],
    targets: {
      "stripe/webhook": `Stripe webhook verification (Python)

Use the raw request body and the Stripe-Signature header when verifying webhooks.

Example:
import stripe

event = stripe.Webhook.construct_event(
    payload,
    sig_header,
    endpoint_secret,
)

Notes:
- payload should be the raw bytes from the incoming request body.
- sig_header should come from the Stripe-Signature HTTP header.
- endpoint_secret is the webhook signing secret from the Stripe dashboard.
- Handle ValueError for invalid payloads.
- Handle stripe.error.SignatureVerificationError for invalid signatures.
`,
      "stripe/checkout": `Stripe Checkout Session creation (Python)

Create a Checkout Session with stripe.checkout.Session.create.

Example:
import stripe

session = stripe.checkout.Session.create(
    mode="payment",
    line_items=[{"price": "price_123", "quantity": 1}],
    success_url="https://example.com/success",
    cancel_url="https://example.com/cancel",
)

Notes:
- Provide line_items with a price identifier and quantity.
- Use success_url and cancel_url to control post-payment redirects.
- Access session.url to redirect the user to Checkout.
`,
    },
  },
  fastapi: {
    search: [
      "fastapi/background-tasks - Run work after sending a response",
    ],
    targets: {
      "fastapi/background-tasks": `FastAPI background tasks

Use BackgroundTasks to schedule work after returning a response.

Example:
from fastapi import BackgroundTasks, FastAPI

app = FastAPI()

def write_notification(email: str) -> None:
    with open("notifications.log", "a", encoding="utf-8") as file:
        file.write(f"sent to {email}\\n")

@app.post("/notify")
async def notify(email: str, background_tasks: BackgroundTasks):
    background_tasks.add_task(write_notification, email)
    return {"message": "Notification scheduled"}

Notes:
- Add BackgroundTasks to the route signature.
- Use add_task(function, *args) to enqueue the work.
`,
    },
  },
  github: {
    search: [
      "github/webhooks - Validate GitHub webhook signatures with HMAC SHA-256",
    ],
    targets: {
      "github/webhooks": `GitHub webhook signature validation (Python)

GitHub sends the X-Hub-Signature-256 header for webhook verification.

Example:
import hashlib
import hmac

def is_valid_signature(secret: str, payload: bytes, header_value: str) -> bool:
    digest = hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
    expected = f"sha256={digest}"
    return hmac.compare_digest(expected, header_value)

Notes:
- Use the raw request body bytes as payload.
- Compare the computed digest with X-Hub-Signature-256.
- Use compare_digest to avoid timing attacks.
`,
    },
  },
  boto3: {
    search: [
      "aws/s3-upload - Upload files to S3 with boto3",
    ],
    targets: {
      "aws/s3-upload": `AWS S3 upload with boto3 (Python)

Use boto3.client("s3").upload_file for simple uploads.

Example:
import boto3
from botocore.exceptions import ClientError

def upload_file(path: str, bucket: str, key: str) -> bool:
    s3 = boto3.client("s3")
    try:
        s3.upload_file(path, bucket, key)
        return True
    except ClientError:
        return False

Notes:
- path is the local filename.
- bucket is the target S3 bucket name.
- key is the destination object key in S3.
`,
    },
  },
};

function printUsage() {
  console.error("Usage: chub search <topic> | chub get <target> --lang <language>");
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length < 2) {
  printUsage();
}

const command = args[0];

if (command === "search") {
  const topic = args[1];
  const entry = docs[topic];
  if (!entry) {
    console.error(`No docs found for topic: ${topic}`);
    process.exit(2);
  }
  console.log(entry.search.join("\n"));
  process.exit(0);
}

if (command === "get") {
  const target = args[1];
  const byTopic = Object.values(docs);
  for (const entry of byTopic) {
    if (entry.targets[target]) {
      console.log(entry.targets[target]);
      process.exit(0);
    }
  }
  console.error(`No docs found for target: ${target}`);
  process.exit(2);
}

printUsage();

