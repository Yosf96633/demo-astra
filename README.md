# Event Horizon

A local, single-page space experience with a slowly rotating black hole.

```sh
pnpm install
pnpm dev
```

Open **http://localhost:3000**.

Move your mouse to shift the view. Lenis smooths the scroll as the same black hole glides from the hero into the observation below. The hero’s motion button pauses and resumes the scene.

Continue to the nebula for drifting gas, dust, and occasional shooting stars, then to the Milky Way for a rotating spiral galaxy. Both observations have independent motion controls, load as you approach, and pause offscreen or when the tab is hidden. Reduced-motion preferences keep the scenes still.

The final observation is a neutron star with a gently pulsing white-pink core, violet polar beams, and rotating cyan magnetic loops. The loops use 3D ribbons with soft edges; smaller devices render fewer curves. It has its own pause control and shares the same lazy loading and reduced-motion behavior. The shaders and curve geometry are in `components/scene/neutron-star-shaders.ts` and `magnetic-field-geometry.ts`.

The black hole shader traces curved light rays through a 3D gravitational field. Its accretion disk has differential rotation, white-hot gas, a restrained lower image, and spectral edge dispersion inspired by the supplied reference. The math is documented in `components/scene/shaders.ts`. `SpectralOptics.tsx` adds wavelength separation and soft bloom using one offscreen render; smaller devices use fewer glow samples.

The disk is level, with symmetric lighting on its two ends. The new scene shaders live in `components/scene/deep-space-shaders.ts`. The galaxy is an artistic interpretation with differential rotation, procedural stars, gas, and dust lanes.

The nebula uses the original [Pillars of Creation photograph](https://esahubble.org/images/heic1501a/) matching the reference, resized locally to WebP. Credit: NASA, ESA/Hubble and the Hubble Heritage Team. [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); atmospheric animation added for this experience. Its credit is also visible alongside the observation.

Built with Next.js, TypeScript, React Three Fiber, Drei, Tailwind CSS, and Framer Motion. The signup is a local demonstration; it does not send email.
