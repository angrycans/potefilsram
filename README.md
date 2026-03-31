# marslife.top monorepo

## Workspace layout

- `apps/web`: React shell + JSON-render style dashboard + Babylon viewport
- `packages/scene-engine`: Babylon scene engine wrapper
- `packages/shared-schema`: UI schema, event protocol, shared types
- `packages/data-client`: API/WebSocket SDK
- `packages/server`: backend starter package
- `packages/third-api`: third-party data integration starter package
- `packages/blog`: blog domain starter package
- `packages/wiki`: wiki domain starter package
- `packages/Forum`: forum domain starter package

## Commands

```bash
npm install
npm run dev:web
npm run typecheck
npm run build
```
