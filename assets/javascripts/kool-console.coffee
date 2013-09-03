# Kool console
# ============
#
# A snippet for running CoffeeScript snippets in browser, with a cool
# centered text input.
#
# Press <meta> + K to open the console.

# Styles for the text field.
CSS = """
  .konsole {
    -webkit-transition: all .25s linear;
    -moz-transition:    all .25s linear;
    transition:         all .25s linear;
    -webkit-transform:  translate(-50%, -65%);
    -moz-transform:     translate(-50%, -65%);
    transform:          translate(-50%, -65%);
    box-sizing: border-box;
    position: fixed;
    top: 50%;
    left: 50%;
    width: 80%;
    padding: 10px;
    font-size: 36px;
    background: rgba(0, 0, 0, .75);
    box-shadow: 0 0 30px black;
    font-family: monospace;
    color: white;
    pointer-events: none;
    opacity: 0;
    outline: none;
    border: 0 !important;
    border-radius: 0 !important;
    z-index: 100;
  }
  .konsole.visible {
    opacity: 1;
    pointer-events: auto;
    box-shadow: 2px 2px 5px rgba(0, 0, 0, .35);
  }
  .konsole.no-error,
  .konsole.error {
    -webkit-transition: all .15s linear;
    -moz-transition:    all .15s linear;
    transition:         all .15s linear;
    -webkit-transform:  translate(-50%, 35%);
    -moz-transform:     translate(-50%, 35%);
    transform:          translate(-50%, 35%);
    color: white
    pointer-events: none;
  }
  .konsole.no-error {
    background: #52bb3b;
  }
  .konsole.error {
    background: #cd414d;
  }
"""

# Keep our command history around.
history = ['']
history.index = 0

# Saves the current history to localStorage.
commitHistory = ->
  localStorage['konsole'] = JSON.stringify history

# Loads the command history from localStorage.
loadHistory = ->
  try
    history.length = 0
    history = history.concat JSON.parse localStorage['konsole']
    history.index = history.length-1
  catch e

# Sources the browser CoffeeScript library.
loadCoffeeScript = ->
  script = document.createElement 'script'
  script.src = 'https://raw.github.com/jashkenas/coffee-script/master/extras/coffee-script.js'
  document.body.appendChild script

# Add the text field styles to the document.
applyStyles = ->
  style = document.createElement 'style'
  style.innerHTML = CSS
  head = document.querySelector 'head'
  head.appendChild style

# Creates the text field.
createTextField = ->
  field = document.createElement 'input'
  field.type = 'text'
  field.spellcheck = no
  field.classList.add 'konsole'
  field

# Adds the text field to the DOM.
installTextField = ->
  return false if document.querySelector('.konsole')?
  textField = createTextField()
  document.body.appendChild textField

# Binds the shortcut keys.
bindKeys = ->
  window.addEventListener 'keydown',
  (e) ->
    switch e.keyCode
      when 27
        e.preventDefault()
        hide()
      when 75
        if e.metaKey
          e.preventDefault()
          toggle()
      when 13
        return false unless visible()
        run()
      when 38
        return false if not visible() or history.index is 0
        e.preventDefault()
        loadEl().value = history[--history.index]
      when 40
        return false if not visible() or history.index is history.length-1
        e.preventDefault()
        loadEl().value = history[++history.index]
  , no

# Finds the text field element. Throws an error if it can't be found.
loadEl = ->
  el = document.querySelector '.konsole'
  throw "Konsole text field not found" unless el?
  el

# Shows the text field.
showAndFocus = ->
  el = loadEl()
  el.classList.add 'visible'
  el.focus()

# Hides the text field.
hide = ->
  loadEl().classList.remove 'visible'

# True if the visible class is there.
visible = ->
  loadEl().classList.contains 'visible'

# Toggles the text field visible/invisible.
toggle = ->
  el = loadEl()
  if el.classList.contains 'visible'
    hide()
  else
    showAndFocus()

# Focus the element.
focus = ->
  loadEl.focus()

showOutput = (options = {}) ->
  ghost = loadEl().cloneNode()
  ghost.value = options.message
  document.body.appendChild ghost
  setTimeout (-> ghost.classList.add options.className), 1
  setTimeout (-> document.body.removeChild ghost), 3000

# Runs a script in the window context.
run = ->
  el = loadEl()
  history[history.index] = el.value
  history.push ''
  history.index = history.length-1
  commitHistory()
  try
    output = window.eval CoffeeScript.compile(el.value, bare: yes)
    showOutput message: output.toString(), className: 'no-error'
  catch e
    showOutput message: e.message, className: 'error'
  loadEl().value = history[history.index]

# Exports.
Konsole =
  showAndFocus : showAndFocus
  hide         : hide
  toggle       : toggle

(module?.exports = Konsole) or @Konsole = Konsole

# Boot it up!
loadCoffeeScript()
applyStyles()
installTextField()
bindKeys()
loadHistory()
