# Imaging Rx — Demo 3D "Tecnología que se explica sola"

Landing de demostración con una experiencia hero inmersiva: un equipo de imagen
médica (modelo 3D `.glb`) que se desarma pieza por pieza a medida que el usuario
hace scroll, con etiquetas ancladas a cada componente y una cámara cinemática.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** — estilos y sistema de diseño (Plus Jakarta Sans, navy `#0c1b33` + azul `#1a5fe0`)
- **Three.js** + **@react-three/fiber** + **@react-three/drei** — render y carga del modelo
- **GSAP ScrollTrigger** — animación atada al scroll (scrub)

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:3000
```

## Build de producción

```bash
npm run build
npm run start
```

## Deploy en Vercel

1. Subí este repo a GitHub.
2. En [vercel.com](https://vercel.com) → **New Project** → importá el repo.
3. Framework: **Next.js** (autodetectado). No hace falta configurar nada más.
4. **Deploy**.

## Estructura

```
app/            layout, page, estilos globales, favicon
components/
  Scene3D.tsx     Canvas R3F, modelo, despiece vertical, cámara y luces
  Labels.tsx      etiquetas 3D ancladas a cada malla, con oclusión por raycast
  ScrollSection.tsx  header, hero, tarjetas laterales y track de scroll (GSAP)
  Loader.tsx      loader del modelo
lib/
  scrollProgress.ts  store de progreso de scroll (puente GSAP ⇄ R3F)
public/models/  ct_scanner.glb
```

## Ajustes rápidos

- **Velocidad/duración del scroll:** altura del track en `ScrollSection.tsx` (`h-[800vh]`).
- **Separación de piezas:** `VERTICAL_SLOT` y `DIST_SCALE` en `Scene3D.tsx`.
- **Orientación del modelo:** `BASE_YAW` en `Scene3D.tsx`.
- **Cámara / zoom por pieza:** `CAM_KEYS` en `Scene3D.tsx`.
