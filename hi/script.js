import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as d3 from 'd3';

const canvas = document.querySelector('canvas');
const labelsRoot = document.querySelector('#labels');
const searchInput = document.querySelector('#search');
const infoPanel = document.getElementById('info-panel');

if (!canvas || !labelsRoot || !searchInput || !infoPanel) {
  console.error('Missing required DOM elements');
}

// Renderer setup
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();

// Camera setup
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 8000);
camera.position.set(200, 200, 450);
camera.lookAt(0, 0, 0);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 40;
controls.maxDistance = 3000;

// Ambient lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.6));

// Resize handler
window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
});

// Background stars
function makeBackgroundStars(count = 120000) {
  const geom = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const r = 1000 + Math.random() * 2500;
    const theta = Math.random() * Math.PI * 2;
    const u = Math.random() * 2 - 1;
    const s = Math.sqrt(1 - u * u);
    pos[i * 3 + 0] = r * s * Math.cos(theta);
    pos[i * 3 + 1] = r * s * Math.sin(theta);
    pos[i * 3 + 2] = r * u;

    const tint = 0.85 + Math.random() * 0.15;
    colors[i * 3 + 0] = 0.8 * tint;
    colors[i * 3 + 1] = 0.9 * tint;
    colors[i * 3 + 2] = 1.0 * tint;
  }

  geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.9,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const cloud = new THREE.Points(geom, mat);
  cloud.frustumCulled = false;

  const group = new THREE.Group();
  group.add(cloud);
  group.userData.rotate = () => { group.rotation.y += 0.00025; };
  scene.add(group);
  return group;
}

// Star glow texture
function createStarSpriteTexture(size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');

  const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  g.addColorStop(0.0, 'rgba(255,255,255,1)');
  g.addColorStop(0.15,'rgba(230,240,255,0.95)');
  g.addColorStop(0.35,'rgba(130,170,255,0.6)');
  g.addColorStop(1.0, 'rgba(0,0,0,0)');

  ctx.fillStyle = g;
  ctx.fillRect(0,0,size,size);

  return new THREE.CanvasTexture(c);
}

const backgroundGroup = makeBackgroundStars();
const spriteTex = createStarSpriteTexture(128);

let stocks = [];
let cameraTarget = null;
let focusedStock = null;
let priceHistories = {};
let chartMarkerIndex = null;

// Softer stock colors
function getStockColor(change) {
  if (change > 0) return new THREE.Color('#AAFFCC');
  if (change < 0) return new THREE.Color('#FFB0B0');
  return new THREE.Color('#FFFFFF');
}
function getPanelColor(current, prev) {
  if (current > prev) return new THREE.Color('#D4FFD4');
  if (current < prev) return new THREE.Color('#FFD6D6');
  return new THREE.Color('#FFFFFF');
}

function addLabel(stock) {
  const el = document.createElement('div');
  el.className = 'label';
  el.innerHTML = `<span class="name">${stock.symbol}</span>`;
  labelsRoot.appendChild(el);
  stock._label = el;
}

function clearLabels() {
  while (labelsRoot.firstChild) labelsRoot.removeChild(labelsRoot.firstChild);
}

async function loadStocks() {
  const res = await fetch('/stocks.json');
  const data = await res.json();
  stocks.forEach(s => s._sprite && scene.remove(s._sprite));
  clearLabels();
  stocks = [];
  const stockData = data.stocks.slice(0, 50);
  for (const stock of stockData) {
    const mat = new THREE.SpriteMaterial({
      map: spriteTex,
      color: getStockColor(stock.change),
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });
    // Position randomly in a much larger space
    const spread = 3000;
    const x = (Math.random() - 0.5) * spread;
    const y = (Math.random() - 0.5) * spread;
    const z = (Math.random() - 0.5) * spread;
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(x, y, z);
    sprite.scale.set(30, 30, 1);
    sprite.userData.targetColor = mat.color.clone();
    scene.add(sprite);
    stock._sprite = sprite;
    addLabel(stock);
    stocks.push(stock);
    sprite.userData.stock = stock;
    // Simulate 5 years of price history
    priceHistories[stock.symbol] = simulatePriceHistory(stock.price);
  }
}

