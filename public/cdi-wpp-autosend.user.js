// ==UserScript==
// @name         CDI - Auto Enviar WhatsApp
// @namespace    https://cdi.local/
// @version      1.1
// @description  Envia automaticamente a mensagem de agendamento do CDI System no WhatsApp Web
// @author       CDI System
// @match        https://web.whatsapp.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict'

  // Só age quando a URL tem ?text= (veio do CDI System)
  function temMensagem() {
    return new URLSearchParams(window.location.search).has('text')
  }

  if (!temMensagem()) return

  let tentativas = 0
  const MAX = 60 // 30 segundos (500ms × 60)

  const intervalo = setInterval(() => {
    tentativas++
    if (tentativas > MAX) { clearInterval(intervalo); return }

    // Botão de enviar do WhatsApp Web (data-testid muda entre versões, tentamos vários seletores)
    const btn =
      document.querySelector('button[data-testid="send"]') ||
      document.querySelector('button[aria-label="Enviar"]') ||
      document.querySelector('span[data-icon="send"]')?.closest('button')

    if (btn) {
      clearInterval(intervalo)
      // Pequeno delay para garantir que o texto já foi inserido no input
      setTimeout(() => {
        btn.click()
      }, 800)
    }
  }, 500)
})()
