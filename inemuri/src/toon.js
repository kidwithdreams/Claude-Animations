// Comic toon look: 3-tone shading + ink outlines found from depth and normal edges.
import * as THREE from 'three';

let _grad = null;
function gradient() {
  if (_grad) return _grad;
  const d = new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]);
  _grad = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat);
  _grad.minFilter = _grad.magFilter = THREE.NearestFilter; _grad.needsUpdate = true;
  return _grad;
}
const cache = new Map();
export function toon(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!opts.unique && cache.has(key)) return cache.get(key);
  const m = new THREE.MeshToonMaterial({ color, gradientMap: gradient(), ...Object.fromEntries(Object.entries(opts).filter(([k]) => k !== 'unique')) });
  if (!opts.unique) cache.set(key, m);
  return m;
}

// renders scene -> color + normal/depth, then composites ink lines
export class InkRenderer {
  constructor(renderer, W, H, { thick = 2.2, ink = 0x1a1a22 } = {}) {
    this.r = renderer; this.W = W; this.H = H;
    this.color = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType });
    this.normal = new THREE.WebGLRenderTarget(W, H, { depthTexture: new THREE.DepthTexture(W, H), type: THREE.HalfFloatType });
    this.normalMat = new THREE.MeshNormalMaterial();
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: {
        tColor: { value: this.color.texture }, tNormal: { value: this.normal.texture }, tDepth: { value: this.normal.depthTexture },
        uPx: { value: new THREE.Vector2(thick / W, thick / H) }, uNear: { value: 0.05 }, uFar: { value: 100 }, uInk: { value: new THREE.Color(ink) },
        uTime: { value: 0 },
      },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`,
      fragmentShader: `
        uniform sampler2D tColor, tNormal, tDepth; uniform vec2 uPx; uniform float uNear, uFar, uTime; uniform vec3 uInk; varying vec2 vUv;
        float lin(float d){ float z = d*2.0-1.0; return 2.0*uNear*uFar/(uFar+uNear - z*(uFar-uNear)); }
        float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + uTime) * 43758.5453); }
        void main(){
          vec3 c = texture2D(tColor, vUv).rgb;
          float d0 = lin(texture2D(tDepth, vUv).r);
          vec3 n0 = texture2D(tNormal, vUv).rgb;
          float e = 0.0;
          for (int i = 0; i < 8; i++) {
            float a = float(i) * 0.785398;
            vec2 o = vec2(cos(a), sin(a)) * uPx;
            float d = lin(texture2D(tDepth, vUv + o).r);
            vec3 n = texture2D(tNormal, vUv + o).rgb;
            e = max(e, smoothstep(0.035, 0.08, abs(d - d0) / max(d0, 0.001)));
            e = max(e, smoothstep(0.25, 0.45, length(n - n0)));
          }
          c = mix(c, uInk, e * 0.95);
          c += (h(vUv * 900.0) - 0.5) * 0.02;   // a little paper grain
          gl_FragColor = vec4(c, 1.0);
          #include <colorspace_fragment>
        }`,
      depthTest: false, depthWrite: false,
    }));
    this.qScene = new THREE.Scene(); this.qScene.add(this.quad);
    this.qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }
  render(scene, camera, t = 0) {
    const r = this.r;
    const u = this.quad.material.uniforms; u.uNear.value = camera.near; u.uFar.value = camera.far; u.uTime.value = t;
    // normals + depth (sprites and lines are left out of the ink pass)
    const hidden = [];
    scene.traverse(o => { if ((o.isSprite || o.isPoints || o.userData.noInk) && o.visible) { o.visible = false; hidden.push(o); } });
    const bg = scene.background; scene.background = null;
    scene.overrideMaterial = this.normalMat;
    r.setRenderTarget(this.normal); r.setClearColor(0x000000, 1); r.clear(); r.render(scene, camera);
    scene.overrideMaterial = null; scene.background = bg;
    hidden.forEach(o => { o.visible = true; });
    r.setRenderTarget(this.color); r.clear(); r.render(scene, camera);
    r.setRenderTarget(null); r.render(this.qScene, this.qCam);
  }
}
