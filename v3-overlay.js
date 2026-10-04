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
      metalness: 0.0,
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

      // Build a race-driver statue from scratch — Marquis in a racing jacket.
      // Pose: standing straight, confident, helmet tucked under left arm,
      // right hand at side with clearly-defined fingers.
      const root = new T.Group();
      root.name = 'v3-start-statue';

      const mat = (hex, opts) => new T.MeshStandardMaterial(Object.assign({color: hex, roughness: 0.55, metalness: 0.15}, opts || {}));
      const emat = (hex, intensity) => new T.MeshStandardMaterial({color: hex, roughness: 0.4, metalness: 0.2, emissive: new T.Color(hex), emissiveIntensity: intensity||0.35});

      const skinC = 0x6b4a35;        // skin tone
      const jacketRed = 0xd1283a;    // racing jacket red
      const jacketWhite = 0xf2f2f0;  // trim white
      const pantsC = 0x1a1d24;       // dark pants
      const bootC = 0x0a0c0f;        // boots
      const helmetC = 0x111418;      // helmet
      const visorC = 0x4df0e0;       // teal visor (matches v3)

      // === BOOTS (two feet)
      [[-0.9, 0], [0.9, 0]].forEach(([x,z]) => {
        const boot = new T.Mesh(new T.BoxGeometry(1.2, 0.9, 2.0), mat(bootC, {roughness:0.3}));
        boot.position.set(x, 0.45, z + 0.2);
        root.add(boot);
      });

      // === LEGS (racing pants, dark with white stripe)
      [[-0.9, 0], [0.9, 0]].forEach(([x,z]) => {
        const leg = new T.Mesh(new T.CylinderGeometry(0.85, 0.72, 6.4, 20), mat(pantsC));
        leg.position.set(x, 4.1, z);
        root.add(leg);
        // White racing stripe down outer side
        const stripe = new T.Mesh(new T.BoxGeometry(0.22, 6.0, 0.15), mat(jacketWhite, {roughness:0.3}));
        stripe.position.set(x + (x<0 ? -0.78 : 0.78), 4.1, 0);
        root.add(stripe);
      });

      // === TORSO (racing jacket)
      // Lower torso / waist (tucked)
      const waist = new T.Mesh(new T.CylinderGeometry(1.55, 1.4, 1.4, 20), mat(jacketRed));
      waist.position.set(0, 7.6, 0);
      root.add(waist);
      // Chest
      const chest = new T.Mesh(new T.CylinderGeometry(1.95, 1.55, 3.8, 20), mat(jacketRed));
      chest.position.set(0, 10.2, 0);
      root.add(chest);
      // Shoulder yoke (white band across chest)
      const yoke = new T.Mesh(new T.CylinderGeometry(2.02, 1.98, 0.75, 20), mat(jacketWhite, {roughness:0.35}));
      yoke.position.set(0, 11.7, 0);
      root.add(yoke);
      // Jacket zipper strip
      const zipper = new T.Mesh(new T.BoxGeometry(0.18, 5.0, 0.08), mat(0x2a2a2a, {metalness:0.6, roughness:0.3}));
      zipper.position.set(0, 10.2, 1.95);
      root.add(zipper);
      // Chest number panel (white rectangle)
      const num = new T.Mesh(new T.BoxGeometry(1.8, 1.4, 0.1), mat(jacketWhite, {roughness:0.3}));
      num.position.set(-1.0, 10.0, 1.85);
      num.rotation.y = 0.12;
      root.add(num);

      // === ARMS (jacket sleeves hanging straight-ish, left slightly bent to hold helmet)
      // Right upper arm (hanging at side)
      const rUpper = new T.Mesh(new T.CylinderGeometry(0.72, 0.62, 3.4, 16), mat(jacketRed));
      rUpper.position.set(2.3, 10.4, 0);
      rUpper.rotation.z = 0.12;
      root.add(rUpper);
      // Right forearm (jacket + extend down)
      const rFore = new T.Mesh(new T.CylinderGeometry(0.62, 0.52, 3.2, 16), mat(jacketRed));
      rFore.position.set(2.75, 7.4, 0);
      rFore.rotation.z = 0.05;
      root.add(rFore);
      // Right white cuff
      const rCuff = new T.Mesh(new T.CylinderGeometry(0.56, 0.56, 0.3, 16), mat(jacketWhite, {roughness:0.3}));
      rCuff.position.set(2.78, 5.85, 0);
      root.add(rCuff);

      // Left upper arm (bent to cradle helmet)
      const lUpper = new T.Mesh(new T.CylinderGeometry(0.72, 0.62, 3.4, 16), mat(jacketRed));
      lUpper.position.set(-2.3, 10.4, 0.1);
      lUpper.rotation.z = -0.1;
      root.add(lUpper);
      // Left forearm (bent forward, horizontal)
      const lFore = new T.Mesh(new T.CylinderGeometry(0.62, 0.52, 3.4, 16), mat(jacketRed));
      lFore.position.set(-2.1, 9.0, 1.8);
      lFore.rotation.x = Math.PI/2 - 0.1;
      lFore.rotation.z = -0.1;
      root.add(lFore);
      const lCuff = new T.Mesh(new T.CylinderGeometry(0.56, 0.56, 0.3, 16), mat(jacketWhite, {roughness:0.3}));
      lCuff.position.set(-1.95, 9.0, 3.3);
      lCuff.rotation.x = Math.PI/2;
      root.add(lCuff);

      // === HANDS WITH FIVE DISTINCT FINGERS EACH
      // Build a hand group: palm box + 4 fingers (closed-ish) + 1 thumb
      function makeHand(){
        const h = new T.Group();
        // Palm
        const palm = new T.Mesh(new T.BoxGeometry(0.75, 0.9, 0.42), mat(skinC));
        palm.position.set(0, -0.45, 0);
        h.add(palm);
        // 4 fingers (slightly curled, pointing down from the palm)
        const fingerLen = [0.75, 0.85, 0.80, 0.68];
        for(let i=0; i<4; i++){
          const f = new T.Mesh(new T.CylinderGeometry(0.09, 0.08, fingerLen[i], 10), mat(skinC));
          const x = -0.26 + i*0.17;
          f.position.set(x, -1.05 - fingerLen[i]/2 + 0.1, 0.05);
          // slight curl: rotate slightly inward on z (so tips come toward palm)
          f.rotation.x = 0.18;
          h.add(f);
        }
        // Thumb (shorter, offset to the side)
        const thumb = new T.Mesh(new T.CylinderGeometry(0.11, 0.09, 0.65, 10), mat(skinC));
        thumb.position.set(0.42, -0.75, 0.18);
        thumb.rotation.z = -0.9;
        thumb.rotation.x = 0.2;
        h.add(thumb);
        return h;
      }

      // Right hand (hanging naturally at side)
      const rHand = makeHand();
      rHand.position.set(2.78, 4.0, 0);
      root.add(rHand);
      // Left hand (gripping helmet from above)
      const lHand = makeHand();
      lHand.position.set(-1.85, 8.6, 3.6);
      lHand.rotation.x = -Math.PI/2 + 0.2;  // palm facing down
      lHand.rotation.y = 0.15;
      root.add(lHand);

      // === HELMET (tucked under left arm, in front of hip)
      const helmet = new T.Mesh(new T.SphereGeometry(1.3, 20, 16), mat(helmetC, {roughness:0.25, metalness:0.5}));
      helmet.position.set(-1.9, 7.6, 3.3);
      helmet.scale.set(1.0, 1.0, 1.15);
      root.add(helmet);
      // Visor (teal, matches v3 palette)
      const visor = new T.Mesh(new T.SphereGeometry(1.25, 20, 10, 0, Math.PI*2, Math.PI/3, Math.PI/3.2), emat(visorC, 0.9));
      visor.position.set(-1.9, 7.75, 3.3);
      visor.scale.set(1.02, 1.0, 1.18);
      visor.rotation.x = 0.1;
      root.add(visor);
      // Helmet trim (red stripe over the top)
      const htrim = new T.Mesh(new T.TorusGeometry(1.28, 0.08, 8, 24, Math.PI), emat(jacketRed, 0.4));
      htrim.position.set(-1.9, 7.6, 3.3);
      htrim.rotation.y = Math.PI/2;
      root.add(htrim);

      // === NECK
      const neck = new T.Mesh(new T.CylinderGeometry(0.55, 0.6, 0.9, 14), mat(skinC));
      neck.position.set(0, 12.5, 0);
      root.add(neck);

      // === HEAD (skin, with simple facial features)
      const head = new T.Mesh(new T.SphereGeometry(1.25, 24, 20), mat(skinC));
      head.position.set(0, 13.65, 0);
      head.scale.set(0.95, 1.08, 0.98);
      root.add(head);
      // Short hair cap
      const hair = new T.Mesh(new T.SphereGeometry(1.28, 20, 16, 0, Math.PI*2, 0, Math.PI/2.4), mat(0x1a1410, {roughness:0.7}));
      hair.position.set(0, 13.75, -0.05);
      hair.scale.set(0.98, 1.0, 1.02);
      root.add(hair);
      // Eyes (two small dark dots)
      [-0.4, 0.4].forEach(x => {
        const eye = new T.Mesh(new T.SphereGeometry(0.1, 10, 8), mat(0x0a0a0a));
        eye.position.set(x, 13.7, 1.08);
        root.add(eye);
      });
      // Subtle smile line
      const mouth = new T.Mesh(new T.BoxGeometry(0.35, 0.05, 0.03), mat(0x3a2420));
      mouth.position.set(0, 13.25, 1.15);
      root.add(mouth);

      // === BASE PLINTH (stone pedestal)
      const plinth = new T.Mesh(new T.CylinderGeometry(2.6, 2.8, 0.7, 24), mat(0x2c3038, {roughness:0.9, metalness:0.05}));
      plinth.position.set(0, -0.35, 0);
      root.add(plinth);
      // Teal underglow ring
      const glow = new T.Mesh(new T.TorusGeometry(2.5, 0.12, 10, 48), emat(visorC, 1.2));
      glow.position.set(0, 0.05, 0);
      glow.rotation.x = Math.PI/2;
      root.add(glow);

      root.traverse(m => { if(m.isMesh){ m.castShadow = true; m.receiveShadow = true; }});

      // Place at the start — right-shoulder, slightly ahead of the car
      root.position.set(22, 0, -4);
      root.scale.set(0.85, 0.85, 0.85);
      root.rotation.y = Math.PI * 0.9;  // face oncoming car
      sc.add(root);
      console.log(MARK, 'race-driver statue built and placed at', root.position.toArray());

      // Fill lights so he reads cleanly against the dusk sky
      if(!sc.getObjectByName('v3c-statue-fill')){
        const fillGrp = new T.Group();
        fillGrp.name = 'v3c-statue-fill';
        const key = new T.SpotLight(0xfff0d6, 85, 70, Math.PI/4, 0.5, 1.1);
        key.position.set(34, 24, 4); key.target.position.set(22, 9, -4);
        fillGrp.add(key); fillGrp.add(key.target);
        const rim = new T.SpotLight(0x4df0e0, 48, 60, Math.PI/4, 0.5, 1.2);
        rim.position.set(10, 22, -16); rim.target.position.set(22, 9, -4);
        fillGrp.add(rim); fillGrp.add(rim.target);
        const amb = new T.PointLight(0xffe6b0, 18, 28, 2);
        amb.position.set(22, 2, -4);
        fillGrp.add(amb);
        sc.add(fillGrp);
        console.log(MARK, 'statue fill lights spawned');
      }
      return true;
    }catch(e){ console.warn(MARK, 'positionStartStatue:', e.message, e.stack); return false; }
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
