# M5 — PlayLiva Island Crash

Work branch: `codex/m5-island-crash`. Do not integrate into main until the complete
game, browser acceptance, CI and deployment checks in the approved M5 brief pass.

## Checkpoint 1: assets

All eight original GLBs remain byte-for-byte unchanged. `runtime/manifest.json`
records full SHA-256 hashes, exact sizes and clip mappings. Regenerate derivatives
with Node 24.20.0 / pnpm 10.30.3: `pnpm install --frozen-lockfile`, then
`node scripts/crash-assets.mjs`. Sharp 0.35.4 is a development-only image tool.

Every source contains one mesh, one primitive and one material. The two static
base exports have no skeleton or animation and are unsuitable for direct clip
binding. Each animation export embeds a complete rigged mesh and the same two
textures. Within each character, all node hierarchies/rest transforms, skin
weights, geometry, inverse binds and materials match exactly. The generator
asserts this before combining any clips; no retargeting is performed.

One rigged idle model per character is retained, with 28 joints each. Castaway:
25,604 vertices / 20,847 triangles. Kicker: 30,369 vertices / 26,061 triangles.
Animation names are normalized to idle/react/flying/crash and idle/kick. All
substantive source keyframes are unchanged. The duplicate 0.067-second static
export artifact is excluded. Each named motion has distinct animation data.

The duplicated 2K color and 4K packed metallic/roughness PNGs become 2K quality-85
WebP color and 1K lossless WebP material maps. `EXT_texture_webp` explicitly
declares the decoder requirement. Geometry and skin data are preserved; no
Draco/Meshopt decoder or geometry approximation is introduced.

| Payload | Exact bytes |
| --- | ---: |
| Eight source GLBs | 135,344,240 |
| Runtime castaway, all four clips | 3,725,264 |
| Runtime kicker, both clips | 3,762,916 |
| Runtime total | 7,488,180 |

This removes 94.47% of the source payload. Planned initial game-character load:
7,488,180 bytes; deferred character animations: zero (clips are bundled with
their one reusable rig). Ordinary discovery routes load zero character bytes.
Final browser transfers and rendering QA will be recorded after integration;
structural asset validation is not a claim of completed visual QA.

## Continuation

Checkpoint 1 provides optimized assets and preservation/binding tests only.
Next: isolate a Three.js renderer to the three localized Crash routes, reuse
M4 provider/shell, implement and test deterministic round settlement, build the
tropical scene and localized controls, then complete actual browser/mobile QA.
No M5 public route is exposed by checkpoint 1. No main merge is authorized until
all final acceptance conditions are satisfied. Preserve existing discovery,
Sports/LivaSports, locale/GEO and partner attribution behavior.
