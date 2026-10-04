/* ═══════════════════════════════════════════════════════════════════
   CAREER DRIVE v3 — 2026 PREMIUM OVERLAY
   HUD (speedo, modes, nav card, minimap) + Career Drive billboards
   + Infrastructure Operations gantry sign + CAREER license plate
   ═══════════════════════════════════════════════════════════════════ */
(function v3Overlay(){
  if(window.__v3Installed) return;
  window.__v3Installed = true;
  const MARK = '[v3]';

  function buildHud(){
    if(document.querySelector('.v3-speedo')) return;
    const sp = document.createElement('div');
    sp.className = 'v3-speedo';
    sp.innerHTML = `
      <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="v3-sp-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#4df0e0"/>
            <stop offset="0.6" stop-color="#8df2e8"/>
            <stop offset="1" stop-color="#ff4a5c"/>
          </linearGradient>
        </defs>
        <circle class="v3-sp-track" cx="100" cy="100" r="78"/>
        <circle class="v3-sp-fill"  cx="100" cy="100" r="78"/>
      </svg>
      <div class="v3-sp-center">
        <div class="v3-sp-speed" data-sp>0</div>
        <div class="v3-sp-unit">MPH</div>
      </div>
      <div class="v3-sp-gear" data-gear>D</div>
    `;
    document.body.appendChild(sp);

    const modes = document.createElement('div');
    modes.className = 'v3-modes';
    modes.innerHTML = `
      <div class="v3-mode active" data-mode="SPORT">SPORT</div>
      <div class="v3-mode-bar"></div>
      <div class="v3-mode" data-mode="NORMAL">NORMAL</div>
      <div class="v3-mode" data-mode="TRACK">TRACK</div>
    `;
    document.body.appendChild(modes);
    modes.querySelectorAll('.v3-mode').forEach(el => {
      el.addEventListener('click', () => {
        modes.querySelectorAll('.v3-mode').forEach(e => e.classList.remove('active'));
        el.classList.add('active');
        window.__v3Mode = el.dataset.mode;
      });
    });

    const nav = document.createElement('div');
    nav.className = 'v3-nav';
    nav.innerHTML = `
      <div class="v3-nav-pin">▲</div>
      <div class="v3-nav-txt">
        <div class="v3-nav-d" data-nav-d>1.0 MI</div>
        <div class="v3-nav-l">NEXT</div>
      </div>
    `;
    document.body.appendChild(nav);

    const mini = document.createElement('div');
    mini.className = 'v3-mini';
    mini.innerHTML = `
      <svg viewBox="-70 -70 140 140">
        <circle class="v3-mini-grid" cx="0" cy="0" r="30"/>
        <circle class="v3-mini-grid" cx="0" cy="0" r="55"/>
        <line class="v3-mini-grid" x1="-70" y1="0" x2="70" y2="0"/>
        <line class="v3-mini-grid" x1="0" y1="-70" x2="0" y2="70"/>
        <path class="v3-mini-route" data-mini-route d=""/>
        <g data-mini-pois></g>
        <polygon class="v3-mini-car" points="0,-8 6,6 0,2 -6,6"/>
      </svg>
      <div class="v3-mini-cardinal">N</div>
      <div class="v3-mini-label">ROUTE</div>
    `;
    document.body.appendChild(mini);
    console.log(MARK, 'HUD built');
  }

  function tickHud(){
    try{
      const veh = window.__veh && window.__veh();
      const ui  = window.__ui;
      if(veh){
        const kmh = +(veh.kmh || 0);
        const mph = Math.max(0, Math.round(kmh * 0.6214));
        const spEl = document.querySelector('[data-sp]');
        if(spEl) spEl.textContent = mph;
        const spFill = document.querySelector('.v3-sp-fill');
        if(spFill){
          const pct = Math.min(1, mph / 140);
          spFill.style.strokeDashoffset = String(490 * (1 - pct));
        }
        const gear = document.querySelector('[data-gear]');
        if(gear){
          const target = (veh.speed < -0.3) ? 'R' : 'D';
          if(gear.textContent !== target) gear.textContent = target;
        }
        updateNav(veh, ui);
        updateMinimap(veh, ui);
      }
    }catch(e){}
    requestAnimationFrame(tickHud);
  }

  const PLAZA_Z = [-143, -179, -325, -445, -596, -639];
  const PLAZA_NAMES = ['TSYS','AFLAC','BOEING','STEFANINI','FCB','ALDRIDGE'];

  function updateNav(veh, ui){
    const carZ = veh.pos.z;
    let nextIdx = -1, nextDist = Infinity;
    for(let i=0; i<PLAZA_Z.length; i++){
      if(ui && ui.visited && ui.visited.has(i)) continue;
      const d = Math.abs(carZ - PLAZA_Z[i]);
      if(d < nextDist){ nextDist = d; nextIdx = i; }
    }
    const navD = document.querySelector('[data-nav-d]');
    if(navD){
      const miles = (nextDist / 660) * 1.0;
      navD.textContent = miles < 0.05 ? 'HERE' : (miles.toFixed(1) + ' MI');
    }
    const navL = document.querySelector('.v3-nav-l');
    if(navL && nextIdx >= 0) navL.textContent = PLAZA_NAMES[nextIdx] + ' · NEXT';
  }

  function updateMinimap(veh, ui){
    const route = document.querySelector('[data-mini-route]');
    if(route && !route.getAttribute('d')){
      route.setAttribute('d', 'M -2 -55 C -8 -30, 6 -10, 0 10 S -6 35, -2 55');
    }
    const poisG = document.querySelector('[data-mini-pois]');
    if(poisG && poisG.children.length === 0){
      PLAZA_Z.forEach((pz, i) => {
        const n = document.createElementNS('http://www.w3.org/2000/svg','circle');
        n.setAttribute('r','3.6');
        n.setAttribute('cx', String((i%2 ? 6 : -6) + (i-2)*2));
        n.setAttribute('cy', String(-50 + i*18));
        n.setAttribute('class','v3-mini-poi');
        n.dataset.idx = String(i);
        poisG.appendChild(n);
      });
    }
    if(poisG && ui && ui.visited){
      poisG.querySelectorAll('.v3-mini-poi').forEach(el => {
        const idx = +el.dataset.idx;
        if(ui.visited.has(idx)) el.classList.add('visited');
      });
    }
  }

  function boostGrade(){
    try{
      const sc = window.__scene;
      if(!sc) return;
      sc.traverse(o => {
        if(o.isDirectionalLight && o.intensity > 1.0 && o.intensity < 2.5){
          o.intensity = Math.min(2.1, o.intensity * 1.08);
        }
        if(o.isHemisphereLight && o.intensity > 0.4 && o.intensity < 0.9){
          o.intensity = Math.min(0.78, o.intensity * 1.1);
        }
      });
    }catch(e){}
  }

  function makeBillboardTexture(w, h, draw){
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    draw(ctx, w, h);
    const T = window.THREE;
    if(!T) return null;
    const tex = new T.CanvasTexture(c);
    tex.anisotropy = 8;
    if(T.SRGBColorSpace) tex.colorSpace = T.SRGBColorSpace;
    return tex;
  }

  function drawCareerDrive(ctx, w, h){
    const g = ctx.createLinearGradient(0,0,0,h);
    g.addColorStop(0,'#0a1824'); g.addColorStop(1,'#040810');
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='rgba(77,240,224,.5)'; ctx.lineWidth=4; ctx.strokeRect(6,6,w-12,h-12);
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='#ffb864';
    ctx.font='900 92px "Barlow Condensed", "Impact", sans-serif';
    ctx.fillText('♛ CAREER', w/2, h*0.33);
    ctx.font='900 72px "Barlow Condensed", sans-serif';
    ctx.fillStyle='#4df0e0';
    ctx.fillText('DRIVE', w/2, h*0.56);
    ctx.font='600 24px "Inter", sans-serif';
    ctx.fillStyle='#8aa0b6';
    ctx.fillText('K . W   •   706', w/2, h*0.82);
  }

  function drawKentavien(ctx, w, h){
    const g = ctx.createLinearGradient(0,0,0,h);
    g.addColorStop(0,'#0d1420'); g.addColorStop(1,'#030609');
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#4df0e0'; ctx.fillRect(0,0,20,h);
    ctx.fillStyle='#ffffff'; ctx.font='900 76px "Impact", sans-serif';
    ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillText('♛ KENTAVIEN', 46, h*0.21);
    ctx.fillText('     WILLIS', 46, h*0.37);
    ctx.font='600 36px "Inter", sans-serif';
    ctx.fillStyle='#4df0e0';
    ['GAMES','TECH','TRAVEL','WEALTH'].forEach((t,i) => {
      ctx.fillText(t, 46, h*0.56 + i*48);
    });
    ctx.font='900 128px "Impact", sans-serif';
    ctx.fillStyle='#ff6a7a';
    ctx.textAlign='right';
    ctx.fillText('706', w-30, h*0.86);
  }

  function drawInfraOps(ctx, w, h){
    ctx.fillStyle='rgba(8,12,18,.95)';
    ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='rgba(77,240,224,.42)'; ctx.lineWidth=2; ctx.strokeRect(4,4,w-8,h-8);
    ctx.fillStyle='#eef3f8';
    ctx.font='700 54px "Barlow Condensed", sans-serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('↑  Infrastructure Operations     ↑  Hybrid', w/2, h/2);
  }

  function createBillboardPlane(width, height, texture, pos, rotY){
    const T = window.THREE;
    if(texture) texture.needsUpdate = true;
    const mat = new T.MeshBasicMaterial({
      map: texture,
      side: T.DoubleSide,
      transparent: false,
      toneMapped: false
    });
    const geo = new T.PlaneGeometry(width, height);
    const mesh = new T.Mesh(geo, mat);
    mesh.position.set(pos[0], pos[1], pos[2]);
    if(rotY !== undefined) mesh.rotation.y = rotY;
    mesh.name = 'v3-billboard';
    return mesh;
  }

  function spawnBillboards(){
    const T = window.THREE, sc = window.__scene;
    if(!T || !sc) return false;
    if(sc.getObjectByName('v3-billboard-group')) return true;

    const grp = new T.Group();
    grp.name = 'v3-billboard-group';

    const tCareer = makeBillboardTexture(1024, 1024, drawCareerDrive);
    grp.add(createBillboardPlane(28, 28, tCareer, [-54, 22, -70], Math.PI * 0.5));

    const tKent = makeBillboardTexture(1024, 1024, drawKentavien);
    grp.add(createBillboardPlane(36, 36, tKent, [-62, 26, -220], Math.PI * 0.5));

    const tInfra = makeBillboardTexture(2048, 384, drawInfraOps);
    grp.add(createBillboardPlane(60, 11, tInfra, [0, 17, -100], 0));

    grp.add(createBillboardPlane(22, 22, tCareer, [48, 20, -300], -Math.PI * 0.5));
    grp.add(createBillboardPlane(30, 30, tKent, [60, 24, -420], -Math.PI * 0.5));

    sc.add(grp);
    console.log(MARK, 'spawned', grp.children.length, 'billboards');
    return true;
  }

  function addLicensePlate(){
    const T = window.THREE, car = window.__car;
    if(!T || !car || !car.root) return false;
    if(car.root.getObjectByName('v3-plate')) return true;

    const c = document.createElement('canvas');
    c.width = 512; c.height = 160;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#f6efd8';
    ctx.fillRect(0, 0, 512, 160);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, 492, 140);
    ctx.fillStyle = '#1a1a1a';
    ctx.font = '900 108px "Impact", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CAREER', 256, 86);
    ctx.font = '600 20px "Inter", sans-serif';
    ctx.fillStyle = '#444';
    ctx.fillText('GEORGIA', 256, 20);

    const tex = new T.CanvasTexture(c);
    tex.anisotropy = 8;
    if(T.SRGBColorSpace) tex.colorSpace = T.SRGBColorSpace;

    const mat = new T.MeshStandardMaterial({
      map: tex,
      emissive: 0xffffff,
      emissiveMap: tex,
      emissiveIntensity: 0.25,
      roughness: 0.45,
      metalness: 0.08,
      side: T.DoubleSide
    });
    const geo = new T.PlaneGeometry(0.72, 0.22);
    const plate = new T.Mesh(geo, mat);
    plate.name = 'v3-plate';
    plate.position.set(0, 0.60, 2.28);
    plate.rotation.y = Math.PI;
    car.root.add(plate);
    console.log(MARK, 'license plate added');
    return true;
  }

  function hideStartGantry(){
    try{
      const sc = window.__scene;
      if(!sc) return false;
      let hid = 0;
      sc.traverse(o => {
        if(o && o.name === 'start-gantry' && o.visible){
          o.visible = false; hid++;
        }
      });
      if(hid) console.log(MARK, 'start-gantry hidden �', hid);
      return hid > 0;
    }catch(e){ return false; }
  }

  function positionStartStatue(){
    try{
      const T = window.THREE, sc = window.__scene;
      if(!T || !sc) return false;
      if(sc.getObjectByName('v3-start-statue')) return true;
      if(window.__v3StatueLoading) return false;
      if(!T.GLTFLoader){
        if(window.__v3GLTFLoaderLoading) return false;
        window.__v3GLTFLoaderLoading = true;
        const sc0 = document.createElement('script');
        sc0.src = 'GLTFLoader.js?v=2';
        document.head.appendChild(sc0);
        return false;
      }

      window.__v3StatueLoading = true;
      const loader = new T.GLTFLoader();
      // Load MeshoptDecoder for meshopt-compressed GLB (preserves original UVs — no decimation)
      const startLoad = () => loader.load('marquis-v13.glb', gltf => {
        try{
          const root = gltf.scene || gltf.scenes[0];
          root.name = 'v3-start-statue';
          // PBR-PRESERVING pipeline: keep the Meshy photogrammetry material intact
          // (baseColor + metallicRoughness + normal maps) instead of rebuilding it.
          // Only correct color space, kill unwanted emissive, pick up scene envMap,
          // and apply a subtle warm tonal lift so the texture reads richer.
          // Lit PBR material — texture has already been color-corrected to show
          // brown skin, dark hair, and gray suit cleanly. Use MeshStandardMaterial
          // with map + normalMap + minimal env so lighting adds subtle shading on
          // top of the correct colors.
          root.traverse(o => {
            if(!o.isMesh) return;
            o.castShadow = true;
            o.receiveShadow = true;
            o.frustumCulled = false;
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            const first = mats[0];
            const origMap = first?.map;
            const origNormal = first?.normalMap;
            if(origMap){ origMap.colorSpace = T.SRGBColorSpace; origMap.anisotropy = 16; origMap.needsUpdate = true; }
            if(origNormal){ origNormal.colorSpace = T.NoColorSpace; origNormal.needsUpdate = true; }
            o.material = new T.MeshStandardMaterial({
              map: origMap,
              normalMap: origNormal,
              color: 0xffffff,
              roughness: 0.95,
              metalness: 0.02,
              envMapIntensity: 0,  // no env tinting
              side: T.FrontSide
            });
          });
          // ARM RIG DISABLED - marquis.glb has a confident pose (not T-pose)
          if(false) { // --- disabled arm rig below ---
          root.traverse(o => {
            if(!o.isMesh) return;
            const pos = o.geometry.attributes.position;
            const SHOULDER_X = 0.0022, SHOULDER_Y = 0.0015;
            const BLEND_IN = 0.0017, BLEND_OUT = 0.0026;
            const ARM_ANGLE = -Math.PI * 0.52;
            for(let i = 0; i < pos.count; i++){
              const ox = pos.getX(i), oy = pos.getY(i), oz = pos.getZ(i);
              const absX = Math.abs(ox);
              if(absX <= BLEND_IN) continue;
              const t = Math.min(1, Math.max(0, (absX - BLEND_IN) / (BLEND_OUT - BLEND_IN)));
              const w = t * t * (3 - 2 * t);
              const side = ox > 0 ? 1 : -1;
              const px = side * SHOULDER_X, py = SHOULDER_Y;
              const rx = ox - px, ry = oy - py;
              const a = w * side * ARM_ANGLE;
              const sa = Math.sin(a), ca = Math.cos(a);
              pos.setXYZ(i, (px + rx*ca - ry*sa) - w*side*0.0004, py + rx*sa + ry*ca, oz);
            }
            pos.needsUpdate = true;
            o.geometry.computeVertexNormals();
          });

          } // --- end disabled arm rig ---
          // Scale a bit taller (7.5u) for a stronger silhouette from the splash camera
          const bbox = new T.Box3().setFromObject(root);
          const size = new T.Vector3(); bbox.getSize(size);
          root.scale.setScalar(size.y > 0.01 ? (7.5 / size.y) : 1);
          const bbox2 = new T.Box3().setFromObject(root);
          // Stance: face slightly toward the chase camera's natural approach angle
          root.position.set(16, -bbox2.min.y + 0.9, 6); // +0.9 = raised plinth top
          root.rotation.y = -Math.PI / 7;              // more face-on, less turned
          sc.add(root);
          console.log(MARK, 'marquis.glb loaded (PBR preserved, warm-lifted)');

          // Premium two-tier plinth: dark matte base + brushed metal cap + teal halo
          const base = new T.Mesh(
            new T.CylinderGeometry(2.5, 2.7, 0.7, 32),
            new T.MeshStandardMaterial({color: 0x14181f, roughness: 0.95, metalness: 0.02, envMapIntensity: 0.6})
          );
          base.position.set(16, 0.35, 6); base.name = 'v3-start-plinth-base';
          base.receiveShadow = true; sc.add(base);
          const cap = new T.Mesh(
            new T.CylinderGeometry(2.25, 2.4, 0.22, 48),
            new T.MeshStandardMaterial({color: 0x2a2f3a, roughness: 0.35, metalness: 0.85, envMapIntensity: 1.2})
          );
          cap.position.set(16, 0.81, 6); cap.name = 'v3-start-plinth-cap';
          cap.receiveShadow = true; sc.add(cap);
          const glow = new T.Mesh(
            new T.TorusGeometry(2.25, 0.09, 12, 64),
            new T.MeshStandardMaterial({color: 0x4df0e0, emissive: new T.Color(0x4df0e0), emissiveIntensity: 1.8, toneMapped: false})
          );
          glow.position.set(16, 0.94, 6); glow.rotation.x = Math.PI/2; glow.name = 'v3-start-glow'; sc.add(glow);

          // MINIMAL lighting rig — just a close bright PointLight to flood the statue
          // with white and overpower nearby colored scene lights. Fewer lights = fewer
          // shader permutations = faster boot. The PointLight at near-zero distance
          // with intensity 400 is >> than scene lights at this distance.
          if(!sc.getObjectByName('v3c-statue-fill')){
            const fillGrp = new T.Group();
            fillGrp.name = 'v3c-statue-fill';
            // Primary white flood 2m from statue
            const flood = new T.PointLight(0xffffff, 110, 15, 1.3);
            flood.position.set(17, 6, 8);
            fillGrp.add(flood);
            // Secondary bounce
            const bounce = new T.PointLight(0xfff5e8, 50, 12, 1.5);
            bounce.position.set(14, 8, 7);
            fillGrp.add(bounce);
            sc.add(fillGrp);
          }
        }catch(e){ console.warn(MARK, 'GLB post-load:', e.message); }
      }, undefined, err => {
        console.warn(MARK, 'GLB load failed:', err && err.message);
        window.__v3StatueLoading = false;
      });
      // Load MeshoptDecoder, then start the GLB load
      if(window.__v3MeshoptReady){ startLoad(); }
      else {
        // Build URL from parts so proxy email-obfuscation doesn't mangle the version @ sign
        const PKG = 'meshoptimizer';
        const VER = '0.21.0';
        const AT = String.fromCharCode(64);
        const url = 'https://cdn.jsdelivr.net/npm/' + PKG + AT + VER + '/meshopt_decoder.module.js';
        import(url).then(async (mod) => {
          const dec = mod.MeshoptDecoder;
          await dec.ready;
          loader.setMeshoptDecoder(dec);
          window.__v3MeshoptReady = true;
          console.log(MARK, 'MeshoptDecoder ready; loading marquis.glb');
          startLoad();
        }).catch(e => {
          console.warn(MARK, 'MeshoptDecoder load failed:', e.message, '- trying unpkg fallback');
          const url2 = 'https://unpkg.com/' + PKG + AT + VER + '/meshopt_decoder.module.js';
          import(url2).then(async (mod) => {
            const dec = mod.MeshoptDecoder;
            await dec.ready;
            loader.setMeshoptDecoder(dec);
            window.__v3MeshoptReady = true;
            console.log(MARK, 'MeshoptDecoder loaded via unpkg');
            startLoad();
          }).catch(e2 => {
            console.warn(MARK, 'Both CDN loads failed:', e2.message);
            startLoad();
          });
        });
      }
      return true;
    }catch(e){ console.warn(MARK, 'positionStartStatue:', e.message); return false; }
  }

  function tryInstall(){
    try{
      buildHud();
      boostGrade();
      spawnBillboards();
      addLicensePlate();
      hideStartGantry();
      positionStartStatue();
    }catch(e){
      console.warn(MARK, 'install step failed:', e.message);
    }
  }
  let attempts = 0;
  const iv = setInterval(() => {
    tryInstall();
    attempts++;
    const sc = window.__scene;
    const car = window.__car;
    const hudReady = !!document.querySelector('.v3-speedo');
    const bbReady = sc && !!sc.getObjectByName('v3-billboard-group');
    const plateReady = car && car.root && !!car.root.getObjectByName('v3-plate');
    const statueReady = sc && !!sc.getObjectByName('v3-start-statue');
    if((hudReady && bbReady && plateReady && statueReady) || attempts > 60){
      clearInterval(iv);
      console.log(MARK, 'install complete after', attempts, 'attempts', {hudReady, bbReady, plateReady, statueReady});
    }
  }, 500);

  requestAnimationFrame(tickHud);
  console.log(MARK, 'v3e overlay bootstrapped');
})();
