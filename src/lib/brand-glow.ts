type PointerCoordinates = {
  currentTarget: HTMLElement;
  clientX: number;
  clientY: number;
};

export function updateBrandGlow(event: PointerCoordinates) {
  const element = event.currentTarget;
  const bounds = element.getBoundingClientRect();
  element.style.setProperty("--brand-glow-x", `${event.clientX - bounds.left}px`);
  element.style.setProperty("--brand-glow-y", `${event.clientY - bounds.top}px`);
}

export function clearBrandGlow(event: { currentTarget: HTMLElement }) {
  event.currentTarget.style.removeProperty("--brand-glow-x");
  event.currentTarget.style.removeProperty("--brand-glow-y");
}
