document.getElementById("commandInput").addEventListener("keydown", handleKeyPress);

const commandHistory = [];
let historyIndex = 0;

const outputDiv = document.getElementById("output");
outputDiv.innerHTML += `<div>Welcome to the Terminal View! Type 'help' to view available commands.</div><br>`;

const aiCommands = {
  "whoami": () => "surya",
  "ls": () => "about projects resume",
  "pwd": () => "/home/surya",
  "help": () => displayHelp(),
  "clear": () => clearTerminal(),
  "echo": (args) => args.join(" "),
  "open": (args) => openFileLink(args[0]),
  "suggest": () => getAISuggestions(),
  "explain": (args) => explainCommand(args[0]),
  "cat": (args) => readFileContent(args[0]),
  "theme": (args) => {
    if (args[0] === "set" && args[1]) {
      const theme = args[1];
      document.body.classList.remove(
        "theme-default",
        "theme-light",
        "theme-solarized",
        "theme-matrix"
      );
      if (["default", "light", "solarized", "matrix"].includes(theme)) {
        document.body.classList.add(`theme-${theme}`);
        return `Theme set to ${theme}`;
      } else {
        return `Unknown theme: ${theme}`;
      }
    }
    return "Usage: theme set <default|light|solarized|matrix>";
  }
};
};

const fileLinks = {
    "about": "/?section=about",
    "projects": "/?section=projects",
    "resume": "/?section=resume",
    "view-resume": "/Resume",
    "linkedin": "/Goto/?id=linkedin",
    "github": "/Goto/?id=github",
    "twitter": "/Goto/?id=twitter",
    "startup": "/Goto/?id=vexylon",
    "vexylon": "/Goto/?id=vexylon",
    "game": "/Goto/?id=space_attack",
    "matrix": "/Matrix",
    "links": "/?section=links",
    "explore": "/?section=links"
};

async function processCommand() {
  const commandInput = document.getElementById("commandInput");
  const inputText = commandInput.value.trim();
  commandHistory.push(inputText);
  historyIndex = commandHistory.length;

  outputDiv.innerHTML += `<div><span class="prompt">surya@portfolio:~$</span> ${inputText}</div>`;

  const [command, ...args] = inputText.split(" ");
  const commandFn = aiCommands[command];

  if (commandFn) {
    const result = commandFn(args);
    if (result instanceof Promise) {
      try {
        const res = await result;
        if (res.trim().startsWith('<') && res.trim().endsWith('>')) {
          outputDiv.innerHTML += `<div class="html-content">${res}</div>`;
        } else {
          outputDiv.innerHTML += `<div>${res}</div>`;
        }
      } catch (error) {
        outputDiv.innerHTML += `<div>Error: ${error.message}</div>`;
      }
    } else {
      outputDiv.innerHTML += `<div>${result}</div>`;
    }
  } else {
    outputDiv.innerHTML += `<div>Command not found: ${command}</div>`;
    outputDiv.innerHTML += `<div>Did you mean: ${getClosestCommand(command)}?</div>`;
  }

  outputDiv.scrollTop = outputDiv.scrollHeight;
  commandInput.value = "";
}

function handleKeyPress(event) {
  if (event.key === "Enter") {
    processCommand();
  } else if (event.key === "ArrowUp") {
    loadPreviousCommand();
  } else if (event.key === "ArrowDown") {
    loadNextCommand();
  } else if (event.ctrlKey && event.shiftKey && event.key === "Q") {
    closeTerminal();
  } else if (event.ctrlKey && event.shiftKey && event.key === "L") {
    clearTerminal();
  }
}

function loadPreviousCommand() {
  if (historyIndex > 0) {
    historyIndex--;
    document.getElementById("commandInput").value = commandHistory[historyIndex];
  }
}

function loadNextCommand() {
  if (historyIndex < commandHistory.length - 1) {
    historyIndex++;
    document.getElementById("commandInput").value = commandHistory[historyIndex];
  } else {
    document.getElementById("commandInput").value = "";
  }
}

function clearTerminal() {
  outputDiv.innerHTML = "";
  for (const sheet of document.styleSheets) {
      for (const rule of sheet.cssRules) {
        if (rule.selectorText === '.header::before') {
          rule.style.setProperty('content', 'none', 'important');
          return;
        }
      }
  }
  document.styleSheets[0].insertRule(
    '.header::before { content: none !important; }',
    0
  );
  return "";
}

