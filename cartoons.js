/* ======================================================================
   CARTOONS for "Is My Journey Fucked?"
   ----------------------------------------------------------------------
   Every animated scene under the verdict is drawn here as SVG.
   Nothing is downloaded: it's all shapes, so it can't fail to load.

   How it's organised
     1. The KIT: reusable drawings (sky, track, overhead wires, the train,
        people, station furniture, animals, weather, speech bubbles).
     2. The SCENES: one function per cartoon, grouped by verdict level.
        Each returns the SVG for a 400 x 190 picture.

   Every scene gets a context object "c" from the page:
     c.stops  up to three station names on the journey (for departure boards)
     c.level  the verdict level ("no", "bit", "yes", "none", "closed", "dunno")
   The train's doors and stripe use the CSS variable --train (your line's colour).

   Animation is done with a handful of CSS classes (a-spin, a-rock, a-loop…)
   defined in index.html. Each takes its settings from inline CSS variables,
   e.g. class="a-rock" style="--a0:-10deg;--a1:10deg;--d:.4s".
   Anything that should pivot is drawn around its own (0,0) inside a
   translate() group, so it rotates about the right point.
   ====================================================================== */
(function(){
const VB="0 0 400 190";
const RY=158;   // y of the top of the rail
const TY=98;    // y of the train's roof when it stands on the rail
const rep=(n,f)=>Array.from({length:n},(_,i)=>f(i)).join("");
const E=t=>String(t??"").replace(/[&<>]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[ch]));
const A=(cls,st="")=>`class="${cls}" style="${st}"`;
// The last station on the journey, for departure boards.
const DEST=c=>E((c.stops&&c.stops[c.stops.length-1])||"London");

/* ---------- Shared gradients and patterns (included in every scene) ---------- */
const grad=(id,a,b,extra="")=>`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1" ${extra}><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
const DEFS=`<defs>
${grad("skyDay","#58b4f4","#dcf2ff")}${grad("skyGrey","#8793a1","#d7dde4")}${grad("skyDusk","#f08a4b","#ffe2b9")}
${grad("skyNight","#090e2c","#2b3768")}${grad("skySnow","#b3c1d2","#eef3f8")}${grad("skyHot","#ffb347","#fff0c4")}
${grad("gBody","#ffffff","#d3d9e1")}${grad("gSteel","#dfe5eb","#7b8591")}${grad("gPlat","#cdd1d6","#a4a9b1")}
${grad("gCoach","#f6f3ec","#cbc5b6")}${grad("gSea","#4b9bd0","#2a6ca0")}${grad("gRoad","#565b63","#3f434a")}
<linearGradient id="gGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1c2a38"/><stop offset="1" stop-color="#54728e"/></linearGradient>
<linearGradient id="gGlassLit" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe9a8"/><stop offset="1" stop-color="#ffd166"/></linearGradient>
<pattern id="pBal" width="9" height="7" patternUnits="userSpaceOnUse"><rect width="9" height="7" fill="#877f74"/><circle cx="2" cy="2" r="1.1" fill="#6a6359"/><circle cx="6.5" cy="5" r="1" fill="#9d958a"/><circle cx="6" cy="1.5" r=".7" fill="#5f594f"/></pattern>
<pattern id="pBrick" width="20" height="10" patternUnits="userSpaceOnUse"><rect width="20" height="10" fill="#ad6149"/><path d="M0 .5H20M0 5.5H20M5 .5V5.5M15 5.5V10.5" stroke="#d2ab97" stroke-width="1"/></pattern>
<pattern id="pMoq" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#2b3f87"/><path d="M6 2.4l2.6 3.6l-2.6 3.6l-2.6-3.6z" fill="#e85d75"/><circle cx="0" cy="0" r="1.3" fill="#ffd23f"/><circle cx="12" cy="0" r="1.3" fill="#ffd23f"/><circle cx="0" cy="12" r="1.3" fill="#ffd23f"/><circle cx="12" cy="12" r="1.3" fill="#ffd23f"/><rect x="5" y="10.6" width="2" height="1.4" fill="#2ec4b6"/><rect x="5" y="0" width="2" height="1.4" fill="#2ec4b6"/></pattern>
<clipPath id="cCab"><path d="M3 7Q3 0 10 0H160Q176 0 184 13L191 33Q194 44 185 44H3Z"/></clipPath>
<clipPath id="cMid"><path d="M3 5Q3 0 8 0H186Q191 0 191 5V44H3Z"/></clipPath>
<clipPath id="cWin"><rect x="14" y="30" width="372" height="56" rx="8"/></clipPath>
</defs>`;

/* ---------- Sky, sun, moon, clouds, stars ---------- */
const SKY=k=>`<rect width="400" height="190" fill="url(#sky${k})"/>`;
const SUN=(x,y,r=15)=>`<g transform="translate(${x} ${y})"><circle r="${r+10}" fill="#fff7c9" opacity=".55"/><g ${A("a-spin","--d:28s")}>${rep(8,i=>`<rect x="-1.6" y="${-r-9}" width="3.2" height="6" rx="1.6" fill="#ffd23f" transform="rotate(${i*45})"/>`)}</g><circle r="${r}" fill="#ffd23f"/><circle cx="${-r*.3}" cy="${-r*.3}" r="${r*.45}" fill="#fff" opacity=".25"/></g>`;
const MOON=(x,y)=>`<path d="M${x} ${y-13}a13 13 0 1 0 11 20a10.5 10.5 0 1 1 -11-20z" fill="#f6ebb8"/>`;
const STARS=()=>[[30,26],[78,14],[130,40],[176,18],[228,34],[262,12],[300,48],[346,20],[380,44],[56,54]].map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${i%3?1.1:1.6}" fill="#fff" ${A("a-pulse",`--d:${1.2+i%4*.5}s;--o:.25`)}/>`).join("");
const CLOUD=(x,y,s=1,d=40,c="#fff")=>`<g transform="translate(${x} ${y}) scale(${s})"><g ${A("a-drift",`--d:${d}s`)}><path d="M2 16a9 9 0 0 1 9-11a13 13 0 0 1 24-4a10 10 0 0 1 15 7a7.5 7.5 0 0 1 1 15H7A7 7 0 0 1 2 16z" fill="${c}" opacity=".92"/></g></g>`;

