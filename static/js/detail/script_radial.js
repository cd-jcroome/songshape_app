'use strict';

{ // start scope

// localhost:8000

//------------------------------------------------------------
//------------------------------------------------------------
function initializeData(selectedData,
                        minOctave, maxOctave,
                        numHalfGaussian, binSize)
{
    let myData = new Array();

    let numOctave = maxOctave - minOctave + 1;
    let numElement = numOctave * (2 * numHalfGaussian + 1);

    // preallocate
    for(let i = 0; i < selectedData.length; ++i)
    {
        let noteName = selectedData[i].key;
        myData.push({key: noteName, values: new Array(numElement)});
    }

    // assign keys and initial values
    for(let i = 0; i < myData.length; ++i)
    {
        let myCounter = 0;
        for(let j = 0; j < maxOctave - minOctave + 1; ++j)
        {
            let octave = minOctave + j;
            for(let k = -numHalfGaussian; k <= numHalfGaussian; ++k)
            {
                let currentOctave = octave + k * binSize;

                myData[i].values[myCounter] = {key : currentOctave.toString(), value : 0};

                ++myCounter;
            }
        }
    }


    gaussianizeData(selectedData, myData,
                    minOctave, maxOctave,
                    numHalfGaussian, binSize);

    return myData;
}

//------------------------------------------------------------
//------------------------------------------------------------
function gaussianizeData(selectedData, myData,
                         minOctave, maxOctave,
                         numHalfGaussian, binSize)
{
    // zero
    for(let i = 0; i < myData.length; ++i)
    {
        let myCounter = 0;
        for(let j = 0; j < maxOctave - minOctave + 1; ++j)
        {
            let octave = minOctave + j;
            for(let k = -numHalfGaussian; k <= numHalfGaussian; ++k)
            {
                myData[i].values[myCounter].value = 0;

                ++myCounter;
            }
        }
    }

    // gaussianize
    for(let i = 0; i < selectedData.length; ++i)
    {
        let noteIdx = -1;
        for(noteIdx = 0; noteIdx < myData.length; ++noteIdx)
        {
            if(myData[noteIdx].key == selectedData[i].key)
            {
                break;
            }
        }

        for(let j = 0; j < selectedData[i].values.length; ++j)
        {
            let octave = parseInt(selectedData[i].values[j].key);
            let count = selectedData[i].values[j].value;

            let octaveIdx = octave - minOctave;
            let targetIdx = (2 * numHalfGaussian + 1) * octaveIdx + numHalfGaussian;

            for(let k = -numHalfGaussian; k <= numHalfGaussian; ++k)
            {
                let currentOctave = octave + k * binSize;

                let up = currentOctave - octave;
                up = up * up;
                const sigma = 0.1;
                let down = 2.0 * sigma * sigma;
                let temp = - up / down;
                let currentCount = count * Math.exp(temp);

                myData[noteIdx].values[targetIdx + k].value = currentCount;
            }
        }
    }
}

//------------------------------------------------------------
// return an index such that csvData[0, index - 1] is used for visualization
//------------------------------------------------------------
function findUpperBoundTimeIndex(currentTimeInSec, csvData)
{
    let index = 0;

    for(; index < csvData.length; ++index)
    {
        let rowTime = parseFloat(csvData[index]["note_time"]) / 1000.0;
        if (currentTimeInSec < rowTime)
        {
            break;
        }
    }

    return index;
}

//------------------------------------------------------------
//------------------------------------------------------------
function findExtrema(myData)
{
    let minOctave = 100000;
    let maxOctave = 0;
    let minCount  = 100000;
    let maxCount  = 0;

    for(let i = 0; i < myData.length; ++i)
    {
        for(let j = 0; j < myData[i].values.length; ++j)
        {
            let octave = parseFloat(myData[i].values[j].key);
            if(octave < minOctave)
            {
                minOctave = octave;
            }

            if(octave > maxOctave)
            {
                maxOctave = octave;
            }

            let count = myData[i].values[j].value;

            if(count < minCount)
            {
                minCount = count;
            }

            if(count > maxCount)
            {
                maxCount = count;
            }
        }
    }

    return {"minOctave" : minOctave,
            "maxOctave" : maxOctave,
            "minCount"  : minCount ,
            "maxCount"  : maxCount};

}

//------------------------------------------------------------
// predefine color schemes
//------------------------------------------------------------
function pickColor(index)
{
    // const predefinedColors = ["#e6194b",
                              // "#f58231",
                              // "#ffe119",
                              // "#bfef45",
                              // "#3cb44b",
                              // "#42d4f4",
                              // "#4363d8",
                              // "#911eb4",
                              // "#f032e6",
                              // "#aaffc3",
                              // "#e6beff",
                              // "#fabebe"];
    const predefinedColors = ["#f58231"];
    let colorIdx = index % predefinedColors.length;
    return predefinedColors[colorIdx];
}

//------------------------------------------------------------
//------------------------------------------------------------
function MusicPlot()
{
    this.margin = {top: 30, right: 30, bottom: 30, left: 30};
    this.totalWidth = 300;
    this.totalHeight = 150;
    this.fullPlotWidth = 800;
    this.fullPlotHeight = 800;
    this.width  = this.totalWidth  - this.margin.left - this.margin.right;
    this.height = this.totalHeight - this.margin.top  - this.margin.bottom;

    this.allNoteNames = null;
    this.extrema      = null;

    this.xScale = null;
    this.yScale = null;
    this.xAxis  = null;
    this.yAxis  = null;
    this.areaGenerator = null;
    this.svgTop = null;
    this.mySvgs = null;
    this.myGroups = null;
    this.myData = null;
    this.areaPlots = null;

    this.numHalfGaussian = 20;
    this.binSize = 0.02;
    this.numOctave = -1;
    this.numElement = -1;

    this.totalMusicTimeInSec = 0.0;

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
            .rollup((v) => { return v.length;})
            .entries(csvRawData);

        // get total music time
        this.totalMusicTimeInSec = parseFloat(csvRawData[csvRawData.length - 1]["note_time"]) / 1000.0;

        // get an array of all note_names
        this.allNoteNames = selectedData.map((d) => { return d.key; });

        // get global min and max octave and count values
        this.extrema = findExtrema(selectedData);

        this.numOctave = this.extrema.maxOctave - this.extrema.minOctave + 1;
        this.numElement = this.extrema.numOctave * (2 * this.numHalfGaussian + 1);

        this.myData = initializeData(selectedData,
                                     this.extrema.minOctave, this.extrema.maxOctave,
                                     this.numHalfGaussian, this.binSize);

        this.xScale = d3.scaleLinear()
                       .domain([this.extrema.minOctave, this.extrema.maxOctave])
                       .range([0, this.width]);

        this.yScale = d3.scaleLinear()
                       .domain([0, this.extrema.maxCount])
                       .range([this.height, 0]);

        // axis
        this.xAxis = d3.axisBottom(this.xScale)
                      .ticks(this.extrema.maxOctave - this.extrema.minOctave + 1);
        this.yAxis = d3.axisLeft(this.yScale);

        this.areaGenerator = d3.line()
                        .x((d) => {
                            return this.xScale(parseFloat(d.key));
                        })
                        .y((d) => {
                            return this.yScale(d.value);
                        });

        // this.areaGenerator = d3.area()
                        // .x((d) => {
                            // return this.xScale(parseFloat(d.key));
                        // })
                        // .y1((d) => {
                            // return this.yScale(d.value);
                        // })
                        // .y0(this.yScale(0.0));

        this.svgTop = d3.select("#plot-div")
                   .append("svg")
                     .attr("width", this.fullPlotWidth)
                     .attr("height", this.fullPlotHeight);

        // svgs.selectAll(".my-line") results in
        // _groups (1 element)
        //     NodeList (empty NodeList array)
        // svgs.select(".my-line") results in
        // _groups (1 element)
        //     [] (empty array)

        // _groups (1 element)
        //     [path, ...] (an array of path objects)
        this.mySvgs = this.svgTop.selectAll("g").data(this.myData);

        this.myGroups = this.mySvgs
            .enter()
            .append("g")
              .attr("width", this.totalWidth)
              .attr("height", this.totalHeight)
              .attr("transform", (d, i) => {
                    let rotateAngle = 360.0 / this.myData.length * i;
                    let xTranslate = this.fullPlotWidth / 2;
                    let yTranslate = this.fullPlotHeight / 2 - this.totalHeight;
                    return "translate(" + xTranslate + ", " + yTranslate + ") rotate(" + rotateAngle +" 0 " + this.totalHeight + ")";
              });

        this.myGroups.append("text")
              .text((d, i) => {
                  return this.allNoteNames[i];
              })
              .attr("transform", "translate(" + this.totalWidth + "," + (this.margin.top + this.height) + ")");

        this.myGroups.append("g")
              .attr("transform", "translate(" + this.margin.left + "," + (this.margin.top + this.height) + ")")
              .call(this.xAxis);

        this.areaPlots = this.myGroups.append("g")
                          .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")
                          .append("path");

        let domResult = document.querySelector("#plot-div");
        console.log(domResult);

        // set up areaPlots
        // here the d parameter in (d) refers to the element
        // {key: note_name, values: [obj1, obj2 ...]}
        // where obj is {key: octave, value: count}
        this.areaPlots.attr("d", (d, i) => { // define path details https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
                        let pathData = this.areaGenerator(d.values);
                        return pathData;
                    })
              .attr("stroke", (d, i) => { // each line is assigned a predefined color
                    let color = pickColor(i);
                    return color;
              })
              .attr("stroke-width", 1)
              .attr("fill", (d, i) => { // each line is assigned a predefined color
                    let color = pickColor(i);
                    return color;
              })
              //.attr("fill", "none")
              .attr("stroke-linecap", "round")
              .attr("stroke-linejoin", "round");
    };

    //------------------------------------------------------------
    //------------------------------------------------------------
    this.updatePlot = (csvNewData) => {
        let selectedData = d3.nest()
            .key((d) => { return d.note_name;}).sortKeys(d3.ascending)
            .key((d) => { return parseFloat(d.octave);}).sortKeys(d3.ascending)
            .rollup((v) => { return v.length;})
            .entries(csvNewData);

        // get global min and max octave and count values
        let result = findExtrema(selectedData);
        this.extrema.minCount = result.minCount;
        this.extrema.maxCount = result.maxCount;

        gaussianizeData(selectedData, this.myData,
                        this.extrema.minOctave, this.extrema.maxOctave,
                        this.numHalfGaussian, this.binSize);


        this.yScale = d3.scaleLinear()
                       .domain([0, this.extrema.maxCount])
                       .range([this.height, 0]);
        this.mySvgs.data(this.myData);

        // set up areaPlots
        // here the d parameter in (d) refers to the element
        // {key: note_name, values: [obj1, obj2 ...]}
        // where obj is {key: octave, value: count}
        this.areaPlots.attr("d", (d, i) => { // define path details https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
                        let pathData = this.areaGenerator(d.values);
                        return pathData;
                    });
    }
}

