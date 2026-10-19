import * as T from 'three';
import {Batch,mats,toon} from './materials.ts';
import {edge,height,random,inside,pathX,waterAt,streamX} from './layout.ts';
export function createIsland(){
 const group=new T.Group();group.name='Island · 20 × 18 miniature';const rand=random(31),batch=new Batch();
 const seg=128,rings=28,p:number[]=[],indices:number[]=[];
 for(let j=0;j<=rings;j++)for(let i=0;i<=seg;i++){const a=i/seg*Math.PI*2,r=j/rings;const x=Math.cos(a)*10*r*edge(a),z=Math.sin(a)*8.6*r*edge(a);p.push(x,waterAt(x,z)?-.12:height(x,z),z);}
 for(let j=0;j<rings;j++)for(let i=0;i<seg;i++){const a=j*(seg+1)+i,b=a+seg+1;indices.push(a,a+1,b,b,a+1,b+1);}
 const top=new T.BufferGeometry();top.setAttribute('position',new T.Float32BufferAttribute(p,3));top.setIndex(indices);top.computeVertexNormals();const turf=new T.Mesh(top,mats.grass);turf.receiveShadow=true;group.add(turf);
 // A closed, asymmetric rock body, with vertical strata and a deep tapered underside.
 const rp:number[]=[],ri:number[]=[],rc:number[]=[];const n=96,levels=5;
 for(let j=0;j<levels;j++)for(let i=0;i<=n;i++){const a=i/n*Math.PI*2;const f=[1,.99,.91,.65,.05][j];const jitter=j===0?0:(rand()-.5)*.45;const x=Math.cos(a)*10*edge(a)*f,z=Math.sin(a)*8.6*edge(a)*f;const y=j===0?height(x,z)-.03:[0,-.8,-2.05,-3.7,-4.9][j]+jitter;rp.push(x,y,z);const c=new T.Color(['#c1ac88','#ae9581','#8b8791','#697984','#66747e'][j]).multiplyScalar(.9+rand()*.18);c.toArray(rc,rc.length);}
 for(let j=0;j<levels-1;j++)for(let i=0;i<n;i++){const a=j*(n+1)+i,b=a+n+1;ri.push(a,a+1,b,b,a+1,b+1);}
 const rg=new T.BufferGeometry();rg.setAttribute('position',new T.Float32BufferAttribute(rp,3));rg.setAttribute('color',new T.Float32BufferAttribute(rc,3));rg.setIndex(ri);rg.computeVertexNormals();const rm=toon('#ffffff',true);const rocks=new T.Mesh(rg,rm);rocks.castShadow=true;rocks.receiveShadow=true;group.add(rocks);
 for(let i=0;i<75;i++){const a=i/75*Math.PI*2,r=.88+rand()*.09,x=Math.cos(a)*10*r,z=Math.sin(a)*8.6*r;batch.add(new T.ConeGeometry(.4+rand()*.5,1.2+rand()*2,5),mats.rock,[x,-1.8-rand(),z],[1,1,1],[Math.PI,rand()*6,.1]);if(i%2===0)batch.ball(mats.moss,[x,height(x,z)-.04,z],[.5,.15,.45]);}
 // Overhanging moss, hanging ivy and blossom vines break up the cliff silhouette.
 for(let i=0;i<95;i++){const a=rand()*Math.PI*2,x=Math.cos(a)*10*edge(a),z=Math.sin(a)*8.6*edge(a),h=height(x,z),length=.4+rand()*1.5;batch.beam(mats.moss,[x,h,z],[x*.99,h-length,z*.99],.018);for(let k=0;k<6;k++){const y=h-k*length/6;batch.ball(k%4===0?mats.pink:mats.leaf,[x+Math.sin(k)*.09,y,z],[.13,.08,.12]);}}
 // Raised slate pavers follow both flower paths; individual stones retain visible gaps.
 const stones=(x:number,z:number,rot:number)=>{if(!inside(x,z,.1)||waterAt(x,z))return;batch.box(mats.stone,[x,height(x,z)+.065,z],[.7,.09,.27],[0,rot,0]);};
 for(let z=-3.6;z<7.8;z+=.32)stones(pathX(z),z,Math.atan(.945*Math.cos(z*.63)));
 for(let x=-7.8;x<8;x+=.34)stones(x,.8+Math.sin(x*.55)*.6,Math.PI/2-Math.atan(.33*Math.cos(x*.55)));
 // Stone riverbanks provide readable separation between flower carpet and moving water.
 for(let z=-1.6;z<7.9;z+=.31)for(const side of [-1,1])batch.ball(mats.stone,[streamX(z)+side*.57,.55,z],[.15,.12,.2]);
 for(let i=0;i<90;i++){const a=i/90*Math.PI*2;const x=2+Math.cos(a)*3.74,z=-2.8+Math.sin(a)*2.08;if(!inside(x,z,.08))continue;batch.ball(mats.stone,[x,.59,z],[.16,.13,.16]);}
 group.add(batch.flush('Cliffs, hanging gardens and slate paths'));
 return group;
}
