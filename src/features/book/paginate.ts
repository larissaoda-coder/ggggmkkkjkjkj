/**
 * Paginação do livro. Divide parágrafos em páginas por um orçamento de
 * caracteres; quando um parágrafo não cabe, ele continua na página seguinte,
 * cortado entre frases. A concatenação dos pedaços é sempre idêntica ao
 * parágrafo original (há teste para isso).
 */
export interface TextBlock {
  text: string;
  /** O bloco continua um parágrafo iniciado na página anterior. */
  continued: boolean;
}

export function paginate(paragraphs: readonly string[], budget: number, firstBudget = budget): TextBlock[][] {
  const pages: TextBlock[][] = [];
  let page: TextBlock[] = [];
  let used = 0;
  let limit = firstBudget;
  const cost = (t: string) => t.length + 60; // cada parágrafo gasta um pouco de espaço extra

  const flush = () => {
    if (page.length) pages.push(page);
    page = [];
    used = 0;
    limit = budget;
  };

  for (const paragraph of paragraphs) {
    let rest = paragraph;
    let continued = false;
    while (rest.length) {
      const room = limit - used;
      if (cost(rest) <= room) {
        page.push({ text: rest, continued });
        used += cost(rest);
        rest = '';
        break;
      }
      // Corta no último fim de frase que cabe; se nenhum couber, passa para a próxima página.
      const max = room - 60;
      let cut = -1;
      if (max > 120) {
        const re = /[.!?;:](?:\s)/g;
        let mt: RegExpExecArray | null;
        while ((mt = re.exec(rest)) && mt.index + 2 <= max) cut = mt.index + 2;
      }
      if (cut > 0) {
        page.push({ text: rest.slice(0, cut), continued });
        rest = rest.slice(cut);
        continued = true;
        flush();
      } else if (page.length) {
        flush();
      } else {
        // Uma frase longa demais para uma página inteira: corta no último espaço.
        const space = rest.lastIndexOf(' ', Math.max(40, max));
        const at = space > 0 ? space + 1 : Math.max(40, max);
        page.push({ text: rest.slice(0, at), continued });
        rest = rest.slice(at);
        continued = true;
        flush();
      }
    }
  }
  flush();
  return pages;
}
