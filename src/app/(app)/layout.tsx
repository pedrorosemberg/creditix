import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  let avatarSignedUrl: string | null = null;
  if (profile?.avatar_url) {
    const { data } = await supabase.storage.from("avatars").createSignedUrl(profile.avatar_url, 60 * 60);
    avatarSignedUrl = data?.signedUrl ?? null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar nome={profile?.display_name ?? user.email ?? null} avatarUrl={avatarSignedUrl} />
        <main className="flex-1 bg-surface-muted p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
