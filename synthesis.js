(function () {
  if ("speechSynthesis" in window) {
    const synth = window.speechSynthesis;
    synth.onvoiceschanged = () => {
      document.getElementById("clickable_1").addEventListener("click", (e) => {
        const textMessage =
          document.getElementById("heading_1").innerHTML +
          ". " +
          document.getElementById("paragraph_1").innerHTML;
        console.log(textMessage);
        const utterThis = new SpeechSynthesisUtterance(textMessage);

        utterThis.voice = synth
          .getVoices()
          .find((voice) => voice.name === "Google UK English Male");

        // pitch and rate are optional
        utterThis.pitch = 1;
        utterThis.rate = 1;

        synth.speak(utterThis);
      });
      document.getElementById("clickable_2").addEventListener("click", (e) => {
        const textMessage =
          document.getElementById("heading_2").innerHTML +
          ". " +
          document.getElementById("paragraph_2").innerHTML;
        console.log(textMessage);
        const utterThis = new SpeechSynthesisUtterance(textMessage);

        utterThis.voice = synth
          .getVoices()
          .find((voice) => voice.name === "Google UK English Male");

        // pitch and rate are optional
        utterThis.pitch = 1;
        utterThis.rate = 1;
        synth.speak(utterThis);
      });
    };
  } else {
    console.log("Speech Synthesis API is not supported in this browser.");
  }
})();
