from flask import Flask, flash, render_template, request, url_for, redirect, jsonify, session 
from models import db, Song

import requests
import json
import os
import socket
from urllib.parse import quote

from flask_heroku import Heroku

app = Flask(__name__)

app.secret_key = "audioForma"


#Spotify params

print(socket.gethostname())

if socket.gethostname()=="iMac.local":
    from local_spotify_params import key, secret_key
    spotify_key = key
    spotify_secret_key = secret_key 
    redirect_uri = 'http://127.0.0.1:5000/'
else:
    spotify_key = os.environ['spotify_key']
    spotify_secret_key = os.environ['spotify_secret_key']  
    redirect_uri = 'https://audioforma.herokuapp.com/'    

scopes = 'user-library-read'
oauth_data = {'scope':scopes,'client_id':spotify_key,'redirect_uri':redirect_uri, 'response_type':'code'}
url_args = "&".join(["{}={}".format(key,quote(val)) for key, val in oauth_data.items()])

spotify_auth_url = 'https://accounts.spotify.com/authorize/?'+'{}'.format(url_args)
spotify_token_url = 'https://accounts.spotify.com/api/token'
spotify_audio_features_url = 'https://api.spotify.com/v1/audio-features/'
spotify_user_tracks_url = 'https://api.spotify.com/v1/me/tracks'



# local postgresql or heroku postgresql 
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgres://eeisesngobgpmw:022a760c5e2a14fb950fc580e699168d321a7c5ee2e6a23bf6a63e7857ad09f1@ec2-54-225-173-42.compute-1.amazonaws.com:5432/dbdslcdkv11cgu'
heroku = Heroku(app)

db.init_app(app)

# index route
@app.route('/')
@app.route('/index')
def index():

    if 'code' in request.args:
        session['oauth_code'] = request.args['code']
        songs = Song.query.all()
        return render_template('index.html',title='AudioForma',songs=songs)
    else:
        return redirect(spotify_auth_url)

# detail route 
@app.route('/detail/<spotify_id>')
def detail(spotify_id):
    song = Song.query.filter_by(spotify_id=spotify_id).first()
    return render_template('detail.html',title=song.spotify_id,song=song)

# load_metadata route (for universe vis)
@app.route('/load_metadata',methods=['GET','POST'])
def load_metadata():

    oauth_code = session.get('oauth_code')

    post_data = {
        'grant_type':'authorization_code',
        'code':oauth_code,
        'redirect_uri':redirect_uri,
        'client_id':spotify_key,
        'client_secret':spotify_secret_key,
        }
    post_request = requests.post(spotify_token_url,data=post_data)

    response_data = json.loads(post_request.text)

    access_token = response_data['access_token']
    authorization_header = {'Authorization': f'Bearer {access_token}'}

# TODO- add pagination
    tracks_json = requests.get(spotify_user_tracks_url, headers=authorization_header).json()

    for i, t in enumerate(tracks_json['items']):
        print(t['track']['name'])
        af_url = spotify_audio_features_url+t['track']['id']
        af_data = requests.get(af_url, headers=authorization_header).json()
        t['track']['af_data'] = af_data
        # tracks_json['items'][i]['track']['af_data'].extend(af_data)
        # songs_json['songs'][i].extend(spotify_data)
    return jsonify(tracks_json)

# load_songdata route (for universe vis)
@app.route('/load_songdata/<spotify_id>',methods=['GET'])
def load_songdata(spotify_id):
    notes_json = {'notes': []}
    data_name = Song.query.filter_by(spotify_id=spotify_id).first().data_name
    notes = requests.get('https://raw.githubusercontent.com/Jasparr77/songShape/master/output/librosa_128/'
    +data_name+'_h.csv')
    notes_json['notes'].append(notes.text)
    return notes.text

if __name__ == "__main__":
    app.run(debug=True)
