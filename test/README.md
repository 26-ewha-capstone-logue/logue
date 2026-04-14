# AI Question Analysis MVP

Phase 2 local AI evaluation harness for a very small demo project.

## Scope

- No backend API server
- Local Node script runs OpenAI evaluation directly
- Static React frontend only visualizes fixtures and saved result files
- Frontend does not call OpenAI

## Stack

- React + Vite + TypeScript
- Node script via `tsx`
- OpenAI SDK + `.env`

## Project Structure

- `fixtures/`: datasets, metric preset, test cases
- `public/results/`: saved output files rendered by the frontend
- `scripts/run-analysis-tests.ts`: local OpenAI evaluation runner
- `src/`: static demo UI

## Install

```bash
npm install
```

## Environment

1. Copy `.env.example` to `.env`
2. Set `OPENAI_API_KEY`
3. Optionally change `OPENAI_MODEL`

Example:

```bash
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
```

## Run Frontend

```bash
npm run dev
```

Local dev opens at the root path, for example `http://localhost:5173/`.

## Run Local AI Test Harness

```bash
npm run ai:test
```

## Run Demo

```bash
npm run demo
```

This runs the Vite dev server and the local AI test harness together.

The script will:

- read `fixtures/metrics.json`, dataset fixtures, and `fixtures/test-cases.json`
- call OpenAI once per test case
- compare actual JSON to expected partial criteria
- write aggregated results to `public/results/latest-results.json`
- write readable console output to `public/results/latest-console.txt`

## Demo Flow

1. `npm install`
2. Create `.env` and set `OPENAI_API_KEY`
3. `npm run demo`
4. Open the local Vite URL printed in the terminal and inspect the saved results section

## Notes

- If `OPENAI_API_KEY` is missing, the script exits with a helpful error.
- If one case fails due to parsing or API error, the script continues and records that case as failed.
- The frontend still reads fixtures directly and fetches saved result files from `public/results/`.
- If the default port is busy, Vite automatically starts on the next available port.
