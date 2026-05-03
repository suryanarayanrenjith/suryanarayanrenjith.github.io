(function () {
'use strict';

var inputEl  = document.getElementById('commandInput');
var outputEl = document.getElementById('output');
var promptEl = document.querySelector('.prompt');

var vimShellEl = document.getElementById('vimShell');
var vimTitleEl = document.getElementById('vimTitle');
var vimModeLabelEl = document.getElementById('vimModeLabel');
var vimBufferEl = document.getElementById('vimBuffer');
var vimGutterEl = document.getElementById('vimGutter');
var vimStatusLeftEl = document.getElementById('vimStatusLeft');
var vimStatusRightEl = document.getElementById('vimStatusRight');

var USER = 'surya', HOST = 'portfolio', HOME = '/home/surya';
var cwd  = HOME;
var hist = [], histPos = -1;
var aliases = { ll:'ls -la', la:'ls -a', cls:'clear', '..':'cd ..' };
var envVars = {
  HOME: HOME, USER: USER, HOSTNAME: HOST, SHELL: '/bin/bash',
  TERM: 'xterm-256color', PATH: '/usr/local/bin:/usr/bin:/bin',
  EDITOR: 'vim', LANG: 'en_US.UTF-8', PWD: HOME, OLDPWD: HOME
};
var routeMap = { about:'/', projects:'/', resume:'/Resume' };
var shellBuiltins = {
  alias:true, builtin:true, cd:true, clear:true, env:true, exit:true,
  export:true, help:true, history:true, man:true, open:true, pwd:true,
  section:true, type:true, unalias:true, which:true
};
var externalCommandNames = [
  'ls','cat','head','tail','grep','wc','touch','mkdir','rm','rmdir','cp','mv',
  'tree','find','file','stat','echo','rev','sort','uniq','whoami','hostname',
  'uname','date','uptime','id','groups','df','free','ps',
  'neofetch','cowsay','fortune','cal','factor','vim','chmod',
  'chown','sudo','top','htop','sl','wget','ssh','apt','brew','pip','npm','su'
];
var sessionStart = Date.now();
var exitCode = 0;
var interrupted = false;
var captureMode = false, captureBuffer = '';
var _headerCleared = null;

var vfs = {};
var fileLinks = {};
var vimState = {
  open: false,
  mode: 'normal',
  path: '',
  displayPath: '[No Name]',
  original: '',
  dirty: false,
  command: '',
  pending: '',
  locked: false,
  lastMessage: 'Press i to insert, :w to save, :q to quit',
  preferredCol: null
};

function _modeValue(mode) {
  return parseInt(String(mode || '0644').slice(-4), 8);
}
function _normalizeMode(mode, fallback) {
  var raw = String(mode || fallback || '0644').replace(/[^0-7]/g, '');
  if (!raw) raw = fallback || '0644';
  if (raw.length === 3) raw = '0' + raw;
  return raw.slice(-4);
}
function _setMode(node, mode) {
  var fallback = node.type === 'd' ? '0755' : '0644';
  node.mode = _normalizeMode(mode, fallback);
  node.executable = node.type === 'f' && (_modeValue(node.mode) & 0o111) !== 0;
}
function _addChild(pp, nm) {
  if (vfs[pp] && vfs[pp].ch.indexOf(nm) < 0) vfs[pp].ch.push(nm);
}
function _removeChild(pp, nm) {
  if (!vfs[pp]) return;
  var idx = vfs[pp].ch.indexOf(nm);
  if (idx > -1) vfs[pp].ch.splice(idx, 1);
}
function _mkdirp(p, meta) {
  if (vfs[p]) return;
  vfs[p] = { type:'d', ch:[], mt:new Date() };
  _setMode(vfs[p], meta && meta.mode ? meta.mode : '0755');
  if (p !== '/') {
    var pp = _parent(p), nm = _base(p);
    if (!vfs[pp]) _mkdirp(pp);
    _addChild(pp, nm);
  }
}
function _mkfile(p, content, meta) {
  meta = meta || {};
  var data = content == null ? '' : String(content);
  var pp = _parent(p), nm = _base(p);
  if (!vfs[pp]) _mkdirp(pp);
  vfs[p] = { type:'f', data:data, remote:meta.remote||null, readOnly:!!meta.readOnly, mt:new Date(), sz:data.length };
  _setMode(vfs[p], meta.mode || (meta.executable ? '0755' : '0644'));
  _addChild(pp, nm);
}
function _updateFile(p, content, meta) {
  meta = meta || {};
  if (!_exists(p)) { _mkfile(p, content, meta); return vfs[p]; }
  if (!_isFile(p)) throw new Error('Not a file');
  vfs[p].data = content == null ? '' : String(content);
  vfs[p].sz = vfs[p].data.length;
  vfs[p].mt = new Date();
  if (meta.mode) _setMode(vfs[p], meta.mode);
  if (typeof meta.readOnly === 'boolean') vfs[p].readOnly = meta.readOnly;
  return vfs[p];
}
function _cloneFileNode(node) {
  return {
    type: 'f',
    data: node.data,
    remote: node.remote || null,
    readOnly: !!node.readOnly,
    mt: new Date(),
    sz: (node.data || '').length,
    mode: node.mode,
    executable: !!node.executable
  };
}
function _parent(p)  { if (p==='/') return '/'; var s=p.split('/'); s.pop(); return s.join('/')||'/'; }
function _base(p)    { return p==='/'?'/':p.split('/').pop(); }
function _resolve(s) {
  if (!s || s==='') return cwd;
  if (s==='~') return HOME;
  if (s==='-') return envVars.OLDPWD || HOME;
  if (s.charAt(0)==='~') s = HOME + '/' + s.slice(2);
  else if (s.charAt(0)!=='/') s = cwd + '/' + s;
  var parts = s.split('/'), out = [];
  for (var i=0; i<parts.length; i++) {
    if (parts[i]==='' || parts[i]==='.') continue;
    if (parts[i]==='..') { out.pop(); continue; }
    out.push(parts[i]);
  }
  return '/' + out.join('/');
}
function _exists(p) { return !!vfs[p]; }
function _isDir(p)  { return vfs[p] && vfs[p].type==='d'; }
function _isFile(p) { return vfs[p] && vfs[p].type==='f'; }
function _isExecutable(node) { return !!(node && node.type === 'f' && (_modeValue(node.mode) & 0o111)); }
function _permString(node) {
  var value = _modeValue(node.mode);
  var out = node.type === 'd' ? 'd' : '-';
  var masks = [0o400,0o200,0o100,0o040,0o020,0o010,0o004,0o002,0o001];
  var chars = ['r','w','x','r','w','x','r','w','x'];
  for (var i = 0; i < masks.length; i++) out += (value & masks[i]) ? chars[i] : '-';
  return out;
}
function canWritePath(p) {
  return p === HOME || p.indexOf(HOME + '/') === 0 || p === '/tmp' || p.indexOf('/tmp/') === 0;
}
function normalizeSectionName(name) {
  var key = String(name || '').toLowerCase();
  if (key === 'project') key = 'projects';
  return key;
}
function extractSectionFromScript(text) {
  var match = /^\s*section\s+([a-z0-9_-]+)/im.exec(text || '');
  return match ? normalizeSectionName(match[1]) : null;
}
function ensureParentDirectory(p, raw, cmd) {
  var pp = _parent(p);
  if (!_exists(pp)) return cmd + ': cannot create \'' + raw + '\': No such file or directory';
  if (!_isDir(pp)) return cmd + ': cannot create \'' + raw + '\': Not a directory';
  return '';
}
function syncHistoryFile() {
  if (_isFile(HOME + '/.bash_history')) _updateFile(HOME + '/.bash_history', hist.join('\n'));
}

function initFS() {
  ['/','/home',HOME,HOME+'/Documents',HOME+'/Downloads',
   '/etc','/usr','/usr/bin','/usr/local','/usr/local/bin',
   '/tmp','/var','/var/log','/bin','/dev'].forEach(_mkdirp);
  _mkfile(HOME+'/.bashrc','# ~/.bashrc\nexport PATH="/usr/local/bin:/usr/bin:/bin"\nexport EDITOR="vim"\nalias ll="ls -la"\nalias la="ls -a"\n');
  _mkfile(HOME+'/.profile','# ~/.profile\n# Executed on login.\n');
  _mkfile(HOME+'/.bash_history','');
  _mkfile(HOME+'/README.txt','Run ./about, ./projects, or ./resume to browse portfolio sections.\nRun help to see available commands and current open targets.\nUse vim <file> to edit local files in your home directory.\n');
  _mkfile('/etc/hostname', HOST + '\n', { readOnly:true });
  _mkfile('/etc/os-release','NAME="SuryaOS"\nVERSION="3.1"\nID=suryaos\nPRETTY_NAME="SuryaOS 3.1 (Terminal)"\n', { readOnly:true });
  _mkfile('/etc/passwd','root:x:0:0:root:/root:/bin/bash\nsurya:x:1000:1000:Suryanarayan Renjith:'+HOME+':/bin/bash\n', { readOnly:true });
  _mkfile('/var/log/syslog','[OK] System initialized\n[OK] Network online\n[OK] Interactive shell attached\n', { readOnly:true });
  _mkfile('/dev/null','', { mode:'0666', readOnly:true });
  _mkfile('/bin/bash','#!/usr/bin/env surya-shell\necho "A shell is already running in this page."\n', { executable:true, readOnly:true });
  _mkfile('/bin/sh','#!/usr/bin/env surya-shell\necho "A POSIX shell is already running in this page."\n', { executable:true, readOnly:true });
  _mkfile(HOME+'/about','#!/usr/bin/env surya-shell\nsection about\n', { executable:true });
  _mkfile(HOME+'/projects','#!/usr/bin/env surya-shell\nsection projects\n', { executable:true });
  _mkfile(HOME+'/resume','#!/usr/bin/env surya-shell\nsection resume\n', { executable:true });
}
var FILE_LINKS_URL = 'https://surya-api.vercel.app/api/fileLinks';
var fileLinksFetch = null;
function fetchFileLinks() {
  return fetch(FILE_LINKS_URL)
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (d && typeof d === 'object' && !d.error) fileLinks = d;
      return fileLinks;
    })
    .catch(function () { return fileLinks; });
}
function ensureFileLinks() {
  var hasKeys = false;
  for (var k in fileLinks) {
    if (Object.prototype.hasOwnProperty.call(fileLinks, k) && k !== 'error') { hasKeys = true; break; }
  }
  if (hasKeys) return Promise.resolve(fileLinks);
  if (!fileLinksFetch) {
    fileLinksFetch = fetchFileLinks().then(function (links) { fileLinksFetch = null; return links; });
  }
  return fileLinksFetch;
}
ensureFileLinks();

