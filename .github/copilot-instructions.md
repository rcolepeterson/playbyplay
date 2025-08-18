# Copilot Instructions for playbyplay

Welcome to the playbyplay project! This file provides guidance for GitHub Copilot and contributors to ensure consistent, high-quality code and a great developer experience.

## Project Overview

- This is an AI-powered sports commentary and video playback platform built with Next.js, TypeScript, and Tailwind CSS.
- The project uses Google Gemini, Eleven Labs, and Google Cloud Storage APIs for AI and media features.

## Coding Guidelines

- Use TypeScript for all new code and prefer type annotations for clarity.
- Follow existing code style and use Prettier for formatting.
- Use environment variables for all secrets and API keys. Never hardcode credentials.
- Add comments to explain complex logic or important decisions.
- Remove debug/test code and console logs before merging to main.

## File/Folder Conventions

- Place UI components in `components/ui/`.
- API routes go in `app/api/`.
- Utility functions go in `lib/` or `app/process/` as appropriate.
- Keep experimental or test files out of the main branch.

## Pull Request Checklist

- Ensure all tests pass and the app builds successfully.
- Update documentation and `.env.example` if needed.
- Remove any leftover debug or test code.
- Use clear, descriptive commit messages.

## Copilot Usage

- Prefer concise, readable code and avoid unnecessary complexity.
- Suggest code that matches the project's architecture and style.
- Do not suggest code that exposes secrets or sensitive data.

## Additional Notes

- See `README.md` for setup and usage instructions.
- See `CONTRIBUTING.md` for contribution guidelines (if present).

Thank you for helping make this project better!
