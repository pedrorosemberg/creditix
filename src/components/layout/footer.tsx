import Link from "next/link";
import { OPERADOR } from "@/lib/config/operador";

export function Footer() {
  const ano = new Date().getFullYear();

  return (
    <footer className="border-t border-border px-4 py-3 text-center text-xs text-foreground-muted md:px-6">
      <p>
        Um produto{" "}
        <a
          href={OPERADOR.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-display tracking-wide text-brand-red hover:underline"
        >
          {OPERADOR.nome}
        </a>
        {" — "}
        <Link href="/licenca" className="hover:underline">
          Licenciado sob MIT
        </Link>{" "}
        © {ano}
      </p>
      <p className="mt-1">{OPERADOR.endereco}</p>
      <p className="mt-1">
        Criado por {OPERADOR.criador}. <Link href="/licenca" className="hover:underline">Licença</Link>
        {" · "}
        <Link href="/privacidade" className="hover:underline">
          Privacidade e termos
        </Link>
      </p>
    </footer>
  );
}
