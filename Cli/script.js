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
    "cat": (args) => readFileContent(args[0])
};

const fileContents = {
    "about": `Hi, my name is Suryanarayan Renjith. I have had a deep passion for computers since my childhood, channeling this into numerous innovative projects.\n
My journey led me to develop a <a href="#" onclick="openLink('/Goto/?id=vexylon')">startup</a> and a <a href="#" onclick="openLink('/Goto/?id=space-attack')">game</a> of my own.\n
Feel free to <a href="#" onclick="openLink('/Links')">explore</a> and connect with me!`,

    "projects": `Here are some of my recent projects:\n
1. <a href="#" onclick="openLink('/Goto/?id=linkedin')">Snake and Animal Repellent</a>\n
2. <a href="#" onclick="openLink('/Goto/?id=linkedin')">CryptoRipo</a>\n
3. <a href="#" onclick="openLink('/Goto/?id=linkedin')">OPD Queuing Model</a>\n
4. <a href="#" onclick="openLink('/Goto/?id=linkedin')">macOS VMX Patcher</a>\n
5. <a href="#" onclick="openLink('/Goto/?id=linkedin')">Website Checker</a>\n
6. <a href="#" onclick="openLink('/Links')">Explore more</a>`,

    "resume": `View my professional resume to learn about my skills and experience:\n
<a href="#" onclick="openLink('/Resume')">View Resume</a>`
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
    "game": "/Goto/?id=space-attack",
    "links": "/Links",
    "explore": "/Links"
};

function handleKeyPress(event) {
    const commandInput = document.getElementById("commandInput");
    const inputText = commandInput.value.trim();

    if (event.key === "Enter") {
        processCommand();
    }

    else if (event.key === "ArrowUp") {
        loadPreviousCommand();
    } else if (event.key === "ArrowDown") {
        loadNextCommand();
    }

    else if (event.ctrlKey && event.shiftKey && event.key === "Q") {
        closeTerminal();
    }

    else if (event.ctrlKey && event.shiftKey && event.key === "L") {
        clearTerminal();
    }
}

function closeTerminal() {
    const closeHelper = window.open('', '_self');
    closeHelper.close();
    if (!closeHelper.closed) {
        window.location = '/';
    }
}

function clearTerminal() {
    outputDiv.innerHTML = "";
    document.getElementById("commandInput").value = "";
}

function processCommand() {
    const commandInput = document.getElementById("commandInput");
    const inputText = commandInput.value.trim();
    commandHistory.push(inputText);
    historyIndex = commandHistory.length;

    outputDiv.innerHTML += `<div><span class="prompt">surya@portfolio:~$</span> ${inputText}</div>`;

    const [command, ...args] = inputText.split(" ");

    if (aiCommands[command]) {
        const result = typeof aiCommands[command] === "function" ? aiCommands[command](args) : aiCommands[command];
        if (result) outputDiv.innerHTML += `<div>${result}</div>`;
    } else {
        outputDiv.innerHTML += `<div>Command not found: ${command}</div>`;
        outputDiv.innerHTML += `<div>Did you mean: ${getClosestCommand(command)}?</div>`;
    }

    outputDiv.scrollTop = outputDiv.scrollHeight;
    commandInput.value = "";
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
        "ls": "Lists available directories or files.",
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

function readFileContent(fileName) {
    if (fileContents[fileName]) {
        return fileContents[fileName];
    } else {
        return `cat: ${fileName}: No such file or directory`;
    }
}

function displayHelp() {
    return `Welcome to the Terminal View! Here are some commands to get started:\n
    - whoami: Displays the current user.\n
    - ls: Lists available files (about, projects, resume).\n
    - cat <filename>: Displays the content of a specified file. Try "cat about", "cat projects", or "cat resume".\n
    - open <file>: Opens the specified file link in a new tab. Try "open resume" or "open about".\n
    - help: Shows this help text.\n
    - clear: Clears the terminal screen.\n
    - echo <text>: Prints the specified text.\n
    - suggest: Provides suggestions for using the terminal.\n
    - explain <command>: Provides an explanation of a specified command.\n
    - Ctrl + Shift + Q: Closes the terminal.\n
    - Ctrl + Shift + L: Clears the terminal screen.\n`;
}
