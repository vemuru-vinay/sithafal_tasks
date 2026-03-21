from __future__ import annotations

TEST_QUESTIONS = [
    {
        "id": "stripe_webhook_signature",
        "question": "How do I verify a Stripe webhook signature in Python?",
        "topic": "stripe",
        "doc_target": "stripe/webhook",
        "doc_language": "python",
        "expected_keywords": [
            "Stripe-Signature",
            "construct_event",
            "endpoint_secret",
            "payload",
        ],
    },
    {
        "id": "stripe_checkout_session",
        "question": "How do I create a Stripe checkout session using Python?",
        "topic": "stripe",
        "doc_target": "stripe/checkout",
        "doc_language": "python",
        "expected_keywords": [
            "checkout.Session.create",
            "line_items",
            "success_url",
            "cancel_url",
        ],
    },
    {
        "id": "fastapi_background_tasks",
        "question": "How do I implement FastAPI background tasks?",
        "topic": "fastapi",
        "doc_target": "fastapi/background-tasks",
        "doc_language": "python",
        "expected_keywords": [
            "BackgroundTasks",
            "add_task",
            "FastAPI",
            "async",
        ],
    },
    {
        "id": "github_webhook_signature",
        "question": "How do I validate a GitHub webhook signature in Python?",
        "topic": "github",
        "doc_target": "github/webhooks",
        "doc_language": "python",
        "expected_keywords": [
            "X-Hub-Signature-256",
            "hmac",
            "sha256",
            "compare_digest",
        ],
    },
    {
        "id": "boto3_s3_upload",
        "question": "How do I upload a file to AWS S3 using boto3?",
        "topic": "boto3",
        "doc_target": "aws/s3-upload",
        "doc_language": "python",
        "expected_keywords": [
            "boto3.client",
            "upload_file",
            "Bucket",
            "Key",
        ],
    },
]