function htmlResult(html, className) {
  return { kind:'html', html:html, className:className || '' };
}
function preResult(text, className) {
  return { kind:'pre', text:text, className:className || '' };
}
function fail(message, code) {
  exitCode = code == null ? 1 : code;
  return message;
}
function print(text, cls) {
  if (captureMode) { captureBuffer += (text||'') + '\n'; return; }
  var d = document.createElement('div');
  if (cls) d.className = cls;
  d.textContent = text;
  outputEl.appendChild(d);
}
function printError(text) { print(text, 'term-error'); }
function printHTML(html, cls) {
  if (captureMode) { captureBuffer += stripTags(html) + '\n'; return; }
  var d = document.createElement('div');
  if (cls) d.className = cls;
  d.innerHTML = html;
  outputEl.appendChild(d);
  postProcessInjectedHtml(d);
}
function printPre(text, cls) {
  if (captureMode) { captureBuffer += (text||'') + '\n'; return; }
  var pre = document.createElement('pre');
  pre.style.cssText = 'margin:0;font-family:inherit;white-space:pre-wrap;';
  if (cls) pre.className = cls;
  pre.textContent = text;
  outputEl.appendChild(pre);
}
function printPrompt(cmd) {
  printHTML('<span class="prompt">' + promptStr() + '</span> ' + esc(cmd));
}
function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function stripTags(h) { var d = document.createElement('div'); d.innerHTML = h; return d.textContent||''; }
function formatDisplayPath(path) {
  if (!path) return '[No Name]';
  if (path === HOME) return '~';
  if (path.indexOf(HOME + '/') === 0) return '~/' + path.slice(HOME.length + 1);
  return path;
}
function promptStr() {
  return USER + '@' + HOST + ':' + formatDisplayPath(cwd) + '$';
}
function updatePrompt() { promptEl.textContent = promptStr(); }
function scroll() { var t = document.querySelector('.terminal'); t.scrollTop = t.scrollHeight; }
function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

function cleanFetchedHTML(html) {
  return html.replace(/style="[^"]*position:\s*absolute[^"]*"/gi,
    'style="text-align: center; margin-top: 12px;"');
}

function removeProjectPreviewOverlay() {
  var overlay = document.body.querySelector('#p4-preview-overlay');
  if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
}

function moveProjectPreviewOverlay(container) {
  var overlay = container.querySelector('#p4-preview-overlay');
  if (!overlay) return;
  removeProjectPreviewOverlay();
  overlay.style.display = 'none';
  overlay.classList.remove('is-open');
  overlay.classList.add('cli-project-overlay');
  document.body.appendChild(overlay);
}

function postProcessInjectedHtml(container) {
  if (!container || !container.querySelector) return;

  if (container.querySelector('.p4-project-grid')) {
    container.classList.add('html-content--projects');
    moveProjectPreviewOverlay(container);
  }

  if (container.querySelector('.center-button a[href="/Resume"], .center-button a[href="/Resume/"]')) {
    container.classList.add('html-content--resume');
  }
}

