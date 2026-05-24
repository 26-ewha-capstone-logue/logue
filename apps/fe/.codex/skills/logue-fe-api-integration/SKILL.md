---
name: logue-fe-api-integration
description: FE-only Logue API integration guardrails for apps/fe. Use when Codex adds, edits, reviews, or debugs frontend API wiring in apps/fe, including src/apis modules, src/lib/axios.ts, axios or fetch calls, ApiResponse and unwrapApiResponse usage, auth token handling, API error handling, TanStack Query useQuery/useMutation query keys, cache invalidation, and loading/error/empty states. Do not use for pure UI, CSS, Storybook-only, static component, backend, or AI work.
---

# Logue FE API Integration

## Scope

Use this skill only for Logue frontend work under `apps/fe/**` when the task touches server communication or frontend server-state behavior.

Do not apply this skill to `apps/be/**`, `apps/ai/**`, docs-only work, pure UI styling, Storybook-only changes, or static component work that does not call or model an API.

## Existing FE Contracts

- Prefer the existing `src/lib/axios.ts` instance for HTTP calls. Add a new client only when the existing instance cannot support the request, and make that reason explicit.
- Keep API base URL behavior in `src/lib/apiBaseUrl.ts`; do not duplicate environment fallback logic in endpoint modules or components.
- Keep the response envelope pattern in `src/apis/types.ts`: type endpoint responses as `ApiResponse<T>` and return `unwrapApiResponse(data)` from API functions.
- Keep auth token reads, writes, and 401 token clearing in `src/lib/auth.ts`, `src/providers/AuthProvider.tsx`, and `src/lib/axios.ts` unless the task explicitly changes auth behavior.
- Use TanStack Query through the existing `QueryProvider` defaults; override query options locally only when the user-visible behavior requires it.

## API Layer Workflow

1. Inspect the nearest existing `src/apis/*` module and the consuming page/component before adding code.
2. Put endpoint functions plus request/response DTO types in the domain API module. Keep components from constructing URLs or parsing envelope responses.
3. Return domain data from API functions, not raw Axios responses, unless the caller truly needs headers or status.
4. Add a query key factory beside the API module when keys will be reused, invalidated, or shared across pages. A single one-off query may keep an inline key.
5. For mutations, define the smallest correct `invalidateQueries` target from the affected query key factory.
6. In consuming UI, cover loading, empty, error, disabled, and pending states for every reachable server-state branch.

## Error Handling Check

- Distinguish envelope failures (`success: false`) from Axios/network/timeout/auth failures.
- If UI needs an error message, code, status, or field errors from API failures, add or extend a small FE-side normalizer before components depend on transport-specific shapes.
- Do not let components branch on `error.response.data`, `AxiosError`, or raw unknown error objects except inside a normalizer.
- Do not introduce a global toast system or app-wide error boundary for a single local mutation message.
- Do not add refresh-token retry flow unless there is a confirmed frontend contract for the endpoint and token lifecycle.

## Abstraction Guard

- Do not extract a custom query hook just because a single page has one simple query.
- Do not add a new API client, request wrapper, cache layer, MSW setup, or test harness for speculative future endpoints.
- Prefer extending existing local patterns such as `instance`, `ApiResponse`, `unwrapApiResponse`, and domain query key factories.
- Add abstraction only when it removes repeated API behavior with the same meaning, reduces component coupling to transport details, or matches an established local pattern.
- Keep fixed product copy for simple local failures when the server error detail is not user-actionable.

## Finish Checklist

- Confirm endpoint functions do not bypass the shared API layer without a concrete reason.
- Confirm authenticated queries use an appropriate `enabled` condition.
- Confirm query keys and invalidation targets are stable and scoped.
- Confirm components do not parse raw transport errors.
- Run the most relevant FE check for the touched surface, usually `yarn lint` for API wiring and a focused test/build check when one exists.
