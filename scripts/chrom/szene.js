// Rendert das Kabel-Motiv als Chrom-Standbild (nur Werkzeug, wird nicht ausgeliefert).
// Parameter über die Adresse: ?b=2880&h=1800&art=hero
import * as THREE from 'three';

const q = new URLSearchParams(location.search);
const B = Number(q.get('b') ?? 2880), H = Number(q.get('h') ?? 1800);
const art = q.get('art') ?? 'hero';

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(B, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.setClearColor(0x000000, 0);
document.body.appendChild(renderer.domElement);

// Studio: heller Raum mit weichen Leuchtflächen, eine kühle blaue und eine dunkle Bahn
function studio() {
  const raum = new THREE.Scene();
  const kugel = new THREE.Mesh(new THREE.SphereGeometry(60, 64, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: 'varying vec3 p; void main(){ p = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `#define NACHT ${art === 'nacht' ? 'true' : 'false'}
      varying vec3 p;
      void main(){
        float y = p.y;
        // Vorn (zur Kamera) liegt die Bühne, die sich in der Mitte der Kabel spiegelt:
        // oben ein helles Lichtband, in der Mitte dunkel, unten ein kühler, heller Boden.
        // Hinten ist alles hell, damit die Ränder in den weißen Seitengrund übergehen.
        float t;
        vec3 vorn = vec3(0.10, 0.11, 0.13);
        vorn = mix(vorn, vec3(0.55, 0.57, 0.60), smoothstep(0.1, 0.5, y));
        vorn = mix(vorn, vec3(1.7), smoothstep(0.62, 0.8, y));
        vorn = mix(vorn, vec3(0.30, 0.34, 0.40), smoothstep(-0.25, -0.45, y));
        vorn = mix(vorn, vec3(0.80, 0.86, 0.95), smoothstep(-0.55, -0.85, y));
        // kühles Blau im Boden statt Regenbogen
        vorn = mix(vorn, vec3(0.40, 0.56, 0.90), smoothstep(-0.4, -0.6, y) * smoothstep(-0.95, -0.7, y) * 0.55);
        vec3 hinten = vec3(1.05, 1.06, 1.08);
        if (NACHT) {
          // dunkle Bühne: nur ein schmales Lichtband oben und ein kühler Schein unten
          vorn = vec3(0.02, 0.03, 0.05);
          vorn = mix(vorn, vec3(1.4), smoothstep(0.66, 0.78, y) * (1.0 - smoothstep(0.86, 0.95, y)));
          vorn = mix(vorn, vec3(0.20, 0.32, 0.60), smoothstep(-0.5, -0.8, y));
          hinten = vec3(0.04, 0.06, 0.10);
        }
        float v = smoothstep(-0.35, 0.35, p.z);
        vec3 c = mix(hinten, vorn, v);
        gl_FragColor = vec4(c, 1.0);
      }`,
  }));
  raum.add(kugel);
  return raum;
}

const szene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
szene.environment = pmrem.fromScene(studio(), 0.0).texture;

const kamera = new THREE.PerspectiveCamera(22, B / H, 10, 10000);
kamera.position.set(0, 0, 2400);

const chrom = new THREE.MeshPhysicalMaterial({ color: 0xf2f4f6, metalness: 1, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.03 });
const blau = new THREE.MeshPhysicalMaterial({ color: 0x2c5fa8, metalness: 0.9, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 });
const huelseMat = new THREE.MeshPhysicalMaterial({ color: 0xe9ecef, metalness: 1, roughness: 0.28, clearcoat: 0.6 });

// Sichtbreite in Weltkoordinaten bei z = 0
const sichtH = 2 * Math.tan(THREE.MathUtils.degToRad(kamera.fov / 2)) * kamera.position.z;
const sichtB = sichtH * (B / H);
const X = (u) => (u - 0.5) * sichtB;   // u: 0 links … 1 rechts
const Y = (v) => (0.5 - v) * sichtH;   // v: 0 oben … 1 unten

const kn = { x: X(0.3), y: Y(0.7) };   // Knoten: Hülse
const r = sichtH * (art === 'nacht' ? 0.022 : 0.04);               // Kabelradius

const straenge = art !== 'klein' ? [
  // Startpunkt rechts (v), Tiefe, Radiusfaktor, blau?
  [0.02, -260, 0.9, false],
  [0.18, 120, 1.0, false],
  [0.36, -60, 0.85, true],
  [0.55, 200, 1.05, false],
  [0.95, -140, 0.95, false],
] : [
  [0.1, -200, 0.9, false],
  [0.35, 150, 1.0, true],
  [0.7, -40, 1.0, false],
];

const buendel = [[0, 1], [1.26, 1], [2.51, 1], [3.77, 1], [5.03, 1]];
straenge.forEach(([v, z, f, istBlau], i) => {
  const [w, rr] = buendel[i % buendel.length];
  const oy = Math.cos(w) * r * 1.35 * rr, oz = Math.sin(w) * r * 1.35 * rr;
  const kurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(X(1.12), Y(v), z),
    new THREE.Vector3(X(0.78), Y(v), z * 0.8),
    new THREE.Vector3(X(0.52), kn.y + oy * 1.5, oz * 2),
    new THREE.Vector3(kn.x + r * 2.5, kn.y + oy, oz),
  );
  szene.add(new THREE.Mesh(new THREE.TubeGeometry(kurve, 400, r * f, 64, false), istBlau ? blau : chrom));
});

// Hülse und die eine Leitung nach links aus dem Bild
const huelse = new THREE.Mesh(new THREE.CylinderGeometry(r * 3.2, r * 3.2, r * 4.5, 96, 1), huelseMat);
huelse.rotation.z = Math.PI / 2;
huelse.position.set(kn.x, kn.y, 0);
szene.add(huelse);
const eins = new THREE.LineCurve3(new THREE.Vector3(X(-0.2), kn.y + r * 0.6, 60), new THREE.Vector3(kn.x - r * 2, kn.y, 0));
szene.add(new THREE.Mesh(new THREE.TubeGeometry(eins, 20, r * 1.7, 96, false), chrom));

renderer.render(szene, kamera);
window.fertig = renderer.domElement.toDataURL('image/png');
