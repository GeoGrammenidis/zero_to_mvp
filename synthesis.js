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
      ignoredClasses: ["visually-hidden"],
      ...config,
    };

    const synth = window.speechSynthesis;
    synth.cancel();
    const utterThis = new SpeechSynthesisUtterance("Default text");

    // initial values
    let state = {
      unfinishedCode: false,
      lastButtonPressed: null,
      lastButtonPressedSvg: null,
      headings: getHeadings(),
      buttons: [],
      speeches: [], // saves the whole text for each speech.
      speechChunks: [],
    };

    // adding CSS rules
    document.head.appendChild(createCSSelement());

    // creating button with its own svgs for every heading.
    state.headings.forEach((heading, i) => {
      // create svgs for the button.
      let pauseSvg = createSVG("pause");
      let playSvg = createSVG("play");
      // create and render the button
      const newButton = createButton(playSvg);
      styleButton(newButton, heading);

      // prepare the speech
      let speech = getHeadingText(heading);
      let nextSibling = heading;
      while (nextSibling.nextElementSibling) {
        nextSibling = nextSibling.nextElementSibling;
        const { text, headindFound } = getTextFromElement(nextSibling);
        if (headindFound) {
          break;
        } else {
          speech += text;
        }
      }
      // update arrays for buttons and scheeches
      updateState({
        buttons: [...state.buttons, newButton],
        speeches: [...state.speeches, speech],
      });

      // add event listener
      newButton.addEventListener("click", async (e) => {
        if (state.unfinishedCode) {
          console.log(
            "Clicked too fast. stateHandler hasn't run every command yet. Ignoring the click event."
          );
          return;
        }
        let element = e.currentTarget;
        let speech = state.speeches[i];
        await new Promise((resolve) => {
          updateState({ unfinishedCode: true });
          if (element.getAttribute("data-state") == "idle") {
            // cancel is needed otherwise it may never start in chrome.
            synth.cancel();
            // we get all the speechChunks for the speech
            let speechChunks = getSpeechChunks(speech);
            // we use the first to be uttered
            utterThis.text = speechChunks.shift(1);
            synth.speak(utterThis);
            // we update the state of the button
            updateButton({
              button: element,
              buttonState: "playing",
              buttonPauseSvg: pauseSvg,
            });
            // we update into the state:
            // - speechChunks to check them again when the speech ends.
            // - lastButtonPressed to be able to alter the state of it in case of other button being pressed while playing
            // - lastButtonPressedSvg to have access to the playSvg of this button when the state is changed to idle or paused
            updateState({
              speechChunks: speechChunks,
              lastButtonPressed: element,
              lastButtonPressedSvg: playSvg,
            });
          } else if (element.getAttribute("data-state") == "playing") {
            synth.pause();
            updateButton({
              button: element,
              buttonState: "pause",
              buttonPlaySvg: playSvg,
            });
          } else if (element.getAttribute("data-state") == "pause") {
            synth.resume();
            updateButton({
              button: element,
              buttonState: "resume",
              buttonPauseSvg: pauseSvg,
            });
          } else {
            throw Error("data-state has unexpected value.");
          }
          updateState({ unfinishedCode: false });
          resolve();
        });
      });

      // render the button
      parentNode = heading.parentNode;
      parentNode.insertBefore(newButton, heading);
    });

    // ~~~~~~ synth events ~~~~~~
    synth.onvoiceschanged = () => {
      updateSpeechSynthesisSettings();
    };

    utterThis.onend = () => {
      if (state.speechChunks.length > 0) {
        utterThis.text = state.speechChunks[0];
        updateState({ speechChunks: state.speechChunks.slice(1) });
        synth.speak(utterThis);
      } else if (isUtteredFromThisSynthesis()) {
        updateButton({ buttonState: "idle" });
        unfinishedSpeech = false;
      }
    };

    utterThis.onerror = (event) => {
      console.error("Error occurred:", event.error);
    };

    // ~~~~~~ window events ~~~~~~
    window.addEventListener("resize", () => {
      state.buttons.forEach((button, i) => {
        positionButton(button, state.headings[i]);
      });
    });

    window.addEventListener("load", function () {
      state.buttons.forEach((button, i) => {
        positionButton(button, state.headings[i]);
      });
    });

    // ~~~~~~ helping functions ~~~~~~

    // side effects: changes the state.
    function updateState(newState, oldState = state) {
      state = { ...oldState, ...newState };
    }

    // side effects: changes lastButtonPressed attribute and innerHTML.
    function updateButton({
      button = null,
      buttonState = "idle",
      buttonPauseSvg = null,
      buttonPlaySvg = null,
      lastButtonPressed = state.lastButtonPressed,
      lastButtonPressedSvg = state.lastButtonPressedSvg,
    } = {}) {
      if (buttonState == "idle") {
        lastButtonPressed.setAttribute("data-state", buttonState);
        lastButtonPressed.innerHTML = "";
        lastButtonPressed.appendChild(lastButtonPressedSvg);
      } else if (buttonState == "playing") {
        if (state.lastButtonPressed != null) {
          state.lastButtonPressed.setAttribute("data-state", "idle");
          state.lastButtonPressed.innerHTML = "";
          state.lastButtonPressed.appendChild(state.lastButtonPressedSvg);
        }
        button.setAttribute("data-state", "playing");
        button.innerHTML = "";
        button.appendChild(buttonPauseSvg);
      } else if (buttonState == "pause") {
        button.setAttribute("data-state", "pause");
        button.innerHTML = "";
        button.appendChild(buttonPlaySvg);
      } else if (buttonState == "resume") {
        button.setAttribute("data-state", "playing");
        button.innerHTML = "";
        button.appendChild(buttonPauseSvg);
      } else {
        throw Error("buttonState has unexpected value.");
      }
    }

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

    // no side effects.
    function getVoice(voiceName) {
      return synth.getVoices().find((voice) => voice.name === voiceName);
    }

    // no side effects.
    function getHeadings({
      targetHeadings = config.targetHeadings,
      ignoredClasses = config.ignoredClasses,
    } = {}) {
      return Array.from(document.querySelectorAll(targetHeadings.join(", ")))
        .filter(
          (heading) =>
            !ignoredClasses.some((x) => heading.classList.contains(x))
        )
        .filter((heading) => isElementVisible(heading));
    }

    // no side effects.
    function isUtteredFromThisSynthesis({
      lastButtonPressed = state.lastButtonPressed,
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
    function createCSSelement({ colors = config.colors } = {}) {
      const style = document.createElement("style");
      const cssRules = `
              :root {
                  --synthesis-brand-100: ${colors[100]};
                  --synthesis-brand-200: ${colors[200]};
                  --synthesis-brand-300: ${colors[300]};
                  --synthesis-brand-400: ${colors[400]};
                  --synthesis-brand-500: ${colors[500]};
                  --synthesis-brand-600: ${colors[600]};
                  --synthesis-brand-700: ${colors[700]};
                  --synthesis-brand-800: ${colors[800]};
                  --synthesis-brand-900: ${colors[900]};
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

    function createButton(svg) {
      let newButton = document.createElement("button");
      newButton.appendChild(svg);
      newButton.setAttribute("data-state", "idle");
      return newButton;
    }

    function getHeadingText(heading) {
      let headingText = getTextFromElement(heading, true).text.trim();
      if (!correctEndPunctation(headingText)) {
        headingText += ".";
      }
      return headingText;
    }

    function getSpeechChunks(speech) {
      let words = speech.split(" ").filter((x) => x != "");
      let speechChunks = [];
      let speechChunk = "";
      words.forEach((word, i) => {
        speechChunk += word + " ";
        if (
          (speechChunk.length > 150 && correctEndPunctation(speechChunk)) ||
          speechChunk.length > 200 ||
          i == words.length - 1
        ) {
          speechChunks.push(speechChunk);
          speechChunk = "";
        }
      });
      if (speechChunk != "") {
        speechChunks.push(speechChunk);
      }
      return speechChunks;
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
