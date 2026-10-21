"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Wallet, Flag, PawPrint, UserRound, Plus, Sprout, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
const links = [{ href: "/", label: "Início", icon: House }, { href: "/financas", label: "Finanças", icon: Wallet }, { href: "/desafios", label: "Desafios", icon: Flag }, { href: "/mascotes", label: "Mascotes", icon: PawPrint }, { href: "/perfil", label: "Perfil", icon: UserRound }];
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return <div className="app-frame">
    <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
    <aside className="sidebar">
      <Link href="/" className="brand"><span className="brand-mark"><Sprout size={24} /></span><span>nosso futuro<span className="brand-sub">UM PASSO, JUNTOS.</span></span></Link>
      <div className="sidebar-label">NOSSA JORNADA</div>
      <nav aria-label="Navegação principal">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={path === href ? "page" : undefined} className={cn("nav-link", path === href && "active")}><Icon size={20} /><span>{label}</span>{path === href && <span className="nav-dot" />}</Link>)}</nav>
      <div className="sidebar-note"><Sprout size={25} /><p>Pequenos cuidados hoje.<br /><strong>Um futuro com propósito.</strong></p><span>Planejamento · Contentamento · Generosidade</span></div>
      <Link href="/perfil" className="couple-link"><span className="avatar-pair">E<span>L</span></span><span>Nosso espaço<small>Enzo & Letícia</small></span><ArrowUpRight size={16} /></Link>
    </aside>
    <div className="main-wrap"><header className="topbar"><span className="topbar-brand">nosso futuro <Sprout size={17} /></span><span className="demo-pill"><span /> Demonstração</span><Link href="/perfil" className="topbar-profile" aria-label="Abrir perfil de demonstração">E + L</Link></header>
      <div className="demo-notice">Dados fictícios para explorar a fundação do produto. Alterações duram apenas nesta sessão e são apagadas ao recarregar.</div>
      <main id="conteudo" tabIndex={-1}>{children}</main>
      <footer>Construindo com cuidado, um passo de cada vez. <span>Nosso Futuro · Sprint 01</span></footer>
    </div>
    <Link className="quick-add" href="/financas#novo" aria-label="Registrar movimentação"><Plus size={23} /><span>Registrar</span></Link>
    <nav className="mobile-nav" aria-label="Navegação mobile">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={path === href ? "page" : undefined} className={cn(path === href && "active")}><Icon size={20} /><span>{label}</span></Link>)}</nav>
  </div>;
}
