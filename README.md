# Event Horizon

A local, single-page space experience with a slowly rotating black hole.

```sh
pnpm install
pnpm dev
```

Open **http://localhost:3000**.

Move your mouse to shift the view. Scroll to explore. The hero’s motion button pauses and resumes the scene.

The black hole shader traces curved light rays through a 3D gravitational field. Its accretion disk has differential rotation, warm gas, and lensed secondary images. The math is documented in `components/scene/shaders.ts`.

Built with Next.js, TypeScript, React Three Fiber, Drei, Tailwind CSS, and Framer Motion. The signup is a local demonstration; it does not send email.
