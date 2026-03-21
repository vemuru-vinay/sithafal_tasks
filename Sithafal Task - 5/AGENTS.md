# Agent Instructions

## Context Hub

This agent can use Context Hub (CHUB) to retrieve up-to-date API and SDK documentation.

Use Context Hub when answering questions or performing tasks about:
- APIs
- SDKs
- libraries
- frameworks
- cloud services
- implementation details or code examples
- integrations
- API-related bug fixes
- API-related refactors
- API-related code generation or edits

Model knowledge may be outdated. Prefer Context Hub documentation when available.

## Workflow

Before answering API or coding questions, and before performing API-related implementation work:

1. Search documentation
   `context-hub-evaluation\tools\chub.cmd search <topic>`

2. Retrieve relevant docs
   `context-hub-evaluation\tools\chub.cmd get <tool>/<topic> --lang <language>`

Example:
`context-hub-evaluation\tools\chub.cmd search stripe`
`context-hub-evaluation\tools\chub.cmd get stripe/webhook --lang python`

## Rules

- Use retrieved documentation as the primary source.
- Provide accurate, runnable code examples.
- Do not invent API parameters.
- For API-related tasks, use retrieved documentation before writing or changing code when relevant docs are available.
- If no documentation is found, say so and then proceed using general knowledge and local code context.
