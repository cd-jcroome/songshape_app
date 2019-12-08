"use strict";

(() => {
  const chartSpace = d3.select("#scroll");
  const width = d3.select("#universeGroup").attr("width");
  const height = d3.select("#universeGroup").attr("height");

  d3.json("/load_metadata", d => {
    data = d;
    return data;
  })
    .then(data => {
      data = data;
      drawStuff(data);
    })
    .catch(err => console.error(err));

  function drawStuff(data) {
    chartSpace.selectAll("#legendText").remove();
    chartSpace.selectAll("#aboutText").remove();
    chartSpace.selectAll("#universeText").remove();

    console.log(data.length);
    console.log(data);

    // create svg
    var svg = d3
      .select("#universeGroup")
      .append("svg")
      .attr("height", height)
      .attr("width", width)
      .append("g")
      .attr("transform", "translate(0,0)");

    // initiate ability to toggle between song, artist, genre views
    var selectBrowseType = d3.select("#browse-type").on("change", updateViz);

    // map each genre to a color
    var color = d3
      .scaleOrdinal()
      .domain([
        "Rock",
        "Pop",
        "Country",
        "Indie",
        "Funk",
        "Folk",
        "Rap",
        "R&B",
        "Classical",
        "Jazz"
      ])
      .range([
        "gold",
        "lightgreen",
        "red",
        "orange",
        "purple",
        "green",
        "blue",
        "pink",
        "lightblue",
        "navy"
      ]);

    // initialize dynamic data & variables
    var display_data;
    var browseType;

    // this is for onclick "artist/genre to song" drill-down
    var song_filter = false;

    // draw viz for the first time (song view)
    updateViz();

    // groupSong();

    // groupGenre();

    // groupArtist();

    function updateViz() {
      // get user's "browse by" selection
      if (song_filter == false) {
        browseType = selectBrowseType.property("value");
      } else {
        browseType = "song";
      }

      console.log(browseType);
      console.log(display_data);

      var radius = d3.scaleSqrt();

      // initialize force simulation
      var simulation = d3
        .forceSimulation()
        .force("x", d3.forceX(width / 2).strength(0.05))
        .force("y", d3.forceY(height / 2).strength(0.05))
        .force(
          "collide",
          d3.forceCollide(function(d) {
            return radius(d.value) + 5;
          })
        );

      // intialize tooltips for song labels on hover
      var tooltip = d3
        .select("#universeGroup")
        .append("div")
        .style("opacity", 0)
        .style("position", "absolute")
        .attr("class", "tooltip")
        .style("background-color", "black")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("color", "white");

      // create tooltip functions
      var showTooltip = function(d) {
        tooltip.style("opacity", 1).html(d.key);
      };
      var moveTooltip = function(d) {
        tooltip
          .style("left", d3.mouse(this)[0] + 30 + "px")
          .style("top", d3.mouse(this)[1] + 30 + "px");
      };
      var hideTooltip = function(d) {
        tooltip.style("opacity", 0);
      };

      // user toggle among rollup views
      if (browseType == "song") {
        // group data by song
        var song = d3
          .nest()
          .key(function(d) {
            return `${d["track"]["name"]}, by ${d["artist"][0]["name"]}`;
          })
          .rollup(function(v) {
            return v.length;
          })
          .entries(data);

        display_data = song;

        // scale radius (constant for song view)
        radius.domain([1, 2]).range([20, 20]);
      } else if (browseType == "artist") {
        // group data by artist
        var artist = d3
          .nest()
          .key(function(d) {
            return d["artist"][0]["name"];
          })
          .rollup(function(v) {
            return v.length;
          })
          .entries(data);

        console.log(artist);
        console.log(artist.length);

        display_data = artist;

        // scale radius by artist group size
        radius
          .domain(
            d3.extent(artist, d => {
              return d.value;
            })
          )
          .nice()
          .range([20, 100]);
      } else {
        // group data by genre
        var genre = d3
          .nest()
          .key(function(d) {
            return d["artist"][0]["genres"][0];
          })
          .rollup(function(v) {
            return v.length;
          })
          .entries(data);

        console.log(genre);
        console.log(genre.length);

        display_data = genre;

        // scale radius by genre group size
        radius
          .domain(
            d3.extent(genre, d => {
              return d.value;
            })
          )
          .nice()
          .range([20, 100]);
      }

      // call force simulation
      simulation.nodes(display_data).on("tick", ticked);

      // ticked function drives movement of circles across svg
      function ticked() {
        circles
          .attr("cx", function(d) {
            return d.x;
          })
          .attr("cy", function(d) {
            return d.y;
          });
      }

      // append bubbles to svg
      var circles = svg
        .selectAll(".bubble")
        .data(display_data)
        .join(
          enter =>
            enter
              .append("circle")
              .attr("class", "bubble")
              .attr("r", function(d) {
                return radius(d.value);
              })
              .attr("fill", d => {
                if (browseType == "song") {
                  return "purple";
                } else if (browseType == "artist") {
                  return "gold";
                } else {
                  return "lightblue";
                }
              }),
          update =>
            update
              .attr("r", function(d) {
                return radius(d.value);
              })
              .attr("fill", d => {
                if (browseType == "song") {
                  return "purple";
                } else if (browseType == "artist") {
                  return "gold";
                } else {
                  return "lightblue";
                }
              }),
          exit => exit.remove()
        );

      // hover functionality
      circles
        .on("mouseover", showTooltip)
        .on("mousemove", moveTooltip)
        .on("mouseleave", hideTooltip);

      // click functionality
      circles.on("click", d => {
        if (browseType == "artist") {
          display_data = data.filter(v => {
            return d.key == v.artist;
          });

          console.log(display_data);

          song_filter = true;

          updateViz(display_data);
        }
        if (browseType == "genre") {
          display_data = data.filter(v => {
            return d.key == v.genre;
          });

          console.log(display_data);

          song_filter = true;

          updateViz(display_data);
        } else {
          // browseType == "song"
          // click out to detailed viz
        }
      });

      //       // user toggle among sorting options within song view
      // if (browseType == "song") {

      // 	var all_data = data;
      // 	// console.log(all_data);

      // 	// initiate ability to toggle between sorting categories
      // 	var selectSortType = d3.select("#sort-type").on("change", updateSort);

      // 	updateSort();
      // }

      // function updateSort () {

      // 	// get user's "sort by" selection
      // 	var sortType = selectSortType.property("value");

      // 	//

      // 	if (sortType == "acousticness") {

      // 		console.log(sortType);

      // 	}

      // 	else if (sortType == "danceability") {

      // 		console.log(sortType);

      // 	}

      // 	else if (sortType == "liveliness") {

      // 		console.log(sortType);

      // 	}

      // 	else if (sortType == "tempo") {

      // 		console.log(sortType);

      // 	}

      // 	else { //sortType == "default"
      // 		console.log(sortType);

      // 	}

      // }
    }

    ////////////// SEPARATE FUNCTIONS //////////////
    ////////////////// not in use //////////////////

    function groupSong() {
      // create force simulation
      // bubbles move to center of svg without colliding
      var simulation = d3
        .forceSimulation()
        .force("x", d3.forceX(width / 2).strength(0.05))
        .force("y", d3.forceY(height / 2).strength(0.05))
        .force("collide", d3.forceCollide(25));

      // intialize tooltips for song labels on hover
      var tooltip = d3
        .select("#universeGroup")
        .append("div")
        .style("opacity", 0)
        .style("position", "absolute")
        .attr("class", "tooltip")
        .style("background-color", "black")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("color", "white");

      // create tooltip functions
      var showTooltip = function(d) {
        tooltip.style("opacity", 1).html(d.song + " &#9679 " + d.artist);
      };
      var moveTooltip = function(d) {
        tooltip
          .style("left", d3.mouse(this)[0] + 30 + "px")
          .style("top", d3.mouse(this)[1] + 30 + "px");
      };
      var hideTooltip = function(d) {
        tooltip.style("opacity", 0);
      };

      // append bubbles to svg
      // colored by genre
      var circles = svg
        .selectAll(".bubble")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "bubble")
        //.merge(circles)
        .attr("r", 20)
        .style("fill", function(d) {
          return color(d.genre);
        })
        .on("mouseover", showTooltip)
        .on("mousemove", moveTooltip)
        .on("mouseleave", hideTooltip);

      circles.exit().remove();

      // call force simulation
      simulation.nodes(data).on("tick", ticked);

      // ticked function drives movement of circles across svg
      function ticked() {
        circles
          .attr("cx", function(d) {
            return d.x;
          })
          .attr("cy", function(d) {
            return d.y;
          });
      }
    }

    function groupGenre() {
      // group data by genre
      var genre = d3
        .nest()
        .key(function(d) {
          return d["artist"][0]["genres"][0];
        })
        .rollup(function(v) {
          return v.length;
        })
        .entries(data);

      console.log(genre);

      // scale radius by genre size
      var radius = d3
        .scaleSqrt()
        .domain(
          d3.extent(genre, d => {
            return d.value;
          })
        )
        .nice()
        .range([30, 100]);

      // create force simulation
      // bubbles move to center of svg without colliding
      var simulation = d3
        .forceSimulation()
        .force("x", d3.forceX(width / 2).strength(0.05))
        .force("y", d3.forceY(height / 2).strength(0.05))
        .force(
          "collide",
          d3.forceCollide(function(d) {
            return radius(d.value) + 5;
          })
        );

      // var genre_songs = data;

      // append bubbles to svg
      // colored by genre and scaled by song count
      var circles = svg
        .selectAll(".bubble")
        .data(genre)
        .enter()
        .append("circle")
        .attr("class", "bubble")
        .attr("r", function(d) {
          return radius(d.value);
        })
        .style("fill", function(d) {
          return color(d.key);
        })
        .on("click", function(d) {
          genre_songs = data.filter(function(v) {
            console.log(v.genre);

            return v.genre == d.data.key;
          });

          console.log(d.data.key);

          // groupSong(genre_songs);
        });

      console.log(circles);

      // append genre labels to svg
      var text = svg
        .selectAll("text")
        .data(genre)
        .enter()
        .append("text")
        .text(bubble => bubble.key)
        .style("text-anchor", "middle")
        .style("fill", "white");

      // call force simulation
      simulation.nodes(genre).on("tick", ticked);

      // ticked function drives movement of circles & label text across svg
      function ticked() {
        circles
          .attr("cx", function(d) {
            return d.x;
          })
          .attr("cy", function(d) {
            return d.y;
          });
        text
          .attr("x", function(d) {
            return d.x;
          })
          .attr("y", function(d) {
            return d.y;
          });
      }
    }

    function groupArtist() {
      // group data by artist
      var artist = d3
        .nest()
        .key(function(d) {
          return d.artist;
        })
        .rollup(function(v) {
          return v.length;
        })
        .entries(data);

      console.log(artist);
      console.log(artist.length);

      // scale radius by artist group size
      var radius = d3
        .scaleSqrt()
        .domain(
          d3.extent(artist, d => {
            return d.value;
          })
        )
        .nice()
        .range([20, 60]);

      // create force simulation
      // bubbles move to center of svg without colliding
      var simulation = d3
        .forceSimulation()
        .force("x", d3.forceX(width / 2).strength(0.05))
        .force("y", d3.forceY(height / 2).strength(0.05))
        .force(
          "collide",
          d3.forceCollide(function(d) {
            return radius(d.value) + 5;
          })
        );

      // intialize tooltips for artist labels on hover
      var tooltip = d3
        .select("#universeGroup")
        .append("div")
        .style("opacity", 0)
        .style("position", "absolute")
        .attr("class", "tooltip")
        .style("background-color", "black")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("color", "white");

      // create tooltip functions
      var showTooltip = function(d) {
        tooltip.style("opacity", 1).html(d.key);
      };
      var moveTooltip = function(d) {
        tooltip
          .style("left", d3.mouse(this)[0] + 30 + "px")
          .style("top", d3.mouse(this)[1] + 30 + "px");
      };
      var hideTooltip = function(d) {
        tooltip.style("opacity", 0);
      };

      // append bubbles to svg
      var circles = svg
        .selectAll(".bubble")
        .data(artist)
        .enter()
        .append("circle")
        .attr("class", "bubble")
        .attr("r", function(d) {
          return radius(d.value);
        })
        .style("fill", "lightgray")
        .on("mouseover", showTooltip)
        .on("mousemove", moveTooltip)
        .on("mouseleave", hideTooltip);

      // call force simulation
      simulation.nodes(artist).on("tick", ticked);

      // ticked function drives movement of circles across svg
      function ticked() {
        circles
          .attr("cx", function(d) {
            return d.x;
          })
          .attr("cy", function(d) {
            return d.y;
          });
      }
    }

    ////////////////////////////////////////////////
  }
})();