/* ---------- Scenery (each strip is 400 wide and joins up with itself, so it can scroll) ---------- */
const HILLS=(c1="#a9d691",c2="#86c477")=>`<path d="M0 136q50-26 100-14t100-6t100 8t100 12V165H0z" fill="${c1}"/><path d="M0 148q50-12 100-4t100 4t100-6t100 6V165H0z" fill="${c2}"/>`;
const TREE=(x,y,c="#4f9d4b",s=1)=>`<g transform="translate(${x} ${y}) scale(${s})"><rect x="-1.6" y="-10" width="3.2" height="11" fill="#6b4a32"/><circle cx="0" cy="-16" r="9" fill="${c}"/><circle cx="-5" cy="-11" r="6" fill="${c}"/><circle cx="5.5" cy="-11.5" r="6.5" fill="${c}"/><circle cx="-3" cy="-19" r="3" fill="#fff" opacity=".14"/></g>`;
const TREES=(c,pts=[[34,150],[92,146],[188,151],[262,145],[338,150]])=>pts.map(([x,y],i)=>TREE(x,y,c,i%2?1:.8)).join("");
const SHEEP=()=>[[60,144],[78,147],[232,142],[306,146]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="4.6" ry="3.2" fill="#fbfbf8"/><circle cx="${x-4.4}" cy="${y-1.2}" r="1.9" fill="#2b2b2b"/><path d="M${x-2} ${y+3}v2.4M${x+2} ${y+3}v2.4" stroke="#2b2b2b" stroke-width="1"/>`).join("");
const TOWN=(c="#8fa1b3",lit)=>`<path d="M0 140v-14l12-10l12 10v14h10v-22h22v22h8v-16l10-8l10 8v16h14v-26h8v-6h5v6h9v26h10v-15l11-9l11 9v15h12v-21h24v21h9v-13l9-8l9 8v13h16v-24h20v24h8v-15l12-10l12 10v15h12v-19h18v19h10v-12l10-8l10 8v12h12v-20h22v20h23V165H0z" fill="${c}"/>${lit?[[40,126],[50,126],[104,122],[174,127],[236,124],[244,132],[302,128],[354,126]].map(([x,y])=>`<rect x="${x}" y="${y}" width="4" height="5" fill="#ffd166" opacity=".9"/>`).join(""):""}`;
// Scrolls a 400-wide strip leftwards forever (d = seconds for one pass; 0 = don't move).
const BACK=(content,d=0)=>d?`<g ${A("a-loop",`--p:-400px;--d:${d}s`)}>${content}<g transform="translate(400 0)">${content}</g></g>`:content;

/* ---------- Track and overhead wires ---------- */
const TRACK=(o={})=>`<rect x="0" y="${RY}" width="400" height="${190-RY}" fill="url(#pBal)"/>
<g ${o.move?A("a-loop",`--p:-14px;--d:${o.d||.22}s`):""}>${rep(31,i=>`<rect x="${i*14-6}" y="${RY+1.5}" width="8.5" height="4.5" rx="1" fill="#4b4037"/>`)}</g>
${o.wavy?`<g ${A("a-bob","--dy:1.5px;--d:.8s")}><path d="M0 ${RY-1}${" q10-5 20 0t20 0".repeat(10)}" fill="none" stroke="url(#gSteel)" stroke-width="3.6"/></g>`
 :`<rect x="0" y="${RY-3}" width="400" height="4" fill="url(#gSteel)"/><rect x="0" y="${RY-3}" width="400" height="1" fill="#f6f8fa"/>`}`;
const MAST=x=>`<g transform="translate(${x} 0)"><rect x="-2" y="50" width="4" height="${RY-48}" fill="#7f8a96"/><rect x="-3" y="${RY-4}" width="6" height="6" fill="#5d6772"/><path d="M0 58H24" stroke="#7f8a96" stroke-width="2.4"/><path d="M0 51L22 58" stroke="#7f8a96" stroke-width="1.3"/><rect x="21" y="58" width="2" height="13" fill="#59636e"/><circle cx="22" cy="72" r="1.7" fill="#39414b"/></g>`;
const OHLE=(o={})=>`<g ${o.move?A("a-loop",`--p:-200px;--d:${o.d||3.2}s`):""}>${[-160,40,240,440,640].map(MAST).join("")}<path d="M-138 59${" q100 11 200 0".repeat(4)}" fill="none" stroke="#5b6570" stroke-width="1"/><line x1="-160" y1="72" x2="680" y2="72" stroke="#39414b" stroke-width="1.4"/>${rep(16,i=>`<line x1="${-138+i*50}" y1="${i%4===0?59:i%4===2?64.5:63}" x2="${-138+i*50}" y2="72" stroke="#5b6570" stroke-width=".7"/>`)}</g>`;

/* ---------- The train ----------
   CAR draws one carriage with its top-left at (x,y); the body is 194 long and 44 high,
   with wheels down to y+60. Options:
     cab:false   a middle carriage (no driving cab)      spin   wheels turning (sd = seconds per turn)
     pax         passengers in the windows                panto  pantograph up on the roof
     dark        lights off (night)                       driver someone in the cab
     noFront     front wheel missing                      tail   red tail light instead of headlight */
const WHEEL=(cx,o)=>`<g transform="translate(${cx} 53)"><g ${o.spin?A("a-spin",`--d:${o.sd||.45}s`):""}><circle r="7" fill="#23272e"/><circle r="5.2" fill="none" stroke="#a3acb6" stroke-width="1.3"/><path d="M-5 0H5M0-5V5" stroke="#8a939e" stroke-width="1"/><circle r="2" fill="#cfd5dc"/></g></g>`;
const BOGIE=(x,o,skip)=>`<rect x="${x-14}" y="48.5" width="28" height="5.5" rx="2.4" fill="#2f343c"/>${WHEEL(x-9,o)}${skip?"":WHEEL(x+9,o)}<rect x="${x-3}" y="50" width="6" height="6" rx="1" fill="#454c57"/>`;
const WIN=(x,w,o)=>`<rect x="${x}" y="10" width="${w}" height="14" rx="2.6" fill="url(#${o.dark?"gGlass":"gGlass"})" ${o.dark?`opacity=".9"`:""}/>${o.dark?`<rect x="${x}" y="10" width="${w}" height="14" rx="2.6" fill="#05080d" opacity=".55"/>`:`<path d="M${x+3} 23l6-12h3.4l-6 12z" fill="#fff" opacity=".2"/>`}${o.pax&&!o.dark?`<circle cx="${x+w/2+2}" cy="18.6" r="3.3" fill="#0b1118" opacity=".6"/><path d="M${x+w/2-3} 24q5-5 10 0z" fill="#0b1118" opacity=".6"/>`:""}`;
const DOOR=x=>`<rect x="${x}" y="4.5" width="17" height="39.5" rx="2" fill="var(--train,#b7007c)"/><rect x="${x}" y="4.5" width="17" height="39.5" rx="2" fill="none" stroke="#0003" stroke-width=".8"/><line x1="${x+8.5}" y1="5" x2="${x+8.5}" y2="43.5" stroke="#0004" stroke-width=".8"/><rect x="${x+2}" y="10" width="5" height="13" rx="1.6" fill="url(#gGlass)"/><rect x="${x+10}" y="10" width="5" height="13" rx="1.6" fill="url(#gGlass)"/><circle cx="${x+19.6}" cy="27" r="1.4" fill="#ffd21f" stroke="#0004" stroke-width=".4"/>`;
function CAR(x,y,o={}){
 const cab=o.cab!==false;
 const wins=cab?[[6,16],[47,18],[69,18],[91,18],[133,18]]:[[6,16],[47,18],[69,18],[91,18],[113,18],[132,14],[171,15]];
 return `<g transform="translate(${x} ${y})">
 <ellipse cx="97" cy="61.5" rx="100" ry="3.4" fill="#000" opacity=".17"/>
 <rect x="10" y="43" width="${cab?166:176}" height="7" fill="#3a404b"/><rect x="58" y="45" width="32" height="8.5" rx="1.6" fill="#252a32"/><rect x="95" y="45" width="21" height="7" rx="1.6" fill="#2b3039"/><path d="M62 48h24M62 50.5h24" stroke="#3f4651" stroke-width=".8"/>
 ${BOGIE(34,o)}${BOGIE(cab?150:160,o,o.noFront)}
 <g clip-path="url(#${cab?"cCab":"cMid"})"><rect width="196" height="44" fill="url(#gBody)"/>
  ${cab?`<rect x="169" y="0" width="27" height="44" fill="#ffd21f"/><rect x="169" y="0" width="2" height="44" fill="#e0b400"/>`:""}
  <rect x="0" y="33" width="196" height="11" fill="var(--train,#b7007c)"/><rect x="0" y="31.4" width="${cab?169:196}" height="1.6" fill="#fff" opacity=".85"/><rect x="0" y="42.5" width="196" height="1.5" fill="#0003"/></g>
 ${wins.map(([wx,w])=>WIN(wx,w,o)).join("")}${DOOR(26)}${DOOR(cab?112:150)}
 ${cab?`<rect x="157" y="10" width="9" height="13" rx="2" fill="url(#gGlass)"/>${o.driver?`<circle cx="162" cy="17.5" r="3.2" fill="#f6cfae"/><path d="M158.6 16.4a3.4 3.4 0 0 1 6.8 0z" fill="#1d3557"/>`:""}<line x1="154.5" y1="5" x2="154.5" y2="43" stroke="#0003" stroke-width=".8"/>
  <path d="M172.5 8.5Q178 9.4 181.6 15.5L185.4 26.5H172.5Z" fill="url(#gGlass)"/><path d="M174.5 24l4-12h2l-4 12z" fill="#fff" opacity=".22"/><path d="M176 26.5L182 15" stroke="#11151b" stroke-width=".9"/>
  <circle cx="187.3" cy="35.6" r="3.6" fill="${o.tail?"#ff3b30":"#fff6c9"}" opacity="${o.dark?0:.45}"/><circle cx="187.3" cy="35.6" r="2.1" fill="${o.dark?"#7c8794":o.tail?"#ff3b30":"#fffbe6"}" stroke="#0005" stroke-width=".5"/><circle cx="183.6" cy="38.8" r="1.2" fill="#c1121f"/>
  <path d="M176 44h14.5l-2.5 6.5h-13z" fill="#272c34"/><rect x="190" y="38" width="6" height="3.6" rx="1" fill="#3a404b"/>`:`<rect x="191" y="37" width="4" height="4" fill="#3a404b"/>`}
 <rect x="-2" y="37" width="5" height="4" fill="#3a404b"/>
 <rect x="14" y="-2.8" width="36" height="3.2" rx="1.6" fill="#c4cbd3"/><rect x="66" y="-2.8" width="26" height="3.2" rx="1.6" fill="#c4cbd3"/>
 ${o.panto?`<rect x="128" y="-3.4" width="26" height="3.6" rx="1" fill="#59626d"/><polyline points="132,-3 148,-14 135,-25.4" fill="none" stroke="#3a424c" stroke-width="1.7" stroke-linejoin="round"/><rect x="129" y="-27" width="24" height="2.2" rx="1" fill="#2c333c"/>`:""}
 <path d="${cab?"M3 7Q3 0 10 0H160Q176 0 184 13L191 33Q194 44 185 44H3Z":"M3 5Q3 0 8 0H186Q191 0 191 5V44H3Z"}" fill="none" stroke="#7a8490" stroke-width="1"/>
 </g>`;
}
// A two-carriage train with its cab at the right-hand end; x is where the cab carriage starts.
const TRAINSET=(x,o={})=>CAR(x-192,TY,{...o,cab:false,noFront:false,panto:false})+CAR(x,TY,o);

/* ---------- People ----------
   PERSON draws someone standing with their feet at (x,y), about 60 tall at s:1.
   Options: s (size), flip, coat/leg/skin/hair colours, pose (see POSE), face ("smile", "sad",
   "flat", "o", "grit"), eyes:"shut", brow:"cross", hat ("hard", "bowler", "beanie", "cap"),
   hivis (orange rail kit), long (long hair), tie/scarf colours,
   propR/propL (a PROP for that hand), and animation attributes for parts:
   an (whole body), armR, armL, legR, legL, headAn. extra = more SVG drawn on top.
   sit: seated facing us (knees forward). Their feet are still at (x,y); the seat should be about 19 above that. */
const SKIN=["#f6cfae","#e0a67e","#b07a55","#7d5236","#fde0c4"];
const HAIR=["#3a281c","#15151a","#7a4a21","#c9a227","#9a9a9a","#5a2d0c"];
const COATS=["#3d5a80","#bc4749","#2a9d8f","#6d597a","#e9c46a","#264653","#e76f51","#52796f","#8d99ae","#b56576"];
// Each pose is [left arm, right arm]; an arm is elbow x,y then hand x,y, measured from the shoulder.
const POSE={down:[[-2,9,-2,19],[2,9,2,19]],up:[[-6,-8,-8,-19],[6,-8,8,-19]],out:[[-9,1,-17,-3],[9,1,17,-3]],shrug:[[-8,5,-13,-5],[8,5,13,-5]],
 hold:[[-2,9,-2,19],[4,9,11,4]],watch:[[-2,9,-2,19],[6,7,3,-2]],phone:[[-2,9,-2,19],[6,6,4,-6]],hips:[[-9,6,-5,13],[9,6,5,13]],
 face:[[-7,-1,-5,-11],[7,-1,5,-11]],point:[[-2,9,-2,19],[9,-3,18,-9]],ear:[[-2,9,-2,19],[8,-2,7,-13]],both:[[-4,9,-11,4],[4,9,11,4]],
 high:[[-2,9,-2,19],[5,-7,6,-17]],palm:[[-2,9,-2,19],[6,-3,2,-12]]};
function PERSON(x,y,o={}){
 const s=o.s||1,coat=o.hivis?"#ff7a1a":(o.coat||COATS[0]),leg=o.leg||(o.hivis?"#ff7a1a":"#2b2d42"),skin=o.skin||SKIN[0],hair=o.hair||HAIR[0];
 const [L,R]=POSE[o.pose||"down"],lim=`fill="none" stroke-linecap="round" stroke-linejoin="round"`,ink="#2a1d16";
 const arm=(sx,a,an,prop)=>`<g transform="translate(${sx} -40)"><g ${an||""}><polyline points="0,0 ${a[0]},${a[1]} ${a[2]},${a[3]}" ${lim} stroke="${coat}" stroke-width="4.8"/>${prop?prop(a[2],a[3]):""}<circle cx="${a[2]}" cy="${a[3]}" r="2.5" fill="${skin}"/></g></g>`;
 const lg=(hx,fx,an)=>o.sit?`<g transform="translate(${hx*1.5} -19)"><g ${an||""}><line x1="0" y1="2" x2="${fx*.6}" y2="18" ${lim} stroke="${leg}" stroke-width="5.4"/><ellipse cx="${fx*.6+(hx<0?-1.2:1.2)}" cy="19.6" rx="3.9" ry="2.1" fill="#1c1c22"/><circle cx="0" cy="0" r="4.7" fill="${leg}"/><circle cx="0" cy="-.6" r="4.7" fill="#fff" opacity=".1"/></g></g>`
  :`<g transform="translate(${hx} -21)"><g ${an||""}><line x1="0" y1="0" x2="${fx}" y2="19" ${lim} stroke="${leg}" stroke-width="5.4"/><ellipse cx="${fx+1.2}" cy="20.4" rx="3.9" ry="2.1" fill="#1c1c22"/></g></g>`;
 const mouth={smile:`<path d="M-2.8-47.8q2.8 2.6 5.6 0" fill="none" stroke="${ink}" stroke-width="1" stroke-linecap="round"/>`,
  sad:`<path d="M-2.8-46.2q2.8-2.4 5.6 0" fill="none" stroke="${ink}" stroke-width="1" stroke-linecap="round"/>`,
  flat:`<line x1="-2.4" y1="-46.9" x2="2.4" y2="-46.9" stroke="${ink}" stroke-width="1" stroke-linecap="round"/>`,
  o:`<ellipse cx="0" cy="-46.4" rx="1.8" ry="2.2" fill="${ink}"/>`,
  grit:`<rect x="-2.8" y="-48" width="5.6" height="2.2" rx=".7" fill="#fff" stroke="${ink}" stroke-width=".6"/>`}[o.face||"flat"];
 const eyes=o.eyes==="shut"?`<path d="M-3.8-51h2.6M1.2-51h2.6" stroke="#1a1a1a" stroke-width=".9" stroke-linecap="round"/>`
  :o.face==="o"?`<circle cx="-2.6" cy="-51.4" r="1.7" fill="#fff"/><circle cx="2.6" cy="-51.4" r="1.7" fill="#fff"/><circle cx="-2.6" cy="-51.4" r=".85" fill="#1a1a1a"/><circle cx="2.6" cy="-51.4" r=".85" fill="#1a1a1a"/>`
  :`<circle cx="-2.6" cy="-51.2" r=".95" fill="#1a1a1a"/><circle cx="2.6" cy="-51.2" r=".95" fill="#1a1a1a"/>`;
 const brow=o.brow==="cross"?`<path d="M-4.4-53.8l3.2 1.1M4.4-53.8l-3.2 1.1" stroke="${ink}" stroke-width=".9" stroke-linecap="round"/>`:o.brow==="up"?`<path d="M-4.2-54.4q1.6-1 3.2 0M1-54.4q1.6-1 3.2 0" fill="none" stroke="${ink}" stroke-width=".8" stroke-linecap="round"/>`:"";
 const hat={hard:`<path d="M-7.6-52.6a7.6 7.9 0 0 1 15.2 0z" fill="#fff" stroke="#c4cad2" stroke-width=".6"/><rect x="-9" y="-53.6" width="18" height="2" rx="1" fill="#eef1f4" stroke="#c4cad2" stroke-width=".4"/>`,
  bowler:`<path d="M-6.6-54.4a6.6 6.8 0 0 1 13.2 0z" fill="#17171b"/><rect x="-9.6" y="-55.2" width="19.2" height="2.2" rx="1.1" fill="#17171b"/>`,
  beanie:`<path d="M-7.3-52.4a7.3 7.8 0 0 1 14.6 0z" fill="${o.hatc||"#c1121f"}"/><rect x="-7.7" y="-54.2" width="15.4" height="2.8" rx="1.3" fill="${o.hatc2||"#fff"}"/><circle cx="0" cy="-60.8" r="2.1" fill="${o.hatc2||"#fff"}"/>`,
  cap:`<path d="M-7.1-52.8a7.1 7.4 0 0 1 14.2 0z" fill="${o.hatc||"#1d3557"}"/><rect x="-1" y="-54.4" width="11.5" height="1.9" rx=".9" fill="${o.hatc||"#1d3557"}"/>`}[o.hat]||"";
 const hairS=o.hat?(o.long?`<path d="M-7.4-50v8h2.2v-8zM7.4-50v8h-2.2v-8z" fill="${hair}"/>`:"")
  :o.long?`<path d="M-7.6-50a7.6 7.6 0 0 1 15.2 0v8h-2.4v-7q-2.6-4-5.2-3.6t-5.2 3.6v7h-2.4z" fill="${hair}"/>`
  :o.bald?"":`<path d="M-7.1-51.6a7.1 7.2 0 0 1 14.2 0q-3.2-3.8-7.1-3.4t-7.1 3.4z" fill="${hair}"/>`;
 const torso=`<rect x="-8.3" y="-43.6" width="16.6" height="25.8" rx="5.6" fill="${coat}"/>`
  +(o.hivis?`<rect x="-8.3" y="-34" width="16.6" height="2.5" fill="#eef1f4"/><rect x="-8.3" y="-27.6" width="16.6" height="2.5" fill="#eef1f4"/><path d="M-4.4-43.4v9.6M4.4-43.4v9.6" stroke="#eef1f4" stroke-width="2.1"/>`:"")
  +(o.tie?`<path d="M-3.4-43.6h6.8l-3.4 8z" fill="#fff"/><path d="M-1-43.2l1 8.6l1-8.6z" fill="${o.tie}"/>`:"")
  +(o.scarf?`<rect x="-5.6" y="-45.2" width="11.2" height="4.4" rx="2.2" fill="${o.scarf}"/><rect x="2" y="-42" width="3.8" height="9.5" rx="1.5" fill="${o.scarf}"/>`:"")
  +(o.bag?`<path d="M-7-42L7-24" stroke="#3b271b" stroke-width="1.6"/><rect x="4" y="-25" width="9" height="8" rx="2" fill="#5b3d2a"/>`:"");
 const head=`<g transform="translate(0 -44)"><g ${o.headAn||""}><g transform="translate(0 44)"><circle cx="0" cy="-51" r="7" fill="${skin}"/>${hairS}${hat}${brow}${eyes}${mouth}${o.headExtra||""}</g></g></g>`;
 return `<g transform="translate(${x} ${y}) scale(${o.flip?-s:s} ${s})"><ellipse cx="0" cy="1.2" rx="11" ry="2.3" fill="#000" opacity=".16"/><g ${o.an||""}>
 ${o.sit?torso+lg(-3.2,-1.4,o.legL)+lg(3.2,1.4,o.legR):lg(-3.2,-1.4,o.legL)+lg(3.2,1.4,o.legR)+torso}${head}${arm(-7,L,o.armL,o.propL)}${arm(7,R,o.armR,o.propR)}${o.extra||""}</g></g>`;
}
// Things people hold. Each is drawn at the hand's position (hx,hy).
const PROP={
 coffee:(x,y)=>`<path d="M${x-3.2} ${y-8}h6.6l-.9 9.4h-4.8z" fill="#fff" stroke="#c4cad2" stroke-width=".4"/><rect x="${x-3.6}" y="${y-9.4}" width="7.4" height="1.9" rx=".9" fill="#6b4a32"/><rect x="${x-2.9}" y="${y-5}" width="6" height="3.2" fill="#b98a4e"/>`,
 case:(x,y)=>`<path d="M${x-2.6} ${y+2.4}v-2.2h5.2v2.2" fill="none" stroke="#3b271b" stroke-width="1.3"/><rect x="${x-7.5}" y="${y+2}" width="15" height="10.5" rx="1.7" fill="#5b3d2a"/><rect x="${x-1}" y="${y+5.6}" width="2" height="2.2" fill="#d9b25f"/>`,
 phone:(x,y)=>`<rect x="${x-2.2}" y="${y-6}" width="4.5" height="8" rx="1.1" fill="#15171c"/><rect x="${x-1.6}" y="${y-5.2}" width="3.3" height="5.8" rx=".5" fill="#8fd0ff"/>`,
 paper:(x,y)=>`<rect x="${x-15}" y="${y-10}" width="17" height="15" rx="1" fill="#f6f3ea" stroke="#b9b3a3" stroke-width=".5"/><rect x="${x-13.4}" y="${y-8.4}" width="13.6" height="2.4" fill="#3a3a3a"/>${rep(3,i=>`<line x1="${x-13.4}" y1="${y-3.4+i*2.6}" x2="${x+.2}" y2="${y-3.4+i*2.6}" stroke="#8d8778" stroke-width=".8"/>`)}`,
 tea:(x,y)=>`<path d="M${x+3.2} ${y-4.4}q3.4.6 1.6 4" fill="none" stroke="#fff" stroke-width="1.2"/><path d="M${x-3.2} ${y-5.4}h6.8l-.9 6.6h-5z" fill="#fff" stroke="#c4cad2" stroke-width=".4"/><rect x="${x-2.6}" y="${y-4.8}" width="5.6" height="1.2" fill="#a86b3c"/>`,
 chips:(x,y)=>`${rep(4,i=>`<rect x="${x-3.4+i*2}" y="${y-11.5+(i%2)}" width="1.6" height="6.5" rx=".5" fill="#f2c14e" stroke="#c9972b" stroke-width=".3"/>`)}<path d="M${x-4.4} ${y-6}h9l-4.5 10.5z" fill="#f7f4ec" stroke="#c9c2b0" stroke-width=".5"/>`,
 icecream:(x,y)=>`<path d="M${x-3.2} ${y-4}h6.4l-3.2 9.5z" fill="#d9a35f"/><circle cx="${x}" cy="${y-6}" r="4.2" fill="#ffd9ec"/><path d="M${x-3} ${y-3.2}q1 5 0 7" fill="none" stroke="#ffd9ec" stroke-width="1.6" stroke-linecap="round"/>`,
 spanner:(x,y)=>`<g transform="rotate(-30 ${x} ${y})"><rect x="${x-1.3}" y="${y-17}" width="2.6" height="18" rx="1.2" fill="#aeb6c0" stroke="#6c7682" stroke-width=".4"/><path d="M${x-3.8} ${y-20}a3.8 3.8 0 0 1 7.6 0l-2.2 3.4h-3.2z" fill="#aeb6c0" stroke="#6c7682" stroke-width=".4"/></g>`,
 saw:(x,y)=>`<path d="M${x+1} ${y-2}l14 .5l-14 4z" fill="#d5dbe2" stroke="#7d8794" stroke-width=".5"/><rect x="${x-3.6}" y="${y-3}" width="5.6" height="6" rx="1.8" fill="#b9652a"/>`,
 ext:(x,y)=>`<rect x="${x-3}" y="${y-1}" width="6.4" height="12" rx="2.4" fill="#d62828"/><rect x="${x-1.4}" y="${y-3.4}" width="3.2" height="3" fill="#222"/><path d="M${x+2} ${y-2.4}q6-2 8 3" fill="none" stroke="#222" stroke-width="1.3"/>`,
 blower:(x,y)=>`<rect x="${x-5}" y="${y-5}" width="9" height="9.5" rx="2.4" fill="#2f343c"/><path d="M${x+3} ${y-3}h19l1.5 5h-20.5z" fill="#f2a000" stroke="#b97800" stroke-width=".4"/>`
};

