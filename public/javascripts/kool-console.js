(function() {
  var CSS, Konsole, applyStyles, bindKeys, commitHistory, createTextField, focus, hide, history, installTextField, loadCoffeeScript, loadEl, loadHistory, run, runEffect, showAndFocus, showError, toggle, visible;

  CSS = ".konsole {\n  -webkit-transition: all .25s linear;\n  -moz-transition:    all .25s linear;\n  transition:         all .25s linear;\n  -webkit-transform:  translate(-50%, -65%);\n  -moz-transform:     translate(-50%, -65%);\n  transform:          translate(-50%, -65%);\n  box-sizing: border-box;\n  position: fixed;\n  top: 50%;\n  left: 50%;\n  width: 80%;\n  padding: 10px;\n  font-size: 36px;\n  background: rgba(0, 0, 0, .75);\n  box-shadow: 0 0 30px black;\n  font-family: monospace;\n  color: white;\n  pointer-events: none;\n  opacity: 0;\n  outline: none;\n  border: 0 !important;\n  border-radius: 0 !important;\n  z-index: 100;\n}\n.konsole.visible {\n  opacity: 1;\n  pointer-events: auto;\n  box-shadow: 2px 2px 5px rgba(0, 0, 0, .35);\n}\n.konsole.ran,\n.konsole.error {\n  -webkit-transition: all .15s linear;\n  -moz-transition:    all .15s linear;\n  transition:         all .15s linear;\n  pointer-events: none;\n}\n.konsole.ran {\n  background: transparent;\n  color: transparent;\n  text-shadow: 0 0 20px white;\n}\n.konsole.error {\n  -webkit-transform:  translate(-50%, 35%);\n  -moz-transform:     translate(-50%, 35%);\n  transform:          translate(-50%, 35%);\n  background: #cd414d;\n  color: white;\n}";

  history = [''];

  history.index = 0;

  commitHistory = function() {
    return localStorage['konsole'] = JSON.stringify(history);
  };

  loadHistory = function() {
    var e;
    try {
      history.length = 0;
      history = history.concat(JSON.parse(localStorage['konsole']));
      return history.index = history.length - 1;
    } catch (_error) {
      e = _error;
    }
  };

  loadCoffeeScript = function() {
    var script;
    script = document.createElement('script');
    script.src = 'https://raw.github.com/jashkenas/coffee-script/master/extras/coffee-script.js';
    return document.body.appendChild(script);
  };

  applyStyles = function() {
    var head, style;
    style = document.createElement('style');
    style.innerHTML = CSS;
    head = document.querySelector('head');
    return head.appendChild(style);
  };

  createTextField = function() {
    var field;
    field = document.createElement('input');
    field.type = 'text';
    field.spellcheck = false;
    field.classList.add('konsole');
    return field;
  };

  installTextField = function() {
    var textField;
    if (document.querySelector('.konsole') != null) {
      return false;
    }
    textField = createTextField();
    return document.body.appendChild(textField);
  };

  bindKeys = function() {
    return window.addEventListener('keydown', function(e) {
      switch (e.keyCode) {
        case 27:
          e.preventDefault();
          return hide();
        case 75:
          if (e.metaKey) {
            e.preventDefault();
            return toggle();
          }
          break;
        case 13:
          if (!visible()) {
            return false;
          }
          return run();
        case 38:
          if (!visible() || history.index === 0) {
            return false;
          }
          e.preventDefault();
          return loadEl().value = history[--history.index];
        case 40:
          if (!visible() || history.index === history.length - 1) {
            return false;
          }
          e.preventDefault();
          return loadEl().value = history[++history.index];
      }
    }, false);
  };

  loadEl = function() {
    var el;
    el = document.querySelector('.konsole');
    if (el == null) {
      throw "Konsole text field not found";
    }
    return el;
  };

  showAndFocus = function() {
    var el;
    el = loadEl();
    el.classList.add('visible');
    return el.focus();
  };

  hide = function() {
    return loadEl().classList.remove('visible');
  };

  visible = function() {
    return loadEl().classList.contains('visible');
  };

  toggle = function() {
    var el;
    el = loadEl();
    if (el.classList.contains('visible')) {
      return hide();
    } else {
      return showAndFocus();
    }
  };

  focus = function() {
    return loadEl.focus();
  };

  runEffect = function() {
    var ghost;
    ghost = loadEl().cloneNode();
    document.body.appendChild(ghost);
    setTimeout((function() {
      return ghost.classList.add('ran');
    }), 1);
    return setTimeout((function() {
      return document.body.removeChild(ghost);
    }), 150);
  };

  showError = function(message) {
    var ghost;
    ghost = loadEl().cloneNode();
    ghost.value = message;
    document.body.appendChild(ghost);
    setTimeout((function() {
      return ghost.classList.add('error');
    }), 1);
    return setTimeout((function() {
      return document.body.removeChild(ghost);
    }), 3000);
  };

  run = function() {
    var e, el;
    el = loadEl();
    history[history.index] = el.value;
    history.push('');
    history.index = history.length - 1;
    commitHistory();
    try {
      window["eval"](CoffeeScript.compile(el.value, {
        bare: true
      }));
      runEffect();
    } catch (_error) {
      e = _error;
      showError(e.message);
    }
    return loadEl().value = history[history.index];
  };

  Konsole = {
    showAndFocus: showAndFocus,
    hide: hide,
    toggle: toggle
  };

  (typeof module !== "undefined" && module !== null ? module.exports = Konsole : void 0) || (this.Konsole = Konsole);

  loadCoffeeScript();

  applyStyles();

  installTextField();

  bindKeys();

  loadHistory();

}).call(this);
