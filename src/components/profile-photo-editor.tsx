"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase/client";
import { prepareProfilePhoto } from "@/lib/profile-photo";
import { Button } from "./ui/button";
import { ProfileAvatar } from "./profile-avatar";

export function ProfilePhotoEditor({ name, photo }: { name: string; photo: string | null }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [operation, setOperation] = useState("Preparando sua foto…");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function choose(file?: File) {
    if (!file) return;
    setOperation("Preparando sua foto…"); setPending(true); setError(""); setMessage(""); setPreview(null);
    try { setPreview(await prepareProfilePhoto(file)); }
    catch (error) { setError(error instanceof Error ? error.message : "Não foi possível preparar sua foto."); }
    finally { setPending(false); if (input.current) input.current.value = ""; }
  }
  async function save(data: string | null) {
    setOperation(data ? "Salvando sua foto…" : "Removendo sua foto…");
    setPending(true); setError(""); setMessage("");
    try {
      const { error } = await browserClient().rpc("set_profile_photo", { photo_data: data });
      if (error) { setError("Não foi possível salvar sua foto. Tente novamente."); return; }
      setPreview(null);
      setMessage(data ? "Foto de perfil salva!" : "Foto de perfil removida.");
      router.refresh();
    } catch { setError("A conexão falhou. Atualize a página para conferir sua foto."); }
    finally { setPending(false); }
  }
  return <section className="profile-photo-editor mt-6" aria-labelledby="photo-title">
    <h2 id="photo-title">Sua foto de perfil</h2>
    <div className="profile-photo-controls mt-4"><ProfileAvatar name={name} photo={preview ?? photo} className="profile-avatar-large" />
      <div className="form-stack"><label htmlFor="profile-photo">{photo ? "Escolher outra foto" : "Escolher foto"}</label>
        <input ref={input} id="profile-photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={pending} onChange={event => void choose(event.target.files?.[0])} />
        <p className="footnote">JPG, PNG ou WebP, até 8 MB. A prévia usa o centro da foto. Sua foto fica visível apenas para você e a pessoa vinculada.</p>
      </div>
    </div>
    {preview && <div className="mt-4 flex flex-wrap gap-3"><Button disabled={pending} onClick={() => void save(preview)}>Salvar foto</Button><Button variant="ghost" disabled={pending} onClick={() => setPreview(null)}>Cancelar</Button></div>}
    {photo && !preview && <Button className="mt-4" variant="outline" disabled={pending} onClick={() => void save(null)}>Remover foto</Button>}
    {pending && <p role="status" className="footnote mt-3">{operation}</p>}
    {message && <p role="status" className="form-success mt-3">{message}</p>}
    {error && <p role="alert" className="form-error mt-3">{error}</p>}
  </section>;
}
