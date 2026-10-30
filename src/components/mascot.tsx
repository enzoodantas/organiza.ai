export function Mascot({ animal, className = "", name, items = [] }: { animal: "cat" | "dog"; className?: string; name?: string; items?: readonly string[] }) {
  const cat = animal === "cat";
  const sweater = items.includes("sweater_sage") ? "#81a58a" : items.includes("sweater_rose") ? "#c88c94" : null;
  return <svg viewBox="0 0 160 160" role="img" aria-label={`Mascote ${cat ? "gato" : "cachorro"}${name ? ` de ${name}` : ""}`} className={className}>
    <ellipse cx="80" cy="144" rx="46" ry="7" fill="#d9dfcd" />
    <path d="M46 134 Q38 90 80 87 Q122 90 114 134Z" fill={cat ? "#d3b58d" : "#c9956a"} />
    {sweater && <><path d="M48 101Q80 90 112 101L118 130H42Z" fill={sweater} /><path d="M57 129V113M103 129V113" stroke="#ffffff66" strokeWidth="2" /><path d="M72 123q8-12 16 0q-8 11-16 0" fill="#fff5df" /></>}
    {items.includes("overalls") && <><path d="M49 108H111L113 134H47Z" fill="#6587a2" /><path d="M60 98V120M100 98V120" stroke="#6587a2" strokeWidth="8" /><rect x="68" y="115" width="24" height="14" rx="4" fill="#88a5ba" /><circle cx="60" cy="113" r="2" fill="#ead393" /><circle cx="100" cy="113" r="2" fill="#ead393" /></>}
    <path d="M63 134V116M97 134V116" stroke="#967459" strokeWidth="3" strokeLinecap="round" />
    {cat ? <path d="M36 68 38 22 65 42M95 42 122 22 124 68" fill="#d3b58d" stroke="#967459" strokeWidth="3" /> : <><ellipse cx="37" cy="69" rx="17" ry="34" fill="#8d6147" transform="rotate(16 37 69)" /><ellipse cx="123" cy="69" rx="17" ry="34" fill="#8d6147" transform="rotate(-16 123 69)" /></>}
    <rect x="35" y="38" width="90" height="69" rx="33" fill={cat ? "#e4cba9" : "#ddb38b"} />
    {items.includes("sun_hat") && <><path d="M48 40Q50 9 80 9Q110 9 112 40" fill="#e7ca89" /><path d="M33 40Q80 27 127 40Q121 51 80 48Q39 51 33 40" fill="#e7ca89" /><path d="M49 32Q80 26 111 32" stroke="#a67f66" strokeWidth="6" /></>}
    {items.includes("party_hat") && <><path d="M55 42L81 3L105 42Z" fill="#bf969e" /><path d="M63 29L93 22M60 38L99 29" stroke="#f5d99b" strokeWidth="4" /><circle cx="81" cy="5" r="5" fill="#eacb83" /></>}
    <ellipse cx="80" cy="87" rx="22" ry="15" fill="#f7e9d5" />
    <path d="M56 70q5-6 10 0m28 0q5-6 10 0" stroke="#433a31" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    <path d="m75 80 5 5 5-5Z" fill="#584337" /><path d="M80 85v5m-7 0q7 7 14 0" fill="none" stroke="#584337" strokeWidth="2" strokeLinecap="round" />
    <path d="m50 107 30 11 30-11-10 19H60Z" fill={cat ? "#47745c" : "#b77f73"} />
    <circle cx="80" cy="119" r="5" fill="#e9c977" />
  </svg>;
}
