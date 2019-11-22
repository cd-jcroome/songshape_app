import psycopg2
import pandas as pd

host = 'localhost'
dbname = 'audioforma'
user = 'postgres'

conn = psycopg2.connect(f"host={host} dbname={dbname} user={user}")
cur = conn.cursor()

songs = pd.read_csv('songs.csv').iterrows()
for idx, s in songs:
    cur.execute(
        '''
        INSERT INTO song
        (song_title,artist,album,data_name,spotify_id)
        VALUES (%s,%s,%s,%s,%s)
        ''',
    (s.song_title,s.artist,s.album,s.data_name,s.spotify_id))
    conn.commit()

cur.close()
conn.close()
print("yeehaw! songs are loaded into the dataset.")