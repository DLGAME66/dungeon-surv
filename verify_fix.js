const fs=require('fs');
const s=fs.readFileSync('docs/index.html','utf8');
const re=/menu-stat-num">([^<]*)</g;
let m,c=1;
while((m=re.exec(s))){console.log('card'+c+':',JSON.stringify(m[1]));c++;}
let n=0;for(const ch of s) if(ch.charCodeAt(0)===0xFFFD) n++;
console.log('中文版 U+FFFD:',n);
console.log('v3(AD_SYSTEM):',s.includes('AD_SYSTEM'));
console.log('GAME_VERSION:',(s.match(/GAME_VERSION\s*=\s*'([^']*)'/)||[])[1]);
