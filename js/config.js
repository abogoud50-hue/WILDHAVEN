// إعدادات اللعبة المركزية — كل الأرقام هنا لتسهيل الضبط لاحقاً
export const CONFIG = {
  world: { radius: 180, size: 440, seed: 1337 },
  player: { eye: 1.7, speed: 4.5, sprint: 7.5, radius: 0.45, jump: 7, gravity: 20, lookSens: 0.0045 },
  quality: {
    low:    { pixelRatio: 0.75, antialias: false, segments: 70,  trees: 160, rocks: 40,  fog: 70  },
    medium: { pixelRatio: 1,    antialias: false, segments: 110, trees: 320, rocks: 80,  fog: 110 },
    high:   { pixelRatio: 1.5,  antialias: true,  segments: 160, trees: 560, rocks: 140, fog: 160 },
  },
};
