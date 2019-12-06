// Placeholder viz for Ning's work

"use strict";
(() => {
  const chartSpace = d3.select("#chart");
  const spotify_id = this.location.pathname.replace("/detail/", "");

  let song_data = [];

  d3.csv(`/load_songdata/${spotify_id}`, d => {
    song_data = d;
    return song_data;
  })
    .then(song_data => {
      console.log(song_data);
    })
    .catch(err => console.error(err));
})();
