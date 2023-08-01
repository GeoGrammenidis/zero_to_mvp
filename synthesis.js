import customLogger from "./logger.js";

let playerState = {
  unfinishedCode: false,
  lastButtonPressed: null, // last player's button pressed
  lastButtonPressedSvg: null,
  headings: [], // all heading elements found in document
  buttons: [], // created player's button elements
  speeches: [], // created player's button elements
  speechChunks: [], // used to keep chunks of long speeches when uttered.
  config: {},
  utterThis: null,
};

// TODO: check the configuration object that it has the correct schema.
function renderPlayer(config = {}) {
  if ("speechSynthesis" in window) {
    // get initial configurations
    config = {
      ...getInitialConfig(),
      ...config,
    };
    const { logger } = customLogger(config.logger);
    logger.info("configurations initialized:", config);

    // preapre synth & utterThis
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterThis = new SpeechSynthesisUtterance("Default text");
    logger.synth("canceled");

    // initialize player state
    updatePlayerState({
      headings: getHeadings(config.targetHeadings, document),
      config,
      utterThis,
    });
    logger.state("playerste: initialized", playerState);

    // create a CSS elemenet and attach it to the head.
    document.head.appendChild(
      createCSSelement(
        playerState.config.colors,
        playerState.config.buttonHeight
      )
    );
    logger.dom("Added inline CSS into head");

    playerState.headings.forEach((heading, i) => {
      // create a button
      let newButton = createButton(playerState.config.buttonHeight);
      logger.info(
        `CREATED: 1 button & 2 svg elements. APPENDED: the svgs into button FOR:`,
        heading
      );

      // reposition the button
      updatePositionButtonNearHeading(
        newButton,
        heading,
        getTextWidth(heading),
        window.innerWidth - playerState.config.buttonHeight - 6,
        playerState.config.buttonHeight
      );
      logger.info(`Repositioned the button near the heading`);

      // create the speech for the button
      let speech = getSpeech(heading, playerState.config.targetHeadings);
      logger.info("created speech:", speech);

      // save the speech and the button
      updatePlayerState(
        {
          buttons: [...playerState.buttons, newButton],
          speeches: [...playerState.speeches, speech],
        },
        playerState
      );
      logger.state("playerState: updated buttons & speeches", playerState);

      // add event listener
      newButton.addEventListener("click", (e) =>
        updateButtonState(e, i, utterThis)
      );

      // added button to the dom
      let parentNode = heading.parentNode;
      parentNode.insertBefore(newButton, heading);
      logger.dom("added button");
    });

    // ~~~~~~ synth events ~~~~~~
    synth.onvoiceschanged = () => {
      updateSpeechSynthesisSettings(
        playerState.config.voiceName,
        playerState.config.pitch,
        playerState.config.rate,
        synth,
        utterThis
      );
      logger.synth("updated voiceName, pitch & rate", {
        voiceName: playerState.config.voiceName,
        pitch: playerState.config.pitch,
        rate: playerState.config.rate,
      });
    };

    utterThis.onend = () => {
      if (playerState.speechChunks.length > 0) {
        utterThis.text = playerState.speechChunks[0];
        updatePlayerState({ speechChunks: playerState.speechChunks.slice(1) });
        logger.state("updated speechCunks", playerState);
        synth.speak(utterThis);
        logger.synth("utters next available chunk:", utterThis.text);
      } else if (isUtteredFromThisSynthesis(playerState.lastButtonPressed)) {
        updateButtonUI(playerState.lastButtonPressed, "idle");
        logger.synth("stopped uttering");
        logger.button("updated button-state to idle(stopped playing)");
      }
    };

    utterThis.onerror = (event) => {
      if (playerState.config.logger.err) {
        logger.err("Error occurred:", event.error);
      } else {
        console.error("Error occurred:", event.error);
      }
    };

    // ~~~~~~ window events ~~~~~~
    window.addEventListener("resize", () => {
      playerState.buttons.forEach((button, i) => {
        updatePositionButtonNearHeading(
          button,
          playerState.headings[i],
          getTextWidth(playerState.headings[i]),
          window.innerWidth - playerState.config.buttonHeight - 6,
          playerState.config.buttonHeight
        );
      });
    });

    window.addEventListener("load", function () {
      playerState.buttons.forEach((button, i) => {
        updatePositionButtonNearHeading(
          button,
          playerState.headings[i],
          getTextWidth(playerState.headings[i]),
          window.innerWidth - playerState.config.buttonHeight - 6,
          playerState.config.buttonHeight
        );
      });
    });
  } else {
    console.log("Speech Synthesis API is not supported in this browser.");
  }
}

