// Vértice Cargas · o mundo logístico em 3D.
// Tudo é construído em código: porto, navio, guindastes, pátio de contêineres,
// rodovia com caminhões, centro de distribuição e o ciclo do dia para a noite.
import * as THREE from "three";

const canvas = document.getElementById("mundo");
const celular = matchMedia("(max-width: 760px)").matches;
const reduzir = matchMedia("(prefers-reduced-motion: reduce)").matches;
const pronto = () => document.documentElement.classList.add("pronto");

const C = {
  tinta: 0x12202b, petroleo: 0x1f4e5a, cobre: 0xc8693a, mostarda: 0xd9a441,
  salvia: 0x7e9c8a, areia: 0xe9dcc6, marfim: 0xf5efe4,
};

/* ── Sorteio com semente: o mundo é sempre igual ──────────────────────── */
let semente = 20261124;
const rnd = () => { semente |= 0; semente = (semente + 0x6d2b79f5) | 0; let t = Math.imul(semente ^ (semente >>> 15), 1 | semente); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const entre = (a, b) => a + (b - a) * rnd();
const escolha = (arr) => arr[Math.floor(rnd() * arr.length)];

/* ── Renderizador, cena, câmera ───────────────────────────────────────── */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !celular, powerPreference: "high-performance" });
} catch (e) { pronto(); throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, celular ? 1.5 : 1.75));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = !celular;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const cena = new THREE.Scene();
cena.fog = new THREE.Fog(0xf1d6ae, 170, 560);
const camera = new THREE.PerspectiveCamera(celular ? 58 : 40, 1, 1, 1600);

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0.05, flatShading: true, ...o });
const caixa = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const malha = (geo, m, x = 0, y = 0, z = 0, sombra = true) => {
  const me = new THREE.Mesh(geo, m); me.position.set(x, y, z);
  me.castShadow = sombra; me.receiveShadow = true; return me;
};
// Barra entre dois pontos (treliças e cabos)
const barra = (a, b, esp, m) => {
  const d = new THREE.Vector3().subVectors(b, a); const L = d.length();
  const me = malha(caixa(esp, L, esp), m);
  me.position.copy(a).addScaledVector(d, 0.5);
  me.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return me;
};

