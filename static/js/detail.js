"use strict";

import { findUpperBoundTimeIndex } from "./detail/utility.js";
import { AnimationController } from "./detail/animation_controller.js";
import { MediaController } from "./detail/media_controller.js";
import { MusicPlot } from "./detail/music_plot.js";
import { Preprocessor } from "./detail/preprocessor.js";

{
  // start scope

  // get the spotify id from the url
  let spotify_id = window.location.pathname.split("/")[2];
  // if possible, locate song
  let mediaName = "";

  //------------------------------------------------------------
  //------------------------------------------------------------
  window.addEventListener("load", event => {
    let myBtn = document.querySelector("#start");
    myBtn.disabled = true;

    const prep = new Preprocessor();
    const musicPlot = new MusicPlot();
    const ac = new AnimationController();
    musicPlot.preprocessor = prep;

    myBtn.textContent = "loading ...";

    // asynchronous function, returns immediately
    let temp = d3.csv(`/load_songdata/${spotify_id}`);
    // once the large csv file is loaded into memory
    temp.then(csvRawData => {
      let mediaName = `../static/data/${spotify_id}.mp3`;
      const mediaC = new MediaController(mediaName);
      mediaC.mediaEle.addEventListener("canplaythrough", event => {
        myBtn.disabled = false;
      });
      prep.preprocess(csvRawData, ac.plotRefreshRate);
      myBtn.textContent = "loaded";
      myBtn.addEventListener("click", event => {
        mediaC.mediaEle.play();
        musicPlot.initializePlot(csvRawData);

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
