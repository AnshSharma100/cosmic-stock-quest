// Cinematic Milky Way Visualization
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
// ...import custom shaders for sun, dust, DOF, etc.

// 1. Scene, Camera, Renderer
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a0a1a, 0.00015);
const cssScene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(80, window.innerWidth/window.innerHeight, 0.1, 20000);
camera.position.set(0, 200, 1800);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setClearColor(0x000010);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const cssRenderer = new CSS3DRenderer();
cssRenderer.setSize(window.innerWidth, window.innerHeight);
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.top = '0';
cssRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(cssRenderer.domElement);

// 2. Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 200;
controls.maxDistance = 8000;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.04;

// 3. Postprocessing (Bloom, DOF, etc.)
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.2, 0.6, 0.01);
composer.addPass(bloomPass);
// TODO: Add DOF, motion blur, dust passes

// 4. Orientation Grid
const grid = new THREE.GridHelper(8000, 80, 0x8888ff, 0x222244);
grid.material.opacity = 0.18;
grid.material.transparent = true;
grid.position.y = -400;
scene.add(grid);

// 5. Milky Way Galaxy (particles)
function createGalaxy() {
    const N = 80000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(N * 3);
    const colors = new Float32Array(N * 3);
    const sizes = new Float32Array(N);
    for (let i = 0; i < N; i++) {
        // Spiral arms
        const arm = i % 4;
        const angle = (i / N) * Math.PI * 8 + arm * Math.PI/2 + Math.random()*0.2;
        const radius = Math.pow(Math.random(), 1.7) * 4000 + 200;
        const height = (Math.random()-0.5) * 200 * (1-radius/4000);
        positions[3*i] = Math.cos(angle) * radius;
        positions[3*i+1] = height;
        positions[3*i+2] = Math.sin(angle) * radius;
        // Color: core = yellow/white, arms = blue/white/orange
        let c;
        if (radius < 800) c = new THREE.Color().setHSL(0.12, 0.7, 0.9); // core yellow
        else if (Math.random() < 0.5) c = new THREE.Color().setHSL(0.6, 0.7, 1.0); // blue
        else c = new THREE.Color().setHSL(0.08 + Math.random()*0.08, 0.7, 0.8); // orange/white
        colors[3*i] = c.r;
        colors[3*i+1] = c.g;
        colors[3*i+2] = c.b;
        sizes[i] = 2 + Math.random()*2 + (radius < 800 ? 2 : 0);
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    const material = new THREE.PointsMaterial({
        size: 8,
        vertexColors: true,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);
}
createGalaxy();

// 6. Sun with animated flares (placeholder, replace with shader)
const sunGeo = new THREE.SphereGeometry(60, 64, 64);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xffee88 });
const sun = new THREE.Mesh(sunGeo, sunMat);
sun.position.set(0, 0, 0);
scene.add(sun);
// TODO: Add animated corona, flares, and lens flare

// 7. CSS3D Labels for named stars
async function addLabels() {
    const res = await fetch('data/stars.json');
    const stars = await res.json();
    stars.forEach(star => {
        if (!star.name) return;
        const div = document.createElement('div');
        div.className = 'label';
        div.innerHTML = `<span class="name">${star.name}</span><span class="dist">${star.distance} ly</span>`;
        const label = new CSS3DObject(div);
        label.position.set(star.x*40, star.y*40, star.z*40);
        cssScene.add(label);
    });
}
addLabels();

// 8. Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    composer.render();
    cssRenderer.render(cssScene, camera);
}
animate();

// 9. Responsive
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

// 10. Search
const searchInput = document.getElementById('search');
if (searchInput) {
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        document.querySelectorAll('.label').forEach(label => {
            const match = label.textContent.toLowerCase().includes(query);
            label.style.display = match ? '' : 'none';
        });
    });
    window.addEventListener('keydown', e => {
        if (e.key === '/') {
            e.preventDefault();
            searchInput.focus();
        }
    });
}
