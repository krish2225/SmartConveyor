/**
 * SmartConveyor - Industrial 3D Conveyor Structural System & Continuous Looping Belt
 * SIH Problem Statement 26008 (NMDC Iron Ore Mining)
 * File: client/src/components/digital-twin/BeltMesh.js
 * 
 * Features:
 * - Seamless closed-loop belt with 35° trough profile on carrying strand
 * - Head Drive Station with motor, gearbox, and discharge hood
 * - Tail Feed Hopper Chute with continuous ore stream
 * - Gravity Take-Up Tension Carriage & Counterweight Tower
 * - 3-roll troughing idler sets & return flat rollers
 * - Fixed sensor stations (Vision Laser Gantry, Ultrasonic Core, Tri-Axial Vib)
 * - Dynamic moving Iron Ore lumps on top strand
 */

import * as THREE from 'three';

export const CONVEYOR_LENGTH = 44.0; // Total x span: -22 to +22
export const HALF_LENGTH = CONVEYOR_LENGTH / 2.0; // 22.0
export const PULLEY_RADIUS = 1.8;
export const TOP_STRAND_Y = 2.4;
export const BOT_STRAND_Y = -1.2;
export const MID_STRAND_Y = (TOP_STRAND_Y + BOT_STRAND_Y) / 2.0; // 0.6
export const BELT_WIDTH = 4.6;
export const IDLER_SPACING = 3.6;

// Total closed loop perimeter length: 2 * L + 2 * PI * R
export const TOTAL_LOOP_LENGTH = 2 * CONVEYOR_LENGTH + 2 * Math.PI * PULLEY_RADIUS;

/**
 * Calculates smooth 3D position, tangent vector, and surface normal along the closed conveyor loop.
 */
export function getPointAlongBeltPath(s) {
  const normS = ((s % TOTAL_LOOP_LENGTH) + TOTAL_LOOP_LENGTH) % TOTAL_LOOP_LENGTH;
  const headArcLength = Math.PI * PULLEY_RADIUS;
  const sTopEnd = CONVEYOR_LENGTH;
  const sHeadEnd = sTopEnd + headArcLength;
  const sBotEnd = sHeadEnd + CONVEYOR_LENGTH;

  const pos = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const normal = new THREE.Vector3();

  if (normS <= sTopEnd) {
    // 1. Top Carrying Strand (-HALF_LENGTH -> +HALF_LENGTH)
    const progress = normS / CONVEYOR_LENGTH;
    const x = -HALF_LENGTH + progress * CONVEYOR_LENGTH;
    // Catenary sag between idler supports
    const relX = ((x + HALF_LENGTH) % IDLER_SPACING + IDLER_SPACING) % IDLER_SPACING;
    const sag = -Math.sin((relX / IDLER_SPACING) * Math.PI) * 0.08;

    pos.set(x, TOP_STRAND_Y + sag, 0);
    tangent.set(1, 0, 0).normalize();
    normal.set(0, 1, 0);
  } else if (normS <= sHeadEnd) {
    // 2. Head Pulley Curve (Top -> Bottom at x = +HALF_LENGTH)
    const arcProgress = (normS - sTopEnd) / headArcLength; // 0 to 1
    const angle = Math.PI / 2 - arcProgress * Math.PI; // PI/2 -> -PI/2
    const x = HALF_LENGTH + Math.cos(angle) * PULLEY_RADIUS;
    const y = MID_STRAND_Y + Math.sin(angle) * PULLEY_RADIUS;

    pos.set(x, y, 0);
    tangent.set(-Math.sin(angle), Math.cos(angle), 0).normalize();
    normal.set(Math.cos(angle), Math.sin(angle), 0).normalize();
  } else if (normS <= sBotEnd) {
    // 3. Bottom Return Strand (+HALF_LENGTH -> -HALF_LENGTH)
    const progress = (normS - sHeadEnd) / CONVEYOR_LENGTH;
    const x = HALF_LENGTH - progress * CONVEYOR_LENGTH;

    pos.set(x, BOT_STRAND_Y, 0);
    tangent.set(-1, 0, 0).normalize();
    normal.set(0, -1, 0);
  } else {
    // 4. Tail Pulley Curve (Bottom -> Top at x = -HALF_LENGTH)
    const arcProgress = (normS - sBotEnd) / headArcLength; // 0 to 1
    const angle = -Math.PI / 2 - arcProgress * Math.PI; // -PI/2 -> -3PI/2
    const x = -HALF_LENGTH + Math.cos(angle) * PULLEY_RADIUS;
    const y = MID_STRAND_Y + Math.sin(angle) * PULLEY_RADIUS;

    pos.set(x, y, 0);
    tangent.set(-Math.sin(angle), Math.cos(angle), 0).normalize();
    normal.set(Math.cos(angle), Math.sin(angle), 0).normalize();
  }

  return { pos, tangent, normal };
}

