# Nexus AI Bug Fixes

## Bugs Identified
1. **CRITICAL**: Missing `x-api-key` header in Anthropic API calls → 401 Unauthorized
2. **CRITICAL**: CORS violation — direct browser fetch to Anthropic API blocked
3. **MEDIUM**: No fetch timeout — requests hang indefinitely
4. **MEDIUM**: No `res.ok` check — non-JSON errors cause crashes
5. **MEDIUM**: No AbortController — can't cancel in-flight requests
6. **MINOR**: State updates possible on unmounted component

## Fix Steps
- [x] Add API key input field to header
- [x] Add `x-api-key` header to `callAgent()`
- [x] Add fetch timeout + AbortController wrapper
- [x] Add robust error handling (`res.ok`, try/catch)
- [x] Add cleanup flag to prevent state updates after unmount
- [x] Add Demo Mode with simulated responses for testing without API key

## Status
**ALL FIXES COMPLETE** — The code now runs in Demo Mode by default (no API key required).  
For live API usage, users can enter their Anthropic API key and uncheck DEMO.
