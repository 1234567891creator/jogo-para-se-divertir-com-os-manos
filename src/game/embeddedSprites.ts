/**
 * Echoward: Reino das Cinzas - Embedded Sprites Registry & Code Exporter
 * 
 * Permite salvar as animações PNG diretamente no código TypeScript do jogo,
 * garantindo que fiquem salvas para sempre no repositório além do IndexedDB.
 */

export interface EmbeddedFrame {
  id: string;
  dataUrl: string;
}

export type EmbeddedSpriteData = Record<string, EmbeddedFrame[]>;

/**
 * Sprites embutidos diretamente no código fonte.
 * Podem ser atualizados gerando um novo arquivo pelo Gerenciador de Sprites.
 */
export const EMBEDDED_SPRITES_DATABASE: EmbeddedSpriteData = {
  // Inicialmente vazio ou preenchido com artes customizadas
};

/**
 * Gera o código-fonte TypeScript completo contendo todas as imagens codificadas em base64,
 * permitindo ao desenvolvedor copiar e colar ou salvar este arquivo no projeto.
 */
export function generateEmbeddedSpritesCode(sprites: Record<string, { id: string; dataUrl: string }[]>): string {
  const jsonContent = JSON.stringify(sprites, null, 2);
  return `/**
 * Echoward: Reino das Cinzas - Sprites Salvos no Código
 * Gerado automaticamente pelo Gerenciador de Sprites em ${new Date().toISOString()}
 */

export interface EmbeddedFrame {
  id: string;
  dataUrl: string;
}

export type EmbeddedSpriteData = Record<string, EmbeddedFrame[]>;

export const EMBEDDED_SPRITES_DATABASE: EmbeddedSpriteData = ${jsonContent};
`;
}
