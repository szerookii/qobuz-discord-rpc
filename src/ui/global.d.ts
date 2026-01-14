export {};

declare global {
  interface Window {
    QobuzDiscordRPC: {
      toggle: (enabled: boolean) => void;
    };
  }
}

declare module "*.svelte" {
  import type { ComponentType } from "svelte";
  const component: ComponentType;
  export default component;
}