/* ---------- Station furniture ---------- */
const WALL=(y0=58)=>`<rect x="0" y="${y0}" width="400" height="${150-y0}" fill="url(#pBrick)"/><rect x="0" y="${y0}" width="400" height="${150-y0}" fill="#1d1410" opacity=".12"/><rect x="0" y="${y0-3}" width="400" height="4" fill="#d9cdbd"/>`;
const POSTER=(x,y,c1,c2)=>`<rect x="${x}" y="${y}" width="30" height="40" rx="1.5" fill="#f4f1ea" stroke="#3a404b" stroke-width="1.6"/><rect x="${x+3}" y="${y+3}" width="24" height="18" fill="${c1}"/><circle cx="${x+15}" cy="${y+12}" r="5" fill="${c2}"/><path d="M${x+4} ${y+26}h22M${x+4} ${y+30}h22M${x+4} ${y+34}h14" stroke="#8d8778" stroke-width="1.4"/>`;
const PLAT=(y=150)=>`<rect x="0" y="${y}" width="400" height="${190-y}" fill="url(#gPlat)"/><rect x="0" y="${y}" width="400" height="1.5" fill="#e9ecef"/>
<rect x="0" y="${y+27}" width="400" height="4" fill="#ffd21f"/><rect x="0" y="${y+33.5}" width="400" height="4.5" fill="#f6f7f8"/><path d="M0 ${y+24}H400" stroke="#8f959d" stroke-width="3" stroke-dasharray="2 3" opacity=".7"/>`;
const CANOPY=(cols=[66,334])=>`<rect x="0" y="0" width="400" height="20" fill="#48535e"/><path d="M0 6H400M0 13H400" stroke="#3b454f" stroke-width="1"/><rect x="0" y="19" width="400" height="5" fill="#2f5d50"/><rect x="0" y="36" width="400" height="16" fill="#000" opacity=".1"/>
${rep(40,i=>`<path d="M${i*10+.4} 24h9.2v7l-4.6 5l-4.6-5z" fill="${i%2?"#f5efdc":"#ebe3cc"}"/>`)}
${cols.map(x=>`<path d="M${x-3} 50q-15-3-19-25M${x+3} 50q15-3 19-25" fill="none" stroke="#2f5d50" stroke-width="2.8" stroke-linecap="round"/><circle cx="${x-10.5}" cy="33" r="3" fill="none" stroke="#2f5d50" stroke-width="1.6"/><circle cx="${x+10.5}" cy="33" r="3" fill="none" stroke="#2f5d50" stroke-width="1.6"/><rect x="${x-3}" y="24" width="6" height="126" fill="#2f5d50"/><rect x="${x-1.4}" y="24" width="1.6" height="126" fill="#fff" opacity=".14"/><rect x="${x-5}" y="143" width="10" height="7" rx="1" fill="#234a3f"/>`).join("")}`;
// A dot-matrix departure board. rows: {l: left text, r: right text, c: "r" red / "g" green (lc for the left text),
// rb / lb: blink timing for the right / left text, alt: [three texts] that take turns on the right}.
const FIT=(t,n)=>{t=String(t||"");return t.length>n?t.slice(0,Math.max(1,n-1))+"…":t};
const BOARD=(x,y,w,rows,o={})=>{rows=rows.map(r=>({...r,l:FIT(r.l,Math.floor((w-16)/5.15)-(r.alt?r.alt[0].length:String(r.r||"").length)-1)}));return `<g transform="translate(${x} ${y})">${o.rods===false?"":`<rect x="12" y="${-(o.drop||12)}" width="2.6" height="${o.drop||12}" fill="#59636e"/><rect x="${w-14.6}" y="${-(o.drop||12)}" width="2.6" height="${o.drop||12}" fill="#59636e"/>`}
<rect width="${w}" height="${rows.length*12+9}" rx="3.4" fill="#12151a" stroke="#3a414c" stroke-width="1.8"/><rect x="2.5" y="2.5" width="${w-5}" height="${rows.length*12+4}" rx="2" fill="none" stroke="#000" stroke-width=".8"/>
${rows.map((r,i)=>`<text x="7" y="${i*12+14.4}" class="led ${r.lc||""} ${r.lb?"a-blink":""}" style="${r.lb||""}">${r.l||""}</text>${r.alt?r.alt.map((t,k)=>`<text x="${w-7}" y="${i*12+14.4}" text-anchor="end" class="led ${r.c||""} ph${k+1}" style="--d:${r.d||7.5}s">${t}</text>`).join(""):`<text x="${w-7}" y="${i*12+14.4}" text-anchor="end" class="led ${r.c||""} ${r.rb?"a-blink":""}" style="${r.rb||""}">${r.r||""}</text>`}`).join("")}</g>`};
const CLOCK=(x,y,d=60)=>`<g transform="translate(${x} ${y})"><rect x="-1.6" y="-34" width="3.2" height="20" fill="#59636e"/><circle r="15" fill="#22262d"/><circle r="12.6" fill="#fdfdfb"/>${rep(12,i=>`<line x1="0" y1="-11.4" x2="0" y2="${i%3?-9.6:-8.6}" stroke="#22262d" stroke-width="${i%3?.8:1.6}" transform="rotate(${i*30})"/>`)}<line x1="0" y1="0" x2="5.4" y2="-3.2" stroke="#22262d" stroke-width="2.1" stroke-linecap="round"/><g ${A("a-spin",`--d:${d}s`)}><line x1="0" y1="1.6" x2="0" y2="-9.6" stroke="#22262d" stroke-width="1.5" stroke-linecap="round"/></g><circle r="1.5" fill="#c1121f"/></g>`;
const NAMEBOARD=(x,y,t)=>{const w=t.length*5.6+18;return `<rect x="${x+5}" y="${y+14}" width="2.6" height="${150-y-14}" fill="#59636e"/><rect x="${x+w-7.6}" y="${y+14}" width="2.6" height="${150-y-14}" fill="#59636e"/><rect x="${x}" y="${y}" width="${w}" height="16" rx="2.4" fill="#1d3557" stroke="#fff" stroke-width="1.2"/><text x="${x+w/2}" y="${y+11.3}" text-anchor="middle" class="name">${t}</text>`};
const BENCH=(x,y)=>`<path d="M${x+5} ${y-15}v15M${x+43} ${y-15}v15M${x+3} ${y}h5M${x+41} ${y}h5" stroke="#2c323a" stroke-width="2.4" stroke-linecap="round"/><rect x="${x}" y="${y-18}" width="48" height="4" rx="1.6" fill="#8a5a2b"/><rect x="${x+1}" y="${y-31}" width="46" height="3.6" rx="1.6" fill="#8a5a2b"/><rect x="${x+1}" y="${y-25}" width="46" height="3.6" rx="1.6" fill="#7a4f25"/><path d="M${x+4} ${y-31}v15M${x+44} ${y-31}v15" stroke="#2c323a" stroke-width="2"/>`;
const LAMP=(x,y,lit)=>`${lit?`<path d="M${x-4} ${y-62}L${x-30} ${y}H${x+22}L${x+8} ${y-62}z" fill="#ffe9a8" opacity=".2"/>`:""}<rect x="${x-1.6}" y="${y-66}" width="3.2" height="66" fill="#3a424c"/><path d="M${x-9} ${y-66}h18l-3-7h-12z" fill="#2c333c"/><rect x="${x-6.5}" y="${y-66}" width="13" height="3" rx="1.4" fill="${lit?"#fff3bf":"#cfd5dc"}"/><rect x="${x-3.4}" y="${y-3}" width="6.8" height="3" fill="#2c333c"/>`;
const TANNOY=(x,y)=>`<g transform="translate(${x} ${y})"><rect x="-1.4" y="-30" width="2.8" height="24" fill="#59636e"/><rect x="-6" y="-7" width="7" height="14" rx="1.5" fill="#4a535e"/><path d="M0-6l16-8v28l-16-8z" fill="#b7bfc8" stroke="#59636e" stroke-width="1.2" stroke-linejoin="round"/><ellipse cx="16" cy="0" rx="2.6" ry="14" fill="#8e98a4" stroke="#59636e" stroke-width="1"/>
${rep(3,i=>`<path d="M${23+i*6} ${-8-i*2}q${5+i} ${8+i*2} 0 ${16+i*4}" fill="none" stroke="#1b1f27" stroke-width="1.6" stroke-linecap="round" ${A("a-pulse",`--d:.7s;--o:.1;animation-delay:${i*.2}s`)}/>`)}</g>`;
// A speech bubble whose tail points at (tx,ty); the box's top-left is (bx,by).
const BUBBLE=(tx,ty,bx,by,w,lines,an="")=>{const h=lines.length*11+9,above=by+h<=ty,ey=above?by+h:by,cx=Math.max(bx+11,Math.min(bx+w-11,tx+(bx+w/2>tx?9:-9)));
 return `<g transform="translate(${tx} ${ty})"><g ${an}><g transform="translate(${-tx} ${-ty})"><path d="M${cx-5.5} ${ey}L${tx} ${ty}L${cx+5.5} ${ey}z" fill="#fff" stroke="#1b1f27" stroke-width="1.4" stroke-linejoin="round"/><rect x="${bx}" y="${by}" width="${w}" height="${h}" rx="7.5" fill="#fff" stroke="#1b1f27" stroke-width="1.4"/><rect x="${cx-4.6}" y="${ey-1.4}" width="9.2" height="2.8" fill="#fff"/>
 ${lines.map((l,i)=>`<text x="${bx+w/2}" y="${by+13.4+i*11}" text-anchor="middle" class="say">${l}</text>`).join("")}</g></g></g>`};
// The caption chip.
const CAP=(t,x=8,y=8)=>`<rect x="${x}" y="${y}" width="${(t.length*6.42+15).toFixed(1)}" height="16" rx="8" fill="#0d1016" opacity=".84"/><text x="${x+7.5}" y="${y+11.4}" class="cap">${t}</text>`;
// A colour-light signal standing by the track. asp: "r", "y", "g", or "x" for all three flashing at random.
const SIGNAL=(x,asp="r")=>{const lamp=(i,col,on,d)=>{const an=asp==="x"?A("a-blink",`--d:${d}s;--o:0`):on?A("a-pulse","--d:1.1s;--o:.55"):"";return on||asp==="x"?`<circle cx="0" cy="${-59+i*9.6}" r="7.5" fill="${col}" opacity=".3" ${an}/><circle cx="0" cy="${-59+i*9.6}" r="3.6" fill="${col}" ${an}/>`:`<circle cx="0" cy="${-59+i*9.6}" r="3.6" fill="#1d2127"/>`};
 return `<g transform="translate(${x} ${RY})"><rect x="-1.7" y="-44" width="3.4" height="46" fill="#6c7682"/><path d="M-6.5 0v-31M-6.5-6h5M-6.5-13h5M-6.5-20h5M-6.5-27h5" stroke="#8a94a0" stroke-width="1.1" fill="none"/>
 <rect x="-7.5" y="-67" width="15" height="34" rx="4.4" fill="#0f1216" stroke="#2c323a" stroke-width="1"/>${rep(3,i=>`<circle cx="0" cy="${-59+i*9.6}" r="3.6" fill="#1d2127"/><path d="M-4.4 ${-61.6+i*9.6}q4.4-4.4 8.8 0" fill="none" stroke="#2c323a" stroke-width="1.5"/>`)}
 ${lamp(0,"#35e06f",asp==="g",.37)}${lamp(1,"#ffc21a",asp==="y",.53)}${lamp(2,"#ff3b30",asp==="r",.71)}
 <rect x="-6" y="-31.5" width="12" height="6.5" rx="1" fill="#f4f5f7" stroke="#59636e" stroke-width=".5"/><text x="0" y="-26.6" text-anchor="middle" class="tiny">UR 86</text></g>`};

/* ---------- Weather and effects ---------- */
const RAIN=(n=22,fx=-46)=>rep(n,i=>`<line x1="${(i*53)%440}" y1="${(i*31)%70-8}" x2="${(i*53)%440+fx/9}" y2="${(i*31)%70+2}" stroke="#d9ebfb" stroke-width="1.2" stroke-linecap="round" opacity=".85" ${A("a-fall",`--fx:${fx}px;--fy:235px;--d:.75s;animation-delay:${(-i*.137).toFixed(2)}s`)}/>`);
const SNOW=(n=26)=>rep(n,i=>`<circle cx="${(i*47)%420}" cy="${(i*29)%80-10}" r="${1.4+i%3*.7}" fill="#fff" ${A("a-fall",`--fx:${-18+(i%5)*6}px;--fy:230px;--d:${3.4+i%4*.7}s;animation-delay:${(-i*.41).toFixed(2)}s`)}/>`);
const LEAVES=(n=12,c=["#d9822b","#c9541d","#e3b23c"])=>rep(n,i=>`<ellipse cx="${(i*71)%420}" cy="${(i*37)%60-6}" rx="4.4" ry="2.3" fill="${c[i%3]}" ${A("a-fall",`--fx:${-70+(i%4)*14}px;--fy:226px;--fr:${300+i*40}deg;--d:${3.2+i%3*.9}s;animation-delay:${(-i*.53).toFixed(2)}s`)}/>`);
const SMOKE=(x,y,n=4,o={})=>rep(n,i=>`<g transform="translate(${x+(i%2)*5} ${y})"><circle r="${o.r||8}" fill="${o.c||"#4d5259"}" fill-opacity=".5" ${A("a-rise",`--d:${o.d||3}s;--rx:${o.rx??16}px;--ry:${o.ry??-52}px;--s1:${o.s1||2.4};animation-delay:${(-i*(o.d||3)/n).toFixed(2)}s`)}/></g>`);
const STEAM=(x,y)=>rep(2,i=>`<g transform="translate(${x+i*4} ${y})"><path d="M0 0q-3-4 0-8t0-8" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".85" ${A("a-rise",`--d:2.2s;--rx:2px;--ry:-12px;--s0:1;--s1:1.1;animation-delay:${-i*1.1}s`)}/></g>`);
const FLAME=(x,y,s=1,d=.3)=>`<g transform="translate(${x} ${y}) scale(${s})"><g ${A("a-flick",`--d:${d}s`)}><path d="M0 0q-10-9-2-24q2 8 6 4q6 13-4 20z" fill="#ff6a13"/><path d="M0-1q-5-5-1-13q1 4 3 3q3 7-2 10z" fill="#ffd23f"/></g></g>`;
const SPARKS=(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})">${[[-9,-6],[8,-9],[11,3],[-7,7],[1,-12],[-12,1]].map(([a,b],i)=>`<line x1="${a*.35}" y1="${b*.35}" x2="${a}" y2="${b}" stroke="${i%2?"#fff":"#ffd23f"}" stroke-width="1.7" stroke-linecap="round" ${A("a-blink",`--d:${.28+i*.07}s;--o:0`)}/>`).join("")}<circle r="2.6" fill="#fff" ${A("a-blink","--d:.2s;--o:.2")}/></g>`;
const ZZZ=(x,y,c="#e3e9ff")=>rep(3,i=>`<g transform="translate(${x+i*7} ${y-i*6})"><text ${A("zz a-rise",`font-size:${10+i*3}px;fill:${c};--d:3s;--rx:8px;--ry:-16px;--s0:1;--s1:1.2;--o0:1;animation-delay:${-i}s`)}>z</text></g>`);
const NOTE=(x,y,i=0)=>`<g transform="translate(${x} ${y})"><g ${A("a-rise",`--d:2.4s;--rx:12px;--ry:-30px;--s0:1;--s1:1.15;--o0:1;animation-delay:${-i*.8}s`)}><ellipse cx="-3" cy="5" rx="3.6" ry="2.7" fill="#1b1f27" transform="rotate(-20 -3 5)"/><rect x="-.4" y="-8" width="1.7" height="13" fill="#1b1f27"/><path d="M1.3-8q5 1 5 7q-2-3-5-3z" fill="#1b1f27"/></g></g>`;
// Zooms a group of people (and their speech bubbles) in around a point on the platform, so faces read on a phone.
const ZOOM=(inner,k=1.17,cx=200,cy=182)=>`<g transform="translate(${cx} ${cy}) scale(${k}) translate(${-cx} ${-cy})">${inner}</g>`;
const SPARKLE=(x,y,i=0,c="#ffd23f")=>`<path d="M${x} ${y-7}l1.9 5.1l5.1 1.9l-5.1 1.9l-1.9 5.1l-1.9-5.1l-5.1-1.9l5.1-1.9z" fill="${c}" ${A("a-pulse",`--d:.7s;--o:.15;animation-delay:${-i*.23}s`)}/>`;

