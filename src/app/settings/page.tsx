"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap, Box, User } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/settings/providers">
            <div className="border border-[hsl(var(--border))] rounded-lg p-5 bg-[hsl(var(--card))] hover:border-[hsl(var(--primary))]/50 transition-colors">
              <Zap className="h-8 w-8 text-[hsl(var(--primary))] mb-3" />
              <h3 className="font-semibold mb-1">Providers</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Manage AI provider connections, API keys, and endpoints
              </p>
            </div>
          </Link>

          <Link href="/settings/models">
            <div className="border border-[hsl(var(--border))] rounded-lg p-5 bg-[hsl(var(--card))] hover:border-[hsl(var(--primary))]/50 transition-colors">
              <Box className="h-8 w-8 text-[hsl(var(--primary))] mb-3" />
              <h3 className="font-semibold mb-1">Models</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Add, edit, and organize AI models
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
