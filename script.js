const linksContainer = document.getElementById("links-container");
const iconContainer = document.createElement("div");
iconContainer.classList.add("icon-container");

// Email link with icon
const emailLinkItem = document.createElement("div");
emailLinkItem.classList.add("link-item");
const emailLinkAnchor = document.createElement("a");
emailLinkAnchor.href = "mailto:suryanarayanrenjith@gmail.com";
emailLinkAnchor.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M0 0h24v24H0z" fill="none"/><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 10L3 7v10h18V7l-9 6zm0-2.4L5.6 7H18.4L12 10.6z"/></svg> Email';
emailLinkItem.appendChild(emailLinkAnchor);
linksContainer.appendChild(emailLinkItem);


// GitHub link with icon
const githubLinkItem = document.createElement("div");
githubLinkItem.classList.add("link-item");
const githubLinkAnchor = document.createElement("a");
githubLinkAnchor.target = "_blank";
githubLinkAnchor.href = "https://github.com/suryanarayanrenjith";
githubLinkAnchor.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.88 8.17 6.84 9.49.5.09.68-.21.68-.48 0-.24-.01-.88-.01-1.75-2.78.5-3.37-1.34-3.37-1.34-.46-1.16-1.12-1.47-1.12-1.47-.91-.62.07-.61.07-.61 1 .07 1.53.71 1.53.71.89 1.53 2.34 1.09 2.91.83.09-.64.35-1.09.64-1.34-2.22-.25-4.56-1.12-4.56-5 0-1.1.39-2 1.03-2.71-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.76 1.02a9.61 9.61 0 0 1 2.51-.34c.85 0 1.71.11 2.51.34 1.92-1.29 2.76-1.02 2.76-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.57 1.03 2.71 0 3.89-2.34 4.75-4.57 5 .36.31.68.91.68 1.84 0 1.33-.01 2.41-.01 2.73 0 .27.18.58.68.48C19.12 20.17 22 16.42 22 12c0-5.52-4.48-10-10-10z"/></svg> GitHub';
githubLinkItem.appendChild(githubLinkAnchor);
linksContainer.appendChild(githubLinkItem);


// Twitter link with icon
const twitterLinkItem = document.createElement("div");
twitterLinkItem.classList.add("link-item");
const twitterLinkAnchor = document.createElement("a");
twitterLinkAnchor.target = "_blank";
twitterLinkAnchor.href = "https://x.com/_suryanarayanr";
twitterLinkAnchor.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><text x="0" y="24" font-family="Arial" font-size="24">&#x1D54F;</text></svg> X';
twitterLinkItem.appendChild(twitterLinkAnchor);
linksContainer.appendChild(twitterLinkItem);

// LinkedIn link with icon
const linkedinLinkItem = document.createElement("div");
linkedinLinkItem.classList.add("link-item");
const linkedinLinkAnchor = document.createElement("a");
linkedinLinkAnchor.target = "_blank";
linkedinLinkAnchor.href = "https://linkedin.com/in/suryanarayan-renjith";
linkedinLinkAnchor.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M4.5 22h-4.5v-14.578h4.5v14.578zm-2.25-16.44c-1.617 0-2.919-1.311-2.919-2.922s1.302-2.922 2.919-2.922 2.919 1.311 2.919 2.922-1.302 2.922-2.919 2.922zm17.25 16.44h-4.5v-7.395c0-1.755-.033-4.018-2.438-4.018-2.443 0-2.82 1.905-2.82 3.875v7.538h-4.5v-14.578h4.363v2.053h.062c.609-1.158 2.104-2.383 4.301-2.383 4.602 0 5.462 3.033 5.462 6.979v8.928z"/></svg> LinkedIn';
linkedinLinkItem.appendChild(linkedinLinkAnchor);
linksContainer.appendChild(linkedinLinkItem);

 // Space Attack link with icon
const spaceattackLinkItem = document.createElement("div");
spaceattackLinkItem.classList.add("link-item");
const spaceattackLinkAnchor = document.createElement("a");
spaceattackLinkAnchor.target = "_blank";
spaceattackLinkAnchor.href = "https://space-attack.itch.io";
spaceattackLinkAnchor.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="100%" height="100%" fill="white"/><image xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAsVJREFUSEuNls1vDlEUxn9HySslCEKD2PhYsEIiQjRN1K4ib5sIEksLSRNd6J9gQ2JRaSJiWWwoqUgkTVAiYYFNt+KjiI9WfVfD65gzc2d6Z+a+r97NzNw59znnPOc5Z0YoLgEU4kvgPjavt++w3OvMNO+ihJzhFULxYXzk/L49BVbZSMOGgeAKW37AQBPCTpQ1wC2ESZQmYBHQDFSc/TTKT4GvCjVgCbAX4R3KA+Bv6sbPYCkwjLDVagA8A+YDK4G5/gEvmz/Ae+AXsM7ZPHHOPqW1TMv2UGB7jorZ0RyqzSOEHTMOhHaUYYf3AvgtsKEx74KgqdLGBbpVOI/GdNraA9xOKboO7BeYVqEHlXFBB1SoOLoaSeEt8BG4ABwFaRF0hYJhVs3BAoQJlAqwGWgHWQx6DviQIRfFnfYK9ADjwABCFZVNoCeTushyEehQuOGATAFXgS9RkY8AbUUdxrTkN2sgY6CHgStAi8Ac16QdFtdZhG7v1E3gh8CBBChQ6fL+FNAfyfo4yjzPf5+dHomK0Vok2cFeBE4AnQj9hdCPkfB8BuRQPF/K667hvAZW13HQBjISTyVhytXJTE33zQKqMY1yp46DMXPwDVhYh4rBiK5egS6FUxlhSXq9wLVIJKdBqjOSdfJNIv5uptaNNg7Ky5+a/6lHoPhWv5qpaFKTWZIrp+uJN0VqC7MrDcooNpkXw/hs9i+BtQU5KujuaKaYbL1VSin9cOwCvZ/EmPtYvLKnUddgPtKQdXZj7JJ8hxD2ZRknqY7a5TJw0AMzvW2LHDwtt0C9nojj3qLw2DGdJnLJTmwE7rmxbH5MGZ2BydCg6TLyB9Fk/mgyxlvTYbcM6IrmyXqgz/VGdiqskKDuVkVzqVvgucIgyISpyI3chulnPwAzsHn70mkHnGZQ+FUIRhemyNdtwEvioI64S6rG79LZZfwPHMX0BZr+8b8AAAAASUVORK5CYII=" x="0" y="0" width="24" height="24"/></svg> Space Attack';
spaceattackLinkItem.appendChild(spaceattackLinkAnchor);
linksContainer.appendChild(spaceattackLinkItem);

function isBotOrCurl(userAgentString) {
      return /curl|bot|spider|crawler|wget|Mediapartners-Google/i.test(userAgentString);
    }


    if (!isBotOrCurl(navigator.userAgent)) {
        links.forEach(link => {
            const linkItem = document.createElement("div");
            linkItem.classList.add("link-item");
            
            const linkAnchor = document.createElement("a");
            linkAnchor.textContent = link.name;
            linkAnchor.href = link.url;
            
            linkItem.appendChild(linkAnchor);
            linksContainer.appendChild(linkItem);
        });
        
        linksContainer.appendChild(iconContainer);
    }
    else
    {
        linksContainer.style.display = "none";
    }