/* ---------- Animals ---------- */
// A pigeon facing left, standing at (x,y). headAn makes it peck or bob.
const PIGEON=(x,y,o={})=>`<g transform="translate(${x} ${y}) scale(${(o.flip?-1:1)*(o.s||1)} ${o.s||1})"><g ${o.an||""}><path d="M-2-3l-1.4 3M3-3l.8 3" stroke="#e58a8a" stroke-width="1.3" stroke-linecap="round"/>
<ellipse cx="1" cy="-8" rx="9.4" ry="5.8" fill="#8e98a6"/><path d="M3-11.4q9 .6 13 7.4q-9 1.6-15-2z" fill="#6f7987"/><path d="M1-9.4h7M2-7.2h6" stroke="#4d5662" stroke-width=".9"/>
<g transform="translate(-6 -9.6)"><g ${o.headAn||""}><path d="M0 0q-.6-6-3.6-9" stroke="#5a9a82" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="-4.6" cy="-10.6" r="3.7" fill="#8e98a6"/><path d="M-7.9-11l-3.8 1.1l3.6 1.3z" fill="#3c434d"/><circle cx="-5.5" cy="-11.3" r="1.05" fill="#f28c28"/><circle cx="-5.5" cy="-11.3" r=".5" fill="#111"/></g></g></g></g>`;
const GULL=()=>`<g transform="translate(2 -1)"><g ${A("a-rock","--a0:26deg;--a1:-24deg;--d:.2s")}><path d="M0 0q9-10 21-6.4q-8 2.4-12 8.4z" fill="#dfe5eb" stroke="#aeb7c1" stroke-width=".5"/><path d="M21-6.4l-6.4.8l3.8 2z" fill="#22262d"/></g></g>
<ellipse rx="9.4" ry="4.8" fill="#fff" stroke="#c4ccd5" stroke-width=".6"/><path d="M8 .4l7-1.8l-1.4 3.8z" fill="#fff" stroke="#c4ccd5" stroke-width=".5"/><circle cx="-8.6" cy="-2.6" r="3.5" fill="#fff" stroke="#c4ccd5" stroke-width=".5"/><path d="M-11.6-2.8l-5.4 1.7l5.2 1.1z" fill="#f2a000"/><circle cx="-9.6" cy="-3.4" r=".75" fill="#111"/>
<g transform="translate(-2 -1)"><g ${A("a-rock","--a0:-26deg;--a1:24deg;--d:.2s")}><path d="M0 0q-9-10-21-6.4q8 2.4 12 8.4z" fill="#cdd5dd" stroke="#aeb7c1" stroke-width=".5"/><path d="M-21-6.4l6.4.8l-3.8 2z" fill="#22262d"/></g></g>`;
// A cross swan facing left, standing at (x,y), wings beating.
const SWAN=(x,y,k=1.25)=>`<g transform="translate(${x} ${y}) scale(${k})"><path d="M-3-4v4h-4M5-4v4h-4" stroke="#22262d" stroke-width="1.6" fill="none" stroke-linecap="round"/>
<g transform="translate(6 -14)"><g ${A("a-rock","--a0:-14deg;--a1:18deg;--d:.32s")}><path d="M0 0q8-22 30-26q-5 14-9 30q-10 4-21-4z" fill="#f1f4f7" stroke="#8c99a6" stroke-width=".8"/><path d="M12-10q6-6 13-9M10-3q7-4 12-6" stroke="#cfd6dd" stroke-width=".8" fill="none"/></g></g>
<path d="M-15-9q0-9 13-10t21 7q4 6-3 10t-22 2q-9-2-9-9z" fill="#fff" stroke="#8c99a6" stroke-width=".8"/><path d="M17-12l8-4l-4 8z" fill="#fff" stroke="#8c99a6" stroke-width=".7"/>
<path d="M-11-13q-9-6-6-19q2-8-4-10" fill="none" stroke="#8c99a6" stroke-width="6.6" stroke-linecap="round"/><path d="M-11-13q-9-6-6-19q2-8-4-10" fill="none" stroke="#fff" stroke-width="5.1" stroke-linecap="round"/>
<circle cx="-21.6" cy="-42.6" r="3.8" fill="#fff" stroke="#8c99a6" stroke-width=".7"/><path d="M-24.4-44.6l-8 2.6l7.6 2z" fill="#f28c28" stroke="#b9652a" stroke-width=".4"/><circle cx="-24.8" cy="-44.8" r="1.4" fill="#111"/><circle cx="-22.4" cy="-43.6" r=".65" fill="#111"/><path d="M-24.6-45.6l2.6-1.6" stroke="#111" stroke-width=".8"/>
<g transform="translate(-3 -13)"><g ${A("a-rock","--a0:14deg;--a1:-20deg;--d:.32s")}><path d="M0 0q-6-22 10-34q4 16-1 33q-5 4-9 1z" fill="#fff" stroke="#8c99a6" stroke-width=".8"/><path d="M3-8q0-10 6-18M6-4q2-8 4-14" stroke="#cfd6dd" stroke-width=".8" fill="none"/></g></g></g>`;
const SNAIL=()=>`<path d="M-12 0h22q5 0 5-5q0-4-4-4" fill="none" stroke="#b7c98a" stroke-width="5" stroke-linecap="round"/><path d="M11-9l2-7M8-9l-1-7" stroke="#b7c98a" stroke-width="1.5" stroke-linecap="round"/><circle cx="13" cy="-16.5" r="1.3" fill="#222"/><circle cx="7" cy="-16.5" r="1.3" fill="#222"/><circle cx="-2" cy="-8" r="9" fill="#b98a4e" stroke="#7a5a2c" stroke-width="1.2"/><path d="M-2-8m-5 0a5 5 0 1 1 7 4.6a2.8 2.8 0 1 1-2.6-4.4" fill="none" stroke="#7a5a2c" stroke-width="1.3"/>`;
const DUCK=()=>`<path d="M-11-3q0-7 9-7t13 3l5-2l-2 6q-2 5-12 5t-13-5z" fill="#9a7b5a" stroke="#6b5338" stroke-width=".7"/><path d="M-2-6q5-2 9 1" stroke="#fff" stroke-width="1" fill="none"/><circle cx="-10" cy="-11" r="4.4" fill="#1f7a4d"/><rect x="-11.6" y="-8" width="4" height="1.6" fill="#fff"/><path d="M-13.8-11.6l-5.4 1.4l5.2 1.6z" fill="#f2c14e"/><circle cx="-11.2" cy="-12" r=".7" fill="#111"/>`;
const CROW=(x,y)=>`<g transform="translate(${x} ${y})"><ellipse cx="1" cy="-7" rx="8" ry="4.8" fill="#17181c"/><path d="M5-9l10 5l-11 1z" fill="#17181c"/><circle cx="-6" cy="-11" r="3.6" fill="#17181c"/><path d="M-9-11.6l-5 1.6l5 1z" fill="#3a3d45"/><circle cx="-6.8" cy="-11.6" r=".7" fill="#fff"/><path d="M-1-2v2M3-2v2" stroke="#17181c" stroke-width="1.2"/></g>`;

/* ---------- Road vehicles ---------- */
// A tired old rail replacement coach, 176 long, wheels down to y+60.
const COACH=()=>`<ellipse cx="88" cy="61" rx="94" ry="3.6" fill="#000" opacity=".22"/><rect x="-6" y="45" width="10" height="3" rx="1.5" fill="#2c323a"/>
<path d="M4 9Q4 0 14 0H150Q165 0 169 12L174 31V52H4Z" fill="url(#gCoach)" stroke="#8d8676" stroke-width="1"/>
<rect x="4" y="29" width="170" height="5.5" fill="#2a9d8f"/><rect x="4" y="35.5" width="170" height="2.2" fill="#e9c46a"/>
${rep(6,i=>`<rect x="${11+i*21.5}" y="7" width="18.5" height="16" rx="2.6" fill="url(#gGlass)"/><circle cx="${17+i*21.5}" cy="16.5" r="3.7" fill="${SKIN[i%5]}"/><circle cx="${24.5+i*21.5}" cy="14.6" r="3.7" fill="${SKIN[(i+2)%5]}"/><path d="M${15+i*21.5} 18h4M${22.5+i*21.5} 16.2h4" stroke="#2a1d16" stroke-width=".8" stroke-linecap="round"/><path d="M${13+i*21.5} 22l5-14h2.4l-5 14z" fill="#fff" opacity=".16"/>`)}
<path d="M144 4.5H158Q164 6 166.4 13L170 26H144Z" fill="url(#gGlass)"/><path d="M147 24l5-17h3l-5 17z" fill="#fff" opacity=".18"/><rect x="141" y="4" width="2.4" height="46" fill="#bfb9a8"/>
<rect x="51" y="39.5" width="70" height="10" rx="2" fill="#12151a" stroke="#3a414c" stroke-width="1"/><text x="86" y="47" text-anchor="middle" class="led" style="font-size:6.2px">RAIL REPLACEMENT</text><ellipse cx="50" cy="26" rx="5" ry="2.6" fill="#a8703a" opacity=".55"/><ellipse cx="128" cy="43" rx="4" ry="2" fill="#a8703a" opacity=".5"/>
<path d="M22 52a13 13 0 0 1 26 0zM124 52a13 13 0 0 1 26 0z" fill="#2c323a"/>
${[35,137].map(cx=>`<g transform="translate(${cx} 52)"><g ${A("a-spin","--d:1.6s")}><circle r="9.5" fill="#1d2025"/><circle r="5" fill="#9aa3ad"/><path d="M-5 0H5M0-5V5" stroke="#5d6772" stroke-width="1.2"/></g></g>`).join("")}
<circle cx="171" cy="42" r="2.6" fill="#fff6c9" stroke="#8d8676" stroke-width=".6"/><path d="M168 8l8-5" stroke="#2c323a" stroke-width="1.4"/><ellipse cx="177.5" cy="2.4" rx="2.6" ry="3.6" fill="#2c323a"/>`;
// A night bus, 160 long and 78 high.
const DECKER=()=>`<ellipse cx="80" cy="87" rx="88" ry="3.6" fill="#000" opacity=".3"/><path d="M2 8Q2 0 10 0H144Q156 0 158 10V78H2Z" fill="#d62828" stroke="#8f1a1a" stroke-width="1"/><rect x="2" y="37" width="156" height="4" fill="#f4f1ea"/><rect x="2" y="70" width="156" height="8" fill="#8f1a1a"/>
${rep(6,i=>`<rect x="${8+i*22}" y="8" width="18" height="19" rx="2.4" fill="url(#gGlassLit)"/><rect x="${8+i*22}" y="46" width="18" height="19" rx="2.4" fill="url(#gGlassLit)" ${i===5?`opacity="0"`:""}/>`)}
<rect x="118" y="44" width="16" height="33" rx="2" fill="#b91f1f" stroke="#8f1a1a" stroke-width="1"/><rect x="120.5" y="47" width="11" height="15" rx="1.5" fill="url(#gGlassLit)"/>
<path d="M140 44H152Q156 44 156 50V66H140Z" fill="url(#gGlassLit)"/><rect x="142" y="30" width="15" height="6" rx="1" fill="#12151a"/>
<rect x="46" y="29" width="64" height="8.5" rx="1.5" fill="#12151a"/><text x="78" y="36" text-anchor="middle" class="led" style="font-size:6.6px">NIGHT BUS</text>
<path d="M18 78a12 12 0 0 1 24 0zM104 78a12 12 0 0 1 24 0z" fill="#3a0d0d"/>
${[30,116].map(cx=>`<g transform="translate(${cx} 78)"><g ${A("a-spin","--d:1.3s")}><circle r="9" fill="#1d2025"/><circle r="4.6" fill="#9aa3ad"/><path d="M-4.6 0H4.6M0-4.6V4.6" stroke="#5d6772" stroke-width="1.2"/></g></g>`).join("")}
<circle cx="155" cy="72" r="2.4" fill="#fff6c9"/><path d="M158 60l40 14v8l-40-6z" fill="#ffe9a8" opacity=".16"/>`;

/* ---------- Ready-made backgrounds ---------- */
// A stretch of railway in the countryside. Options: sky, sun, hills colours, trees colour, move (seconds for the
// scenery to scroll past; 0 = standing still), wires:false, extra (drawn behind the track), track (TRACK options).
// A cow, facing us and chewing, with its feet at (0,0). A pheasant, facing right, feet at (0,0).
const COW=()=>`<ellipse cx="4" cy="1" rx="24" ry="2.6" fill="#000" opacity=".18"/>
<g transform="translate(25 -25)"><g ${A("a-rock","--a0:-14deg;--a1:22deg;--d:.7s")}><path d="M0 0q7 6 4 17" fill="none" stroke="#2b2b2b" stroke-width="1.8" stroke-linecap="round"/><ellipse cx="4" cy="19" rx="2.2" ry="3.4" fill="#2b2b2b"/></g></g>
${[-10,-3,12,19].map(x=>`<rect x="${x}" y="-13" width="4.4" height="12" fill="#fbfbf8" stroke="#2b2b2b" stroke-width=".8"/><rect x="${x}" y="-3" width="4.4" height="3.2" fill="#2b2b2b"/>`).join("")}
<ellipse cx="9" cy="-10" rx="4.6" ry="3.4" fill="#f4b6c2" stroke="#c9838f" stroke-width=".6"/>
<ellipse cx="5" cy="-21" rx="21" ry="11.5" fill="#fbfbf8" stroke="#2b2b2b" stroke-width="1"/><path d="M-2-31q9-3 13 3q-3 8-11 6q-5-4-2-9z" fill="#2b2b2b"/><path d="M17-24q7-1 8 5q-1 6-7 5q-4-5-1-10z" fill="#2b2b2b"/>
<g transform="translate(-17 -29)"><path d="M-7-6q-6-5-4-10q4 2 6 7zM7-6q6-5 4-10q-4 2-6 7z" fill="#e9e2cf" stroke="#2b2b2b" stroke-width=".7"/><path d="M-8-3l-8-1l6 5zM8-3l8-1l-6 5z" fill="#fbfbf8" stroke="#2b2b2b" stroke-width=".7"/>
<ellipse cx="0" cy="0" rx="8.4" ry="9.4" fill="#fbfbf8" stroke="#2b2b2b" stroke-width="1"/><path d="M1-9q7 1 7 8q-5 1-8-3z" fill="#2b2b2b"/>
<circle cx="-3.4" cy="-2" r="1.3" fill="#111"/><circle cx="3.6" cy="-2" r="1.3" fill="#111"/><path d="M-5.4-4.6h4M1.6-4.6h4" stroke="#111" stroke-width=".9" stroke-linecap="round"/>
<g ${A("a-bob","--dx:1.8px;--dy:.8px;--d:.42s")}><ellipse cx="0" cy="6.4" rx="7" ry="4.6" fill="#f4b6c2" stroke="#2b2b2b" stroke-width=".9"/><circle cx="-2.4" cy="5.4" r=".9" fill="#7a4a52"/><circle cx="2.4" cy="5.4" r=".9" fill="#7a4a52"/><path d="M-2.6 8.4q2.6 1.4 5.2 0" fill="none" stroke="#7a4a52" stroke-width=".8" stroke-linecap="round"/><path d="M5 8l5 3M6 9.4l5-1" stroke="#5c9a45" stroke-width="1.2" stroke-linecap="round"/></g></g>`;
const PHEASANT=()=>`<ellipse cx="-2" cy="1" rx="15" ry="2" fill="#000" opacity=".16"/><path d="M-2-3l-1.6 3h-2.4M3-3l1.4 3h2.6" stroke="#6b5338" stroke-width="1.3" fill="none" stroke-linecap="round"/>
<path d="M-7-9L-34-17L-8-5z" fill="#b98a4e" stroke="#7a5a2c" stroke-width=".6"/><path d="M-12-9.6l-2 2.4M-18-11.6l-2 2.6M-24-13.6l-2 2.6" stroke="#5a3d1c" stroke-width=".9"/>
<ellipse cx="0" cy="-8" rx="10" ry="6" fill="#c9692b" stroke="#8a4317" stroke-width=".6"/><path d="M-5-9q3 2 6 0M1-6q3 2 6 0M-2-11.6q3 2 6 0" fill="none" stroke="#7a3a12" stroke-width=".8"/>
<g transform="translate(7 -11)"><g ${A("a-bob","--dx:2.4px;--dy:0px;--d:.22s")}><path d="M0 0q2-6 4-9" stroke="#1f6b4a" stroke-width="4.6" fill="none" stroke-linecap="round"/><path d="M-1-2.4q3-1.6 5.4-.4" stroke="#fff" stroke-width="1.6" fill="none"/>
<circle cx="4.6" cy="-10.4" r="3.6" fill="#1f6b4a"/><circle cx="5.2" cy="-10.6" r="2.2" fill="#d62828"/><circle cx="5.6" cy="-11" r=".9" fill="#111"/><path d="M7.8-10.8l4 1.2l-3.8 1.2z" fill="#e9c46a"/></g></g>`;

const LINE=(o={})=>`${DEFS}${SKY(o.sky||"Day")}${o.sun?SUN(o.sun[0],o.sun[1],o.sun[2]):""}${o.clouds===false?"":CLOUD(36,18,1,44,o.cloud)+CLOUD(214,34,.72,60,o.cloud)}
<rect x="0" y="118" width="400" height="42" fill="${(o.hillc||[])[1]||"#86c477"}"/><g transform="translate(0 -24)">${BACK((o.hills===false?"":HILLS(...(o.hillc||[])))+(o.trees===false?"":TREES(o.treec))+(o.extraBack||""),o.move?o.move*9:0)}</g>${o.extra||""}
${o.wires===false?"":OHLE({move:!!o.move,d:o.move?o.move*.5:0})}${TRACK({move:!!o.move,d:o.move?o.move*.035:0,...(o.track||{})})}`;
// A station platform. Options: sky, back (what's behind: defaults to a brick wall with posters), train (drawn
// behind the platform), canopy:false, cols (canopy column positions).
const STATION=(o={})=>`${DEFS}${SKY(o.sky||"Day")}${o.back??(WALL()+POSTER(96,78,"#2a9d8f","#e9c46a")+POSTER(262,78,"#e76f51","#264653"))}${o.train||""}${PLAT()}${o.canopy===false?"":CANOPY(o.cols)}`;
// A crowd of varied people along a platform.
const CROWD=(xs,y,o={})=>xs.map((x,i)=>PERSON(x,y,{s:o.s||1,coat:COATS[(i*3+(o.k||0))%10],skin:SKIN[(i*2+(o.k||0))%5],hair:HAIR[(i+(o.k||0))%6],long:i%3===1,
 face:["flat","sad","flat","grit"][i%4],brow:i%4===3?"cross":"",hat:i%5===2?"beanie":"",hatc:COATS[(i+4)%10],scarf:i%4===0?COATS[(i+6)%10]:"",
 pose:["down","phone","hips","watch","down"][i%5],propR:i%5===1?PROP.phone:null,propL:i%4===2?PROP.case:null,
 an:i%2?A("a-bob",`--dy:-1.6px;--d:${.5+i%3*.13}s`):"",...(o.each?o.each(i):{})})).join("");

/* ======================================================================
   THE SCENES
   ====================================================================== */
