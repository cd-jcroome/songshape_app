# base-level flask functionality
from flask import Flask, flash, render_template, request, url_for, redirect, jsonify, session
from models import db, Song
from flask_heroku import Heroku

# additional tastiness within routes
import math
import random
import requests
import json
import os
import socket
import string
from urllib.parse import quote
from urllib.request import urlopen
from requests_oauthlib import OAuth2Session

# for transforming data
import librosa
import numpy as np
import pandas as pd

app = Flask(__name__)

app.secret_key = os.urandom(24)

# Spotify params
if socket.gethostname() in ["iMac", "APJ2HV2R68BAFD", "LAPTOP-RP2K2BF3"]:
    from local_spotify_params import key, secret_key
    spotify_key = key
    spotify_secret_key = secret_key
    redirect_uri = "http://127.0.0.1:5000/callback/"
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://localhost/audioforma'
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
else:
    spotify_key = os.environ['spotify_key']
    spotify_secret_key = os.environ['spotify_secret_key']
    redirect_uri = "https://audioforma.herokuapp.com/callback/"
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgres://eeisesngobgpmw:022a760c5e2a14fb950fc580e699168d321a7c5ee2e6a23bf6a63e7857ad09f1@ec2-54-225-173-42.compute-1.amazonaws.com:5432/dbdslcdkv11cgu'


scopes = 'user-library-read'
oauth_data = {'scope': scopes, 'client_id': spotify_key,
              'redirect_uri': redirect_uri, 'response_type': 'code'}
url_args = "&".join(["{}={}".format(key, quote(val))
                     for key, val in oauth_data.items()])

spotify_auth_url = 'https://accounts.spotify.com/authorize/'
spotify_token_url = 'https://accounts.spotify.com/api/token'
# spotify_audio_analysis_url = 'https://api.spotify.com/v1/audio-analysis/'

spotify_audio_features_url = 'https://api.spotify.com/v1/audio-features/'
spotify_user_tracks_url = 'https://api.spotify.com/v1/me/tracks'
spotify_tracks_url = 'https://api.spotify.com/v1/tracks/'
spotify_artists_url = 'https://api.spotify.com/v1/artists/'


heroku = Heroku(app)
db.init_app(app)

# index route
@app.route('/login')
@app.route('/')
def authenticate():
    if 'oauth_key' in session:
        print(session)
        return redirect(url_for('index'))
    else:
        print(f'no oauth key, redirect URI is {redirect_uri}')
        spotify = OAuth2Session(spotify_key, redirect_uri=redirect_uri, scope=scopes)
        authorization_url, state = spotify.authorization_url(spotify_auth_url)
        # State is used to prevent CSRF, keep this for later.
        session['oauth_state'] = state
        return redirect(authorization_url)


@app.route('/index')
def index():
    return render_template('index.html', title='AudioForma')

# callback route, for receiving users after they are authenticated
@app.route('/callback/', methods=['GET'])
def callback():
    auth_token = request.args['code']
    code_payload = {
        "grant_type": "authorization_code",
        "code": str(auth_token),
        "redirect_uri": redirect_uri,
        'client_id': spotify_key,
        'client_secret': spotify_secret_key,
    }
    post_request = requests.post(spotify_token_url, data=code_payload)

    response_data = json.loads(post_request.text)
    access_token = response_data["access_token"]
    refresh_token = response_data["refresh_token"]
    token_type = response_data["token_type"]
    expires_in = response_data["expires_in"]

    session['oauth_token'] = access_token

    return redirect(url_for('index'))

# detail route
@app.route('/detail/<spotify_id>')
def detail(spotify_id):
    client_cred_payload = {
        'grant_type':'client_credentials',
        'client_id': spotify_key,
        'client_secret': spotify_secret_key,
    }
    token_request = requests.post(spotify_token_url,data=client_cred_payload)
    response_data = json.loads(token_request.text)
    access_token = response_data["access_token"]
    authorization_header = {"Authorization": "Bearer {}".format(access_token)}
    
    spotify_id = spotify_id
    track_info = requests.get(spotify_tracks_url+spotify_id, headers=authorization_header).json()

    preview_url = str(track_info['preview_url']).split("?")[0]+".mp3"

    return render_template('detail.html', title=spotify_id, track_info=track_info, preview_url=preview_url)

