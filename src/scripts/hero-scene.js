import * as THREE from "three";

// A lightweight 3D node-graph — a nod to a fraud/agent network — not a decorative blob.
// Kept cheap on purpose: ~70 points, no textures, no post-processing.
export function initHeroScene(canvas) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 14;

  const NODE_COUNT = 70;
  const positions = new Float32Array(NODE_COUNT * 3);
  const spread = 9;
  for (let i = 0; i < NODE_COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spread * 1.8;
    positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
  }

  const pointsGeo = new THREE.BufferGeometry();
  pointsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const pointsMat = new THREE.PointsMaterial({
    color: 0x4c7ef5,
    size: 0.09,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(pointsGeo, pointsMat);
  scene.add(points);

  // connect nearby nodes with thin lines, like a sparse graph
  const linePositions = [];
  const maxDist = 3.1;
  for (let i = 0; i < NODE_COUNT; i++) {
    for (let j = i + 1; j < NODE_COUNT; j++) {
      const dx = positions[i * 3] - positions[j * 3];
      const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
      const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < maxDist) {
        linePositions.push(
          positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
          positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]
        );
      }
    }
  }
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(linePositions), 3)
  );
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x2a3550,
    transparent: true,
    opacity: 0.35,
  });
  const lines = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(lines);

  const group = new THREE.Group();
  group.add(points, lines);
  scene.add(group);

  let mouseX = 0;
  let mouseY = 0;
  window.addEventListener("mousemove", (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function resize() {
    const { clientWidth, clientHeight } = canvas.parentElement;
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  let scrollProgress = 0;
  const heroEl = canvas.closest("section");
  function onScroll() {
    if (!heroEl) return;
    const rect = heroEl.getBoundingClientRect();
    scrollProgress = Math.min(
      Math.max(-rect.top / (rect.height || 1), 0),
      1
    );
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  let raf;
  const clock = new THREE.Clock();
  function animate() {
    raf = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    group.rotation.y = t * 0.05 + mouseX * 0.15;
    group.rotation.x = mouseY * 0.1;
    camera.position.z = 14 - scrollProgress * 4;
    group.position.y = -scrollProgress * 1.5;
    renderer.render(scene, camera);
  }
  animate();

  // pause the render loop when the canvas is off-screen to save cycles
  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries[0].isIntersecting;
      if (visible && !raf) animate();
      if (!visible && raf) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    },
    { threshold: 0 }
  );
  io.observe(canvas);
}
