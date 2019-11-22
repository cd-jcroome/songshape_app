// Placeholder viz for Ning's work

"use strict";
(() => {
  const chartSpace = d3.select("#chart");
  const spotify_id = this.location.pathname.replace("/detail/", "");

  let notes = [];

  d3.csv(`/load_songdata/${spotify_id}`, d => {
    notes = d;
    return notes;
  })
    .then(notes => {
      console.log(notes);
    })
    .catch(err => console.error(err));
})();
