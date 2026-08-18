export function Footer() {
  const ano = new Date().getFullYear();

  return (
    <footer className="border-t border-border px-4 py-3 text-center text-xs text-foreground-muted md:px-6">
      <p>
        Um produto{" "}
        <a
          href="https://www.metadax.com.br"
          target="_blank"
          rel="noopener noreferrer"
          className="font-display tracking-wide text-brand-red hover:underline"
        >
          METADAX
        </a>
        {" — "}Licenciado sob MIT © {ano}
      </p>
    </footer>
  );
}
