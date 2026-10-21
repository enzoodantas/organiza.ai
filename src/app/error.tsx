"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) { return <div className="panel" role="alert"><h1>Não foi possível abrir esta página.</h1><p>Seus dados não foram enviados. Tente novamente.</p><Button onClick={reset}>Tentar novamente</Button></div>; }
