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
        'img { pointer-events: none !important; -webkit-user-drag: none !important; }',
        'input, textarea, [contenteditable] { -webkit-user-select: text !important; -moz-user-select: text !important; -ms-user-select: text !important; user-select: text !important; }'
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

    cap(document, 'dragstart', blockEvent);
    
    cap(document, 'selectstart', function(e) {
        if (e.target && e.target.tagName && /^(INPUT|TEXTAREA|SELECT)$/i.test(e.target.tagName)) return;
        blockEvent(e);
    });

    var blockedCombos = {
        123: { any: true },    // F12
        73:  { ctrlShift: true },    // Ctrl+Shift+I
        74:  { ctrlShift: true },    // Ctrl+Shift+J
        67:  { ctrlShift: true },   // Ctrl+Shift+C
        85:  { ctrl: true },         // Ctrl+U
        83:  { ctrl: true },         // Ctrl+S
        80:  { ctrl: true }          // Ctrl+P
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

        setInterval(checkDimensions, 500);
        checkDimensions();
    })();

    cap(document, 'copy', function(e) {
        if (e.target && e.target.tagName && /^(INPUT|TEXTAREA|SELECT)$/i.test(e.target.tagName)) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        try {
            e.clipboardData.setData('text/plain', '');
        } catch (_) {}
    });
    
    cap(document, 'cut', function(e) {
        if (e.target && e.target.tagName && /^(INPUT|TEXTAREA|SELECT)$/i.test(e.target.tagName)) return;
        blockEvent(e);
    });

})();