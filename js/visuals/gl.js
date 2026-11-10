// visuals/gl.js — a minimal WebGL helper, plus the shader code for the liquid
// background and the orb.
//
// A shader is a tiny program the graphics chip runs once per pixel, all in
// parallel; that's how a full-screen animated gradient stays smooth on a phone.
// Every shader here gets the same four inputs ("uniforms"):
//   r  canvas size in pixels      t  time in seconds
//   e  energy, 0-1 (how full the week is)    p  pulse, 0-1 (flash after a new log)

const HEAD =
  "#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n" +
  "uniform vec2 r;uniform float t,e,p;";

// Smooth random-looking noise (value noise + fractal layers). Gives both
// effects their organic, flowing look.
const NOISE =
  "float h(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}" +
  "float n(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);" +
  "return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y)," +
  "mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}" +
  "float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*n(p);p=p*2.02+vec3(1.7);a*=.5;}return s;}";

/** The liquid background: warped noise mixed through the cyan/violet/coral palette. */
export const BACKGROUND_SHADER =
  HEAD + NOISE +
  "void main(){vec2 uv=gl_FragCoord.xy/r;vec2 q=uv*vec2(r.x/r.y,1.)*1.6;float tt=t*.05;" +
  "vec2 w=vec2(fbm(vec3(q,tt)),fbm(vec3(q+vec2(5.2,1.3),tt*1.3)));" +
  "float f=fbm(vec3(q+2.4*w,tt*.8));" +
  "vec3 c=vec3(.015,.022,.06);" +
  "c=mix(c,vec3(.03,.36,.44),smoothstep(.30,.75,f));" +
  "c=mix(c,vec3(.24,.17,.62),smoothstep(.38,.80,w.x));" +
  "c=mix(c,vec3(.62,.15,.34),smoothstep(.55,.85,w.y)*.55);" +
  "c*=.95+.3*e+.4*p;" +
  "c*=1.-.3*length(uv-.5);" +
  "gl_FragColor=vec4(c,1.);}";

/** The orb: a lit, slowly turning sphere with a wobbly edge and a halo that grow with energy. */
export const ORB_SHADER =
  HEAD + NOISE +
  "mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}" +
  "void main(){vec2 uv=(gl_FragCoord.xy*2.-r)/min(r.x,r.y);float d=length(uv),an=atan(uv.y,uv.x);" +
  "float wob=n(vec3(cos(an)*1.5,sin(an)*1.5,t*.5))-.5;" +
  "float R=.58+.05*p+wob*(.03+.05*e);" +
  "vec3 c1=vec3(.10,.90,.88),c2=vec3(.45,.38,1.),c3=vec3(1.,.40,.52);" +
  "vec3 hc=mix(c2,c1,.5+.5*sin(t*.4));" +
  "float halo=exp(-max(d-R,0.)*(7.-3.*e))*(.18+.45*e+.6*p);" +
  "vec3 col=vec3(0.);float a=0.;" +
  "if(d<R){float z=sqrt(R*R-d*d);vec3 nr=vec3(uv,z)/R;vec3 q=nr;q.xz=rot(t*.22)*q.xz;q.yz=rot(.5)*q.yz;" +
  "float f=fbm(q*2.+vec3(0.,t*.12,0.));float g=fbm(q*3.5+f*2.5-vec3(t*.18));" +
  "vec3 base=mix(c2,c1,smoothstep(.30,.65,f));base=mix(base,c3,smoothstep(.50,.75,g)*(.25+.75*e));" +
  "vec3 L=normalize(vec3(-.45,.6,.65));float dif=max(dot(nr,L),0.);" +
  "float sp=pow(max(dot(reflect(-L,nr),vec3(0.,0.,1.)),0.),48.);" +
  "float fr=pow(1.-nr.z,2.2);float br=.40+.60*e;" +
  "col=base*(.18+.95*dif)*br*(.7+.7*g);col+=fr*hc*(.5+.9*e);col+=sp*(.35+.5*e);col+=base*p*.9;" +
  "a=smoothstep(R,R-.012,d);}" +
  "gl_FragColor=vec4(col*a+hc*halo*(1.-a),clamp(a+halo,0.,1.));}";

/**
 * Set up a canvas to run one fragment shader over its whole area.
 * Returns { draw(t, e, p) }, or null if WebGL isn't available (the caller
 * then shows a CSS fallback instead).
 */
export function makeGL(canvas, fragmentSource, alpha) {
  let gl = null;
  try {
    gl = canvas.getContext("webgl", { alpha, antialias: false, premultipliedAlpha: true, powerPreference: "low-power" });
  } catch {}
  if (!gl) return null;

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  };
  const vs = compile(gl.VERTEX_SHADER, "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}");
  const fs = compile(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  // One big triangle that covers the whole canvas.
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, "a");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const U = {};
  for (const name of ["r", "t", "e", "p"]) U[name] = gl.getUniformLocation(program, name);

  return {
    draw(t, e, p) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(U.r, canvas.width, canvas.height);
      gl.uniform1f(U.t, t);
      gl.uniform1f(U.e, e);
      gl.uniform1f(U.p, p);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}
