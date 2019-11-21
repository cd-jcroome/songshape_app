from flask import Flask, flash, render_template, request, url_for, redirect, jsonify, session 
from models import db, Song
# from flask_heroku import Heroku

app = Flask(__name__)

app.secret_key = "audioForma"

# local postgresql or heroku postgresql 
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://localhost/audioforma'
# heroku = Heroku(app)

db.init_app(app)

# index route
@app.route('/')
@app.route('/index')
def index():
    songs = Song.query.all()
    return render_template('index.html',title='AudioForma',songs=songs)

# info route TODO: refactor to detail song view.
# @app.route('/info/<mlsnum>')
# def info(mlsnum):

# # add the rest of the info route here
#     return render_template('info.html',title=listing.mlsnum,listing=listing)



# # load_data route (for D3 vis) TODO:refactor to pull song Data from Github
@app.route('/load_data',methods=['GET'])
def load_data():
    songs_json = {'songs': []}
    songs = Song.query.all()
    for song in songs:
        song_info = song.__dict__
        del song_info['_sa_instance_state']
        songs_json['songs'].append(song_info)
    return jsonify(songs_json)

if __name__ == "__main__":
    app.run(debug=True)
