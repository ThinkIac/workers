const fs = require('node:fs');
const path = require('node:path');
const compiler = require('logostype');
const root = path.resolve(__dirname, '..');
function build(dir) {
  for (const entry of fs.readdirSync(path.join(root, 'src', dir), {withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))) {
    const relative=path.join(dir,entry.name);
    if(entry.isDirectory()) { build(relative); continue; }
    if(!entry.name.endsWith('.type')) continue;
    const target=path.join(root,'dist',relative.replace(/\.type$/,'.cjs'));
    fs.mkdirSync(path.dirname(target),{recursive:true});
    fs.writeFileSync(target, compiler.compile(fs.readFileSync(path.join(root,'src',relative),'utf8'),{bare:true,filename:relative}));
  }
}
build('');

fs.writeFileSync(path.join(root,'dist/cpu-worker.js'), "require('./cpu-worker.cjs');\n");
