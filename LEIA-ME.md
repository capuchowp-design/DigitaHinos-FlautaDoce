# Ícones e animação — DigitaHinos FlautaDoce (flauta doce)

Instrumento em roxo (#7c3aed) sobre fundo branco, no mesmo estilo dos ícones anteriores.

## Ícones (substitua os arquivos de mesmo nome do seu projeto)
icon-72x72.png … icon-512x512.png, apple-touch-icon.png, favicon-32x32.png
(`icon-recorder.svg` é a versão vetorial.)

## Animação da tela inicial
No `index.html`, dentro de `<div class="welcome-screen" id="welcomeScreen">`, troque o
`<svg class="welcome-icon" viewBox="0 0 120 120" ...> ... </svg>` (o violino) pelo conteúdo de:
- `welcome-recorder-dark.svg`  → tema escuro (o da sua captura)
- `welcome-recorder-light.svg` → tema claro
(a classe `welcome-icon` mantém o balanço "float" que você já tem; as notinhas sobem sozinhas).
Se quiser trocar conforme o tema, use as duas e esconda uma com CSS: `body.light .wi-dark{display:none}` e `body:not(.light) .wi-light{display:none}`.

## Logo pequeno do cabeçalho
`logo-recorder.svg` substitui o quadradinho roxo ao lado do título "DigitaHinos FlautaDoce".

## Cache
Depois de trocar os ícones, aumente o nome do cache no `sw.js` (ex.: v1 → v2) para o navegador baixar os novos.
