import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

export function LayoutAndMiscSection() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <>
      <section className="space-y-4">
        <h3 className="text-2xl font-semibold">Calendar & Carousel</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-6 flex justify-center">
              <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <Carousel className="w-full max-w-xs mx-auto">
                <CarouselContent>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <CarouselItem key={index}>
                      <div className="p-1">
                        <Card><CardContent className="flex aspect-square items-center justify-center p-6"><span className="text-4xl font-semibold">{index + 1}</span></CardContent></Card>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-2xl font-semibold">Layout & Toggles</h3>
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label>Toggle Group</Label>
              <ToggleGroup type="multiple">
                <ToggleGroupItem value="bold" aria-label="Toggle bold"><span className="font-bold">B</span></ToggleGroupItem>
                <ToggleGroupItem value="italic" aria-label="Toggle italic"><span className="italic">I</span></ToggleGroupItem>
                <ToggleGroupItem value="underline" aria-label="Toggle underline"><span className="underline">U</span></ToggleGroupItem>
              </ToggleGroup>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Aspect Ratio (16/9)</Label>
              <AspectRatio ratio={16 / 9} className="bg-muted">
                <div className="flex h-full items-center justify-center"><p className="text-muted-foreground">16:9 Aspect Ratio</p></div>
              </AspectRatio>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Resizable Panels</Label>
              <ResizablePanelGroup direction="horizontal" className="min-h-50 rounded-lg border">
                <ResizablePanel defaultSize={50}><div className="flex h-full items-center justify-center p-6"><span className="font-semibold">Panel One</span></div></ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={50}><div className="flex h-full items-center justify-center p-6"><span className="font-semibold">Panel Two</span></div></ResizablePanel>
              </ResizablePanelGroup>
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}