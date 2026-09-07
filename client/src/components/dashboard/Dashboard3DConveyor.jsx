import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card.jsx';
import { Button } from '../ui/button.jsx';
import { Badge } from '../ui/badge.jsx';
import { Boxes, Eye, Maximize2, Pause, Play, Sparkles, Activity, AlertTriangle } from 'lucide-react';

export default function Dashboard3DConveyor({
  beltSpeed = 4.15,
  selectedJointId = 'Joint-05',
  riskScore = 89,
  onInvestigateJoint
}) {
  const mountRef = useRef(null);
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(true);
  const [cameraPreset, setCameraPreset] = useState('isometric');

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const rendererRef = useRef(null);
  const beltMeshRef = useRef(null);
  const drivePulleyRef = useRef(null);
  const tailPulleyRef = useRef(null);
  const oreParticlesRef = useRef([]);
  const jointMarkerRef = useRef(null);
  const reqIdRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 340;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0f172a); // sleek dark canvas background for 3D contrast

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(12, 8, 14);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // don't go below ground
    controls.minDistance = 5;
    controls.maxDistance = 35;
    controls.target.set(0, 0.5, 0);
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 2.0);
    dirLight.position.set(15, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const cyanPoint = new THREE.PointLight(0x06b6d4, 3, 20);
    cyanPoint.position.set(0, 4, 2);
    scene.add(cyanPoint);

    const warningPoint = new THREE.PointLight(0xef4444, riskScore > 75 ? 4 : 1, 15);
    warningPoint.position.set(2, 2, 0);
    scene.add(warningPoint);

    // 6. Ground Grid
    const gridHelper = new THREE.GridHelper(30, 30, 0x0284c7, 0x1e293b);
    gridHelper.position.y = -1.2;
    scene.add(gridHelper);

    // 7. Structural Frame / Conveyor Truss (Industrial Steel Truss)
    const frameGeo = new THREE.BoxGeometry(16, 0.3, 2.2);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.8,
      roughness: 0.3
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.y = -0.5;
    frame.castShadow = true;
    frame.receiveShadow = true;
    scene.add(frame);

    // Truss Legs
    for (let x of [-7, -3.5, 0, 3.5, 7]) {
      const legGeo = new THREE.BoxGeometry(0.25, 1.2, 2.4);
      const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7 });
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(x, -1.0, 0);
      scene.add(leg);
    }

    // 8. Drive Pulley (Head) & Tail Pulley
    const pulleyGeo = new THREE.CylinderGeometry(1.0, 1.0, 2.0, 24);
    const pulleyMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.9,
      roughness: 0.2
    });

    // Drive Pulley (Right / Head)
    const drivePulley = new THREE.Mesh(pulleyGeo, pulleyMat);
    drivePulley.rotation.x = Math.PI / 2;
    drivePulley.position.set(7, 0.5, 0);
    scene.add(drivePulley);
    drivePulleyRef.current = drivePulley;

    // Tail Pulley (Left)
    const tailPulley = new THREE.Mesh(pulleyGeo, pulleyMat);
    tailPulley.rotation.x = Math.PI / 2;
    tailPulley.position.set(-7, 0.5, 0);
    scene.add(tailPulley);
    tailPulleyRef.current = tailPulley;

    // Idler Rollers along conveyor bed
    for (let x = -5.5; x <= 5.5; x += 1.8) {
      const idlerGeo = new THREE.CylinderGeometry(0.25, 0.25, 2.0, 16);
      const idlerMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.3 });
      const idler = new THREE.Mesh(idlerGeo, idlerMat);
      idler.rotation.x = Math.PI / 2;
      idler.position.set(x, 0.5, 0);
      scene.add(idler);
    }

    // 9. Conveyor Belt (Top and bottom carry decks + curved caps)
    const topBeltGeo = new THREE.BoxGeometry(14, 0.08, 1.9);
    const beltMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.7,
      metalness: 0.1
    });
    const topBelt = new THREE.Mesh(topBeltGeo, beltMat);
    topBelt.position.set(0, 1.5, 0);
    topBelt.receiveShadow = true;
    scene.add(topBelt);
    beltMeshRef.current = topBelt;

    const bottomBeltGeo = new THREE.BoxGeometry(14, 0.08, 1.9);
    const bottomBelt = new THREE.Mesh(bottomBeltGeo, beltMat);
    bottomBelt.position.set(0, -0.5, 0);
    scene.add(bottomBelt);

    // 10. Splice Joint Hazard Indicator on Belt (Joint-05)
    const jointGeo = new THREE.BoxGeometry(0.6, 0.12, 1.92);
    const jointMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 0.8,
      roughness: 0.2
    });
    const jointMarker = new THREE.Mesh(jointGeo, jointMat);
    jointMarker.position.set(2, 1.52, 0);
    scene.add(jointMarker);
    jointMarkerRef.current = jointMarker;

    // Glowing Warning Beacon Ring above Splice
    const ringGeo = new THREE.TorusGeometry(0.8, 0.06, 12, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xef4444, wireframe: true });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(2, 2.3, 0);
    scene.add(ring);

    // 11. Ore Particle Stream (Dynamic 3D iron ore rocks flowing across the belt)
    const oreParticles = [];
    const oreGeo = new THREE.DodecahedronGeometry(0.2, 0);
    const oreMat = new THREE.MeshStandardMaterial({
      color: 0xa16207, // raw hematite/iron ore brownish-gold
      roughness: 0.9,
      metalness: 0.2
    });

    for (let i = 0; i < 40; i++) {
      const ore = new THREE.Mesh(oreGeo, oreMat);
      ore.position.set(
        -7 + Math.random() * 14,
        1.62 + Math.random() * 0.1,
        -0.7 + Math.random() * 1.4
      );
      ore.scale.set(0.6 + Math.random() * 0.8, 0.6 + Math.random() * 0.8, 0.6 + Math.random() * 0.8);
      ore.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      scene.add(ore);
      oreParticles.push(ore);
    }
    oreParticlesRef.current = oreParticles;

    // 12. Animation Loop
    let lastTime = performance.now();
    const animate = () => {
      reqIdRef.current = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      controls.update();

      // Rotate pulleys & flow ore if playing
      const currentSpeed = beltSpeed || 4.15;
      if (isPlaying) {
        if (drivePulleyRef.current) drivePulleyRef.current.rotation.y += currentSpeed * delta * 0.8;
        if (tailPulleyRef.current) tailPulleyRef.current.rotation.y += currentSpeed * delta * 0.8;

        // Animate Ore Rocks Flowing
        oreParticlesRef.current.forEach((ore) => {
          ore.position.x += currentSpeed * delta * 1.2;
          if (ore.position.x > 7) {
            ore.position.x = -7;
            ore.position.z = -0.7 + Math.random() * 1.4;
          }
        });

        // Pulsing splice hazard ring
        if (jointMarkerRef.current) {
          const pulse = 0.5 + 0.5 * Math.sin(now * 0.005);
          ring.rotation.z += 0.02;
          ring.scale.setScalar(0.9 + 0.2 * pulse);
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
      renderer.dispose();
    };
  }, [isPlaying, riskScore, beltSpeed]);

  // Camera preset switches
  const setCameraView = (view) => {
    setCameraPreset(view);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    if (view === 'isometric') {
      camera.position.set(12, 8, 14);
      controls.target.set(0, 0.5, 0);
    } else if (view === 'drive') {
      camera.position.set(9, 3, 5);
      controls.target.set(7, 0.5, 0);
    } else if (view === 'joint') {
      camera.position.set(3, 3, 4);
      controls.target.set(2, 1.5, 0);
    } else if (view === 'top') {
      camera.position.set(0, 18, 0.1);
      controls.target.set(0, 0, 0);
    }
  };

  return (
    <Card className="overflow-hidden border-border bg-surface shadow-sm transition-colors">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10 border border-primary/30 text-primary">
            <Boxes className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <span>Interactive 3D Conveyor Spatial Twin</span>
              <Badge variant="cyan" size="sm" className="font-mono text-[9px]">
                WebGL LIVE
              </Badge>
            </CardTitle>
            <div className="text-[11px] text-muted-foreground font-mono">
              Real-time spatial physics • {beltSpeed} m/s linear velocity • Ore Stream Sync
            </div>
          </div>
        </div>

        {/* View Switchers & Controls */}
        <div className="flex items-center gap-1.5">
          <Button
            variant={cameraPreset === 'isometric' ? 'default' : 'outline'}
            size="xs"
            onClick={() => setCameraView('isometric')}
            className="text-[10px] font-mono h-7"
          >
            3D Iso
          </Button>
          <Button
            variant={cameraPreset === 'joint' ? 'default' : 'outline'}
            size="xs"
            onClick={() => setCameraView('joint')}
            className="text-[10px] font-mono h-7"
          >
            Joint-05
          </Button>
          <Button
            variant={cameraPreset === 'drive' ? 'default' : 'outline'}
            size="xs"
            onClick={() => setCameraView('drive')}
            className="text-[10px] font-mono h-7"
          >
            Drive Pulley
          </Button>
          <Button
            variant={cameraPreset === 'top' ? 'default' : 'outline'}
            size="xs"
            onClick={() => setCameraView('top')}
            className="text-[10px] font-mono h-7 hidden sm:inline-flex"
          >
            Top View
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Pause 3D motion' : 'Resume 3D motion'}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/digital-twin')}
            className="gap-1 text-[11px] font-mono h-7 px-2 border-primary/40 text-primary hover:bg-primary/10 ml-1"
          >
            <Maximize2 className="w-3 h-3" />
            <span className="hidden sm:inline">Full 3D Suite</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 relative bg-slate-950">
        {/* Three.js Container */}
        <div ref={mountRef} className="w-full h-72 sm:h-80 cursor-grab active:cursor-grabbing" />

        {/* HUD Overlay Pill Top-Left */}
        <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-md p-2 text-[11px] font-mono text-slate-200 shadow-md space-y-1 select-none pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-white">DRIVE MOTOR: 340 kW (NOMINAL)</span>
          </div>
          <div className="text-[10px] text-slate-400">
            Belt Velocity: <span className="text-cyan-300 font-bold">{beltSpeed} m/s</span> | Ore Load: <span className="text-amber-300 font-bold">1,636 t/h</span>
          </div>
        </div>

        {/* HUD Overlay Pill Bottom-Right (Joint Danger Indicator) */}
        <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md border border-red-500/50 rounded-md p-2.5 text-[11px] font-mono text-slate-200 shadow-lg flex items-center gap-3 select-none">
          <div className="p-1.5 rounded bg-red-950/80 border border-red-500 text-red-400 animate-pulse">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-red-400 flex items-center gap-1.5">
              <span>{selectedJointId} RUPTURE RISK: {riskScore}%</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Station #4 Ultrasonic Sensor Drift Detected
            </div>
          </div>
          {onInvestigateJoint && (
            <Button
              variant="destructive"
              size="xs"
              onClick={() => onInvestigateJoint(selectedJointId)}
              className="text-[10px] font-mono uppercase h-6 px-2 font-bold"
            >
              Inspect
            </Button>
          )}
        </div>

        {/* Orbit Helper Cue */}
        <div className="absolute bottom-3 left-3 text-[10px] font-mono text-slate-400 bg-slate-900/60 backdrop-blur-xs px-2 py-0.5 rounded pointer-events-none">
          🖱️ Drag to rotate • Scroll to zoom • Click buttons to switch views
        </div>
      </CardContent>
    </Card>
  );
}
