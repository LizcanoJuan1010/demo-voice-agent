import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const COUNT = 1400

const VERTEX = /* glsl */ `
  attribute float size;
  attribute float alpha;
  attribute vec3 color;
  varying float vAlpha;
  varying vec3 vColor;
  uniform float uPixelRatio;
  void main() {
    vAlpha = alpha;
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * uPixelRatio * (280.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const FRAGMENT = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    float glow = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, glow * glow * vAlpha);
  }
`

export function ThreeBackground() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const renderer = (() => {
      try {
        return new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        })
      } catch {
        return null
      }
    })()
    if (!renderer) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      60,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000,
    )
    camera.position.z = 40

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    const positions = new Float32Array(COUNT * 3)
    const colors = new Float32Array(COUNT * 3)
    const sizes = new Float32Array(COUNT)
    const alphas = new Float32Array(COUNT)

    const palette = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#a78bfa'),
      new THREE.Color('#8b9dff'),
      new THREE.Color('#e2e8f0'),
      new THREE.Color('#6366f1'),
    ]

    for (let i = 0; i < COUNT; i++) {
      const radius = 20 + Math.random() * 45
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.6
      positions[i * 3 + 2] = radius * Math.cos(phi)

      const c = palette[Math.floor(Math.random() * palette.length)]
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b

      sizes[i] = 0.4 + Math.random() * 1.7
      alphas[i] = 0.15 + Math.random() * 0.6
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1))

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    const points = new THREE.Points(geometry, material)
    scene.add(points)

    const start = performance.now()
    const pointer = { x: 0, y: 0 }
    const target = { x: 0, y: 0 }
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    let raf = 0
    let running = true

    const onPointerMove = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2
      target.y = (e.clientY / window.innerHeight - 0.5) * 2
    }

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }

    const animate = () => {
      if (!running) return
      raf = requestAnimationFrame(animate)

      pointer.x += (target.x - pointer.x) * 0.05
      pointer.y += (target.y - pointer.y) * 0.05

      const t = (performance.now() - start) / 1000
      points.rotation.y = t * 0.02 + pointer.x * 0.15
      points.rotation.x = pointer.y * 0.1

      renderer.render(scene, camera)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('resize', onResize)

    if (prefersReduced) {
      renderer.render(scene, camera)
    } else {
      animate()
    }

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('resize', onResize)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={mountRef} aria-hidden className="pointer-events-none fixed inset-0" />
}
