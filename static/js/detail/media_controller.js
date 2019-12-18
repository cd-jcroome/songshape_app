//------------------------------------------------------------
//------------------------------------------------------------
export function MediaController(fileName)
{
    this.mediaEle = document.querySelector("#my-media");
    this.mediaEle.src = fileName;
    this.mediaEle.autoplay = false;
    this.mediaEle.preload = 'auto';
    this.mediaEle.width = '400';
}