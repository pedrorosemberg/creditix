import { urlPublicaApp } from "./utils";

export function gerarLinkIndicacao(codigo: string): string {
  const url = new URL("/cadastro", urlPublicaApp());
  url.searchParams.set("ref", codigo);
  return url.toString();
}
