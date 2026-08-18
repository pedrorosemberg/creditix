"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const CHAVE_LOCALSTORAGE = "creditix_onboarding_visto";

const PASSOS = [
  {
    element: '[data-tour="painel"]',
    popover: {
      title: "Bem-vindo(a) ao Creditix",
      description: "Aqui é o Painel — um resumo rápido da sua situação financeira. Vamos te mostrar o resto em poucos passos.",
    },
  },
  {
    element: '[data-tour="dividas"]',
    popover: {
      title: "Dívidas",
      description: "Cadastre suas dívidas aqui. O Creditix analisa automaticamente se os juros cobrados parecem abusivos.",
    },
  },
  {
    element: '[data-tour="orcamento"]',
    popover: {
      title: "Orçamento",
      description: "Registre sua renda e gastos essenciais — é a base para o plano de recuperação financeira.",
    },
  },
  {
    element: '[data-tour="recuperacao"]',
    popover: {
      title: "Recuperação financeira",
      description: "Com dívidas e orçamento cadastrados, veja aqui um plano real para sair delas — parcelado ou à vista.",
    },
  },
  {
    element: '[data-tour="chat"]',
    popover: {
      title: "Chat com IA",
      description: "Tire dúvidas sobre sua situação a qualquer momento — o assistente só enxerga os seus próprios dados.",
    },
  },
  {
    element: '[data-tour="convite"]',
    popover: {
      title: "Convide amigos",
      description: "Compartilhe seu link de indicação e acompanhe quem já se cadastrou.",
    },
  },
] as const;

/**
 * Tour guiado (driver.js) mostrado uma única vez, na primeira visita
 * autenticada — controlado por uma flag no localStorage do navegador (não
 * precisa de coluna no banco nem de Server Action). Cada passo aponta para
 * um item do menu lateral marcado com data-tour (ver Sidebar); se o
 * elemento não estiver na tela (ex.: sidebar recolhida no mobile), o
 * driver.js pula o passo automaticamente.
 */
export function TourBoasVindas() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(CHAVE_LOCALSTORAGE)) return;

    const tourDriver = driver({
      showProgress: true,
      nextBtnText: "Próximo",
      prevBtnText: "Voltar",
      doneBtnText: "Concluir",
      progressText: "{{current}} de {{total}}",
      steps: [...PASSOS],
      onDestroyStarted: () => {
        localStorage.setItem(CHAVE_LOCALSTORAGE, "1");
        tourDriver.destroy();
      },
    });

    tourDriver.drive();

    return () => tourDriver.destroy();
  }, []);

  return null;
}
