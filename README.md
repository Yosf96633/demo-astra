# Event Horizon

A local, single-page space experience with a slowly rotating black hole.

```sh
pnpm install
pnpm dev
```

Open **http://localhost:3000**.

Move your mouse to shift the view. Lenis smooths the scroll as the same black hole glides from the hero into the observation below. The hero’s motion button pauses and resumes the scene.

The black hole shader traces curved light rays through a 3D gravitational field. Its accretion disk has differential rotation, white-hot gas, a restrained lower image, and spectral edge dispersion inspired by the supplied reference. The math is documented in `components/scene/shaders.ts`. `SpectralOptics.tsx` adds wavelength separation and soft bloom using one offscreen render; smaller devices use fewer glow samples.

Built with Next.js, TypeScript, React Three Fiber, Drei, Tailwind CSS, and Framer Motion. The signup is a local demonstration; it does not send email.
