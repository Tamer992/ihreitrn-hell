// 3D-Fassung des Kabel-Motivs (Test, Variante Stahl).
// Die Szene liegt fest hinter der Seite. Sie übernimmt die Lage der SVG-Zeichnung
// (.kabel), damit die Leitung im Ruhezustand genau am Kontaktblock endet,
// und verformt sich beim Scrollen: der Fächer öffnet sich, die Stränge verdrillen
// sich um die Hülse und schwingen aus. Bei „Bewegung reduzieren“ oder ohne WebGL
// bleibt die SVG-Zeichnung stehen.
import {
  WebGLRenderer, Scene, OrthographicCamera, PMREMGenerator, MeshPhysicalMaterial, Mesh,
  TubeGeometry, CylinderGeometry, Curve, Vector3, Color, ACESFilmicToneMapping, DirectionalLight,
  SphereGeometry, BoxGeometry, MeshBasicMaterial, BackSide,
} from 'three';

// Eigene Studio-Umgebung für die Spiegelungen: dunkelgrauer Raum mit hellen Lichtbahnen.
// Erst die harten Wechsel von hell und dunkel lassen das Metall wie gebürsteten Stahl wirken.
function studio(): Scene {
  const raum = new Scene();
  raum.add(new Mesh(new SphereGeometry(50, 32, 16), new MeshBasicMaterial({ color: 0x8f97a0, side: BackSide })));
  const bahnen: [number, number, number, number, number, number, number][] = [
    // x, y, z, breite, höhe, tiefe, helligkeit (unter 0,5 = dunkle Bahn)
    [0, 14, 40, 100, 9, 2, 2.6],
    [0, 2, 40, 100, 5, 2, 0.12],
    [0, -10, 40, 100, 8, 2, 1.1],
    [0, 40, 0, 100, 2, 100, 1.8],
    [0, -40, 0, 100, 2, 100, 0.35],
    [-40, 10, 10, 2, 20, 40, 1.6],
  ];
  for (const [x, y, z, b, h, d, hell] of bahnen) {
    const m = new Mesh(new BoxGeometry(b, h, d), new MeshBasicMaterial({ color: new Color(hell, hell, hell * 1.03) }));
    m.position.set(x, y, z);
    raum.add(m);
  }
  return raum;
}