window.renderPlayer = renderPlayer;

// ~~~~~~~~ getters ~~~~~~~~
function getInitialConfig() {
  return {
    targetHeadings: ["h1", "h2", "h3", "h4", "h5", "h6"], // this should be array of strings.
    ignoredClasses: [],
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
    logger: {
      info: false,
      warn: false,
      err: false,
      state: false,
      dom: false,
      synth: false,
      button: false,
      colored: false,
    },
    buttonHeight: 24,
  };
}

function getHeadings(headingsArray, containerElement, computeStyles = true) {
  if (
    !Array.isArray(headingsArray) ||
    headingsArray.length == 0 ||
    headingsArray.some((heading) => typeof heading != "string")
  ) {
    throw new Error(
      "Invalid headingsArray provided. It should be an Array of strings"
    );
  }
  return Array.from(containerElement.querySelectorAll(headingsArray)).filter(
    (heading) => isElementVisible(heading, computeStyles)
  );
}

function getSpeech(heading, targetHeadings) {
  let speech = getTextFromElement(heading, targetHeadings, true).text;
  let nextSibling = heading;
  while (nextSibling.nextElementSibling) {
    nextSibling = nextSibling.nextElementSibling;
    const { text, headindFound } = getTextFromElement(
      nextSibling,
      targetHeadings
    );
    speech += text;
    if (headindFound) {
      break;
    }
  }
  return speech;
}

