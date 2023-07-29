(function () {
  if ("speechSynthesis" in window) {
    const synth = window.speechSynthesis;
    const utterThis = new SpeechSynthesisUtterance("Default text");

    let unfinishedCode = false;
    let lastButtonPressed = null;
    let lastButtonPressedSvg = null;
    let headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
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
        if (nextSibling.tagName == "P") {
          let text = nextSibling.textContent.trim();
          if (text) {
            texts[i] += `\n${text}`;
          }
        } else if (/^H[1-6]$/i.test(nextSibling.tagName)) {
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
      utterThis.pitch = 1;
      utterThis.rate = 1.2;
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
      // TODO: on resize this may change.make sure that it works as it should.
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
  } else {
    console.log("Speech Synthesis API is not supported in this browser.");
  }
})();