function parseFlags(args) {
  var flags = {}, positional = [];
  for (var i = 0; i < args.length; i++) {
    if (args[i].charAt(0) === '-' && args[i].length > 1 && !/^\-\d/.test(args[i])) {
      for (var j = 1; j < args[i].length; j++) flags[args[i].charAt(j)] = true;
    } else {
      positional.push(args[i]);
    }
  }
  return { flags: flags, args: positional };
}
function pad(s, n) { s = String(s); while (s.length < n) s = ' ' + s; return s; }
function rpad(s, n) { s = String(s); while (s.length < n) s += ' '; return s; }
function fmtSize(b) {
  if (b < 1024) return b + 'B';
  if (b < 1048576) return (b/1024).toFixed(1) + 'K';
  return (b/1048576).toFixed(1) + 'M';
}
function fmtDate(d) {
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months[d.getMonth()] + ' ' + pad(d.getDate(), 2) + ' ' + pad(d.getHours(), 2) + ':' + ('0'+d.getMinutes()).slice(-2);
}
function shellEscape(value) {
  var text = String(value == null ? '' : value);
  if (!text.length) return '""';
  if (/[\s"'\\$`]/.test(text)) return '"' + text.replace(/(["\\$`])/g, '\\$1') + '"';
  return text;
}
function availableCommandNames() {
  return Object.keys(commands).filter(function (name) {
    return name !== 'builtin' && name !== 'section';
  });
}
function closestCmd(cmd) {
  var best = '', dist = Infinity;
  var all = availableCommandNames();
  for (var i = 0; i < all.length; i++) {
    var d = levenshtein(cmd, all[i]);
    if (d < dist) { dist = d; best = all[i]; }
  }
  return dist <= 3 ? best : null;
}
function levenshtein(a, b) {
  var m = a.length, n = b.length, prev = [], curr = [];
  for (var j = 0; j <= n; j++) prev[j] = j;
  for (var i = 1; i <= m; i++) {
    curr[0] = i;
    for (var jj = 1; jj <= n; jj++) {
      curr[jj] = Math.min(prev[jj]+1, curr[jj-1]+1, prev[jj-1]+(a[i-1]===b[jj-1]?0:1));
    }
    var tmp = prev; prev = curr; curr = tmp;
  }
  return prev[n];
}
function renderResult(result) {
  if (result == null || result === '') return;
  if (typeof result === 'string') { printPre(result); return; }
  if (result.kind === 'html') { printHTML(result.html, result.className); return; }
  if (result.kind === 'pre') { printPre(result.text, result.className); }
}
function renderNameHtml(name, path, node, prefix) {
  var classes = [prefix + '-node'];
  if (node.type === 'd') classes.push(prefix + '-dir');
  else if (_isExecutable(node)) classes.push(prefix + '-exec');
  else classes.push(prefix + '-file');
  if (name.charAt(0) === '.') classes.push(prefix + '-hidden');
  return '<span class="' + classes.join(' ') + '">' + esc(name + (node.type === 'd' ? '/' : '')) + '</span>';
}
function _lsLong(name, path, node, human) {
  if (!node) return '??????????  ? ?     ?       ?            ? ' + name;
  var links = node.type === 'd' ? (node.ch ? node.ch.length + 2 : 2) : 1;
  var sz = node.type === 'd' ? 4096 : (node.sz || 0);
  if (human) sz = fmtSize(sz); else sz = String(sz);
  return esc(_permString(node) + ' ' + pad(links, 2) + ' ' + rpad(USER, 6) + ' ' + rpad(USER, 6) + ' ' + pad(sz, 6) + ' ' + fmtDate(node.mt) + ' ') + renderNameHtml(name, path, node, 'ls');
}
function describeFileType(path) {
  var node = vfs[path];
  if (!node) return 'missing';
  if (node.type === 'd') return 'directory';
  if (extractSectionFromScript(node.data)) return 'POSIX shell script, ASCII text executable';
  if (/^#!\s*\S+/.test(node.data || '')) return _isExecutable(node) ? 'POSIX shell script, ASCII text executable' : 'POSIX shell script, ASCII text';
  if (!node.data || !node.data.length) return _isExecutable(node) ? 'empty executable' : 'empty';
  return _isExecutable(node) ? 'ASCII text executable' : 'ASCII text';
}
function getCommandPath(name) {
  var dirs = envVars.PATH.split(':');
  for (var i = 0; i < dirs.length; i++) {
    var path = _resolve(dirs[i] + '/' + name);
    if (_isFile(path) && _isExecutable(vfs[path])) return path;
  }
  return null;
}
function getOpenOptionNames() {
  var names = [];
  Object.keys(fileLinks || {}).forEach(function (name) {
    if (name === 'error') return;
    if (names.indexOf(name) < 0) names.push(name);
  });
  Object.keys(routeMap).forEach(function (name) {
    if (names.indexOf(name) < 0) names.push(name);
  });
  return names.sort();
}
function getOpenOptionsSummary() {
  var names = getOpenOptionNames();
  if (!names.length) return '(loading...)';
  return names.join(', ');
}

var manPages = {
  ls:       'ls [OPTIONS] [PATH...]\n  List directory contents with Linux-style coloring.\n  -a  Show hidden files\n  -l  Long listing format\n  -h  Human-readable sizes (with -l)',
  cd:       'cd [DIR]\n  Change directory.\n  ~   Home directory\n  -   Previous directory\n  ..  Parent directory',
  pwd:      'pwd\n  Print the current working directory.',
  cat:      'cat [FILE...]\n  Display plain file contents.\n  Use ./about, ./projects, or ./resume to launch portfolio sections.',
  echo:     'echo [TEXT]\n  Print text to the terminal.\n  Supports $VARIABLE expansion.',
  clear:    'clear\n  Clear the terminal screen.\n  Shortcut: Ctrl+L',
  mkdir:    'mkdir [-p] DIR\n  Create a directory.\n  -p  Create parent directories as needed.',
  touch:    'touch FILE\n  Create an empty file or update timestamp.',
  rm:       'rm [-r] [-f] FILE\n  Remove files or directories.\n  -r  Remove directories recursively\n  -f  Force removal without confirmation',
  rmdir:    'rmdir DIR\n  Remove an empty directory.',
  cp:       'cp SOURCE DEST\n  Copy a file to a new location.',
  mv:       'mv SOURCE DEST\n  Move or rename a file.',
  head:     'head [-n N] FILE\n  Display the first N lines (default 10).',
  tail:     'tail [-n N] FILE\n  Display the last N lines (default 10).',
  grep:     'grep PATTERN [FILE]\n  Search for PATTERN in file or piped input.\n  Supports piping: cat file | grep pattern',
  wc:       'wc [FILE]\n  Print line, word, and byte counts.',
  tree:     'tree [PATH]\n  Display directory structure as a tree.',
  find:     'find [PATH] -name PATTERN\n  Search for files matching a pattern.',
  file:     'file PATH\n  Determine file type.',
  stat:     'stat FILE\n  Display detailed file information.',
  chmod:    'chmod MODE FILE\n  Change file permissions.\n  Supports 755/644 and symbolic modes like +x, -x, u+x, go-w.',
  date:     'date\n  Display current date and time.',
  uname:    'uname [-a|-s|-r|-n|-m]\n  Print system information.\n  -a  All info  -s  Kernel name  -r  Release\n  -n  Hostname  -m  Architecture',
  uptime:   'uptime\n  Show session uptime and load averages.',
  hostname: 'hostname\n  Print the system hostname.',
  whoami:   'whoami\n  Print the current username.',
  id:       'id\n  Print user and group identity.',
  groups:   'groups\n  Print group memberships.',
  df:       'df [-h]\n  Show disk usage.\n  -h  Human-readable format.',
  free:     'free [-h]\n  Show memory usage.\n  -h  Human-readable format.',
  ps:       'ps [aux]\n  Show running processes.',
  history:  'history [-c]\n  Show command history.\n  -c  Clear history.',
  man:      'man COMMAND\n  Display the manual page for a command.',
  help:     'help\n  List all available commands and shortcuts.',
  alias:    'alias [NAME=VALUE]\n  Set or list aliases.',
  unalias:  'unalias NAME\n  Remove a command alias.',
  export:   'export VAR=VALUE\n  Set an environment variable.',
  env:      'env\n  Display all environment variables.',
  which:    'which COMMAND\n  Show the location of a command.',
  type:     'type COMMAND\n  Show the type of a command.',
  open:     'open NAME\n  Open a linked page in a new tab.\n  Targets are loaded dynamically from the fileLinks endpoint.\n  Press Tab after \'open \' to autocomplete available targets,\n  or run help to see the current list.',
  neofetch: 'neofetch\n  Display system information with ASCII art.',
  cowsay:   'cowsay [TEXT]\n  Make a cow say something.',
  fortune:  'fortune\n  Display a random inspirational quote.',
  cal:      'cal\n  Display a calendar for the current month.',
  factor:   'factor NUMBER\n  Print the prime factors of a number.',
  rev:      'rev TEXT\n  Reverse a string.',
  vim:      'vim [FILE]\n  Open the built-in modal editor.\n  i/a/o  enter insert mode\n  Esc    return to normal mode\n  :w     save    :q     quit    :wq / :x  save and quit\n  dd     delete line    gg / G  jump top or bottom',
  exit:     'exit\n  Close the terminal session.',
  sudo:     'sudo COMMAND\n  Execute a command as superuser (simulated).'
};

var commands = {};

commands.ls = function (args) {
  var parsed = parseFlags(args);
  var showAll = parsed.flags.a, longFmt = parsed.flags.l, human = parsed.flags.h;
  var targets = parsed.args.length ? parsed.args : ['.'];
  var blocks = [];
  for (var ti = 0; ti < targets.length; ti++) {
    var rawTarget = targets[ti];
    var target = _resolve(rawTarget);
    if (!_exists(target)) {
      printError('ls: cannot access \'' + rawTarget + '\': No such file or directory');
      exitCode = 2;
      continue;
    }
    if (blocks.length) blocks.push('');
    if (targets.length > 1) blocks.push('<span class="ls-heading">' + esc(rawTarget) + ':</span>');
    if (_isFile(target)) {
      blocks.push(longFmt ? _lsLong(_base(target), target, vfs[target], human) : renderNameHtml(_base(target), target, vfs[target], 'ls'));
      continue;
    }
    var entries = vfs[target].ch.slice().sort();
    if (!showAll) entries = entries.filter(function (e) { return e.charAt(0) !== '.'; });
    if (longFmt) {
      var lines = ['total ' + entries.length];
      for (var i = 0; i < entries.length; i++) {
        var fp = (target === '/' ? '' : target) + '/' + entries[i];
        lines.push(_lsLong(entries[i], fp, vfs[fp], human));
      }
      blocks.push(lines.join('\n'));
    } else {
      blocks.push(entries.map(function (name) {
        var fp = (target === '/' ? '' : target) + '/' + name;
        return renderNameHtml(name, fp, vfs[fp], 'ls');
      }).join('  '));
    }
  }
  if (!blocks.length) return '';
  return htmlResult('<pre class="ls-output">' + blocks.join('\n') + '</pre>');
};

commands.cd = function (args) {
  var target = args[0] ? _resolve(args[0]) : HOME;
  if (!_exists(target)) return fail('bash: cd: ' + args[0] + ': No such file or directory');
  if (!_isDir(target)) return fail('bash: cd: ' + args[0] + ': Not a directory');
  envVars.OLDPWD = cwd;
  cwd = target;
  envVars.PWD = cwd;
  updatePrompt();
  if (args[0] === '-') print(cwd);
  return '';
};

commands.pwd = function () { return cwd; };

commands.cat = function (args, stdin) {
  if (stdin) return stdin;
  if (!args.length) return fail('cat: missing operand');
  var parts = [];
  for (var i = 0; i < args.length; i++) {
    var path = _resolve(args[i]);
    if (!_exists(path))  { printError('cat: ' + args[i] + ': No such file or directory'); exitCode = 1; continue; }
    if (_isDir(path))    { printError('cat: ' + args[i] + ': Is a directory'); exitCode = 1; continue; }
    parts.push(vfs[path].data || '');
  }
  return parts.join(parts.length > 1 ? '\n' : '');
};

commands.head = function (args, stdin) {
  var parsed = parseFlags(args);
  var n = 10;
  if (parsed.flags.n && parsed.args.length > 0 && /^\d+$/.test(parsed.args[0])) {
    n = parseInt(parsed.args.shift());
  }
  var text = stdin;
  if (!text) {
    if (!parsed.args.length) return fail('head: missing operand');
    var p = _resolve(parsed.args[0]);
    if (!_exists(p)) return fail('head: ' + parsed.args[0] + ': No such file or directory');
    if (_isDir(p)) return fail('head: ' + parsed.args[0] + ': Is a directory');
    text = vfs[p].data || '';
  }
  return text.split('\n').slice(0, n).join('\n');
};

commands.tail = function (args, stdin) {
  var parsed = parseFlags(args);
  var n = 10;
  if (parsed.flags.n && parsed.args.length > 0 && /^\d+$/.test(parsed.args[0])) {
    n = parseInt(parsed.args.shift());
  }
  var text = stdin;
  if (!text) {
    if (!parsed.args.length) return fail('tail: missing operand');
    var p = _resolve(parsed.args[0]);
    if (!_exists(p)) return fail('tail: ' + parsed.args[0] + ': No such file or directory');
    if (_isDir(p)) return fail('tail: ' + parsed.args[0] + ': Is a directory');
    text = vfs[p].data || '';
  }
  var lines = text.split('\n');
  return lines.slice(Math.max(0, lines.length - n)).join('\n');
};

commands.grep = function (args, stdin) {
  if (!args.length) return fail('grep: missing pattern');
  var pattern = args[0];
  var text = stdin;
  if (!text && args.length > 1) {
    var p = _resolve(args[1]);
    if (!_exists(p)) return fail('grep: ' + args[1] + ': No such file or directory');
    if (_isDir(p)) return fail('grep: ' + args[1] + ': Is a directory');
    text = vfs[p].data || '';
  }
  if (!text) return fail('grep: missing file operand');
  var lines = text.split('\n');
  var matched = [];
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().indexOf(pattern.toLowerCase()) > -1) matched.push(lines[i]);
  }
  if (!matched.length) { exitCode = 1; return ''; }
  return matched.join('\n');
};

commands.wc = function (args, stdin) {
  var text = stdin;
  if (!text && args.length) {
    var p = _resolve(args[0]);
    if (!_exists(p)) return fail('wc: ' + args[0] + ': No such file or directory');
    if (_isDir(p)) return fail('wc: ' + args[0] + ': Is a directory');
    text = vfs[p].data || '';
  }
  if (!text) return fail('wc: missing operand');
  var lines = text.split('\n').length;
  var words = text.split(/\s+/).filter(Boolean).length;
  var bytes = text.length;
  return pad(lines, 6) + pad(words, 6) + pad(bytes, 6) + (args.length ? ' ' + args[0] : '');
};

commands.touch = function (args) {
  if (!args.length) return fail('touch: missing operand');
  var p = _resolve(args[0]);
  if (_exists(p)) {
    if (!canWritePath(p) || vfs[p].readOnly) return fail('touch: cannot touch \'' + args[0] + '\': Permission denied');
    vfs[p].mt = new Date();
    return '';
  }
  if (!canWritePath(_parent(p))) return fail('touch: cannot touch \'' + args[0] + '\': Permission denied');
  var parentError = ensureParentDirectory(p, args[0], 'touch');
  if (parentError) return fail(parentError);
  _mkfile(p, '');
  return '';
};

commands.mkdir = function (args) {
  var parsed = parseFlags(args);
  if (!parsed.args.length) return fail('mkdir: missing operand');
  var p = _resolve(parsed.args[0]);
  if (_exists(p)) return fail('mkdir: cannot create directory \'' + parsed.args[0] + '\': File exists');
  if (!canWritePath(_parent(p))) return fail('mkdir: cannot create directory \'' + parsed.args[0] + '\': Permission denied');
  if (parsed.flags.p) { _mkdirp(p); return ''; }
  var pp = _parent(p);
  if (!_exists(pp)) return fail('mkdir: cannot create directory \'' + parsed.args[0] + '\': No such file or directory');
  _mkdirp(p);
  return '';
};

commands.rm = function (args) {
  var parsed = parseFlags(args);
  if (!parsed.args.length) return fail('rm: missing operand');
  var target = parsed.args[0];
  var p = _resolve(target);
  if (p === '/') return fail('rm: it is dangerous to operate recursively on \'/\'\nrm: use --no-preserve-root to override this failsafe');
  if (!_exists(p)) { if (!parsed.flags.f) return fail('rm: cannot remove \'' + target + '\': No such file or directory'); return ''; }
  if (_isDir(p) && !parsed.flags.r) return fail('rm: cannot remove \'' + target + '\': Is a directory');
  if (!canWritePath(p) || vfs[p].readOnly) return fail('rm: cannot remove \'' + target + '\': Permission denied');
  var pp = _parent(p), nm = _base(p);
  if (_isDir(p)) { _rmRecursive(p); }
  delete vfs[p];
  _removeChild(pp, nm);
  return '';
};
function _rmRecursive(p) {
  if (!_isDir(p)) return;
  var ch = vfs[p].ch.slice();
  for (var i = 0; i < ch.length; i++) {
    var cp = (p === '/' ? '' : p) + '/' + ch[i];
    if (_isDir(cp)) _rmRecursive(cp);
    delete vfs[cp];
  }
}

commands.rmdir = function (args) {
  if (!args.length) return fail('rmdir: missing operand');
  var p = _resolve(args[0]);
  if (!_exists(p)) return fail('rmdir: failed to remove \'' + args[0] + '\': No such file or directory');
  if (!_isDir(p)) return fail('rmdir: failed to remove \'' + args[0] + '\': Not a directory');
  if (vfs[p].ch.length > 0) return fail('rmdir: failed to remove \'' + args[0] + '\': Directory not empty');
  if (!canWritePath(p) || vfs[p].readOnly) return fail('rmdir: failed to remove \'' + args[0] + '\': Permission denied');
  var pp = _parent(p), nm = _base(p);
  delete vfs[p];
  _removeChild(pp, nm);
  return '';
};

commands.cp = function (args) {
  if (args.length < 2) return fail('cp: missing destination file operand');
  var src = _resolve(args[0]), dst = _resolve(args[1]);
  if (!_exists(src)) return fail('cp: cannot stat \'' + args[0] + '\': No such file or directory');
  if (_isDir(src)) return fail('cp: -r not specified; omitting directory \'' + args[0] + '\'');
  if (_isDir(dst)) dst = dst + '/' + _base(src);
  if (!canWritePath(_parent(dst)) || (_exists(dst) && vfs[dst].readOnly)) return fail('cp: cannot create regular file \'' + args[1] + '\': Permission denied');
  var cpParentError = ensureParentDirectory(dst, args[1], 'cp');
  if (cpParentError) return fail(cpParentError);
  vfs[dst] = _cloneFileNode(vfs[src]);
  vfs[dst].mt = new Date();
  _addChild(_parent(dst), _base(dst));
  return '';
};

commands.mv = function (args) {
  if (args.length < 2) return fail('mv: missing destination file operand');
  var src = _resolve(args[0]), dst = _resolve(args[1]);
  if (!_exists(src)) return fail('mv: cannot stat \'' + args[0] + '\': No such file or directory');
  if (_isDir(dst)) dst = dst + '/' + _base(src);
  if (!canWritePath(src) || !canWritePath(_parent(dst)) || vfs[src].readOnly || (_exists(dst) && vfs[dst].readOnly)) return fail('mv: cannot move \'' + args[0] + '\': Permission denied');
  var mvParentError = ensureParentDirectory(dst, args[1], 'mv');
  if (mvParentError) return fail(mvParentError);
  vfs[dst] = vfs[src];
  var pp = _parent(src), nm = _base(src);
  vfs[dst].mt = new Date();
  delete vfs[src];
  _removeChild(pp, nm);
  _addChild(_parent(dst), _base(dst));
  return '';
};

commands.tree = function (args) {
  var target = args.length ? _resolve(args[0]) : cwd;
  if (!_exists(target)) return fail('tree: \'' + (args[0]||'.') + '\': No such file or directory');
  if (!_isDir(target)) return htmlResult('<pre class="tree-output">' + renderNameHtml(_base(target), target, vfs[target], 'tree') + '</pre>');
  var lines = [_base(target) === _base(cwd) && !args.length ? '.' : (args[0]||'.')];
  _treeBuild(target, '', lines);
  return htmlResult('<pre class="tree-output">' + lines.join('\n') + '</pre>');
};
function _treeBuild(path, prefix, lines) {
  var entries = vfs[path].ch.slice().sort();
  for (var i = 0; i < entries.length; i++) {
    var last = i === entries.length - 1;
    var connector = last ? '`-- ' : '|-- ';
    var fp = (path === '/' ? '' : path) + '/' + entries[i];
    lines.push('<span class="tree-branch">' + esc(prefix + connector) + '</span>' + renderNameHtml(entries[i], fp, vfs[fp], 'tree'));
    if (_isDir(fp)) {
      _treeBuild(fp, prefix + (last ? '    ' : '|   '), lines);
    }
  }
}

commands.find = function (args) {
  var searchPath = cwd, pattern = null;
  for (var i = 0; i < args.length; i++) {
    if (args[i] === '-name' && i + 1 < args.length) { pattern = args[++i]; }
    else if (!pattern && args[i].charAt(0) !== '-') { searchPath = _resolve(args[i]); }
  }
  if (!_exists(searchPath)) return fail('find: \'' + args[0] + '\': No such file or directory');
  var results = [];
  _findRecursive(searchPath, pattern, results);
  return results.join('\n') || '';
};
function _findRecursive(path, pattern, results) {
  var name = _base(path);
  if (!pattern || _globMatch(name, pattern)) {
    var display = path;
    if (display.indexOf(cwd) === 0) display = '.' + display.slice(cwd.length);
    results.push(display);
  }
  if (_isDir(path)) {
    var ch = vfs[path].ch.slice().sort();
    for (var i = 0; i < ch.length; i++) {
      _findRecursive((path === '/' ? '' : path) + '/' + ch[i], pattern, results);
    }
  }
}
function _globMatch(name, pattern) {
  var regex = '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$';
  return new RegExp(regex, 'i').test(name);
}

commands.file = function (args) {
  if (!args.length) return fail('file: missing operand');
  var p = _resolve(args[0]);
  if (!_exists(p)) return fail(args[0] + ': cannot open (No such file or directory)');
  return args[0] + ': ' + describeFileType(p);
};

commands.stat = function (args) {
  if (!args.length) return fail('stat: missing operand');
  var p = _resolve(args[0]);
  if (!_exists(p)) return fail('stat: cannot statx \'' + args[0] + '\': No such file or directory');
  var n = vfs[p];
  var size = n.type === 'd' ? 4096 : (n.sz||0);
  var lines = [
    '  File: ' + args[0],
    '  Size: ' + size + '\tBlocks: ' + Math.ceil((size || 1)/512) + '\tIO Block: 4096\t' + (n.type==='d'?'directory':'regular file'),
    'Access: (' + n.mode + '/' + _permString(n) + ')\tUid: ( 1000/  '+USER+')\tGid: ( 1000/  '+USER+')',
    'Modify: ' + n.mt.toISOString(),
    'Change: ' + n.mt.toISOString()
  ];
  return lines.join('\n');
};

commands.echo = function (args) { return args.join(' '); };

commands.rev = function (args, stdin) {
  var text = stdin || args.join(' ');
  if (!text) return '';
  return text.split('\n').map(function (l) { return l.split('').reverse().join(''); }).join('\n');
};

commands.sort = function (args, stdin) {
  var text = stdin;
  if (!text && args.length) {
    var p = _resolve(args[0]);
    if (!_exists(p) || _isDir(p)) return fail('sort: cannot read: ' + args[0]);
    text = vfs[p].data || '';
  }
  if (!text) return '';
  return text.split('\n').sort().join('\n');
};

commands.uniq = function (args, stdin) {
  var text = stdin;
  if (!text && args.length) {
    var p = _resolve(args[0]);
    if (!_exists(p) || _isDir(p)) return fail('uniq: cannot read: ' + args[0]);
    text = vfs[p].data || '';
  }
  if (!text) return '';
  var lines = text.split('\n'), out = [lines[0]];
  for (var i = 1; i < lines.length; i++) {
    if (lines[i] !== lines[i-1]) out.push(lines[i]);
  }
  return out.join('\n');
};

commands.whoami = function () { return USER; };
commands.hostname = function () { return HOST; };

commands.uname = function (args) {
  var parsed = parseFlags(args);
  if (parsed.flags.a) return 'SuryaOS portfolio 3.1.0-web #1 SMP x86_64 WebAssembly';
  if (parsed.flags.r) return '3.1.0-web';
  if (parsed.flags.n) return HOST;
  if (parsed.flags.m) return 'x86_64';
  return 'SuryaOS';
};

commands.date = function () { return new Date().toString(); };

commands.uptime = function () {
  var diff = Math.floor((Date.now() - sessionStart) / 1000);
  var h = Math.floor(diff / 3600), m = Math.floor((diff % 3600) / 60), s = diff % 60;
  var upStr = h > 0 ? h + 'h ' + m + 'min' : m + ' min, ' + s + ' sec';
  return ' ' + new Date().toLocaleTimeString() + ' up ' + upStr + ',  1 user,  load average: 0.08, 0.03, 0.01';
};

commands.id = function () {
  return 'uid=1000(' + USER + ') gid=1000(' + USER + ') groups=1000(' + USER + '),27(sudo),1001(developers)';
};
commands.groups = function () { return USER + ' : ' + USER + ' sudo developers'; };

commands.df = function (args) {
  var parsed = parseFlags(args);
  var h = parsed.flags.h;
  var lines = [
    rpad('Filesystem', 16) + pad(h ? 'Size' : '1K-blocks', 10) + pad('Used', 8) + pad('Avail', 8) + pad('Use%', 6) + ' Mounted on'
  ];
  lines.push(rpad('/dev/sda1', 16) + pad(h ? '20G' : '20971520', 10) + pad(h ? '3.2G' : '3355443', 8) + pad(h ? '16G' : '16777216', 8) + pad('17%', 6) + ' /');
  lines.push(rpad('tmpfs', 16) + pad(h ? '512M' : '524288', 10) + pad(h ? '0' : '0', 8) + pad(h ? '512M' : '524288', 8) + pad('0%', 6) + ' /tmp');
  return lines.join('\n');
};

commands.free = function (args) {
  var parsed = parseFlags(args);
  var h = parsed.flags.h;
  var lines = [
    rpad('', 16) + pad('total', 12) + pad('used', 12) + pad('free', 12) + pad('shared', 12) + pad('buff/cache', 12) + pad('available', 12)
  ];
  lines.push(rpad('Mem:', 16) + pad(h?'8.0Gi':'8388608', 12) + pad(h?'2.1Gi':'2202009', 12) + pad(h?'4.2Gi':'4404019', 12) + pad(h?'256Mi':'262144', 12) + pad(h?'1.7Gi':'1782579', 12) + pad(h?'5.4Gi':'5662310', 12));
  lines.push(rpad('Swap:', 16) + pad(h?'2.0Gi':'2097152', 12) + pad(h?'0B':'0', 12) + pad(h?'2.0Gi':'2097152', 12));
  return lines.join('\n');
};

commands.ps = function () {
  var lines = [
    rpad('USER', 8) + pad('PID', 6) + pad('%CPU', 6) + pad('%MEM', 6) + pad('VSZ', 8) + pad('RSS', 6) + ' ' + rpad('TTY', 6) + rpad('STAT', 5) + rpad('START', 8) + rpad('TIME', 6) + 'COMMAND'
  ];
  var start = new Date(sessionStart).toLocaleTimeString().slice(0,5);
  lines.push(rpad(USER, 8) + pad('1', 6) + pad('0.0', 6) + pad('0.1', 6) + pad('21032', 8) + pad('4096', 6) + ' ' + rpad('pts/0', 6) + rpad('Ss', 5) + rpad(start, 8) + rpad('0:00', 6) + '/bin/bash');
  lines.push(rpad(USER, 8) + pad('42', 6) + pad('0.1', 6) + pad('0.2', 6) + pad('51200', 8) + pad('8192', 6) + ' ' + rpad('pts/0', 6) + rpad('S+', 5) + rpad(start, 8) + rpad('0:01', 6) + 'animation.js');
  if (vimState.open) lines.push(rpad(USER, 8) + pad('73', 6) + pad('0.0', 6) + pad('0.3', 6) + pad('12800', 8) + pad('6144', 6) + ' ' + rpad('pts/0', 6) + rpad('S+', 5) + rpad(start, 8) + rpad('0:00', 6) + 'vim ' + vimState.displayPath);
  lines.push(rpad(USER, 8) + pad('87', 6) + pad('0.0', 6) + pad('0.0', 6) + pad('7892', 8) + pad('2048', 6) + ' ' + rpad('pts/0', 6) + rpad('R+', 5) + rpad(start, 8) + rpad('0:00', 6) + 'ps aux');
  return lines.join('\n');
};

commands.clear = function () {
  outputEl.innerHTML = '';
  removeProjectPreviewOverlay();
  if (!_headerCleared) {
    _headerCleared = document.createElement('style');
    _headerCleared.textContent = '.header::before{content:none!important}';
    document.head.appendChild(_headerCleared);
  }
  return '';
};

commands.exit = function () {
  var w = window.open('', '_self');
  w.close();
  if (!w.closed) window.location = '/';
  return '';
};

commands.history = function (args) {
  if (args[0] === '-c') { hist.length = 0; syncHistoryFile(); return ''; }
  var lines = [];
  for (var i = 0; i < hist.length; i++) lines.push(pad(i + 1, 5) + '  ' + hist[i]);
  return lines.join('\n');
};

commands.alias = function (args) {
  if (!args.length) {
    var lines = [];
    for (var k in aliases) lines.push('alias ' + k + '=\'' + aliases[k] + '\'');
    return lines.join('\n');
  }
  var eq = args.join(' ');
  var eqIdx = eq.indexOf('=');
  if (eqIdx < 1) return fail('alias: usage: alias name=value');
  var name = eq.slice(0, eqIdx), val = eq.slice(eqIdx + 1).replace(/^['"]|['"]$/g, '');
  aliases[name] = val;
  return '';
};

commands.unalias = function (args) {
  if (!args.length) return fail('unalias: usage: unalias name');
  if (!aliases[args[0]]) return fail('bash: unalias: ' + args[0] + ': not found');
  delete aliases[args[0]];
  return '';
};

commands.export = function (args) {
  if (!args.length) {
    var lines = [];
    for (var k in envVars) lines.push('declare -x ' + k + '="' + envVars[k] + '"');
    return lines.join('\n');
  }
  var expr = args.join(' '), eqIdx = expr.indexOf('=');
  if (eqIdx < 1) return fail('export: usage: export VAR=value');
  envVars[expr.slice(0, eqIdx)] = expr.slice(eqIdx + 1);
  return '';
};

commands.env = function () {
  var lines = [];
  for (var k in envVars) lines.push(k + '=' + envVars[k]);
  return lines.join('\n');
};

commands.which = function (args) {
  if (!args.length) return fail('which: missing operand');
  if (args[0].indexOf('/') > -1) {
    var rp = _resolve(args[0]);
    if (_isFile(rp) && _isExecutable(vfs[rp])) return rp;
    return fail('which: no ' + args[0] + ' in (' + envVars.PATH + ')', 1);
  }
  var path = getCommandPath(args[0]);
  if (path) return path;
  return fail('which: no ' + args[0] + ' in (' + envVars.PATH + ')', 1);
};

commands.type = function (args) {
  if (!args.length) return fail('type: missing operand');
  var c = args[0];
  if (aliases[c]) return c + ' is aliased to \'' + aliases[c] + '\'';
  if (shellBuiltins[c]) return c + ' is a shell built-in';
  if (c.indexOf('/') > -1) {
    var rp = _resolve(c);
    if (_isFile(rp) && _isExecutable(vfs[rp])) return c + ' is ' + rp;
  }
  var path = getCommandPath(c);
  if (path) return c + ' is ' + path;
  if (commands[c]) return c + ' is a shell command';
  return fail('bash: type: ' + c + ': not found');
};

commands.man = function (args) {
  if (!args.length) return fail('What manual page do you want?\nFor example, try \'man ls\'.');
  var page = manPages[args[0]];
  if (!page) return fail('No manual entry for ' + args[0]);
  return args[0].toUpperCase() + '(1)\n\nNAME\n    ' + page;
};

commands.help = function () {
  var sections = [
    ['Portfolio', './about  ./projects  ./resume  open'],
    ['Filesystem', 'ls  cd  pwd  cat  head  tail  mkdir  touch  rm  rmdir  cp  mv  tree  find  file  stat  chmod'],
    ['Text', 'echo  grep  wc  rev  sort  uniq'],
    ['System', 'whoami  hostname  uname  date  uptime  id  groups  df  free  ps'],
    ['Shell', 'help  man  history  clear  exit  alias  unalias  export  env  which  type'],
    ['Editor', 'vim'],
    ['Fun', 'neofetch  cowsay  fortune  cal  factor  sudo']
  ];
  var labels = sections.map(function (section) { return section[0]; });
  labels = labels.concat(['Chaining', 'Piping', 'History', 'Open targets', 'Vim']);

  var labelWidth = 0;
  for (var li = 0; li < labels.length; li++) {
    var width = labels[li].length + 1;
    if (width > labelWidth) labelWidth = width;
  }

  function row(label, value) {
    return '  ' + rpad(label + ':', labelWidth) + '  ' + value;
  }

  function shortcutCell(key, action) {
    return rpad(key, 8) + ' ' + rpad(action, 12);
  }

  var lines = ['', '  Available commands:', ''];
  for (var i = 0; i < sections.length; i++) {
    lines.push(row(sections[i][0], sections[i][1]));
  }

  lines.push('');
  lines.push('  Shortcuts:');
  lines.push('    ' + shortcutCell('Ctrl+C', 'Interrupt') + '  ' + shortcutCell('Ctrl+L', 'Clear screen') + '  ' + shortcutCell('Ctrl+U', 'Clear line'));
  lines.push('    ' + shortcutCell('Ctrl+W', 'Delete word') + '  ' + shortcutCell('Ctrl+A', 'Cursor start') + '  ' + shortcutCell('Ctrl+E', 'Cursor end'));
  lines.push('    ' + shortcutCell('Ctrl+D', 'Exit') + '  ' + shortcutCell('Tab', 'Autocomplete') + '  ' + shortcutCell('Up/Down', 'History'));

  lines.push('');
  lines.push(row('Chaining', 'cmd1 ; cmd2    cmd1 && cmd2    cmd1 || cmd2'));
  lines.push(row('Piping', 'cmd1 | cmd2'));
  lines.push(row('History', '!! (repeat last)    !n (repeat nth)'));

  var targets = getOpenOptionNames();
  if (targets.length) {
    var chunkSize = 6;
    lines.push(row('Open targets', targets.slice(0, chunkSize).join(', ')));
    for (var t = chunkSize; t < targets.length; t += chunkSize) {
      lines.push('  ' + rpad('', labelWidth) + '  ' + targets.slice(t, t + chunkSize).join(', '));
    }
  } else {
    lines.push(row('Open targets', 'none'));
  }

  lines.push(row('Vim', 'i insert, Esc normal, :w save, :q quit, dd delete line'));
  lines.push("  Use 'man <command>' for detailed usage.");
  lines.push('');
  return lines.join('\n');
};

commands.open = async function (args) {
  if (!args.length) return fail('open: missing operand');
  var name = args[0];

  await ensureFileLinks();

  var url = fileLinks[name];
  if (url) {
    window.open(url, '_blank');
    return 'Opening ' + name + '...';
  }

  var p = _resolve(name);
  if (_exists(p) && _isFile(p)) {
    var section = extractSectionFromScript(vfs[p].data);
    if (section) {
      var sectionUrl = fileLinks[section] || routeMap[section];
      if (sectionUrl) {
        window.open(sectionUrl, '_blank');
        return 'Opening ' + section + '...';
      }
    }
  }

  return fail('open: ' + name + ': No such file or link\nAvailable: ' + getOpenOptionsSummary());
};

commands.section = async function (args) {
  if (!args.length) return fail('section: missing operand');
  var section = normalizeSectionName(args[0]);
  if (!routeMap[section]) return fail('section: ' + section + ': unknown portfolio section');
  try {
    var res = await fetch('https://pages.surya-ops.workers.dev/?section=' + section);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return htmlResult(cleanFetchedHTML(await res.text()), 'html-content');
  } catch (e) {
    return fail('section: ' + section + ': Error loading section');
  }
};

commands.builtin = function (args, stdin) {
  if (!args.length) return fail('builtin: usage: builtin <command>');
  if (args[0] === 'builtin') return fail('builtin: recursion detected');
  if (!commands[args[0]]) return fail('builtin: ' + args[0] + ': not found');
  return commands[args[0]](args.slice(1), stdin);
};

commands.sudo = function (args) {
  if (!args.length) return fail('usage: sudo <command>');
  if (args.join(' ').indexOf('rm -rf /') > -1) {
    print('[sudo] password for ' + USER + ': ');
    print('Removing /boot... done');
    print('Removing /home... done');
    print('Removing /usr... done');
    print('Just kidding. Nice try though.');
    return '';
  }
  return fail(USER + ' is not in the sudoers file. This incident will be reported.');
};

commands.neofetch = function () {
  var diff = Math.floor((Date.now() - sessionStart) / 1000);
  var h = Math.floor(diff / 3600), m = Math.floor((diff % 3600) / 60);
  var upStr = h > 0 ? h + 'h ' + m + 'm' : m + ' min';
  var logo = [
    '        _____   _____  ',
    '       / ____| |  __ \\ ',
    '      | (___   | |__) |',
    '       \\___|  \\   \\ \  ',
    '       ____) | | | \\ \\ ',
    '      |_____/  |_|  \\_\\'
  ];
  var info = [
    USER + '@' + HOST,
    '------------------',
    'OS: SuryaOS 3.1 (Web)',
    'Host: ' + HOST,
    'Kernel: 3.1.0-web',
    'Uptime: ' + upStr,
    'Shell: bash 5.2',
    'Terminal: ' + envVars.TERM,
    'CPU: WebAssembly @ infGHz',
    'Memory: Dynamic'
  ];
  var logoWidth = 0;
  for (var j = 0; j < logo.length; j++) {
    if (logo[j].length > logoWidth) logoWidth = logo[j].length;
  }
  var lines = [];
  var max = Math.max(logo.length, info.length);
  for (var i = 0; i < max; i++) {
    var left = i < logo.length ? rpad(logo[i], logoWidth) : rpad('', logoWidth);
    var right = i < info.length ? info[i] : '';
    lines.push(left + '   ' + right);
  }
  return lines.join('\n');
};

commands.cowsay = function (args) {
  var text = args.length ? args.join(' ') : 'Moo!';
  var border = ' ' + Array(text.length + 2).fill('_').join('');
  var bottom = ' ' + Array(text.length + 2).fill('-').join('');
  return border + '\n< ' + text + ' >\n' + bottom + '\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||';
};

commands.fortune = function () {
  var quotes = [
    '"The only way to do great work is to love what you do." — Steve Jobs',
    '"Innovation distinguishes between a leader and a follower." — Steve Jobs',
    '"Code is like humor. When you have to explain it, it\'s bad." — Cory House',
    '"First, solve the problem. Then, write the code." — John Johnson',
    '"Simplicity is the soul of efficiency." — Austin Freeman',
    '"Talk is cheap. Show me the code." — Linus Torvalds',
    '"Any fool can write code that a computer can understand. Good programmers write code that humans can understand." — Martin Fowler',
    '"The best error message is the one that never shows up." — Thomas Fuchs',
    '"Make it work, make it right, make it fast." — Kent Beck',
    '"Programs must be written for people to read, and only incidentally for machines to execute." — Harold Abelson'
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
};

commands.cal = function () {
  var now = new Date();
  var year = now.getFullYear(), month = now.getMonth();
  var names = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var title = names[month] + ' ' + year;
  var padTitle = '';
  var totalWidth = 20;
  var leftPad = Math.floor((totalWidth - title.length) / 2);
  for (var p = 0; p < leftPad; p++) padTitle += ' ';
  padTitle += title;
  var header = 'Su Mo Tu We Th Fr Sa';
  var firstDay = new Date(year, month, 1).getDay();
  var daysInMonth = new Date(year, month + 1, 0).getDate();
  var today = now.getDate();
  var lines = [padTitle, header];
  var line = '';
  for (var s = 0; s < firstDay; s++) line += '   ';
  for (var d = 1; d <= daysInMonth; d++) {
    var ds = d < 10 ? ' ' + d : '' + d;
    line += ds;
    if ((firstDay + d) % 7 === 0) {
      lines.push(line);
      line = '';
    } else {
      line += ' ';
    }
  }
  if (line.trim()) lines.push(line);
  return lines.join('\n');
};

commands.factor = function (args) {
  if (!args.length) return fail('factor: missing operand');
  var n = parseInt(args[0]);
  if (isNaN(n) || n < 2) return fail('factor: \'' + args[0] + '\' is not a valid positive integer');
  var factors = [], orig = n;
  for (var d = 2; d * d <= n; d++) {
    while (n % d === 0) { factors.push(d); n /= d; }
  }
  if (n > 1) factors.push(n);
  return orig + ': ' + factors.join(' ');
};

function applyChmodSpec(node, spec) {
  if (/^[0-7]{3,4}$/.test(spec)) { _setMode(node, spec); return true; }
  var clauses = spec.split(',');
  var modeValue = _modeValue(node.mode);
  for (var i = 0; i < clauses.length; i++) {
    var match = /^([ugoa]*)([+=-])([rwx]+)$/.exec(clauses[i]);
    if (!match) return false;
    var who = match[1] || 'a';
    var op = match[2];
    var perms = match[3];
    var targets = who.indexOf('a') > -1 ? ['u','g','o'] : who.split('');
    var permissionMask = 0;
    for (var t = 0; t < targets.length; t++) {
      var target = targets[t];
      for (var p = 0; p < perms.length; p++) {
        if (target === 'u' && perms[p] === 'r') permissionMask |= 0o400;
        if (target === 'u' && perms[p] === 'w') permissionMask |= 0o200;
        if (target === 'u' && perms[p] === 'x') permissionMask |= 0o100;
        if (target === 'g' && perms[p] === 'r') permissionMask |= 0o040;
        if (target === 'g' && perms[p] === 'w') permissionMask |= 0o020;
        if (target === 'g' && perms[p] === 'x') permissionMask |= 0o010;
        if (target === 'o' && perms[p] === 'r') permissionMask |= 0o004;
        if (target === 'o' && perms[p] === 'w') permissionMask |= 0o002;
        if (target === 'o' && perms[p] === 'x') permissionMask |= 0o001;
      }
    }
    if (op === '+') modeValue |= permissionMask;
    if (op === '-') modeValue &= ~permissionMask;
    if (op === '=') {
      var clearMask = 0;
      for (var c = 0; c < targets.length; c++) {
        if (targets[c] === 'u') clearMask |= 0o700;
        if (targets[c] === 'g') clearMask |= 0o070;
        if (targets[c] === 'o') clearMask |= 0o007;
      }
      modeValue = (modeValue & ~clearMask) | permissionMask;
    }
  }
  _setMode(node, modeValue.toString(8));
  return true;
}

commands.vim  = function (args) { return openVim(args[0] || ''); };
commands.apt  = function () { return fail('apt: package manager not available in this web terminal.'); };
commands.brew = commands.apt;
commands.pip  = commands.apt;
commands.npm  = commands.apt;
commands.wget = function () { return fail('wget: disabled in this terminal.'); };
commands.ssh  = function () { return fail('ssh: network access restricted in this terminal.'); };
commands.chmod = function (args) {
  if (args.length < 2) return fail('chmod: missing operand');
  var spec = args[0], path = _resolve(args[1]);
  if (!_exists(path)) return fail('chmod: cannot access \'' + args[1] + '\': No such file or directory');
  if (!canWritePath(path) || vfs[path].readOnly) return fail('chmod: changing permissions of \'' + args[1] + '\': Permission denied');
  if (!applyChmodSpec(vfs[path], spec)) return fail('chmod: invalid mode: \'' + spec + '\'');
  vfs[path].mt = new Date();
  return '';
};
commands.chown = function () { return fail('chown: ownership is fixed in this simulated filesystem.'); };
commands.su   = function () { return fail('su: authentication failure'); };
commands.top  = function () { return commands.ps(); };
commands.htop = commands.top;
commands.sl   = function () {
  return '  ====        ________\n _D _|  |_______/        \\__I_I_____===__\n  |(_)---  |   H\\________/ |   |\n  /     |  |   H  |  |     |   |\n |      |  |   H  |__--------------------|\n | ________|___H__/__|_____/[][]~\\_______|\n |/ |   |-----------I_____I [][] []  D   |\n\n You meant \'ls\', didn\'t you?';
};

function tokenize(line) {
  var tokens = [], cur = '', inS = false, inD = false, esc = false;
  for (var i = 0; i < line.length; i++) {
    var ch = line.charAt(i);
    if (esc) { cur += ch; esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === '\'' && !inD) { inS = !inS; continue; }
    if (ch === '"' && !inS)  { inD = !inD; continue; }
    if (ch === ' ' && !inS && !inD) {
      if (cur) { tokens.push(cur); cur = ''; }
      continue;
    }
    cur += ch;
  }
  if (cur) tokens.push(cur);
  return tokens;
}

function splitOutsideQuotes(line, delim) {
  var parts = [], cur = '', inS = false, inD = false;
  for (var i = 0; i < line.length; i++) {
    var ch = line.charAt(i);
    if (ch === '\'' && !inD) { inS = !inS; cur += ch; continue; }
    if (ch === '"' && !inS)  { inD = !inD; cur += ch; continue; }
    if (!inS && !inD && line.substr(i, delim.length) === delim) {
      parts.push(cur);
      cur = '';
      i += delim.length - 1;
      continue;
    }
    cur += ch;
  }
  parts.push(cur);
  return parts;
}

function expandScriptLine(line, scriptPath, args) {
  var expandedArgs = args.map(shellEscape).join(' ');
  var out = line.replace(/\$0/g, shellEscape(scriptPath));
  out = out.replace(/"\$@"/g, expandedArgs);
  out = out.replace(/\$@/g, expandedArgs);
  out = out.replace(/\$(\d+)/g, function (_, index) {
    return shellEscape(args[parseInt(index, 10) - 1] || '');
  });
  return out;
}

async function executeFile(path, args, stdin, rawCommand) {
  if (!_exists(path)) {
    printError('bash: ' + rawCommand + ': No such file or directory');
    exitCode = 127;
    return;
  }
  if (_isDir(path)) {
    printError('bash: ' + rawCommand + ': Is a directory');
    exitCode = 126;
    return;
  }
  if (!_isExecutable(vfs[path])) {
    printError('bash: ' + rawCommand + ': Permission denied');
    exitCode = 126;
    return;
  }
  var lines = (vfs[path].data || '').split(/\r?\n/);
  for (var i = 0; i < lines.length; i++) {
    if (i === 0 && /^#!\s*\S+/.test(lines[i])) continue;
    if (!lines[i].trim() || /^\s*#/.test(lines[i])) continue;
    await execute(expandScriptLine(lines[i], path, args));
    if (exitCode !== 0) return;
  }
}

async function execute(line) {
  line = line.trim();
  if (!line) return;

  if (line === '!!') {
    if (hist.length < 1) { printError('bash: !!: event not found'); exitCode = 1; return; }
    line = hist[hist.length - 1];
    print(line, 'term-dim');
  } else if (/^!(\d+)$/.test(line)) {
    var n = parseInt(line.slice(1));
    if (n < 1 || n > hist.length) { printError('bash: ' + line + ': event not found'); exitCode = 1; return; }
    line = hist[n - 1];
    print(line, 'term-dim');
  }

  var firstSpace = line.indexOf(' ');
  var firstWord = firstSpace > -1 ? line.slice(0, firstSpace) : line;
  if (aliases[firstWord]) {
    line = aliases[firstWord] + (firstSpace > -1 ? line.slice(firstSpace) : '');
  }

  var semiParts = splitOutsideQuotes(line, ';');
  if (semiParts.length > 1) {
    for (var si = 0; si < semiParts.length; si++) await execute(semiParts[si]);
    return;
  }

  var andParts = splitOutsideQuotes(line, '&&');
  if (andParts.length > 1) {
    for (var ai = 0; ai < andParts.length; ai++) {
      await execute(andParts[ai]);
      if (exitCode !== 0) return;
    }
    return;
  }

  var orParts = splitOutsideQuotes(line, '||');
  if (orParts.length > 1) {
    for (var oi = 0; oi < orParts.length; oi++) {
      await execute(orParts[oi]);
      if (exitCode === 0) return;
    }
    return;
  }

  line = line.trim();
  if (!line) return;

  line = line.replace(/\$(\w+)/g, function (m, v) { return envVars[v] || ''; });

  var pipeParts = splitOutsideQuotes(line, '|');
  if (pipeParts.length > 1) {
    var pipeStdin = null;
    for (var pi = 0; pi < pipeParts.length; pi++) {
      var seg = pipeParts[pi].trim();
      if (!seg) continue;
      var isLast = pi === pipeParts.length - 1;
      if (!isLast) captureMode = true;
      captureBuffer = '';
      await runSingle(seg, pipeStdin);
      if (!isLast) {
        captureMode = false;
        pipeStdin = captureBuffer;
      }
    }
    captureMode = false;
    return;
  }

  await runSingle(line, null);
}

async function runSingle(line, stdin) {
  var tokens = tokenize(line);
  if (!tokens.length) return;
  var cmd = tokens[0], args = tokens.slice(1);

  if (cmd.indexOf('=') > 0 && /^[A-Za-z_]\w*=/.test(cmd)) {
    var eqI = cmd.indexOf('=');
    envVars[cmd.slice(0, eqI)] = cmd.slice(eqI + 1);
    exitCode = 0;
    return;
  }

  exitCode = 0;

  if (!commands[cmd]) {
    if (cmd.indexOf('/') > -1) {
      await executeFile(_resolve(cmd), args, stdin, cmd);
      return;
    }
    var commandPath = getCommandPath(cmd);
    if (commandPath) {
      await executeFile(commandPath, args, stdin, cmd);
      return;
    }
    printError('bash: ' + cmd + ': command not found');
    var suggest = closestCmd(cmd);
    if (suggest) print('Command \'' + cmd + '\' not found, did you mean \'' + suggest + '\'?', 'term-dim');
    exitCode = 127;
    return;
  }

  try {
    var result = commands[cmd](args, stdin);
    if (result instanceof Promise) result = await result;
    renderResult(result);
  } catch (e) {
    printError('bash: ' + cmd + ': ' + (e.message || 'unknown error'));
    exitCode = 1;
  }
}

function tabComplete() {
  var val = inputEl.value;
  var cursor = inputEl.selectionStart;
  var before = val.slice(0, cursor);
  var after = val.slice(cursor);
  var tokens = before.split(/\s+/);
  var completing = tokens[tokens.length - 1] || '';
  var isCmd = tokens.length === 1 && !before.endsWith(' ');
  var pathLikeToken = /^(?:\.{1,2}(?:\/|$)|~(?:\/|$)|\/)/.test(completing);
  var completeAsCommand = !pathLikeToken && (isCmd || (tokens.length === 1 && completing && !before.includes(' ')));
  var firstToken = tokens[0] || '';
  var completingOpenTarget = !completeAsCommand && !pathLikeToken && firstToken === 'open' && tokens.length === 2;
  var matches;

  if (completeAsCommand) {
    var prefix = completing.toLowerCase();
    matches = availableCommandNames().filter(function (c) { return c.indexOf(prefix) === 0; });
    Object.keys(aliases).forEach(function (a) {
      if (a.indexOf(prefix) === 0 && matches.indexOf(a) < 0) matches.push(a);
    });
    matches.sort();
  } else if (completingOpenTarget) {
    ensureFileLinks();
    var openPrefix = completing.toLowerCase();
    matches = getOpenOptionNames().filter(function (n) { return n.toLowerCase().indexOf(openPrefix) === 0; });
  } else {
    matches = _completePath(completing);
  }

  if (!matches.length) return;

  if (matches.length === 1) {
    var completion = matches[0];
    if (completeAsCommand) {
      tokens[tokens.length - 1] = completion;
      var newVal = tokens.join(' ') + ' ';
      inputEl.value = newVal + after;
      inputEl.selectionStart = inputEl.selectionEnd = newVal.length;
    } else {
      tokens[tokens.length - 1] = completion;
      var resolved = _resolve(completion);
      var suffix = _isDir(resolved) ? '/' : ' ';
      var joined = tokens.join(' ') + suffix;
      inputEl.value = joined + after;
      inputEl.selectionStart = inputEl.selectionEnd = joined.length;
    }
  } else {
    var matchDiv = document.createElement('div');
    matchDiv.className = 'tab-completions';
    matches.forEach(function (m) {
      var span = document.createElement('span');
      span.textContent = m;
      if (!completeAsCommand) {
        var rp = _resolve(m);
        if (_isDir(rp)) { span.textContent += '/'; span.classList.add('ls-dir'); }
        else if (_isFile(rp) && _isExecutable(vfs[rp])) { span.classList.add('ls-exec'); }
      }
      matchDiv.appendChild(span);
    });
    outputEl.appendChild(matchDiv);

    var common = _commonPrefix(matches);
    if (common.length > completing.length) {
      tokens[tokens.length - 1] = common;
      inputEl.value = tokens.join(' ') + after;
      inputEl.selectionStart = inputEl.selectionEnd = tokens.join(' ').length;
    }

    printPrompt(inputEl.value);
    scroll();
  }
}

function _completePath(partial) {
  var dirPath, prefix;
  if (partial.indexOf('/') > -1) {
    var lastSlash = partial.lastIndexOf('/');
    dirPath = _resolve(partial.slice(0, lastSlash + 1) || '/');
    prefix = partial.slice(lastSlash + 1);
  } else {
    dirPath = cwd;
    prefix = partial;
  }
  if (!_isDir(dirPath)) return [];
  return vfs[dirPath].ch.filter(function (c) {
    return c.indexOf(prefix) === 0;
  }).map(function (c) {
    return partial.indexOf('/') > -1
      ? partial.slice(0, partial.lastIndexOf('/') + 1) + c
      : c;
  });
}

function _commonPrefix(arr) {
  if (!arr.length) return '';
  var p = arr[0];
  for (var i = 1; i < arr.length; i++) {
    while (arr[i].indexOf(p) !== 0) p = p.slice(0, -1);
  }
  return p;
}

function countLines(text) {
  return Math.max(1, (text || '').split('\n').length);
}
function isVimOpen() { return !!vimState.open; }
function updateVimGutter() {
  if (!vimGutterEl) return;
  var total = countLines(vimBufferEl.value);
  var lines = [];
  for (var i = 1; i <= total; i++) lines.push(i);
  vimGutterEl.textContent = lines.join('\n');
}
function getCaretLineCol(text, index) {
  var safe = Math.max(0, Math.min(index, text.length));
  var line = 0, lastBreak = -1;
  for (var i = 0; i < safe; i++) {
    if (text.charAt(i) === '\n') { line++; lastBreak = i; }
  }
  return { line: line, col: safe - lastBreak - 1 };
}
function getIndexForLineCol(text, line, col) {
  var lines = text.split('\n');
  var targetLine = Math.max(0, Math.min(line, lines.length - 1));
  var index = 0;
  for (var i = 0; i < targetLine; i++) index += lines[i].length + 1;
  return index + Math.min(Math.max(col, 0), lines[targetLine].length);
}
function setVimCaret(index) {
  var bounded = Math.max(0, Math.min(index, vimBufferEl.value.length));
  vimBufferEl.selectionStart = vimBufferEl.selectionEnd = bounded;
  updateVimStatus();
}
function getCurrentLineRange() {
  var value = vimBufferEl.value;
  var index = vimBufferEl.selectionStart;
  var start = value.lastIndexOf('\n', Math.max(0, index - 1));
  start = start === -1 ? 0 : start + 1;
  var end = value.indexOf('\n', index);
  if (end === -1) end = value.length;
  return { start: start, end: end };
}
function updateVimStatus() {
  if (!isVimOpen()) return;
  var caret = getCaretLineCol(vimBufferEl.value, vimBufferEl.selectionStart);
  var left = '';
  if (vimState.mode === 'insert') left = '-- INSERT --';
  else if (vimState.mode === 'command') left = ':' + vimState.command;
  else if (vimState.pending) left = vimState.pending;
  else left = vimState.lastMessage || 'NORMAL';
  vimStatusLeftEl.textContent = left;
  vimStatusRightEl.textContent = vimState.displayPath + (vimState.dirty ? ' [+]' : '') + '  Ln ' + (caret.line + 1) + ', Col ' + (caret.col + 1);
  vimTitleEl.textContent = 'vim ' + vimState.displayPath;
  vimShellEl.classList.toggle('vim-shell--dirty', vimState.dirty);
}
function setVimMode(mode) {
  vimState.mode = mode;
  if (mode !== 'command') vimState.command = '';
  vimBufferEl.readOnly = mode !== 'insert';
  vimModeLabelEl.textContent = mode.toUpperCase();
  vimShellEl.classList.toggle('vim-shell--insert', mode === 'insert');
  vimShellEl.classList.toggle('vim-shell--command', mode === 'command');
  updateVimStatus();
}
function ensureVimEditable() {
  if (!vimState.locked) return true;
  vimState.lastMessage = 'E45: readonly option is set';
  updateVimStatus();
  return false;
}
function applyVimBufferChange(nextValue, nextCaret) {
  vimBufferEl.value = nextValue;
  vimState.dirty = vimBufferEl.value !== vimState.original;
  updateVimGutter();
  setVimCaret(nextCaret);
}
function moveVimHorizontal(delta) {
  vimState.preferredCol = null;
  setVimCaret(vimBufferEl.selectionStart + delta);
}
function moveVimVertical(delta) {
  var info = getCaretLineCol(vimBufferEl.value, vimBufferEl.selectionStart);
  var preferred = vimState.preferredCol == null ? info.col : vimState.preferredCol;
  vimState.preferredCol = preferred;
  setVimCaret(getIndexForLineCol(vimBufferEl.value, info.line + delta, preferred));
}
function moveToLineBoundary(atEnd) {
  var info = getCaretLineCol(vimBufferEl.value, vimBufferEl.selectionStart);
  vimState.preferredCol = null;
  setVimCaret(getIndexForLineCol(vimBufferEl.value, info.line, atEnd ? Number.MAX_SAFE_INTEGER : 0));
}
function moveToFirstNonBlank() {
  var range = getCurrentLineRange();
  var lineText = vimBufferEl.value.slice(range.start, range.end);
  var match = /\S/.exec(lineText);
  setVimCaret(range.start + (match ? match.index : 0));
}
function deleteCharUnderCursor() {
  if (!ensureVimEditable()) return;
  var value = vimBufferEl.value;
  var index = vimBufferEl.selectionStart;
  if (index >= value.length) { vimState.lastMessage = 'Already at end of buffer'; updateVimStatus(); return; }
  applyVimBufferChange(value.slice(0, index) + value.slice(index + 1), index);
}
function deleteCurrentLine() {
  if (!ensureVimEditable()) return;
  var value = vimBufferEl.value;
  var range = getCurrentLineRange();
  var removeStart = range.start, removeEnd = range.end;
  if (value.charAt(removeEnd) === '\n') removeEnd++;
  else if (removeStart > 0) removeStart--;
  applyVimBufferChange(value.slice(0, removeStart) + value.slice(removeEnd), Math.min(removeStart, value.length));
  vimState.lastMessage = '1 line deleted';
}
function openLineBelow() {
  if (!ensureVimEditable()) return;
  var range = getCurrentLineRange();
  var value = vimBufferEl.value;
  applyVimBufferChange(value.slice(0, range.end) + '\n' + value.slice(range.end), range.end + 1);
  setVimMode('insert');
}
function openLineAbove() {
  if (!ensureVimEditable()) return;
  var range = getCurrentLineRange();
  var value = vimBufferEl.value;
  applyVimBufferChange(value.slice(0, range.start) + '\n' + value.slice(range.start), range.start);
  setVimMode('insert');
}
function saveVimBuffer(targetArg) {
  var savePath = targetArg ? _resolve(targetArg) : vimState.path;
  if (!savePath) { vimState.lastMessage = 'E32: No file name'; updateVimStatus(); return false; }
  if (_exists(savePath) && _isDir(savePath)) { vimState.lastMessage = 'E17: "' + savePath + '" is a directory'; updateVimStatus(); return false; }
  if (!_exists(_parent(savePath)) || !_isDir(_parent(savePath)) || !canWritePath(savePath) || (_exists(savePath) && vfs[savePath].readOnly)) {
    vimState.lastMessage = 'E212: Cannot open file for writing';
    updateVimStatus();
    return false;
  }
  var existing = _exists(savePath) ? vfs[savePath] : null;
  _updateFile(savePath, vimBufferEl.value, { mode: existing ? existing.mode : '0644', readOnly:false });
  vimState.path = savePath;
  vimState.displayPath = formatDisplayPath(savePath);
  vimState.original = vimBufferEl.value;
  vimState.dirty = false;
  vimState.locked = false;
  vimState.lastMessage = '"' + vimState.displayPath + '" ' + countLines(vimBufferEl.value) + 'L, ' + vimBufferEl.value.length + 'B written';
  updateVimStatus();
  return true;
}
function closeVim(force) {
  if (!force && vimState.dirty) {
    vimState.lastMessage = 'E37: No write since last change (add ! to override)';
    updateVimStatus();
    return false;
  }
  vimState.open = false;
  vimState.mode = 'normal';
  vimState.path = '';
  vimState.displayPath = '[No Name]';
  vimState.original = '';
  vimState.dirty = false;
  vimState.command = '';
  vimState.pending = '';
  vimState.locked = false;
  vimState.lastMessage = 'Press i to insert, :w to save, :q to quit';
  vimState.preferredCol = null;
  vimShellEl.classList.add('vim-hidden');
  vimShellEl.classList.remove('vim-shell--insert');
  vimShellEl.classList.remove('vim-shell--command');
  vimShellEl.classList.remove('vim-shell--dirty');
  vimShellEl.setAttribute('aria-hidden', 'true');
  inputEl.focus();
  return true;
}
function executeVimCommand() {
  var raw = vimState.command.trim();
  var parts = raw ? raw.split(/\s+/) : [];
  var cmd = parts[0] || '';
  var target = parts.slice(1).join(' ');
  if (!raw) { setVimMode('normal'); return; }
  if (cmd === 'q') { if (!closeVim(false)) setVimMode('normal'); return; }
  if (cmd === 'q!') { closeVim(true); return; }
  if (cmd === 'w') { saveVimBuffer(target); setVimMode('normal'); return; }
  if (cmd === 'wq' || cmd === 'x') { if (saveVimBuffer(target)) closeVim(true); else setVimMode('normal'); return; }
  if (cmd === 'help') { vimState.lastMessage = 'i insert | Esc normal | :w save | :q quit | dd delete line'; setVimMode('normal'); return; }
  vimState.lastMessage = 'Not an editor command: ' + raw;
  setVimMode('normal');
}
function openVim(target) {
  if (!vimShellEl || !vimBufferEl) return fail('vim: editor resources failed to initialize');
  var path = '';
  var initialContent = '';
  var locked = false;
  if (target) {
    path = _resolve(target);
    if (_exists(path) && _isDir(path)) return fail('vim: ' + target + ': Is a directory');
    if (_exists(path)) {
      initialContent = vfs[path].data || '';
      locked = !!vfs[path].readOnly;
    }
  }
  vimState.open = true;
  vimState.path = path;
  vimState.displayPath = path ? formatDisplayPath(path) : '[No Name]';
  vimState.original = initialContent;
  vimState.dirty = false;
  vimState.command = '';
  vimState.pending = '';
  vimState.locked = locked;
  vimState.lastMessage = locked ? 'readonly buffer' : 'Press i to insert, :w to save, :q to quit';
  vimState.preferredCol = null;
  vimBufferEl.value = initialContent;
  vimShellEl.classList.remove('vim-hidden');
  vimShellEl.setAttribute('aria-hidden', 'false');
  updateVimGutter();
  setVimMode('normal');
  setTimeout(function () {
    vimBufferEl.focus();
    setVimCaret(0);
  }, 0);
  return '';
}
function handleVimKeyDown(e) {
  if (!isVimOpen()) return;
  if (vimState.mode === 'insert') {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (vimBufferEl.selectionStart > 0) setVimCaret(vimBufferEl.selectionStart - 1);
      setVimMode('normal');
    }
    return;
  }
  e.preventDefault();
  if (vimState.mode === 'command') {
    if (e.key === 'Escape') { vimState.command = ''; setVimMode('normal'); return; }
    if (e.key === 'Backspace') { vimState.command = vimState.command.slice(0, -1); updateVimStatus(); return; }
    if (e.key === 'Enter') { executeVimCommand(); return; }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { vimState.command += e.key; updateVimStatus(); }
    return;
  }
  if (e.key === 'Escape') { vimState.pending = ''; vimState.lastMessage = 'NORMAL'; updateVimStatus(); return; }
  if (vimState.pending === 'd') { vimState.pending = ''; if (e.key === 'd') deleteCurrentLine(); else vimState.lastMessage = 'Unknown command: d' + e.key; updateVimStatus(); return; }
  if (vimState.pending === 'g') { vimState.pending = ''; if (e.key === 'g') setVimCaret(0); else vimState.lastMessage = 'Unknown command: g' + e.key; updateVimStatus(); return; }
  if (e.key === ':') { vimState.command = ''; setVimMode('command'); return; }
  if (e.key === 'h' || e.key === 'ArrowLeft') { moveVimHorizontal(-1); return; }
  if (e.key === 'l' || e.key === 'ArrowRight') { moveVimHorizontal(1); return; }
  if (e.key === 'j' || e.key === 'ArrowDown') { moveVimVertical(1); return; }
  if (e.key === 'k' || e.key === 'ArrowUp') { moveVimVertical(-1); return; }
  if (e.key === '0') { moveToLineBoundary(false); return; }
  if (e.key === '$') { moveToLineBoundary(true); return; }
  if (e.key === 'G') { setVimCaret(vimBufferEl.value.length); return; }
  if (e.key === 'g') { vimState.pending = 'g'; vimState.lastMessage = 'g'; updateVimStatus(); return; }
  if (e.key === 'd') { vimState.pending = 'd'; vimState.lastMessage = 'd'; updateVimStatus(); return; }
  if (e.key === 'i') { if (ensureVimEditable()) setVimMode('insert'); return; }
  if (e.key === 'a') { moveVimHorizontal(1); if (ensureVimEditable()) setVimMode('insert'); return; }
  if (e.key === 'I') { moveToFirstNonBlank(); if (ensureVimEditable()) setVimMode('insert'); return; }
  if (e.key === 'A') { moveToLineBoundary(true); if (ensureVimEditable()) setVimMode('insert'); return; }
  if (e.key === 'o') { openLineBelow(); return; }
  if (e.key === 'O') { openLineAbove(); return; }
  if (e.key === 'x') { deleteCharUnderCursor(); return; }
  vimState.lastMessage = 'Keys: i, a, o, dd, gg, G, :w, :q';
  updateVimStatus();
}
function syncCommandBinaries() {
  for (var i = 0; i < externalCommandNames.length; i++) {
    var name = externalCommandNames[i];
    var path = '/usr/bin/' + name;
    if (_exists(path)) continue;
    _mkfile(path, '#!/usr/bin/env surya-shell\nbuiltin ' + name + ' "$@"\n', { executable:true, readOnly:true });
  }
}

async function processCommand() {
  var text = inputEl.value.trim();
  printPrompt(inputEl.value);
  inputEl.value = '';
  histPos = -1;

  if (text) {
    hist.push(text);
    syncHistoryFile();
    await execute(text);
  }

  scroll();
}

function handleKeyDown(e) {

  if (e.key === 'Tab') {
    e.preventDefault();
    tabComplete();
    return;
  }

  if (e.key === 'Enter') {
    e.preventDefault();
    processCommand();
    return;
  }

  if (e.ctrlKey && !e.shiftKey && !e.altKey) {
    switch (e.key.toLowerCase()) {
      case 'c':
        e.preventDefault();
        interrupted = true;
        print(promptStr() + ' ' + inputEl.value + '^C');
        inputEl.value = '';
        scroll();
        return;
      case 'l':
        e.preventDefault();
        commands.clear();
        return;
      case 'u':
        e.preventDefault();
        inputEl.value = inputEl.value.slice(inputEl.selectionStart);
        inputEl.selectionStart = inputEl.selectionEnd = 0;
        return;
      case 'k':
        e.preventDefault();
        inputEl.value = inputEl.value.slice(0, inputEl.selectionStart);
        return;
      case 'w':
        e.preventDefault();
        var v = inputEl.value, c = inputEl.selectionStart;
        var leftPart = v.slice(0, c);
        var trimmed = leftPart.replace(/\s+$/, '');
        var lastSpace = trimmed.lastIndexOf(' ');
        inputEl.value = v.slice(0, lastSpace + 1) + v.slice(c);
        inputEl.selectionStart = inputEl.selectionEnd = lastSpace + 1;
        return;
      case 'a':
        e.preventDefault();
        inputEl.selectionStart = inputEl.selectionEnd = 0;
        return;
      case 'e':
        e.preventDefault();
        inputEl.selectionStart = inputEl.selectionEnd = inputEl.value.length;
        return;
      case 'd':
        e.preventDefault();
        if (!inputEl.value) commands.exit();
        return;
    }
  }

  if (e.ctrlKey && e.shiftKey) {
    if (e.key === 'Q' || e.key === 'q') { e.preventDefault(); commands.exit(); return; }
    if (e.key === 'L' || e.key === 'l') { e.preventDefault(); commands.clear(); return; }
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (histPos === -1) histPos = hist.length;
    if (histPos > 0) {
      histPos--;
      inputEl.value = hist[histPos];
      setTimeout(function () { inputEl.selectionStart = inputEl.selectionEnd = inputEl.value.length; }, 0);
    }
    return;
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (histPos >= 0 && histPos < hist.length - 1) {
      histPos++;
      inputEl.value = hist[histPos];
    } else {
      histPos = -1;
      inputEl.value = '';
    }
    return;
  }

  if (e.key === 'Home') {
    e.preventDefault();
    inputEl.selectionStart = inputEl.selectionEnd = 0;
    return;
  }
  if (e.key === 'End') {
    e.preventDefault();
    inputEl.selectionStart = inputEl.selectionEnd = inputEl.value.length;
    return;
  }
}

initFS();
syncCommandBinaries();
syncHistoryFile();
outputEl.innerHTML = '';
printPre('Welcome to SuryaOS 3.1 - Terminal Emulator');
printPre('Executable section launchers: ./about  ./projects  ./resume');
printPre('Type \'help\' for available commands, \'man <cmd>\' for details.\n');
updatePrompt();
inputEl.addEventListener('keydown', handleKeyDown);

if (vimBufferEl) {
  vimBufferEl.addEventListener('keydown', handleVimKeyDown);
  vimBufferEl.addEventListener('input', function () {
    vimState.dirty = vimBufferEl.value !== vimState.original;
    updateVimGutter();
    updateVimStatus();
  });
  vimBufferEl.addEventListener('scroll', function () {
    if (vimGutterEl) vimGutterEl.scrollTop = vimBufferEl.scrollTop;
  });
  vimBufferEl.addEventListener('click', function () {
    vimState.pending = '';
    updateVimStatus();
  });
}

document.addEventListener('click', function (e) {
  if (isVimOpen()) return;
  if (!e.target.closest('a') && !e.target.closest('button') && !e.target.closest('.html-content a')) {
    inputEl.focus();
  }
});

})();
