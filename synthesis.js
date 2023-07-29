(function () {
  if ("speechSynthesis" in window) {
    const synth = window.speechSynthesis;
    const utterThis = new SpeechSynthesisUtterance("Default text");
    let unfinishedCode = false;
    let lastButtonPressed = null;
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
    // ------- button event listeners
    document
      .getElementById("clickable_1")
      .addEventListener("click", async (e) => {
        if (unfinishedCode) {
          console.log(
            "Clicked too fast. stateHandler hasn't run every command yet. Ignoring the click event."
          );
          return;
        }
        await stateHandler(
          e.target,
          document.getElementById("heading_1").innerHTML +
            ". " +
            document.getElementById("paragraph_1").innerHTML
        );
      });

    document
      .getElementById("clickable_2")
      .addEventListener("click", async (e) => {
        if (unfinishedCode) {
          console.log(
            "Clicked too fast. stateHandler hasn't run every command yet. Ignoring the click event."
          );
          return;
        }
        await stateHandler(
          e.target,
          document.getElementById("heading_2").innerHTML +
            ". " +
            document.getElementById("paragraph_2").innerHTML
        );
      });

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
