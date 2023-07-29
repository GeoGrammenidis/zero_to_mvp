function renderPlayer(config = {}) {
  if ("speechSynthesis" in window) {
    config = {
      targetHeadings: ["h1", "h2", "h3", "h4", "h5", "h6"],
      targetTextElements: ["p"],
      colors: {
        100: "#e6f4fa",
        200: "#c6e9f7",
        300: "#91d5f2",
        400: "#6bc6ed",
        500: "#35b2e8",
        600: "#279ccf",
        700: "#1b85b2",
        800: "#0d5d80",
        900: "#00364d",
      },
      pitch: 1,
      rate: 1.2,
      voice: "Google UK English Male",
      ...config,
    };
    const synth = window.speechSynthesis;
    const utterThis = new SpeechSynthesisUtterance("Default text");

    let unfinishedCode = false;
    let lastButtonPressed = null;
    let lastButtonPressedSvg = null;
    let headings = document.querySelectorAll(config.targetHeadings.join(", "));
    let buttons = [];
    let texts = [];
    headings.forEach((heading, i) => {
      // create svgs for the button.
      let pauseSvg = createSVG("pause");
      let playSvg = createSVG("play");
      // create and render the button
      const newButton = document.createElement("button");
      newButton.appendChild(playSvg);
      newButton.setAttribute("data-state", "idle");
      styleButton(newButton, heading);
      parentNode = heading.parentNode;
      parentNode.insertBefore(newButton, heading);
      buttons.push(newButton);
      // prepare the text for the speech
      texts.push(heading.textContent);
      let nextSibling = heading;
      while (nextSibling.nextElementSibling) {
        nextSibling = nextSibling.nextElementSibling;
        if (
          config.targetTextElements.some(
            (x) => x.toLowerCase() == nextSibling.tagName.toLowerCase()
          )
        ) {
          let text = nextSibling.textContent.trim();
          if (text) {
            texts[i] += `\n${text}`;
          }
        } else if (
          config.targetHeadings.some(
            (x) => x.toLowerCase() == nextSibling.tagName.toLowerCase()
          )
        ) {
          break;
        }
      }
      // add event listener
      newButton.addEventListener("click", async (e) => {
        if (unfinishedCode) {
          console.log(
            "Clicked too fast. stateHandler hasn't run every command yet. Ignoring the click event."
          );
          return;
        }
        await stateHandler(e.currentTarget, texts[i], playSvg, pauseSvg);
      });
    });
    console.log("texts prepared:", texts);

    function stateHandler(element, text = "", playSvg, pauseSvg) {
      return new Promise((resolve) => {
        unfinishedCode = true;
        if (element.getAttribute("data-state") == "idle") {
          synth.cancel();
          utterThis.text = text;
          synth.speak(utterThis);
          if (lastButtonPressed != null) {
            lastButtonPressed.setAttribute("data-state", "idle");
            lastButtonPressed.innerHTML = "";
            lastButtonPressed.appendChild(lastButtonPressedSvg);
          }
          element.setAttribute("data-state", "playing");
          element.innerHTML = "";
          element.appendChild(pauseSvg);
          lastButtonPressed = element;
          lastButtonPressedSvg = playSvg;
        } else if (element.getAttribute("data-state") == "playing") {
          synth.pause();
          element.setAttribute("data-state", "pause");
          element.innerHTML = "";
          element.appendChild(playSvg);
        } else if (element.getAttribute("data-state") == "pause") {
          synth.resume();
          element.setAttribute("data-state", "playing");
          element.innerHTML = "";
          element.appendChild(pauseSvg);
        } else {
          throw Error("data-state has unexpected value.");
        }
        unfinishedCode = false;
        resolve();
      });
    }

    // synth events
    synth.onvoiceschanged = () => {
      console.log("On voiceschanged fired.");
      utterThis.voice = synth
        .getVoices()
        .find((voice) => voice.name === "Google UK English Male");
      utterThis.pitch = config.pitch;
      utterThis.rate = config.rate;
    };

    utterThis.onstart = () => {
      console.log("Speech started.");
    };

    utterThis.onend = () => {
      console.log("Speech ended.");
      lastButtonPressed.setAttribute("data-state", "idle");
      lastButtonPressed.innerHTML = "";
      lastButtonPressed.appendChild(lastButtonPressedSvg);
    };

    utterThis.onerror = (event) => {
      console.error("Error occurred:", event.error);
    };

    // // won't be used. Issue on chrome, event never fired.
    // utterThis.onpause = (event) => {
    //   console.log(`Speech paused after ${event.elapsedTime} seconds.`);
    // };

    // // won't be used. Issue on chrome, event never fired.
    // utterThis.onresume = (event) => {
    //   console.log(`Speech paused after ${event.elapsedTime} seconds.`);
    // };

    // // won't be used. Issue on chrome, event never fired.
    // utterThis.onboundary = (event) => {
    //   console.log(
    //     `${event.name} boundary reached after ${event.elapsedTime} seconds.`
    //   );
    // };

    // onmark won't be used for this project.

    function createSVG(title) {
      // Create an SVG element
      const svgElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      svgElement.setAttribute("version", "1.1");
      svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      svgElement.setAttribute("width", "14");
      svgElement.setAttribute("height", "14");
      svgElement.setAttribute("viewBox", "0 0 32 32");

      // Create a title element
      const titleElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "title"
      );
      titleElement.textContent = title;
      svgElement.appendChild(titleElement);

      // Create a path element
      const pathElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      if (title == "play") {
        pathElement.setAttribute("d", "M6 4l20 12-20 12z");
      } else {
        pathElement.setAttribute("d", "M4 4h10v24h-10zM18 4h10v24h-10z");
      }
      svgElement.appendChild(pathElement);
      return svgElement;
    }

    function styleButton(button, heading) {
      button.classList.add("synthesis_player_btn");
      positionButton(button, heading);
    }
    function positionButton(button, heading) {
      let textWidth = getTextWidth(heading);
      const maxButtonRight = window.innerWidth - 30;
      let buttonLeft;
      if (textWidth < heading.clientWidth) {
        buttonLeft = getTextWidth(heading) + 14;
      } else {
        buttonLeft = heading.clientWidth + 14;
      }
      button.style.left = Math.min(buttonLeft, maxButtonRight) + "px";

      let buttonHeight = 24;
      button.style.transform = `translateY(${
        (heading.clientHeight - buttonHeight) / 2
      }px)`;
    }

    function getTextWidth(element) {
      const offScreenDiv = document.createElement("div");
      offScreenDiv.style.position = "absolute";
      offScreenDiv.style.visibility = "hidden";
      offScreenDiv.style.whiteSpace = "nowrap";
      offScreenDiv.style.font = window.getComputedStyle(element).font;

      const textNode = document.createTextNode(element.textContent);
      offScreenDiv.appendChild(textNode);

      document.body.appendChild(offScreenDiv);
      const width = offScreenDiv.clientWidth;
      document.body.removeChild(offScreenDiv);
      return width;
    }
    window.addEventListener("resize", () => {
      buttons.forEach((button, i) => {
        positionButton(button, headings[i]);
      });
    });
    // CSS rules
    const style = document.createElement("style");
    const cssRules = `
              :root {
                  --synthesis-brand-100: ${config.colors[100]};
                  --synthesis-brand-200: ${config.colors[200]};
                  --synthesis-brand-300: ${config.colors[300]};
                  --synthesis-brand-400: ${config.colors[400]};
                  --synthesis-brand-500: ${config.colors[500]};
                  --synthesis-brand-600: ${config.colors[600]};
                  --synthesis-brand-700: ${config.colors[700]};
                  --synthesis-brand-800: ${config.colors[800]};
                  --synthesis-brand-900: ${config.colors[900]};
              }
  
              .synthesis_player_btn {
                  position: absolute;
                  background-color: var(--synthesis-brand-500);
                  width: 24px;
                  height: 24px;
                  border-radius: 50%;
                  border: 2px solid var(--synthesis-brand-600);
                  opacity: 0.75;
              }
  
              .synthesis_player_btn svg,
              .synthesis_player_btn svg {
                  position: absolute;
                  left: 50%;
                  top: 50%;
                  transform: translate(-50%, -50%);
                  fill: var(--synthesis-brand-100);
              }
  
              .synthesis_player_btn:not([data-state="playing"]) svg {
                  left: calc(50% + 1px);
              }
  
              .synthesis_player_btn:hover,
              .synthesis_player_btn:hover {
                  background-color: var(--synthesis-brand-600);
                  border-color: var(--synthesis-brand-700);
                  cursor: pointer;
                  opacity: 1;
                  transition: 0.25s opacity, 0.25s background-color;
              }
  
              .synthesis_player_btn:active,
              .synthesis_player_btn:active {
                  background-color: var(--synthesis-brand-800);
                  border-color: var(--synthesis-brand-800);
              }
  
              .synthesis_player_btn[data-state="playing"],
              .synthesis_player_btn[data-state="playing"],
              .synthesis_player_btn[data-state="pause"],
              .synthesis_player_btn[data-state="pause"] {
                  background-color: var(--synthesis-brand-700);
                  border-color: var(--synthesis-brand-800);
              }
          `;

    style.textContent = cssRules;
    document.head.appendChild(style);
  } else {
    console.log("Speech Synthesis API is not supported in this browser.");
  }
}