const SCENES={

/* ---------------- NOT FUCKED ---------------- */
no:[
 // On time: the train cruising through sunny countryside.
 ()=>`${LINE({sun:[344,34],move:3.4,extraBack:SHEEP()})}
  <g ${A("a-bob","--dy:-.8px;--d:.28s")}>${TRAINSET(170,{spin:1,pax:1,panto:1,driver:1})}</g>
  ${CAP("ON TIME. GREEN SIGNALS ALL THE WAY.")}`,

 // Inside the train: one glorious empty seat.
 ()=>`${DEFS}<rect width="400" height="190" fill="#e6eaef"/><rect width="400" height="16" fill="#cdd4dc"/>
  <rect x="14" y="30" width="372" height="56" rx="8" fill="url(#skyDay)"/><g clip-path="url(#cWin)"><g transform="translate(0 -64)">${BACK(HILLS()+TREES(),7)}</g></g>
  <rect x="14" y="30" width="372" height="56" rx="8" fill="none" stroke="#aab2bd" stroke-width="2.4"/><rect x="134" y="30" width="10" height="56" fill="#e6eaef"/><rect x="256" y="30" width="10" height="56" fill="#e6eaef"/>
  <rect x="0" y="21" width="400" height="3.4" rx="1.7" fill="#f2c14e"/>
  ${rep(6,i=>`<g transform="translate(${38+i*62} 24)"><g ${A("a-rock",`--a0:-7deg;--a1:7deg;--d:1.1s;animation-delay:${-i*.3}s`)}><rect x="-1.3" y="0" width="2.6" height="11" fill="#59636e"/><path d="M-5 11h10l-2 8h-6z" fill="none" stroke="#59636e" stroke-width="2.2" stroke-linejoin="round"/></g></g>`)}
  <rect x="16" y="146" width="302" height="18" fill="#aab2bd"/><rect x="16" y="146" width="302" height="3" fill="#8e98a4"/><rect x="0" y="164" width="400" height="26" fill="#7c8691"/><rect x="0" y="164" width="400" height="2" fill="#5d6772"/>
  ${rep(5,i=>`<rect x="${20+i*59}" y="${94}" width="55" height="46" rx="11" fill="url(#pMoq)" stroke="#1b2a63" stroke-width="1.4"/><rect x="${33+i*59}" y="97" width="29" height="9" rx="4.5" fill="#1b2a63" opacity=".55"/><rect x="${18+i*59}" y="133" width="59" height="14" rx="6" fill="#22357a" stroke="#1b2a63" stroke-width="1.2"/><rect x="${22+i*59}" y="135" width="51" height="3" rx="1.5" fill="#fff" opacity=".14"/>`)}
  <path d="M150 16H182L206 148H126Z" fill="#fff3a6" opacity=".4"/><ellipse cx="166" cy="118" rx="27" ry="30" fill="#fff7c2" opacity=".7" ${A("a-pulse","--d:1.1s;--o:.25")}/>
  ${[[144,100],[190,106],[166,84],[148,130],[188,132]].map(([x,y],i)=>SPARKLE(x,y,i)).join("")}
  ${PERSON(48,165,{sit:1,coat:COATS[5],pose:"phone",propR:PROP.phone,hair:HAIR[1],skin:SKIN[2]})}
  ${PERSON(107,165,{sit:1,coat:COATS[3],eyes:"shut",hair:HAIR[4],headAn:A("a-rock","--a0:8deg;--a1:16deg;--d:2s"),scarf:"#e9c46a"})}
  ${PERSON(225,165,{sit:1,coat:COATS[1],pose:"both",propL:PROP.paper,long:1,hair:HAIR[2],skin:SKIN[1]})}
  ${PERSON(284,165,{sit:1,coat:COATS[7],hat:"beanie",hatc:"#e76f51",skin:SKIN[3],headAn:A("a-rock","--a0:-5deg;--a1:5deg;--d:.5s"),headExtra:`<path d="M-7.6-51a7.6 7.8 0 0 1 15.2 0" fill="none" stroke="#17181c" stroke-width="1.8"/><rect x="-9.6" y="-53.4" width="3.4" height="6" rx="1.6" fill="#17181c"/><rect x="6.2" y="-53.4" width="3.4" height="6" rx="1.6" fill="#17181c"/>`})}
  <rect x="330" y="16" width="4.4" height="150" rx="2.2" fill="#f2c14e"/>
  ${PERSON(364,168,{s:1.1,coat:COATS[6],pose:"face",face:"o",brow:"up",bag:1,an:A("a-bob","--dy:-2px;--d:.35s")})}
  ${CAP("A SEAT. AN ACTUAL SEAT.",8,170)}`,

 // The train is early and nobody knows how to feel about it.
 c=>`${STATION()}${BOARD(214,44,174,[{l:"08:12 "+DEST(c),r:"On time",c:"g"},{l:"Expected",r:"08:09",c:"g",rb:"--d:.9s;--o:.25"}])}${CLOCK(40,60,40)}
  ${ZOOM(`${PERSON(140,180,{coat:COATS[1],pose:"watch",face:"o",brow:"up",tie:"#1d3557",propL:PROP.case})}
  ${PERSON(192,180,{coat:COATS[2],pose:"face",face:"o",long:1,hair:HAIR[3],skin:SKIN[1]})}
  ${PERSON(244,180,{coat:COATS[5],pose:"phone",propR:PROP.phone,skin:SKIN[3],hair:HAIR[1],face:"smile"})}
  ${BUBBLE(146,120,84,92,80,["It’s… early?!"],A("a-pop","--d:4s"))}`)}
  ${CAP("ARRIVING EARLY. SUSPICIOUS.",8,2)}`,

 // Someone's so pleased they're dancing. The others are British about it.
 c=>`${STATION()}${BOARD(222,44,166,[{l:"08:12 "+DEST(c),r:"On time",c:"g"}])}
  ${ZOOM(`${PERSON(138,180,{coat:COATS[5],pose:"hips",brow:"cross",hair:HAIR[4],tie:"#bc4749",headAn:A("a-rock","--a0:0deg;--a1:9deg;--d:1.4s")})}
  ${PERSON(200,180,{coat:COATS[6],leg:"#264653",pose:"up",face:"smile",skin:SKIN[2],hair:HAIR[1],an:A("a-rock","--a0:-8deg;--a1:8deg;--d:.36s"),armR:A("a-rock","--a0:-18deg;--a1:22deg;--d:.18s"),armL:A("a-rock","--a0:18deg;--a1:-22deg;--d:.18s"),
    legR:A("a-rock","--a0:-12deg;--a1:10deg;--d:.36s"),headExtra:`<path d="M-7.6-51a7.6 7.8 0 0 1 15.2 0" fill="none" stroke="#17181c" stroke-width="1.8"/><rect x="-9.6" y="-53.4" width="3.4" height="6" rx="1.6" fill="#17181c"/><rect x="6.2" y="-53.4" width="3.4" height="6" rx="1.6" fill="#17181c"/>`})}
  ${PERSON(262,180,{coat:COATS[3],pose:"down",long:1,hair:HAIR[5],skin:SKIN[4],face:"flat",scarf:"#2a9d8f",headAn:A("a-rock","--a0:0deg;--a1:-9deg;--d:1.7s")})}
  ${rep(3,i=>NOTE(220+i*12,116-i*5,i))}
  ${BUBBLE(138,120,70,96,62,["Steady on."],A("a-pop","--d:5s"))}`)}
  ${CAP("ON TIME. STEADY ON.",8,2)}`,

 // Every train on time. Someone takes a photo, because nobody will believe them.
 c=>`${STATION()}${BOARD(200,40,188,[{l:"08:12 "+DEST(c),r:"On time",c:"g"},{l:"08:27 "+DEST(c),r:"On time",c:"g"},{l:"08:42 "+DEST(c),r:"On time",c:"g"}])}
  ${ZOOM(`${PERSON(150,180,{coat:COATS[2],pose:"high",propR:PROP.phone,face:"smile",brow:"up",long:1,hair:HAIR[2],scarf:"#e9c46a",an:A("a-bob","--dy:-1.6px;--d:.4s")})}
  ${SPARKLE(165,116,0,"#fff")}${SPARKLE(172,124,2,"#fff")}
  ${PERSON(104,180,{coat:COATS[0],pose:"hips",hat:"bowler",tie:"#bc4749",hair:HAIR[4],face:"flat",headAn:A("a-rock","--a0:0deg;--a1:10deg;--d:1.6s")})}
  ${BUBBLE(146,121,36,93,128,["Nobody will believe me."],A("a-pop","--d:5s"))}`)}
  ${CAP("ALL ON TIME. GET A PHOTO.",8,2)}`,

 // On time, so the station has put the bunting out.
 ()=>`${STATION({train:`<g transform="translate(-60 84) scale(1.5)">${CAR(0,0,{pax:1,driver:1})}</g>`,canopy:false})}
  <rect x="0" y="0" width="400" height="20" fill="#48535e"/><rect x="0" y="19" width="400" height="5" fill="#2f5d50"/>
  <path d="M0 26q100 14 200 0t200 0" fill="none" stroke="#f4f1ea" stroke-width="1"/>
  ${rep(16,i=>{const x=12+i*25,u=(x%200)/200,y=26+28*u*(1-u);return `<g transform="translate(${x} ${y.toFixed(1)})"><g ${A("a-rock",`--a0:-9deg;--a1:9deg;--d:${.7+i%3*.15}s;animation-delay:${-i*.2}s`)}><path d="M-7 0h14l-7 14z" fill="${["#c1121f","#fdfdfb","#1d3557"][i%3]}" stroke="#0003" stroke-width=".5"/></g></g>`})}
  ${ZOOM(`${PERSON(292,180,{hivis:1,hat:"cap",pose:"high",face:"smile",skin:SKIN[2],armR:A("a-rock","--a0:-16deg;--a1:18deg;--d:.3s"),
    propR:(x,y)=>`<line x1="${x}" y1="${y+2}" x2="${x}" y2="${y-15}" stroke="#6b4a32" stroke-width="1.3"/><path d="M${x} ${y-15}h12l-3 3.6l3 3.6h-12z" fill="#2a9d8f"/>`})}
  ${PERSON(334,180,{coat:COATS[3],pose:"hold",propR:PROP.tea,face:"smile",long:1,hair:HAIR[5],skin:SKIN[4]})}${STEAM(345,128)}
  ${PERSON(250,180,{coat:COATS[5],pose:"up",face:"smile",hair:HAIR[1],skin:SKIN[3],an:A("a-bob","--dy:-3px;--d:.3s")})}`)}
  ${CAP("ON TIME. PUT THE BUNTING OUT.",8,170)}`,

 // Nothing to complain about, which is its own kind of problem.
 c=>`${STATION()}${BOARD(236,40,152,[{l:"08:12 "+DEST(c),r:"On time",c:"g"}])}
  ${ZOOM(`${BENCH(146,161)}
  ${PERSON(160,180,{sit:1,coat:COATS[0],hat:"bowler",tie:"#6d597a",pose:"both",propL:PROP.paper,hair:HAIR[4],face:"flat"})}
  ${PERSON(184,180,{sit:1,coat:COATS[1],pose:"hold",propR:PROP.tea,long:1,hair:HAIR[3],skin:SKIN[1],face:"flat",scarf:"#264653"})}${STEAM(195,128)}
  ${BUBBLE(156,122,34,92,118,["Nothing to moan about."],A("pha","--d:7s"))}
  ${BUBBLE(190,122,196,92,86,["Awful, isn’t it."],A("phb","--d:7s"))}`)}
  ${PIGEON(318,180,{s:1.1,headAn:A("a-bob","--dx:-2.4px;--dy:0px;--d:.2s")})}
  ${CAP("ON TIME. NOTHING TO MOAN ABOUT.",8,2)}`
],

/* ---------------- A BIT FUCKED ---------------- */
bit:[
 // Leaves on the line: wheels spinning, going nowhere.
 ()=>`${LINE({sky:"Grey",hillc:["#d8a85f","#c98a42"],treec:"#d9722b",cloud:"#eef1f4"})}
  ${rep(14,i=>`<ellipse cx="${10+i*29}" cy="${RY-3.4-(i%3)}" rx="4.4" ry="2" fill="${["#d9822b","#c9541d","#e3b23c"][i%3]}" transform="rotate(${i*40} ${10+i*29} ${RY-3})"/>`)}
  <g ${A("a-shake","--sx:1.1px;--sy:0px;--sr:0deg;--d:.16s")}>${TRAINSET(128,{spin:1,sd:.16,pax:1,panto:1,driver:1})}</g>
  ${SMOKE(160,RY-4,3,{r:4,c:"#cfd5dc",rx:-22,ry:-14,d:1.1,s1:2})}${SMOKE(280,RY-4,3,{r:4,c:"#cfd5dc",rx:-22,ry:-14,d:1.1,s1:2})}
  ${LEAVES(13)}
  ${PERSON(368,183,{s:.86,flip:1,hivis:1,hat:"hard",pose:"hold",propR:PROP.blower,face:"grit",armR:A("a-rock","--a0:-5deg;--a1:6deg;--d:.2s")})}
  ${rep(3,i=>`<path d="M${330-i*4} ${150+i*6}h-16" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8" ${A("a-pass",`--x0:6px;--x1:-34px;--d:.6s;animation-delay:${-i*.2}s`)}/>`)}
  ${CAP("LEAVES ON THE LINE")}`,

 // The train is crawling. A jogger, a pigeon and a snail all overtake it.
 ()=>`${LINE({sun:[346,32],move:42,extraBack:SHEEP()})}
  ${TRAINSET(150,{spin:1,sd:7,pax:1,panto:1,driver:1})}
  <rect x="0" y="166" width="400" height="24" fill="#86c477"/><rect x="0" y="166" width="400" height="2" fill="#6aa85e"/><rect x="0" y="176" width="400" height="8" fill="#d9cdb0"/>
  <g ${A("a-pass","--x0:-40px;--x1:440px;--d:5.2s")}>${PERSON(0,183,{s:.7,coat:"#e76f51",leg:"#264653",pose:"hold",hat:"cap",hatc:"#2a9d8f",face:"smile",an:A("a-bob","--dy:-3px;--d:.2s"),legR:A("a-rock","--a0:-38deg;--a1:38deg;--d:.2s"),legL:A("a-rock","--a0:38deg;--a1:-38deg;--d:.2s"),armR:A("a-rock","--a0:30deg;--a1:-40deg;--d:.2s"),armL:A("a-rock","--a0:-40deg;--a1:30deg;--d:.2s")})}</g>
  <g ${A("a-pass","--x0:-40px;--x1:440px;--d:10s;animation-delay:-4s")}>${PIGEON(0,183,{flip:1,s:1.15,headAn:A("a-bob","--dx:-2.4px;--dy:0px;--d:.18s")})}</g>
  <g ${A("a-pass","--x0:-40px;--x1:440px;--d:19s;animation-delay:-9s")}><g transform="translate(0 183)">${SNAIL()}</g></g>
  ${CAP("MAKING GOOD PROGRESS")}`,

 // The expected time keeps creeping later.
 c=>`${STATION()}${BOARD(206,44,182,[{l:"08:12 "+DEST(c),r:"Delayed"},{l:"Expected",alt:["08:19","08:31","08:47"]}])}${CLOCK(40,60,9)}
  ${ZOOM(`${BENCH(236,180)}${PERSON(260,180,{sit:1,coat:COATS[7],eyes:"shut",hat:"beanie",hatc:"#6d597a",skin:SKIN[2],headAn:A("a-rock","--a0:10deg;--a1:18deg;--d:2.2s")})}${ZZZ(272,118,"#1b1f27")}
  ${PERSON(140,180,{coat:COATS[1],pose:"watch",brow:"cross",tie:"#1d3557",propL:PROP.coffee,legR:A("a-rock","--a0:0deg;--a1:-9deg;--d:.16s"),headAn:A("a-rock","--a0:0deg;--a1:6deg;--d:1.2s")})}${STEAM(130,148)}
  ${PERSON(192,180,{coat:COATS[2],pose:"phone",propR:PROP.phone,long:1,hair:HAIR[3],skin:SKIN[1],face:"sad"})}`)}
  ${CAP("EXPECTED: SOON-ISH",8,2)}`,

 // Snow. A snowman in hi-vis has been sent to help.
 ()=>`${LINE({sky:"Snow",hillc:["#f4f7fb","#e3eaf2"],treec:"#3f6b52",cloud:"#f6f8fb"})}
  <path d="M0 ${RY+3}q30-5 60 0t60 0t60-1t60 1t60 0t60 0t40 0V190H0z" fill="#fff" opacity=".88"/>
  ${TRAINSET(96,{pax:1,panto:1,driver:1})}
  <path d="M-92 99q40-9 96-3t92 2v3h-188zM100 99q30-9 80-4t78 0q8 2 14 9h-172z" fill="#fff"/><circle cx="283.3" cy="133.6" r="9" fill="#fff6c9" opacity=".5" ${A("a-pulse","--d:1.4s;--o:.2")}/>
  <g transform="translate(346 178)"><ellipse cx="0" cy="1" rx="17" ry="3" fill="#000" opacity=".12"/><circle cx="0" cy="-11" r="13" fill="#fff" stroke="#c9d3de" stroke-width="1"/><circle cx="0" cy="-29" r="9.6" fill="#fff" stroke="#c9d3de" stroke-width="1"/><circle cx="0" cy="-43" r="7" fill="#fff" stroke="#c9d3de" stroke-width="1"/>
   <path d="M-11.4-18q11.4 6 22.8 0v8q-11.4 6-22.8 0z" fill="#ff7a1a"/><path d="M-11.4-15.4q11.4 6 22.8 0" fill="none" stroke="#eef1f4" stroke-width="2"/>
   <path d="M-7.6-45.6a7.6 7.9 0 0 1 15.2 0z" fill="#fff" stroke="#c4cad2" stroke-width=".7"/><rect x="-9" y="-46.6" width="18" height="2" rx="1" fill="#f2c14e"/>
   <circle cx="-2.6" cy="-43.6" r="1" fill="#111"/><circle cx="2.6" cy="-43.6" r="1" fill="#111"/><path d="M0-41.6l-8 1.6l8 1z" fill="#f28c28"/><path d="M-9-31l-13-7M9-31l12-9" stroke="#6b4a32" stroke-width="1.8" stroke-linecap="round"/>
   <rect x="16" y="-56" width="30" height="13" rx="2" fill="#f4f1ea" stroke="#3a404b" stroke-width="1.2"/><text x="31" y="-46.6" text-anchor="middle" class="tiny" style="font-size:6.4px">SORRY</text></g>
  ${SNOW(28)}${CAP("THE WRONG KIND OF SNOW")}`,

 // Drizzle, and the umbrella turns inside out.
 c=>`${STATION({sky:"Grey",canopy:false,back:CLOUD(40,14,1.2,50,"#eef1f4")+CLOUD(230,26,.9,70,"#eef1f4")+BACK(TOWN("#7d8b9a"))+`<rect x="0" y="118" width="400" height="32" fill="#5d6772"/>${rep(27,i=>`<rect x="${i*15+3}" y="112" width="3" height="38" fill="#cfd5dc"/>`)}<rect x="0" y="120" width="400" height="3" fill="#cfd5dc"/>`})}
  <rect x="318" y="85" width="4" height="65" fill="#59636e"/>${BOARD(232,64,160,[{l:"08:47 "+DEST(c),r:"Delayed"}],{rods:false})}${LAMP(40,150)}
  ${[[86,178],[300,182]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="20" ry="3.4" fill="#7fa6c9" opacity=".7"/><ellipse cx="${x}" cy="${y}" rx="9" ry="1.6" fill="none" stroke="#fff" stroke-width=".8" ${A("a-pulse","--d:.6s;--o:0")}/>`).join("")}
  ${ZOOM(`${PERSON(180,180,{coat:COATS[9],pose:"high",face:"grit",brow:"cross",long:1,hair:HAIR[5],scarf:"#e9c46a",an:A("a-rock","--a0:0deg;--a1:-5deg;--d:1.5s")})}
  <g transform="translate(193 123)"><line x1="0" y1="0" x2="0" y2="-26" stroke="#3a424c" stroke-width="1.8"/>
   <g class="pha" style="--d:3s"><path d="M-26-26q26-28 52 0q-6.5-4-13 0q-6.5-4-13 0q-6.5-4-13 0q-6.5-4-13 0z" fill="#c1121f" stroke="#7d0c14" stroke-width="1"/></g>
   <g class="phb" style="--d:3s"><path d="M-25-30q25 24 50 0l-7-9l-6 8l-6-9l-6 9l-6-9l-6 9l-6-8z" fill="#c1121f" stroke="#7d0c14" stroke-width="1"/><path d="M0-26L-18-36M0-26L-6-38M0-26L6-38M0-26L18-36" stroke="#3a424c" stroke-width="1"/></g></g>
  ${PERSON(246,180,{coat:COATS[0],pose:"high",face:"sad",tie:"#bc4749",hair:HAIR[0],propR:(x,y)=>`<g transform="rotate(-70 ${x} ${y})">${PROP.paper(x+8,y+2)}</g>`,propL:PROP.case})}`)}
  ${rep(3,i=>`<path d="M${330-i*30} ${96+i*14}h-34" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".6" ${A("a-pass",`--x0:120px;--x1:-330px;--d:${1.1+i*.2}s;animation-delay:${-i*.4}s`)}/>`)}
  ${RAIN(26,-70)}${CAP("TYPICAL.")}`,

 // The tannoy is sorry. Again.
 ()=>`${STATION()}${TANNOY(52,56)}
  ${BUBBLE(82,56,100,40,216,["“We apologise for the late running","of this service. Again.”"])}
  ${ZOOM(`${PERSON(150,180,{coat:COATS[5],pose:"hips",brow:"cross",hair:HAIR[1],skin:SKIN[2],headAn:A("a-rock","--a0:-10deg;--a1:10deg;--d:1.3s")})}
  ${PERSON(204,180,{coat:COATS[1],pose:"palm",eyes:"shut",face:"sad",long:1,hair:HAIR[2],propL:PROP.coffee})}
  ${PERSON(258,180,{coat:COATS[8],pose:"phone",propR:PROP.phone,hat:"beanie",hatc:"#2a9d8f",skin:SKIN[1],face:"flat",scarf:"#bc4749"})}`)}
  ${CAP("AGAIN.",8,2)}`,

 // At the seaside, a gull helps itself to a chip.
 ()=>`${DEFS}${SKY("Day")}${SUN(54,36,13)}${CLOUD(150,20,.8,50)}${CLOUD(296,34,1,64)}
  <rect x="0" y="104" width="400" height="46" fill="url(#gSea)"/><path d="M0 110h400" stroke="#fff" stroke-width=".8" opacity=".5"/>${rep(7,i=>`<path d="M${20+i*56} ${118+i%3*8}q5-3 10 0t10 0" fill="none" stroke="#fff" stroke-width="1" opacity=".6" ${A("a-bob",`--dx:6px;--dy:0px;--d:${1.2+i%3*.4}s`)}/>`)}
  <path d="M250 112h150v4H250z" fill="#5b4636"/>${rep(8,i=>`<rect x="${256+i*19}" y="116" width="2.4" height="${22+i%2*4}" fill="#5b4636"/>`)}<path d="M330 112v-12h30v12zM336 100l9-8l9 8z" fill="#f4f1ea" stroke="#5b4636" stroke-width="1"/><path d="M345 92v-8l7 3z" fill="#c1121f"/>
  ${PLAT()}${rep(21,i=>`<rect x="${i*20+4}" y="130" width="2.6" height="20" fill="#f4f5f7"/>`)}<rect x="0" y="132" width="400" height="2.6" fill="#f4f5f7"/><rect x="0" y="141" width="400" height="2" fill="#f4f5f7"/>
  ${NAMEBOARD(24,96,"SEASIDE")}${LAMP(120,150)}${BENCH(294,177)}
  ${PERSON(214,177,{coat:COATS[4],leg:"#3d5a80",pose:"hold",face:"o",brow:"up",hat:"cap",hatc:"#bc4749",propR:PROP.chips})}
  <g class="a-gull">${GULL()}<rect x="-18" y="-1.6" width="6.5" height="1.7" rx=".6" fill="#f2c14e" transform="rotate(14 -15 -1)"/></g>
  <g transform="translate(276 104)"><text text-anchor="middle" ${A("big a-pop","--d:3.8s")}>OI!</text></g>
  ${CAP("DELAYED AT THE SEASIDE")}`,

 // Held at a red signal, with a driver's announcement.
 ()=>`${LINE({sky:"Dusk",hillc:["#c58a6a","#a8705a"],treec:"#6b5a4a",cloud:"#ffe7cf"})}${SIGNAL(346,"r")}
  ${TRAINSET(70,{pax:1,panto:1,driver:1})}
  <g transform="translate(236 121)"><g ${A("a-rock","--a0:-8deg;--a1:12deg;--d:.14s")}><path d="M0 0h8" stroke="#1d3557" stroke-width="3.6" stroke-linecap="round"/><circle cx="10" cy=".4" r="2.1" fill="#f6cfae"/></g></g>
  ${BUBBLE(238,106,150,26,176,["“We are being held at a red","signal. Apologies.”"])}
  ${CAP("AWAITING A PLATFORM",8,166)}`,

 // A cow on the line, in no hurry at all.
 ()=>`${LINE({sun:[348,30,12],extraBack:SHEEP()})}${TRAINSET(-8,{pax:1,panto:1,driver:1})}
  <g transform="translate(300 ${RY+3}) scale(1.35)">${COW()}</g>
  <g transform="translate(222 108)"><text text-anchor="middle" ${A("big a-blink","font-size:14px;--d:1.3s;--o:0")}>BEEP</text></g>
  ${BUBBLE(284,96,300,66,46,["Moo."],A("a-pop","--d:5s"))}
  ${CAP("A COW IS CONSIDERING ITS OPTIONS")}`,

 // The train's ready. The driver is still on his way back with his lunch.
 ()=>`${STATION({train:`<g transform="translate(-80 84) scale(1.5)">${CAR(0,0,{pax:1})}</g>`})}
  ${ZOOM(CROWD([92,300,342],180,{k:2,each:i=>({pose:i===1?"watch":"hips",brow:"cross",propR:null,an:""})}))}
  <g ${A("a-pass","--x0:-60px;--x1:460px;--d:4.6s")}>${PERSON(0,186,{s:1.12,coat:"#1d3557",leg:"#1b2440",hat:"cap",tie:"#c1121f",pose:"hold",propR:PROP.coffee,face:"o",skin:SKIN[1],an:A("a-bob","--dy:-3px;--d:.2s"),
    legR:A("a-rock","--a0:-36deg;--a1:36deg;--d:.2s"),legL:A("a-rock","--a0:36deg;--a1:-36deg;--d:.2s"),armL:A("a-rock","--a0:-38deg;--a1:30deg;--d:.2s"),
    propL:(x,y)=>`<rect x="${x-6}" y="${y-2}" width="12" height="4.6" rx="2.2" fill="#d9a35f" stroke="#a8742f" stroke-width=".5"/><path d="M${x-3} ${y-1}v2.6M${x} ${y-1}v2.6M${x+3} ${y-1}v2.6" stroke="#a8742f" stroke-width=".6"/>`})}
   ${BUBBLE(-4,118,-70,90,62,["Coming!"])}</g>
  ${CAP("AWAITING THE DRIVER. HE’S BEEN TOLD.",8,2)}`,

 // Today's excuse, and it keeps changing.
 c=>`${STATION()}${BOARD(196,40,192,[{l:"08:12 "+DEST(c),r:"Delayed"},{l:"Due to",alt:["leaves","sunshine","a pheasant"]}])}
  ${ZOOM(`${PERSON(120,180,{coat:COATS[6],pose:"face",hair:HAIR[2],tie:"#264653",propL:PROP.case,headAn:A("a-rock","--a0:-4deg;--a1:4deg;--d:.9s")})}
  ${PERSON(170,180,{coat:COATS[8],pose:"point",face:"o",brow:"up",long:1,hair:HAIR[1],skin:SKIN[2],scarf:"#bc4749"})}
  ${BUBBLE(166,121,60,93,84,["A pheasant?!"],A("ph3","--d:7.5s"))}`)}
  <g ${A("a-pass","--x0:-50px;--x1:450px;--d:9s")}><g transform="translate(0 184) scale(1.25)">${PHEASANT()}</g></g>
  ${CAP("TODAY’S EXCUSE",8,2)}`
],

/* ---------------- FUCKED ---------------- */
yes:[
 // The rail replacement bus: old, slow and full.
 ()=>`${DEFS}${SKY("Grey")}${CLOUD(60,16,1.1,50,"#eef1f4")}${CLOUD(250,30,.8,70,"#eef1f4")}${BACK(HILLS("#9fbf8f","#84ad77")+TREES("#5c8f58"),90)}
  <rect x="0" y="138" width="400" height="14" fill="#4f7d49"/>${rep(14,i=>`<circle cx="${i*30+10}" cy="139" r="${9+i%3*2}" fill="#4f7d49"/>`)}
  <rect x="0" y="150" width="400" height="40" fill="url(#gRoad)"/><rect x="0" y="150" width="400" height="2.4" fill="#aab2bd"/>
  <g ${A("a-loop","--p:-40px;--d:1.6s")}>${rep(12,i=>`<rect x="${i*40}" y="176" width="22" height="2.6" fill="#f4f5f7"/>`)}</g>
  <path d="M330 150l5-15h4l5 15z" fill="#ff7a1a"/><rect x="333.4" y="141" width="7.2" height="3" fill="#fff"/><rect x="326" y="149" width="22" height="3" rx="1" fill="#ff7a1a"/>
  <g transform="translate(92 101)"><g ${A("a-shake","--sx:.9px;--sy:-1.6px;--sr:-.7deg;--d:.26s")}>${COACH()}<rect x="52" y="-9" width="30" height="10" rx="2" fill="#6d597a" stroke="#3a304a" stroke-width="1"/><rect x="88" y="-7" width="20" height="8" rx="2" fill="#bc4749" stroke="#7a2b2c" stroke-width="1"/><path d="M48 0h64" stroke="#3a404b" stroke-width="1.4"/></g></g>
  ${SMOKE(84,148,5,{r:7,rx:-46,ry:-26,d:2.2,c:"#3a3d42"})}
  ${CAP("ETA: TUESDAY")}`,

 // Every train on the board is cancelled. A pigeon watches.
 c=>{const st=(c.stops&&c.stops.length?c.stops:["Upminster","Barking","Woodgrange Park"]).slice(0,3);
  return `${STATION()}${BOARD(96,48,208,st.map((s,i)=>({l:["08:12","08:27","08:42"][i]+" "+E(s),r:"Cancelled",c:"r",rb:`--d:1s;--o:.2;animation-delay:${-i*.3}s`})),{drop:16})}
  ${PIGEON(262,48,{headAn:A("a-rock","--a0:0deg;--a1:-14deg;--d:.9s")})}
  ${ZOOM(`${PERSON(176,180,{coat:COATS[0],pose:"down",face:"sad",brow:"up",tie:"#bc4749",an:A("a-rock","--a0:0deg;--a1:3deg;--d:2.2s"),headAn:A("a-rock","--a0:-14deg;--a1:-10deg;--d:2.2s")})}
  <g transform="translate(150 176) rotate(-80)">${PROP.case(0,-6)}</g>
  ${PERSON(232,180,{coat:COATS[9],pose:"palm",eyes:"shut",face:"sad",long:1,hair:HAIR[1],skin:SKIN[2]})}`)}
  ${CAP("ALL OF THEM. EVERY ONE.",8,2)}`},

 // The overhead wires have come down.
 ()=>`${LINE({sky:"Grey",wires:false,cloud:"#eef1f4"})}${[40,240].map(MAST).join("")}${MAST(396)}
  <path d="M-10 60q50 9 72-1" fill="none" stroke="#5b6570" stroke-width="1"/><line x1="-10" y1="72" x2="232" y2="72" stroke="#39414b" stroke-width="1.4"/>
  ${TRAINSET(112,{pax:1,panto:1,driver:1})}
  <path d="M232 72q16 2 20 14t16-4t-12 18t26 4t8 30q-2 8-10 10" fill="none" stroke="#39414b" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M400 72H318q-12 2-16 18t-12 10" fill="none" stroke="#39414b" stroke-width="1.5" stroke-linecap="round" ${A("a-bob","--dx:0px;--dy:2px;--d:1.1s")}/>
  ${SPARKS(254,74,1)}${SPARKS(290,101,.7)}
  <path d="M342 186l5-22h14l5 22M344.6 176h18.8M346 170h16" fill="none" stroke="#aeb6c0" stroke-width="2.2" stroke-linejoin="round"/>
  ${PERSON(354,165,{s:.8,hivis:1,hat:"hard",pose:"ear",face:"o",armR:A("a-rock","--a0:-6deg;--a1:8deg;--d:.3s"),headAn:A("a-rock","--a0:-12deg;--a1:-8deg;--d:1.5s")})}
  ${CAP("THE WIRES ARE DOWN")}`,

 // Signal failure. Percussive maintenance is under way.
 ()=>`${LINE({sky:"Grey",cloud:"#eef1f4"})}${TRAINSET(-64,{pax:1,driver:1})}${SIGNAL(214,"x")}
  <rect x="262" y="124" width="34" height="38" rx="2" fill="#aab2bd" stroke="#59636e" stroke-width="1.4"/><path d="M262 124l-13 4v34l13 0z" fill="#8a94a0" stroke="#59636e" stroke-width="1.2"/><rect x="266" y="128" width="26" height="30" fill="#1d2127"/>
  <path d="M270 132q6 8 2 14t6 10M278 130q-4 10 4 12t-2 12M286 131q4 6-2 12t4 12" fill="none" stroke-width="1.6" stroke="#ffd23f"/><path d="M274 131q8 6 2 16M284 134q-8 8 2 20" fill="none" stroke-width="1.6" stroke="#35e06f"/><path d="M290 132q-10 10-2 22" fill="none" stroke-width="1.6" stroke="#ff3b30"/>
  ${SPARKS(280,124,.9)}
  ${PERSON(330,182,{s:.9,flip:1,hivis:1,hat:"hard",pose:"point",face:"grit",brow:"cross",propR:PROP.spanner,armR:A("a-rock","--a0:-34deg;--a1:16deg;--d:.26s")})}
  <g transform="translate(296 126)"><text ${A("big a-blink","font-size:13px;--d:.52s;--o:0")}>CLANG</text></g>
  ${CAP("SIGNAL FAILURE. TRIED OFF AND ON AGAIN.")}`,

 // A swan on the line. Nobody argues with a swan.
 ()=>`${LINE({sun:[350,30,12],extraBack:SHEEP()})}${TRAINSET(8,{pax:1,panto:1})}
  <g transform="translate(176 114)"><g ${A("a-rock","--a0:-4deg;--a1:5deg;--d:.6s")}><circle cx="0" cy="0" r="5.4" fill="#f6cfae"/><path d="M-5.6-.6a5.6 5.6 0 0 1 11.2 0z" fill="#1d3557"/><rect x="0" y="-1.6" width="8.4" height="1.7" rx=".8" fill="#1d3557"/><ellipse cx="2" cy="2.6" rx="1.3" ry="1.5" fill="#2a1d16"/></g>
   <g transform="translate(3 5)"><g ${A("a-rock","--a0:-28deg;--a1:14deg;--d:.3s")}><path d="M0 0l15-5" stroke="#1d3557" stroke-width="3.8" stroke-linecap="round"/><circle cx="17" cy="-5.6" r="2.2" fill="#f6cfae"/></g></g></g>
  ${SWAN(306,RY-3)}
  <g transform="translate(236 92)"><text text-anchor="middle" ${A("big a-shake","--sx:1.2px;--sy:-1px;--sr:-2deg;--d:.2s")}>HISSSS</text></g>
  ${CAP("SWAN ON THE LINE. NOBODY MOVE.")}`,

 // The packed platform. On "no route at all" the board says NEVER.
 c=>`${STATION()}${BOARD(238,44,150,[{l:"Next train",r:c.level==="none"?"Never":"47 min",c:"r",rb:"--d:1s;--o:.2"}])}${CLOCK(40,60,1.3)}
  ${CROWD([24,54,84,114,144,174,204,234,264,294,324,354,382],170,{s:.9,k:3})}
  ${CROWD([8,40,72,104,136,168,200,232,264,296,328,360,392],182,{k:0,each:i=>i===4?{pose:"both",propL:PROP.paper,an:""}:i===9?{pose:"hold",propR:PROP.coffee}:{} })}
  ${CAP("PLEASE USE THE FULL LENGTH OF THE PLATFORM",8,2)}`,

 // Heatwave: a mild day by anyone else's standards.
 ()=>`${LINE({sky:"Hot",sun:[332,40,21],hillc:["#e6d28e","#d3bb6b"],treec:"#9a9a4a",clouds:false,track:{wavy:1}})}
  ${TRAINSET(84,{pax:1,panto:1,driver:1})}
  ${rep(6,i=>`<g transform="translate(${-80+i*56} ${TY+2})"><path d="M0 0q-3 5 0 7.6q3-2.6 0-7.6z" fill="#4aa3df" ${A("a-rise",`--d:1.3s;--rx:0px;--ry:18px;--s0:1;--s1:1;--o0:1;animation-delay:${-i*.31}s`)}/></g>`)}
  <g ${A("a-pulse","--d:.9s;--o:.35")}>${rep(3,i=>`<path d="M${40+i*120} 150q8-6 0-12t0-12" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>`)}</g>
  <g transform="translate(22 78) scale(.72)"><rect x="-5.5" y="-52" width="11" height="54" rx="5.5" fill="#fff" stroke="#59636e" stroke-width="1.6"/><rect x="-2" y="-38" width="4" height="42" fill="#d62828"/><circle cx="0" cy="8" r="10" fill="#d62828" stroke="#59636e" stroke-width="1.6"/>${rep(5,i=>`<path d="M5.5 ${-44+i*9}h4" stroke="#59636e" stroke-width="1"/>`)}</g>
  <text x="36" y="62" class="big" style="font-size:17px">24°C</text>
  ${PERSON(366,186,{s:.84,coat:"#2a9d8f",leg:"#e9c46a",skin:"#f29e8e",pose:"hold",face:"o",bald:1,propR:PROP.icecream,an:A("a-rock","--a0:-3deg;--a1:3deg;--d:1.6s")})}
  ${CAP("24°C. THE RAILS HAVE BUCKLED.")}`,

 // A gent stays calm while the train behind him gives up.
 ()=>`${STATION({back:WALL(),train:`<g transform="translate(-70 84) scale(1.5)">${CAR(0,0,{pax:1})}</g>${SMOKE(120,84,5,{r:11,rx:30,ry:-70,d:2.6,s1:2.6})}${SMOKE(170,84,4,{r:9,rx:26,ry:-60,d:2.2})}${FLAME(132,86,.9)}${FLAME(150,86,.7,.24)}`})}
  ${ZOOM(`${BENCH(176,180)}
  ${PERSON(200,180,{sit:1,coat:"#22262d",leg:"#3a404b",hat:"bowler",tie:"#c1121f",pose:"both",face:"smile",propL:PROP.paper,propR:PROP.tea,armR:A("a-rock","--a0:0deg;--a1:-52deg;--d:1.7s")})}
  <g ${A("a-pass","--x0:-260px;--x1:300px;--d:4.6s")}>${PERSON(150,184,{hivis:1,hat:"hard",pose:"hold",face:"o",propR:PROP.ext,an:A("a-bob","--dy:-3px;--d:.18s"),legR:A("a-rock","--a0:-36deg;--a1:36deg;--d:.18s"),legL:A("a-rock","--a0:36deg;--a1:-36deg;--d:.18s")})}</g>`,1.12)}
  ${CAP("MUSTN’T GRUMBLE",8,2)}`,

 // An orderly queue for the replacement bus.
 ()=>`${DEFS}${SKY("Grey")}${BACK(TOWN("#7d8b9a"))}<rect x="0" y="126" width="400" height="24" fill="url(#pBrick)"/><rect x="0" y="124" width="400" height="3" fill="#d9cdbd"/>
  <rect x="0" y="150" width="400" height="40" fill="url(#gPlat)"/><rect x="0" y="183" width="400" height="7" fill="#7c8691"/>
  <rect x="370" y="66" width="3.4" height="118" fill="#59636e"/><rect x="318" y="62" width="52" height="30" rx="2.4" fill="#f4f5f7" stroke="#c1121f" stroke-width="2"/><text x="344" y="73" text-anchor="middle" class="tiny" style="fill:#c1121f;font-size:6px">RAIL</text><text x="344" y="80.4" text-anchor="middle" class="tiny" style="fill:#c1121f;font-size:6px">REPLACEMENT</text><text x="344" y="87.8" text-anchor="middle" class="tiny" style="fill:#c1121f;font-size:6px">BUS STOP</text>
  ${CROWD([338,302,266,230,194,158,122,86,50,14],180,{k:5,each:i=>i===1?{pose:"watch",armR:A("a-rock","--a0:0deg;--a1:-8deg;--d:.5s")}:i===3?{pose:"hips",brow:"cross",face:"flat"}:{}})}
  ${BUBBLE(232,120,206,94,38,["tsk"],A("a-pop","--d:3.6s"))}
  ${RAIN(12,-30)}${CAP("QUEUE STARTS HERE")}`,

 // Flooding.
 ()=>`${LINE({sky:"Grey",cloud:"#eef1f4"})}${TRAINSET(110,{pax:1,panto:1,driver:1})}
  <rect x="0" y="143" width="400" height="47" fill="#3b7fb3" opacity=".82"/>
  <g ${A("a-loop","--p:-40px;--d:2.6s")}><path d="M-40 144${" q10-5 20 0t20 0".repeat(12)}V152H-40z" fill="#6aa9d6" opacity=".8"/></g>
  ${rep(5,i=>`<path d="M${30+i*82} ${164+i%2*10}q6-3 12 0t12 0" fill="none" stroke="#fff" stroke-width="1" opacity=".5" ${A("a-bob",`--dx:8px;--dy:0px;--d:${1.3+i%3*.3}s`)}/>`)}
  <rect x="352" y="112" width="3.4" height="60" fill="#59636e"/><rect x="334" y="100" width="40" height="15" rx="2" fill="#ffd21f" stroke="#22262d" stroke-width="1.2"/><text x="354" y="110.6" text-anchor="middle" class="tiny" style="font-size:6px">DEPTH 3 FT</text>
  <g ${A("a-pass","--x0:-40px;--x1:440px;--d:15s")}><g transform="translate(0 160)"><g ${A("a-bob","--dy:-1.6px;--d:.7s")}><g transform="scale(-1 1)">${DUCK()}</g></g><path d="M-16 2q-8 2-14 0M-14 6q-10 3-20 0" fill="none" stroke="#fff" stroke-width="1" opacity=".6"/></g></g>
  ${RAIN(22)}${CAP("BIT DAMP.")}`,

 // A tree on the line, and a very small saw.
 ()=>`${LINE({cloud:"#fff",extraBack:SHEEP()})}${TRAINSET(-30,{pax:1,panto:1,driver:1})}
  <circle cx="352" cy="128" r="26" fill="#3f8a45"/><circle cx="376" cy="142" r="20" fill="#4f9d4b"/><circle cx="330" cy="146" r="18" fill="#4f9d4b"/><circle cx="366" cy="112" r="16" fill="#59a856"/><circle cx="344" cy="120" r="6" fill="#fff" opacity=".12"/>
  <path d="M214 150L340 136" stroke="#6b4a32" stroke-width="13" stroke-linecap="round"/><path d="M214 150L340 136" stroke="#8a6242" stroke-width="5" stroke-linecap="round" transform="translate(0 -3)"/><circle cx="212" cy="150" r="9" fill="#5b3d2a"/><path d="M206 146l-9-6M205 152l-11 1M208 157l-7 7" stroke="#5b3d2a" stroke-width="2.4" stroke-linecap="round"/><circle cx="212" cy="150" r="4" fill="#c9a36b"/>
  ${PERSON(276,178,{s:.86,hivis:1,hat:"hard",pose:"hold",face:"grit",propR:PROP.saw,armR:A("a-bob","--dx:4px;--dy:0px;--d:.12s")})}
  ${rep(4,i=>`<g transform="translate(${291+i*2} 146)"><circle r="1.2" fill="#e3c796" ${A("a-rise",`--d:.9s;--rx:${6+i*3}px;--ry:14px;--s0:1;--s1:1;--o0:1;animation-delay:${-i*.22}s`)}/></g>`)}
  ${PERSON(190,184,{s:.86,hivis:1,hat:"hard",pose:"hold",face:"smile",skin:SKIN[2],propR:PROP.tea})}
  ${BUBBLE(196,126,130,98,76,["Left a bit."],A("a-pop","--d:4.4s"))}
  ${CAP("TREE ON THE LINE. SEND A BIGGER SAW.")}`,

 // The wheel's come off, and the guard gives chase.
 ()=>`${LINE({extraBack:SHEEP()})}${CAR(-150,TY,{cab:false,pax:1})}<g transform="rotate(2.6 76 ${RY})">${CAR(42,TY,{pax:1,panto:0,driver:1,noFront:1})}</g>
  <g transform="translate(201 ${RY-8})"><g class="a-wheel"><g ${A("a-spin","--d:.4s")}><circle r="7.6" fill="#23272e"/><circle r="5.6" fill="none" stroke="#a3acb6" stroke-width="1.4"/><path d="M-5.4 0H5.4M0-5.4V5.4" stroke="#8a939e" stroke-width="1.1"/><circle r="2.1" fill="#cfd5dc"/></g></g></g>
  <g ${A("a-pass","--x0:0px;--x1:190px;--d:3.6s")}>${PERSON(236,184,{s:.82,hivis:1,hat:"hard",pose:"up",face:"o",brow:"up",an:A("a-bob","--dy:-3px;--d:.17s"),legR:A("a-rock","--a0:-38deg;--a1:38deg;--d:.17s"),legL:A("a-rock","--a0:38deg;--a1:-38deg;--d:.17s"),armR:A("a-rock","--a0:-14deg;--a1:14deg;--d:.17s"),armL:A("a-rock","--a0:14deg;--a1:-14deg;--d:.17s")})}</g>
  <g transform="translate(258 104)"><text text-anchor="middle" ${A("big a-pop","--d:3.6s")}>BOING!</text></g>
  ${CAP("WHEEL’S COME OFF")}`,

 // Total power failure. The cleaner needed the socket.
 ()=>`${STATION({back:WALL(),train:`<g transform="translate(-120 84) scale(1.5)">${CAR(0,0,{dark:1})}</g>`})}
  ${BOARD(14,40,150,[{l:"All trains",r:"No power",c:"r",rb:"--d:1s;--o:.2"}])}
  <rect x="289.4" y="118" width="5.2" height="34" fill="#59636e"/><rect x="278" y="98" width="28" height="22" rx="2.6" fill="#fdfdfb" stroke="#aab2bd" stroke-width="1.2"/>
  <rect x="284" y="103" width="16" height="13" rx="2.4" fill="#e6eaef" stroke="#8e98a4" stroke-width="1"/><path d="M292 116q2 40 44 50" fill="none" stroke="#1b1f27" stroke-width="2.2"/>
  <path d="M176 150q30 6 44 24" fill="none" stroke="#1b1f27" stroke-width="3.4" stroke-linecap="round"/>
  <g transform="translate(222 176) rotate(-18)"><rect x="-2" y="-8" width="24" height="17" rx="4" fill="#fdfdfb" stroke="#8e98a4" stroke-width="1.2"/><rect x="22" y="-6.4" width="9" height="3" fill="#d9b25f"/><rect x="22" y="3.6" width="9" height="3" fill="#d9b25f"/><rect x="22" y="-1.6" width="11" height="3.2" fill="#d9b25f"/></g>
  <g transform="translate(336 184)"><g ${A("a-bob","--dx:-5px;--dy:0px;--d:.6s")}><path d="M2-12L20-58" stroke="#59636e" stroke-width="2.6" stroke-linecap="round"/><rect x="-8" y="-40" width="15" height="30" rx="5" fill="#d62828" stroke="#8f1a1a" stroke-width="1"/><rect x="-5" y="-34" width="9" height="12" rx="3" fill="#fff" opacity=".25"/><path d="M-16-10h30l3 9h-36z" fill="#2c323a"/></g></g>
  ${PERSON(366,185,{s:1.12,flip:1,coat:"#7fb7be",leg:"#3d5a80",pose:"hold",skin:SKIN[1],hair:HAIR[4],long:1,face:"smile",armR:A("a-rock","--a0:-6deg;--a1:8deg;--d:.6s")})}
  ${PERSON(254,185,{s:1.12,hivis:1,hat:"hard",pose:"hips",brow:"cross",face:"flat",skin:SKIN[3],headAn:A("a-rock","--a0:0deg;--a1:8deg;--d:1.5s")})}
  ${BUBBLE(360,116,246,56,128,["Needed the socket for","the hoover, love."],A("a-pop","--d:6s"))}
  ${CAP("TOTAL POWER FAILURE",8,2)}`,

 // The rail replacement bus has broken down, so the passengers are pushing it.
 ()=>`${DEFS}${SKY("Grey")}${CLOUD(60,16,1.1,50,"#eef1f4")}${CLOUD(250,30,.8,70,"#eef1f4")}${HILLS("#9fbf8f","#84ad77")}${TREES("#5c8f58")}
  <rect x="0" y="138" width="400" height="14" fill="#4f7d49"/>${rep(14,i=>`<circle cx="${i*30+10}" cy="139" r="${9+i%3*2}" fill="#4f7d49"/>`)}
  <rect x="0" y="150" width="400" height="40" fill="url(#gRoad)"/><rect x="0" y="150" width="400" height="2.4" fill="#aab2bd"/>
  <g ${A("a-loop","--p:-40px;--d:9s")}>${rep(12,i=>`<rect x="${i*40}" y="180" width="22" height="2.6" fill="#f4f5f7"/>`)}</g>
  <g transform="translate(150 104)"><g ${A("a-bob","--dx:2.4px;--dy:0px;--d:.7s")}>${COACH()}</g></g>
  ${SMOKE(322,128,5,{r:8,rx:10,ry:-60,d:2.4,c:"#2f3237",s1:2.4})}
  ${[[142,COATS[1],SKIN[0],HAIR[2]],[118,COATS[2],SKIN[3],HAIR[1]],[94,COATS[4],SKIN[1],HAIR[5]]].map(([x,coat,skin,hair],i)=>`<g transform="rotate(16 ${x} 172)">${PERSON(x,172-i%2*2+6,{s:.84,coat,skin,hair,long:i===1,hat:i===2?"beanie":"",pose:"point",face:"grit",brow:"cross",
    armL:`transform="rotate(-88)"`,an:A("a-bob","--dx:2.4px;--dy:0px;--d:.7s"),legR:A("a-rock","--a0:-24deg;--a1:14deg;--d:.7s"),legL:A("a-rock","--a0:14deg;--a1:-24deg;--d:.7s")})}</g>`).join("")}
  <g transform="translate(96 112)"><text text-anchor="middle" ${A("big a-blink","font-size:15px;--d:1.4s;--o:0")}>HEAVE!</text></g>
  ${CAP("THE REPLACEMENT BUS NEEDS A REPLACEMENT")}`,

 // It's been windy. Somebody's trampoline is in the overhead wires.
 ()=>`${LINE({sky:"Grey",cloud:"#eef1f4",hillc:["#9fbf8f","#84ad77"],treec:"#5c8f58"})}${TRAINSET(-40,{pax:1,panto:1,driver:1})}
  <g transform="translate(292 66)"><g ${A("a-rock","--a0:-7deg;--a1:9deg;--d:1.3s")}><g transform="rotate(-22)"><path d="M-25 4v25M25 4v25M-9 9v25M9 9v25M-29 29h8M21 29h8M-13 34h8M5 34h8" stroke="#4a535e" stroke-width="2.6" stroke-linecap="round" fill="none"/>
   <ellipse rx="36" ry="10.5" fill="#2f7fd1" stroke="#1d5a9c" stroke-width="1"/><ellipse rx="27" ry="6.8" fill="#15181d"/><path d="M-36 0a36 10.5 0 0 0 72 0" fill="none" stroke="#1d5a9c" stroke-width="1.4"/></g></g></g>
  ${SPARKS(268,60,.8)}
  ${rep(4,i=>`<path d="M${420} ${40+i*26}h-34" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".7" ${A("a-pass",`--x0:40px;--x1:-470px;--d:${1.1+i*.2}s;animation-delay:${-i*.35}s`)}/>`)}
  ${LEAVES(7,["#7fae5c","#a3c585","#5c8f58"])}
  ${PERSON(212,185,{s:.92,hivis:1,hat:"hard",pose:"ear",face:"o",brow:"up",headAn:A("a-rock","--a0:-14deg;--a1:-8deg;--d:1.2s")})}
  ${PERSON(352,185,{s:.8,flip:1,coat:"#e76f51",leg:"#264653",pose:"high",face:"sad",hair:HAIR[3],long:1,armR:A("a-rock","--a0:-10deg;--a1:14deg;--d:.4s")})}
  ${BUBBLE(346,134,272,104,118,["Can we have it back?"],A("a-pop","--d:5s"))}
  ${CAP("TRAMPOLINE ON THE WIRES")}`
],

/* ---------------- NO ROUTE AT ALL ---------------- */
none:[
 // The signal box: kettle's on, signals at red.
 ()=>`${LINE({wires:false,extraBack:SHEEP()})}${SIGNAL(336,"r")}
  <rect x="96" y="118" width="150" height="42" fill="url(#pBrick)"/><rect x="92" y="76" width="158" height="44" fill="#f1ead8" stroke="#8a7f66" stroke-width="1.2"/><path d="M82 78L171 50L260 78Z" fill="#59636e" stroke="#3a424c" stroke-width="1.4" stroke-linejoin="round"/><path d="M171 50v28" stroke="#3a424c" stroke-width="1"/>
  <rect x="100" y="84" width="142" height="28" fill="url(#gGlass)"/><path d="M100 84h142v28h-142zM135.5 84v28M171 84v28M206.5 84v28" fill="none" stroke="#f1ead8" stroke-width="2.4"/>
  ${rep(7,i=>`<rect x="${106+i*4.6}" y="${96+i%2*2}" width="2" height="16" rx="1" fill="${["#c1121f","#1d3557","#ffd21f","#c1121f","#111","#1d3557","#c1121f"][i]}"/>`)}
  <circle cx="190" cy="98" r="6" fill="#f6cfae"/><path d="M184 97a6 6 0 0 1 12 0q-3-3-6-2.6t-6 2.6z" fill="#9a9a9a"/><rect x="176" y="100" width="17" height="12" rx="1" fill="#f6f3ea" stroke="#b9b3a3" stroke-width=".5"/><path d="M178 103h13M178 106h13M178 109h9" stroke="#8d8778" stroke-width=".8"/>
  <path d="M214 112v-9q0-5 6-5h3q6 0 6 5v9z" fill="#c4cbd3" stroke="#59636e" stroke-width="1"/><path d="M229 104l6-4" stroke="#59636e" stroke-width="2" stroke-linecap="round"/>${STEAM(236,98)}
  <rect x="124" y="126" width="94" height="14" rx="2" fill="#1d3557" stroke="#fff" stroke-width="1"/><text x="171" y="136" text-anchor="middle" class="name" style="font-size:8px">SIGNAL BOX</text>
  <rect x="140" y="144" width="62" height="11" rx="1.6" fill="#f4f1ea" stroke="#3a404b" stroke-width="1"/><text x="171" y="152" text-anchor="middle" class="tiny" style="font-size:6px">BACK IN 5 MINS</text>
  <path d="M246 160l22 0M250 152h16M254 144h10M258 136h6" stroke="#8a5a2b" stroke-width="3"/><path d="M246 160l14-26" stroke="#6b4a32" stroke-width="2"/>
  ${CAP("KETTLE’S ON")}`,
 // The packed platform again, with NEVER on the board.
 c=>SCENES.yes[5](c),
 // The end of the line. Literally.
 ()=>`${LINE({sky:"Dusk",hillc:["#c58a6a","#a8705a"],treec:"#6b5a4a",cloud:"#ffe7cf",wires:false})}
  <rect x="306" y="${RY-6}" width="94" height="38" fill="#a8705a"/>${rep(5,i=>`<circle cx="${322+i*18}" cy="${RY-4}" r="${9+i%2*3}" fill="#7f8a4c"/>`)}
  <path d="M286 ${RY-2}l10-26M306 ${RY-2}l-6-26M282 ${RY-2}h28" stroke="#59636e" stroke-width="3.4" stroke-linecap="round"/><rect x="278" y="${RY-36}" width="36" height="9" rx="1.6" fill="#d62828" stroke="#7a1414" stroke-width="1"/><path d="M286 ${RY-36}v9M296 ${RY-36}v9M306 ${RY-36}v9" stroke="#fff" stroke-width="3.4"/>
  <circle cx="296" cy="${RY-43}" r="6" fill="#ff3b30" opacity=".3" ${A("a-pulse","--d:1s;--o:.05")}/><circle cx="296" cy="${RY-42}" r="3" fill="#ff3b30"/>
  ${CROW(304,RY-36)}
  <rect x="356" y="96" width="3.4" height="58" fill="#59636e"/><rect x="330" y="84" width="56" height="15" rx="2" fill="#f4f1ea" stroke="#3a404b" stroke-width="1.2"/><text x="358" y="94.6" text-anchor="middle" class="tiny" style="font-size:6px">END OF THE LINE</text>
  <g ${A("a-pass","--x0:-40px;--x1:440px;--d:7s")}><g transform="translate(0 ${RY-12})"><g ${A("a-bob","--dy:-9px;--d:.6s")}><g ${A("a-spin","--d:1.3s")}><circle r="11" fill="none" stroke="#a3814f" stroke-width="1.6"/><path d="M-9-4q7 9 17 1M-7 7q5-12 15-4M-3-10q-1 12 8 17M-10 1q10-2 20 3" fill="none" stroke="#a3814f" stroke-width="1.3"/></g></g></g></g>
  ${CAP("NO WAY THROUGH. LITERALLY.")}`
],

/* ---------------- SHUT FOR THE NIGHT ---------------- */
closed:[
 // The train asleep in the sidings.
 ()=>`${DEFS}${SKY("Night")}${STARS()}${MOON(340,36)}${BACK(TOWN("#141b3d",1))}${OHLE()}${TRACK()}<rect width="400" height="190" fill="#070b24" opacity=".25"/>
  ${TRAINSET(92,{dark:1,panto:1})}<rect x="-100" y="${TY}" width="388" height="62" fill="#070b24" opacity=".28"/>
  <path d="M254 100q6-22 26-20q10 2 14 14q-10-8-18 6z" fill="#c1121f" stroke="#7d0c14" stroke-width="1"/><path d="M262 88q8 2 12 10M270 82q8 4 12 12" stroke="#fff" stroke-width="2" fill="none"/><circle cx="295" cy="95" r="4" fill="#fff"/>
  <path d="M264 112q5 3 10 0" fill="none" stroke="#0d141c" stroke-width="1.4" stroke-linecap="round"/>
  ${ZZZ(300,84)}${LAMP(36,RY+2,1)}
  ${CAP("TUCKED UP FOR THE NIGHT")}`,

 // The station's shut. The fox has the place to itself.
 ()=>`${DEFS}${SKY("Night")}${STARS()}${MOON(356,30)}
  <rect x="96" y="52" width="210" height="100" fill="url(#pBrick)"/><rect x="96" y="52" width="210" height="100" fill="#070b24" opacity=".45"/><path d="M88 54L201 24L314 54Z" fill="#2c333c" stroke="#171b21" stroke-width="1.4" stroke-linejoin="round"/>
  <rect x="150" y="62" width="102" height="16" rx="2" fill="#1d3557" stroke="#fff" stroke-width="1"/><text x="201" y="73.4" text-anchor="middle" class="name">STATION</text>
  <rect x="160" y="88" width="82" height="64" fill="#8e98a4"/>${rep(10,i=>`<path d="M160 ${93+i*6}h82" stroke="#6c7682" stroke-width="1.4"/>`)}<rect x="158" y="86" width="86" height="4" fill="#59636e"/><rect x="194" y="146" width="14" height="5" rx="1" fill="#3a424c"/>
  ${BOARD(172,104,58,[{l:"CLOSED",lc:"r",lb:"--d:1.2s;--o:.3"}],{rods:false})}
  <rect x="112" y="96" width="30" height="34" fill="#0d141c" stroke="#59636e" stroke-width="1.4"/><rect x="260" y="96" width="30" height="34" fill="#0d141c" stroke="#59636e" stroke-width="1.4"/>
  <rect x="0" y="150" width="400" height="40" fill="#3a404b"/><rect x="0" y="150" width="400" height="2" fill="#59636e"/>
  ${LAMP(336,152,1)}
  <g ${A("a-bob","--dy:-17px;--d:1.5s")}><g transform="translate(55 153)"><path d="M-12-2q0-13 12-13t12 13z" fill="#e2741f" stroke="#9c4a0c" stroke-width="1"/><path d="M-11-10l-3-11l9 5zM11-10l3-11l-9 5z" fill="#e2741f" stroke="#9c4a0c" stroke-width="1"/><path d="M-13-20.4l1.6 4M13-20.4l-1.6 4" stroke="#17181c" stroke-width="1.8" stroke-linecap="round"/><path d="M-12-2q3-7 7-6l5 6l5-6q4-1 7 6z" fill="#fff"/><circle cx="-4.6" cy="-9" r="1.4" fill="#111"/><circle cx="4.6" cy="-9" r="1.4" fill="#111"/><circle cx="0" cy="-3.4" r="1.9" fill="#111"/></g></g>
  <path d="M36 156h38l-3 30h-32z" fill="#2f7d4f" stroke="#1d5234" stroke-width="1.2"/><path d="M41 162v20M48 162v20M55 162v20M62 162v20M69 162v20" stroke="#256a41" stroke-width="1.4"/><circle cx="42" cy="186" r="3.4" fill="#17181c"/><circle cx="68" cy="186" r="3.4" fill="#17181c"/>
  <g transform="translate(34 156)"><g ${A("a-rock","--a0:-2deg;--a1:-30deg;--d:1.5s")}><rect x="0" y="-5" width="42" height="5.6" rx="2" fill="#35915c" stroke="#1d5234" stroke-width="1.2"/></g></g>
  <path d="M96 182l9-3l8 4l-10 3z" fill="#f4f1ea" opacity=".8"/>
  ${CAP("LAST TRAIN’S GONE. ASK THE FOX.")}`,

 // The night bus.
 ()=>`${DEFS}${SKY("Night")}${STARS()}${MOON(346,32)}${BACK(TOWN("#141b3d",1),70)}
  <rect x="0" y="150" width="400" height="40" fill="#22262d"/><rect x="0" y="150" width="400" height="2" fill="#59636e"/><g ${A("a-loop","--p:-40px;--d:.9s")}>${rep(12,i=>`<rect x="${i*40}" y="178" width="22" height="2.4" fill="#aab2bd"/>`)}</g>
  <g ${A("a-loop","--p:-200px;--d:4.5s")}>${[60,260,460].map(x=>LAMP(x,152,1)).join("")}</g>
  <g transform="translate(104 78)"><g ${A("a-bob","--dy:-1.4px;--d:.34s")}>${DECKER()}
   <circle cx="42" cy="20" r="5" fill="#b07a55"/><path d="M36.6 19a5.4 5.4 0 0 1 10.8 0q-2.6-3-5.4-2.6t-5.4 2.6z" fill="#15151a"/><path d="M39.4 20.4h2M43 20.4h2" stroke="#111" stroke-width=".8" stroke-linecap="round"/><path d="M35 27q7-5 14 0z" fill="#3d5a80"/>
   <path d="M52 24l8-3l1 3l-8 3z" fill="#e9c46a" stroke="#b9862b" stroke-width=".5"/></g></g>
  ${ZZZ(156,84)}
  ${CAP("NIGHT BUS IT IS, THEN")}`
],

/* ---------------- TFL ISN'T ANSWERING ---------------- */
dunno:[
 // The member of staff knows as much as you do.
 ()=>`${STATION()}${BOARD(232,44,156,[{l:"??:?? ??????",r:"???",rb:"--d:.7s;--o:.2"}])}
  ${ZOOM(`${PERSON(178,180,{hivis:1,hat:"cap",hatc:"#1d3557",pose:"shrug",face:"flat",brow:"up",skin:SKIN[1],armR:A("a-rock","--a0:-7deg;--a1:9deg;--d:.9s"),armL:A("a-rock","--a0:7deg;--a1:-9deg;--d:.9s"),headAn:A("a-rock","--a0:-6deg;--a1:6deg;--d:.9s")})}
  ${PERSON(240,180,{coat:COATS[1],pose:"hips",brow:"cross",face:"flat",long:1,hair:HAIR[2],bag:1})}
  ${BUBBLE(172,119,60,86,140,["Your guess is as good","as mine, mate."])}`)}
  ${CAP("OFFICIALLY: NO IDEA",8,2)}`,

 // The announcement nobody can make out.
 ()=>`${STATION()}${TANNOY(52,56)}
  ${BUBBLE(82,56,100,40,216,[`<tspan ${A("a-blink","--d:.5s;--o:.15")}>KRRSSH</tspan>… platform… <tspan ${A("a-blink","--d:.37s;--o:.15")}>KSSHH</tspan>…`,`…Shoeburyness?… <tspan ${A("a-blink","--d:.44s;--o:.15")}>KRRK</tspan>… change at…`])}
  ${ZOOM(`${PERSON(150,180,{coat:COATS[5],pose:"ear",brow:"up",face:"o",hair:HAIR[1],skin:SKIN[2],headAn:A("a-rock","--a0:6deg;--a1:14deg;--d:1.2s")})}
  ${PERSON(204,180,{coat:COATS[9],pose:"ear",flip:1,long:1,hair:HAIR[3],brow:"cross",face:"flat",headAn:A("a-rock","--a0:6deg;--a1:14deg;--d:1.5s")})}
  ${PERSON(258,180,{coat:COATS[8],pose:"shrug",hat:"beanie",hatc:"#e76f51",skin:SKIN[3],face:"flat"})}`)}
  ${CAP("DID ANYONE CATCH THAT?",8,2)}`,

 // The departure board has lost the plot.
 ()=>`${STATION()}<g transform="translate(92 42)"><rect x="12" y="-10" width="2.6" height="10" fill="#59636e"/><rect x="201" y="-10" width="2.6" height="10" fill="#59636e"/><rect width="216" height="45" rx="3.4" fill="#12151a" stroke="#3a414c" stroke-width="1.8"/>
   <g class="ph1" style="--d:6s"><text x="108" y="19" text-anchor="middle" class="led">PLEASE STAND BY</text><text x="108" y="33" text-anchor="middle" ${A("led a-blink","--d:.8s;--o:.2")}>. . .</text></g>
   <g class="ph2" style="--d:6s"><text x="7" y="14.4" class="led">??:?? ??????????</text><text x="209" y="14.4" text-anchor="end" class="led r">????</text><text x="7" y="26.4" class="led">08:61 Narnia</text><text x="209" y="26.4" text-anchor="end" class="led g">On time</text><text x="7" y="38.4" class="led">25:00 The Moon</text><text x="209" y="38.4" text-anchor="end" class="led">Delayed</text></g>
   <g class="ph3" style="--d:6s"><text x="108" y="19" text-anchor="middle" class="led r">ERROR 404</text><text x="108" y="33" text-anchor="middle" class="led r">TRAIN NOT FOUND</text></g>
   <rect x="2" y="2" width="212" height="3" fill="#fff" opacity=".1" ${A("a-pass","--x0:0px;--x1:0px;--y0:0px;--y1:40px;--d:1.4s")}/></g>
  ${ZOOM(`${PERSON(174,180,{coat:COATS[0],pose:"ear",brow:"up",face:"flat",tie:"#e9c46a",armR:A("a-rock","--a0:-6deg;--a1:8deg;--d:.3s"),headAn:A("a-rock","--a0:-12deg;--a1:-8deg;--d:1.6s")})}
  ${PERSON(230,180,{coat:COATS[2],pose:"high",propR:PROP.phone,face:"smile",long:1,hair:HAIR[1],skin:SKIN[3]})}`)}
  ${CAP("THE BOARD HAS GONE FUNNY",8,2)}`
]
};

window.CARTOONS={SCENES,VB};
})();
