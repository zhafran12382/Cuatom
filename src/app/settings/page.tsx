"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap, Box } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg min-h-[40px] min-w-[40px]">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        </div>

        <div className="space-y-3">
          <Link href="/settings/providers">
            <div className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/30 hover:bg-primary/[0.02] transition-all duration-200 group">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm">Providers</h3>
                <p className="text-sm text-muted-foreground truncate">
                  Manage AI provider connections, API keys, and endpoints
                </p>
              </div>
              <ArrowLeft className="h-4 w-4 text-muted-foreground/40 rotate-180 group-hover:text-primary transition-colors flex-shrink-0" />
            </div>
          </Link>

          <Link href="/settings/models">
            <div className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/30 hover:bg-primary/[0.02] transition-all duration-200 group">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Box className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm">Models</h3>
                <p className="text-sm text-muted-foreground truncate">
                  Add, edit, and organize AI models
                </p>
              </div>
              <ArrowLeft className="h-4 w-4 text-muted-foreground/40 rotate-180 group-hover:text-primary transition-colors flex-shrink-0" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
