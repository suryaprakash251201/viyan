"use client";

import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "./app-sidebar";
import { useState } from "react";

interface MobileSidebarProps {
  visibleWidgets: string[];
  onToggleWidget: (id: string) => void;
}

export function MobileSidebar({ visibleWidgets, onToggleWidget }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden text-muted-foreground"
          aria-label="Open menu"
        />
      }>
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-72 border-none">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation Menu</SheetTitle>
        </SheetHeader>
        <div className="h-full bg-card overflow-y-auto">
          <AppSidebar 
            visibleWidgets={visibleWidgets} 
            onToggleWidget={(id) => {
              onToggleWidget(id);
              // We don't necessarily want to close the sidebar when toggling a widget
            }}
            isMobile
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
