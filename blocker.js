(function() {
    'use strict';

    function cap(target, evt, fn) {
        try {
            target.addEventListener(evt, fn, { capture: true, passive: false });
        } catch (e) {
            try { target.attachEvent('on' + evt, fn); } catch (_) {}
        }
    }

    function nuke() {
        try { document.documentElement.innerHTML = ''; } catch (_) {}
        try { window.location.replace('about:blank'); } catch (_) {}
    }

    try {
        if (window.self !== window.top) {
            nuke();
            return;
        }
    } catch (e) {
        nuke();
        return;
    }

    var blockEvent = function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return false;
    };
    cap(document, 'contextmenu', blockEvent);
    cap(window,   'contextmenu', blockEvent);
    try {
        document.oncontextmenu = function() { return false; };
        window.oncontextmenu   = function() { return false; };
    } catch (_) {}

    var styleEl = document.createElement('style');
    styleEl.setAttribute('data-b', '1');
    styleEl.textContent = [
        '* {',
        '  -webkit-user-select: none !important;',
        '  -moz-user-select: none !important;',
        '  -ms-user-select: none !important;',
        '  user-select: none !important;',
        '  -webkit-touch-callout: none !important;',
        '}',
        'img { pointer-events: none !important; -webkit-user-drag: none !important; }'
    ].join('\n');

    var injectStyle = function() {
        var h = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
        if (!document.querySelector('style[data-b="1"]')) {
            h.appendChild(styleEl.cloneNode(true));
        }
    };
    injectStyle();

    var styleObserver = new MutationObserver(function() {
        if (!document.querySelector('style[data-b="1"]')) {
            injectStyle();
        }
    });
    try {
        styleObserver.observe(document.documentElement, { childList: true, subtree: true });
    } catch (_) {}

    cap(document, 'dragstart',   blockEvent);
    cap(document, 'selectstart', blockEvent);

    cap(document, 'mousedown', function(e) {
        if (e.detail > 1) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    });

    cap(document, 'touchstart', function(e) {
        if (e.touches && e.touches.length > 1) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    });

    var blockedCombos = {
        123: { any: true },    
        73:  { ctrlShift: true },    
        74:  { ctrlShift: true },    
        67:  { ctrlShift: true },   
        77:  { ctrlShift: true },    
        69:  { ctrlShift: true },    
        85:  { ctrl: true },         
        83:  { ctrl: true },         
        80:  { ctrl: true },         
        65:  { ctrlOnly: true }      
    };

    function handleKeyBlock(e) {
        var key = e.keyCode || e.which;
        var ctrl = e.ctrlKey || e.metaKey;
        var shift = e.shiftKey;
        var combo = blockedCombos[key];
        if (!combo) return;

        var shouldBlock = false;
        if (combo.any)                                      shouldBlock = true;
        if (combo.ctrlShift && ctrl && shift)               shouldBlock = true;
        if (combo.ctrl && ctrl)                              shouldBlock = true;
        if (combo.ctrlOnly && ctrl && !shift)               shouldBlock = true;

        if (shouldBlock) {
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
            return false;
        }
    }

    cap(document, 'keydown', handleKeyBlock);
    cap(window,   'keydown', handleKeyBlock);
    cap(document, 'keyup',   handleKeyBlock);
    cap(window,   'keyup',   handleKeyBlock);

    (function() {
        if (!window.console) window.console = {};
        var methods = [
            'log', 'warn', 'info', 'error', 'debug', 'dir',
            'dirxml', 'group', 'groupCollapsed', 'groupEnd',
            'trace', 'assert', 'profile', 'profileEnd',
            'time', 'timeEnd', 'timeLog', 'count', 'countReset',
            'table', 'clear', 'exception'
        ];
        var noop = function() {};
        methods.forEach(function(m) {
            try {
                Object.defineProperty(console, m, {
                    get: function() { return noop; },
                    set: function() {},
                    configurable: false
                });
            } catch (_) {
                try { console[m] = noop; } catch (__) {}
            }
        });

        var origCreate = document.createElement.bind(document);
        document.createElement = function(tag) {
            var el = origCreate(tag);
            if (tag.toLowerCase() === 'iframe') {
                var origAppend = el.appendChild;
                setTimeout(function() {
                    try {
                        if (el.contentWindow && el.contentWindow.console) {
                            methods.forEach(function(m) {
                                try { el.contentWindow.console[m] = noop; } catch (_) {}
                            });
                        }
                    } catch (_) {}
                }, 0);
            }
            return el;
        };
    })();

    (function() {
        var native = Function.prototype.toString;
        var cloaked = new Set();
        window.__cloak = function(fn) { cloaked.add(fn); };

        Function.prototype.toString = function() {
            if (cloaked.has(this)) return 'function () { [native code] }';
            var name = (this.name || '').toLowerCase();
            if (/detect|debugger|devtools|blocker|protect/.test(name)) {
                return 'function () { [native code] }';
            }
            return native.call(this);
        };
        window.__cloak(Function.prototype.toString);
        window.__cloak(handleKeyBlock);
        window.__cloak(blockEvent);

        try { Object.freeze(Function.prototype); } catch (_) {}
    })();

    (function() {
        var wasOpen = false;

        function checkDimensions() {
            var dpr = window.devicePixelRatio || 1;
            var threshold = Math.max(100, 160 / dpr);
            var widthDiff  = window.outerWidth  - window.innerWidth  > threshold;
            var heightDiff = window.outerHeight - window.innerHeight > threshold;

            if (widthDiff || heightDiff) {
                if (!wasOpen) { wasOpen = true; nuke(); }
            } else {
                wasOpen = false;
            }
        }

        function debuggerTrap() {
            var t0 = performance.now();
            debugger;
            if (performance.now() - t0 > 80) nuke();
        }


        function consoleTrap() {
            var sentinel = { toString: function() { nuke(); return ''; } };
            try {
                Object.defineProperty(sentinel, 'id', {
                    get: function() { nuke(); }
                });
            } catch (_) {}
            try { console.log('%c', sentinel); } catch (_) {}
            try { console.dir(sentinel); } catch (_) {}
        }

        function elementTrap() {
            var el = document.createElement('div');
            var accessed = false;
            Object.defineProperty(el, 'id', {
                get: function() {
                    if (!accessed) { accessed = true; nuke(); }
                    return '';
                }
            });
            try { console.log(el); } catch (_) {}
        }

        function firebugCheck() {
            if (window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized) {
                nuke();
            }
        }

        setInterval(checkDimensions, 500);
        setInterval(debuggerTrap, 1500);
        setInterval(function() { consoleTrap(); elementTrap(); }, 3000);
        setInterval(firebugCheck, 5000);

        checkDimensions();
        debuggerTrap();
    })();

    cap(document, 'copy', function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        try {
            e.clipboardData.setData('text/plain', '');
        } catch (_) {}
    });
    cap(document, 'cut', blockEvent);

    setInterval(function() {
        injectStyle();
        try {
            document.oncontextmenu = function() { return false; };
            window.oncontextmenu   = function() { return false; };
        } catch (_) {}
    }, 2000);

})();
