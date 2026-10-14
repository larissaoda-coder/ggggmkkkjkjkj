import { useState, type ImgHTMLAttributes } from 'react';
import { useMediaSrc } from '../content/ContentContext';

/** Imagem do conteúdo (inclusive guardada no navegador), com entrada suave ao carregar. */
export function MediaImg({
  src,
  className = '',
  ...rest
}: { src: string } & Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'>) {
  const url = useMediaSrc(src);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className={`media-missing ${className}`} role="img" aria-label="Imagem indisponível">
        Imagem indisponível
      </span>
    );
  }
  return (
    <img
      src={url}
      className={`media-img ${className}`}
      data-loaded={loaded}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => url && setFailed(true)}
      {...rest}
    />
  );
}
