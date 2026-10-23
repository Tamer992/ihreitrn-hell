// Rendert breite Chrom-Bänder mit Perlmutt-Schimmer (Werkzeug, wird nicht ausgeliefert).
// Adresse: ?b=1600&h=1000&f=0.0&art=hell|nacht
// f läuft von 0 bis 1 und steuert die Verformung beim Scrollen: Bänder drehen sich zum Wirbel.
import * as THREE from 'three';

const q = new URLSearchParams(location.search);
const B = Number(q.get('b') ?? 1600), H = Number(q.get('h') ?? 1000);
const f = Number(q.get('f') ?? 0);
const nacht = q.get('art') === 'nacht';
const hoch = H > B;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(B, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = nacht ? 0.9 : 1.05;
renderer.setClearColor(0x000000, 0);
document.body.appendChild(renderer.domElement);

// Studio: weiche Leuchtflächen, eine kühle blaue Seite, heller Boden
function studio() {
  const raum = new THREE.Scene();
  raum.add(new THREE.Mesh(new THREE.SphereGeometry(60, 96, 48), new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: 'varying vec3 p; void main(){ p = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `#define NACHT ${nacht}
      varying vec3 p;
      void main(){
        float y = p.y;
        vec3 c;
        if (NACHT) {
          c = vec3(0.015, 0.025, 0.05);
          c += vec3(1.6) * smoothstep(0.72, 0.9, y) * (1.0 - smoothstep(0.9, 1.0, y));
          c += vec3(0.25, 0.45, 1.0) * smoothstep(-0.4, -0.85, y) * 0.9;
          c += vec3(0.9) * smoothstep(0.93, 1.0, dot(p, normalize(vec3(-0.6, 0.3, 0.7))));
        } else {
          vec3 vorn = vec3(0.10, 0.11, 0.13);
          vorn = mix(vorn, vec3(0.60, 0.62, 0.66), smoothstep(0.08, 0.45, y));
          vorn = mix(vorn, vec3(1.8), smoothstep(0.6, 0.78, y));
          vorn = mix(vorn, vec3(0.34, 0.38, 0.46), smoothstep(-0.2, -0.4, y));
          vorn = mix(vorn, vec3(0.86, 0.90, 0.98), smoothstep(-0.5, -0.82, y));
          vorn = mix(vorn, vec3(0.42, 0.58, 0.95), smoothstep(-0.35, -0.55, y) * smoothstep(-0.95, -0.65, y) * 0.6);
          float w = atan(p.y, p.x);
          vec3 hinten = vec3(1.06) + 0.16 * vec3(sin(w * 2.0), sin(w * 2.0 + 2.1), sin(w * 2.0 + 4.2));
          c = mix(hinten, vorn, smoothstep(-0.3, 0.35, p.z));
        }
        gl_FragColor = vec4(c, 1.0);
      }`,
  })));
  return raum;
}

const szene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
szene.environment = pmrem.fromScene(studio(), 0.0).texture;

const kamera = new THREE.PerspectiveCamera(hoch ? 34 : 24, B / H, 10, 20000);
kamera.position.set(0, 0, 3000);
kamera.lookAt(0, 0, 0);

const chrom = new THREE.MeshPhysicalMaterial({
  color: 0xf4f6f9, metalness: 1, roughness: 0.06,
  clearcoat: 1, clearcoatRoughness: 0.04,
  iridescence: 1, iridescenceIOR: 1.4, iridescenceThicknessRange: [250, 700],
  side: THREE.DoubleSide,
});
const blau = chrom.clone();
blau.color = new THREE.Color(0x3b6fc0);
blau.metalness = 0.92;
blau.iridescence = 0.4;

// Ein Band: flacher Querschnitt (abgerundetes Rechteck), entlang einer Kurve, mit Verdrillung
function band(kurve, breite, dicke, drall, segmente = 420, umfang = 72) {
  const rahmen = kurve.computeFrenetFrames(segmente, false);
  const pos = [];
  const index = [];
  for (let i = 0; i <= segmente; i++) {
    const t = i / segmente;
    const p = kurve.getPointAt(t);
    const n = rahmen.normals[i], b = rahmen.binormals[i];
    const w = drall(t);
    // Enden etwas schmaler, damit die Bänder weich auslaufen
    const s = 0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, t * 1.6 + 0.08));
    for (let j = 0; j < umfang; j++) {
      const a = (j / umfang) * Math.PI * 2;
      // Superellipse: flach, mit runden Kanten
      const cx = Math.sign(Math.cos(a)) * Math.pow(Math.abs(Math.cos(a)), 0.35) * breite * s;
      const cy = Math.sign(Math.sin(a)) * Math.pow(Math.abs(Math.sin(a)), 0.35) * dicke;
      const x = cx * Math.cos(w) - cy * Math.sin(w);
      const y = cx * Math.sin(w) + cy * Math.cos(w);
      pos.push(p.x + n.x * x + b.x * y, p.y + n.y * x + b.y * y, p.z + n.z * x + b.z * y);
    }
  }
  for (let i = 0; i < segmente; i++) {
    for (let j = 0; j < umfang; j++) {
      const a = i * umfang + j, b = i * umfang + ((j + 1) % umfang);
      const c = (i + 1) * umfang + j, d = (i + 1) * umfang + ((j + 1) % umfang);
      index.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

const sichtH = 2 * Math.tan(THREE.MathUtils.degToRad(kamera.fov / 2)) * kamera.position.z;
const sichtB = sichtH * (B / H);
const X = (u) => (u - 0.5) * sichtB;
const Y = (v) => (0.5 - v) * sichtH;

// Gebündelte Bänder kommen links herein und fächern sich nach rechts auf.
// Mit f drehen sich die Äste um den Teilungspunkt und ziehen sich zu einem Wirbel zusammen.
const gruppe = new THREE.Group();
szene.add(gruppe);
const einheit = sichtH * (hoch ? 0.065 : 0.082);
const teilung = hoch ? new THREE.Vector3(X(0.28), Y(0.74), 0) : new THREE.Vector3(X(0.34), Y(0.66), 0);
// von unten nach oben, passend zur Reihenfolge im Bündel, damit sich nichts kreuzt
const enden = hoch ? [0.98, 0.55, 0.3, 0.06] : [1.05, 0.62, 0.3, 0.02];
const blauIndex = 1;
const n = enden.length;
const drehen = (v, winkel) => {
  const d = v.clone().sub(teilung);
  const c = Math.cos(winkel), s = Math.sin(winkel);
  return new THREE.Vector3(teilung.x + d.x * c - d.y * s, teilung.y + d.x * s + d.y * c, v.z);
};
enden.forEach((ve, k) => {
  const versatz = (k - (n - 1) / 2) * einheit * 2.3;
  const tiefe = (k % 2 ? -1 : 1) * 140 * (k + 1);
  const winkel = f * (0.9 + k * 0.45);
  const punkte = [
    new THREE.Vector3(X(-0.25), teilung.y + sichtH * 0.1 + versatz * 0.9, tiefe * 0.3),
    new THREE.Vector3(X(0.05), teilung.y + sichtH * 0.03 + versatz, tiefe * 0.5),
    new THREE.Vector3(teilung.x, teilung.y + versatz * 1.05, tiefe),
    drehen(new THREE.Vector3(teilung.x + sichtB * 0.2, teilung.y + (Y(ve) - teilung.y) * 0.35 + versatz, tiefe * 1.5), winkel * 0.6),
    drehen(new THREE.Vector3(teilung.x + sichtB * 0.42, teilung.y + (Y(ve) - teilung.y) * 0.8, tiefe * 2), winkel),
    drehen(new THREE.Vector3(X(1.2), Y(ve), tiefe * 2.5), winkel * 1.15),
  ];
  const kurve = new THREE.CatmullRomCurve3(punkte, false, 'centripetal');
  const drall = (t) => 0.25 * Math.sin(t * Math.PI * 1.2 + k) + f * 1.6 * t * t;
  const g = band(kurve, einheit * (k === blauIndex ? 0.9 : 1), einheit * 0.5, drall, 480, 80);
  gruppe.add(new THREE.Mesh(g, k === blauIndex ? blau : chrom));
});
gruppe.rotation.y = f * 0.25;

renderer.render(szene, kamera);
window.fertig = renderer.domElement.toDataURL('image/png');