/**
 * Creates repeating high-contrast conveyor belt rubber texture with steel cord lines and chevron treads.
 */
function createBeltSurfaceTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Dark industrial rubber
  ctx.fillStyle = '#11151e';
  ctx.fillRect(0, 0, 1024, 256);

  // Side rubber edge margins
  ctx.fillStyle = '#1c2331';
  ctx.fillRect(0, 0, 1024, 22);
  ctx.fillRect(0, 234, 1024, 22);

  // Cyan safety center guide line
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 3;
  ctx.setLineDash([24, 16]);
  ctx.beginPath();
  ctx.moveTo(0, 128);
  ctx.lineTo(1024, 128);
  ctx.stroke();
  ctx.setLineDash([]);

  // Molded chevron grip cleats
  ctx.strokeStyle = '#2d3748';
  ctx.lineWidth = 6;
  for (let x = -64; x < 1088; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 26);
    ctx.lineTo(x + 28, 128);
    ctx.lineTo(x, 230);
    ctx.stroke();
  }

  // Steel cord ribs
  ctx.strokeStyle = '#1e2838';
  ctx.lineWidth = 1.5;
  for (let y = 30; y < 226; y += 14) {
    if (Math.abs(y - 128) < 10) continue;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 1);
  return texture;
}

/**
 * Generates continuous 3D closed-loop ribbon geometry with 35° troughing on carrying strand.
 */
