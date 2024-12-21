import React, { useEffect } from "react";

function Godot() {
  useEffect(() => {
    let script1, script2;

    // Create and load pong.js
    script1 = document.createElement("script");
    script1.src = "/godot/pong.js";
    script1.async = false;

    // Create pong_main.js but only load it after pong.js is loaded
    script1.onload = () => {
      script2 = document.createElement("script");
      script2.src = "/godot/pong_main.js";
      script2.async = false;
      document.body.appendChild(script2);
    };

    document.body.appendChild(script1);

    // // Cleanup function
    // return () => {
    //   if (script1 && document.body.contains(script1)) {
    //     document.body.removeChild(script1);
    //   }
    //   if (script2 && document.body.contains(script2)) {
    //     document.body.removeChild(script2);
    //   }
    // };
  }, []);

  return (
    <div className="Godot">
      <canvas id="canvas">
        Your browser does not support the canvas tag.
      </canvas>

      <noscript>
        Your browser does not support JavaScript.
      </noscript>

      <div id="status">
        <img id="status-splash" src="pong.png" alt="" />
        <progress id="status-progress"></progress>
        <div id="status-notice"></div>
      </div>
    </div>
  );
}

export default Godot;
