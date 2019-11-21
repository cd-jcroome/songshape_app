from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Song(db.Model):
    __tablename__ = 'song'
    song_id = db.Column(db.Integer(),primary_key=True)
    song_title = db.Column(db.String(100),nullable=False)
    artist = db.Column(db.String(100),nullable=False)
    album = db.Column(db.String(100),nullable=False)
    data_name = db.Column(db.String(100),nullable=False)
    spotify_id = db.Column(db.String(100),nullable=False)

    def __repr__(self):
        return f'<Song {self.data_name}>'