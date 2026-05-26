import { useEffect, useState } from "react";

export interface KeyboardControls {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  boost: boolean;
}

export function useKeyboard() {
  const [movement, setMovement] = useState<KeyboardControls>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    boost: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case "w":
        case "arrowup":
          setMovement((prev) => ({ ...prev, forward: true }));
          break;
        case "s":
        case "arrowdown":
          setMovement((prev) => ({ ...prev, backward: true }));
          break;
        case "a":
        case "arrowleft":
          setMovement((prev) => ({ ...prev, left: true }));
          break;
        case "d":
        case "arrowright":
          setMovement((prev) => ({ ...prev, right: true }));
          break;
        case " ":
          setMovement((prev) => ({ ...prev, boost: true }));
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case "w":
        case "arrowup":
          setMovement((prev) => ({ ...prev, forward: false }));
          break;
        case "s":
        case "arrowdown":
          setMovement((prev) => ({ ...prev, backward: false }));
          break;
        case "a":
        case "arrowleft":
          setMovement((prev) => ({ ...prev, left: false }));
          break;
        case "d":
        case "arrowright":
          setMovement((prev) => ({ ...prev, right: false }));
          break;
        case " ":
          setMovement((prev) => ({ ...prev, boost: false }));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return movement;
}
