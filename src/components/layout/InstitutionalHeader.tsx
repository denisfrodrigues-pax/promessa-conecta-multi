import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logoPromessaHortolandia from "@/assets/logo-promessa-hortolandia.png";

export function InstitutionalHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="w-full border-b bg-white relative z-50">
      {/* ================= MOBILE HEADER ================= */}
      <div className="flex items-center justify-between px-4 py-3 lg:hidden">
        {/* Logo */}
        <Link to="/">
          <img
            src={logoPromessaHortolandia}
            alt="Igreja da Promessa"
            className="h-10"
          />
        </Link>

        {/* Botão Hambúrguer */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Abrir menu"
          className="p-2"
        >
          <Menu className="h-7 w-7" />
        </button>
      </div>

      {/* ================= MOBILE MENU FULLSCREEN ================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          {/* Topo */}
          <div className="flex items-center justify-between px-4 py-4 border-b">
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>
              <img src={logoPromessaHortolandia} className="h-8" alt="Logo" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Fechar menu"
            >
              <X className="h-7 w-7" />
            </button>
          </div>

          {/* Navegação */}
          <nav className="flex flex-col gap-6 px-6 py-8 text-lg font-medium">
            <Link onClick={() => setMobileMenuOpen(false)} to="/quem-somos">Quem Somos</Link>
            <Link onClick={() => setMobileMenuOpen(false)} to="/bases">Participe de uma Base</Link>
            <Link onClick={() => setMobileMenuOpen(false)} to="/conteudo">Conteúdo</Link>
            <Link onClick={() => setMobileMenuOpen(false)} to="/eventos">Eventos</Link>
            <Link onClick={() => setMobileMenuOpen(false)} to="/oracao">Pedidos de Oração</Link>
            <Link onClick={() => setMobileMenuOpen(false)} to="/contribuicoes">Contribua</Link>
            <Link onClick={() => setMobileMenuOpen(false)} to="/contato">Contato</Link>
            <Link onClick={() => setMobileMenuOpen(false)} to="/sou-novo">Cadastro</Link>
          </nav>
        </div>
      )}

      {/* ================= DESKTOP HEADER ================= */}
      <div className="hidden lg:flex items-center justify-between px-8 py-4 max-w-7xl mx-auto">
        {/* Logo */}
        <Link to="/">
          <img
            src={logoPromessaHortolandia}
            alt="Igreja da Promessa"
            className="h-12"
          />
        </Link>

        {/* Menu Desktop */}
        <nav className="flex items-center gap-6 font-medium">
          {/* Dropdown Quem Somos */}
          <div className="relative group">
            <button className="flex items-center gap-1 hover:text-primary transition-colors">
              Quem Somos
            </button>
            <div className="absolute top-full left-0 mt-2 hidden group-hover:block z-50">
              <div className="w-64 rounded-lg border bg-white shadow-lg py-2">
                <Link to="/quem-somos/teologia" className="block px-4 py-2 text-sm hover:bg-muted">
                  Nossa Teologia
                </Link>
                <Link to="/quem-somos/missao-visao" className="block px-4 py-2 text-sm hover:bg-muted">
                  Missão e Visão
                </Link>
                <Link to="/quem-somos/historia" className="block px-4 py-2 text-sm hover:bg-muted">
                  Nossa História
                </Link>
                <Link to="/quem-somos/pastores" className="block px-4 py-2 text-sm hover:bg-muted">
                  Pastores
                </Link>
                <Link to="/quem-somos/lideranca" className="block px-4 py-2 text-sm hover:bg-muted">
                  Liderança
                </Link>
                <Link to="/quem-somos/ministerios" className="block px-4 py-2 text-sm hover:bg-muted">
                  Ministérios
                </Link>
                <Link to="/quem-somos/por-que-participar" className="block px-4 py-2 text-sm hover:bg-muted">
                  Por que participar
                </Link>
              </div>
            </div>
          </div>
          <Link to="/bases">Base</Link>
          <Link to="/conteudo">Conteúdo</Link>
          <Link to="/eventos">Eventos</Link>
          <Link to="/contribuicoes">Contribua</Link>
          <Link to="/contato">Contato</Link>
          <Link to="/sou-novo">Cadastro</Link>
        </nav>
      </div>
    </header>
  );
}

export default InstitutionalHeader;