function simulatePriceHistory(currentPrice) {
  // 5 years, monthly points (60)
  let arr = [];
  let price = currentPrice;
  for (let i = 0; i < 60; i++) {
    price += (Math.random() - 0.5) * 2.5;
    arr.push(Number(price.toFixed(2)));
  }
  return arr;
}

// Price updates
function updateStocks() {
  stocks.forEach(stock => {
    const movement = (Math.random() - 0.5) * 2;
    stock.change = Number((stock.change + movement).toFixed(2));
    stock.price = Number((stock.price * (1 + stock.change/100)).toFixed(2));
    if (!focusedStock) {
      if (stock._sprite) {
        stock._sprite.userData.targetColor = getStockColor(stock.change);
      }
    }
  });
}
setInterval(updateStocks, 5000);

// Click handling
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
window.addEventListener('click', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children);
  for (const intersect of intersects) {
    const stock = intersect.object.userData.stock;
    if (stock) {
      if (focusedStock === stock) {
        // Toggle off focus
        focusedStock = null;
        cameraTarget = null;
        closeInfoPanel();
        restoreStarColor(stock);
        showAllLabels();
      } else {
        // Focus on new stock
        const p = intersect.object.position.clone();
        const offset = new THREE.Vector3(0, 0, 100);
        const camPos = p.clone().add(offset);
        cameraTarget = { position: camPos, target: p };
        focusedStock = stock;
        hideAllLabels();
        setStarColorWhite(stock);
        openInfoPanel(stock);
      }
      break;
    }
  }
});

function setStarColorWhite(stock) {
  if (stock._sprite) {
    stock._sprite.userData.targetColor = new THREE.Color('#FFFFFF');
  }
}
function restoreStarColor(stock) {
  if (stock._sprite) {
    stock._sprite.userData.targetColor = getStockColor(stock.change);
  }
}
function hideAllLabels() {
  stocks.forEach(s => {
    if (s._label) s._label.style.display = 'none';
  });
}
function showAllLabels() {
  stocks.forEach(s => {
    if (s._label) s._label.style.display = '';
  });
}

// Info panel logic
function openInfoPanel(stock) {
  infoPanel.innerHTML = `
    <div class="panel-title">${stock.symbol}</div>
    <div class="panel-price">$<span id="panel-price">${stock.price.toFixed(2)}</span></div>
    <div class="panel-change">Change: <span id="panel-change">${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}%</span></div>
    <div class="chart-container" id="chart-container"></div>
    <input type="range" min="0" max="59" value="59" class="panel-slider" id="panel-slider">
  `;
  infoPanel.style.display = '';
  setTimeout(() => infoPanel.classList.add('open'), 10);
  renderChart(stock.symbol);
  setupSlider(stock.symbol);
}
function closeInfoPanel() {
  infoPanel.classList.remove('open');
  setTimeout(() => infoPanel.style.display = 'none', 500);
}

