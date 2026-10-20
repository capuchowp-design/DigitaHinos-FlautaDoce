// Prepara a pasta www/ (o que vai dentro do APK) a partir do index.html do repositório.
// O index.html original NÃO é alterado: as mudanças abaixo são feitas só na cópia.
// Se algum trecho não for encontrado, o script para com erro (assim você nota na hora).
import fs from 'node:fs';
import path from 'node:path';

// ===== Opções =====
const APP_NAME = 'Recorder Bounce';
const APP_SLUG = 'recorderbounce';
const KEEP_DONATION_BUTTON = true; // coloque false para esconder o botão "PIX — Apoiar" dentro do APK
// ==================

const ROOT = process.cwd();
const WWW = path.join(ROOT, 'www');
const fail = (m) => { console.error('ERRO: ' + m); process.exit(1); };

// ---- Nome do pacote: io.github.<usuario>.recorderbounce (minúsculas, sem hífen) ----
function makeAppId() {
  if (process.env.APP_ID && process.env.APP_ID.trim()) return process.env.APP_ID.trim();
  let owner = (process.env.OWNER || 'meuusuario').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!owner) owner = 'meuusuario';
  if (/^[0-9]/.test(owner)) owner = 'u' + owner;
  return `io.github.${owner}.${APP_SLUG}`;
}
const APP_ID = makeAppId();
if (!/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/.test(APP_ID)) fail('Nome de pacote inválido: ' + APP_ID);

fs.rmSync(WWW, { recursive: true, force: true });
for (const d of ['vendor', 'fonts', 'samples/flute']) fs.mkdirSync(path.join(WWW, d), { recursive: true });

// ---- Arquivos que vão para o APK ----
for (const f of ['manifest.json', 'pro-config.js', 'favicon-32x32.png', 'apple-touch-icon.png', 'icon-192x192.png', 'icon-512x512.png',
                 'icon-maskable-192x192.png', 'icon-maskable-512x512.png']) {
  if (!fs.existsSync(f)) fail('Arquivo não encontrado na raiz do repositório: ' + f);
  fs.copyFileSync(f, path.join(WWW, f));
}

// ---- Biblioteca de hinos (480 .mxl + index.json) ----
if (fs.existsSync('hinos')) fs.cpSync('hinos', path.join(WWW, 'hinos'), { recursive: true });

// ---- Tone.js e fonte Inter locais (o app funciona offline, sem CDN) ----
const toneSrc = 'node_modules/tone/build/Tone.js';
if (!fs.existsSync(toneSrc)) fail('Tone.js não encontrado (rode npm install).');
fs.copyFileSync(toneSrc, path.join(WWW, 'vendor', 'Tone.js'));
let fontCss = '';
for (const w of [400, 500, 600, 700]) {
  const f = `node_modules/@fontsource/inter/files/inter-latin-${w}-normal.woff2`;
  if (!fs.existsSync(f)) fail('Fonte Inter não encontrada: ' + f);
  fs.copyFileSync(f, path.join(WWW, 'fonts', `inter-${w}.woff2`));
  fontCss += `@font-face{font-family:'Inter';font-style:normal;font-weight:${w};font-display:swap;src:url(fonts/inter-${w}.woff2) format('woff2');}\n`;
}

// ---- Amostras de som da flauta (baixadas pelo robô em samples-src/flute) ----
const SAMPLES = path.join(ROOT, 'samples-src', 'flute');
if (!fs.existsSync(SAMPLES)) fail('Amostras de som não encontradas em samples-src/flute.');
const sampleFiles = fs.readdirSync(SAMPLES).filter((f) => /^[A-G]s?[0-9]\.mp3$/.test(f)).sort();
if (sampleFiles.length < 5) fail('Poucas amostras de som encontradas: ' + sampleFiles.length);
const sampleMap = {};
for (const f of sampleFiles) {
  fs.copyFileSync(path.join(SAMPLES, f), path.join(WWW, 'samples', 'flute', f));
  sampleMap[f.replace('.mp3', '').replace('s', '#')] = f;
}

// ---- Ajustes no index.html (só na cópia) ----
let html = fs.readFileSync('index.html', 'utf8');
function replaceOnce(re, to, what) {
  const m = html.match(re);
  if (!m) fail('Trecho não encontrado no index.html: ' + what);
  html = html.replace(re, () => to);
}

// 1) Tone.js local
replaceOnce(/<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/tone\/14\.8\.49\/Tone\.js"><\/script>/,
  '<script src="vendor/Tone.js"></script>', 'Tone.js (CDN)');

// 2) Fonte local (remove o @import da CDN)
replaceOnce(/@import url\('https:\/\/cdn\.jsdelivr\.net\/fontsource\/fonts\/inter@5\/latin\.css'\);/, '', '@import da fonte Inter');

// 3) Som: usa as gravações embutidas no APK (sem internet) em vez de baixar de um site
replaceOnce(/const PIANO_SOURCES=\[[\s\S]*?\];/, "const PIANO_SOURCES=['samples/flute/'];", 'lista de fontes do som');
replaceOnce(/async function recorderUrls\(base\)\{[\s\S]*?\n\}/,
  'async function recorderUrls(base){ return ' + JSON.stringify(sampleMap) + '; }', 'função recorderUrls');

