from flask import Flask, flash, render_template, request, url_for, redirect, jsonify, session 
from models import db, Song

import math, random, requests, json, os, socket, string
from urllib.parse import quote

from flask_heroku import Heroku

app = Flask(__name__)

app.secret_key = "audioForma"


#Spotify params

print(socket.gethostname())

if socket.gethostname() in "iMac, APJ2HV2R68BAFD":
    from local_spotify_params import key, secret_key
    spotify_key = key
    spotify_secret_key = secret_key 
    redirect_uri = 'http://127.0.0.1:5000/'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://localhost/audioforma'
else:
    spotify_key = os.environ['spotify_key']
    spotify_secret_key = os.environ['spotify_secret_key']  
    redirect_uri = 'https://audioforma.herokuapp.com/'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgres://eeisesngobgpmw:022a760c5e2a14fb950fc580e699168d321a7c5ee2e6a23bf6a63e7857ad09f1@ec2-54-225-173-42.compute-1.amazonaws.com:5432/dbdslcdkv11cgu'    


def randomword(length):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(length))

scopes = 'user-library-read'
oauth_data = {'scope':scopes,'client_id':spotify_key,'redirect_uri':redirect_uri, 'response_type':'code', 'state':str(randomword(8))}
url_args = "&".join(["{}={}".format(key,quote(val)) for key, val in oauth_data.items()])

spotify_auth_url = 'https://accounts.spotify.com/authorize/?'+'{}'.format(url_args)
spotify_token_url = 'https://accounts.spotify.com/api/token'
spotify_audio_features_url = 'https://api.spotify.com/v1/audio-features/'
spotify_audio_analysis_url = 'https://api.spotify.com/v1/audio-analysis/'
spotify_user_tracks_url = 'https://api.spotify.com/v1/me/tracks'



heroku = Heroku(app)
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
    spotify_id=spotify_id
    return render_template('detail.html',title=spotify_id)

# load_metadata route (for universe vis)
@app.route('/load_metadata',methods=['GET','POST'])
def load_metadata():
    post_data = {
        'grant_type':'client_credentials',
        'client_id':spotify_key,
        'client_secret':spotify_secret_key,
        }
    post_request = requests.post(spotify_token_url,data=post_data)

    response_data = json.loads(post_request.text)

    access_token = response_data['access_token']
    authorization_header = {'Authorization': f'Bearer {access_token}'}

    af_data = []
    songs_json = {'songs': []}
    songs = Song.query.all()
    for song in songs:
        sd = song.__dict__
        data_name = sd['data_name']
        spotify_id = sd['spotify_id']
        track_name = sd['song_title']
        artist = sd['artist']
        songs_json['songs'].append({'track_name':track_name,'artist':artist,'data_name':data_name,'spotify_id':spotify_id,'af_data':[]})

# # Handle large list of songs (once there are over 100, queries need to be paginated)
    # def chunkify(l,n):
    #     for i in range(0, len(l), n):
    #         yield l[i:i + n]
    # songs_list = list(chunkify(songs_json, 100))
#

    for i, s in enumerate(songs_json['songs']):
        s_id = s['spotify_id']
        safu =spotify_audio_features_url+s_id
        af_data = requests.get(safu, headers=authorization_header).json()
        songs_json['songs'][i]['af_data'].append(af_data)

# Data Request 1 of 2 - not needed for v1
    # limit = 50
    # user_tracks = requests.get(spotify_user_tracks_url, headers=authorization_header, params={'limit':limit}).json()
    # num_calls = math.ceil(user_tracks['total']/limit)

    # tracks_json = user_tracks['items']
    
    # while user_tracks['next']:
    #     user_tracks = requests.get(user_tracks['next'], headers=authorization_header, params={'limit':limit}).json()
    #     tracks_json.extend(user_tracks['items'])
#
    return jsonify(songs_json)

# load_songdata route (for universe vis)
@app.route('/load_songdata/<spotify_id>',methods=['GET','POST'])
def load_songdata(spotify_id):
    notes_json = {'notes': []}
    data_name = Song.query.filter_by(spotify_id=spotify_id).first().data_name
    notes = requests.get('https://raw.githubusercontent.com/Jasparr77/songShape/master/output/librosa_128/'
    +data_name+'_h.csv')

    notes_json['notes'].append(notes.text)

    return notes.text
if __name__ == "__main__":
    app.run(debug=True)
