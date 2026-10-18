import * as THREE from 'three';
import { clamp, smoothstep } from '../core/math.js';

export function calculateTime(hour) {
  const h = ((hour % 24) + 24) % 24;
  const solarHour = h < 5.5 ? h + 24 : h;
  const angle = solarHour <= 19.5 ? (solarHour - 5.5) / 14 * Math.PI : Math.PI + (solarHour - 19.5) / 10 * Math.PI;
  const elevation = Math.sin(angle);
  const daylight = smoothstep(-.17, .24, elevation);
  const night = 1 - smoothstep(-.19, .12, elevation);
  const golden = (1 - smoothstep(.12, .72, elevation)) * daylight;
  return { hour: h, angle, elevation, daylight, night, golden };
}

export class TimeSystem {
  constructor(scene, sky, tower, ground) {
    this.scene = scene; this.sky = sky; this.tower = tower; this.ground = ground;
    this.sun = new THREE.DirectionalLight(0xffe3bb, 3);
    this.sun.castShadow = true;
    Object.assign(this.sun.shadow.camera, { left: -220, right: 220, top: 340, bottom: -160, near: 1, far: 1400 });
    this.sun.shadow.bias = -.0005;
    this.sun.shadow.normalBias = .5;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.target.position.set(0, 100, 0);
    this.moon = new THREE.DirectionalLight(0xa1c4ff, .2);
    this.moon.position.set(-350, 500, -300);
    this.ambient = new THREE.HemisphereLight(0xaacbdf, 0x485447, 1.8);
    scene.add(this.sun, this.sun.target, this.moon, this.ambient);
    this.time = 17.25;
    this.state = calculateTime(this.time);
    this.weather = 'sun'; this.intensity = .65;
    this.fogColor = new THREE.Color();
    scene.fog = new THREE.FogExp2(0xb9bbc1, .00085);
  }
  update(hour, weather, intensity) {
    this.time = clamp(hour, 0, 24); this.weather = weather; this.intensity = intensity;
    const s = this.state = calculateTime(hour);
    const overcast = weather === 'sun' ? 0 : intensity * .72 + .18;
    const skyTop = new THREE.Color(0x091629).lerp(new THREE.Color(0x79b3d5), s.daylight);
    skyTop.lerp(new THREE.Color(0x626d89), s.golden * .47);
    const horizon = new THREE.Color(0x243c55).lerp(new THREE.Color(0xdae3cd), s.daylight);
    horizon.lerp(new THREE.Color(0xf6b397), s.golden * .85);
    const gray = new THREE.Color(0x122536).lerp(new THREE.Color(weather === 'snow' ? 0xbfcbd1 : 0x7e94a0), s.daylight);
    skyTop.lerp(gray, overcast * .88); horizon.lerp(gray, overcast * .77);
    this.sky.material.uniforms.topColor.value.copy(skyTop);
    this.sky.material.uniforms.horizonColor.value.copy(horizon);
    this.sky.material.uniforms.sunDirection.value.set(-Math.cos(s.angle) * .82, s.elevation, -.38).normalize();
    this.sky.material.uniforms.daylight.value = s.daylight;
    this.sky.material.uniforms.cloudCover.value = .22 + overcast * .65;
    this.sky.material.uniforms.night.value = s.night;
    this.sun.position.set(-Math.cos(s.angle) * 600, s.elevation * 650 + 45, -280);
    this.sun.color.set(0xfff1d6).lerp(new THREE.Color(0xffa76d), s.golden);
    this.sun.intensity = Math.max(.02, s.daylight * (2.8 - overcast * 2)) * smoothstep(-.15, .06, s.elevation);
    this.ambient.intensity = .55 + s.daylight * (1.35 - overcast * .25);
    this.ambient.color.copy(skyTop).lerp(new THREE.Color(0xd8e1df), .45);
    this.ambient.groundColor.set(weather === 'snow' ? 0x778992 : 0x62694b);
    this.moon.intensity = .32 * s.night;
    this.fogColor.copy(horizon);
    this.scene.fog.color.copy(this.fogColor);
    this.scene.fog.density = .00055 + overcast * .00075;
    const lamp = Math.max(s.night, smoothstep(16.7, 19.5, s.hour) * (s.hour < 23.99 ? 1 : 0));
    this.tower.setNight(lamp);
    this.ground.setWeather(weather, intensity, s.daylight);
    return s;
  }
}
