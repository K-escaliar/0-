// ==UserScript==
// @name         CDI - Auto Enviar WhatsApp
// @namespace    https://cdi.local/
// @version      1.2
// @description  Envia automaticamente a mensagem de agendamento do CDI System no WhatsApp Web (Chrome e Edge)
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
  const MAX = 80 // 40 segundos (500ms × 80) — Edge pode demorar mais

  const intervalo = setInterval(() => {
    tentativas++
    if (tentativas > MAX) { clearInterval(intervalo); return }

    // Seletores compatíveis com Chrome e Edge (Chromium)
    const btn =
      document.querySelector('button[data-testid="send"]') ||
      document.querySelector('button[aria-label="Enviar"]') ||
      document.querySelector('button[aria-label="Send"]') ||
      document.querySelector('span[data-icon="send"]')?.closest('button') ||
      document.querySelector('[data-testid="compose-btn-send"]')

    if (btn) {
      clearInterval(intervalo)
      setTimeout(() => btn.click(), 1000)
    }
  }, 500)
})()
