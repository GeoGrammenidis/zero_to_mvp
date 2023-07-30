function renderPlayer(config = {}) {
  if ("speechSynthesis" in window) {
    config = {
      targetHeadings: ["h1", "h2", "h3", "h4", "h5", "h6"],
      // targetTextElements: ["p"], TODO: make this work only for speicifc elements if given.
      // TODO: now it stops at the next heading. It would be nice that we could choose to stop at the next same level heading if we want.
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
      voiceName: "Google UK English Male",
      ignoreClasses: ["visually-hidden"],
      ...config,
    };
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterThis = new SpeechSynthesisUtterance("Default text");

    // initial values
    let unfinishedCode = false;
    let lastButtonPressed = null;
    let lastButtonPressedSvg = null;
    let headings = Array.from(
      document.querySelectorAll(config.targetHeadings.join(", "))
    )
      .filter(
        (heading) =>
          !config.ignoreClasses.some((x) => heading.classList.contains(x))
      )
      .filter((heading) => isElementVisible(heading));
    let buttons = [];
    let texts = [];
    let speeches = [];

    // adding CSS rules
    document.head.appendChild(createCSSelement());

    // creating button for every heading.
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
      let headingText = getTextFromElement(heading, true).text.trim();
      texts.push(
        correctEndPunctation(headingText) ? headingText : headingText + "."
      );
      let nextSibling = heading;
      while (nextSibling.nextElementSibling) {
        nextSibling = nextSibling.nextElementSibling;
        let result = getTextFromElement(nextSibling);
        texts[i] += result.text;
        if (result.headindFound) {
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
        let element = e.currentTarget;
        let text = texts[i];
        await new Promise((resolve) => {
          unfinishedCode = true;
          if (element.getAttribute("data-state") == "idle") {
            synth.cancel();
            let words = text.split(" ").filter((x) => x != "");
            let speech = "";
            words.forEach((word, i) => {
              speech += word + " ";
              if (
                (speech.length > 150 && correctEndPunctation(speech)) ||
                speech.length > 200 ||
                i == words.length - 1
              ) {
                speeches.push(speech);
                speech = "";
              }
            });
            utterThis.text = speeches.shift();
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
      });
    });

    // ~~~~~~ synth events ~~~~~~
    synth.onvoiceschanged = () => {
      updateSpeechSynthesisSettings();
    };

    utterThis.onend = () => {
      if (speeches.length > 0) {
        utterThis.text = speeches.shift();
        synth.speak(utterThis);
      } else if (isUtteredFromThisSynthesis()) {
        // updateButton({ state: "idle" }); TODO handle button state
        lastButtonPressed.setAttribute("data-state", "idle");
        lastButtonPressed.innerHTML = "";
        lastButtonPressed.appendChild(lastButtonPressedSvg);
        unfinishedSpeech = false;
      }
    };

    utterThis.onerror = (event) => {
      console.error("Error occurred:", event.error);
    };

    // ~~~~~~ window events ~~~~~~
    window.addEventListener("resize", () => {
      buttons.forEach((button, i) => {
        positionButton(button, headings[i]);
      });
    });

    window.addEventListener("load", function () {
      buttons.forEach((button, i) => {
        positionButton(button, headings[i]);
      });
    });

    // ~~~~~~ helping functions ~~~~~~

    // with side effects: changes utterThis and config.
    function updateSpeechSynthesisSettings({
      voiceName = config.voiceName,
      pitch = config.pitch,
      rate = config.rate,
    } = {}) {
      utterThis.voice = getVoice(voiceName);
      utterThis.pitch = pitch;
      utterThis.rate = rate;
      config.voiceName = voiceName;
      config.pitch = pitch;
      config.rate = rate;
    }

    // no side effects
    function getVoice(voiceName) {
      return synth.getVoices().find((voice) => voice.name === voiceName);
    }

    // no side effects.
    function isUtteredFromThisSynthesis({
      lastButtonPressed = lastButtonPressed,
    } = {}) {
      return (
        lastButtonPressed &&
        lastButtonPressed.getAttribute("data-state") != "idle"
      );
    }

    // no side effects.
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

    // with side effects: changes button and uses positionButton function.
    function styleButton(button, heading) {
      button.classList.add("synthesis_player_btn");
      positionButton(button, heading);
    }

    // with side effects: changes button
    function positionButton(button, heading) {
      let textWidth = getTextWidth(heading);
      const maxButtonRight = window.innerWidth - 30;
      let buttonLeft;
      if (textWidth < heading.clientWidth) {
        buttonLeft = getTextWidth(heading) + heading.offsetLeft;
      } else {
        buttonLeft = heading.clientWidth + heading.offsetLeft - 7;
      }
      button.style.left = Math.min(buttonLeft, maxButtonRight) + "px";

      let buttonHeight = 24;
      button.style.transform = `translateY(${
        (heading.clientHeight - buttonHeight) / 2
      }px)`;
    }

    // with side effects: added and then removed an element to the DOM
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

    // no side effects.
    function createCSSelement() {
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
                  transition: 0.25s opacity, 0.25s background-color;
                  z-index: 10000;
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
      return style;
    }

    // no side effects, TODO: break this function to smaller ones.
    function getTextFromElement(element, firstHeading = false) {
      let isHeadingElemnt = false;
      if (element && element.tagName) {
        if (element.tagName == "SCRIPT") {
          return { text: "", headindFound: false };
        }
        isHeadingElemnt = config.targetHeadings.some(
          (x) => x.toLowerCase() === element.tagName.toLowerCase()
        );
      }

      if (element.nodeType === Node.TEXT_NODE) {
        return { text: element.textContent.trim(), headindFound: false };
      } else if (isHeadingElemnt && !firstHeading) {
        return { text: "", headindFound: true };
      } else {
        let text = "";
        let result = { headindFound: false };
        for (let child of element.childNodes) {
          result = getTextFromElement(child);
          if (result.headindFound) {
            break;
          } else {
            if (result.text.trim() != "") {
              text += " " + result.text;
            }
          }
        }
        if (
          (element.tagName == "LI" || element.tagName == "P") &&
          !correctEndPunctation(text)
        ) {
          text += ".";
        }
        if (element.tagName == "BUTTON") {
          text = "(Button): " + text;
        }
        if (element.tagName == "A") {
          // TODO: specify where the link is refering to.
          text = "(Link): " + text;
        }
        return { text, headindFound: result.headindFound };
      }
    }

    // no side effects
    function correctEndPunctation(my_string) {
      return /[.!?:]\s*$/.test(my_string);
    }

    // no side effects
    function isElementVisible(element) {
      const styles = window.getComputedStyle(element);
      return (
        styles.display !== "none" &&
        styles.visibility !== "hidden" &&
        styles.opacity !== "0"
      );
    }
  } else {
    console.log("Speech Synthesis API is not supported in this browser.");
  }
}
