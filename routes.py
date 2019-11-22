from flask import Flask, flash, render_template, request, url_for, redirect, jsonify, session 
from models import db, Song
import requests
from flask_heroku import Heroku

app = Flask(__name__)

app.secret_key = "audioForma"

# local postgresql or heroku postgresql 
# app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://localhost/audioforma'
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
    song = Song.query.filter_by(spotify_id=spotify_id).first()
    return render_template('detail.html',title=song.spotify_id,song=song)

# load_metadata route (for universe vis)
@app.route('/load_metadata',methods=['GET'])
def load_metadata():
    songs_json = {'songs': []}
    songs = Song.query.all()
    for song in songs:
        song_info = song.__dict__
        del song_info['_sa_instance_state']
        songs_json['songs'].append(song_info)
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
