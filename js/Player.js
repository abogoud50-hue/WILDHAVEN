import { CONFIG } from '../config.js';

const P = CONFIG.player;

export class Player {
  constructor(camera, world) {
    this.camera = camera;
    this.world = world;
    this.yaw = Math.PI;   // ينظر نحو الجزيرة من الشاطئ
    this.pitch = 0;
    this.vy = 0;
    this.grounded = true;
    // نقطة البداية: الشاطئ
    this.x = 0;
    this.z = world.R * 0.82;
    this.y = Math.max(world.heightAt(this.x, this.z), -0.6);
    camera.rotation.order = 'YXZ';
  }

  _blocked(x, z) {
    if (this.world.heightAt(x, z) < -1.0) return true; // ماء عميق
    for (const c of this.world.nearColliders(x, z)) {
      if (Math.hypot(x - c.x, z - c.z) < c.r + P.radius) return true;
    }
    return false;
  }

  update(dt, input) {
    // النظر
    const l = input.consumeLook();
    this.yaw -= l.dx * P.lookSens;
    this.pitch = Math.max(-1.4, Math.min(1.4, this.pitch - l.dy * P.lookSens));

    // الحركة
    const sp = (input.sprint ? P.sprint : P.speed) * dt;
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    const rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    let mx = fx * input.move.y + rx * input.move.x;
    let mz = fz * input.move.y + rz * input.move.x;
    const len = Math.hypot(mx, mz);
    if (len > 1) { mx /= len; mz /= len; }

    // كل محور على حدة ليسمح بالانزلاق على العوائق
    const nx = this.x + mx * sp, nz = this.z + mz * sp;
    if (!this._blocked(nx, this.z)) this.x = nx;
    if (!this._blocked(this.x, nz)) this.z = nz;

    // القفز والجاذبية
    if (input.consumeJump() && this.grounded) { this.vy = P.jump; this.grounded = false; }
    const ground = Math.max(this.world.heightAt(this.x, this.z), -0.6);
    this.vy -= P.gravity * dt;
    this.y += this.vy * dt;
    if (this.y <= ground) { this.y = ground; this.vy = 0; this.grounded = true; }

    this.camera.position.set(this.x, this.y + P.eye, this.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }
}