//------------------------------------------------------------
//------------------------------------------------------------
function AnimationController()
{
    this.fpsText              = document.querySelector("#fps");
    this.timeElapsedText      = document.querySelector("#time-elapsed");
    this.systemSampleRateText = document.querySelector("#system-sample-rate");
    this.timeStart              = null;
    this.timeElapsedInMillisec  = 0.0;
    this.timeIntervalInMillisec = 0.0;
    this.timeOld                = 0.0;
    this.musicLengthText      = document.querySelector("#music-length");

    this.plotRefreshRate = 20;
    this.plotRefreshTimeInMillisec = 1.0 / this.plotRefreshRate * 1000.0;
    this.plotRefreshAccumulatedTimeInMillisec = 0.0;

    this.update = (timeStamp) => {
        if(!this.timeStart) {
            this.timeStart = timeStamp;
        }

        this.timeElapsedInMillisec = timeStamp - this.timeStart;
        this.timeElapsedText.textContent = (this.timeElapsedInMillisec / 1000.0).toFixed(1);

        this.timeIntervalInMillisec = timeStamp - this.timeOld;
        this.fpsText.textContent = (1.0 / this.timeIntervalInMillisec * 1000.0).toFixed(0);
        this.timeOld = timeStamp;

        this.plotRefreshAccumulatedTimeInMillisec += this.timeIntervalInMillisec;
    };

    this.canPlayAnimation = () => {
        if(this.plotRefreshAccumulatedTimeInMillisec > this.plotRefreshTimeInMillisec)
        {
            this.plotRefreshAccumulatedTimeInMillisec = 0.0;
            return true;
        }
        else
        {
            return false;
        }
    };
}

//------------------------------------------------------------
//------------------------------------------------------------
window.addEventListener("load", () => {
    // asynchronous function, returns immediately
    let temp = d3.csv("data/SevenNationArmy.csv");

    // once the large csv file is loaded into memory
    temp.then((csvRawData) => {
        let musicPlot = new MusicPlot();
        musicPlot.initializePlot(csvRawData);

        let ac = new AnimationController();
        ac.musicLengthText.textContent = musicPlot.totalMusicTimeInSec;

        function startAnalysis(timeStamp) {
            ac.update(timeStamp);

            let index = findUpperBoundTimeIndex(ac.timeElapsedInMillisec / 1000.0, csvRawData);
            let csvNewData = csvRawData.slice(0, index);

            // update plot at specified refresh rate
            if(ac.canPlayAnimation())
            {
                musicPlot.updatePlot(csvNewData);
            }

            // play animation if music has not ended
            if(ac.timeElapsedInMillisec < musicPlot.totalMusicTimeInSec * 1000)
            {
                requestAnimationFrame(startAnalysis);
            }
        }

        window.requestAnimationFrame(startAnalysis);
    }); // end then()
}); // end addEventListener()

} // end scope