function closeTerminal() {
  const closeHelper = window.open('', '_self');
  closeHelper.close();
  if (!closeHelper.closed) {
    window.location = '/';
  }
}

function openFileLink(fileName) {
  const url = fileLinks[fileName];
  if (url) {
    openLink(url);
    return `Opening ${fileName}...`;
  } else {
    return `open: ${fileName}: No such file or link`;
  }
}

function openLink(url) {
  window.open(url, '_blank');
}

function getClosestCommand(command) {
  const possibleCommands = Object.keys(aiCommands);
  let closestMatch = "";
  let minDistance = Infinity;
  for (const cmd of possibleCommands) {
    const distance = levenshteinDistance(command, cmd);
    if (distance < minDistance) {
      minDistance = distance;
      closestMatch = cmd;
    }
  }
  return closestMatch;
}

function levenshteinDistance(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

function getAISuggestions() {
  return "Suggestions:\n1. Use 'help' to list all commands.\n2. Try 'explain <command>' for details on a command.\n3. Use 'cat <filename>' to view the contents of files like 'about', 'projects', or 'resume'.\n4. Use 'open <file>' to open specific files like 'resume', 'about', etc.";
}

function explainCommand(command) {
  const explanations = {
    "whoami": "Displays the current user.",
    "ls": "Lists available files (about, projects, resume).",
    "pwd": "Prints the current directory path.",
    "echo": "Prints text to the terminal.",
    "open": "Opens a specific file in a new tab. Usage: open <file>",
    "suggest": "Provides command suggestions.",
    "explain": "Explains a command's functionality.",
    "cat": "Displays the content of a file. Usage: cat <filename>",
    "clear": "Clears the terminal screen."
  };
  return explanations[command] || `No explanation found for command: ${command}`;
}

async function readFileContent(fileName) {
  const validFiles = ["about", "projects", "resume"];
  if (validFiles.includes(fileName)) {
    try {
      const response = await fetch(`https://pages.surya-ops.workers.dev/?section=${fileName}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch content (${response.status})`);
      }
      
      const text = await response.text();
      
      let html = "";
      
      if (text.trim().startsWith('<') && text.trim().endsWith('>')) {
        html = text;
      } 
      else if (text.includes("html = `")) {
        const startIndex = text.indexOf("html = `") + 8;
        const endIndex = text.indexOf("`;", startIndex);
        if (startIndex !== -1 && endIndex !== -1) {
          html = text.substring(startIndex, endIndex);
        } else {
          html = text;
        }
      } else {
        html = text;
      }
      
      return html;
    } catch (error) {
      return `cat: ${fileName}: Error fetching content: ${error.message}`;
    }
  } else {
    return `cat: ${fileName}: No such file or directory`;
  }
}

function displayHelp() {
  return `Welcome to the Terminal View! Here are some commands to get started:\n
- whoami: Displays the current user.
- ls: Lists available files (about, projects, resume).
- cat <filename>: Displays the content of a specified file. Try "cat about", "cat projects", or "cat resume".
- open <file>: Opens the specified file link in a new tab. Try "open resume" or "open about".
- help: Shows this help text.
- clear: Clears the terminal screen.
- echo <text>: Prints the specified text.
- suggest: Provides suggestions for using the terminal.
- explain <command>: Provides an explanation of a specified command.
- Ctrl + Shift + Q: Closes the terminal.
- Ctrl + Shift + L: Clears the terminal screen.`;
}

function cleanHeadline(text) {
  text = text.trim();
  if (text.startsWith('"')) {
    text = text.substring(1);
  }
  const colonIndex = text.indexOf(':');
  if (colonIndex !== -1) {
    text = text.substring(0, colonIndex);
  }
  text = text.trim();
  text = text.replace(/\band\b[\s.,!?:;]*$/i, "");
  return text.trim();
}

function cleanTagline(text) {
  text = text.trim().replace(/\s+/g, " ");
  if (text.startsWith('"')) {
    text = text.substring(1);
  }
  if (text.endsWith('"')) {
    text = text.substring(0, text.length - 1);
  }
  text = text.replace(/our website/gi, "my website");
  return text.trim();
}
