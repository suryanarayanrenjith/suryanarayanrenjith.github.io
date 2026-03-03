(function () {
'use strict';

var inputEl  = document.getElementById('commandInput');
var outputEl = document.getElementById('output');
var promptEl = document.querySelector('.prompt');

var USER = 'surya', HOST = 'portfolio', HOME = '/home/surya';
var cwd  = HOME;
var hist = [], histPos = -1;
var aliases = { ll:'ls -la', la:'ls -a', cls:'clear', '..':'cd ..' };
var envVars = {
  HOME: HOME, USER: USER, HOSTNAME: HOST, SHELL: '/bin/bash',
  TERM: 'xterm-256color', PATH: '/usr/local/bin:/usr/bin:/bin',
  EDITOR: 'vim', LANG: 'en_US.UTF-8', PWD: HOME, OLDPWD: HOME
};
var sessionStart = Date.now();
var exitCode = 0;
var interrupted = false;
var captureMode = false, captureBuffer = '';
var _headerCleared = null;

var vfs = {};

function _mkdirp(p) {
  if (vfs[p]) return;
  vfs[p] = { type:'d', ch:[], mt:new Date() };
  if (p !== '/') {
    var pp = _parent(p), nm = _base(p);
    if (!vfs[pp]) _mkdirp(pp);
    if (vfs[pp].ch.indexOf(nm) < 0) vfs[pp].ch.push(nm);
  }
}
function _mkfile(p, content, remote) {
  vfs[p] = { type:'f', data:content, remote:remote||null, mt:new Date(), sz:content?content.length:0 };
  var pp = _parent(p), nm = _base(p);
  if (!vfs[pp]) _mkdirp(pp);
  if (vfs[pp].ch.indexOf(nm) < 0) vfs[pp].ch.push(nm);
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

function initFS() {
  ['/','/home',HOME,HOME+'/Documents',HOME+'/Downloads',
   '/etc','/usr','/usr/bin','/usr/local','/usr/local/bin',
   '/tmp','/var','/var/log','/bin','/dev'].forEach(_mkdirp);
  _mkfile(HOME+'/.bashrc','# ~/.bashrc\nexport PATH="/usr/local/bin:/usr/bin:/bin"\nexport EDITOR="vim"\nalias ll="ls -la"\nalias la="ls -a"');
  _mkfile(HOME+'/.profile','# ~/.profile\n# Executed on login.');
  _mkfile(HOME+'/.bash_history','');
  _mkfile('/etc/hostname', HOST);
  _mkfile('/etc/os-release','NAME="SuryaOS"\nVERSION="3.0"\nID=suryaos\nPRETTY_NAME="SuryaOS 3.0 (Terminal)"');
  _mkfile('/etc/passwd','root:x:0:0:root:/root:/bin/bash\nsurya:x:1000:1000:Suryanarayan Renjith:'+HOME+':/bin/bash');
  _mkfile('/var/log/syslog','[OK] System initialized\n[OK] Network online\n[OK] All services running');
  _mkfile('/dev/null','');
  _mkfile(HOME+'/about',  null, 'about');
  _mkfile(HOME+'/projects', null, 'projects');
  _mkfile(HOME+'/resume',  null, 'resume');
}

var fileLinks = {};
fetch('https://surya-api.vercel.app/api/fileLinks')
  .then(function (r) { return r.json(); })
  .then(function (d) { fileLinks = d; })
  .catch(function () {});

function print(text, cls) {
  if (captureMode) { captureBuffer += (text||'') + '\n'; return; }
  var d = document.createElement('div');
  if (cls) d.className = cls;
  d.textContent = text;
  outputEl.appendChild(d);
}
function printHTML(html, cls) {
  if (captureMode) { captureBuffer += stripTags(html) + '\n'; return; }
  var d = document.createElement('div');
  if (cls) d.className = cls;
  d.innerHTML = html;
  outputEl.appendChild(d);
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
function promptStr() {
  var d = cwd;
  if (d === HOME) d = '~';
  else if (d.indexOf(HOME + '/') === 0) d = '~/' + d.slice(HOME.length + 1);
  return USER + '@' + HOST + ':' + d + '$';
}
function updatePrompt() { promptEl.textContent = promptStr(); }
function scroll() { var t = document.querySelector('.terminal'); t.scrollTop = t.scrollHeight; }
function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

function cleanFetchedHTML(html) {
  return html.replace(/style="[^"]*position:\s*absolute[^"]*"/gi,
    'style="text-align: right; margin-top: 12px;"');
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
function closestCmd(cmd) {
  var best = '', dist = Infinity;
  var all = Object.keys(commands);
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

var manPages = {
  ls:       'ls [OPTIONS] [PATH]\n  List directory contents.\n  -a  Show hidden files\n  -l  Long listing format\n  -h  Human-readable sizes (with -l)',
  cd:       'cd [DIR]\n  Change directory.\n  ~   Home directory\n  -   Previous directory\n  ..  Parent directory',
  pwd:      'pwd\n  Print the current working directory.',
  cat:      'cat [FILE...]\n  Display file contents.\n  Supports: about, projects, resume (fetched live).',
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
  open:     'open NAME\n  Open a linked page in a new tab.\n  Try: open resume, open github',
  curl:     'curl URL\n  Fetch the content of a URL.',
  ping:     'ping HOST\n  Send simulated ICMP packets to a host.',
  neofetch: 'neofetch\n  Display system information with ASCII art.',
  cowsay:   'cowsay [TEXT]\n  Make a cow say something.',
  fortune:  'fortune\n  Display a random inspirational quote.',
  cal:      'cal\n  Display a calendar for the current month.',
  factor:   'factor NUMBER\n  Print the prime factors of a number.',
  rev:      'rev TEXT\n  Reverse a string.',
  exit:     'exit\n  Close the terminal session.',
  sudo:     'sudo COMMAND\n  Execute a command as superuser (simulated).'
};

var commands = {};

commands.ls = function (args) {
  var parsed = parseFlags(args);
  var showAll = parsed.flags.a, longFmt = parsed.flags.l, human = parsed.flags.h;
  var target = parsed.args[0] ? _resolve(parsed.args[0]) : cwd;
  if (!_exists(target)) return 'ls: cannot access \'' + (parsed.args[0]||'.') + '\': No such file or directory';
  if (_isFile(target)) {
    if (longFmt) return _lsLong(_base(target), vfs[target]);
    return _base(target);
  }
  var entries = vfs[target].ch.slice().sort();
  if (!showAll) entries = entries.filter(function (e) { return e.charAt(0) !== '.'; });
  if (longFmt) {
    var lines = ['total ' + entries.length];
    for (var i = 0; i < entries.length; i++) {
      var fp = (target === '/' ? '' : target) + '/' + entries[i];
      lines.push(_lsLong(entries[i], vfs[fp], human));
    }
    return lines.join('\n');
  }
  return entries.join('  ');
};
function _lsLong(name, node, human) {
  if (!node) return '??????????  ? ?     ?       ?            ? ' + name;
  var isD = node.type === 'd';
  var perm = isD ? 'drwxr-xr-x' : '-rw-r--r--';
  var links = isD ? (node.ch ? node.ch.length + 2 : 2) : 1;
  var sz = isD ? 4096 : (node.sz || 0);
  if (human) sz = fmtSize(sz); else sz = String(sz);
  return perm + ' ' + pad(links, 2) + ' ' + rpad(USER, 6) + ' ' + rpad(USER, 6) + ' ' + pad(sz, 6) + ' ' + fmtDate(node.mt) + ' ' + name + (isD ? '/' : '');
}

commands.cd = function (args) {
  var target = args[0] ? _resolve(args[0]) : HOME;
  if (!_exists(target)) return 'bash: cd: ' + args[0] + ': No such file or directory';
  if (!_isDir(target)) return 'bash: cd: ' + args[0] + ': Not a directory';
  envVars.OLDPWD = cwd;
  cwd = target;
  envVars.PWD = cwd;
  updatePrompt();
  if (args[0] === '-') print(cwd);
  return '';
};

commands.pwd = function () { return cwd; };

commands.cat = async function (args, stdin) {
  if (stdin) return stdin;
  if (!args.length) { print('cat: missing operand'); exitCode = 1; return ''; }
  for (var i = 0; i < args.length; i++) {
    var path = _resolve(args[i]);
    if (!_exists(path))  { print('cat: ' + args[i] + ': No such file or directory'); exitCode = 1; continue; }
    if (_isDir(path))    { print('cat: ' + args[i] + ': Is a directory'); exitCode = 1; continue; }
    var node = vfs[path];
    if (node.remote) {
      try {
        var res = await fetch('https://pages.surya-ops.workers.dev/?section=' + node.remote);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var html = await res.text();
        html = cleanFetchedHTML(html);
        printHTML(html, 'html-content');
      } catch (e) { print('cat: ' + args[i] + ': Error reading file'); exitCode = 1; }
    } else {
      if (node.data !== null) print(node.data);
    }
  }
  return '';
};

commands.head = function (args, stdin) {
  var parsed = parseFlags(args);
  var n = 10;
  if (parsed.flags.n && parsed.args.length > 0 && /^\d+$/.test(parsed.args[0])) {
    n = parseInt(parsed.args.shift());
  }
  var text = stdin;
  if (!text) {
    if (!parsed.args.length) return 'head: missing operand';
    var p = _resolve(parsed.args[0]);
    if (!_exists(p)) return 'head: ' + parsed.args[0] + ': No such file or directory';
    if (_isDir(p)) return 'head: ' + parsed.args[0] + ': Is a directory';
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
    if (!parsed.args.length) return 'tail: missing operand';
    var p = _resolve(parsed.args[0]);
    if (!_exists(p)) return 'tail: ' + parsed.args[0] + ': No such file or directory';
    if (_isDir(p)) return 'tail: ' + parsed.args[0] + ': Is a directory';
    text = vfs[p].data || '';
  }
  var lines = text.split('\n');
  return lines.slice(Math.max(0, lines.length - n)).join('\n');
};

commands.grep = function (args, stdin) {
  if (!args.length) return 'grep: missing pattern';
  var pattern = args[0];
  var text = stdin;
  if (!text && args.length > 1) {
    var p = _resolve(args[1]);
    if (!_exists(p)) return 'grep: ' + args[1] + ': No such file or directory';
    if (_isDir(p)) return 'grep: ' + args[1] + ': Is a directory';
    text = vfs[p].data || '';
  }
  if (!text) return 'grep: missing file operand';
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
    if (!_exists(p)) return 'wc: ' + args[0] + ': No such file or directory';
    if (_isDir(p)) return 'wc: ' + args[0] + ': Is a directory';
    text = vfs[p].data || '';
  }
  if (!text) return 'wc: missing operand';
  var lines = text.split('\n').length;
  var words = text.split(/\s+/).filter(Boolean).length;
  var bytes = text.length;
  return pad(lines, 6) + pad(words, 6) + pad(bytes, 6) + (args.length ? ' ' + args[0] : '');
};

commands.touch = function (args) {
  if (!args.length) return 'touch: missing operand';
  var p = _resolve(args[0]);
  if (_exists(p)) { vfs[p].mt = new Date(); return ''; }
  _mkfile(p, '');
  return '';
};

commands.mkdir = function (args) {
  var parsed = parseFlags(args);
  if (!parsed.args.length) return 'mkdir: missing operand';
  var p = _resolve(parsed.args[0]);
  if (_exists(p)) return 'mkdir: cannot create directory \'' + parsed.args[0] + '\': File exists';
  if (parsed.flags.p) { _mkdirp(p); return ''; }
  var pp = _parent(p);
  if (!_exists(pp)) return 'mkdir: cannot create directory \'' + parsed.args[0] + '\': No such file or directory';
  _mkdirp(p);
  return '';
};

commands.rm = function (args) {
  var parsed = parseFlags(args);
  if (!parsed.args.length) return 'rm: missing operand';
  var target = parsed.args[0];
  var p = _resolve(target);
  if (p === '/') return 'rm: it is dangerous to operate recursively on \'/\'\nrm: use --no-preserve-root to override this failsafe';
  if (!_exists(p)) { if (!parsed.flags.f) return 'rm: cannot remove \'' + target + '\': No such file or directory'; return ''; }
  if (_isDir(p) && !parsed.flags.r) return 'rm: cannot remove \'' + target + '\': Is a directory';
  if (p.indexOf('/home/surya') !== 0 && p !== '/tmp') return 'rm: cannot remove \'' + target + '\': Permission denied';
  var pp = _parent(p), nm = _base(p);
  if (_isDir(p)) { _rmRecursive(p); }
  delete vfs[p];
  if (vfs[pp]) { var idx = vfs[pp].ch.indexOf(nm); if (idx > -1) vfs[pp].ch.splice(idx, 1); }
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
  if (!args.length) return 'rmdir: missing operand';
  var p = _resolve(args[0]);
  if (!_exists(p)) return 'rmdir: failed to remove \'' + args[0] + '\': No such file or directory';
  if (!_isDir(p)) return 'rmdir: failed to remove \'' + args[0] + '\': Not a directory';
  if (vfs[p].ch.length > 0) return 'rmdir: failed to remove \'' + args[0] + '\': Directory not empty';
  var pp = _parent(p), nm = _base(p);
  delete vfs[p];
  if (vfs[pp]) { var idx = vfs[pp].ch.indexOf(nm); if (idx > -1) vfs[pp].ch.splice(idx, 1); }
  return '';
};

commands.cp = function (args) {
  if (args.length < 2) return 'cp: missing destination file operand';
  var src = _resolve(args[0]), dst = _resolve(args[1]);
  if (!_exists(src)) return 'cp: cannot stat \'' + args[0] + '\': No such file or directory';
  if (_isDir(src)) return 'cp: -r not specified; omitting directory \'' + args[0] + '\'';
  if (_isDir(dst)) dst = dst + '/' + _base(src);
  _mkfile(dst, vfs[src].data, vfs[src].remote);
  return '';
};

commands.mv = function (args) {
  if (args.length < 2) return 'mv: missing destination file operand';
  var src = _resolve(args[0]), dst = _resolve(args[1]);
  if (!_exists(src)) return 'mv: cannot stat \'' + args[0] + '\': No such file or directory';
  if (_isDir(dst)) dst = dst + '/' + _base(src);
  vfs[dst] = vfs[src];
  var pp = _parent(src), nm = _base(src);
  delete vfs[src];
  if (vfs[pp]) { var idx = vfs[pp].ch.indexOf(nm); if (idx > -1) vfs[pp].ch.splice(idx, 1); }
  var dp = _parent(dst), dn = _base(dst);
  if (vfs[dp] && vfs[dp].ch.indexOf(dn) < 0) vfs[dp].ch.push(dn);
  return '';
};

commands.tree = function (args) {
  var target = args.length ? _resolve(args[0]) : cwd;
  if (!_exists(target)) return 'tree: \'' + (args[0]||'.') + '\': No such file or directory';
  if (!_isDir(target)) return _base(target);
  var lines = [_base(target) === _base(cwd) && !args.length ? '.' : (args[0]||'.')];
  _treeBuild(target, '', lines);
  return lines.join('\n');
};
function _treeBuild(path, prefix, lines) {
  var entries = vfs[path].ch.slice().sort();
  for (var i = 0; i < entries.length; i++) {
    var last = i === entries.length - 1;
    var connector = last ? '└── ' : '├── ';
    var fp = (path === '/' ? '' : path) + '/' + entries[i];
    var suffix = _isDir(fp) ? '/' : '';
    lines.push(prefix + connector + entries[i] + suffix);
    if (_isDir(fp)) {
      _treeBuild(fp, prefix + (last ? '    ' : '│   '), lines);
    }
  }
}

commands.find = function (args) {
  var searchPath = cwd, pattern = null;
  for (var i = 0; i < args.length; i++) {
    if (args[i] === '-name' && i + 1 < args.length) { pattern = args[++i]; }
    else if (!pattern && args[i].charAt(0) !== '-') { searchPath = _resolve(args[i]); }
  }
  if (!_exists(searchPath)) return 'find: \'' + args[0] + '\': No such file or directory';
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
  if (!args.length) return 'file: missing operand';
  var p = _resolve(args[0]);
  if (!_exists(p)) return args[0] + ': cannot open (No such file or directory)';
  if (_isDir(p)) return args[0] + ': directory';
  if (vfs[p].remote) return args[0] + ': HTML document (remote)';
  if (!vfs[p].data || vfs[p].data.length === 0) return args[0] + ': empty';
  return args[0] + ': ASCII text';
};

commands.stat = function (args) {
  if (!args.length) return 'stat: missing operand';
  var p = _resolve(args[0]);
  if (!_exists(p)) return 'stat: cannot statx \'' + args[0] + '\': No such file or directory';
  var n = vfs[p];
  var lines = [
    '  File: ' + args[0],
    '  Size: ' + (n.sz||0) + '\tBlocks: ' + Math.ceil((n.sz||0)/512) + '\tIO Block: 4096\t' + (n.type==='d'?'directory':'regular file'),
    'Access: (' + (n.type==='d'?'0755/drwxr-xr-x':'0644/-rw-r--r--') + ')\tUid: ( 1000/  '+USER+')\tGid: ( 1000/  '+USER+')',
    'Modify: ' + n.mt.toISOString(),
    'Access: ' + n.mt.toISOString()
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
    if (!_exists(p) || _isDir(p)) return 'sort: cannot read: ' + args[0];
    text = vfs[p].data || '';
  }
  if (!text) return '';
  return text.split('\n').sort().join('\n');
};

commands.uniq = function (args, stdin) {
  var text = stdin;
  if (!text && args.length) {
    var p = _resolve(args[0]);
    if (!_exists(p) || _isDir(p)) return 'uniq: cannot read: ' + args[0];
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
  if (parsed.flags.a) return 'SuryaOS portfolio 3.0.0-web #1 SMP x86_64 WebAssembly';
  if (parsed.flags.r) return '3.0.0-web';
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
  lines.push(rpad(USER, 8) + pad('87', 6) + pad('0.0', 6) + pad('0.0', 6) + pad('7892', 8) + pad('2048', 6) + ' ' + rpad('pts/0', 6) + rpad('R+', 5) + rpad(start, 8) + rpad('0:00', 6) + 'ps aux');
  return lines.join('\n');
};

commands.clear = function () {
  outputEl.innerHTML = '';
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
  if (args[0] === '-c') { hist.length = 0; return ''; }
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
  if (eqIdx < 1) return 'alias: usage: alias name=value';
  var name = eq.slice(0, eqIdx), val = eq.slice(eqIdx + 1).replace(/^['"]|['"]$/g, '');
  aliases[name] = val;
  return '';
};

commands.unalias = function (args) {
  if (!args.length) return 'unalias: usage: unalias name';
  if (!aliases[args[0]]) return 'bash: unalias: ' + args[0] + ': not found';
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
  if (eqIdx < 1) return 'export: usage: export VAR=value';
  envVars[expr.slice(0, eqIdx)] = expr.slice(eqIdx + 1);
  return '';
};

commands.env = function () {
  var lines = [];
  for (var k in envVars) lines.push(k + '=' + envVars[k]);
  return lines.join('\n');
};

commands.which = function (args) {
  if (!args.length) return 'which: missing operand';
  if (commands[args[0]]) return '/usr/bin/' + args[0];
  return 'which: no ' + args[0] + ' in (' + envVars.PATH + ')';
};

commands.type = function (args) {
  if (!args.length) return 'type: missing operand';
  var c = args[0];
  if (aliases[c]) return c + ' is aliased to \'' + aliases[c] + '\'';
  if (commands[c]) return c + ' is /usr/bin/' + c;
  return 'bash: type: ' + c + ': not found';
};

commands.man = function (args) {
  if (!args.length) return 'What manual page do you want?\nFor example, try \'man ls\'.';
  var page = manPages[args[0]];
  if (!page) return 'No manual entry for ' + args[0];
  return args[0].toUpperCase() + '(1)\n\nNAME\n    ' + page;
};

commands.help = function () {
  var sections = [
    ['Filesystem', 'ls  cd  pwd  cat  head  tail  mkdir  touch  rm  rmdir  cp  mv  tree  find  file  stat'],
    ['Text', 'echo  grep  wc  rev  sort  uniq'],
    ['System', 'whoami  hostname  uname  date  uptime  id  groups  df  free  ps'],
    ['Shell', 'help  man  history  clear  exit  alias  unalias  export  env  which  type'],
    ['Utility', 'open  curl  ping'],
    ['Fun', 'neofetch  cowsay  fortune  cal  factor  sudo']
  ];
  var lines = ['', '  Available commands:', ''];
  for (var i = 0; i < sections.length; i++) {
    lines.push('  ' + sections[i][0] + ':');
    lines.push('    ' + sections[i][1]);
    lines.push('');
  }
  lines.push('  Shortcuts:');
  lines.push('    Ctrl+C  Interrupt    Ctrl+L  Clear screen    Ctrl+U  Clear line');
  lines.push('    Ctrl+W  Delete word  Ctrl+A  Cursor start    Ctrl+E  Cursor end');
  lines.push('    Ctrl+D  Exit         Tab     Autocomplete    ↑/↓    History');
  lines.push('');
  lines.push('  Chaining:   cmd1 ; cmd2    cmd1 && cmd2    cmd1 || cmd2');
  lines.push('  Piping:     cmd1 | cmd2');
  lines.push('  History:    !!  (repeat last)    !n  (repeat nth)');
  lines.push('  Use \'man <command>\' for detailed usage.');
  lines.push('');
  return lines.join('\n');
};

commands.open = function (args) {
  if (!args.length) return 'open: missing operand';
  var name = args[0];
  var url = fileLinks[name];
  if (url) { window.open(url, '_blank'); return 'Opening ' + name + '...'; }
  var p = _resolve(name);
  if (_exists(p) && vfs[p].remote) {
    var routes = { about: '/', projects: '/', resume: '/Resume' };
    window.open(routes[vfs[p].remote] || '/', '_blank');
    return 'Opening ' + name + '...';
  }
  return 'open: ' + name + ': No such file or link\nAvailable: ' + Object.keys(fileLinks).join(', ');
};

commands.curl = async function (args) {
  if (!args.length) return 'curl: no URL specified';
  var url = args[0];
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  try {
    var res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return 'curl: (22) The requested URL returned error: ' + res.status;
    var text = await res.text();
    if (text.length > 2000) text = text.slice(0, 2000) + '\n... (truncated)';
    return text;
  } catch (e) {
    return 'curl: (7) Failed to connect to ' + args[0] + ' — CORS policy or network error';
  }
};

commands.ping = async function (args) {
  if (!args.length) return 'ping: usage error: Destination address required';
  var host = args[0];
  print('PING ' + host + ' 56(84) bytes of data.');
  for (var i = 1; i <= 4; i++) {
    if (interrupted) { interrupted = false; print('\n--- ' + host + ' ping statistics ---\n' + (i-1) + ' packets transmitted, ' + (i-1) + ' received'); return ''; }
    await delay(600 + Math.random() * 400);
    var ms = (8 + Math.random() * 45).toFixed(1);
    print('64 bytes from ' + host + ': icmp_seq=' + i + ' ttl=55 time=' + ms + ' ms');
    scroll();
  }
  print('');
  print('--- ' + host + ' ping statistics ---');
  print('4 packets transmitted, 4 received, 0% packet loss');
  return '';
};

commands.sudo = function (args) {
  if (!args.length) return 'usage: sudo <command>';
  if (args.join(' ').indexOf('rm -rf /') > -1) {
    print('[sudo] password for ' + USER + ': ');
    print('Removing /boot... done');
    print('Removing /home... done');
    print('Removing /usr... done');
    print('Just kidding. Nice try though.');
    return '';
  }
  return USER + ' is not in the sudoers file. This incident will be reported.';
};

commands.neofetch = function () {
  var diff = Math.floor((Date.now() - sessionStart) / 1000);
  var h = Math.floor(diff / 3600), m = Math.floor((diff % 3600) / 60);
  var upStr = h > 0 ? h + 'h ' + m + 'm' : m + ' min';
  var logo = [
    '        _____       ',
    '       / ____|      ',
    '      | (___  _   _ ',
    '       \\___ \\| | | |',
    '       ____) | |_| |',
    '      |_____/ \\__,_|'
  ];
  var info = [
    USER + '@' + HOST,
    '──────────────────',
    'OS: SuryaOS 3.0 (Web)',
    'Host: ' + HOST,
    'Kernel: 3.0.0-web',
    'Uptime: ' + upStr,
    'Shell: bash 5.2',
    'Terminal: ' + envVars.TERM,
    'CPU: WebAssembly @ ∞GHz',
    'Memory: Dynamic'
  ];
  var lines = [];
  var max = Math.max(logo.length, info.length);
  for (var i = 0; i < max; i++) {
    var left = i < logo.length ? logo[i] : rpad('', 20);
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
  if (!args.length) return 'factor: missing operand';
  var n = parseInt(args[0]);
  if (isNaN(n) || n < 2) return 'factor: \'' + args[0] + '\' is not a valid positive integer';
  var factors = [], orig = n;
  for (var d = 2; d * d <= n; d++) {
    while (n % d === 0) { factors.push(d); n /= d; }
  }
  if (n > 1) factors.push(n);
  return orig + ': ' + factors.join(' ');
};

commands.vim  = function () { return 'vim: editor not available in this terminal. Use \'cat\' to view files.'; };
commands.nano = commands.vim;
commands.vi   = commands.vim;
commands.apt  = function () { return 'apt: package manager not available in this web terminal.'; };
commands.brew = commands.apt;
commands.pip  = commands.apt;
commands.npm  = commands.apt;
commands.wget = function (args) { return 'wget: not available. Use \'curl\' instead.'; };
commands.ssh  = function () { return 'ssh: network access restricted in this terminal.'; };
commands.chmod = function () { return 'chmod: permission model is simulated in this terminal.'; };
commands.chown = commands.chmod;
commands.su   = function () { return 'su: authentication failure'; };
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

async function execute(line) {
  line = line.trim();
  if (!line) return;

  if (line === '!!') {
    if (hist.length < 1) { print('bash: !!: event not found'); return; }
    line = hist[hist.length - 1];
    print(line, 'term-dim');
  } else if (/^!(\d+)$/.test(line)) {
    var n = parseInt(line.slice(1));
    if (n < 1 || n > hist.length) { print('bash: ' + line + ': event not found'); return; }
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

  if (!commands[cmd]) {
    print('bash: ' + cmd + ': command not found');
    var suggest = closestCmd(cmd);
    if (suggest) print('Command \'' + cmd + '\' not found, did you mean \'' + suggest + '\'?', 'term-dim');
    exitCode = 127;
    return;
  }

  try {
    var result = commands[cmd](args, stdin);
    if (result instanceof Promise) result = await result;
    if (result != null && result !== '') {
      if (typeof result === 'string' && result.trim().charAt(0) === '<' && result.trim().charAt(1) !== ' ') {
        printHTML(result, 'html-content');
      } else {
        printPre(result);
      }
    }
    if (exitCode === 127) exitCode = 0;
  } catch (e) {
    print('bash: ' + cmd + ': ' + (e.message || 'unknown error'));
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
  var matches;

  if (isCmd || (tokens.length === 1 && completing && !before.includes(' '))) {
    var prefix = completing.toLowerCase();
    matches = Object.keys(commands).filter(function (c) { return c.indexOf(prefix) === 0; });
    Object.keys(aliases).forEach(function (a) {
      if (a.indexOf(prefix) === 0 && matches.indexOf(a) < 0) matches.push(a);
    });
    matches.sort();
  } else {
    matches = _completePath(completing);
  }

  if (!matches.length) return;

  if (matches.length === 1) {
    var completion = matches[0];
    if (isCmd) {
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
      if (!isCmd) {
        var rp = _resolve(m);
        if (_isDir(rp)) { span.textContent += '/'; span.classList.add('ls-dir'); }
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

async function processCommand() {
  var text = inputEl.value.trim();
  printPrompt(inputEl.value);
  inputEl.value = '';
  histPos = -1;

  if (text) {
    hist.push(text);
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
outputEl.innerHTML = '';
printPre('Welcome to SuryaOS 3.0 — Terminal Emulator');
printPre('Type \'help\' for available commands, \'man <cmd>\' for details.\n');
updatePrompt();
inputEl.addEventListener('keydown', handleKeyDown);

document.addEventListener('click', function (e) {
  if (!e.target.closest('a') && !e.target.closest('button') && !e.target.closest('.html-content a')) {
    inputEl.focus();
  }
});

})();