function getSpeechChunks(speech) {
  if (typeof speech != "string") {
    throw new Error(
      "Invalid speech provided. It was expected to be type of string."
    );
  }
  let words = speech.split(" ").filter((x) => x != "");
  let speechChunks = [];
  let speechChunk = "";
  words.forEach((word, i) => {
    speechChunk += word + " ";
    if (
      (speechChunk.length > 150 && isEndingWithPunctation(speechChunk)) ||
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

function getTextFromElement(element, targetHeadings, firstHeading = false) {
  if (element.nodeType === Node.TEXT_NODE) {
    return { text: element.textContent.trim(), headindFound: false };
  }
  if (
    !element ||
    !element.tagName ||
    element.tagName === "SCRIPT" ||
    element.classList.contains("synthesis_player_btn") ||
    !isElementVisible(element)
  ) {
    return { text: "", headindFound: false };
  }

  if (isHeadingElement(element, targetHeadings) && !firstHeading) {
    return { text: "", headindFound: true };
  }

  let text = "";
  let result = { headindFound: false };
  for (const child of element.childNodes) {
    const { text: childText, headindFound } = getTextFromElement(
      child,
      targetHeadings,
      firstHeading
    );
    text += childText.trim();
    if (headindFound) {
      result.headindFound = true;
      break;
    }
  }

  if (
    (element.tagName === "LI" || element.tagName === "P") &&
    !isEndingWithPunctation(text)
  ) {
    text += ".";
  }
  if (element.tagName === "BUTTON") {
    text = "(Button): " + text;
  }
  if (element.tagName === "A") {
    // TODO: specify where the link is referring to.
    text = "(Link): " + text;
  }

  return { text, headindFound: result.headindFound };
}

function getTextWidth(element, font) {
  const offScreenDiv = document.createElement("div");
  offScreenDiv.style.position = "absolute";
  offScreenDiv.style.visibility = "hidden";
  offScreenDiv.style.whiteSpace = "nowrap";
  offScreenDiv.style.font = font || window.getComputedStyle(element).font;

  const textNode = document.createTextNode(element.textContent);
  offScreenDiv.appendChild(textNode);

  const body = document.createElement("body");
  body.appendChild(offScreenDiv);

  document.documentElement.appendChild(body);
  const width = offScreenDiv.clientWidth;
  document.documentElement.removeChild(body);
  return width;
}

function getVoice(voiceName, synth) {
  return synth.getVoices().find((voice) => voice.name === voiceName);
}

function getMutationNodes(nodes) {
  if (!nodes) {
    throw new Error("Invalid nodes provided.");
  }
  return Array(...nodes)
    .filter((node) => {
      return node instanceof Element;
    })
    .filter(
      (element) =>
        // isElementVisible(element) && //this one creates bug. TODO: check why.
        element.style.display != "none" &&
        element.style.opacity !== "0" &&
        element.style.visibility != "hidden" &&
        !element.classList.contains("synthesis_player_btn") &&
        !element.classList.contains("synthesis_player_svg")
    );
}

// checked
function getClosestHeading(element, targetHeadings) {
  // case the element is actually a heading
  if (isHeadingElement(element, targetHeadings)) {
    return element;
  }

  // case the element exists in a heading
  let descendantHeading = getHeadingDescendant(element, targetHeadings);
  if (descendantHeading) {
    return descendantHeading;
  }

  let sibling = element;
  while (sibling) {
    if (sibling.previousElementSibling) {
      sibling = sibling.previousElementSibling;
      if (isHeadingElement(sibling, targetHeadings)) {
        break;
      }
    } else {
      sibling = sibling.parentNode;
      if (sibling === undefined) {
        console.log("!!!!!!!!!!!");
      }
      if (sibling === document.body || sibling == undefined) {
        sibling = null;
        break;
      }
    }
  }
  if (sibling) {
    let targetOrHeading = getNextTargetOrHeading(
      element,
      sibling.nextElementSibling,
      targetHeadings
    );
    if (targetOrHeading != "target") {
      return null;
    }
  }

  return sibling;
}

// checked.
function getHeadingDescendant(element, targetHeadings) {
  if (!element) {
    console.warn("parameter given into findHeadingDeescendant was wrong.");
    return null;
  }
  let currentElement = element.parentElement;
  while (currentElement) {
    if (isHeadingElement(currentElement, targetHeadings)) {
      return currentElement; // Found a heading descendant, return it
    }
    currentElement = currentElement.parentElement;
  }
  return null; // No heading descendant found, return null
}

// checked.
function getNextTargetOrHeading(
  targetElement,
  currentElement,
  targetHeadings,
  nextSiblings = []
) {
  // Check for target element
  if (currentElement === targetElement) {
    return "target";
  }
  // Check for heading element
  if (isHeadingElement(currentElement, targetHeadings)) {
    return "heading";
  }

  if (currentElement.firstElementChild) {
    return getNextTargetOrHeading(
      targetElement,
      currentElement.firstElementChild,
      targetHeadings,
      currentElement.nextElementSibling
        ? [...nextSiblings, currentElement.nextElementSibling]
        : nextSiblings
    );
  } else if (currentElement.nextElementSibling) {
    return getNextTargetOrHeading(
      targetElement,
      currentElement.nextElementSibling,
      targetHeadings,
      nextSiblings
    );
  } else {
    return getNextTargetOrHeading(
      targetElement,
      nextSiblings.slice(-1)[0],
      targetHeadings,
      nextSiblings.slice(0, -1)
    );
  }
}
// ~~~~~~~~~ checkers ~~~~~~~~~
// TODO: computedStyles needs to be checked.
function isElementVisible(element, computeStyles = true) {
  if (!element || !(element instanceof Element)) {
    throw new Error(
      "Invalid element provided or element is not an instance of Element."
    );
  }
  if (typeof computeStyles != "boolean") {
    throw new Error("Invalid computeStyles provided.");
  }

  let styles;
  if (computeStyles) {
    styles = window.getComputedStyle(element);
  } else {
    styles = {
      display: element.style.display,
      visibility: element.style.visibility,
      opacity: element.style.opacity,
    };
  }

  return (
    styles.display !== "none" &&
    styles.visibility !== "hidden" &&
    styles.opacity !== "0" &&
    getTextWidth(element) > 2
  );
}

function isHeadingElement(element, targetHeadings) {
  return (
    element &&
    element.tagName &&
    targetHeadings.some(
      (x) => x.toLowerCase() === element.tagName.toLowerCase()
    )
  );
}

function isEndingWithPunctation(my_string) {
  return /[.!?:]\s*$/.test(my_string);
}

function isUtteredFromThisSynthesis(lastButtonPressed) {
  return (
    lastButtonPressed && lastButtonPressed.getAttribute("data-state") != "idle"
  );
}

// ~~~~~~~~~ element creators ~~~~~~~~~

function createButton(buttonHeight) {
  let newButton = document.createElement("button");
  newButton.classList.add("synthesis_player_btn");
  let newSvg = createSVG("pause", buttonHeight);
  newSvg.style.opacity = 0;
  newButton.appendChild(newSvg);
  newButton.appendChild(createSVG("play", buttonHeight));
  newButton.setAttribute("data-state", "idle");
  return newButton;
}

function createSVG(title, buttonHeight) {
  if (typeof title != "string") {
    throw new Error("The title provided isn't type of string.");
  }
  if (typeof buttonHeight != "number") {
    throw new Error("The buttonHeight provided isn't type of number.");
  }
  // Create an SVG element
  const svgElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
  );
  svgElement.setAttribute("version", "1.1");
  svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svgElement.setAttribute("width", `${buttonHeight - 10}`);
  svgElement.setAttribute("height", `${buttonHeight - 10}`);
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
  svgElement.classList.add("synthesis_player_svg");
  return svgElement;
}

function createCSSelement(colors, buttonHeight) {
  if (typeof colors != "object") {
    throw new Error("Invalid type provided.");
  } else {
    if (Object.keys(colors).length != 9) {
      throw new Error("There is an unused color.");
    }
    Array.from({ length: 9 }, (_, i) => {
      if (typeof colors[(i + 1) * 100] != "string") {
        throw new Error("A color wasn't proviced.");
      }
    });
  }
  if (typeof buttonHeight != "number") {
    throw new Error("buttonHeight wasn't a number");
  }
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
                  width: ${buttonHeight}px;
                  height: ${buttonHeight}px;
                  border-radius: 50%;
                  border: 2px solid var(--synthesis-brand-600);
                  opacity: 0.75;
                  transition: 0.25s opacity, 0.25s background-color;
                  z-index:100;
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

  const style = document.createElement("style");
  style.textContent = cssRules;
  return style;
}

// ~~~~~~~~~ update functions ~~~~~~~~~
function updatePlayerState(newState) {
  playerState = { ...playerState, ...newState };
}

async function updateButtonState(e, buttonIndex, utterThis) {
  if (playerState.unfinishedCode) {
    throw new Error(
      "Clicked too fast. Previous click event hasn't run every command yet. Ignoring the click event."
    );
  }

  await new Promise((resolve) => {
    updatePlayerState({ unfinishedCode: true });
    const buttonElement = e.currentTarget;
    const buttonState = buttonElement.getAttribute("data-state");

    if (buttonState === "idle") {
      handleIdleButtonState(buttonElement, buttonIndex);
    } else if (buttonState === "playing") {
      window.speechSynthesis.pause();
      updateButtonUI(buttonElement, "pause");
    } else if (buttonState === "pause") {
      window.speechSynthesis.resume();
      updateButtonUI(buttonElement, "resume");
    } else {
      throw new Error("data-state has unexpected value.");
    }
    updatePlayerState({ unfinishedCode: false });
    resolve();
  });
}

function handleIdleButtonState(buttonElement, buttonIndex) {
  // get the speech from the players state
  const speech = playerState.speeches[buttonIndex];
  // get the get the speech chunks from the speech
  const speechChunks = getSpeechChunks(speech);
  // update utterThis text and start the synth
  playerState.utterThis.text = speechChunks.shift();
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(playerState.utterThis);
  // update the state of the button so that the UI changes
  updateButtonUI(buttonElement, "playing");
  // update the stae of the player to keep track of the chunks create as well the
  updatePlayerState({
    speechChunks: speechChunks,
    lastButtonPressed: buttonElement,
  });
}

function updateButtonUI(currentButton = null, buttonState = "idle") {
  if (buttonState == "idle") {
    playerState.lastButtonPressed.setAttribute("data-state", buttonState);
    playerState.lastButtonPressed.childNodes[0].style.opacity = 0; // pause svg
    playerState.lastButtonPressed.childNodes[1].style.opacity = 1; // play svg
  } else if (buttonState == "playing") {
    if (playerState.lastButtonPressed != null) {
      playerState.lastButtonPressed.setAttribute("data-state", "idle");
      playerState.lastButtonPressed.childNodes[0].style.opacity = 0; // pause svg
      playerState.lastButtonPressed.childNodes[1].style.opacity = 1; // play svg
    }
    currentButton.setAttribute("data-state", "playing");
    currentButton.childNodes[0].style.opacity = 1; // pause svg
    currentButton.childNodes[1].style.opacity = 0; // play svg
  } else if (buttonState == "pause") {
    currentButton.setAttribute("data-state", "pause");
    currentButton.childNodes[0].style.opacity = 0; // pause svg
    currentButton.childNodes[1].style.opacity = 1; // play svg
  } else if (buttonState == "resume") {
    currentButton.setAttribute("data-state", "playing");
    currentButton.childNodes[0].style.opacity = 1; // pause svg
    currentButton.childNodes[1].style.opacity = 0; // play svg
  } else {
    throw Error("buttonState has unexpected value.");
  }
}

function updateSpeechSynthesisSettings(
  voiceName,
  pitch,
  rate,
  synth,
  utterThis
) {
  utterThis.voice = getVoice(voiceName, synth);
  utterThis.pitch = pitch;
  utterThis.rate = rate;
}

function updatePositionButtonNearHeading(
  buttonElement,
  headingElement,
  headingTextWidth,
  maxButtonRightPosition,
  buttonHeight
) {
  if (
    !buttonElement ||
    !headingElement ||
    !(buttonElement instanceof Element) ||
    !(headingElement instanceof Element)
  ) {
    throw new Error(
      "Invalid element provided or element is not an instance of Element. Both buttonElement and headingElement must be provided."
    );
  }

  if (
    typeof headingTextWidth !== "number" ||
    typeof maxButtonRightPosition !== "number" ||
    typeof buttonHeight !== "number"
  ) {
    throw new Error(
      "Invalid input. headingTextWidth, maxButtonRightPosition, and buttonHeight must be numbers."
    );
  }

  let buttonLeftPosition;
  if (headingTextWidth < headingElement.clientWidth) {
    buttonLeftPosition = headingTextWidth + headingElement.offsetLeft;
  } else {
    buttonLeftPosition =
      headingElement.clientWidth + headingElement.offsetLeft - buttonHeight - 1;
  }
  buttonElement.style.left =
    Math.min(buttonLeftPosition, maxButtonRightPosition) + "px";

  buttonElement.style.transform = `translateY(${
    (headingElement.clientHeight - buttonHeight) / 2
  }px)`;
}

function removeHeadingsFromState(headingsToRemove) {
  const newButtons = [...playerState.buttons];
  const newSpeeches = [...playerState.speeches];
  const newHeadings = [...playerState.headings];

  headingsToRemove.forEach((heading) => {
    const index = newHeadings.findIndex((x) => x === heading);
    if (index !== -1) {
      newButtons[index].remove();
      newButtons.splice(index, 1);
      newSpeeches.splice(index, 1);
      newHeadings.splice(index, 1);
    } else {
      logger.warn(`Heading not found: ${heading}`);
    }
  });

  updatePlayerState({
    buttons: newButtons,
    speeches: newSpeeches,
    headings: newHeadings,
  });
}

// Function to handle DOM mutations
const handleMutation = (mutationsList, observer) => {
  for (const mutation of mutationsList) {
    const headingsToUpdate = new Set(); // may have new headings as well
    const headingsToRemove = new Set(); // may have headings that are not tracked.
    if (mutation.type === "childList") {
      let addedNodes = getMutationNodes(mutation.addedNodes);
      let removedNodes = getMutationNodes(mutation.removedNodes);
      let addedTexts = Array(...mutation.removedNodes).filter(
        (node) => node instanceof Text
      );

      // addedTexts must become addedNodes
      addedNodes.forEach((node) => {
        if (
          !(
            node.tagName == "SCRIPT" ||
            node.classList.contains("synthesis_player_btn") ||
            !isElementVisible(node)
          )
        ) {
          // we add previous closest heading
          headingsToUpdate.add(
            getClosestHeading(
              node.previousElementSibling
                ? node.previousElementSibling
                : node.parentElement,
              playerState.config.targetHeadings
            )
          );
          // we add a heading that is descendant of the node OR null.
          headingsToUpdate.add(
            getHeadingDescendant(node, playerState.config.targetHeadings)
          );

          // if the node is heading the we add the node
          if (isHeadingElement(node, playerState.config.targetHeadings)) {
            headingsToUpdate.add(node);
          }
        }
      });
      headingsToUpdate.delete(null);
      if (headingsToUpdate.size > 0) {
        // we save temporary all the speeches for current buttons
        let newStateSpeeches = [...playerState.speeches];
        let newStateButtons = [];
        let newHeadings = [];
        headingsToUpdate.forEach((heading) => {
          // create the speech for the speech update or for the new button
          let speech = getSpeech(heading, playerState.config.targetHeadings);
          let indexReturned = playerState.headings.findIndex(
            (x) => x == heading
          );

          if (indexReturned > 0) {
            // if it isn't a new heading we just update the old speech.
            newStateSpeeches[indexReturned] = speech;
          } else {
            // create a button
            let newButton = createButton(playerState.config.buttonHeight);

            // reposition the button
            updatePositionButtonNearHeading(
              newButton,
              heading,
              getTextWidth(heading, heading.style.font),
              window.innerWidth - playerState.config.buttonHeight - 6,
              playerState.config.buttonHeight
            );

            // save the speech, the button and the heading
            newStateSpeeches.push(speech);
            newStateButtons.push(newButton);
            newHeadings.push(heading);
          }
        });
        console.log("before", playerState);
        // update players state
        let oldArraysLength = playerState.buttons.length;
        updatePlayerState({
          headings: [...playerState.headings, ...newHeadings],
          speeches: newStateSpeeches,
          buttons: [...playerState.buttons, ...newStateButtons],
        });
        console.log("after", playerState);

        // add all buttons to the dom.
        newStateButtons.forEach((newButton, i) => {
          // add event listener
          newButton.addEventListener("click", (e) =>
            updateButtonState(e, oldArraysLength + i, playerState.utterThis)
          );
          // append button before the heading into DOM
          let parentNode = newHeadings[i].parentNode;
          parentNode.insertBefore(newButton, newHeadings[i]);
        });
      }

      headingsToRemove.delete(null);
      if (headingsToRemove.size > 0) {
        // removeHeadingsFromState(headingsToRemove);
      }
    } else if (mutation.type === "characterData") {
      // TODO: check this.
      console.warn(
        "Carefull! this is unhandled mutation:",
        mutation.target.textContent
      );
    } else if (
      mutation.type === "attributes" &&
      mutation.attributeName === "style"
    ) {
      console.log("this is style mutation.");
    }
  }
};

// Options for the MutationObserver
const observerOptions = {
  childList: true, // Observes changes to the list of children of the target node.
  subtree: true, // Observes changes to the entire subtree of the target node.
  characterData: true, // Observes changes to the value of text nodes.
  characterDataOldValue: true, // Records the previous value of text nodes when changed.
  attributeOldValue: true, // Records the previous value of attributes when changed.
  attributes: true, // Observes changes to attributes.
};

// Create a new MutationObserver
const observer = new MutationObserver(handleMutation);

// Target element to observe
const target = document.body; // You can change this to observe a specific element

// Start observing the target element with the specified options
observer.observe(target, observerOptions);
