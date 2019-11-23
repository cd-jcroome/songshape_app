from flask import Flask, flash, render_template, request, url_for, redirect, jsonify, session 
from models import db, Song

import requests
import base64
import json
from flask_heroku import Heroku
from requests_oauthlib import OAuth1
from oauthlib.oauth2.rfc6749.grant_types import client_credentials

app = Flask(__name__)

app.secret_key = "audioForma"


# local postgresql or heroku postgresql 
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgres://eeisesngobgpmw:022a760c5e2a14fb950fc580e699168d321a7c5ee2e6a23bf6a63e7857ad09f1@ec2-54-225-173-42.compute-1.amazonaws.com:5432/dbdslcdkv11cgu'
# heroku = Heroku(app)

db.init_app(app)

# index route
@app.route('/')
@app.route('/index')
def index():
    songs = Song.query.all()
    return render_template('index.html',title='AudioForma',songs=songs)

# detail route 
@app.route('/detail/<spotify_id>')
def detail(spotify_id):
    song = Song.query.filter_by(spotify_id=spotify_id).first()
    return render_template('detail.html',title=song.spotify_id,song=song)

# load_metadata route (for universe vis)
@app.route('/load_metadata',methods=['GET','POST'])
def load_metadata():
    spotify_grant_type = 'client_credentials'
    spotify_key = '6b58815e509940539428705cce2b1d14'
    spotify_secret_key = 'fed393d5a9b846e5a8b9f7e3139f8d63'
    post_data = {'grant_type':spotify_grant_type,'client_id':spotify_key,'client_secret':spotify_secret_key}
    post_request = requests.post(f'https://accounts.spotify.com/api/token',data=post_data)

    response_data = json.loads(post_request.text)

    access_token = response_data['access_token']
    print(access_token)
    authorization_header = {'Authorization': f'Bearer {access_token}'}

    songs_json = {'songs': []}
    songs = Song.query.all()
    for i, song in enumerate(songs):
        url = 'https://api.spotify.com/v1/audio-features/'+song.spotify_id
        spotify_data = requests.get(url, headers=authorization_header).json()
        song.spotify_data = spotify_data
        song_info = song.__dict__
        del song_info['_sa_instance_state']
        songs_json['songs'].append(song_info)
        # songs_json['songs'][i].extend(spotify_data)
    return jsonify(songs_json)

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
