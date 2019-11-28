from flask import Flask, flash, render_template, request, url_for, redirect, jsonify, session 
from models import db, Song

import math, random, requests, json, os, socket, string
from urllib.parse import quote

from flask_heroku import Heroku

app = Flask(__name__)

app.secret_key = "audioForma"


#Spotify params

print(socket.gethostname())

if socket.gethostname() in ["iMac.local","APJ2HV2R68BAFD"]:
    from local_spotify_params import key, secret_key
    spotify_key = key
    spotify_secret_key = secret_key 
    redirect_uri = 'http://127.0.0.1:5000/'

else:
    spotify_key = os.environ['spotify_key']
    spotify_secret_key = os.environ['spotify_secret_key']  
    redirect_uri = 'https://audioforma.herokuapp.com/'    


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
        # songs = Song.query.all()
        return render_template('index.html',title='AudioForma')
    else:
        return redirect(spotify_auth_url)

# detail route 
@app.route('/detail/<spotify_id>')
def detail(spotify_id):
    spotify_id=spotify_id
    return render_template('detail.html',title=spotify_id)

# load_metadata route (for universe vis)
@app.route('/load_metadata',methods=['GET','POST'])
def load_metadata():

# Authentication Call
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

# Data Request 1 of 2
    limit = 50
    user_tracks = requests.get(spotify_user_tracks_url, headers=authorization_header, params={'limit':limit}).json()
    num_calls = math.ceil(user_tracks['total']/limit)

    tracks_json = user_tracks['items']
    
    while user_tracks['next']:
        user_tracks = requests.get(user_tracks['next'], headers=authorization_header, params={'limit':limit}).json()
        tracks_json.extend(user_tracks['items'])

# Data Request 2 of 2
    track_list = []
    af_data = []

    for i, t in enumerate(tracks_json):
        track_list.append(tracks_json[i]['track']['id'])

    def chunkify(l,n):
        for i in range(0, len(l), n):
            yield l[i:i + n]

    super_list = list(chunkify(track_list, 100))

    for i, l in enumerate(super_list):
        l_str = str(l).replace("'","").replace(" ","")
        af_data_chunk = requests.get(spotify_audio_features_url, headers=authorization_header, params={'ids':l_str}).json()
        af_data.extend(af_data_chunk['audio_features'])

    for i, l in enumerate(tracks_json):
        l['af_data'] = af_data[i]

    return jsonify(tracks_json)

# load_songdata route (for universe vis)
@app.route('/load_songdata/<spotify_id>',methods=['GET','POST'])
def load_songdata(spotify_id):

    get_data = {
        'grant_type':'client_credentials',
        'client_id':spotify_key,
        'client_secret':spotify_secret_key,
        }
    post_request = requests.post(spotify_token_url,data=get_data)

    response_data = json.loads(post_request.text)
    print(response_data)

    access_token = response_data['access_token']
    authorization_header = {'Authorization': f'Bearer {access_token}'}

    audio_analysis = requests.get(spotify_audio_analysis_url+spotify_id, headers=authorization_header).json()

    return audio_analysis

if __name__ == "__main__":
    app.run(debug=True)
