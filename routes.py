# base-level flask functionality
from flask import Flask, flash, render_template, request, url_for, redirect, jsonify, session 
from models import db, Song
from flask_heroku import Heroku

# additional tastiness within routes
import math, random, requests, json, os, socket, string
from urllib.parse import quote
from urllib.request import urlopen
from requests_oauthlib import OAuth2Session

# for transforming data
from librosa import load
import numpy as np
import pandas as pd

app = Flask(__name__)

app.secret_key = os.urandom(24)

print(socket.gethostname())

#Spotify params
if socket.gethostname() in ["iMac","APJ2HV2R68BAFD"]:
    from local_spotify_params import key, secret_key
    spotify_key = key
    spotify_secret_key = secret_key 
    redirect_uri = 'http://127.0.0.1:5000/callback/'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://localhost/audioforma'
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
else:
    spotify_key = os.environ['spotify_key']
    spotify_secret_key = os.environ['spotify_secret_key']  
    redirect_uri = 'https://audioforma.herokuapp.com/callback/'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgres://eeisesngobgpmw:022a760c5e2a14fb950fc580e699168d321a7c5ee2e6a23bf6a63e7857ad09f1@ec2-54-225-173-42.compute-1.amazonaws.com:5432/dbdslcdkv11cgu'    


def randomword(length):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(length))

scopes = 'user-library-read'
# oauth_data = {'scope':scopes,'client_id':spotify_key,'redirect_uri':redirect_uri, 'response_type':'code', 'state':str(randomword(8))}
# url_args = "&".join(["{}={}".format(key,quote(val)) for key, val in oauth_data.items()])

# spotify_auth_url = 'https://accounts.spotify.com/authorize/?'+'{}'.format(url_args)
spotify_auth_url = 'https://accounts.spotify.com/authorize'
spotify_token_url = 'https://accounts.spotify.com/api/token'
spotify_audio_features_url = 'https://api.spotify.com/v1/audio-features/'
spotify_audio_analysis_url = 'https://api.spotify.com/v1/audio-analysis/'
spotify_user_tracks_url = 'https://api.spotify.com/v1/me/tracks'
spotify_tracks_url = 'https://api.spotify.com/v1/tracks/'
spotify_artists_url = 'https://api.spotify.com/v1/artists/'



heroku = Heroku(app)
db.init_app(app)

# index route
@app.route('/login')
def authenticate():
    spotify = OAuth2Session(spotify_key, redirect_uri=redirect_uri)
    authorization_url, state = spotify.authorization_url(spotify_auth_url)
    # State is used to prevent CSRF, keep this for later.
    session['oauth_state'] = state
    return redirect(authorization_url)

@app.route('/index')
def index():
    return render_template('index.html',title='AudioForma')
    
# callback route, for receiving users after they are authenticated    
@app.route('/callback/', methods=['GET'])
def callback():
    spotify = OAuth2Session(spotify_key, state=session['oauth_state'], redirect_uri=redirect_uri)
    token = spotify.fetch_token(spotify_token_url, client_secret=spotify_secret_key,authorization_response=request.url)

    # At this point you can fetch protected resources but lets save
    # the token and show how this is done from a persisted token
    # in /profile.
    session['oauth_token'] = token

    return redirect(url_for('index'))

# detail route 
@app.route('/detail/<spotify_id>')
def detail(spotify_id):
    spotify_id=spotify_id
    return render_template('detail.html',title=spotify_id)

# load_metadata route (for universe vis)
@app.route('/load_metadata',methods=['GET','POST'])
def load_metadata():

    spotify = OAuth2Session(spotify_key,token=session['oauth_token'], redirect_uri=redirect_uri)

# # Authentication Call
#     oauth_code = session.get('oauth_code')

#     post_data = {
#         'grant_type':'authorization_code',
#         'code':oauth_code,
#         'redirect_uri':redirect_uri,
#         'client_id':spotify_key,
#         'client_secret':spotify_secret_key,
#         }
#     post_request = requests.post(spotify_token_url,data=post_data)

#     response_data = json.loads(post_request.text)
#     print(response_data)

#     access_token = response_data['access_token']
#     authorization_header = {'Authorization': f'Bearer {access_token}'}
# #

# Data Request 3 of 3 - non-spotify users

    songs = Song.query.all()
    sid_list = []
    for sid in songs:
        sd = sid.__dict__
        sp_id = sd['spotify_id']
        sid_list.append(sp_id)

    sid_list_arg = str(sid_list).replace("'","").replace(" ","").replace("[","").replace("]","")

    tracks_data = spotify.get(spotify_tracks_url,params={'ids':sid_list_arg}).json()



    limit = 50
    user_tracks = spotify.get(spotify_user_tracks_url, params={'limit':limit,'scopes':scopes}).json()
    print(user_tracks)
    num_calls = math.ceil(user_tracks['total']/limit)

    tracks_data = user_tracks['items']

    while user_tracks['next']:
        user_tracks = spotify.get(user_tracks['next'], params={'limit':limit}).json()
        tracks_data.extend(user_tracks['items'])

