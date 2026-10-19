import * as T from 'three';
import {mats,toon} from './materials.ts';
export function createMountain(){
 const group=new T.Group();group.name='Fuji · snow ridges';group.position.set(-.6,.45,-5.65);
 const seg=96,levels=28,p:number[]=[],c:number[]=[],idx:number[]=[];
 for(let j=0;j<=levels;j++)for(let i=0;i<=seg;i++){
  const a=i/seg*Math.PI*2,t=j/levels;const ridge=Math.sin(a*13)*.09+Math.sin(a*7+.4)*.055+Math.sin(a*23)*.02;
  const r=(.15+3.1*Math.pow(1-t,1.25))*(1+ridge*Math.sin(t*Math.PI));const y=t*4.05+(t<.95?Math.sin(a*7)*.07:Math.sin(a*5)*.055);
  p.push(Math.cos(a)*r,y,Math.sin(a)*r*.83);
  const snowline=.63+.055*Math.sin(a*9)+.035*Math.cos(a*15);const color=new T.Color(t>snowline?'#edf8fb':t>snowline-.035?'#bccfdc':'#7f98b5');color.multiplyScalar(.92+.08*Math.sin(a*13+.7));color.toArray(c,c.length);
 }
 for(let j=0;j<levels;j++)for(let i=0;i<seg;i++){const a=j*(seg+1)+i,b=a+seg+1;idx.push(a,b,a+1,b,b+1,a+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.setIndex(idx);g.computeVertexNormals();const m=toon('#ffffff',true);const mesh=new T.Mesh(g,m);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
 return group;
}
