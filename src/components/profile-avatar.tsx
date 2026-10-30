import Image from "next/image";

export function ProfileAvatar({ name, photo, className = "" }: { name: string; photo?: string | null; className?: string }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toLocaleUpperCase("pt-BR") || "♡";
  return <span className={`profile-avatar ${className}`} role="img" aria-label={photo ? `Foto de ${name}` : `Perfil de ${name}`}>
    {photo ? <Image src={photo} alt="" width={192} height={192} unoptimized /> : <span aria-hidden="true">{initials}</span>}
  </span>;
}
