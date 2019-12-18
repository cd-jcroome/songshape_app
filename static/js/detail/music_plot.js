import {findExtrema}             from './utility.js';
import {findMaxCountInterval}    from './utility.js';
import {pickColor}               from './utility.js';

//------------------------------------------------------------
//------------------------------------------------------------
export function MusicPlot()
{
    this.bSuppressPlot = false; // whether to skip plotting

    this.margin = {top: 10, right: 10, bottom: 10, left: 10};
    this.numNotes = 12;
    this.totalWidth = 470;
    this.totalHeight = 70;

    this.fullPlotWidth  = this.numNotes * this.totalHeight;
    this.fullPlotHeight = this.totalWidth + 100;
    this.width  = this.totalWidth  - this.margin.left - this.margin.right;
    this.height = this.totalHeight - this.margin.top  - this.margin.bottom;

    this.extrema = null;
    this.extremaCached = null;
    this.extremaInterval = null;

    this.countIntervalMax = 0.0;

    this.myData = null;

    this.xScale = null;
    this.yScale = null;
    this.xAxis  = null;
    this.yAxis  = null;
    this.areaGenerator = null;
    this.svgTop = null;
    this.mySvgs = null;
    this.myGroups = null;
    this.plotCollection = null;
    this.myText = null;

    this.preprocessor = null;

    // make this.numHalfGaussian * this.binSize = 0.5
    this.numHalfGaussian = 20;
    this.binSize = 0.5 / this.numHalfGaussian;
    this.numOctave = -1;
    this.numElementPerOctave = -1;

    this.totalMusicTimeInSec = 0.0;

    this.debugCounter = 0;

    this.colorWhenUpdated = "#000000";
    //this.colorWhenNotUpdated = "#f58231";

    this.octaveList = [];

    //------------------------------------------------------------
    // selectedData
    //     key
    //     values
    //         key
    //         value
    //
    // this.myData
    //     "noteName"
    //     "noteUpdated"
    //     "octaveList"
    //         "octaveMain"
    //         "countMain"
    //         "countMainCached"
    //         "countMainInterval"
    //         "octaveUpdated"
    //         "octaveData"
    //             "octavePoint"
    //             "count" --> accumulated count
    //             "countCached"
    //             "countInterval" --> count over small interval
    //------------------------------------------------------------
    this.initializeData = (selectedData) => {
        this.myData = new Array(selectedData.length).fill(null);

        // preallocate
        this.myData.forEach((d, i, dArraySelf) => {
            let dObj = {};
            dObj["noteName"] = selectedData[i].key;

            dObj["noteUpdated"] = false;

            let octaveList = new Array(this.numOctave).fill(null);
            octaveList.forEach((dd, j, ddArraySelf) => {
                let ddObj = {};

                ddObj["octaveMain"] = this.extrema.minOctave + j;
                ddObj["countMain"] = 0.0;
                ddObj["countMainCached"] = 0.0;
                ddObj["countMainInterval"] = 0.0;
                ddObj["octaveUpdated"] = false;

                let octaveData = new Array(this.numElementPerOctave).fill(null);
                octaveData.forEach((ddd, k, dddArraySelf) => {
                    let dddObj = {};

                    dddObj["octavePoint"] = ddObj["octaveMain"] + (k - this.numHalfGaussian) * this.binSize;
                    dddObj["count"] = 0.0;
                    dddObj["countCached"] = 0.0;
                    dddObj["countInterval"] = 0.0;

                    dddArraySelf[k] = dddObj;
                });

                ddObj["octaveData"] = octaveData;

                ddArraySelf[j] = ddObj;
            });

            dObj["octaveList"] = octaveList;

            dArraySelf[i] = dObj;
        });

        this.gaussianizeData(selectedData);

        // reset all counters
        this.myData.forEach((d, i, dSelfArray) => {
            d["octaveList"].forEach((dd, j, ddSelfArray) => {
                dd["countMain"] = 0.0;
                dd["countMainCached"] = 0.0;
                dd["countMainInterval"] = 0.0;
                dd["octaveData"].forEach((ddd) => {
                    ddd["countInterval"] = 0.0;
                    ddd["countCached"]   = 0.0;
                });
            });
        });
    };

    //------------------------------------------------------------
    // selectedData
    //     key
    //     values
    //         key
    //         value
    //
    // this.myData
    //     "noteName"
    //     "noteUpdated"
    //     "octaveList"
    //         "octaveMain"
    //         "countMain"
    //         "countMainCached"
    //         "countMainInterval"
    //         "octaveUpdated"
    //         "octaveData"
    //             "octavePoint"
    //             "count"
    //             "countInterval" --> count over small interval
    //------------------------------------------------------------
    this.gaussianizeData = (selectedData) => {
        // zero
        this.myData.forEach((d, i, dSelfArray) => {
            dSelfArray[i]["noteUpdated"] = false;
            d["octaveList"].forEach((dd, j, ddSelfArray) => {
                ddSelfArray[j]["octaveUpdated"] = false;
                dd["octaveData"].forEach((ddd) => {
                    ddd["count"] = 0.0;
                });
            });
        });

        // gaussianize
        selectedData.forEach((dSelected) => {
            let elRef = this.myData.find((dMy) => {
                return dMy["noteName"] == dSelected.key;
            });

            // according to Array.find(), if the target is not found, elRef is undefined
            if(elRef !== undefined)
            {
                dSelected.values.forEach((dx) => {
                    let elRef2 = elRef["octaveList"].find((ddMy) => {
                        return ddMy["octaveMain"].toString() == dx.key;
                    });

                    if(elRef2 !== undefined)
                    {
                        if(dx.value != elRef2["countMain"])
                        {
                            elRef2["octaveUpdated"] = true;
                        }

                        elRef2["countMainCached"] = elRef2["countMain"];
                        elRef2["countMain"] = dx.value;
                        elRef2["countMainInterval"] = elRef2["countMain"] - elRef2["countMainCached"];

                        let idx = 0;
                        for(let k = -this.numHalfGaussian; k <= this.numHalfGaussian; ++k)
                        {
                            let up = elRef2["octaveData"][idx]["octavePoint"] - elRef2["octaveMain"];
                            up = up * up;
                            const sigma = 0.15;
                            let down = 2.0 * sigma * sigma;
                            let temp = - up / down;
                            let currentCount = elRef2["countMain"] * Math.exp(temp);

                            elRef2["octaveData"][idx]["count"] = currentCount;
                            ++idx;
                        }

                    }
                });

                // the some() method tests whether at least one element in the array passes
                // the test implemented by the provided function. It returns a Boolean value.
                elRef["noteUpdated"] = elRef["octaveList"].some((d) => {
                    return d["octaveUpdated"];
                });
            }
        });

        // update countInterval and countCached
        this.myData.forEach((d, i, dSelfArray) => {
            d["octaveList"].forEach((dd, j, ddSelfArray) => {
                dd["octaveData"].forEach((ddd) => {
                    ddd["countInterval"] = ddd["count"] - ddd["countCached"];
                    ddd["countCached"] = ddd["count"];
                });
            });
        });
    };

    //------------------------------------------------------------
    //------------------------------------------------------------
    this.initializePlot = (csvRawData) => {
        // initialize plot
        // myData transforms data into the following form:
        // note_name --- octave --- count
        // both note_name and octave are sorted in ascending order
        let selectedData = d3.nest()
            .key((d) => { return d.note_name;}).sortKeys(d3.ascending)
            .key((d) => { return parseFloat(d.octave);}).sortKeys(d3.ascending)
            .rollup((leaves) => {
                return d3.sum(leaves, (d) => {
                    return d.magnitude;
                });
            })
            .entries(csvRawData);

        // get total music time
        this.totalMusicTimeInSec = parseFloat(csvRawData[csvRawData.length - 1]["note_time"]) / 1000.0;

        // get global min and max octave and count values
        this.extrema = findExtrema(selectedData);
        this.extremaCached = {"minOctave" : this.extrema.minOctave ,
                              "maxOctave" : this.extrema.maxOctave ,
                              "minCount"  : this.extrema.minCount  ,
                              "maxCount"  : this.extrema.maxCount  };



        this.numOctave = this.extrema.maxOctave - this.extrema.minOctave + 1;
        this.numElementPerOctave = 2 * this.numHalfGaussian + 1;

        this.initializeData(selectedData);

        // used specifically for legend
        for(let i = this.extrema.minOctave; i <= this.extrema.maxOctave; ++i)
        {
            this.octaveList.push(i);
        }

        if(this.bSuppressPlot)
        {
            return;
        }

        this.xScale = d3.scaleLinear()
                       .domain([this.extrema.minOctave - 0.5, this.extrema.maxOctave + 0.5])
                       .range([0, this.width]);

        this.yScale = d3.scaleLinear()
                       .domain([0, findMaxCountInterval(this.myData)])
                       .range([this.height, 0]);

        // axis
        // this.xAxis = d3.axisBottom(this.xScale)
                    // .ticks(this.numOctave);

        // this.yAxis = d3.axisLeft(this.yScale);

        // here the d parameter in (d) refers to the element
        //             "octavePoint"
        //             "count"
        this.lineGenerator = d3.area()
                        .x((d) => {
                            return this.xScale(parseFloat(d["octavePoint"]));
                        })
                        .y((d) => {
                            return this.yScale(d["countInterval"]);
                        });

        this.svgTop = d3.select("#plot-div")
                    .append("svg")
                    .attr("class", "plot-area")
                    .attr("width", this.fullPlotWidth)
                    .attr("height", this.fullPlotHeight);

        this.mySvgs = this.svgTop.selectAll("g").data(this.myData);

        this.myGroups = this.mySvgs
            .enter()
            .append("g")
              .attr("class", "noteName")
              .attr("width", this.totalWidth)
              .attr("height", this.totalHeight)
              .attr("transform", (d, i) => {
                    let rotateAngle = 90;
                    let xTranslate = this.margin.left + this.totalHeight * (i + 1);
                    let yTranslate = this.margin.top;
                    return `translate(${xTranslate}, ${yTranslate}) rotate(${rotateAngle} 0 0)`;
              });

        this.myText = this.myGroups.append("text")
              .attr("class", "axisLabel")
              .text((d) => {
                  return d["noteName"];
              })
              .attr("text-anchor", "middle") // text horizontal alignment
              .attr("alignment-baseline", "middle") // text vertical alignment
              .attr("fill", "#eeeeee")
              .style("font-size","20px")
              .attr("transform", `translate(${this.width + 40}, ${this.margin.top + this.height}) rotate(-90)`);


        // this.myGroups.append("g")
              // .attr("class", "myXAxis")
              // .attr("transform", `translate(${this.margin.left}, ${this.margin.top + this.height})`)
              // .call(this.xAxis);

        // this.myGroups.append("g")
              // .attr("class", "myYAxis")
              // .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`)
              // .call(this.yAxis);

        this.legend = d3.select("#legend-div")
                        .append("svg")
                        .attr("width", 50)
                        .attr("height", 800);

        this.legend.append("text")
            .text("Octave")
            .attr("fill", "#eeeeee")
            .attr("transform", "translate(0, 20)");

        this.legend.selectAll("g")
            .data(this.octaveList)
            .enter()
            .append("g")
            .attr("class", "legend")
            .attr("transform", (d, i) => {
                return `translate(0, ${40 + i * 40})`;
            });

        this.legend.selectAll(".legend")
            .append("rect")
            .attr("width", 20)
            .attr("height", 20)
            .style("fill", (d, i) => {
                return pickColor(i);
            });

        this.legend.selectAll(".legend").append("text")
            .text((d) => {
                return d.toString();
            })
            .attr("text-anchor", "right")
            .attr("fill", "#eeeeee")
            .attr("transform", (d, i) => {
                return "translate(40, 20)";
            });
    };

    //------------------------------------------------------------
    //------------------------------------------------------------
    this.updatePlot = (csvNewData) => {
        let selectedData = d3.nest()
            .key((d) => { return d.note_name;}).sortKeys(d3.ascending)
            .key((d) => { return parseFloat(d.octave);}).sortKeys(d3.ascending)
            .rollup((leaves) => {
                return d3.sum(leaves, (d) => {
                    return d.magnitude;
                });
            })
            .entries(csvNewData);

        this.gaussianizeData(selectedData);

        // update this.countIntervalMax
        this.myData.forEach((d, i, dSelfArray) => {
            d["octaveList"].forEach((dd, j, ddSelfArray) => {
                if(dd["countMainInterval"] > this.countIntervalMax)
                {
                    this.countIntervalMax = dd["countMainInterval"];
                }
            });
        });

        if(this.bSuppressPlot)
        {
            return;
        }

        this.yScale = d3.scaleLinear()
                       .domain([0, this.preprocessor.countIntervalMax])
                       .range([this.height, 0]);

        this.mySvgs.data(this.myData);

        let newPlotCollection = this.myGroups.append("g")
                              .attr("class", "plot")
                              .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`)
                            .selectAll("path")
                            .data((d) => {
                                return d["octaveList"];
                            })
                            .enter()
                            .append("path");

        newPlotCollection.attr("d", (d, i) => { // define path details https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
                        let pathData = this.lineGenerator(d["octaveData"]);
                        return pathData;
                    })
                .attr("stroke", (d, i) => { // each line is assigned a predefined color
                    if(d["octaveUpdated"])
                    {
                        return pickColor(i);
                    }
                    else
                    {
                        return pickColor(i);
                    }
                })
                .attr("stroke-width", 1)
                .attr("fill", "none")
                .attr("stroke-linecap", "round")
                .attr("stroke-linejoin", "round")
                .attr("visibility", (d) => {
                    if(d["countMainInterval"] <= 0.0)
                    {
                        return "hidden";
                    }
                    else
                    {
                        return "visible";
                    }
                })
                .attr("opacity", "0.3");

        this.myText.attr("font-size", (d) => {
                        if(d["noteUpdated"])
                        {
                            // return "40px";
                            return "25px";
                        }
                        else
                        {
                            return "25px";
                        }
                    })
                    .attr("font-weight", (d) => {
                        if(d["noteUpdated"])
                        {
                            return "bold";
                        }
                        else
                        {
                            return "normal";
                        }
                    });

        // ++this.debugCounter;
        // console.log(this.myData);
        // if(debugCounter >= 2)
        // {
            // throw new Error("STOOP");
        // }
    };
}



