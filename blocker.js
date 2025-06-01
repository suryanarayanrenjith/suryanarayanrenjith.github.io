(function() {
    'use strict';

    function addCaptureListener(target, evt, fn) {
        if (target.addEventListener) {
            target.addEventListener(evt, fn, { capture: true, passive: false });
        } else if (target.attachEvent) {
            target.attachEvent('on' + evt, fn);
        }
    }

    var blockContext = function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return false;
    };
    addCaptureListener(document, 'contextmenu', blockContext);
    addCaptureListener(window,   'contextmenu', blockContext);

    try {
        document.oncontextmenu = function() { return false; };
        window.oncontextmenu   = function() { return false; };
    } catch (ignore) {}

    var styleTag = document.createElement('style');
    styleTag.type = 'text/css';
    styleTag.appendChild(document.createTextNode([
        '* {',
        '  -webkit-user-select: none !important;',
        '  -moz-user-select: none !important;',
        '  -ms-user-select: none !important;',
        '  user-select: none !important;',
        '  -webkit-touch-callout: none !important;',
        '}'
    ].join('\n')));
    var head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
    head.appendChild(styleTag);

    addCaptureListener(document, 'dragstart', function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
    });

    addCaptureListener(document, 'selectstart', function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
    });

    addCaptureListener(document, 'mousedown', function(e) {
        if (e.detail > 1) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    });

    addCaptureListener(document, 'touchstart', function(e) {
        if (e.touches && e.touches.length > 1) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    });

    addCaptureListener(document, 'keydown', function(e) {
        var key = e.keyCode || e.which;
        var ctrlOrCmd = e.ctrlKey || e.metaKey;
        var shift = e.shiftKey;
        var alt = e.altKey;

        if (key === 123) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }

        if (ctrlOrCmd && shift && (key === 73 || key === 74 || key === 67)) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }

        if (ctrlOrCmd && !shift && key === 85) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }

        if (ctrlOrCmd && (key === 83 || key === 80)) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }

        if (ctrlOrCmd && !shift && key === 65) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }

        if (ctrlOrCmd && shift && (key === 83 || key === 85)) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }

        if (ctrlOrCmd && shift && key === 77) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }

        if (alt && key === 123) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    });

    addCaptureListener(window, 'keydown', function(e) {
        var key = e.keyCode || e.which;
        var ctrlOrCmd = e.ctrlKey || e.metaKey;
        var shift = e.shiftKey;
        var alt = e.altKey;

        if (key === 123) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
        if (ctrlOrCmd && shift && (key === 73 || key === 74 || key === 67 || key === 75 || key === 77)) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
        if (ctrlOrCmd && (key === 85 || key === 83 || key === 80 || key === 65)) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
        if (ctrlOrCmd && shift && (key === 83 || key === 85)) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
        if (alt && key === 123) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    });


    (function() {
        if (!window.console) {
            window.console = {};
        }
        var methods = [
            'log', 'warn', 'info', 'error', 'debug', 'dir',
            'dirxml', 'group', 'groupCollapsed', 'groupEnd',
            'trace', 'assert', 'profile', 'profileEnd',
            'time', 'timeEnd', 'count', 'table'
        ];
        methods.forEach(function(m) {
            try {
                Object.defineProperty(console, m, {
                    value: function() { /* no-op */ },
                    writable: false,
                    configurable: false
                });
            } catch (err) {
                console[m] = function() {};
            }
        });
    })();

    (function() {
        var nativeToString = Function.prototype.toString;
        Function.prototype.toString = function() {
            var name = (this.name || '').toLowerCase();
            var blockedNames = ['detectdevtools', 'infinitedebugger', 'anonymous'];
            for (var i = 0; i < blockedNames.length; i++) {
                if (name.indexOf(blockedNames[i]) !== -1) {
                    return 'function () { [native code] }';
                }
            }
            return nativeToString.call(this);
        };

        try {
            Object.freeze(Object.prototype);
            Object.freeze(Function.prototype);
        } catch (e) {
        }
    })();

    (function() {
        var devtools = { open: false, orientation: null };
        var threshold = 160;

        function detectDevTools() {
            var widthDiff = window.outerWidth - window.innerWidth > threshold;
            var heightDiff = window.outerHeight - window.innerHeight > threshold;
            var orientation = widthDiff ? 'vertical' : 'horizontal';

            if ((window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized)
                || widthDiff || heightDiff) {
                if (!devtools.open || devtools.orientation !== orientation) {
                    devtools.open = true;
                    devtools.orientation = orientation;
                    document.documentElement.innerHTML = '';
                    window.location.replace('about:blank');
                }
            } else {
                devtools.open = false;
                devtools.orientation = null;
            }
        }

        setInterval(detectDevTools, 400);

        (function infiniteDebugger() {
            var start = Date.now();
            debugger;
            var end = Date.now();
            if (end - start > 100) {
                document.documentElement.innerHTML = '';
                window.location.replace('about:blank');
            }
            setTimeout(infiniteDebugger, 1000);
        })();
    })();

    (function() {
        var obfuscatedPayload =
            'KGZ1bmN0aW9uKCkgewogICAgdmFyIGxhcmdlTWFsbGljcm9iO1xuICAgIC8vIERlc2lsZS9qb2tlLXVwIHlvdXIgY29kZSBodXJ0IGNvbXBsZXRlbHkKICAgIC8vKirjvJjlsKbkpKCh9KSgpOw==';
        try {
            var decoded = atob(obfuscatedPayload);
            new Function(decoded)();
        } catch (e) {
        }
    })();

})();