"use strict";

import { findUpperBoundTimeIndex } from "./detail/utility.js";
import { AnimationController } from "./detail/animation_controller.js";
import { MediaController } from "./detail/media_controller.js";
import { MusicPlot } from "./detail/music_plot.js";
import { Preprocessor } from "./detail/preprocessor.js";

{
  // start scope

  // localhost:8000

  //let csvFileName = "SevenNationArmy.csv"
  let spotify_id = window.location.pathname.split("/")[2];

  //let mediaName = "SevenNationArmy.mp3"
  let mediaName = `../static/data/${spotify_id}.mp3`;

  //------------------------------------------------------------
  //------------------------------------------------------------
  window.addEventListener("load", event => {
    let myBtn = document.querySelector("#start");
    myBtn.disabled = true;

    const mediaC = new MediaController(mediaName);
    mediaC.mediaEle.addEventListener("canplaythrough", event => {
      myBtn.disabled = false;
    });

    const prep = new Preprocessor();
    const musicPlot = new MusicPlot();
    const ac = new AnimationController();
    musicPlot.preprocessor = prep;

    myBtn.addEventListener("click", event => {
      myBtn.textContent = "loading ...";

      // asynchronous function, returns immediately
      let temp = d3.csv(`/load_songdata/${spotify_id}`);

      // once the large csv file is loaded into memory
      temp.then(csvRawData => {
        myBtn.textContent = "loaded";

        prep.preprocess(csvRawData, ac.plotRefreshRate);

        musicPlot.initializePlot(csvRawData);
        ac.musicLengthText.textContent = musicPlot.totalMusicTimeInSec.toFixed(
          1
        );

        mediaC.mediaEle.play();

        function startAnalysis(timeStamp) {
          ac.update(timeStamp);

          let index = findUpperBoundTimeIndex(
            ac.timeElapsedInMillisec / 1000.0,
            csvRawData
          );
          let csvNewData = csvRawData.slice(0, index);

          // update plot at specified refresh rate
          if (ac.canPlayAnimation()) {
            musicPlot.updatePlot(csvNewData);
          }

          // play animation if music has not ended
          if (ac.timeElapsedInMillisec < musicPlot.totalMusicTimeInSec * 1000) {
            requestAnimationFrame(startAnalysis);
          } else {
            console.log("music plot:" + musicPlot.countIntervalMax);
            console.log("preprocessor: " + prep.countIntervalMax);
          }
        }

        window.requestAnimationFrame(startAnalysis);
      }); // end then()
    }); // end button addEventListener()
  }); // end window addEventListener()
} // end scope
