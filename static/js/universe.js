// Placeholder viz for Rachel's work.

"use strict";
(() => {
  const chartSpace = d3.select("#scroll");

  d3.json("/load_metadata", d => {
    console.log(d);
    allSongs = d["songs"];
    return allSongs;
  })
    .then(allSongs => {
      allSongs = allSongs["songs"];
      drawStuff(allSongs);
    })
    .catch(err => console.error(err));

  function drawStuff(allSongs) {
    chartSpace.selectAll("#legendText").remove();
    chartSpace.selectAll("#aboutText").remove();
    chartSpace.selectAll("#universeText").remove();

    console.log(allSongs);

    let songs = d3
      .select("#universeGroup")
      .selectAll("text")
      .data(allSongs)
      .enter()
      .append("text")
      .html(d => {
        return `<a href="/detail/${d["spotify_id"]}"
          </a>
          ${d["song_title"]}, by ${d["artist"]}`;
      });
  }
})();