function createConveyorBeltGeometry() {
  const steps = 300;
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const uvs = [];
  const normals = [];
  const indices = [];

  const crossSections = 5; // 5 cross points: left edge, left trough, center, right trough, right edge
  const zOffsets = [-2.3, -1.3, 0, 1.3, 2.3];

  for (let i = 0; i <= steps; i++) {
    const s = (i / steps) * TOTAL_LOOP_LENGTH;
    const { pos, normal } = getPointAlongBeltPath(s);
    const isTopStrand = s <= CONVEYOR_LENGTH;

    for (let j = 0; j < crossSections; j++) {
      const z = zOffsets[j];
      // On top carrying strand, curve upward by 35° on outer edges for troughing
      let yOffset = 0;
      if (isTopStrand) {
        if (j === 0 || j === 4) yOffset = 0.45; // edge lift
        else if (j === 1 || j === 3) yOffset = 0.15;
      }

      positions.push(pos.x, pos.y + yOffset, z);
      uvs.push((i / steps) * 12.0, j / (crossSections - 1));
      normals.push(normal.x, normal.y, 0);
    }
  }

  for (let i = 0; i < steps; i++) {
    for (let j = 0; j < crossSections - 1; j++) {
      const row1 = i * crossSections;
      const row2 = (i + 1) * crossSections;

      const a = row1 + j;
      const b = row1 + j + 1;
      const c = row2 + j;
      const d = row2 + j + 1;

      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

export function createConveyorSystemGroup() {
  const group = new THREE.Group();
  group.name = 'ConveyorSystem';
  const rollers = [];
  const fixedSensors = [];
  const oreLumps = [];

  // Materials
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.35 });
  const yellowSafetyMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.5, roughness: 0.4 });
  const idlerMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7, roughness: 0.3 });
  const pulleyMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, metalness: 0.9, roughness: 0.2 });
  const motorMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.7, roughness: 0.4 });
  const oreMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.95, metalness: 0.1 });

  // 1. Long Heavy Steel Truss Stringers (Left & Right)
  [-2.6, 2.6].forEach(z => {
    const truss = new THREE.Mesh(new THREE.BoxGeometry(CONVEYOR_LENGTH + 4.0, 0.9, 0.4), steelMat);
    truss.position.set(0, -0.1, z);
    group.add(truss);

    // Yellow Safety Guard Rail on top of truss
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, CONVEYOR_LENGTH + 2.0, 8).rotateZ(Math.PI / 2), yellowSafetyMat);
    rail.position.set(0, 3.2, z);
    group.add(rail);
  });

  // Vertical Support Columns / Pillars
  const legPositions = [-18, -10, -2, 6, 14, 20];
  legPositions.forEach(x => {
    [-2.6, 2.6].forEach(z => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 5.8, 12), steelMat);
      leg.position.set(x, -3.0, z);
      group.add(leg);
    });

    // Cross brace tie beam
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 5.4), steelMat);
    tie.position.set(x, -2.5, 0);
    group.add(tie);
  });

  // 2. Head Discharge Drive Pulley (x = +HALF_LENGTH)
  const headPulley = new THREE.Mesh(
    new THREE.CylinderGeometry(PULLEY_RADIUS, PULLEY_RADIUS, BELT_WIDTH + 0.4, 32).rotateX(Math.PI / 2),
    pulleyMat
  );
  headPulley.position.set(HALF_LENGTH, MID_STRAND_Y, 0);
  headPulley.name = 'HeadDrivePulley';
  group.add(headPulley);
  rollers.push(headPulley);

  // Drive Motor & Planetary Gearbox
  const motorMesh = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.8, 3.2), motorMat);
  motorMesh.position.set(HALF_LENGTH + 2.2, MID_STRAND_Y, 4.2);
  group.add(motorMesh);

  // Discharge Chute Hood (Ore chute at discharge end)
  const dischargeHood = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 4.5, BELT_WIDTH + 1.2),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.4, transparent: true, opacity: 0.85 })
  );
  dischargeHood.position.set(HALF_LENGTH + 1.5, 1.8, 0);
  group.add(dischargeHood);

  // 3. Tail Feed Chute & Hopper (x = -HALF_LENGTH)
  const tailPulley = new THREE.Mesh(
    new THREE.CylinderGeometry(PULLEY_RADIUS, PULLEY_RADIUS, BELT_WIDTH + 0.4, 32).rotateX(Math.PI / 2),
    pulleyMat
  );
  tailPulley.position.set(-HALF_LENGTH, MID_STRAND_Y, 0);
  tailPulley.name = 'TailPulley';
  group.add(tailPulley);
  rollers.push(tailPulley);

  // Overhead Feed Hopper Chute (Where ore enters belt)
  const hopperMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(2.4, 1.4, 4.0, 4).rotateY(Math.PI / 4),
    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 })
  );
  hopperMesh.position.set(-HALF_LENGTH + 3.0, 6.2, 0);
  group.add(hopperMesh);

  // 4. Upper 3-Roll Troughing Idlers & Lower Return Flat Rollers
  const centerRollGeo = new THREE.CylinderGeometry(0.26, 0.26, 2.0, 16).rotateX(Math.PI / 2);
  const wingRollGeo = new THREE.CylinderGeometry(0.24, 0.24, 1.6, 16).rotateX(Math.PI / 2);
  const returnRollGeo = new THREE.CylinderGeometry(0.24, 0.24, BELT_WIDTH + 0.2, 16).rotateX(Math.PI / 2);

  for (let x = -HALF_LENGTH + 2.5; x <= HALF_LENGTH - 2.5; x += IDLER_SPACING) {
    // Upper Center Horizontal Roll
    const centerRoll = new THREE.Mesh(centerRollGeo, idlerMat);
    centerRoll.position.set(x, TOP_STRAND_Y - 0.32, 0);
    group.add(centerRoll);
    rollers.push(centerRoll);

    // Upper Left Wing Roll (+35 deg)
    const leftRoll = new THREE.Mesh(wingRollGeo, idlerMat);
    leftRoll.position.set(x, TOP_STRAND_Y - 0.08, 1.65);
    leftRoll.rotation.x = Math.PI * 0.18;
    group.add(leftRoll);
    rollers.push(leftRoll);

    // Upper Right Wing Roll (-35 deg)
    const rightRoll = new THREE.Mesh(wingRollGeo, idlerMat);
    rightRoll.position.set(x, TOP_STRAND_Y - 0.08, -1.65);
    rightRoll.rotation.x = -Math.PI * 0.18;
    group.add(rightRoll);
    rollers.push(rightRoll);

    // Lower Return Flat Roll
    const returnRoll = new THREE.Mesh(returnRollGeo, idlerMat);
    returnRoll.position.set(x, BOT_STRAND_Y + 0.28, 0);
    group.add(returnRoll);
    rollers.push(returnRoll);
  }

  // 5. Continuous Looping Conveyor Belt
  const beltTexture = createBeltSurfaceTexture();
  const beltMaterial = new THREE.MeshStandardMaterial({
    map: beltTexture,
    roughness: 0.85,
    metalness: 0.15,
    side: THREE.DoubleSide
  });

  const beltMesh = new THREE.Mesh(createConveyorBeltGeometry(), beltMaterial);
  beltMesh.name = 'ContinuousBeltMesh';
  beltMesh.receiveShadow = true;
  group.add(beltMesh);

  // 6. Dynamic Iron Ore Lumps / Particles Riding on Top Strand
  const oreGroup = new THREE.Group();
  oreGroup.name = 'OreStreamGroup';

  const lumpGeo1 = new THREE.DodecahedronGeometry(0.35, 1);
  const lumpGeo2 = new THREE.DodecahedronGeometry(0.5, 0);

  for (let i = 0; i < 40; i++) {
    const sPos = (i / 40) * (CONVEYOR_LENGTH - 4.0) + 1.0;
    const lump = new THREE.Mesh(i % 2 === 0 ? lumpGeo1 : lumpGeo2, oreMat);
    lump.userData = { sPos };
    lump.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    oreGroup.add(lump);
    oreLumps.push(lump);
  }
  group.add(oreGroup);

  // 7. Fixed Sensor Stations with Real Visible Lasers & LEDs

  // Station 1: Optical Line-Scan Vision AI Gantry (x = 14.0, Top Discharge Strand)
  const visionGantryGroup = new THREE.Group();
  visionGantryGroup.position.set(14.0, TOP_STRAND_Y, 0);
  visionGantryGroup.userData = { id: 'STATION_VISION', name: 'High-Speed Optical Line-Scan AI', x: 14.0 };

  // Gantry Arch Frame
  const gantryArch = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 3.8, BELT_WIDTH + 1.6),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.3 })
  );
  gantryArch.position.set(0, 1.9, 0);
  visionGantryGroup.add(gantryArch);

  // Visible Cyan/Red Laser Sheet Emitter Bar
  const laserBarMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xef4444,
    emissiveIntensity: 1.0
  });
  const laserBar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, BELT_WIDTH - 0.2), laserBarMat);
  laserBar.position.set(0, 2.9, 0);
  visionGantryGroup.add(laserBar);

  // Downward projected laser fan plane
  const laserPlaneMat = new THREE.MeshBasicMaterial({
    color: 0xef4444,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide
  });
  const laserPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 2.8), laserPlaneMat);
  laserPlane.position.set(0, 1.4, 0);
  laserPlane.rotation.y = Math.PI / 2;
  visionGantryGroup.add(laserPlane);

  group.add(visionGantryGroup);
  fixedSensors.push({ id: 'STATION_VISION', x: 14.0, indicator: laserBar, laserPlane });

  // Station 2: Ultrasonic Splice Core & Acoustic Array (x = 0.0, Mid-Span)
  const ultraGroup = new THREE.Group();
  ultraGroup.position.set(0.0, TOP_STRAND_Y, 0);
  ultraGroup.userData = { id: 'STATION_ULTRASONIC', name: 'Ultrasonic Splice Scanner', x: 0.0 };

  const ultraBridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 2.4, BELT_WIDTH + 1.2),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.35 })
  );
  ultraBridge.position.set(0, 1.2, 0);
  ultraGroup.add(ultraBridge);

  const ultraLedMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 1.0 });
  const ultraLed = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, BELT_WIDTH - 0.4, 16).rotateX(Math.PI / 2), ultraLedMat);
  ultraLed.position.set(0, 1.7, 0);
  ultraGroup.add(ultraLed);
  group.add(ultraGroup);
  fixedSensors.push({ id: 'STATION_ULTRASONIC', x: 0.0, indicator: ultraLed });

  // Station 3: Chute Dynamic Load & Tri-Axial Vibration Station (x = -15.0)
  const vibGroup = new THREE.Group();
  vibGroup.position.set(-15.0, TOP_STRAND_Y, 0);
  vibGroup.userData = { id: 'STATION_VIBRATION', name: 'Tri-Axial Bearing Vibration Sensor', x: -15.0 };

  const vibMount = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1.8, 1.2),
    new THREE.MeshStandardMaterial({ color: 0xea580c, metalness: 0.6, roughness: 0.3 })
  );
  vibMount.position.set(0, 0.9, 2.9);
  vibGroup.add(vibMount);

  const vibLedMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 1.0 });
  const vibLed = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), vibLedMat);
  vibLed.position.set(0, 1.9, 2.9);
  vibGroup.add(vibLed);
  group.add(vibGroup);
  fixedSensors.push({ id: 'STATION_VIBRATION', x: -15.0, indicator: vibLed });

  return {
    group,
    beltMesh,
    beltTexture,
    rollers,
    oreLumps,
    fixedSensors
  };
}
