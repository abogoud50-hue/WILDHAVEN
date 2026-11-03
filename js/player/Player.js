import * as THREE from 'three';
import { CONFIG } from '../config.js';

const P = CONFIG.player;
const lerpAng = (a, b, t) => a + ((((b - a + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) - Math.PI) * t;

export class Player {
  constructor(camera, world, scene) {
    this.camera = camera; this.world = world;
    this.yaw = Math.PI; this.pitch = 0; this.vy = 0; this.grounded = true;
    this.x = 0; this.z = world.R * 0.82;
    this.y = Math.max(world.heightAt(this.x, this.z), -0.6);
    this.third = true; this.blend = 1; this.face = this.yaw;
    this.stepAcc = 0; this.stepSurface = null;
    camera.rotation.order = 'YXZ';

    // نموذج مؤقت — يمكن استبداله لاحقاً بنموذج GLB
    const mat = (c) => new THREE.MeshLambertMaterial({ color: c });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(.28, .7, 4, 8), mat(0xb8532f)); body.position.y = .85;
    const head = new THREE.Mesh(new THREE.SphereGeometry(.2, 10, 8), mat(0xe0b48c)); head.position.y = 1.6;
    const nose = new THREE.Mesh(new THREE.BoxGeometry(.12, .08, .2), mat(0x333333)); nose.position.set(0, 1.6, -.2);
    this.model = new THREE.Group(); this.model.add(body, head, nose);
    this.model.traverse((o) => (o.castShadow = true));
    scene.add(this.model);
  }

  _blocked(x, z) {
    if (this.world.heightAt(x, z) < -1.0) return true; // ماء عميق
    for (const c of this.world.nearColliders(x, z)) if (Math.hypot(x - c.x, z - c.z) < c.r + P.radius) return true;
    return false;
  }

  update(dt, input) {
    if (input.consumeCam()) this.third = !this.third;
    const l = input.consumeLook();
    this.yaw -= l.dx * P.lookSens;
    this.pitch = Math.max(-1.4, Math.min(1.4, this.pitch - l.dy * P.lookSens));

    const sp = (input.sprint ? P.sprint : P.speed) * dt;
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw), rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    let mx = fx * input.move.y + rx * input.move.x, mz = fz * input.move.y + rz * input.move.x;
    const len = Math.hypot(mx, mz);
    if (len > 1) { mx /= len; mz /= len; }

    const ox = this.x, oz = this.z, nx = ox + mx * sp, nz = oz + mz * sp;
    if (!this._blocked(nx, oz)) this.x = nx;
    if (!this._blocked(this.x, nz)) this.z = nz;

    if (input.consumeJump() && this.grounded) { this.vy = P.jump; this.grounded = false; }
    const ground = Math.max(this.world.heightAt(this.x, this.z), -0.6);
    this.vy -= P.gravity * dt; this.y += this.vy * dt;
    if (this.y <= ground) { this.y = ground; this.vy = 0; this.grounded = true; }

    // خطوات الأقدام حسب نوع السطح
    this.stepSurface = null;
    const mv = Math.hypot(this.x - ox, this.z - oz);
    if (this.grounded && mv > 0) {
      this.stepAcc += mv;
      if (this.stepAcc > (input.sprint ? 2.6 : 1.9)) {
        this.stepAcc = 0;
        this.stepSurface = ground < 0.2 ? 'water' : ground < 1.6 ? 'sand' : ground < 12 ? 'grass' : 'rock';
      }
    }

    // الكاميرا: انتقال سلس بين الشخص الأول والثالث
    this.blend += ((this.third ? 1 : 0) - this.blend) * Math.min(1, dt * 7);
    if (this.blend > 0.5 && len > 0.05) this.face = lerpAng(this.face, Math.atan2(-mx, -mz), Math.min(1, dt * 10));
    else if (this.blend <= 0.5) this.face = this.yaw;

    const cp = Math.cos(this.pitch), dx = -Math.sin(this.yaw) * cp, dy = Math.sin(this.pitch), dz = -Math.cos(this.yaw) * cp;
    const dist = this.blend * P.thirdDist, side = this.blend * 0.45;
    const cx = this.x - dx * dist + Math.cos(this.yaw) * side, cz = this.z - dz * dist - Math.sin(this.yaw) * side;
    let cy = this.y + P.eye - dy * dist;
    const g = Math.max(this.world.heightAt(cx, cz), -0.05) + 0.3;
    if (cy < g) cy = g; // لا تدخل الكاميرا تحت الأرض
    this.camera.position.set(cx, cy, cz);
    this.camera.rotation.set(this.pitch, this.yaw, 0);

    this.model.visible = this.blend > 0.12;
    this.model.position.set(this.x, this.y, this.z);
    this.model.rotation.y = this.face;
  }
}
