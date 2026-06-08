import { useState } from "react";
import type { SectionId } from "../../types";
import { Background } from "./Background";
import { BootSequence } from "./BootSequence";
import { MainMenu } from "./MainMenu";
import { SectionView } from "./SectionView";
import { HUD } from "./HUD";

const BOOT_KEY = "symbiote.booted";

type Phase = "boot" | "menu" | "section";

/**
 * Orchestrates the homescreen experience: boot → menu → section. The boot
 * sequence plays once per browser session (sessionStorage).
 */
export function HomeScreen() {
  const [phase, setPhase] = useState<Phase>(() =>
    typeof sessionStorage !== "undefined" && sessionStorage.getItem(BOOT_KEY)
      ? "menu"
      : "boot",
  );
  const [section, setSection] = useState<SectionId | null>(null);

  const handleBootComplete = () => {
    try {
      sessionStorage.setItem(BOOT_KEY, "1");
    } catch {
      /* storage unavailable — boot will simply replay next load */
    }
    setPhase("menu");
  };

  const openSection = (id: SectionId) => {
    setSection(id);
    setPhase("section");
  };

  const backToMenu = () => {
    setSection(null);
    setPhase("menu");
  };

  return (
    <>
      <Background />
      {/* HUD is menu chrome only — on a section page its corner labels would
          collide with the page's own title and BACK button. */}
      {phase === "menu" && <HUD />}
      {phase === "boot" && <BootSequence onComplete={handleBootComplete} />}
      {phase === "menu" && <MainMenu onSelect={openSection} />}
      {phase === "section" && section && (
        <SectionView section={section} onBack={backToMenu} />
      )}
    </>
  );
}
