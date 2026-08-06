let terminalCount = 0;

function createTerminal() {
    terminalCount++;
    const terminal = document.createElement("div");
    terminal.classList.add("terminal-window");
    const offset = Math.min(100 + terminalCount * 20, window.innerWidth - 620);
    terminal.style.top = `${Math.min(100 + terminalCount * 20, window.innerHeight - 420)}px`;
    terminal.style.left = `${offset}px`;

    // Détection du système d'exploitation et du navigateur
    const userAgent = navigator.userAgent;
    let os = "Unknown OS";
    if (userAgent.includes("Win")) os = "Windows";
    else if (userAgent.includes("Mac")) os = "macOS";
    else if (userAgent.includes("Linux")) os = "Linux";
    else if (userAgent.includes("Android")) os = "Android";
    else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";

    let browser = "Unknown Browser";
    if (userAgent.includes("Chrome")) browser = "Chrome";
    else if (userAgent.includes("Firefox")) browser = "Firefox";
    else if (userAgent.includes("Safari")) browser = "Safari";
    else if (userAgent.includes("Edge")) browser = "Edge";

    // Date et heure actuelles
    const now = new Date();
    const dateTime = now.toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    });

    terminal.innerHTML = `
        <div class="terminal-header">
            <span>Terminal #${terminalCount}</span>
            <button class="close-btn">&times;</button>
        </div>
        <div class="terminal-body">
            <div class="ascii-container">
                <div class="ascii-left">
                    <pre class="ascii-art ascii-name">
                        ██████   ██████                                                   █████  ███     █████   ████ █████                ████   ███  ████ 
                        ░██████ ██████                                                   ░░███  ░░░     ░░███   ███░ ░░███                ░░███  ░░░  ░░███ 
                        ░███░█████░███   ██████    █████   █████   ██████  █████ ████  ███████  ████     ░███  ███    ░███████    ██████   ░███  ████  ░███ 
                        ░███░░███ ░███  ░░░░░███  ███░░   ███░░   ███░░███░░███ ░███  ███░░███ ░░███     ░███████     ░███░░███  ░░░░░███  ░███ ░░███  ░███ 
                        ░███ ░░░  ░███   ███████ ░e█████ ░e█████ ░███ ░███ ░███ ░███ ░███ ░███  ░███     ░███░░███    ░███ ░███   ███████  ░███  ░███  ░███ 
                        ░███      ░███  ███░░███  ░░░░███ ░░░░██N█░███ ░███ ░███ ░███ ░███ ░███  ░███     ░███ ░e███   ░███ ░███  ███░░███  ░███  ░███  ░███ 
                        █████     █████░░████████ ██████  ██████ ░e██████  ░e████████░░████████ █████    █████ ░e████ ████ █████░░████████ █████ █████ █████
                        ░░░░░     ░░░░░  ░░░░░░░░ ░░░░░░  ░░░░░░   ░░░░░░    ░░░░░░░░  ░░░░░░░░ ░░░░░    ░░░░░   ░░░░ ░░░░ ░░░░░  ░░░░░░░░ ░░░░░ ░░░░░ ░░░░░   
                    </pre>
                    <div class="system-info-left">
                        Khalil Massoudi's Portfolio Terminal [Version 1.0.2025]
                        (c) 2025 Khalil Massoudi. All rights reserved.
                        OS: ${os}
                        Browser: ${browser}
                        Date: ${dateTime}
                        Welcome to Khalil Massoudi's Portfolio Terminal!
                        Type <span class="highlight">help</span> to see available commands.
                        <div class="output" id="output-${terminalCount}"></div> 
                        <div class="prompt">guest@portfolio:~$ <span id="typed-${terminalCount}"></span><span class="cursor"></span></div>
                    </div>
                </div>
                <div class="ascii-right">
                    <pre class="ascii-art ascii-photo">                                         
                                                @@%@@                                               
                                         @@@@@%%@@@@@@@@@@                                          
                                      @@@@@@@@@@@@@@@@@@@@@%%%                                      
                                    @@@@@@@@@@@@@@@@@@@@@@@%%%%%                                    
                                  @@@@@@@@@@%%%%%@@@@@@%%@%%%@@%%%                                  
                                @@@@@@@@@@%%%%#%%%%####%%%%@@@@@@%%%                                
                               @@@@@@@@@%%@%%%%%#%#++*++**####%@@@%%%                               
                              @@@@@@@%##***++++++==-========++*#%@@%%%                              
                             %@@@@#*++======----------========+++*#%%%%                             
                             @@%#+++============---==========+++++++*%%%                            
                            @%#++++++=======================+++++++++#%%                            
                            %%++++++=======-=================++++++++*#%                            
                            %#+++++=======---=======----======+++++++*#%%                           
                            %%*++++================-===========++++++*%%%                           
                            %%*+++======================++++++===++++*##                            
                            %%*++++++***##***+++===++***#%%##****+=++*##                            
                            %#*++#%@@@@@@@%%#**+==++*##%%%@@@@@@@%*+++*#                            
                             *++#%%%@@%%%%@@@%*+===+#%@@%%###%%%%%%#++*#                            
                           +++++*#%%%%@@@@%%%%#+===+#%%%#%@@@%%%%%#*+++++                           
                           **+++*##%##*****#**+====+********######**+++***                          
                           +++++++++*#%%%#*++++=====+++=+*####**++++++**+                           
                           ==++==============+===-==+++==========++++++++                           
                            +++=======----==++===-==+++==---========++++                            
                            +++======----==++===--===+++===---======++++                            
                            ++++================---====++++=========++++                            
                           ===++=======++++****+===++***+++++====++++++++                           
                            +++++=========+*##%%#**#%%%#+++=++++++++++**                            
                             *+++++++++++=++*#%%%%%%%%%#**++++++****+**                             
                              *++++++++*######%%%%#%%%%#%%%%#*+*******                              
                              **++++++#%%#**********####%%%%%#+++****#                              
                               #***+++#%%%##***#####*****##*#*+*****#                               
                               %#***+++++*++++++++++++++++*++++**####                               
                                %%##**++++++++++++++++++*+*+++*###%%#++++++                         
                                *%%%#**++++++**#*###****+**++*##%%%##**+++++++++++++                
                        +++++++***%@%#**++++++++++++++++++++**%%%%#**********+++++++++******+++   ++
                  ++++++++++++***###@%#*+++============++++*#%@%@%*****************************+++++
            ++++++++++++*********#***%%#***++====+===+++++*#%@@@%#******************************+**+
         +++*************++***********%@%%#***+++****##*##%@@@@#####*******************************+
  =+++++****++***********++********#***#%@@%%%%%%##%%%%%%@@@%%######********************************
  +++********++***********++*****#**#****#%@@@@@@@@@@@@@@@%%########********************************
=++++*********************++******#*%#*****##%@@@@@@@@@%%##########****************#****************
+***+*****************************###%#********#############***#%##*******#*******###********##*****
++**+***************************##*###%##*************###**#*#####*****************###***#**####****
******##************************##**###%##****************##%#####*******#*****#***###*###*#####****
******##*************************##**####%#************##%%######*******##*****#***##**##########***
******##**********##***************########%%###################**#****##******#**##**#*#######**##*
*********##********#*****##********###########################*#*##***###******#####*###############
#####****####******##***************#*######################**#*##****###****######**#############**
###**##****##******##***************#**####################**#**#******############**###########**##
#*#####**#**##*****##****************#***################***#**********#############################
*#######*##**##****##*****************#***##############***########****#############################
############*##****#######***##********#***############****####**###***#############################
################***#############**************##########*############**#############################
################****############***************#######**###################################%########
#############*#***##############***********#########****####**############################%%%#######
#############*****##*###########**********######**###########*#################**#########%%%%######
###############***###############****#*****###***############################****#######%%%@%#######
##################################*#######*****######################*######*+***#######%%%%%%%%####
############%#######*##############################**#########*##########*+-::=*########%%%@@%%#####
########%%#%%######*#########################**####**######**###**###**+=--::::+*#######%%%@@%%#####
##########%%%#######################*######***######*********+====+-:------:::.-*#**####%%%@@@%%%%##
#######%%%%%%%################**#***++*+*****#######*+=---:-::::-+----=+===:-::-+***####%%@@@@@@%%##
                    </pre>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(terminal);
    terminal.querySelector(".close-btn").onclick = () => terminal.remove();
    makeDraggable(terminal);
    setupInput(terminalCount);

    const terminalBody = terminal.querySelector(".terminal-body");
    terminalBody.scrollTop = terminalBody.scrollHeight;
}

function appendOutput(terminalId, text) {
    const output = document.getElementById(`output-${terminalId}`);
    const outputDiv = document.createElement("div");
    outputDiv.classList.add("output");
    outputDiv.innerHTML = text;
    output.appendChild(outputDiv);
    const terminalBody = output.closest(".terminal-body");
    terminalBody.scrollTop = terminalBody.scrollHeight;
}

function setupInput(id) {
    const inputLine = document.getElementById(`typed-${id}`);
    const output = document.getElementById(`output-${id}`);
    const terminal = document.querySelector(`#typed-${id}`).parentElement.parentElement.parentElement;
    let isFocused = false;
    let commandHistory = [];
    let historyIndex = -1;

    const commands = {
        help: {
            description: "List of available commands",
            action: function () {
                return `
                    <div class="cmd-list">
                        <p><span class="highlight">help</span> - Show available commands</p>
                        <p><span class="highlight">about</span> - Learn who I am</p>
                        <p><span class="highlight">skills</span> - Display my technical skills</p>
                        <p><span class="highlight">projects</span> - Show projects I worked on</p>
                        <p><span class="highlight">contact</span> - How to reach me</p>
                        <p><span class="highlight">clear</span> - Clear the terminal</p>
                    </div>
                `;
            }
        },
        about: {
            description: "Information about me",
            action: function () {
                return `I am <span class="highlight">Khalil Massoudi</span>, Software Engineer passionate about DevOps, AI, and Web Development.`;
            }
        },
        skills: {
            description: "My technical stack",
            action: function () {
                return "DevOps, Docker, Kubernetes, Angular, Spring Boot, PHP, AI/ML.";
            }
        },
        projects: {
            description: "My projects",
            action: function () {
                return "Spring Boot + Angular QMS system, AI-powered chatbot, Mobile App against negativity on social media.";
            }
        },
        contact: {
            description: "How to contact me",
            action: function () {
                return "Email: kmassoudi03@gmail.com | LinkedIn: www.linkedin.com/in/massoudikhalil03 | Facebook: https://www.facebook.com/khalil.massoudi.142";
            }
        },
        clear: {
            description: "Clear the terminal",
            action: function () {
                return "clear";
            }
        }
    };

    terminal.addEventListener("click", () => {
        isFocused = true;
        terminal.style.borderColor = "#00ff99";
    });

    document.addEventListener("click", (e) => {
        if (!terminal.contains(e.target)) {
            isFocused = false;
            terminal.style.borderColor = "#519975";
        }
    });

    document.addEventListener("keydown", function (e) {
        if (!isFocused || !inputLine) return;

        if (e.key === "Enter") {
            const input = inputLine.textContent.trim();
            if (input) {
                commandHistory.push(input);
                appendOutput(id, `<div class="prompt">guest@portfolio:~$ ${input}</div>`); // Show executed command
                if (commands[input]) {
                    if (input === "clear") {
                        output.innerHTML = "";
                    } else {
                        appendOutput(id, commands[input].action());
                    }
                } else {
                    appendOutput(id, `<p>Command not found: ${input}</p>`);
                }
            }
            historyIndex = commandHistory.length;
            inputLine.textContent = "";
        } else if (e.key === "ArrowUp") {
            if (historyIndex > 0) {
                historyIndex--;
                inputLine.textContent = commandHistory[historyIndex] || "";
            }
        } else if (e.key === "ArrowDown") {
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                inputLine.textContent = commandHistory[historyIndex];
            } else {
                historyIndex = commandHistory.length;
                inputLine.textContent = "";
            }
        } else if (e.key.length === 1) {
            inputLine.textContent += e.key;
        } else if (e.key === "Backspace") {
            inputLine.textContent = inputLine.textContent.slice(0, -1);
        }
    });
}

function makeDraggable(el) {
    const header = el.querySelector(".terminal-header");
    let offsetX = 0, offsetY = 0, isDown = false;

    header.addEventListener("mousedown", (e) => {
        isDown = true;
        offsetX = el.offsetLeft - e.clientX;
        offsetY = el.offsetTop - e.clientY;
        el.style.zIndex = terminalCount + 1;
    });

    document.addEventListener("mouseup", () => {
        isDown = false;
    });

    document.addEventListener("mousemove", (e) => {
        if (isDown) {
            el.style.left = e.clientX + offsetX + "px";
            el.style.top = e.clientY + offsetY + "px";
        }
    });
}

createTerminal();
document.getElementById("new-terminal").onclick = createTerminal;