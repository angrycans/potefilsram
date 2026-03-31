import { useEffect, useMemo, useRef, useState } from "react";
import { MarsSceneEngine, type SurfaceHudState } from "@marslife/scene-engine";

export function BabylonViewport() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hud, setHud] = useState<SurfaceHudState>({
    altKm: 0,
    latDeg: 0,
    lonDeg: 0,
    pickElevM: null,
  });
  const hudText = useMemo(
    () => ({
      alt: `${hud.altKm.toFixed(2)} km`,
      lat: `${hud.latDeg.toFixed(4)}°`,
      lon: `${hud.lonDeg.toFixed(4)}°`,
      pick: hud.pickElevM == null ? "--" : `${hud.pickElevM.toFixed(0)} m`,
    }),
    [hud]
  );

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const engine = new MarsSceneEngine({
      canvas: canvasRef.current,
      onHudUpdate: (nextHud) => setHud(nextHud),
    });
    engine.start();

    return () => {
      engine.dispose();
    };
  }, []);

  return (
    <div className="viewport-wrap">
      <canvas ref={canvasRef} className="viewport" aria-label="Mars 3D viewport" />
      <aside className="surface-hud" aria-label="Surface HUD">
        <div>
          <span>ALT</span>
          <strong>{hudText.alt}</strong>
        </div>
        <div>
          <span>LAT</span>
          <strong>{hudText.lat}</strong>
        </div>
        <div>
          <span>LON</span>
          <strong>{hudText.lon}</strong>
        </div>
        <div>
          <span>PICK ELV</span>
          <strong>{hudText.pick}</strong>
        </div>
      </aside>
    </div>
  );
}
