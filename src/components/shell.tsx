"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Wallet, CalendarDays, Flag, PawPrint, UserRound, Plus, Sprout, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { browserClient } from "@/lib/supabase/client";
import { ProfileAvatar } from "./profile-avatar";
const links = [{ href: "/", label: "Início", icon: House }, { href: "/financas", label: "Finanças", icon: Wallet }, { href: "/planejamento", label: "Planejamento", icon: CalendarDays }, { href: "/desafios", label: "Desafios", icon: Flag }, { href: "/mascotes", label: "Mascotes", icon: PawPrint }, { href: "/perfil", label: "Perfil", icon: UserRound }];
export function Shell({ children, initialAuthenticated, privateApp = false, profileName = "Minha conta", profilePhoto = null }: { children: React.ReactNode; initialAuthenticated: boolean; privateApp?: boolean; profileName?: string; profilePhoto?: string | null }) {
  const path = usePathname();
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  useEffect(() => {
    let active = true;
    try {
      const supabase = browserClient();
      void supabase.auth.getUser().then(({ data }) => { if (active) setAuthenticated(!!data.user); });
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (active) setAuthenticated(!!session?.user);
      });
      return () => { active = false; listener.subscription.unsubscribe(); };
    } catch { return () => { active = false; }; }
  }, []);
  const realFinance = authenticated && (path === "/" || path === "/financas" || path === "/desafios" || path === "/mascotes");
  const planning = path === "/planejamento";
  const account = path === "/conta";
  const privateAccess = privateApp && !authenticated;
  return <div className="app-frame">
    <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
    <aside className="sidebar">
      <Link href="/" className="brand"><span className="brand-mark"><Sprout size={24} /></span><span>nosso futuro<span className="brand-sub">UM PASSO, JUNTOS.</span></span></Link>
      <div className="sidebar-label">NOSSA JORNADA</div>
      <nav aria-label="Navegação principal">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={path === href ? "page" : undefined} className={cn("nav-link", path === href && "active")}><Icon size={20} /><span>{label}</span>{path === href && <span className="nav-dot" />}</Link>)}</nav>
      <div className="sidebar-note"><Sprout size={25} /><p>Pequenos cuidados hoje.<br /><strong>Um futuro com propósito.</strong></p><span>Planejamento · Contentamento · Generosidade</span></div>
      <Link href={authenticated ? "/perfil" : "/entrar"} className="couple-link">{authenticated ? <ProfileAvatar name={profileName} photo={profilePhoto} /> : <span className="avatar-pair">♡</span>}<span>Nosso espaço<small>Um futuro a dois</small></span><ArrowUpRight size={16} /></Link>
    </aside>
    <div className="main-wrap"><header className="topbar"><span className="topbar-brand">nosso futuro <Sprout size={17} /></span><span className="demo-pill"><span /> {privateAccess ? "Acesso ao casal" : realFinance ? "Registros salvos" : planning ? "Estimativas salvas" : authenticated ? "Conta conectada" : "Demonstração"}</span><Link href="/conta" className="topbar-profile" aria-label="Abrir minha conta">{authenticated ? <ProfileAvatar name={profileName} photo={profilePhoto} /> : "♡"}</Link></header>
      <div className="demo-notice">{privateAccess ? "Entre na sua conta para acessar o espaço financeiro do casal." : realFinance ? "Finanças salvas no seu espaço. Registre somente valores já recebidos, pagos ou reservados; estimativas ficam no planejamento." : planning ? "Planejamento salvo no seu espaço. Valores provisórios; pagamentos e reservas efetivos ficam em Finanças e Desafios." : account && authenticated ? "Sessão autenticada no seu espaço. Seu vínculo e suas estimativas são persistentes." : authenticated ? "Seu espaço pessoal e compartilhado. Cada pessoa cuida da própria conta." : "Dados fictícios para explorar a fundação do produto. Alterações duram apenas nesta sessão e são apagadas ao recarregar."}</div>
      <main id="conteudo" tabIndex={-1}>{children}</main>
      <footer>Construindo com cuidado, um passo de cada vez. <span>Nosso Futuro · Um passo, juntos</span></footer>
    </div>
    {!privateAccess && <Link className="quick-add" href="/financas#novo" aria-label="Registrar movimentação"><Plus size={23} /><span>Registrar</span></Link>}
    {!privateAccess && <nav className="mobile-nav" aria-label="Navegação mobile">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={path === href ? "page" : undefined} className={cn(path === href && "active")}><Icon size={20} /><span>{label === "Planejamento" ? <><span aria-hidden="true">Planejar</span><span className="sr-only">Planejamento</span></> : label}</span></Link>)}</nav>}
  </div>;
}
