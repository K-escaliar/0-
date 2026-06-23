import Link from 'next/link'
import { CalendarPlus, ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* Imagem de fundo */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/recepcao.png')" }}
      />
      {/* Overlay para legibilidade */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-950/85 via-blue-900/60 to-blue-900/20" />

      {/* Conteúdo */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Topo */}
        <header className="flex items-center gap-3 p-6 sm:p-8">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-blue-800 font-extrabold">CDI</span>
          </div>
          <div className="text-white">
            <p className="font-bold leading-tight">CDI</p>
            <p className="text-blue-200 text-xs">Centro de Diagnóstico por Imagem</p>
          </div>
        </header>

        {/* Centro */}
        <div className="flex-1 flex items-center px-6 sm:px-16">
          <div className="max-w-2xl">
            <p className="text-blue-200 font-medium mb-3 tracking-wide uppercase text-sm">Sistema interno de atendimento</p>
            <h1 className="text-4xl sm:text-6xl font-extrabold text-white leading-tight">
              Agende exames com<br />rapidez e segurança
            </h1>
            <p className="text-blue-100 text-lg mt-5 max-w-xl">
              Agendamentos, preparos, convênios e orientações das unidades
              <strong className="text-white"> CDI Prime</strong> e
              <strong className="text-white"> CDI Treze de Maio</strong> em um só lugar.
            </p>
            <Link
              href="/agendamento"
              className="inline-flex items-center gap-2 mt-8 bg-white text-blue-800 font-semibold px-7 py-3.5 rounded-xl shadow-xl hover:bg-blue-50 hover:gap-3 transition-all"
            >
              <CalendarPlus size={20} />
              Entrar no sistema
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        {/* Rodapé */}
        <footer className="p-6 sm:px-16 text-blue-200/80 text-sm">
          © {new Date().getFullYear()} CDI — Centro de Diagnóstico por Imagem
        </footer>
      </div>
    </main>
  )
}