# load_metadata route (for universe vis)
@app.route('/load_metadata', methods=['GET', 'POST'])
def load_metadata():
    access_token = session['oauth_token']
    authorization_header = {"Authorization": "Bearer {}".format(access_token)}
    
    limit = 50
    user_tracks = requests.get(spotify_user_tracks_url, headers=authorization_header, params={'limit': limit}).json()
    num_calls = math.ceil(user_tracks['total']/limit)

    tracks_data = user_tracks['items']

    while user_tracks['next']:
        user_tracks = requests.get(user_tracks['next'], headers=authorization_header, params={
                                  'limit': limit}).json()
        tracks_data.extend(user_tracks['items'])

# use the tracks data to build lists of song ids and artist ids
    sid_list_staging = []
    for t in tracks_data:
        sid_list_staging.append(t['track']['id'])

    art_list_staging = []
    for t in tracks_data:
        art_list_staging.append(t['track']['artists'][0]['id'])
#

# Handle large lists of items (once there are over 100, queries need to be paginated)
    def chunkify(l, n):
        for i in range(0, len(l), n):
            yield l[i:i + n]
    songs_list = list(chunkify(tracks_data, 100))
    sid_list = list(chunkify(sid_list_staging, 100))
    art_list = list(chunkify(art_list_staging, 50))
#


# run paginated api calls, then flatten data into one object.
    af_data = []
    for i, t in enumerate(sid_list):
        t_str = str(t).replace("'", "").replace(
            " ", "").replace("[", "").replace("]", "")
        af_response = requests.get(
            spotify_audio_features_url, headers=authorization_header, params={'ids': t_str}).json()
        for r in af_response['audio_features']:
            af_data.append(r)

    artist_data = []
    for i, a in enumerate(art_list):
        a_str = str(a).replace("'", "").replace(
            " ", "").replace("[", "").replace("]", "")
        art_response = requests.get(
            spotify_artists_url, headers=authorization_header, params={'ids': a_str}).json()
        for r in art_response['artists']:
            artist_data.append(r)

    song_data = []
    for s in songs_list:
        for s2 in s:
            song_data.append(s2)

    for i, x in enumerate(song_data):
        song_data[i]['af_data'] = []
        song_data[i]['artist'] = []

        song_data[i]['af_data'].append(af_data[i])
        song_data[i]['artist'].append(artist_data[i])

    return jsonify(song_data)

# load_songdata route (for detail vis)
@app.route('/load_songdata/<spotify_id>', methods=['GET', 'POST'])
def load_songdata(spotify_id):
    post_data = {
        'grant_type':'client_credentials',
        'client_id':spotify_key,
        'client_secret':spotify_secret_key
    }
    access_token = json.loads(requests.post(spotify_token_url,data=post_data).text)['access_token']
    auth_header = {'Authorization':f'Bearer {access_token}'}

    filepath = os.path.join(os.path.dirname(__file__),'static/data/midi_metadata.csv')
    notes = pd.read_csv(filepath)

    track_info = requests.get(spotify_tracks_url+spotify_id, headers=auth_header).json()
    if track_info['preview_url']:
        preview_url = track_info['preview_url']
        song_url = os.path.join(track_info['preview_url'].split('?')[
                                0], '.mp3').replace('/.mp3', '.mp3')

        sample_30s = urlopen(song_url)

        with open(f'./static/data/{spotify_id}.mp3', 'wb') as output:
            output.write(sample_30s.read())

        mp3_filepath = os.path.join(os.path.dirname(__file__),
                                    f'static/data/{spotify_id}.mp3')
        y, sr = librosa.load(mp3_filepath)
        duration = librosa.core.get_duration(y=y, sr=sr)
        # split out the harmonic and percussive audio
        y_harmonic = librosa.effects.hpss(y)[0]
        # map out the values into an array
        cqt_h = np.abs(librosa.cqt(y_harmonic, sr=sr, fmin = 16.35, n_bins = 108, bins_per_octave=12))
        c_df_h = pd.DataFrame(notes).join(pd.DataFrame(cqt_h), lsuffix='n').melt(
            id_vars={'MIDI Note', 'Octave', 'Note'}).rename(columns={'variable': 'note_time','Octave':'octave','Note':'note_name','value':'magnitude'})
        # Time transformation
        time_int = duration / cqt_h.shape[1]
        c_df_h['note_time'] = c_df_h['note_time'] * time_int * 1000

        song_data = c_df_h.to_csv(index=False)

    else:
        song_data = jsonify(track_info)

    return(song_data)


if __name__ == "__main__":
    app.run(debug=True)
