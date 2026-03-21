from __future__ import annotations

import json
import logging
import os
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import stripe


LOGGER = logging.getLogger(__name__)


def process_stripe_event(event: stripe.Event) -> None:
    """Dispatch verified Stripe events to your application logic."""
    event_type = event["type"]

    if event_type == "checkout.session.completed":
        session = event["data"]["object"]
        LOGGER.info("Checkout session completed: %s", session.get("id"))
        return

    LOGGER.info("Ignoring unhandled Stripe event type: %s", event_type)


def verify_and_process_webhook(
    payload: bytes, signature: str | None, endpoint_secret: str
) -> tuple[dict[str, str], HTTPStatus]:
    """Verify a Stripe webhook payload and process the resulting event."""
    if not signature:
        return {"error": "Missing Stripe-Signature header."}, HTTPStatus.BAD_REQUEST

    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=signature,
            secret=endpoint_secret,
        )
    except ValueError:
        return {"error": "Invalid payload."}, HTTPStatus.BAD_REQUEST
    except stripe.error.SignatureVerificationError:
        return {"error": "Invalid signature."}, HTTPStatus.BAD_REQUEST

    process_stripe_event(event)
    return {"status": "success"}, HTTPStatus.OK


class StripeWebhookHandler(BaseHTTPRequestHandler):
    """Minimal HTTP handler for a Stripe webhook endpoint."""

    server_version = "StripeWebhookExample/1.0"

    def do_POST(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler interface
        endpoint_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")
        if not endpoint_secret:
            self._send_json(
                {"error": "Set STRIPE_WEBHOOK_SECRET before starting the server."},
                HTTPStatus.INTERNAL_SERVER_ERROR,
            )
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        payload = self.rfile.read(content_length)
        signature = self.headers.get("Stripe-Signature")

        body, status = verify_and_process_webhook(
            payload=payload,
            signature=signature,
            endpoint_secret=endpoint_secret,
        )
        self._send_json(body, status)

    def log_message(self, format: str, *args) -> None:
        LOGGER.info("%s - %s", self.address_string(), format % args)

    def _send_json(self, body: dict[str, str], status: HTTPStatus) -> None:
        response = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(response)))
        self.end_headers()
        self.wfile.write(response)


def run_server(port: int = 8000) -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
    server = ThreadingHTTPServer(("127.0.0.1", port), StripeWebhookHandler)
    LOGGER.info("Listening for Stripe webhooks on http://127.0.0.1:%s", port)
    server.serve_forever()


if __name__ == "__main__":
    run_server()
