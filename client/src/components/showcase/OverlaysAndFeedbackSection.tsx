import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertCircle, X } from "lucide-react";
import { toast as sonnerToast } from "sonner";

export function OverlaysAndFeedbackSection() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogInput, setDialogInput] = useState("");

  const handleDialogSubmit = () => {
    sonnerToast.success("Submitted successfully", { description: `Input: ${dialogInput}` });
    setDialogInput("");
    setDialogOpen(false);
  };

  return (
    <>
      <section className="space-y-4">
        <h3 className="text-2xl font-semibold">Overlays</h3>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild><Button variant="outline">Open Dialog</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Test Input</DialogTitle>
                    <DialogDescription>Enter some text below.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Input</Label>
                      <Input placeholder="Type something..." value={dialogInput} onChange={(e) => setDialogInput(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDialogSubmit}>Submit</Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Sheet>
                <SheetTrigger asChild><Button variant="outline">Open Sheet</Button></SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Edit profile</SheetTitle>
                    <SheetDescription>Make changes to your profile here.</SheetDescription>
                  </SheetHeader>
                </SheetContent>
              </Sheet>

              <Drawer>
                <DrawerTrigger asChild><Button variant="outline">Open Drawer</Button></DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Are you absolutely sure?</DrawerTitle>
                    <DrawerDescription>This action cannot be undone.</DrawerDescription>
                  </DrawerHeader>
                  <DrawerFooter>
                    <Button>Submit</Button>
                    <DrawerClose asChild><Button variant="outline">Cancel</Button></DrawerClose>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>

              <Popover>
                <PopoverTrigger asChild><Button variant="outline">Open Popover</Button></PopoverTrigger>
                <PopoverContent>
                  <div className="space-y-2"><h4 className="font-medium leading-none">Dimensions</h4></div>
                </PopoverContent>
              </Popover>

              <Tooltip>
                <TooltipTrigger asChild><Button variant="outline">Hover me</Button></TooltipTrigger>
                <TooltipContent><p>Add to library</p></TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h3 className="text-2xl font-semibold">Alerts & Toasts</h3>
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>You can add components to your app using the cli.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <X className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Your session has expired. Please log in again.</AlertDescription>
          </Alert>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <Label>Sonner Toast</Label>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => sonnerToast.success("Success!")}>Success</Button>
              <Button variant="outline" onClick={() => sonnerToast.error("Error!")}>Error</Button>
              <Button variant="outline" onClick={() => sonnerToast.info("Info")}>Info</Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}