import * as THREE from 'three';
import { CONFIG } from './config.js';
import { World } from './world/World.js';
import { Player } from './player/Player.js';
import { TouchControls } from './input/TouchControls.js';

const $ = (id) => document.getElementById(id);

// الجودة المحفوظة
let level = localStorage.getItem('wh_quality');
if (!CONFIG.quality[level]) level = 'medium';
const q = CONFIG.quality[level];
$('quality').value = level;
$('quality').addEventListener('change', (e) => {
  localStorage.setItem('wh_quality', e.target.value);
  location.reload();
});

// المحرك
const renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: q.antialias, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, q.pixelRatio));
renderer.setSize(innerWidth, innerHeight);

const scene = new THREE.Scene();
const sky = new THREE.Color(0x9ccbe8);
scene.background = sky;
scene.fog = new THREE.Fog(sky, q.fog * 0.4, q.fog);
scene.add(new THREE.HemisphereLight(0xdff0ff, 0x4a5a3a, 1.0));
const sun = new THREE.DirectionalLight(0xfff2d0, 1.2);
sun.position.set(80, 120, 40);
scene.add(sun);

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, q.fog + 20);

const world = new World(scene, q);
const player = new Player(camera, world);
const input = new TouchControls();

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

// شاشة البداية: ملء الشاشة + قفل الوضع الأفقي
$('loadMsg').textContent = 'الجزيرة جاهزة';
$('startBtn').hidden = false;
$('startBtn').addEventListener('click', async () => {
  try { await document.documentElement.requestFullscreen(); } catch (e) {}
  try { await screen.orientation.lock('landscape'); } catch (e) {}
  $('loading').style.display = 'none';
});

// الحلقة الرئيسية
let last = performance.now(), frames = 0, acc = 0;
renderer.setAnimationLoop((now) => {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  player.update(dt, input);
  renderer.render(scene, camera);

  frames++; acc += dt;
  if (acc >= 1) { $('fps').textContent = frames + ' FPS'; frames = 0; acc = 0; }
});
