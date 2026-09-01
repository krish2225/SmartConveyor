/**
 * SmartConveyor - Three.js Scene Lifecycle & Continuous Digital Twin Engine
 * SIH Problem Statement 26008 (NMDC Iron Ore Mining)
 * File: client/src/components/digital-twin/useThreeScene.js
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  createConveyorSystemGroup,
  getPointAlongBeltPath,
  TOTAL_LOOP_LENGTH,
  CONVEYOR_LENGTH,
  HALF_LENGTH,
  PULLEY_RADIUS
} from './BeltMesh.js';
import {
  createJointMarkersGroup,
  updateJointMarkersData,
  updateJointsPosition
} from './JointMarker.js';

export function useThreeScene({
  containerRef,
  joints = [],
  selectedJointId = 'Joint-05',
  beltSpeedMps = 4.2,
  speedMultiplier = 1.0,
  cameraMode = 'ISOMETRIC', // 'ISOMETRIC' | 'HEAD_DISCHARGE' | 'TAIL_FEED' | 'TOP_DOWN' | 'FOLLOW_JOINT'
  onSelectJoint = null
}) {
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const animationFrameRef = useRef(null);
  const beltTextureRef = useRef(null);
  const rollersRef = useRef([]);
  const oreLumpsRef = useRef([]);
  const fixedSensorsRef = useRef([]);
  const markersDataRef = useRef({ jointMarkers: [] });

  const speedRef = useRef(beltSpeedMps);
  const speedMultiplierRef = useRef(speedMultiplier);
  const cameraModeRef = useRef(cameraMode);
  const selectedJointIdRef = useRef(selectedJointId);

  speedRef.current = beltSpeedMps;
  speedMultiplierRef.current = speedMultiplier;
  cameraModeRef.current = cameraMode;
  selectedJointIdRef.current = selectedJointId;

  // 1. Initialize 3D Scene ONCE on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090c13);
    scene.fog = new THREE.FogExp2(0x090c13, 0.01);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 18, 42);
    camera.lookAt(0, 0.5, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Industrial Plant Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00e5ff, 1.4);
    dirLight1.position.set(25, 30, 25);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xff9900, 0.9);
    dirLight2.position.set(-25, 25, -20);
    scene.add(dirLight2);

    // Floor Grid
    const grid = new THREE.GridHelper(100, 50, 0x00e5ff, 0x1a2333);
    grid.position.y = -6.1;
    scene.add(grid);

    // 2. Add Conveyor Structural Mesh, Looping Belt, Ore & Fixed Sensors
    const conveyorData = createConveyorSystemGroup();
    scene.add(conveyorData.group);
    beltTextureRef.current = conveyorData.beltTexture;
    rollersRef.current = conveyorData.rollers;
    oreLumpsRef.current = conveyorData.oreLumps;
    fixedSensorsRef.current = conveyorData.fixedSensors;

    // 3. Add Traveling Joint Markers along Closed Loop
    const markersData = createJointMarkersGroup(joints);
    scene.add(markersData.group);
    markersDataRef.current = markersData;

    // 4. Mouse / Touch Orbit Controls
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let spherical = { radius: 44, theta: 0.15, phi: 1.15 };

    const updateCameraFromSpherical = () => {
      if (cameraModeRef.current !== 'ISOMETRIC') return;
      camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = spherical.radius * Math.cos(spherical.phi);
      camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(0, 0.6, 0);
    };
    updateCameraFromSpherical();

    const onMouseDown = (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e) => {
      if (!isDragging || cameraModeRef.current !== 'ISOMETRIC') return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      spherical.theta -= deltaX * 0.005;
      spherical.phi = Math.max(0.2, Math.min(Math.PI / 2 - 0.05, spherical.phi - deltaY * 0.005));
      updateCameraFromSpherical();
    };

    const onMouseUp = () => { isDragging = false; };

    const onWheel = (e) => {
      e.preventDefault();
      if (cameraModeRef.current !== 'ISOMETRIC') return;
      spherical.radius = Math.max(16, Math.min(80, spherical.radius + e.deltaY * 0.03));
      updateCameraFromSpherical();
    };

    // 5. Raycasting Click on Joint Markers
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        for (const hit of intersects) {
          let curr = hit.object;
          while (curr && !curr.userData?.jointId && curr.parent) {
            curr = curr.parent;
          }
          if (curr?.userData?.jointId) {
            if (onSelectJoint) {
              onSelectJoint(curr.userData.jointId);
            }
            break;
          }
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('click', onClick);

    // 6. 60FPS Render Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const delta = Math.min(0.08, clock.getDelta());
      const rawSpeed = speedRef.current;
      const multiplier = speedMultiplierRef.current;
      const effectiveSpeed = rawSpeed * multiplier;

      if (effectiveSpeed > 0) {
        // Physical world travel speed: 2.5 units/s at 4.2 m/s
        const worldSpeed = (effectiveSpeed / 4.2) * 2.5;

        // A. Continuous Belt Surface Texture Flow
        if (beltTextureRef.current) {
          const uvAdvance = (worldSpeed / TOTAL_LOOP_LENGTH) * 12.0 * delta;
          beltTextureRef.current.offset.x -= uvAdvance;
        }

        // B. Continuous Roller Rotation around Axle (Z-axis)
        if (rollersRef.current && rollersRef.current.length > 0) {
          const rotationAngle = (worldSpeed / PULLEY_RADIUS) * delta;
          rollersRef.current.forEach(roller => {
            roller.rotation.z -= rotationAngle;
          });
        }

        // C. Continuous Closed-Loop Joint Travel
        if (markersDataRef.current?.jointMarkers) {
          updateJointsPosition(markersDataRef.current.jointMarkers, effectiveSpeed, delta, 1.0);
        }

        // D. Dynamic Iron Ore Lumps Stream along Top Carrying Strand
        if (oreLumpsRef.current && oreLumpsRef.current.length > 0) {
          oreLumpsRef.current.forEach(lump => {
            lump.userData.sPos = (lump.userData.sPos + worldSpeed * delta);
            if (lump.userData.sPos >= CONVEYOR_LENGTH - 1.0) {
              lump.userData.sPos = 1.0; // Reset at feed hopper
            }
            const pt = getPointAlongBeltPath(lump.userData.sPos);
            lump.position.set(pt.pos.x, pt.pos.y + 0.35, pt.pos.z + (Math.sin(lump.userData.sPos * 1.5) * 0.8));
          });
        }

        // E. Fixed Sensor Passing Detection & Laser Scan Sheets
        if (fixedSensorsRef.current && markersDataRef.current?.jointMarkers) {
          fixedSensorsRef.current.forEach(sensor => {
            let isJointNear = false;
            markersDataRef.current.jointMarkers.forEach(jointMarker => {
              const dist = Math.abs(jointMarker.position.x - sensor.x);
              const isTopStrand = jointMarker.position.y > 1.0;
              if (dist < 2.4 && isTopStrand) {
                isJointNear = true;
              }
            });

            // Laser bar & scan sheet intensity
            if (sensor.indicator?.material) {
              if (isJointNear) {
                sensor.indicator.material.emissiveIntensity = 2.6;
                sensor.indicator.scale.set(1.15, 1.15, 1.15);
                if (sensor.laserPlane?.material) {
                  sensor.laserPlane.material.opacity = 0.85;
                }
              } else {
                sensor.indicator.material.emissiveIntensity = Math.max(0.6, sensor.indicator.material.emissiveIntensity - delta * 2.5);
                sensor.indicator.scale.set(1.0, 1.0, 1.0);
                if (sensor.laserPlane?.material) {
                  sensor.laserPlane.material.opacity = Math.max(0.2, sensor.laserPlane.material.opacity - delta * 1.5);
                }
              }
            }
          });
        }
      }

      // F. Pulsing Halo Rings Animation
      scene.traverse((obj) => {
        if (obj.name === 'PulseRing' && obj.material.opacity > 0) {
          const pulse = 1.0 + Math.sin(clock.getElapsedTime() * 4.0) * 0.25;
          obj.scale.set(pulse, pulse, pulse);
        }
      });

      // G. Dynamic Camera Presets & Follow Joint Camera Mode
      const currentMode = cameraModeRef.current;
      if (currentMode === 'HEAD_DISCHARGE') {
        camera.position.lerp(new THREE.Vector3(HALF_LENGTH - 4.0, 8.0, 16.0), 0.05);
        camera.lookAt(HALF_LENGTH, 1.5, 0);
      } else if (currentMode === 'TAIL_FEED') {
        camera.position.lerp(new THREE.Vector3(-HALF_LENGTH + 4.0, 8.0, 16.0), 0.05);
        camera.lookAt(-HALF_LENGTH, 1.5, 0);
      } else if (currentMode === 'TOP_DOWN') {
        camera.position.lerp(new THREE.Vector3(0, 48.0, 0.01), 0.05);
        camera.lookAt(0, 0, 0);
      } else if (currentMode === 'FOLLOW_JOINT') {
        const targetJoint = markersDataRef.current?.jointMarkers?.find(
          m => m.userData.jointId === selectedJointIdRef.current
        ) || markersDataRef.current?.jointMarkers?.[0];

        if (targetJoint) {
          const targetCamPos = targetJoint.position.clone().add(new THREE.Vector3(0, 6.0, 14.0));
          camera.position.lerp(targetCamPos, 0.08);
          camera.lookAt(targetJoint.position.x, targetJoint.position.y + 0.5, targetJoint.position.z);
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('click', onClick);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(dom)) container.removeChild(dom);
    };
  }, [containerRef]);

  // 2. In-Place Update when joints data updates from Firestore (NO RECREATION!)
  useEffect(() => {
    if (markersDataRef.current?.jointMarkers) {
      updateJointMarkersData(markersDataRef.current.jointMarkers, joints);
    }
  }, [joints]);

  return {
    scene: sceneRef.current,
    camera: cameraRef.current,
    renderer: rendererRef.current
  };
}
