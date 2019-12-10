//------------------------------------------------------------
//------------------------------------------------------------
export function AnimationController()
{
    this.fpsText              = document.querySelector("#fps");
    this.timeElapsedText      = document.querySelector("#time-elapsed");
    this.systemSampleRateText = document.querySelector("#system-sample-rate");
    this.timeStart              = null;
    this.timeElapsedInMillisec  = 0.0;
    this.timeIntervalInMillisec = 0.0;
    this.timeOld                = 0.0;
    this.musicLengthText      = document.querySelector("#music-length");

    this.plotRefreshRate = 6;
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