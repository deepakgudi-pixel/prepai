export default function Marquee({ text }) {
  const repeatedText = `${text} • ${text} • ${text} • ${text} • `;

  return (
    <div className="relative flex w-full overflow-hidden border-y border-[#D5D3CE] bg-[#F4F3F0] py-4 whitespace-nowrap">
      <div className="marquee-track">
        <span className="marquee-content">{repeatedText}</span>
        <span aria-hidden="true" className="marquee-content">
          {repeatedText}
        </span>
      </div>
    </div>
  );
}
