"use strict";

(() => {
  const chartSpace = d3.select("#bubblesGroup");

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
    let bubbleManager = new BubbleManager();
    bubbleManager.initialize();

    //------------------------------------------------------------
    //------------------------------------------------------------
    function BubbleManager() {
      // first, declare the data
      this.rawData = data;
      console.log(this.rawData);
      // define svg width and height
      this.width = d3.select("#bubblesGroup").attr("width");
      this.height = d3.select("#bubblesGroup").attr("height");

      this.radius = null;

      this.svg = null;

      this.selectBrowseType = null;
      this.selectSortType = null;

      this.color = null;
      this.colorTemp = null;

      // initialize dynamic data & variables
      // each object in this.display_data has the following data subset
      //     key: used to uniquely identify the current data
      //     value: used to determine the bubble radius
      //     index
      //     x: positiion x component
      //     y: positiion y component
      //     vx: velocity x component
      //     vy: velocity y component
      // where index, x, y, vx, vy are automatically added by d3's simulation.nodes()
      this.display_data = null;
      this.browseType = null;
      this.sortType = null;

      // this is for onclick "artist/genre to song" drill-down
      this.song_filter = false;

      // this is to allow or block a clickthrough to detail
      this.clickThrough = true;

      this.circles = null;

      this.simulation = null;

      this.tooltip = null;

      this.radiusKey = null;

      // create tooltip functions
      this.showTooltip = d => {
        this.tooltip
          .style("opacity", 1)
          .html(
            this.browseType == "song"
              ? `${d.key.split("_")[1]}, by ${d.key.split("_")[2]}`
              : this.browseType == "artist"
              ? d.key.split("_")[0]
              : d.key
          );
      };

      this.moveTooltip = d => {
        let coord = d3.mouse(document.body);
        this.tooltip
          .style("left", coord[0] + 30 + "px")
          .style("top", coord[1] + 30 + "px");
      };

      this.hideTooltip = d => {
        this.tooltip.style("opacity", 0);
      };

      //------------------------------------------------------------
      //------------------------------------------------------------
      this.initialize = () => {
        // console.log(this.rawData.length);
        // console.log(this.rawData);

        // reload page when clicking the button
        d3.select("#reloadButton").on("click", () => {
          // reload the current page without the browser cache
          window.location.reload(true);
        });

        // create svg
        this.svg = d3
          .select("#bubblesGroup")
          .append("svg")
          .attr("height", this.height)
          .attr("width", this.width)
          .append("g")
          .attr("transform", "translate(0,0)");

        // initialize ability to toggle between song, artist, genre views
        // whenever browse type is explicitly toggled, reset this.display_data to this.rawData
        this.selectBrowseType = d3.select("#browse-type").on("change", d => {
          this.song_filter = false;
          this.display_data = this.rawData;
          this.updateViz();
        });

        this.selectSortType = d3.select("#sort-type").on("change", d => {
          this.song_filter = false;
          this.display_data = this.rawData;
          this.updateViz();
        });

        // map each genre to a color
        var lookup = {};
        var genreArray = [];

        for (var item, i = 0; (item = this.rawData[i++]); ) {
          var name = item["artist"][0]["genres"][0];

          if (!(name in lookup)) {
            lookup[name] = 1;
            genreArray.push(name);
          }
        }
        var genreIndexArray = [];
        // map the genre index to a matching array, for the range in the color scale.
        for (i = 0; i < genreArray.length; i++) {
          genreIndexArray.push(i / genreArray.length);
        }
        this.color = d3.scaleSequential(d3.interpolateRainbow);

        this.genreScale = d3
          .scaleOrdinal()
          .domain(genreArray)
          .range(genreIndexArray);

        // initialize dynamic data & variables
        this.display_data = this.rawData;

        // initialize song filter boolean
        this.song_filter = false;

        // draw viz for the first time (song view)
        this.updateViz();
      };

      //------------------------------------------------------------
      //------------------------------------------------------------
      this.updateViz = () => {
        this.radius = d3.scaleLinear();

        // get user's "browse by" selection
        if (this.song_filter === false) {
          this.browseType = this.selectBrowseType.property("value");
        } else {
          this.browseType = "song";
        }

        // get user's "sort by" selection
        // NOTE: Only when "sort by" is set to "default" is
        // "browse by" selection honored. In all other cases where
        // "sort by" is non-default, "browse by" selection is ignored!

        // user toggle among rollup views
        if (this.browseType == "song") {
          if (this.song_filter === false) {
            this.display_data = this.deepCopyRawData();
          }
          // this.display_data = this.rawData;

          // group data by song
          let song = d3
            .nest()
            .key(d => {
              return (
                d["track"]["id"] +
                "_" +
                d["track"]["name"] +
                "_" +
                d["artist"][0]["name"] +
                "_" +
                d["artist"][0]["genres"][0] +
                "_" +
                d["track"]["preview_url"]
              );
            })
            .sortKeys(d3.ascending)
            .rollup(function(leaves) {
              return {
                score: d3.mean(leaves, function(d) {
                  let sortType = d3.select("#sort-type").property("value");

                  if (sortType == "Acousticness") {
                    return d["af_data"][0]["acousticness"];
                  } else if (sortType == "Danceability") {
                    return d["af_data"][0]["danceability"];
                  } else if (sortType == "Liveness") {
                    return d["af_data"][0]["liveness"];
                  } else if (sortType == "Happiness") {
                    return d["af_data"][0]["valence"];
                  } else if (sortType == "Energy") {
                    return d["af_data"][0]["energy"];
                  } else if (sortType == "Tempo") {
                    return d["af_data"][0]["tempo"];
                  } else if (sortType == "Loudness") {
                    return d["af_data"][0]["loudness"];
                  } else if (sortType == "Speechiness") {
                    return d["af_data"][0]["speechiness"];
                  } else {
                    return d["track"]["popularity"] / 100;
                  }
                })
              };
            })
            .entries(this.display_data);

          // console.log(artist.length);

          this.display_data = song;

          // scale radius (constant for song view)
          this.radius.domain([1, 1]).range([0.5, 0.5]);
        } else if (this.browseType == "artist") {
          this.display_data = this.rawData;

          // group data by artist
          let artist = d3
            .nest()
            .key(d => {
              return d["artist"][0]["name"] + "_" + d["artist"][0]["genres"][0];
            })
            .sortKeys(d3.ascending)
            .rollup(function(leaves) {
              return {
                score: d3.mean(leaves, function(d) {
                  let sortType = d3.select("#sort-type").property("value");

                  if (sortType == "Acousticness") {
                    return d["af_data"][0]["acousticness"];
                  } else if (sortType == "Danceability") {
                    return d["af_data"][0]["danceability"];
                  } else if (sortType == "Liveness") {
                    return d["af_data"][0]["liveness"];
                  } else if (sortType == "Happiness") {
                    return d["af_data"][0]["valence"];
                  } else if (sortType == "Energy") {
                    return d["af_data"][0]["energy"];
                  } else if (sortType == "Tempo") {
                    return d["af_data"][0]["tempo"];
                  } else if (sortType == "Loudness") {
                    return d["af_data"][0]["loudness"];
                  } else if (sortType == "Speechiness") {
                    return d["af_data"][0]["speechiness"];
                  } else {
                    return d["track"]["popularity"] / 100;
                  }
                }),
                size: leaves.length
              };
            })
            .entries(this.display_data);

          // console.log(artist.length);

          this.display_data = artist;

          // scale radius by artist group size
          this.radius
            .domain(
              d3.extent(artist, d => {
                return d["value"]["size"];
              })
            )
            .nice()
            .range([0.5, 10]);
        } else {
          // this.browseType == "genre"

          // group data by genre
          let genre = d3
            .nest()
            .key(d => {
              return d["artist"][0]["genres"][0];
            })
            .sortKeys(d3.ascending)
            .rollup(function(leaves) {
              return {
                score: d3.mean(leaves, function(d) {
                  let sortType = d3.select("#sort-type").property("value");

                  if (sortType == "Acousticness") {
                    return d["af_data"][0]["acousticness"];
                  } else if (sortType == "Danceability") {
                    return d["af_data"][0]["danceability"];
                  } else if (sortType == "Liveness") {
                    return d["af_data"][0]["liveness"];
                  } else if (sortType == "Happiness") {
                    return d["af_data"][0]["valence"];
                  } else if (sortType == "Energy") {
                    return d["af_data"][0]["energy"];
                  } else if (sortType == "Tempo") {
                    return d["af_data"][0]["tempo"];
                  } else if (sortType == "Loudness") {
                    return d["af_data"][0]["loudness"];
                  } else if (sortType == "Speechiness") {
                    return d["af_data"][0]["speechiness"];
                  } else {
                    return d["track"]["popularity"] / 100;
                  }
                }),
                size: leaves.length
              };
            })
            .entries(this.display_data);

          // console.log(genre.length);

          this.display_data = genre;

          // scale radius by genre group size
          this.radius
            .domain(
              d3.extent(genre, d => {
                return d["value"]["size"];
              })
            )
            .nice()
            .range([0.5, 10]);
        }

        // remove all existing tooltips
        d3.selectAll(".tooltip").remove();

        // initialize tooltips for song labels on hover
        this.tooltip = d3
          .select("#bubblesGroup")
          .append("div")
          .style("opacity", 0)
          .style("position", "absolute")
          .attr("class", "tooltip")
          .style("background-color", "black")
          .style("border-radius", "5px")
          .style("padding", "10px")
          .style("color", "white");

        // remove all existing bubbles
        this.svg.selectAll(".bubble").remove();

        // append bubbles to svg
        this.circles = this.svg
          .selectAll(".bubble")
          .data(this.display_data)
          .join(
            enter =>
              enter
                .append("circle")
                .attr("class", "bubble")
                .attr("r", d => {
                  return this.browseType == "song"
                    ? this.radius(1) + "vw"
                    : this.radius(d["value"]["size"]) + "vw";
                })
                .attr("fill", (d, i) => {
                  if (this.browseType == "song") {
                    let genreName = d.key.split("_")[3];
                    return this.color(this.genreScale(genreName));
                  } else if (this.browseType == "artist") {
                    let genreName = d.key.split("_")[1];
                    return this.color(this.genreScale(genreName));
                  } // this.browseType == "genre"
                  else {
                    let genreName = d["key"];
                    return this.color(this.genreScale(genreName));
                  }
                })
                .attr("stroke", d => {
                  if (this.browseType == "song") {
                    return d.key.split("_")[4] !== "null" ? "white" : "none";
                  } else "none";
                }),
            update =>
              update.attr("r", d => {
                return this.browseType == "song"
                  ? this.radius(1) + "vw"
                  : this.radius(d["value"]["size"]) + "vw";
              }),
            exit => exit.remove()
          );
        // hover functionality
        this.circles
          .on("mouseenter", this.showTooltip)
          .on("mousemove", this.moveTooltip)
          .on("mouseleave", this.hideTooltip);

        // click functionality
        this.circles.on("click", d => {
          let browseType = this.browseType;
          if (browseType == "artist") {
            this.display_data = this.rawData.filter(v => {
              return d.key.split("_")[0] == v["artist"][0]["name"];
            });

            for (let i = 0; i < this.display_data.length; ++i) {
              this.display_data[i]["value"] = 1.0;
              this.display_data[i]["key"] = this.display_data[i]["song"];
            }

            this.song_filter = true;
            this.clickThrough = false;

            this.updateViz();

            this.clickThrough = true;
          }
          if (browseType == "genre") {
            this.display_data = this.rawData.filter(v => {
              return d.key == v["artist"][0]["genres"][0];
            });

            for (let i = 0; i < this.display_data.length; ++i) {
              this.display_data[i]["value"] = 1.0;
              this.display_data[i]["key"] = this.display_data[i]["track"][
                "name"
              ];
            }

            this.song_filter = true;
            this.clickThrough = false;

            this.updateViz();

            this.clickThrough = true;
          } else if (browseType == "song") {
            window.location = `https://open.spotify.com/track/${d["key"].split("_")[0]}`;
          }
        });

        const xScale = d3
          .scaleLinear()
          .domain([
            d3.min(this.display_data, d => {
              return d["value"]["score"];
            }),
            d3.max(this.display_data, d => {
              return d["value"]["score"];
            })
          ])
          .range([this.width * 0.1, this.width * 0.9]);

        var xAxis = d3.axisTop(xScale).ticks(0);

        // axis labels-----------------------------------------------
        d3.selectAll(".xAxis").remove();
        this.svg
          .append("g")
          .attr("class", "xAxis")
          .attr("transform", "translate(0," + this.height / 1.5 + ")")
          .call(xAxis);

        this.svg
          .append("text")
          .text("Less")
          .attr("class", "xAxis labels")
          .attr("text-anchor", "middle")
          .attr("font-size", "14px")
          .attr("fill", "white")
          .attr(
            "x",
            xScale(
              d3.min(this.display_data, d => {
                return d["value"]["score"];
              })
            )
          )
          .attr("y", this.height / 1.5 + 25);

        this.svg
          .append("text")
          .text("More")
          .attr("class", "xAxis labels")
          .attr("text-anchor", "middle")
          .attr("font-size", "14px")
          .attr("fill", "white")
          .attr(
            "x",
            xScale(
              d3.max(this.display_data, d => {
                return d["value"]["score"];
              })
            )
          )
          .attr("y", this.height / 1.5 + 25);

        this.svg
          .append("text")
          .text(d3.select("#sort-type").property("value"))
          .attr("text-anchor", "middle")
          .attr("font-size", "30px")
          .attr("fill", "white")
          .attr("class", "xAxis labels")
          .attr("x", this.width / 2)
          .attr("y", this.height / 3 + 25);

        // initialize force simulation
        this.simulation = d3
          .forceSimulation()
          .force(
            "x",
            d3
              .forceX(function(d) {
                return xScale(d["value"]["score"]);
              })
              .strength(0.05)
          )
          .force("y", d3.forceY(this.height * 0.5).strength(0.05))
          .force(
            "collide",
            d3.forceCollide(d => {
              // responsive width (equivalent of having "vw" instead of "px")
              return this.browseType == "song"
                ? (this.radius(0.5) / 100) * this.width + 5
                : (this.radius(d["value"]["size"]) / 100) * this.width + 5;
            })
          );

        const yBaseline = this.height * 0.8;

        // call force simulation
        this.simulation.nodes(this.display_data).on("tick", d => {
          this.circles
            .attr("cx", d => {
              return d.x;
            })
            .attr("cy", d => {
              return d.y;
            });
        });
      };

      this.deepCopyRawData = () => {
        // javascript's Array.sort() method performs sorting
        // "in place", which is too intrusive. to avoid
        // meddling with this.rawData, here Array.sort()
        // is only applied to a deep copy.

        let deepCopy = JSON.parse(JSON.stringify(this.rawData));

        if (this.sortType == "default" && this.browseType == "song") {
          // for each element in deepCopy
          // add a "value" property whose value equals 1.0
          // add a "key" property whose value equals song name
          for (let i = 0; i < deepCopy.length; ++i) {
            deepCopy[i]["value"] = 1.0;
            deepCopy[i]["key"] = deepCopy[i]["song"];
          }
        } else if (this.sortType != "default") {
          // for each element in deepCopy
          // add a "value" property whose value equals this.sortType
          // add a "key" property whose value equals song name
          for (let i = 0; i < deepCopy.length; ++i) {
            deepCopy[i]["value"] = deepCopy[i][this.sortType];
            deepCopy[i]["key"] = deepCopy[i]["song"];
          }

          // reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
          // sort deepCopy "in place" in ascending order
          deepCopy.sort((a, b) => {
            if (a[this.sortType] < b[this.sortType]) {
              return -1;
            }

            if (a[this.sortType] > b[this.sortType]) {
              return 1;
            }

            // a must be equal to b
            return 0;
          });
        } else {
          throw new Error(
            "SHOULD NOT CALL this.deepCopyRawData() IN OTHER CONDITIONS"
          );
        }

        return deepCopy;
      };
    }
  }
})();
