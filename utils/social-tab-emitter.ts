// Tiny event emitter for cross-component communication without prop drilling.
// Used to signal SocialScreen to scroll-to-top when the Home tab is pressed.

type Listener = () => void;

class SimpleEmitter {
  private listeners: Set<Listener> = new Set();

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  emit(): void {
    this.listeners.forEach((fn) => fn());
  }
}

/** Fires when the user taps the "Home" tab icon while already on the Social tab. */
export const socialTabPressEmitter = new SimpleEmitter();
