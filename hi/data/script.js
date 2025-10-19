import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';const canvas = document.querySelector('canvas');
const labelsRoot = document.querySelector('#labels');
const searchInput = document.querySelector('#search');
const infoPanel = document.querySelector('#info-panel');

if (!canvas || !labelsRoot || !searchInput || !infoPanel) {
    console.error('Missing required DOM elements');
}

const renderer = new THREE.WebGLRenderer({ 
    canvas, 
    antialias: true, 
    alpha: true 
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 0.6));

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 8000);
camera.position.set(200, 200, 450);
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 40;
controls.maxDistance = 3000;

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
let selectedStock = null;
let chart = null;
let cameraTarget = null;

const STOCK_COLORS = {
    up: new THREE.Color('#D4FFD4'),
    down: new THREE.Color('#FFD6D6'),
    neutral: new THREE.Color('#FFFFFF'),
    selected: new THREE.Color('#FFFFFF')
};

function addLabel(stock) {
    const el = document.createElement('div');
    el.className = 'label';
    el.innerHTML = `<span class="name">${stock.symbol}</span>`;
    labelsRoot.appendChild(el);
    stock._label = el;
}

function clearLabels() {
    while (labelsRoot.firstChild) {
        labelsRoot.removeChild(labelsRoot.firstChild);
    }
}

function getStockColor(change, isSelected) {
    if (isSelected) return STOCK_COLORS.selected;
    if (change > 0) return STOCK_COLORS.up;
    if (change < 0) return STOCK_COLORS.down;
    return STOCK_COLORS.neutral;
}

function createPriceChart(stock) {
    const ctx = document.querySelector('#price-chart').getContext('2d');
    
    const dates = [];
    const prices = [];
    let currentPrice = stock.price;
    
    for (let i = 0; i < 1825; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (1825 - i));
        dates.push(date);
        
        const change = (Math.random() - 0.5) * 2;
        currentPrice = Math.max(1, currentPrice * (1 + change/100));
        prices.push(currentPrice);
    }

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: stock.symbol,
                data: prices,
                borderColor: '#00ffff',
                backgroundColor: 'rgba(0,255,255,0.1)',
                borderWidth: 2,
                pointRadius: 0,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'month'
                    },
                    grid: {
                        color: 'rgba(255,255,255,0.1)'
                    },
                    ticks: {
                        color: 'rgba(255,255,255,0.5)'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255,255,255,0.1)'
                    },
                    ticks: {
                        color: 'rgba(255,255,255,0.5)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1
                }
            }
        }
    });
}

function updateInfoPanel(stock) {
    if (!stock) {
        infoPanel.classList.remove('open');
        return;
    }

    document.querySelector('.panel-title').textContent = stock.symbol;
    document.querySelector('.panel-price').textContent = `$${stock.price.toFixed(2)}`;
    
    const changeEl = document.querySelector('.panel-change');
    changeEl.textContent = `${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}%`;
    changeEl.className = `panel-change ${stock.change >= 0 ? 'up' : 'down'}`;

    createPriceChart(stock);
    infoPanel.classList.add('open');
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

        const spread = 300;
        const x = (Math.random() - 0.5) * spread;
        const y = (Math.random() - 0.5) * spread;
        const z = (Math.random() - 0.5) * spread;

        const sprite = new THREE.Sprite(mat);
        sprite.position.set(x, y, z);
        sprite.scale.set(30, 30, 1);
        sprite.userData.stock = stock;
        sprite.userData.targetColor = mat.color.clone();

        scene.add(sprite);
        stock._sprite = sprite;
        addLabel(stock);
        stocks.push(stock);
    }
}

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
            if (selectedStock === stock) {
                selectedStock = null;
                updateInfoPanel(null);
                controls.enabled = true;
                stock._sprite.material.color = getStockColor(stock.change);
            } else {
                if (selectedStock) {
                    selectedStock._sprite.material.color = getStockColor(selectedStock.change);
                }
                selectedStock = stock;
                stock._sprite.material.color = STOCK_COLORS.selected;
                updateInfoPanel(stock);
                
                const p = intersect.object.position.clone();
                const offset = new THREE.Vector3(0, 0, 100);
                const camPos = p.clone().add(offset);
                cameraTarget = { position: camPos, target: p };
                controls.enabled = false;
            }
            break;
        }
    }
});

function updateLabels() {
    const w = window.innerWidth, h = window.innerHeight;
    
    for (const stock of stocks) {
        if (!stock._label || !stock._sprite) continue;

        const pos = stock._sprite.position.clone().project(camera);

        if (pos.z > 1 || pos.z < -1) {
            stock._label.style.display = 'none';
            continue;
        }

        if (selectedStock && stock !== selectedStock) {
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

function animate() {
    requestAnimationFrame(animate);
    backgroundGroup.userData.rotate?.();

    if (cameraTarget) {
        camera.position.lerp(cameraTarget.position, 0.06);
        controls.target.lerp(cameraTarget.target, 0.08);
        if (camera.position.distanceTo(cameraTarget.position) < 0.6) {
            cameraTarget = null;
        }
    }

    controls.update();
    updateLabels();
    renderer.render(scene, camera);
}

async function init() {
    try {
        await loadStocks();
        animate();
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

init();