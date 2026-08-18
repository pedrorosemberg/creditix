"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ReverTourButton() {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={() => {
        localStorage.removeItem("creditix_onboarding_visto");
        router.push("/dashboard");
        router.refresh();
      }}
    >
      Rever tour de boas-vindas
    </Button>
  );
}
