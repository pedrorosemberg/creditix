/**
 * Identidade de quem opera esta instância (nome, site, endereço,
 * criador) — usada no footer e nas páginas de licença/privacidade. Tudo
 * configurável por variável de ambiente porque o Creditix é MIT: quem
 * fizer self-host da própria instância deve trocar esses valores pelos
 * seus, não deixar os da METADAX (ver /licenca).
 *
 * NEXT_PUBLIC_* é embutido no build, não é configurável em runtime sem
 * rebuildar — comportamento já usado em NEXT_PUBLIC_APP_URL.
 */
export const OPERADOR = {
  nome: process.env.NEXT_PUBLIC_OPERATOR_NAME || "METADAX",
  url: process.env.NEXT_PUBLIC_OPERATOR_URL || "https://www.metadax.com.br",
  endereco:
    process.env.NEXT_PUBLIC_OPERATOR_ADDRESS ||
    "Avenida Getúlio Vargas, 671, Sala 500, Parte 1364, Savassi, Belo Horizonte, MG - CEP 30112-021",
  criador: process.env.NEXT_PUBLIC_CREATOR_NAME || "Pedro Rosemberg",
  repositorioUrl: process.env.NEXT_PUBLIC_REPO_URL || "https://github.com/pedrorosemberg/creditix",
};
