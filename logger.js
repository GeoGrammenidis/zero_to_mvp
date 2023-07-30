export default function customLogger(available = {}) {
  const colored = (
    {
      background,
      color = "#222",
      padding = "3px 6px",
      borderRadius = "4px",
      fontWeight = "600",
    },
    msg1,
    msg2 = ""
  ) => {
    console.log(
      `%c${msg1}`,
      `background-color:${background}; color:${color}; padding:${padding}; border-radius:${borderRadius}; font-weight:${fontWeight}`,
      msg2
    );
  };

  const logger = {
    info: (msg1, msg2) => colored({ background: "#0dcaf0" }, msg1, msg2),
    warn: (msg1, msg2) => colored({ background: "#fd7e14" }, msg1, msg2),
    err: (msg1, msg2) => colored({ background: "#dc3545" }, msg1, msg2),
    state: (msg1, msg2) =>
      colored({ background: "#1414e3", color: "#fff" }, `STATE:${msg1}`, msg2),
    dom: (msg1, msg2) =>
      colored({ background: "#b411bd", color: "#fff" }, `DOM:${msg1}`, msg2),
    synth: (msg1, msg2) =>
      colored({ background: "#10778f", color: "#fff" }, `SYNTH:${msg1}`, msg2),
    button: (msg1, msg2) =>
      colored({ background: "#048a31", color: "#fff" }, `BUTTON:${msg1}`, msg2),

    colored,
  };
  Object.keys(available).forEach((key) => {
    if (!available[key]) {
      logger[key] = () => {};
    }
  });

  // logger.info("logger", "Hello from logger");
  // logger.warn("logger", "Hello from logger");
  // logger.err("logger", "Hello from logger");
  // logger.state("logger", "Hello from logger");
  // logger.dom("logger", "Hello from logger");
  // logger.synth("logger", "Hello from logger");
  // logger.button("logger", "Hello from logger");

  return {
    logger,
  };
}
