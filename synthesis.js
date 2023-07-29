(function () {
  if ("speechSynthesis" in window) {
    const synth = window.speechSynthesis;
    const utterThis = new SpeechSynthesisUtterance("Default text");
    let unfinishedCode = false;
    let lastButtonPressed = null;
    let headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
    let buttons = [];
    let texts = [];
    headings.forEach((heading, i) => {
      // create and render the button
      const newButton = document.createElement("button");
      newButton.textContent = "Play";
      newButton.setAttribute("data-state", "idle");
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
        await stateHandler(e.target, texts[i]);
      });
    });
    console.log("texts prepared:", texts);

    function stateHandler(element, text = "") {
      return new Promise((resolve) => {
        unfinishedCode = true;
        if (element.getAttribute("data-state") == "idle") {
          synth.cancel();
          utterThis.text = text;
          synth.speak(utterThis);
          if (lastButtonPressed != null) {
            lastButtonPressed.setAttribute("data-state", "idle");
            lastButtonPressed.innerHTML = "Play";
          }
          element.setAttribute("data-state", "playing");
          element.innerHTML = "Pause";
          lastButtonPressed = element;
        } else if (element.getAttribute("data-state") == "playing") {
          synth.pause();
          element.setAttribute("data-state", "pause");
          element.innerHTML = "Play";
        } else if (element.getAttribute("data-state") == "pause") {
          synth.resume();
          element.setAttribute("data-state", "playing");
          element.innerHTML = "Pause";
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
      lastButtonPressed.innerHTML = "Play";
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
  } else {
    console.log("Speech Synthesis API is not supported in this browser.");
  }
})();