const leinwand = document.querySelector<HTMLCanvasElement>('canvas.szene');
const vorlage = document.querySelector<SVGSVGElement>('svg.kabel');
const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function webglDa(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

if (leinwand && vorlage && !ruhig && webglDa()) starten(leinwand, vorlage);

function starten(leinwand: HTMLCanvasElement, vorlage: SVGSVGElement) {
  const handy = window.matchMedia('(pointer: coarse)').matches;
  const renderer = new WebGLRenderer({ canvas: leinwand, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, handy ? 1.5 : 2));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);

  const szene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  szene.environment = pmrem.fromScene(studio(), 0.02).texture;
  pmrem.dispose();

  // Streiflicht von oben links für die Lichtkante auf den Kabeln
  const licht = new DirectionalLight(0xffffff, 1.4);
  licht.position.set(-0.4, 1, 0.8);
  szene.add(licht);

  const kamera = new OrthographicCamera(0, 1, 0, -1, -2000, 2000);
  kamera.position.z = 1000;

  const stil = getComputedStyle(document.documentElement);
  const blauWert = stil.getPropertyValue('--blau').trim() || '#234f86';

  const silber = new MeshPhysicalMaterial({
    color: new Color('#e2e6ea'), metalness: 1, roughness: 0.22,
    anisotropy: 0.7, clearcoat: 0.3, clearcoatRoughness: 0.2,
  });
  const blau = new MeshPhysicalMaterial({
    color: new Color(blauWert), metalness: 0.85, roughness: 0.3,
    anisotropy: 0.5, clearcoat: 0.6, clearcoatRoughness: 0.2,
  });
  const huelseMaterial = new MeshPhysicalMaterial({ color: new Color('#eef1f4'), metalness: 1, roughness: 0.35, anisotropy: 0.4 });

  // Gleiche Startpunkte wie die SVG-Fassung (Benutzereinheiten 1000 × 600)
  const N = 7;
  const ZIEL_Y = 440;
  const starts = Array.from({ length: N }, (_, i) => 70 + 490 * Math.pow(i / (N - 1), 1.15));
  const BLAU_INDEX = 3;
  // Bündel in der Hülse: einer in der Mitte, sechs im Kreis (Abstand in Pixeln, wird skaliert)
  const buendel = Array.from({ length: N }, (_, i) => {
    if (i === BLAU_INDEX) return { w: 0, r: 0 };
    const k = i < BLAU_INDEX ? i : i - 1;
    return { w: (k / 6) * Math.PI * 2 + 0.3, r: 1 };
  });

  class Strang extends Curve<Vector3> {
    p0 = new Vector3(); p1 = new Vector3(); p2 = new Vector3(); p3 = new Vector3();
    welle = 0; phase = 0; frequenz = 2.2;
    getPoint(t: number, ziel = new Vector3()) {
      const u = 1 - t;
      ziel.set(0, 0, 0)
        .addScaledVector(this.p0, u * u * u)
        .addScaledVector(this.p1, 3 * u * u * t)
        .addScaledVector(this.p2, 3 * u * t * t)
        .addScaledVector(this.p3, t * t * t);
      // Ausschwingen: an den freien Enden stark, an der Hülse null
      const huelle = Math.pow(1 - t, 1.6);
      const s = Math.sin(t * Math.PI * this.frequenz + this.phase) * this.welle * huelle;
      ziel.y += s;
      ziel.z += Math.cos(t * Math.PI * this.frequenz * 0.8 + this.phase) * this.welle * 0.8 * huelle;
      return ziel;
    }
  }

  const straenge = Array.from({ length: N }, () => new Strang());
  const strangMeshes = straenge.map((_, i) => {
    const m = new Mesh(undefined, i === BLAU_INDEX ? blau : silber);
    szene.add(m);
    return m;
  });
  const leitung = new Mesh(undefined, blau);
  szene.add(leitung);
  const huelse = new Mesh(new CylinderGeometry(1, 1, 1, 32, 1), huelseMaterial);
  huelse.rotation.z = Math.PI / 2;
  szene.add(huelse);

  document.documentElement.classList.add('gl');

  let breite = 0, hoehe = 0;
  function groesse() {
    breite = window.innerWidth;
    hoehe = window.innerHeight;
    renderer.setSize(breite, hoehe, false);
    kamera.left = 0; kamera.right = breite; kamera.top = 0; kamera.bottom = -hoehe;
    kamera.updateProjectionMatrix();
  }
  groesse();

  // Weiche Werte, damit die Verformung dem Scrollen nachgleitet statt zu ruckeln
  let s = 0;
  let einlauf = 0;
  const startZeit = performance.now();
  const segmente = handy ? 90 : 150;

  function weich(x: number) { return 1 - Math.pow(1 - x, 3); }

  function bauen() {
    const r = vorlage.getBoundingClientRect();
    const sx = r.width / 1000, sy = r.height / 600;
    const px = (u: number) => r.left + u * sx;
    const py = (v: number) => -(r.top + v * sy);
    const radius = Math.max(3, Math.min(9, 9 * sy / 0.9));
    const e = weich(einlauf);

    // Verformung über die Scrolltiefe (s: 0 oben, 1 nach einer Bildschirmhöhe)
    // Beim Laden drehen sich die Stränge aus einem verdrillten Bündel in die Ruhelage
    const facher = 1 + 2.4 * s - 0.35 * (1 - e);
    const drall = 4.5 * s + 3.2 * (1 - e);
    const welle = 190 * s * sy + 60 * (1 - e) * sy;
    const zielU = 430 + 220 * s;
    const huelseLaenge = 46 * sx;
    const abstand = radius * 2.1;

    const jx = px(zielU), jy = py(ZIEL_Y);

    straenge.forEach((st, i) => {
      const b = buendel[i];
      const oy = Math.cos(b.w + drall) * abstand * b.r;
      const oz = Math.sin(b.w + drall) * abstand * b.r;
      const startV = ZIEL_Y + (starts[i] - ZIEL_Y) * facher;
      const rein = (1 - e) * 650;
      st.p0.set(px(1060 + rein), py(startV), (i - 3) * 90 * s);
      st.p1.set(px(1000 - 300 * (0.7 + 0.05 * ((i * 7) % 5)) + rein), py(startV - 120 * s * (i - 3) / 3), (i - 3) * 160 * s);
      st.p2.set(px(zielU + 300 * (0.55 + 0.04 * ((i * 3) % 4))) + rein * 0.4 * sx, jy + oy, oz);
      st.p3.set(jx - huelseLaenge * 0.3, jy + oy, oz);
      st.welle = welle * (0.6 + 0.4 * ((i * 5) % 3) / 2);
      st.phase = i * 0.9 + s * 3.2;
      strangMeshes[i].geometry?.dispose();
      strangMeshes[i].geometry = new TubeGeometry(st, segmente, radius, handy ? 10 : 14, false);
    });

    // Eine Leitung von der Hülse bis an den Kontaktblock
    const ende = new (class extends Curve<Vector3> {
      getPoint(t: number, ziel = new Vector3()) {
        return ziel.set(px(-20) + (jx - huelseLaenge * 0.5 - px(-20)) * t, jy, 0);
      }
    })();
    leitung.geometry?.dispose();
    leitung.geometry = new TubeGeometry(ende, 8, radius * 1.45, 16, false);

    const huelseRadius = abstand + radius * 1.35;
    huelse.position.set(jx, jy, 0);
    huelse.scale.set(huelseRadius, huelseLaenge, huelseRadius);
    huelse.rotation.x = drall;

    // Ausblenden, sobald der Kopfbereich nach oben verschwindet
    const kopf = document.querySelector('.start')?.getBoundingClientRect();
    if (kopf) {
      const rest = (kopf.bottom - hoehe * 0.05) / (hoehe * 0.3);
      leinwand.style.opacity = String(Math.max(0, Math.min(1, rest)));
    }
  }

  let laeuft = false;
  function bild() {
    const ziel = Math.min(1.6, window.scrollY / (hoehe * 0.8));
    s += (ziel - s) * 0.12;
    einlauf = Math.min(1, (performance.now() - startZeit) / 1600);
    bauen();
    renderer.render(szene, kamera);
    if (Math.abs(ziel - s) > 0.0005 || einlauf < 1) {
      requestAnimationFrame(bild);
    } else {
      laeuft = false;
    }
  }
  function anstossen() {
    if (!laeuft) {
      laeuft = true;
      requestAnimationFrame(bild);
    }
  }

  window.addEventListener('resize', () => { groesse(); anstossen(); }, { passive: true });
  window.addEventListener('scroll', anstossen, { passive: true });
  anstossen();
}
