/* UIAssets/liquidglass.js
   WebGL Liquid Glass overlay for WannUI.
   Usage:
   LiquidGlass.create(document.querySelector(".dock"), { distortion:.9 });
   LiquidGlass.applyTo(".dock, .drawer-panel, .control-center");
*/

(function(){
  const DEFAULTS = {
    distortion: 0.35,
    speed: 0.7,
    shine: 0.42,
    opacity: 0.18,
    rim: 0.34,
    blur: "22px",
    saturate: "170%",
    contrast: "108%",
    maxDpr: 2,
    pausedWhenHidden: true
  };

  const instances = new WeakMap();
  const allInstances = new Set();

  const VERTEX = `
    attribute vec2 a_position;
    varying vec2 v_uv;

    void main(){
      v_uv = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const FRAGMENT = `
    precision mediump float;

    uniform float u_time;
    uniform vec2 u_resolution;
    uniform float u_distortion;
    uniform float u_shine;
    uniform float u_opacity;
    uniform float u_rim;

    varying vec2 v_uv;

    float hash(vec2 p){
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p){
      vec2 i = floor(p);
      vec2 f = fract(p);

      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));

      vec2 u = f * f * (3.0 - 2.0 * f);

      return mix(a, b, u.x) +
        (c - a) * u.y * (1.0 - u.x) +
        (d - b) * u.x * u.y;
    }

    float fbm(vec2 p){
      float value = 0.0;
      float amplitude = 0.5;

      for(int i = 0; i < 5; i++){
        value += amplitude * noise(p);
        p *= 2.05;
        amplitude *= 0.5;
      }

      return value;
    }

    void main(){
      vec2 uv = v_uv;

      float t = u_time;

      float liquid =
        fbm(uv * 4.0 + vec2(t * 0.18, -t * 0.12)) * 0.55 +
        fbm(uv * 9.0 + vec2(-t * 0.10, t * 0.16)) * 0.28;

      float wave =
        sin((uv.x + liquid) * 18.0 + t * 1.35) * 0.5 +
        sin((uv.y - liquid) * 22.0 - t * 1.15) * 0.5;

      float bend = (liquid + wave * 0.12) * u_distortion;

      float edgeX =
        smoothstep(0.0, 0.15, uv.x) *
        smoothstep(1.0, 0.85, uv.x);

      float edgeY =
        smoothstep(0.0, 0.15, uv.y) *
        smoothstep(1.0, 0.85, uv.y);

      float inside = edgeX * edgeY;
      float rim = (1.0 - inside) * u_rim;

      float glareA =
        smoothstep(0.48, 0.0, distance(uv, vec2(0.18, 0.12))) * u_shine;

      float glareB =
        smoothstep(0.72, 0.0, abs((uv.x + uv.y) - 0.38)) * 0.06 * u_shine;

      float body =
        u_opacity +
        bend * 0.075 +
        rim +
        glareA +
        glareB;

      vec3 color = vec3(1.0);

      gl_FragColor = vec4(color, clamp(body, 0.0, 0.82));
    }
  `;

  function compile(gl, type, source){
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error("LiquidGlass shader compile failed: " + info);
    }

    return shader;
  }

  function createProgram(gl){
    const program = gl.createProgram();

    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);

    if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
      const info = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error("LiquidGlass program link failed: " + info);
    }

    return program;
  }

  function setCssVars(el, opts){
    el.style.setProperty("--lg-blur", opts.blur);
    el.style.setProperty("--lg-saturate", opts.saturate);
    el.style.setProperty("--lg-contrast", opts.contrast);
    el.style.setProperty("--lg-canvas-opacity", "1");
  }

  function create(el, options = {}){
    if(!el) return null;
    if(instances.has(el)) return instances.get(el);

    const opts = Object.assign({}, DEFAULTS, options);

    el.classList.add("lg-host");
    setCssVars(el, opts);

    const canvas = document.createElement("canvas");
    canvas.className = "lg-canvas";
    el.prepend(canvas);

    const gl =
      canvas.getContext("webgl", { alpha:true, antialias:true, premultipliedAlpha:true }) ||
      canvas.getContext("experimental-webgl", { alpha:true, antialias:true, premultipliedAlpha:true });

    if(!gl){
      canvas.remove();
      el.classList.add("lg-fallback");
      return null;
    }

    const program = createProgram(gl);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1,-1,
         1,-1,
        -1, 1,
        -1, 1,
         1,-1,
         1, 1
      ]),
      gl.STATIC_DRAW
    );

    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
      time: gl.getUniformLocation(program, "u_time"),
      resolution: gl.getUniformLocation(program, "u_resolution"),
      distortion: gl.getUniformLocation(program, "u_distortion"),
      shine: gl.getUniformLocation(program, "u_shine"),
      opacity: gl.getUniformLocation(program, "u_opacity"),
      rim: gl.getUniformLocation(program, "u_rim")
    };

    let frame = null;
    let destroyed = false;
    let lastW = 0;
    let lastH = 0;

    function resize(){
      const rect = el.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, opts.maxDpr);

      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));

      if(w !== lastW || h !== lastH){
        canvas.width = w;
        canvas.height = h;
        lastW = w;
        lastH = h;
        gl.viewport(0, 0, w, h);
      }
    }

    function render(now){
      if(destroyed) return;

      if(opts.pausedWhenHidden && document.hidden){
        frame = requestAnimationFrame(render);
        return;
      }

      resize();

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform1f(uniforms.time, now * 0.001 * opts.speed);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.distortion, opts.distortion);
      gl.uniform1f(uniforms.shine, opts.shine);
      gl.uniform1f(uniforms.opacity, opts.opacity);
      gl.uniform1f(uniforms.rim, opts.rim);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      frame = requestAnimationFrame(render);
    }

    const api = {
      el,
      canvas,
      options: opts,

      update(nextOptions = {}){
        Object.assign(opts, nextOptions);
        setCssVars(el, opts);
      },

      destroy(){
        destroyed = true;

        if(frame) cancelAnimationFrame(frame);

        canvas.remove();
        el.classList.remove("lg-host", "lg-fallback");

        instances.delete(el);
        allInstances.delete(api);
      }
    };

    instances.set(el, api);
    allInstances.add(api);

    frame = requestAnimationFrame(render);

    return api;
  }

  function applyTo(selector, options = {}){
    return Array
      .from(document.querySelectorAll(selector))
      .map(el => create(el, options))
      .filter(Boolean);
  }

  function destroyAll(){
    Array.from(allInstances).forEach(instance => instance.destroy());
  }

  window.LiquidGlass = {
    create,
    applyTo,
    destroyAll
  };
})();