/* ── Marca pintada nas laterais dos baús ──────────────────────────────── */
try { await Promise.race([Promise.all([document.fonts.load('600 120px "Instrument Sans"'), document.fonts.load('italic 300 120px "Fraunces"')]), new Promise((r) => setTimeout(r, 2500))]); } catch (e) {}
function texturaMarca(corTexto, corMarca) {
  const cv = document.createElement("canvas"); cv.width = 1024; cv.height = 256;
  const x = cv.getContext("2d");
  // Vértice (o símbolo)
  x.strokeStyle = corMarca; x.lineWidth = 17; x.lineJoin = "miter";
  x.beginPath(); x.moveTo(40, 206); x.lineTo(130, 56); x.lineTo(220, 206); x.stroke();
  x.beginPath(); x.moveTo(85, 206); x.lineTo(130, 133); x.lineTo(175, 206); x.stroke();
  // Nome
  x.fillStyle = corTexto; x.textBaseline = "alphabetic";
  x.font = '600 104px "Instrument Sans", system-ui, sans-serif';
  if ("letterSpacing" in x) x.letterSpacing = "14px";
  x.fillText("VÉRTICE", 262, 160);
  if ("letterSpacing" in x) x.letterSpacing = "0px";
  x.fillStyle = corMarca; x.font = 'italic 300 64px "Fraunces", Georgia, serif';
  x.fillText("Cargas", 266, 222);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
const geoMarca = new THREE.PlaneGeometry(8.4, 2.1);
const matMarcaClara = new THREE.MeshStandardMaterial({ map: texturaMarca("#F5EFE4", "#D9A441"), transparent: true, roughness: 0.8 });
const matMarcaEscura = new THREE.MeshStandardMaterial({ map: texturaMarca("#12202B", "#C8693A"), transparent: true, roughness: 0.8 });
const BAU_ESCURO = new Set([0x1f4e5a, 0xc8693a, 0x12202b]);
// Adiciona a marca nos dois lados de um baú de 2,6 m de largura (comprimento ao longo de z)
function pintar(grupo, corBau, y, z) {
  const m = BAU_ESCURO.has(corBau) ? matMarcaClara : matMarcaEscura;
  for (const lado of [1, -1]) {
    const pl = new THREE.Mesh(geoMarca, m);
    pl.position.set(1.315 * lado, y, z); pl.rotation.y = (Math.PI / 2) * lado;
    grupo.add(pl);
  }
}

// Cabine: símbolo + nome na porta e nome na frente, acima da grade
function texturaCabine(corTexto, corMarca) {
  const cv = document.createElement("canvas"); cv.width = 512; cv.height = 320;
  const x = cv.getContext("2d");
  x.strokeStyle = corMarca; x.lineWidth = 14;
  x.beginPath(); x.moveTo(186, 170); x.lineTo(256, 50); x.lineTo(326, 170); x.stroke();
  x.beginPath(); x.moveTo(221, 170); x.lineTo(256, 112); x.lineTo(291, 170); x.stroke();
  x.fillStyle = corTexto; x.textAlign = "center";
  x.font = '600 84px "Instrument Sans", system-ui, sans-serif';
  if ("letterSpacing" in x) x.letterSpacing = "10px";
  x.fillText("VÉRTICE", 262, 272);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function texturaFrente(corTexto) {
  const cv = document.createElement("canvas"); cv.width = 512; cv.height = 112;
  const x = cv.getContext("2d");
  x.fillStyle = corTexto; x.textAlign = "center"; x.textBaseline = "middle";
  x.font = '600 80px "Instrument Sans", system-ui, sans-serif';
  if ("letterSpacing" in x) x.letterSpacing = "16px";
  x.fillText("VÉRTICE", 264, 60);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const geoPorta = new THREE.PlaneGeometry(1.9, 1.19), geoFrente = new THREE.PlaneGeometry(2.1, 0.46);
const cabEscura = { porta: new THREE.MeshStandardMaterial({ map: texturaCabine("#F5EFE4", "#D9A441"), transparent: true }), frente: new THREE.MeshStandardMaterial({ map: texturaFrente("#F5EFE4"), transparent: true }) };
const cabClara = { porta: new THREE.MeshStandardMaterial({ map: texturaCabine("#12202B", "#C8693A"), transparent: true }), frente: new THREE.MeshStandardMaterial({ map: texturaFrente("#12202B"), transparent: true }) };
function pintarCabine(grupo, corCab) {
  const m = BAU_ESCURO.has(corCab) ? cabEscura : cabClara;
  for (const lado of [1, -1]) {
    const pl = new THREE.Mesh(geoPorta, m.porta);
    pl.position.set(1.265 * lado, 2.05, 5.3); pl.rotation.y = (Math.PI / 2) * lado; grupo.add(pl);
  }
  const fr = new THREE.Mesh(geoFrente, m.frente); fr.position.set(0, 2.05, 6.615); grupo.add(fr);
}

/* ── Luz e céu ────────────────────────────────────────────────────────── */
const hemi = new THREE.HemisphereLight(0xfff0dc, 0x5f7a70, 0.9);
cena.add(hemi);
const sol = new THREE.DirectionalLight(0xffd3a1, 2.4);
sol.castShadow = !celular;
sol.shadow.mapSize.set(2048, 2048);
Object.assign(sol.shadow.camera, { left: -190, right: 190, top: 190, bottom: -190, near: 10, far: 700 });
sol.shadow.bias = -0.0005;
cena.add(sol, sol.target);

const ceuMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: {
    topo: { value: new THREE.Color() }, horizonte: { value: new THREE.Color() },
    dirSol: { value: new THREE.Vector3() }, corSol: { value: new THREE.Color(0xffd29a) }, forcaSol: { value: 1 },
  },
  vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
  fragmentShader: `uniform vec3 topo, horizonte, dirSol, corSol; uniform float forcaSol; varying vec3 vP;
    void main(){ float h = clamp(vP.y*1.6+0.08,0.,1.); vec3 c = mix(horizonte, topo, pow(h,.7));
      float s = max(dot(vP, normalize(dirSol)),0.);
      c += corSol * (pow(s,900.)*2.2 + pow(s,24.)*.35) * forcaSol;
      gl_FragColor = vec4(c,1.); }`,
});
const ceu = new THREE.Mesh(new THREE.SphereGeometry(1200, 32, 16), ceuMat);
cena.add(ceu);

/* ── Chão, água, cais ─────────────────────────────────────────────────── */
const chao = malha(new THREE.PlaneGeometry(560, 900), mat(0xd8ceb2), 214, 0, 0, false);
chao.rotation.x = -Math.PI / 2; cena.add(chao);
const agua = malha(new THREE.PlaneGeometry(900, 900), mat(C.petroleo, { roughness: 0.22, metalness: 0.35, flatShading: false }), -516, -1.4, 0, false);
agua.rotation.x = -Math.PI / 2; cena.add(agua);
cena.add(malha(caixa(10, 1.6, 900), mat(0xbcae96), -61, -0.75, 0, false));          // borda do cais
cena.add(malha(caixa(30, 0.12, 170), mat(0xb9ab92), -51, 0.06, 0, false));            // piso do porto
// Cabeços de amarração
for (let z = -70; z <= 70; z += 14) cena.add(malha(new THREE.CylinderGeometry(0.5, 0.6, 1, 8), mat(C.tinta), -64.5, 0.5, z));

// Reflexos de luz na água (faixas que tremulam)
const brilhos = new THREE.InstancedMesh(caixa(1, 0.02, 1), new THREE.MeshBasicMaterial({ color: 0xffe2b0, transparent: true, opacity: 0.55, fog: true }), 140);
const brilhoDados = [];
{ const o = new THREE.Object3D();
  for (let k = 0; k < 140; k++) { const d = { x: entre(-330, -70), z: entre(-260, 260), w: entre(2, 9), f: rnd() * 6 }; brilhoDados.push(d);
    o.position.set(d.x, -1.3, d.z); o.scale.set(d.w, 1, 0.35); o.updateMatrix(); brilhos.setMatrixAt(k, o.matrix); } }
cena.add(brilhos);

/* ── Pátio de contêineres (instanciado) ───────────────────────────────── */
const coresConteiner = [C.cobre, C.petroleo, C.mostarda, C.salvia, C.areia, 0x9c4a2a, 0x2f6b78, C.cobre];
{
  const pos = [];
  for (let x = -50; x <= -36; x += 2.8) for (let z = -74; z <= 74; z += 6.6) {
    if (Math.abs(z) < 7 || Math.round((z + 74) / 6.6) % 5 === 4) continue; // ruas internas
    const alt = 1 + Math.floor(rnd() * (Math.abs(z) > 50 ? 2 : 4));
    for (let k = 0; k < alt; k++) pos.push([x, 1.3 + k * 2.62, z]);
  }
  const conts = new THREE.InstancedMesh(caixa(2.45, 2.6, 6.1), mat(0xffffff), pos.length);
  const o = new THREE.Object3D(), cor = new THREE.Color();
  pos.forEach((p, k) => { o.position.set(...p); o.updateMatrix(); conts.setMatrixAt(k, o.matrix); conts.setColorAt(k, cor.setHex(escolha(coresConteiner))); });
  conts.castShadow = conts.receiveShadow = true; cena.add(conts);
}

/* ── Guindastes de cais (animados) ────────────────────────────────────── */
const guindastes = [];
const matGuind = mat(C.cobre), matCasa = mat(C.marfim), matCabo = mat(C.tinta);
function guindaste(z, fase) {
  const g = new THREE.Group();
  const v = (x, y, zz) => new THREE.Vector3(x, y, zz);
  for (const x of [-55, -66]) for (const dz of [-4.5, 4.5]) g.add(malha(caixa(1.3, 27, 1.3), matGuind, x, 13.5, dz));
  for (const dz of [-4.5, 4.5]) {
    g.add(malha(caixa(52, 1.7, 1.2), matGuind, -77, 27, dz));              // lança sobre a água
    g.add(barra(v(-55, 2, dz), v(-66, 25, dz), 0.6, matGuind));             // contraventamento
    g.add(barra(v(-60.5, 40, dz * 0.6), v(-100, 27.8, dz), 0.35, matCabo)); // estais
    g.add(barra(v(-60.5, 40, dz * 0.6), v(-52, 27.8, dz), 0.35, matCabo));
    g.add(barra(v(-60.5, 27, dz), v(-60.5, 40, dz * 0.6), 1, matGuind));     // torre em A
  }
  for (const x of [-55, -66]) g.add(malha(caixa(1.3, 1.8, 10.3), matGuind, x, 27, 0));
  g.add(malha(caixa(7, 4.5, 8), matCasa, -50, 29.5, 0));
  const carro = malha(caixa(3.2, 2, 8.6), matCasa, -70, 25.4, 0); g.add(carro);
  const cabo = malha(caixa(0.18, 1, 0.18), matCabo, -70, 20, 0); g.add(cabo);
  const carga = malha(caixa(2.45, 2.6, 6.1), mat(escolha(coresConteiner)), -70, 14, 0); g.add(carga);
  g.position.z = z; cena.add(g);
  guindastes.push({ carro, cabo, carga, fase });
}
guindaste(-34, 0); guindaste(-6, 2.1); guindaste(24, 4.2);

/* ── Navio porta-contêineres ──────────────────────────────────────────── */
const navio = new THREE.Group();
{
  navio.add(malha(caixa(17, 8, 96), mat(C.tinta), 0, 1.6, 0));
  navio.add(malha(caixa(17.3, 1.4, 96.3), mat(C.cobre), 0, -1.6, 0, false));
  const proa = malha(caixa(12, 8, 12), mat(C.tinta), 0, 1.6, 48); proa.rotation.y = Math.PI / 4; proa.scale.set(1, 1, 1); navio.add(proa);
  navio.add(malha(caixa(15, 11, 9), mat(C.marfim), 0, 11, -40));
  navio.add(malha(caixa(15.3, 1.3, 9.3), mat(C.tinta), 0, 14, -40));
  navio.add(malha(caixa(4, 6, 4), mat(C.cobre), 0, 18, -45));
  const pos = [];
  for (let x = -6; x <= 6; x += 2.55) for (let z = -30; z <= 40; z += 6.5) {
    const alt = 1 + Math.floor(rnd() * 4);
    for (let k = 0; k < alt; k++) pos.push([x, 7 + k * 2.62, z]);
  }
  const conts = new THREE.InstancedMesh(caixa(2.45, 2.6, 6.1), mat(0xffffff), pos.length);
  const o = new THREE.Object3D(), cor = new THREE.Color();
  pos.forEach((p, k) => { o.position.set(...p); o.updateMatrix(); conts.setMatrixAt(k, o.matrix); conts.setColorAt(k, cor.setHex(escolha(coresConteiner))); });
  conts.castShadow = true; navio.add(conts);
  navio.position.set(-84, 0, -4); cena.add(navio);
}

/* ── Estradas ─────────────────────────────────────────────────────────── */
const anel = new THREE.CatmullRomCurve3([
  [-26, 0, -42], [-26, 0, 42], [2, 0, 64], [44, 0, 72], [88, 0, 52], [112, 0, 12],
  [98, 0, -36], [56, 0, -62], [10, 0, -64], [-18, 0, -58],
].map((p) => new THREE.Vector3(...p)), true, "catmullrom", 0.5);
const rodovia = new THREE.CatmullRomCurve3([
  [112, 0, 12], [170, 0, 18], [240, 0, 14], [330, 0, 30], [460, 0, 26], [620, 0, 40],
].map((p) => new THREE.Vector3(...p)));

function fita(curva, largura, y, m, n) {
  const pos = [], idx = [];
  for (let k = 0; k <= n; k++) {
    const u = k / n, p = curva.getPointAt(u), t = curva.getTangentAt(u);
    const nx = -t.z, nz = t.x;
    pos.push(p.x + nx * largura / 2, y, p.z + nz * largura / 2, p.x - nx * largura / 2, y, p.z - nz * largura / 2);
    if (k < n) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const me = new THREE.Mesh(g, m); me.receiveShadow = true; m.side = THREE.DoubleSide; return me;
}
function faixas(curva, passo, cor) {
  const L = curva.getLength(), n = Math.floor(L / passo);
  const im = new THREE.InstancedMesh(caixa(0.35, 0.05, 2.6), new THREE.MeshBasicMaterial({ color: cor }), n);
  const o = new THREE.Object3D();
  for (let k = 0; k < n; k++) { const u = k / n; const p = curva.getPointAt(u), t = curva.getTangentAt(u);
    o.position.set(p.x, 0.2, p.z); o.rotation.set(0, Math.atan2(t.x, t.z), 0); o.updateMatrix(); im.setMatrixAt(k, o.matrix); }
  return im;
}
const matAsfalto = mat(0x3a4349, { roughness: 0.95 });
cena.add(fita(anel, 12, 0.08, mat(0xbfae8c), 300), fita(anel, 9.5, 0.12, matAsfalto, 300), faixas(anel, 7, C.mostarda));
cena.add(fita(rodovia, 14, 0.08, mat(0xbfae8c), 200), fita(rodovia, 11.5, 0.12, matAsfalto, 200), faixas(rodovia, 8, 0xf5efe4));

/* ── Centro de distribuição ───────────────────────────────────────────── */
const matJanela = new THREE.MeshStandardMaterial({ color: 0x2a2a28, emissive: C.mostarda, emissiveIntensity: 0 });
{
  const cd = new THREE.Group();
  cd.add(malha(caixa(64, 0.14, 46), mat(0xc4b393), 0, 0.07, 6, false));
  cd.add(malha(caixa(48, 10, 26), mat(C.marfim), 0, 5, 0));
  cd.add(malha(caixa(48.3, 1.4, 26.3), mat(C.cobre), 0, 9.4, 0));
  // Telhado em shed (dente de serra)
  const s = new THREE.Shape(); s.moveTo(-24, 0);
  for (let k = 0; k < 6; k++) { const x0 = -24 + k * 8; s.lineTo(x0, 3.4); s.lineTo(x0 + 8, 0); }
  s.lineTo(-24, 0);
  const tel = new THREE.ExtrudeGeometry(s, { depth: 26, bevelEnabled: false }); tel.translate(0, 0, -13);
  cd.add(malha(tel, mat(C.petroleo), 0, 10, 0));
  cd.add(malha(caixa(46, 1.1, 0.2), matJanela, 0, 7.6, 13.12, false));
  cd.add(malha(caixa(46, 1.1, 0.2), matJanela, 0, 7.6, -13.12, false));
  for (let x = -20; x <= 20; x += 5) {
    cd.add(malha(caixa(3.4, 4, 0.3), matJanela, x, 2.2, 13.15, false));
    cd.add(malha(caixa(4.4, 0.4, 2), mat(C.tinta), x, 4.5, 14, false));
  }
  // Carretas encostadas nas docas
  for (const x of [-15, -5, 10, 20]) {
    const cor = escolha([C.areia, C.marfim, C.petroleo]);
    const c = malha(caixa(2.6, 3.4, 10), mat(cor), x, 2.4, 19.5);
    cd.add(c);
    const lado = new THREE.Group(); lado.position.set(x, 0, 0); pintar(lado, cor, 2.5, 19.5); cd.add(lado);
  }
  // Marca no telhado: o vértice
  const marca = new THREE.Shape(); marca.moveTo(-6, 0); marca.lineTo(0, 9); marca.lineTo(6, 0); marca.lineTo(3.6, 0); marca.lineTo(0, 5.4); marca.lineTo(-3.6, 0);
  const mm = malha(new THREE.ShapeGeometry(marca), new THREE.MeshBasicMaterial({ color: C.cobre, side: THREE.DoubleSide }), 0, 10.1, -4, false);
  mm.rotation.x = -Math.PI / 2; mm.scale.setScalar(0.9);
  cd.add(mm);
  cd.position.set(50, 0, 6); cena.add(cd);
}

/* ── Postes de iluminação ─────────────────────────────────────────────── */
const matLampada = new THREE.MeshStandardMaterial({ color: 0x555049, emissive: 0xffc46b, emissiveIntensity: 0 });
{
  const pts = [];
  const add = (curva, passo, lado) => { const L = curva.getLength(); for (let d = 0; d < L; d += passo) { const u = d / L, p = curva.getPointAt(u), t = curva.getTangentAt(u); pts.push([p.x - t.z * lado, p.z + t.x * lado]); } };
  add(anel, 16, 8); add(rodovia, 22, 9.5); add(rodovia, 22, -9.5);
  const postes = new THREE.InstancedMesh(caixa(0.3, 7, 0.3), mat(C.tinta), pts.length);
  const lamp = new THREE.InstancedMesh(caixa(1.1, 0.35, 1.1), matLampada, pts.length);
  const o = new THREE.Object3D();
  pts.forEach(([x, z], k) => { o.position.set(x, 3.5, z); o.updateMatrix(); postes.setMatrixAt(k, o.matrix); o.position.y = 7.1; o.updateMatrix(); lamp.setMatrixAt(k, o.matrix); });
  cena.add(postes, lamp);
}

/* ── Vegetação e morros ───────────────────────────────────────────────── */
{
  const amostras = [...anel.getSpacedPoints(120), ...rodovia.getSpacedPoints(120)];
  const livre = (x, z) => {
    if (x < -30) return false;
    if (x > 20 && x < 84 && z > -20 && z < 34) return false; // CD
    for (const p of amostras) if ((p.x - x) ** 2 + (p.z - z) ** 2 < 120) return false;
    return true;
  };
  const n = celular ? 170 : 320, pos = [];
  let tent = 0;
  while (pos.length < n && tent++ < 6000) { const x = entre(-28, 340), z = entre(-200, 220); if (livre(x, z)) pos.push([x, z, entre(0.7, 1.4)]); }
  const copa = new THREE.InstancedMesh(new THREE.ConeGeometry(2.2, 6.5, 6), mat(0xffffff), pos.length);
  const tronco = new THREE.InstancedMesh(caixa(0.5, 1.6, 0.5), mat(0x5a4636), pos.length);
  const o = new THREE.Object3D(), cor = new THREE.Color();
  pos.forEach(([x, z, s], k) => {
    o.position.set(x, 0.8 * s, z); o.scale.setScalar(s); o.updateMatrix(); tronco.setMatrixAt(k, o.matrix);
    o.position.y = (1.6 + 3.25) * s; o.updateMatrix(); copa.setMatrixAt(k, o.matrix);
    copa.setColorAt(k, cor.setHex(escolha([C.salvia, 0x5e7d6b, 0x6f8e7c, 0x8fa593])));
  });
  copa.castShadow = true; cena.add(copa, tronco);
  const morro = new THREE.SphereGeometry(1, 12, 8);
  [[260, -170, 90, 26, 60], [380, 140, 120, 34, 70], [170, 240, 110, 22, 60], [470, -40, 90, 30, 80], [40, -230, 130, 20, 50]]
    .forEach(([x, z, sx, sy, sz], k) => { const m = malha(morro, mat(k % 2 ? 0x8fa593 : 0x6f8e7c), x, -4, z, false); m.scale.set(sx, sy, sz); cena.add(m); });
}

/* ── Lavouras em volta (talhões em tons da paleta) ───────────────────── */
{
  const talhoes = [];
  for (let k = 0; k < 46; k++) {
    const x = entre(130, 420), z = entre(-260, 260);
    if (Math.abs(z - 22) < 26) continue; // margem da rodovia
    talhoes.push([x, z, entre(30, 70), entre(24, 60), entre(-0.25, 0.25)]);
  }
  const im = new THREE.InstancedMesh(caixa(1, 0.1, 1), mat(0xffffff, { roughness: 1 }), talhoes.length);
  const o = new THREE.Object3D(), cor = new THREE.Color();
  talhoes.forEach(([x, z, w, d, r], k) => { o.position.set(x, 0.05, z); o.rotation.set(0, r, 0); o.scale.set(w, 1, d); o.updateMatrix(); im.setMatrixAt(k, o.matrix);
    im.setColorAt(k, cor.setHex(escolha([0xb9c29a, 0xa3b38f, 0xd6b878, 0xc9cfa6, 0x95ad94, 0xe0c58e]))); });
  im.receiveShadow = true; cena.add(im);
}

/* ── Luzes de sinalização (acendem à noite) ───────────────────────────── */
{
  const pts = [];
  for (const z of [-34, -6, 24]) pts.push([-60.5, 40.6, z], [-102, 28.6, z - 4.5], [-102, 28.6, z + 4.5]);
  for (let z = -40; z <= 44; z += 12) pts.push([-92.5, 2.5, z - 4]);
  const im = new THREE.InstancedMesh(caixa(0.7, 0.7, 0.7), matLampada, pts.length);
  const o = new THREE.Object3D();
  pts.forEach((p, k) => { o.position.set(...p); o.updateMatrix(); im.setMatrixAt(k, o.matrix); });
  cena.add(im);
}

/* ── Caminhões ────────────────────────────────────────────────────────── */
const matFarol = new THREE.MeshStandardMaterial({ color: 0xfff1d0, emissive: 0xfff1d0, emissiveIntensity: 0.2 });
const matLanterna = new THREE.MeshStandardMaterial({ color: 0x8a1c10, emissive: 0xff3a1e, emissiveIntensity: 0.2 });
const matRadar = new THREE.MeshBasicMaterial({ color: C.mostarda, transparent: true, opacity: 0, depthWrite: false });
const matPneu = mat(0x1b1d1f);
const caminhoes = [];
function caminhao(curva, u, vel, faixa, corBau, corCab) {
  const g = new THREE.Group();
  g.add(malha(caixa(2.6, 3.4, 10), mat(corBau), 0, 2.6, -1.2));
  pintar(g, corBau, 2.7, -1.2);
  g.add(malha(caixa(2.6, 0.4, 0.2), mat(C.cobre), 0, 4.1, 3.85, false));
  g.add(malha(caixa(2.5, 3, 2.6), mat(corCab), 0, 2.2, 5.3));
  pintarCabine(g, corCab);
  g.add(malha(caixa(2.3, 1, 0.1), mat(0x22313a, { roughness: 0.3 }), 0, 3, 6.62, false));
  for (const z of [-4.5, -3.3, 4.8]) for (const x of [-1.15, 1.15]) g.add(malha(new THREE.CylinderGeometry(0.55, 0.55, 0.5, 10).rotateZ(Math.PI / 2), matPneu, x, 0.55, z, false));
  for (const x of [-0.8, 0.8]) { g.add(malha(caixa(0.5, 0.3, 0.1), matFarol, x, 1.3, 6.62, false)); g.add(malha(caixa(0.4, 0.3, 0.1), matLanterna, x, 1.2, -6.22, false)); }
  const anelRadar = new THREE.Mesh(new THREE.RingGeometry(4, 5, 32).rotateX(-Math.PI / 2), matRadar); anelRadar.position.y = 0.4; g.add(anelRadar);
  cena.add(g);
  caminhoes.push({ g, curva, u, vel, faixa, L: curva.getLength(), anelRadar, f: rnd() * 6 });
}
const coresBau = [C.marfim, C.areia, C.petroleo, C.cobre, C.marfim, C.salvia];
for (let k = 0; k < 7; k++) caminhao(anel, k / 7 + entre(0, 0.04), 7.5 + entre(0, 1.5), 2.3, coresBau[k % coresBau.length], k % 3 ? C.marfim : C.cobre);
for (let k = 0; k < 4; k++) caminhao(rodovia, k / 4 + 0.05, 10, 2.8, coresBau[(k + 2) % 6], k % 2 ? C.cobre : C.marfim);
for (let k = 0; k < 4; k++) caminhao(rodovia, k / 4 + 0.15, -10, 2.8, coresBau[(k + 4) % 6], C.marfim);

/* ── Roteiro da câmera: uma parada por seção ──────────────────────────── */
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const roteiro = [
  { pos: V(175, 92, 180), alvo: V(5, 0, -5), hora: 0.06 },   // abertura
  { pos: V(-16, 24, 62), alvo: V(-72, 14, -6), hora: 0.16 },  // porto
  { pos: V(132, 22, -34), alvo: V(240, 0, 26), hora: 0.3 },   // rodovia
  { pos: V(98, 21, 56), alvo: V(52, 5, 6), hora: 0.44 },      // CD
  { pos: V(42, 250, 14), alvo: V(42, 0, 0), hora: 0.58 },     // monitoramento (visão de radar)
  { pos: V(-160, 84, -150), alvo: V(40, 0, 10), hora: 0.72 }, // malha
  { pos: V(-150, 26, 70), alvo: V(-58, 12, -8), hora: 0.86 }, // porto à noite, visto do mar
  { pos: V(170, 68, 150), alvo: V(30, 0, 10), hora: 1 },      // cotação, noite
];
if (celular) roteiro.forEach((r) => { r.pos.lerp(r.alvo, -0.18); });

const ceuParadas = [
  [0, 0x8fb3bf, 0xf1d6ae, 2.5, 0.95], [0.45, 0x5e8794, 0xefb27e, 2.0, 0.8], [0.68, 0x2b4452, 0xd9875a, 1.0, 0.55],
  [0.84, 0x182a36, 0x6b5a5a, 0.35, 0.38], [1, 0x0b1820, 0x223039, 0.15, 0.3],
];
const cA = new THREE.Color(), cB = new THREE.Color();
function aplicarHora(h) {
  let k = 0; while (k < ceuParadas.length - 2 && h > ceuParadas[k + 1][0]) k++;
  const a = ceuParadas[k], b = ceuParadas[k + 1];
  const t = THREE.MathUtils.clamp((h - a[0]) / (b[0] - a[0]), 0, 1);
  ceuMat.uniforms.topo.value.copy(cA.setHex(a[1])).lerp(cB.setHex(b[1]), t);
  ceuMat.uniforms.horizonte.value.copy(cA.setHex(a[2])).lerp(cB.setHex(b[2]), t);
  cena.fog.color.copy(ceuMat.uniforms.horizonte.value);
  sol.intensity = a[3] + (b[3] - a[3]) * t;
  hemi.intensity = a[4] + (b[4] - a[4]) * t;
  // O sol desce sobre o mar, a oeste
  const alt = THREE.MathUtils.lerp(0.55, -0.05, h);
  const dir = V(-1, alt, 0.25).normalize();
  sol.position.copy(dir).multiplyScalar(320); sol.target.position.set(0, 0, 0);
  sol.color.setHSL(0.08, 0.9, THREE.MathUtils.lerp(0.78, 0.6, h));
  ceuMat.uniforms.dirSol.value.copy(dir);
  ceuMat.uniforms.forcaSol.value = THREE.MathUtils.clamp(1.25 - h, 0, 1);
  const noite = THREE.MathUtils.smoothstep(h, 0.55, 0.95);
  matJanela.emissiveIntensity = noite * 2.2;
  matLampada.emissiveIntensity = noite * 3;
  matFarol.emissiveIntensity = 0.2 + noite * 3;
  matLanterna.emissiveIntensity = 0.2 + noite * 2.5;
  brilhos.material.color.setHex(noite > 0.5 ? 0xffc46b : 0xffe2b0);
  brilhos.material.opacity = 0.55 - noite * 0.25;
}

/* ── Laço de animação ─────────────────────────────────────────────────── */
const camPos = roteiro[0].pos.clone(), camAlvo = roteiro[0].alvo.clone();
let hora = roteiro[0].hora;
const tmpP = new THREE.Vector3(), tmpA = new THREE.Vector3(), o3 = new THREE.Object3D();
const suave = (x) => x * x * x * (x * (x * 6 - 15) + 10);
const relogio = new THREE.Clock();
let primeiro = true;

function ajustar() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener("resize", ajustar); ajustar();

function quadro() {
  const dt = Math.min(relogio.getDelta(), 0.05);
  const t = relogio.elapsedTime;
  const e = window.VIAGEM ? window.VIAGEM.estado() : { i: 0, f: 0 };
  const a = roteiro[Math.min(e.i, roteiro.length - 1)], b = roteiro[Math.min(e.i + 1, roteiro.length - 1)];
  const f = suave(e.f);
  tmpP.lerpVectors(a.pos, b.pos, f); tmpA.lerpVectors(a.alvo, b.alvo, f);
  // Arco: entre paradas a câmera ganha altura, como um drone
  tmpP.y += Math.sin(Math.PI * e.f) * (a === b ? 0 : 26);
  const alvoHora = a.hora + (b.hora - a.hora) * f;
  const k = primeiro || reduzir ? 1 : 1 - Math.exp(-dt * 3.2);
  camPos.lerp(tmpP, k); camAlvo.lerp(tmpA, k); hora += (alvoHora - hora) * k;
  camera.position.copy(camPos);
  if (!reduzir) { camera.position.x += Math.sin(t * 0.21) * 1.6; camera.position.y += Math.sin(t * 0.17) * 0.9; }
  camera.lookAt(camAlvo);
  aplicarHora(hora);

  if (!reduzir) {
    for (const c of caminhoes) {
      c.u = (c.u + (c.vel * dt) / c.L + 1) % 1;
      const p = c.curva.getPointAt(c.u), tg = c.curva.getTangentAt(c.u);
      const lado = c.vel >= 0 ? 1 : -1;
      c.g.position.set(p.x - tg.z * c.faixa * lado, 0.12, p.z + tg.x * c.faixa * lado);
      c.g.rotation.y = Math.atan2(tg.x * lado, tg.z * lado);
    }
    for (const g of guindastes) {
      const s = 0.5 - 0.5 * Math.cos(t * 0.45 + g.fase);
      const x = -60 - s * 30;
      const ic = 0.5 + 0.5 * Math.cos(t * 0.9 + g.fase * 2);
      const y = 8 + ic * 13;
      g.carro.position.x = x; g.carga.position.set(x, y, 0);
      g.cabo.position.set(x, (25.4 + y + 1.3) / 2, 0); g.cabo.scale.y = Math.max(0.1, 25.4 - (y + 1.3));
    }
    navio.position.y = Math.sin(t * 0.6) * 0.25; navio.rotation.z = Math.sin(t * 0.45) * 0.008;
    brilhoDados.forEach((d, k) => {
      o3.position.set(d.x + Math.sin(t * 0.3 + d.f) * 3, -1.3, d.z); o3.scale.set(d.w * (0.6 + 0.4 * Math.sin(t * 1.3 + d.f)), 1, 0.35);
      o3.updateMatrix(); brilhos.setMatrixAt(k, o3.matrix);
    });
    brilhos.instanceMatrix.needsUpdate = true;
  }
  // Radar: anéis pulsam nos caminhões quando a câmera está na visão de monitoramento
  const radar = Math.max(0, 1 - Math.abs(e.i + e.f - 4) * 1.4);
  matRadar.opacity = radar * 0.9;
  if (radar > 0) for (const c of caminhoes) { const s = 1 + ((t * 0.8 + c.f) % 1) * 2.4; c.anelRadar.scale.setScalar(s); }

  renderer.render(cena, camera);
  if (primeiro) { primeiro = false; requestAnimationFrame(pronto); }
  requestAnimationFrame(quadro);
}
quadro();
