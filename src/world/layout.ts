export type Weather = 'sun' | 'rain' | 'snow';
export type Quality = 'low' | 'medium' | 'high';
export const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
export const smooth=(a:number,b:number,n:number)=>{const t=clamp((n-a)/(b-a),0,1);return t*t*(3-2*t);};
export function random(seed=3101){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
// Expand the shoreline, rather than stretching the buildings, lake or mountain.
export const islandScale=4/3;
export const islandRadiusX=10*islandScale,islandRadiusZ=8.6*islandScale;
export const edge=(a:number)=>1+.035*Math.sin(a*5+.7)+.025*Math.cos(a*9);
export function inside(x:number,z:number,margin=0){const a=Math.atan2(z/islandRadiusZ,x/islandRadiusX);return Math.hypot(x/islandRadiusX,z/islandRadiusZ)<edge(a)-margin;}
export function height(x:number,z:number){const outer=smooth(.65,.94,Math.hypot(x/islandRadiusX,z/islandRadiusZ));return .38+.14*Math.sin(x*.8)*Math.cos(z*.6)+1.05*Math.exp(-((x+5.6)**2/12+(z+1.5)**2/18))+.48*Math.exp(-((x-6)**2/7+(z-1)**2/14))+.12*Math.sin(z*1.6+x*.2)+outer*(.16+.1*Math.sin(x*.6+z*.4));}
export const lake=(x:number,z:number)=>((x-2)/3.7)**2+((z+2.8)/2.05)**2;
export const streamX=(z:number)=>3.6+Math.sin(z*.65)*1.1;
function shoreline(point:(r:number)=>[number,number],max:number){let lo=0,hi=max;for(let i=0;i<32;i++){const mid=(lo+hi)/2;const [x,z]=point(mid);if(inside(x,z))lo=mid;else hi=mid;}return(lo+hi)/2;}
export const streamEndZ=shoreline(z=>[streamX(z),z],islandRadiusZ*1.2);
export const eastOutletX=shoreline(x=>[x,-3.4],islandRadiusX*1.2);
const westAngle=2.38;
export const westFall={x:Math.cos(westAngle)*islandRadiusX*edge(westAngle),z:Math.sin(westAngle)*islandRadiusZ*edge(westAngle)};
export const westSpring={x:westFall.x+1.05,z:westFall.z-.65};
export const westPool=(x:number,z:number)=>((x-westSpring.x)/1.35)**2+((z-westSpring.z)/.72)**2;
export function westStreamAt(x:number,z:number){const dx=westFall.x-westSpring.x,dz=westFall.z-westSpring.z,t=clamp(((x-westSpring.x)*dx+(z-westSpring.z)*dz)/(dx*dx+dz*dz),0,1);return Math.hypot(x-westSpring.x-t*dx,z-westSpring.z-t*dz)<.32;}
export function waterAt(x:number,z:number){return lake(x,z)<1 || z>-2.5&&z<streamEndZ+.1&&Math.abs(x-streamX(z))<.52 || x>5&&x<eastOutletX+.1&&z<-2.9&&z>-3.8 || westPool(x,z)<1||westStreamAt(x,z);}
export function mountainAt(x:number,z:number){return Math.hypot((x+.6)/4.35,(z+5.65)/3.8)<1;}
export const pathX=(z:number)=>-1.6+Math.sin(z*.63)*1.5;
export const gardenPathRadius=.8;
export function pathAt(x:number,z:number){return Math.abs(x-pathX(z))<.48&&z>-3.9&&z<islandRadiusZ*.94||Math.abs(z-(.8+Math.sin(x*.55)*.6))<.43&&x>-islandRadiusX*.86&&x<islandRadiusX*.86||Math.hypot(x+5,z+2.2)<1.45||z>.5&&Math.abs(Math.hypot(x/islandRadiusX,z/islandRadiusZ)-gardenPathRadius)<.024;}
export const buildings=[
 {x:-5.7,z:-2.4,s:1.1,kind:'shrine',rot:.18},
 {x:5.4,z:-3.5,s:.85,kind:'shrine',rot:-.45},
 {x:-5.2,z:3.1,s:.78,kind:'pagoda',rot:.2},
 {x:-7.35,z:.1,s:.55,kind:'house',rot:.5},
 {x:-3.65,z:-.6,s:.5,kind:'house',rot:.1},
 {x:6.7,z:.35,s:.62,kind:'house',rot:-.4},
 {x:6.5,z:3.6,s:.52,kind:'house',rot:-.25},
 {x:2,z:-3.2,s:.46,kind:'pavilion',rot:0},
 {x:-4.7,z:-8.65,s:.5,kind:'pavilion',rot:.3},
];
export function buildingAt(x:number,z:number){return buildings.some(b=>Math.hypot(x-b.x,z-b.z)<b.s*1.35+.18);}
export const trees=[[-8,-2],[-7,-4],[-5.6,-5.3],[-4.3,-2.1],[-7.8,1.8],[-8,3.5],[-6.4,4.7],[-4.8,5.7],[-2.5,6.8],[-.4,7.3],[1.6,7],[5.8,5.5],[7.6,4.4],[8.25,2.2],[8,-.5],[7.4,-2.5],[6.1,-5.4],[4.2,-5.9],[4.2,-8.2],[-1,-10.1],[-5.8,-6.9],[-8.2,-.4],[-6.4,1],[-3.3,2.8],[.3,-.3],[5.4,-.5],[1.6,4.7],[7,-4.5],[-4,4.5],[-11,-3],[-10.4,-5.5],[-8.3,-7.8],[-6.6,-8.9],[-3,-9.6],[3.4,-9.5],[6,-8.7],[8.8,-6.8],[10.8,-4.8],[11.4,-1.5],[10.9,2.4],[9.8,5.3],[8.3,7.6],[5.8,8.5],[1.3,9.8],[-2.8,9.3],[-6,8.5],[-10.6,3.4]];
export function treeAt(x:number,z:number){return trees.some(t=>Math.hypot(x-t[0],z-t[1])<.33);}
export const qualityConfig={low:{flowers:6500,particles:850,dpr:1,shadow:1024,bloom:false},medium:{flowers:11000,particles:1600,dpr:1.35,shadow:2048,bloom:true},high:{flowers:16500,particles:2600,dpr:1.75,shadow:2048,bloom:true}};
export function plantable(x:number,z:number){return inside(x,z,.035)&&!waterAt(x,z)&&!mountainAt(x,z)&&!pathAt(x,z)&&!buildingAt(x,z)&&!treeAt(x,z);}
