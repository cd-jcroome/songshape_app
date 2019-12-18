# AudioForma

AudioForma is an audio analysis web app designed and developed by Ning Chen, Jasper Croome, and Rebecca Lantner for Harvard Extension School course CSCI E-14A.

### About the Project
The goal of our project is to translate the auditory power of music into a visual experience. The question we set out to answer: what is the shape of a song?

* Explore the app: https://audioforma.herokuapp.com
* View our screencast: https://www.youtube.com/watch?v=-AG25gbI51c&feature=youtu.be
* Learn about our design process by scrolling through process_book.pdf in the root folder

### About the Repo
The code for our web app lives in the songshape_app repo. 
Under the root folder, routes.py controls the app. The templates folder contains the HTML for our webpages.
In the static folder, you'll find css, data, and js folders. 
The css folder contains the styling of the landing page and "fingerprint" visualization pages.
The data folder is where the Spotify 30s samples are saved when users select songs in the app interface. 
This data is needed to render the visualizations.
The js folder contains our D3 implementations and the app's scrolling functionality.
bubbles.js builds the song library viz, while detail.js works with the files in the detail folder to build the song fingerprints.

We also have a work-in-progress repository called SongShape, which contains some earlier iterations of code and visualizations.
