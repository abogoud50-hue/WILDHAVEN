import * as THREE from 'three';
import { CONFIG } from './config.js';
import { World } from './world/World.js';
import { Player } from './player/Player.js';
import { Inventory } from './player/Inventory.js';
import { TouchControls } from './input/TouchControls.js';
import { Environment } from './core/Environment.js';
import { AudioManager } from './core/Audio.js';
import { Interaction } from './core/Interaction.js';
import { Minimap } from './ui/Minimap.js';
import { Hotbar } from './ui/Hotbar.js';

const $ = (id) => document.getElementById(id);

// الجودة (القيمة القديمة "low" تتحول تلقائياً إلى متوسطة)
let level = localStorage.getItem('wh_quality');
if (!CONFIG.quality[level]) level = 'medium';
const q = CONFIG.quality[level];
document.querySelectorAll('.q').forEach((b) => {
  b.classList.toggle('on', b.dataset.q === level);
  b.onclick = () => { if (b.dataset.q !== level) { localStorage.setItem('wh_quality', b.dataset.q); location.reload(); } };
});

const renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: false, powerPreference: 'high-performance' });
const cap = Math.min(devicePixelRatio, q.pixelRatio);
let pr = cap;
const applyPR = () => { renderer.setPixelRatio(pr); renderer.setSize(innerWidth, innerHeight); };
applyPR();
renderer.shadowMap.enabled = q.shadows;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ccbe8);
scene.fog = new THREE.Fog(0x9ccbe8, 40, q.fog);
const hemi = new THREE.HemisphereLight(0xdff0ff, 0x4a5a3a, 1);
const sun = new THREE.DirectionalLight(0xfff2d0, 1.2);
scene.add(hemi, sun);
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, q.fog + 30);

const world = new World(scene, q);
const inv = new Inventory();
const player = new Player(camera, world, scene);
const input = new TouchControls();
const env = new Environment(scene, camera, q, sun, hemi);
const audio = new AudioManager();
const mini = new Minimap(world);
const inter = new Interaction(world, player, inv);
new Hotbar(inv);

addEventListener('resize', () => { applyPR(); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });
document.addEventListener('visibilitychange', () => audio.suspend(document.hidden));

let started = false, orbit = 0;
$('startBtn').onclick = async () => {
  audio.start();
  try { await document.documentElement.requestFullscreen(); } catch (e) {}
  try { await screen.orientation.lock('landscape'); } catch (e) {}
  started = true;
  document.body.classList.remove('menu');
  $('loading').classList.add('hide');
};

let last = performance.now(), fT = last, fN = 0, good = 0;
renderer.setAnimationLoop((now) => {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;

  player.update(dt, input);
  if (started) {
    inter.update(dt, input);
    audio.update(dt, env, player, world);
    if (player.stepSurface) audio.step(player.stepSurface);
    mini.update(dt, player);
  } else { // الواجهة الرئيسية: كاميرا تدور حول الشخصية داخل العالم
    orbit += dt * 0.15;
    camera.position.set(player.x + Math.sin(orbit) * 8, player.y + 3.2, player.z + Math.cos(orbit) * 8);
    camera.lookAt(player.x, player.y + 1.4, player.z);
  }
  env.update(dt, player);
  renderer.render(scene, camera);

  // FPS حقيقي (يُقاس بالزمن الفعلي) + دقة تلقائية للحفاظ على السلاسة
  fN++;
  const el = now - fT;
  if (el >= 500) {
    const ms = el / fN;
    $('fps').textContent = Math.round(1000 / ms) + ' FPS';
    $('info').textContent = env.clock + ' · ' + env.weatherName;
    fN = 0; fT = now;
    if (ms > 19 && pr > q.minPR) { pr = Math.max(q.minPR, pr - 0.1); good = 0; applyPR(); }
    else if (ms < 17.5) { if (++good >= 6 && pr < cap) { pr = Math.min(cap, pr + 0.05); good = 0; applyPR(); } }
    else good = 0;
  }
});
