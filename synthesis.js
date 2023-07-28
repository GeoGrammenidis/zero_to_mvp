(function () {
  let updateState = (synth, message, paused = false) => {
    // synth.paused wasn't used because there is an issue in crhome with it.
    if (paused) {
      document.getElementById("state").innerHTML = "paused";
    } else if (synth.speaking) {
      document.getElementById("state").innerHTML = "speaking";
    } else if (synth.pending) {
      document.getElementById("state").innerHTML = "loading";
    } else {
      document.getElementById("state").innerHTML = "no state";
    }
    console.log(message);
  };

  if ("speechSynthesis" in window) {
    const synth = window.speechSynthesis;
    const utterThis = new SpeechSynthesisUtterance("Default text");

    // ------- button event listeners
    document.getElementById("clickable_1").addEventListener("click", () => {
      utterThis.text =
        document.getElementById("heading_1").innerHTML +
        ". " +
        document.getElementById("paragraph_1").innerHTML;
      synth.speak(utterThis);
    });

    document.getElementById("clickable_2").addEventListener("click", () => {
      utterThis.text =
        document.getElementById("heading_2").innerHTML +
        ". " +
        document.getElementById("paragraph_2").innerHTML;
      synth.speak(utterThis);
    });

    document.getElementById("pause_button").addEventListener("click", () => {
      synth.pause();
      console.log(`Speech paused after ??? seconds.`);
      updateState(synth, "state changed in pause_button click event", true);
    });

    document.getElementById("resume_button").addEventListener("click", () => {
      synth.resume();
      console.log(`Speech paused after ??? seconds.`);
      updateState(synth, "state changed in resume_button click event");
    });

    document.getElementById("cancel_button").addEventListener("click", () => {
      synth.cancel();
    });

    // synth events
    synth.onvoiceschanged = () => {
      console.log("On voiceschanged fired.");
      utterThis.voice = synth
        .getVoices()
        .find((voice) => voice.name === "Google UK English Male");
      utterThis.pitch = 1;
      utterThis.rate = 1.2;
      updateState(synth, "state changed in onvoiceschanged");
    };

    utterThis.onstart = () => {
      console.log("Speech started.");
      updateState(synth, "state changed in onstart");
    };

    utterThis.onend = () => {
      console.log("Speech ended.");
      updateState(synth, "state changed in oneend");
    };

    utterThis.onerror = (event) => {
      console.error("Error occurred:", event.error);
      updateState(synth, "state changed in onerror");
    };

    // won't be used. Issue on chrome, event never fired.
    // utterThis.onpause = (event) => {
    //   console.log(`Speech paused after ${event.elapsedTime} seconds.`);
    //   updateState(synth, "state changed in onpause");
    // };

    // won't be used. Issue on chrome, event never fired.
    // utterThis.onresume = (event) => {
    //   console.log(`Speech paused after ${event.elapsedTime} seconds.`);
    //   updateState(synth, "state changed in onresume");
    // };

    // won't be used. Issue on chrome, event never fired.
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
