import {MusicPlot}               from './music_plot.js';
import {findUpperBoundTimeIndex} from './utility.js';

//------------------------------------------------------------
//------------------------------------------------------------
export function Preprocessor()
{
    this.countIntervalMax = 0.0;

    this.preprocess = (csvRawData, plotRefreshRate) => {
        const musicPlot = new MusicPlot();
        musicPlot.bSuppressPlot = true;
        musicPlot.initializePlot(csvRawData);

        let numFrames = plotRefreshRate * musicPlot.totalMusicTimeInSec;
        let timeIntervalInSec = 1.0 / plotRefreshRate;
        for(let i = 0; i < numFrames; ++i)
        {
            let timeElapsedInSec = timeIntervalInSec * i;
            let index = findUpperBoundTimeIndex(timeElapsedInSec, csvRawData);
            let csvNewData = csvRawData.slice(0, index);
            musicPlot.updatePlot(csvNewData);
        }

        this.countIntervalMax = musicPlot.countIntervalMax;
    };
}
