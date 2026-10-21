export function Mascot({ animal, className = "" }: { animal: "cat" | "dog"; className?: string }) {
  const cat = animal === "cat";
  return <svg viewBox="0 0 160 160" role="img" aria-label={cat ? "Mascote gato do Enzo" : "Mascote cachorrinho de Letícia"} className={className}>
    <ellipse cx="80" cy="144" rx="46" ry="7" fill="#d9dfcd" />
    <path d="M46 134 Q38 90 80 87 Q122 90 114 134Z" fill={cat ? "#d3b58d" : "#c9956a"} />
    <path d="M63 134V116M97 134V116" stroke="#967459" strokeWidth="3" strokeLinecap="round" />
    {cat ? <path d="M36 68 38 22 65 42M95 42 122 22 124 68" fill="#d3b58d" stroke="#967459" strokeWidth="3" /> : <><ellipse cx="37" cy="69" rx="17" ry="34" fill="#8d6147" transform="rotate(16 37 69)" /><ellipse cx="123" cy="69" rx="17" ry="34" fill="#8d6147" transform="rotate(-16 123 69)" /></>}
    <rect x="35" y="38" width="90" height="69" rx="33" fill={cat ? "#e4cba9" : "#ddb38b"} />
    <ellipse cx="80" cy="87" rx="22" ry="15" fill="#f7e9d5" />
    <path d="M56 70q5-6 10 0m28 0q5-6 10 0" stroke="#433a31" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    <path d="m75 80 5 5 5-5Z" fill="#584337" /><path d="M80 85v5m-7 0q7 7 14 0" fill="none" stroke="#584337" strokeWidth="2" strokeLinecap="round" />
    <path d="m50 107 30 11 30-11-10 19H60Z" fill={cat ? "#47745c" : "#b77f73"} />
    <circle cx="80" cy="119" r="5" fill="#e9c977" />
  </svg>;
}