function renderChart(symbol) {
  const data = priceHistories[symbol];
  const container = d3.select('#chart-container');
  container.selectAll('*').remove();
  const w = 320, h = 160;
  const svg = container.append('svg').attr('width', w).attr('height', h);
  const x = d3.scaleLinear().domain([0, data.length-1]).range([30, w-20]);
  const y = d3.scaleLinear().domain([d3.min(data)-5, d3.max(data)+5]).range([h-30, 20]);
  const line = d3.line()
    .x((d,i) => x(i))
    .y(d => y(d));
  svg.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', '#7fdfff')
    .attr('stroke-width', 2.5)
    .attr('d', line);
  // Marker
  chartMarkerIndex = 59;
  const marker = svg.append('circle')
    .attr('r', 7)
    .attr('fill', '#fff')
    .attr('stroke', '#7fdfff')
    .attr('stroke-width', 2)
    .attr('cx', x(chartMarkerIndex))
    .attr('cy', y(data[chartMarkerIndex]))
    .call(d3.drag().on('drag', function(event) {
      let mx = event.x;
      let idx = Math.round(x.invert(mx));
      idx = Math.max(0, Math.min(data.length-1, idx));
      chartMarkerIndex = idx;
      marker.attr('cx', x(idx)).attr('cy', y(data[idx]));
      updatePanelPrice(symbol, idx);
    }));
}
function setupSlider(symbol) {
  const slider = document.getElementById('panel-slider');
  slider.value = 59;
  slider.oninput = function() {
    chartMarkerIndex = Number(slider.value);
    updatePanelPrice(symbol, chartMarkerIndex);
    d3.select('#chart-container svg circle')
      .attr('cx', d3.scaleLinear().domain([0,59]).range([30,300])(chartMarkerIndex));
  };
}
function updatePanelPrice(symbol, idx) {
  const data = priceHistories[symbol];
  const price = data[idx];
  const prev = data[Math.max(0, idx-1)];
  document.getElementById('panel-price').textContent = price.toFixed(2);
  document.getElementById('panel-change').textContent = `${price >= prev ? '+' : ''}${((price-prev)/prev*100).toFixed(2)}%`;
  // Update star color
  if (focusedStock && focusedStock.symbol === symbol && focusedStock._sprite) {
    focusedStock._sprite.userData.targetColor = getPanelColor(price, prev);
  }
}

// Label updates
function updateLabels() {
  const w = window.innerWidth, h = window.innerHeight;
  for (const stock of stocks) {
    if (!stock._label || !stock._sprite) continue;
    if (focusedStock) {
      stock._label.style.display = 'none';
      continue;
    }
    const pos = stock._sprite.position.clone().project(camera);
    if (pos.z > 1 || pos.z < -1) {
      stock._label.style.display = 'none';
      continue;
    }
    const x = (pos.x * 0.5 + 0.5) * w;
    const y = (-pos.y * 0.5 + 0.5) * h;
    stock._label.style.display = '';
    stock._label.style.left = `${x}px`;
    stock._label.style.top = `${y}px`;
    const d = camera.position.distanceTo(stock._sprite.position);
    const scale = Math.max(0.6, 1.8 - d * 0.002);
    stock._label.style.transform = `translate(-50%, -120%) scale(${scale})`;
  }
}

// Search
searchInput.addEventListener('input', (e) => {
  const query = (e.target.value || '').trim().toLowerCase();
  stocks.forEach(stock => {
    if (!stock._label) return;
    const match = !query || stock.symbol.toLowerCase().includes(query);
    stock._label.style.display = match ? '' : 'none';
    if (query && stock.symbol.toLowerCase() === query.toLowerCase()) {
      const p = stock._sprite.position.clone();
      const offset = new THREE.Vector3(0, 0, 100);
      const camPos = p.clone().add(offset);
      cameraTarget = { position: camPos, target: p };
      focusedStock = stock;
      hideAllLabels();
      setStarColorWhite(stock);
      openInfoPanel(stock);
    }
  });
});

// Search shortcut
window.addEventListener('keydown', (e) => {
  if (e.key === '/') {
    e.preventDefault();
    searchInput.focus();
  }
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  backgroundGroup.userData.rotate?.();
  if (cameraTarget) {
    camera.position.lerp(cameraTarget.position, 0.06);
    controls.target.lerp(cameraTarget.target, 0.08);
  }
  stocks.forEach(stock => {
    if (stock._sprite && stock._sprite.material) {
      stock._sprite.material.color.lerp(stock._sprite.userData.targetColor, 0.05);
    }
  });
  controls.update();
  updateLabels();
  renderer.render(scene, camera);
}

// Start
async function init() {
  try {
    await loadStocks();
    animate();
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

init();
