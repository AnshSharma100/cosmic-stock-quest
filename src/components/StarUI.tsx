import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as d3 from 'd3';

interface Stock {
  symbol: string;
  price: number;
  change: number;
  _sprite?: THREE.Sprite;
  _label?: HTMLDivElement;
}

interface StarUIProps {
  onStockClick?: (stock: Stock) => void;
  searchQuery?: string;
  enableStocks?: boolean; // when false, render only background (no stocks)
  mode?: 'top' | 'custom';
  customSymbols?: string[]; // used when mode='custom'
  spriteScale?: number; // base sprite size in px (default 30)
  customAmounts?: Record<string, number>; // optional: symbol -> USD amount (for sizing)
}

const StarUI = ({ onStockClick, searchQuery = '', enableStocks = true, mode = 'top', customSymbols = [], spriteScale = 30, customAmounts }: StarUIProps) => {
  const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:5179';
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const stocksRef = useRef<Stock[]>([]);
  const cameraTargetRef = useRef<{ position: THREE.Vector3; target: THREE.Vector3 } | null>(null);
  const focusedStockRef = useRef<Stock | null>(null);
  const spritesRef = useRef<THREE.Sprite[]>([]);
  const viewDirRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 1));
  const onStockClickRef = useRef<((stock: Stock) => void) | undefined>(onStockClick);

  // Keep latest callback without retriggering scene init
  useEffect(() => {
    onStockClickRef.current = onStockClick;
  }, [onStockClick]);
  
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current || !labelsRef.current) return;

    const canvas = canvasRef.current;
    const labelsRoot = labelsRef.current;
    const container = containerRef.current;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);

    const scene = new THREE.Scene();

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      8000
    );
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
        depthWrite: false,
      });

      const cloud = new THREE.Points(geom, mat);
      cloud.frustumCulled = false;

      const group = new THREE.Group();
      group.add(cloud);
      scene.add(group);
      return group;
    }

    // Star glow texture
    function createStarSpriteTexture(size = 128) {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const ctx = c.getContext('2d');
      if (!ctx) return new THREE.CanvasTexture(c);

      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      g.addColorStop(0.0, 'rgba(255,255,255,1)');
      g.addColorStop(0.15, 'rgba(230,240,255,0.95)');
      g.addColorStop(0.35, 'rgba(130,170,255,0.6)');
      g.addColorStop(1.0, 'rgba(0,0,0,0)');

      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);

      return new THREE.CanvasTexture(c);
    }

    const backgroundGroup = makeBackgroundStars();
    const spriteTex = createStarSpriteTexture(128);

    // Stock colors
    function getStockColor(change: number) {
      if (change > 0) return new THREE.Color('#AAFFCC');
      if (change < 0) return new THREE.Color('#FFB0B0');
      return new THREE.Color('#FFFFFF');
    }

    function addLabel(stock: Stock) {
      const el = document.createElement('div');
      el.className = 'star-label';
      el.innerHTML = `<span class="label-name">${stock.symbol}</span>`;
      labelsRoot.appendChild(el);
      stock._label = el;
    }

    function clearLabels() {
      while (labelsRoot.firstChild) labelsRoot.removeChild(labelsRoot.firstChild);
    }

    function setStarColorWhite(stock: Stock) {
      if (stock._sprite) {
        stock._sprite.userData.targetColor = new THREE.Color('#FFFFFF');
      }
    }

    function restoreStarColor(stock: Stock) {
      if (stock._sprite) {
        stock._sprite.userData.targetColor = getStockColor(stock.change);
      }
    }

    function hideAllLabels() {
      stocksRef.current.forEach((s) => {
        if (s._label) s._label.style.display = 'none';
      });
    }

    function showAllLabels() {
      stocksRef.current.forEach((s) => {
        if (s._label) s._label.style.display = '';
      });
    }

    async function loadStocks() {
      try {
        let stockData: any[] = [];
        if (mode === 'custom') {
          // Build from provided symbols; try to get live quotes per symbol
          const symbols = [...new Set(customSymbols.map((s) => s.trim().toUpperCase()))].slice(0, 200);
          const items = await Promise.all(symbols.map(async (sym) => {
            try {
              const resp = await fetch(`${API_BASE}/api/stocks/${encodeURIComponent(sym)}/quote`, { cache: 'no-store' });
              if (resp.ok) {
                const q = await resp.json();
                return { symbol: sym, price: Number(q.price ?? 1), change: Number(q.change ?? 0) };
              }
            } catch {}
            // Fallback neutral when offline or not found
            return { symbol: sym, price: 1, change: 0 };
          }));
          stockData = items;
        } else {
          // Strictly live-only: fetch top from backend
          const r = await fetch(`${API_BASE}/api/stocks/top?limit=50`, { cache: 'no-store' });
          if (!r.ok) throw new Error(`Backend responded ${r.status}`);
          const data = await r.json();
          stockData = (data?.stocks || []).slice(0, 50);
        }
        stocksRef.current.forEach((s) => s._sprite && scene.remove(s._sprite));
        clearLabels();
        stocksRef.current = [];
        
        for (const stock of stockData) {
          // Coerce values to numbers with safe defaults
          const price = typeof stock.price === 'number' ? stock.price : Number(stock.price ?? 1);
          const change = typeof stock.change === 'number' ? stock.change : Number(stock.change ?? 0);
          stock.price = price;
          stock.change = change;
          const mat = new THREE.SpriteMaterial({
            map: spriteTex,
            color: getStockColor(stock.change),
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false,
          });
          
          // Position randomly in a large space
          const spread = 3000;
          const x = (Math.random() - 0.5) * spread;
          const y = (Math.random() - 0.5) * spread;
          const z = (Math.random() - 0.5) * spread;
          const sprite = new THREE.Sprite(mat);
          sprite.position.set(x, y, z);
          // Determine initial scale
          if (mode === 'custom' && customAmounts) {
            const amt = Number(customAmounts[stock.symbol] ?? 0);
            // Linear scaling: base + slope * amount, clamped
            const base = spriteScale; // default 30
            const slope = 0.02; // 2% of dollars → px
            const maxPx = 160;
            const px = Math.max(base, Math.min(base + slope * amt, maxPx));
            sprite.scale.set(px, px, 1);
          } else {
            sprite.scale.set(spriteScale, spriteScale, 1);
          }
          sprite.userData.targetColor = mat.color.clone();
          sprite.userData.stock = stock;
          sprite.userData.origScale = sprite.scale.clone();
          scene.add(sprite);
          stock._sprite = sprite;
          addLabel(stock);
          stocksRef.current.push(stock);
          spritesRef.current.push(sprite);
        }
      } catch (error) {
        console.error('Failed to load stocks:', error);
      }
    }

    // Focus helpers
    function focusOnStock(stock: Stock, distance = 300) {
      if (!stock._sprite) return;
      // Compute offset along current view direction so star is guaranteed in front
      const viewDir = camera.position.clone().sub(controls.target).normalize();
      const target = stock._sprite.position.clone();
      const camPos = target.clone().add(viewDir.multiplyScalar(distance));
      cameraTargetRef.current = { position: camPos, target };
      focusedStockRef.current = stock;
      // Highlight star
      stock._sprite.userData.targetColor = new THREE.Color('#FFFFFF');
      // Emphasize size slightly for visibility
      if (stock._sprite.userData.origScale) {
        const os: THREE.Vector3 = stock._sprite.userData.origScale.clone();
        stock._sprite.scale.set(os.x * 1.4, os.y * 1.4, os.z);
      }
      // Hide labels while focused (match hi behavior)
      stocksRef.current.forEach((s) => { s._label && (s._label.style.display = 'none'); });
    }

    function unfocus() {
      if (!focusedStockRef.current) return;
      const st = focusedStockRef.current;
      // Restore color and scale
      if (st._sprite) {
        const origColor = getStockColor(st.change);
        st._sprite.userData.targetColor = origColor;
        if (st._sprite.userData.origScale) {
          const os: THREE.Vector3 = st._sprite.userData.origScale;
          st._sprite.scale.copy(os);
        }
      }
      focusedStockRef.current = null;
      cameraTargetRef.current = null;
      // Show all labels back
      stocksRef.current.forEach((s) => { s._label && (s._label.style.display = ''); });
    }

    // Click handling
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    const handleClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      // Only test raycast against stock sprites to avoid background points grabbing hits
      const intersects = raycaster.intersectObjects(spritesRef.current, false);
      
      for (const intersect of intersects) {
        const stock = intersect.object.userData.stock;
        if (stock) {
          if (focusedStockRef.current === stock) {
            // Toggle off focus
            unfocus();
            if (onStockClick) onStockClick(stock); // still report selection
          } else {
            // Focus on new stock
            focusOnStock(stock, 320);
            // Defer side panel open slightly to avoid any layout flashes
            setTimeout(() => { if (onStockClick) onStockClick(stock); }, 50);
          }
          break;
        }
      }
    };

    canvas.addEventListener('click', handleClick);

    // Label updates
    function updateLabels() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      
      for (const stock of stocksRef.current) {
        if (!stock._label || !stock._sprite) continue;
        // If focused, keep labels hidden (handled in focusOnStock)
        if (focusedStockRef.current) { stock._label.style.display = 'none'; continue; }
        
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

    // Periodic live quote refresh
    async function refreshQuotes() {
      if (!stocksRef.current.length) return;
      try {
        // Fetch quotes in parallel, but avoid cache and overwhelming the backend
        await Promise.all(
          stocksRef.current.map(async (stock) => {
            try {
              const resp = await fetch(`${API_BASE}/api/stocks/${encodeURIComponent(stock.symbol)}/quote`, { cache: 'no-store' });
              if (!resp.ok) return;
              const q = await resp.json();
              const newPrice = typeof q.price === 'number' ? q.price : Number(q.price ?? stock.price);
              const newChange = typeof q.change === 'number' ? q.change : Number(q.change ?? stock.change);
              stock.price = newPrice;
              stock.change = newChange;
              if (stock._sprite && !focusedStockRef.current) {
                stock._sprite.userData.targetColor = getStockColor(stock.change);
              }
              // If this is the focused stock, notify parent so any side panel can update
              if (focusedStockRef.current && focusedStockRef.current.symbol === stock.symbol) {
                onStockClickRef.current?.(stock);
              }
            } catch {}
          })
        );
      } catch (e) {
        console.warn('Quote refresh failed', e);
      }
    }
  const updateInterval = setInterval(refreshQuotes, 60000); // refresh every 60s

    // Animation loop
    let animationId: number;
    function animate() {
      animationId = requestAnimationFrame(animate);
      backgroundGroup.rotation.y += 0.00025;
      
      if (cameraTargetRef.current) {
        camera.position.lerp(cameraTargetRef.current.position, 0.06);
        controls.target.lerp(cameraTargetRef.current.target, 0.08);
      }
      // Update current view direction for use outside this effect
      viewDirRef.current.copy(camera.position.clone().sub(controls.target).normalize());
      
      stocksRef.current.forEach((stock) => {
        if (stock._sprite && stock._sprite.material) {
          (stock._sprite.material as THREE.SpriteMaterial).color.lerp(
            stock._sprite.userData.targetColor,
            0.05
          );
        }
      });
      
      controls.update();
      updateLabels();
      renderer.render(scene, camera);
    }

    // Resize handler
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Initialize
    if (enableStocks) {
      loadStocks().then(() => animate());
    } else {
      // No stocks: just animate background
      animate();
    }

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      clearInterval(updateInterval);
      cancelAnimationFrame(animationId);
      canvas.removeEventListener('click', handleClick);
      controls.dispose();
      renderer.dispose();
      
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Sprite) {
          object.geometry?.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      });
      
      clearLabels();
    };
  }, [enableStocks, mode, spriteScale, customSymbols.join(','), customAmounts ? JSON.stringify(customAmounts) : '']);

  // Handle search query changes
  useEffect(() => {
  if (!enableStocks) return;
    const query = searchQuery.trim().toLowerCase();
    
      // First pass: filter labels by partial match
      let exactMatch: Stock | null = null;
    
    stocksRef.current.forEach((stock) => {
      if (!stock._label) return;
      
      const match = !query || stock.symbol.toLowerCase().includes(query);
      stock._label.style.display = match ? '' : 'none';
      
      // Check for exact match
      if (query && stock.symbol.toLowerCase() === query) {
        exactMatch = stock;
      }
    });
    
      // If exact match found, focus on it (compute offset using current view direction)
      if (exactMatch && exactMatch._sprite) {
        const target = exactMatch._sprite.position.clone();
        const camPos = target.clone().add(viewDirRef.current.clone().multiplyScalar(340));
        cameraTargetRef.current = { position: camPos, target };
        // Mark focus
        focusedStockRef.current = exactMatch;
        // Hide all labels
        stocksRef.current.forEach((s) => { s._label && (s._label.style.display = 'none'); });
        // Highlight and up-scale for visibility
        exactMatch._sprite.userData.targetColor = new THREE.Color('#FFFFFF');
        if (exactMatch._sprite.userData.origScale) {
          const os: THREE.Vector3 = exactMatch._sprite.userData.origScale;
          exactMatch._sprite.scale.set(os.x * 1.4, os.y * 1.4, os.z);
        }
        // Defer side panel open slightly
        setTimeout(() => { onStockClickRef.current?.(exactMatch); }, 50);
      } else {
        // No exact match: clear focus but preserve filtered labels
        if (focusedStockRef.current) {
          const st = focusedStockRef.current;
          if (st._sprite) {
            // restore color and scale
            const restoreColor = st.change > 0
              ? new THREE.Color('#AAFFCC')
              : (st.change < 0 ? new THREE.Color('#FFB0B0') : new THREE.Color('#FFFFFF'));
            st._sprite.userData.targetColor = restoreColor;
            if (st._sprite.userData.origScale) {
              const os: THREE.Vector3 = st._sprite.userData.origScale;
              st._sprite.scale.copy(os);
            }
          }
          focusedStockRef.current = null;
          cameraTargetRef.current = null;
        }
        if (!query) {
          // Show all labels again on empty query
          stocksRef.current.forEach((s) => { s._label && (s._label.style.display = ''); });
        }
      }
  }, [searchQuery, enableStocks]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 z-[1]" />
      <div ref={labelsRef} className="absolute inset-0 z-[2] pointer-events-none" />
      <style>{`
        .star-label {
          position: absolute;
          transform-style: preserve-3d;
          pointer-events: none;
          transition: opacity 0.3s ease;
          white-space: nowrap;
          text-align: center;
        }
        .label-name {
          font-size: 11px;
          font-weight: 600;
          color: #fff;
          text-shadow: 0 0 8px rgba(255,255,255,0.4);
          background: rgba(0,0,0,0.7);
          padding: 2px 6px;
          border-radius: 4px;
          display: block;
        }
      `}</style>
    </div>
  );
};

export default StarUI;
