/** Animação discreta de reprodução: três barras finas. */
export function Equalizer({ playing, size = 14 }: { playing: boolean; size?: number }) {
  return (
    <span className="eq" data-playing={playing} style={{ width: size, height: size }} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}
