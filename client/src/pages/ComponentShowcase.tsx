import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";

// Nossas fatias limpas e organizadas
import { ColorsSection } from "@/components/showcase/ColorsSection";
import { FormInputsSection } from "@/components/showcase/FormInputsSection";
import { DataDisplaySection } from "@/components/showcase/DataDisplaySection";
import { NavigationSection } from "@/components/showcase/NavigationSection";
import { OverlaysAndFeedbackSection } from "@/components/showcase/OverlaysAndFeedbackSection";
import { LayoutAndMiscSection } from "@/components/showcase/LayoutAndMiscSection";

export default function ComponentsShowcase() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container max-w-6xl mx-auto py-8">
        
        {/* HEADER */}
        <div className="space-y-2 justify-between flex mb-8">
          <h2 className="text-3xl font-bold tracking-tight">
            Shadcn/ui Component Library
          </h2>
          <Button variant="outline" size="icon" onClick={toggleTheme}>
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        </div>

        {/* MÓDULOS (Lego Blocks) */}
        <div className="space-y-12">
          <ColorsSection />
          <FormInputsSection />
          <DataDisplaySection />
          <NavigationSection />
          <OverlaysAndFeedbackSection />
          <LayoutAndMiscSection />
        </div>

      </main>

      <footer className="border-t py-6 mt-12">
        <div className="container text-center text-sm text-muted-foreground">
          <p>Shadcn/ui Component Showcase Refactored 🚀</p>
        </div>
      </footer>
    </div>
  );
}