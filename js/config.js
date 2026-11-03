// إعدادات اللعبة المركزية — كل الأرقام هنا لتسهيل الضبط لاحقاً
export const CONFIG = {
  world: { radius: 180, size: 440, seed: 1337 },
  player: { eye: 1.7, speed: 4.5, sprint: 7.5, radius: 0.45, jump: 7, gravity: 20, lookSens: 0.0045, thirdDist: 3.6 },
  day: { lengthSec: 480, startHour: 9 }, // يوم كامل = 8 دقائق
  zones: [ // الوجهات على الخريطة المصغرة
    { name: 'الشاطئ',  x: 0,    z: 148, icon: '🏖️' },
    { name: 'الغابة',  x: 20,   z: 40,  icon: '🌲' },
    { name: 'الجبال',  x: -60,  z: -50, icon: '⛰️' },
    { name: 'الكهوف',  x: -100, z: -20, icon: '🕳️' },
    { name: 'المنشأة', x: 90,   z: -80, icon: '☢️' },
  ],
  quality: {
    // متوسطة = الأساس (كانت المنخفضة سابقاً). العالية: ظلال + دقة أعلى مع خفض تلقائي للدقة عند الثقل
    medium: { pixelRatio: 1,   minPR: 0.7,  shadows: false, shadowMap: 0,    segments: 110, trees: 320, rocks: 80,  fog: 110, rain: 350 },
    high:   { pixelRatio: 1.5, minPR: 0.75, shadows: true,  shadowMap: 1024, segments: 150, trees: 520, rocks: 130, fog: 150, rain: 700 },
  },
};
