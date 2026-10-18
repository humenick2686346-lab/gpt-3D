// Procedural, opt-in ambience. No recording or external audio asset is used.
export class Ambience {
  constructor(){this.enabled=false;this.weather='sun';this.context=null;}
  async toggle() {
    this.enabled=!this.enabled;
    if(this.enabled) {
      try {
        if(!this.context)this.create();
        await this.context.resume();this.set(this.weather,this.intensity??.65);
      } catch { this.enabled=false;throw new Error('此浏览器暂时无法播放环境音'); }
    } else if(this.context) this.gain.gain.setTargetAtTime(0,this.context.currentTime,.4);
    return this.enabled;
  }
  create() {
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    this.context=new AudioContext();
    const buffer=this.context.createBuffer(1,this.context.sampleRate*4,this.context.sampleRate);
    const data=buffer.getChannelData(0);let last=0;
    for(let i=0;i<data.length;i++){last=(last+Math.random()*.04-.02)/1.02;data[i]=last*4;}
    this.source=this.context.createBufferSource();this.source.buffer=buffer;this.source.loop=true;
    this.filter=this.context.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=1100;
    this.gain=this.context.createGain();this.gain.gain.value=0;
    this.source.connect(this.filter).connect(this.gain).connect(this.context.destination);this.source.start();
  }
  set(weather,intensity) {
    this.weather=weather;this.intensity=intensity;if(!this.context)return;
    this.filter.frequency.setTargetAtTime(weather==='rain'?3600:weather==='snow'?450:850,this.context.currentTime,.7);
    const volume=weather==='rain'?.16+intensity*.2:weather==='snow'?.035:.065;
    this.gain.gain.setTargetAtTime(this.enabled?volume:0,this.context.currentTime,.7);
  }
  dispose(){this.source?.stop();this.context?.close();}
}
