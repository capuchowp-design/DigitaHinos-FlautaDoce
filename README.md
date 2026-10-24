# DigitaHinos FlautaDoce

Visualizador MIDI com flauta doce soprano em Dó animada (digitação barroca/inglesa, de Dó5 a Ré7): os dedos fecham os furos (mão esquerda em vermelho, direita em verde; meio-furo do polegar e furos duplos 6 e 7 incluídos), com a pauta em clave de Sol e o compositor.

- A nota soa como escrita. Compositor com exportação WAV, MIDI (instrumento 74, flauta doce), JSON e partitura em PDF (clave de Sol, com o diagrama de furos sob cada nota); projetos salvos no navegador, autosave e importação de MIDI.
- Publicação: suba os arquivos no GitHub Pages. A cada versão nova, mude `CACHE_NAME` em `sw.js`.
- Notação dos furos: 0 = polegar, 1–7 = furos, ½ = meio-furo (polegar) ou só um dos furinhos do furo duplo. Notas fora do alcance são dobradas de oitava.
- Hinos e MusicXML: o botão **Hinos** abre a biblioteca (pasta `hinos/`, 480 hinos em .mxl) e o app também abre arquivos .mxl/.xml (player e importação no compositor). Nos hinos a 4 vozes há seletor de voz; para caber na flauta (Dó5 a Ré7), soprano e contralto sobem 1 oitava, tenor e baixo sobem 2 oitavas e só as notas que ainda ficarem fora do alcance vão para a oitava mais próxima que caiba.