// 4) Sem service worker dentro do APK (os arquivos já estão no aparelho)
replaceOnce(/if\('serviceWorker' in navigator\)\{/, 'if(false){', 'registro do service worker');

// 5) Importar MIDI/JSON: sem filtro de extensão (o seletor do Android às vezes esconde o arquivo com filtro)
const acceptRe = /(<input type="file" id="(?:fileInput|welcomeFileInput|pbFile)"[^>]*?) accept="[^"]*"/g;
if ((html.match(acceptRe) || []).length !== 3) fail('Campos de arquivo não encontrados (esperava 3).');
html = html.replace(acceptRe, '$1');

// 6) Exportar (MIDI, WAV, JSON, PDF): no Android abre a folha "Compartilhar" (salvar em Arquivos/Drive, enviar...)
replaceOnce(
  /const url=URL\.createObjectURL\(new Blob\(\[new Uint8Array\(all\)\],\{type:'audio\/midi'\}\)\);\s*const a=document\.createElement\('a'\); a\.href=url; a\.download=\(window\.pbFileBase\?window\.pbFileBase\(\):'recorderbounce'\)\+'\.mid'; a\.click\(\);\s*URL\.revokeObjectURL\(url\);/,
  "window.fbSaveFile((window.pbFileBase?window.pbFileBase():'recorderbounce')+'.mid',new Uint8Array(all),'audio/midi');",
  'exportação do MIDI');
replaceOnce(
  /function download\(name,blob\)\{\s*const a=document\.createElement\('a'\); a\.href=URL\.createObjectURL\(blob\); a\.download=name;\s*document\.body\.append\(a\); a\.click\(\); a\.remove\(\); setTimeout\(\(\)=>URL\.revokeObjectURL\(a\.href\),2000\);\s*\}/,
  "async function download(name,blob){ const buf=new Uint8Array(await blob.arrayBuffer()); return window.fbSaveFile(name,buf,blob.type||'application/octet-stream'); }",
  'função download (WAV, JSON, PDF)');

// 7) Texto da pasta do dispositivo (no Android essa função do navegador não existe)
replaceOnce(/Este navegador não permite escolher uma pasta \(isso funciona no Chrome e no Edge\)\. Use a biblioteca do aplicativo ou o botão Exportar › Projeto \(JSON\)\./,
  'Escolher uma pasta não está disponível no app Android. Use a biblioteca do aplicativo ou o botão Exportar › Projeto (JSON).',
  'aviso da pasta do dispositivo');

// 8) Ajudas: exportação, fonte, área segura e cabeçalho em duas linhas no celular
const helper = `
<style>
${fontCss}
html{--fb-top:var(--safe-area-inset-top,env(safe-area-inset-top,0px));--fb-bottom:var(--safe-area-inset-bottom,env(safe-area-inset-bottom,0px));--fb-left:var(--safe-area-inset-left,env(safe-area-inset-left,0px));--fb-right:var(--safe-area-inset-right,env(safe-area-inset-right,0px));}
body{padding-top:var(--fb-top)!important;padding-bottom:var(--fb-bottom)!important;padding-left:var(--fb-left);padding-right:var(--fb-right);}
@media(max-width:768px){
  .app-header{flex-direction:column;align-items:stretch;flex-wrap:nowrap;gap:6px;}
  .app-logo{width:100%;}
  .app-logo .note-count-badge{display:none!important;}
  .header-right{width:100%;flex-wrap:nowrap;justify-content:flex-start;gap:6px;}
  .header-right .file-label{margin-left:auto;}
}
${KEEP_DONATION_BUTTON ? '' : '#btnPix,#pixModal{display:none!important;}'}
</style>
<script>
window.fbSaveFile=async function(name,bytes,mime){
  var cap=window.Capacitor, P=cap&&cap.Plugins;
  if(cap&&cap.isNativePlatform&&cap.isNativePlatform()&&P&&P.Filesystem&&P.Share){
    try{
      var bin=''; for(var i=0;i<bytes.length;i+=0x8000){ bin+=String.fromCharCode.apply(null,bytes.subarray(i,i+0x8000)); }
      var r=await P.Filesystem.writeFile({path:name,data:btoa(bin),directory:'CACHE'});
      await P.Share.share({title:name,url:r.uri,dialogTitle:'Salvar ou enviar o arquivo'});
      return;
    }catch(e){ if(e&&/cancel/i.test(String(e.message||e))) return; console.error(e); }
  }
  var url=URL.createObjectURL(new Blob([bytes],{type:mime}));
  var a=document.createElement('a'); a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function(){URL.revokeObjectURL(url);},4000);
};
</script>
`;
if (!/<\/head>/.test(html)) fail('</head> não encontrado.');
html = html.replace('</head>', () => helper + '</head>');

fs.writeFileSync(path.join(WWW, 'index.html'), html);

// ---- Configuração do Capacitor ----
const cfg = { appId: APP_ID, appName: APP_NAME, webDir: 'www', backgroundColor: '#0a080e', android: { allowMixedContent: false } };
fs.writeFileSync('capacitor.config.json', JSON.stringify(cfg, null, 2));

console.log('OK. Pacote: ' + APP_ID + ' | Nome: ' + APP_NAME + ' | amostras: ' + sampleFiles.length);
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `app_id=${APP_ID}\n`);
