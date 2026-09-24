import * as THREE from 'three'

/**
 * Generic Brazil-inspired street-football kit painted onto PlayLiva's own
 * rig in the shader, from bind-pose position (metres, 1.70m tall, facing +Z).
 * No federation, club or manufacturer marks: plain yellow jersey with green
 * trim and a "10", blue shorts with a yellow stripe, white socks with
 * green/yellow hoops, yellow boots with green accents. The castaway's face,
 * beard and skin texture are kept; `_kit.r` marks the derived buzz cut.
 */
export const KIT_COLORS = Object.freeze({
  jersey: '#ffd21f', trim: '#11924a', shorts: '#1f48c9', stripe: '#ffd21f',
  sock: '#f4f4ee', hoopGreen: '#11924a', hoopYellow: '#ffd21f', boot: '#ffd21f', bootAccent: '#0f8a43', sole: '#0d5d31', hair: '#2e2018',
})

function numberTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256; canvas.height = 256
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, 256, 256)
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.font = '900 190px "Arial Black", "Helvetica Neue", Arial, sans-serif'
  ctx.lineJoin = 'round'; ctx.lineWidth = 16; ctx.strokeStyle = '#fff7c8'
  ctx.strokeText('10', 128, 138)
  ctx.fillStyle = '#0f8a43'
  ctx.fillText('10', 128, 138)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

const vec3 = (hex: string) => { const c = new THREE.Color(hex).convertSRGBToLinear(); return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})` }

/** Patches the rig's standard material in place. Returns disposers for owned GPU resources. */
export function applyCraqueKit(material: THREE.MeshStandardMaterial): () => void {
  const decal = numberTexture()
  material.onBeforeCompile = shader => {
    shader.uniforms.uNumber = { value: decal }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec4 _kit;\nvarying vec3 vRest;\nvarying float vHair;\nvarying float vHairline;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRest = position;\nvHair = _kit.x;\nvHairline = _kit.y;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vRest;
varying float vHair;
varying float vHairline;
uniform sampler2D uNumber;
float kitHash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float band(float v, float a, float b) { return step(a, v) * step(v, b); }
vec4 numberAt(vec2 centre, vec2 size, vec2 p) {
  vec2 uv = (p - centre) / size + 0.5;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(0.0);
  return texture2D(uNumber, uv);
}`)
      .replace('#include <map_fragment>', `#include <map_fragment>
{
  vec3 p = vRest;
  float ax = abs(p.x);
  float lum = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11));
  // Keep the sculpted folds: modulate paint by the original texture's shading.
  float fold = clamp(0.62 + lum * 1.05, 0.72, 1.12);
  vec3 paint = vec3(-1.0);
  bool front = p.z > 0.035;
  if (vHair > 0.5) {
    // Short buzz cut: coarse stubble speckle on the crown, fading to skin
    // at the nape and sides like a clipper fade.
    float speck = 0.6 * kitHash(floor(p * 190.0)) + 0.4 * kitHash(floor(p * 420.0));
    vec3 scalp = ${vec3('#a8744f')};
    vec3 hair = mix(scalp, ${vec3(KIT_COLORS.hair)}, 0.62 + 0.38 * speck);
    paint = mix(scalp, hair, 0.25 + 0.75 * smoothstep(0.05, 0.85, vHairline));
    fold = 1.0;
  } else if (p.y > 1.285) {
    // Head, face, beard and neck keep the original texture, except the
    // castaway's low-saturation beige vest collar, which becomes kit trim.
    float sat = diffuseColor.r - diffuseColor.b;
    if (p.y < 1.35 && lum > 0.3 && diffuseColor.g > 0.6 * diffuseColor.r) paint = ${vec3(KIT_COLORS.trim)};
    // Leftover long-hair texture at the nape/behind the ears becomes a clipper fade.
    if (p.z < 0.03 && p.y < 1.47 && lum < 0.16) {
      float speck = kitHash(floor(p * 190.0));
      paint = mix(${vec3('#a8744f')}, ${vec3(KIT_COLORS.hair)}, 0.18 + 0.2 * speck);
      fold = 1.0;
    }
  } else if (p.y > 0.895 && ax < 0.255 && (ax < 0.165 || p.y > 1.135)) {
    // Jersey body + short sleeves (T-pose arms are horizontal at shoulder height).
    float vNeck = 1.205 + 1.35 * ax;
    bool neckSkin = front && p.y > vNeck && ax < 0.075;
    if (neckSkin) {
      // skin inside the V
    } else if ((front && p.y > vNeck - 0.016 && ax < 0.085) || (!front && p.y > 1.262)) {
      paint = ${vec3(KIT_COLORS.trim)};
    } else if (ax > 0.232) {
      paint = ${vec3(KIT_COLORS.trim)};
    } else {
      float weave = 0.965 + 0.035 * sin((p.x + p.y) * 160.0);
      paint = ${vec3(KIT_COLORS.jersey)} * weave;
      vec4 number = front ? numberAt(vec2(0.0, 1.075), vec2(0.15, 0.15), p.xy)
                          : numberAt(vec2(0.0, 1.10), vec2(-0.2, 0.2), p.xy);
      if (ax > 0.165) number = vec4(0.0);
      paint = mix(paint, number.rgb * 0.85, number.a);
    }
  } else if (p.y > 0.515 && p.y <= 0.905) {
    paint = ${vec3(KIT_COLORS.shorts)};
    float legCentre = 0.115;
    float outer = ax - legCentre;
    if (p.y < 0.875 && outer > 0.058 && outer < 0.074) paint = ${vec3(KIT_COLORS.stripe)};
    if (p.y < 0.585) paint *= 0.8; // rolled hem
    if (front && p.x > 0.0) {
      vec4 number = numberAt(vec2(0.085, 0.665), vec2(0.075, 0.075), p.xy);
      paint = mix(paint, vec3(1.0, 0.86, 0.12), number.a * step(0.5, number.g));
    }
  } else if (p.y > 0.125 && p.y <= 0.445) {
    paint = ${vec3(KIT_COLORS.sock)};
    if (band(p.y, 0.392, 0.408) > 0.0 || band(p.y, 0.424, 0.44) > 0.0) paint = ${vec3(KIT_COLORS.hoopGreen)};
    if (band(p.y, 0.408, 0.424) > 0.0) paint = ${vec3(KIT_COLORS.hoopYellow)};
    fold = mix(fold, 1.0, 0.5);
  } else if (p.y <= 0.125) {
    paint = ${vec3(KIT_COLORS.boot)};
    if (p.y < 0.022) paint = ${vec3(KIT_COLORS.sole)};
    else if (p.y > 0.108) paint = ${vec3(KIT_COLORS.bootAccent)};
    else if (p.y > 0.045 && p.y < 0.066 && abs(p.z - 0.05) < 0.07) paint = ${vec3(KIT_COLORS.bootAccent)};
  }
  if (paint.x >= 0.0) diffuseColor.rgb = paint * fold;
}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
if (vHair > 0.5) roughnessFactor = 1.0;`)
      .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>
if (vHair > 0.5) metalnessFactor = 0.0;`)
  }
  material.customProgramCacheKey = () => 'craque-kit-v6'
  material.needsUpdate = true
  return () => decal.dispose()
}
