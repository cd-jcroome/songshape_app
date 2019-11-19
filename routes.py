from flask import Flask, flash, render_template, request, url_for, redirect, jsonify, session 

# from flask_heroku import Heroku

app = Flask(__name__)

app.secret_key = "songShape"

# local postgresql or heroku postgresql 
# app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://localhost/midterm_db'
# heroku = Heroku(app)

# db.init_app(app)

# index route
@app.route('/')
@app.route('/index')
def index():
        return render_template('index.html',title='Home')
# # signup route
# @app.route('/signup', methods=['GET', 'POST'])
# def signup():
#     form = SignupForm()
#     if request.method == 'POST' and form.validate():
#         username = request.form['username']
#         password = request.form['password']
#         existing_user = User.query.filter_by(username=username).first()
#         if existing_user:
#             flash('The username already exists, please pick something different.')
#             return redirect(url_for('signup'))
#         else:
#             user = User(username=username, password=sha256_crypt.hash(password))
#             db.session.add(user)
#             db.session.commit()
#             flash('Welcome to the cool kids club! Let\'s look at some condos.')
#             return redirect(url_for('login'))
#     else:
#         return render_template("signup.html", form=form)

# # login route
# @app.route('/login', methods=['GET', 'POST'])
# def login():
#     form = LoginForm()
#     if request.method == 'POST' and form.validate():
#         username = request.form['username']
#         password = request.form['password']

#         user = User.query.filter_by(username=username).first()

#         if user is None or not sha256_crypt.verify(password, user.password):
#             flash('Invalid username or password')
#             return redirect(url_for('login'))
#         else:
#             session['username'] = username
#             return redirect(url_for('index'))
#     else:
#         return render_template('login.html',title='Login',form=form)
# # logout route
# @app.route('/logout', methods=['POST'])
# def logout():
#     session.clear()
#     return redirect(url_for('index'))

# info route TODO: refactor to detail song view.
# @app.route('/info/<mlsnum>')
# def info(mlsnum):

# # add the rest of the info route here
#     return render_template('info.html',title=listing.mlsnum,listing=listing)



# # load_data route (for D3 vis) TODO:refactor to pull song Data from Github
# @app.route('/load_data',methods=['GET'])
# def load_data():
#     condos_json = {'condos': []}
#     condos = Condo.query.all()
#     for condo in condos:
#         condo_info = condo.__dict__
#         del condo_info['_sa_instance_state']
#         condos_json['condos'].append(condo_info)
#     return jsonify(condos_json)

if __name__ == "__main__":
    app.run(debug=True)