# Data Request 2 of 2
    # track_list = []
    # af_data = []

    # af_data = requests.get(spotify_audio_features_url, params={'ids':sid_list_arg}).json()

    # artist_list = []
    # for trk in tracks_data['tracks']:
    #     aid = trk['artists'][0]['id']
    #     artist_list.append(aid)
    # print(artist_list)
    
    # art_list_arg = str(artist_list).replace("'","").replace(" ","").replace("[","").replace("]","")

    # art_data = requests.get(spotify_artists_url, params={'ids':art_list_arg},).json()

    # for i, t in enumerate(tracks_data['tracks']):
    #     tracks_data['tracks'][i]['artist'] = []
    #     tracks_data['tracks'][i]['af_data'] = []

    #     tracks_data['tracks'][i]['artist'].append(art_data['artists'][i])
    #     tracks_data['tracks'][i]['af_data'].append(af_data['audio_features'][i])

# # Handle large list of songs (once there are over 100, queries need to be paginated)
    # def chunkify(l,n):
    #     for i in range(0, len(l), n):
    #         yield l[i:i + n]
    # songs_list = list(chunkify(songs_json, 100))
#

    # for i, s in enumerate(songs_json['songs']):
    #     t_id = s['spotify_id']
    #     safu =spotify_audio_features_url+t_id
    #     songs_json['songs'][i]['af_data'].append(af_data)

    #     stu = spotify_tracks_url+t_id
    #     tk_data = requests.get(stu, headers=authorization_header).json()
    #     songs_json['songs'][i]['track_data'].append(tk_data)
        
    #     a_id = songs_json['songs'][i]['track_data']
    #     sau = spotify_artists_url+a_id
    #     songs_json['songs'][i]['artist_data'].append(art_data)

# Data Request 1 of 2 - not needed for v1
    # limit = 50
    # user_tracks = requests.get(spotify_user_tracks_url, headers=authorization_header, params={'limit':limit}).json()
    # num_calls = math.ceil(user_tracks['total']/limit)

    # tracks_json = user_tracks['items']
    
    # while user_tracks['next']:
    #     user_tracks = requests.get(user_tracks['next'], headers=authorization_header, params={'limit':limit}).json()
    #     tracks_json.extend(user_tracks['items'])
#
    return jsonify(tracks_data)

# load_songdata route (for universe vis)
@app.route('/load_songdata/<spotify_id>',methods=['GET','POST'])
def load_songdata(spotify_id):
    spotify = OAuth2Session(spotify_key,token=session['oauth_token'], redirect_uri=redirect_uri)
    # post_data = {
    #     'grant_type':'client_credentials',
    #     'client_id':spotify_key,
    #     'client_secret':spotify_secret_key,
    #     }
    # post_request = requests.post(spotify_token_url,data=post_data)

    # response_data = json.loads(post_request.text)

    # access_token = response_data['access_token']
    # authorization_header = {'Authorization': f'Bearer {access_token}'}

    notes = pd.read_csv('../static/data/midi_metadata.csv')
    safu = spotify_tracks_url+spotify_id

    song_url = os.path.join(requests.get(safu).json()['preview_url'].split('?')[0],'.mp3').replace('/.mp3','.mp3')

    sample_30s = urlopen(song_url)

    # data_name = Song.query.filter_by(spotify_id=spotify_id).first().data_name
    # notes = requests.get('https://raw.githubusercontent.com/Jasparr77/songShape/master/output/librosa_128/'
    # +data_name+'_h.csv')

    # firstnow = datetime.datetime.now()
    # with open('./test.mp3', 'wb') as output:
    #     output.write(sample_30s.read())
    # print(f'{datetime.datetime.now()} song downloaded')

    # y = librosa.load('./test.mp3')[0]
    # print(f'{datetime.datetime.now()} analysis complete')

    # #split out the harmonic and percussive audio
    # y_harmonic= librosa.effects.hpss(y)[0]
    # print(f'{datetime.datetime.now()} harmonic split')

    # #map out the values into an array
    # cqt_h = np.abs(librosa.cqt(y_harmonic, sr=sr, n_bins=128, fmin=6, bins_per_octave=12))
    # c_df_h = pd.DataFrame(notes).join(pd.DataFrame(cqt_h),lsuffix='n').melt(id_vars={'MIDI Note', 'Octave', 'Note'}).rename(columns={'variable':'time'})
    # c_df_h_final = c_df_h[c_df_h['value'].astype(float)>=.1]
    # print(f'{datetime.datetime.now()} array completed')


    # m_h_csv = join('../../output/librosa_128/',splitext('test.mp3')[0],'.csv').replace("/.csv","_h.csv")
    # c_df_h_final.to_csv(m_h_csv)
    # print(f'{datetime.datetime.now()} csv completed. {datetime.datetime.now()-firstnow} seconds from start to finish.')


    # return notes.text
if __name__ == "__main__":
    app.run(debug=True)
